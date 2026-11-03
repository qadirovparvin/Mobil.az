document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = window.API_URL || window.API_BASE || (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.origin ? `${window.location.origin}/api` : 'http://localhost:5000/api');
    const SOCKET_URL = API_BASE.replace(/\/api\/?$/, '');
    
    const params = new URLSearchParams(window.location.search);
    const sellerId = params.get('sellerId');
    const adId = params.get('adId');

    const token = window.getAuthToken ? window.getAuthToken() : (sessionStorage.getItem('token') || '');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
        alert('Mesajlaşmaq üçün giriş edin!');
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userStr);
    const myId = user.id || user._id;

    // Initialize Socket.io with auth token
    const socket = io(SOCKET_URL, {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('Connected to chat server');
        socket.emit('join_chat', myId);
    });

    const messagesContainer = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (adId && sellerId) {
        loadChatHistory(adId, sellerId);
        loadAdDetails(adId, sellerId);
    } else {
        messagesContainer.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">Söhbət seçilməyib</div>';
    }

    loadConversations();

    // Handle receiving messages dynamically
    socket.on('receive_message', (msg) => {
        // Render if the message belongs to this current chat thread
        const msgSenderId = msg.sender._id || msg.sender;
        const msgAdId = msg.ad._id || msg.ad;
        
        if (msgAdId === adId && (msgSenderId === sellerId || msgSenderId === myId)) {
            appendMessage(msg, msgSenderId === myId);
        }
    });

    async function loadChatHistory(adId, otherUserId) {
        messagesContainer.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);"><i class="fas fa-spinner fa-spin" style="font-size:24px;"></i><br><br>Tarixçə yüklənir...</div>';
        try {
            const res = await fetch(`${API_BASE}/messages/${adId}?with=${otherUserId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            messagesContainer.innerHTML = '';
            if (res.ok && data.messages) {
                if (data.messages.length === 0) {
                    messagesContainer.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);"><i class="fas fa-comments" style="font-size:48px; opacity:0.5; margin-bottom:10px; display:block;"></i>Hələ mesaj yoxdur. İlk mesajı siz yazın!</div>';
                } else {
                    data.messages.forEach(msg => {
                        const msgSenderId = msg.sender._id || msg.sender;
                        const isMine = msgSenderId === myId;
                        appendMessage(msg, isMine);
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            messagesContainer.innerHTML = '<div style="text-align:center; padding:20px;">Tarixçə yüklənə bilmədi</div>';
        }
    }

    async function loadAdDetails(adId, otherUserId) {
        try {
            const res = await fetch(`${API_BASE}/ads/${adId}`);
            if (res.ok) {
                const adData = await res.json();
                document.getElementById('chatAdName').textContent = `${adData.brand || ''} ${adData.modelName || ''} - ${adData.price} AZN`;
                
                // If the other user is the author of the ad
                if (adData.author && adData.author._id === otherUserId) {
                    document.getElementById('chatSellerName').textContent = adData.author.name || adData.author.email || 'Satıcı';
                } else {
                    document.getElementById('chatSellerName').textContent = 'Alıcı';
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    let convPage = 1;
    let isFetchingConv = false;
    let hasMoreConv = true;

    async function loadConversations(page = 1) {
        if (isFetchingConv) return;
        const chatList = document.getElementById('conversationsList');
        if (!chatList) return;
        
        isFetchingConv = true;
        
        if (page === 1) {
            chatList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Yüklənir...</div>';
            convPage = 1;
            hasMoreConv = true;
        } else {
            const loader = document.createElement('div');
            loader.id = 'conv-loader';
            loader.style.cssText = "padding: 10px; text-align: center; color: var(--text-muted);";
            loader.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            chatList.appendChild(loader);
        }
        
        try {
            const response = await fetch(`${API_BASE}/messages/conversations?page=${page}&limit=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Söhbətlər yüklənmədi');
            }
            
            if (page === 1) chatList.innerHTML = '';
            else {
                const loader = document.getElementById('conv-loader');
                if (loader) loader.remove();
            }
            
            const arr = data.conversations || [];
            if (arr.length < 50) hasMoreConv = false;
            
            if (page === 1 && arr.length === 0) {
                chatList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Mesaj qutunuz boşdur.</div>';
                isFetchingConv = false;
                return;
            }
            
            arr.forEach(conv => {
                const ad = conv.lastMessage?.ad || {};
                const other = conv._id.other;
                const otherUser = (conv.lastMessage?.sender?._id === other) ? conv.lastMessage?.sender : conv.lastMessage?.recipient;
                
                const otherName = otherUser ? (otherUser.name || otherUser.email || 'İstifadəçi') : 'İstifadəçi';
                const adTitle = ad.brand ? `${ad.brand} ${ad.modelName || ''}` : 'Elan';
                
                const item = document.createElement('div');
                item.style.padding = '15px';
                item.style.borderBottom = '1px solid var(--border-color)';
                item.style.cursor = 'pointer';
                item.style.transition = 'background 0.2s';
                
                const isActive = (other === sellerId && ad._id === adId);
                
                if (isActive) {
                    item.style.background = 'var(--bg-secondary)';
                    item.style.borderLeft = '3px solid var(--airy-primary)';
                } else {
                    item.onmouseover = () => item.style.background = 'var(--bg-secondary)';
                    item.onmouseout = () => item.style.background = 'transparent';
                }
                
                item.innerHTML = `
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <img src="${otherUser?.avatar || 'Photo/avatar.png'}" alt="${escapeHtml(otherName)} profil şəkli" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);">
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600; font-size: 14px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(otherName)}</div>
                            <div style="font-size: 12px; color: var(--airy-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">${escapeHtml(adTitle)}</div>
                            <div style="font-size: 13px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(conv.lastMessage?.text || '')}</div>
                        </div>
                        ${conv.unread > 0 ? `<div style="background: var(--airy-primary); color: white; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 12px;">${conv.unread}</div>` : ''}
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    window.location.href = `chat.html?adId=${conv._id.ad}&sellerId=${other}`;
                });
                
                chatList.appendChild(item);
            });
            
            if (hasMoreConv) {
                const sentinel = document.createElement('div');
                sentinel.style.height = '1px';
                chatList.appendChild(sentinel);
                const convObserver = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting && hasMoreConv) {
                        convObserver.disconnect();
                        sentinel.remove();
                        convPage++;
                        loadConversations(convPage);
                    }
                });
                convObserver.observe(sentinel);
            }
            
        } catch (error) {
            console.error('Error fetching conversations:', error);
            if (page === 1) {
                chatList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Xəta baş verdi</div>';
            }
        } finally {
            isFetchingConv = false;
        }
    }

    const observer = new MutationObserver((mutations) => {
        let shouldScroll = false;
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) shouldScroll = true;
        });
        if (shouldScroll) {
            // Scroll logic: if near bottom, auto scroll
            const threshold = 100;
            const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < threshold;
            
            // We always want to scroll down when we send a message ourselves.
            // Check if the last message is sent by us
            const lastMessage = messagesContainer.lastElementChild;
            const isMine = lastMessage && lastMessage.classList.contains('sent');
            
            if (isMine || isNearBottom) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } else if (!isMine) {
                // Show new message indicator if not near bottom
                let indicator = document.getElementById('new-msg-indicator');
                if (!indicator) {
                    indicator = document.createElement('button');
                    indicator.id = 'new-msg-indicator';
                    indicator.className = 'btn-primary';
                    indicator.style.position = 'absolute';
                    indicator.style.bottom = '80px';
                    indicator.style.right = '20px';
                    indicator.style.zIndex = '100';
                    indicator.style.padding = '8px 12px';
                    indicator.style.borderRadius = '20px';
                    indicator.innerHTML = '<i class="fas fa-arrow-down"></i> Yeni mesaj';
                    indicator.addEventListener('click', () => {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        indicator.remove();
                    });
                    document.querySelector('.chat-main').appendChild(indicator);
                }
            }
        }
    });
    observer.observe(messagesContainer, { childList: true });

    messagesContainer.addEventListener('scroll', () => {
        const threshold = 100;
        const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < threshold;
        if (isNearBottom) {
            const indicator = document.getElementById('new-msg-indicator');
            if (indicator) indicator.remove();
        }
    });

    function appendMessage(msg, isMine) {
        // Clear empty state if it exists
        if (messagesContainer.innerHTML.includes('fa-comments') || messagesContainer.innerHTML.includes('fa-spinner')) {
            messagesContainer.innerHTML = '';
        }
        const div = document.createElement('div');
        div.className = `message ${isMine ? 'sent' : 'received'}`;
        div.textContent = msg.text;
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    sendBtn.addEventListener('click', () => {
        const text = messageInput.value.trim();
        if (!text) return;
        
        if (!adId || !sellerId) {
            alert("Söhbət xətası: Alıcı tapılmadı");
            return;
        }

        const msgObj = {
            text,
            sender: myId,
            ad: adId,
            recipient: sellerId
        };
        
        socket.emit('send_message', msgObj);
        messageInput.value = '';
    });

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendBtn.click();
    });
});

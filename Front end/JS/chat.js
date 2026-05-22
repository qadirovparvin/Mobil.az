document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = window.API_URL || 'http://localhost:5000/api';
    const SOCKET_URL = window.API_URL ? window.API_URL.replace('/api', '') : 'http://localhost:5000';
    
    const params = new URLSearchParams(window.location.search);
    const sellerId = params.get('sellerId');
    const adId = params.get('adId');

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
        alert('Mesajlaşmaq üçün giriş edin!');
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userStr);
    const myId = user.id || user._id;

    // Initialize Socket.io
    const socket = io(SOCKET_URL);

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
        try {
            const res = await fetch(`${API_BASE}/messages/${adId}?with=${otherUserId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            messagesContainer.innerHTML = '';
            if (res.ok && data.messages) {
                data.messages.forEach(msg => {
                    const msgSenderId = msg.sender._id || msg.sender;
                    const isMine = msgSenderId === myId;
                    appendMessage(msg, isMine);
                });
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

    function appendMessage(msg, isMine) {
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

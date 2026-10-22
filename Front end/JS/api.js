/**
 * Mobil.az — Centralized API Client & Axios Interceptor
 * 
 * Features:
 * - Axios instance configured with baseURL and withCredentials: true (HTTP-only cookies).
 * - Automatic Authorization Bearer token attachment on requests.
 * - Automatic 401 interceptor that calls /api/auth/refresh to rotate tokens and retry failed requests.
 * - Concurrency queue to prevent multiple simultaneous refresh calls.
 * - Window.fetch integration to ensure native fetch calls (e.g., in auth.js) also refresh on 401.
 */

(function (global) {
    'use strict';

    // 1. Resolve API Base URL
    function getApiBase() {
        if (typeof window !== 'undefined' && (window.API_URL || window.API_BASE)) {
            return (window.API_URL || window.API_BASE).replace(/\/+$/, '');
        }
        return 'http://localhost:5000/api';
    }

    // 2. Token Helpers
    function getAccessToken() {
        if (typeof global.getToken === 'function') {
            const t = global.getToken();
            if (t) return t;
        }
        try {
            const storages = [
                typeof localStorage !== 'undefined' ? localStorage : null,
                typeof sessionStorage !== 'undefined' ? sessionStorage : null
            ].filter(Boolean);

            const keys = ['token', 'accessToken', 'authToken'];
            for (const store of storages) {
                for (const k of keys) {
                    let v = store.getItem(k);
                    if (v && v !== 'null' && v !== 'undefined' && v.length > 30) {
                        return v.trim().replace(/^["']+|["']+$/g, '');
                    }
                }
            }
        } catch (e) {}
        return '';
    }

    function hasRequestAccessToken(headers) {
        if (getAccessToken()) return true;
        if (!headers) return false;
        const authorization = typeof headers.get === 'function'
            ? headers.get('Authorization')
            : (headers.Authorization || headers.authorization);
        return typeof authorization === 'string' && /^Bearer\s+\S+/i.test(authorization);
    }

    function redirectAfterRefreshFailure() {
        if (typeof global.clearAuthSession === 'function') {
            global.clearAuthSession();
        }
        const path = global.location && global.location.pathname ? global.location.pathname : '';
        if (global.location && !/\/(login|signup)\.html$/i.test(path)) {
            global.location.href = 'login.html?expired=1';
        }
    }

    function saveAccessToken(token, user) {
        if (!token) return;
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('token', token);
                localStorage.setItem('accessToken', token);
                if (user) {
                    localStorage.setItem('user', typeof user === 'string' ? user : JSON.stringify(user));
                    localStorage.setItem('mobilaz_current_user', typeof user === 'string' ? user : JSON.stringify(user));
                }
            }
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('token', token);
                sessionStorage.setItem('accessToken', token);
                if (user) {
                    sessionStorage.setItem('user', typeof user === 'string' ? user : JSON.stringify(user));
                    sessionStorage.setItem('mobilaz_current_user', typeof user === 'string' ? user : JSON.stringify(user));
                }
            }
        } catch (e) {}
    }

    // 3. Centralized Refresh Token Logic
    let isRefreshing = false;
    let failedQueue = [];

    function processQueue(error, token) {
        failedQueue.forEach(function (prom) {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve(token);
            }
        });
        failedQueue = [];
    }

    // 4. Resolve or initialize Axios
    let axiosLib = null;
    if (typeof global.axios !== 'undefined') {
        axiosLib = global.axios;
    } else if (typeof axios !== 'undefined') {
        axiosLib = axios;
    } else if (typeof require === 'function') {
        try {
            axiosLib = require('axios');
        } catch (e) {
            try {
                axiosLib = require('../../Backend/node_modules/axios');
            } catch (e2) {}
        }
    }

    async function refreshAccessToken() {
        const refreshUrl = getApiBase() + '/auth/refresh';
        let data;

        if (axiosLib && typeof axiosLib.post === 'function') {
            const extraHeaders = {};
            if (apiInstance && apiInstance.defaults && apiInstance.defaults.headers && apiInstance.defaults.headers.common) {
                if (apiInstance.defaults.headers.common['Cookie']) {
                    extraHeaders['Cookie'] = apiInstance.defaults.headers.common['Cookie'];
                }
                if (apiInstance.defaults.headers.common['Origin']) {
                    extraHeaders['Origin'] = apiInstance.defaults.headers.common['Origin'];
                }
            }
            const res = await axiosLib.post(refreshUrl, {}, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                    ...extraHeaders
                }
            });
            data = res.data;
        } else if (typeof global.fetch === 'function' || typeof fetch === 'function') {
            const fetchFn = global.originalFetch || global.fetch || fetch;
            const res = await fetchFn(refreshUrl, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                const err = new Error(errBody.message || 'Refresh token failed');
                err.status = res.status;
                throw err;
            }
            data = await res.json();
        } else {
            throw new Error('No HTTP transport available (axios or fetch)');
        }

        const newToken = data.accessToken || data.token;
        if (!newToken) {
            throw new Error('No access token returned from refresh');
        }

        saveAccessToken(newToken, data.user);

        if (apiInstance && apiInstance.defaults && apiInstance.defaults.headers) {
            apiInstance.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        }

        return newToken;
    }

    let apiInstance = null;

    if (axiosLib && typeof axiosLib.create === 'function') {
        apiInstance = axiosLib.create({
            baseURL: getApiBase(),
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Request Interceptor: Attach Token & CSRF
        apiInstance.interceptors.request.use(
            function (config) {
                config.withCredentials = true;
                const token = getAccessToken();
                if (token && (!config.headers || !config.headers['Authorization'] && !config.headers['authorization'])) {
                    config.headers = config.headers || {};
                    config.headers['Authorization'] = 'Bearer ' + token;
                }
                const csrf = (typeof window !== 'undefined') ? (window.CSRF_TOKEN || localStorage.getItem('csrfToken') || sessionStorage.getItem('csrfToken')) : null;
                if (csrf && !config.headers['X-CSRF-Token']) {
                    config.headers['X-CSRF-Token'] = csrf;
                }
                return config;
            },
            function (error) {
                return Promise.reject(error);
            }
        );

        // Response Interceptor: Handle 401 and refresh
        apiInstance.interceptors.response.use(
            function (response) {
                return response;
            },
            async function (error) {
                const originalRequest = error.config;
                if (!originalRequest) {
                    return Promise.reject(error);
                }

                const status = error.response ? error.response.status : null;
                const url = String(originalRequest.url || '');

                const isAuthUrl = url.includes('/auth/login') ||
                                  url.includes('/auth/register') ||
                                  url.includes('/auth/refresh') ||
                                  url.includes('/auth/refresh-token');

                if (status === 401 && (url.includes('/auth/refresh') || url.includes('/auth/refresh-token'))) {
                    return Promise.reject(error);
                }

                if (status === 401 && !hasRequestAccessToken(originalRequest.headers)) {
                    return Promise.reject(error);
                }

                if (status === 401 && !originalRequest._retry && !isAuthUrl) {
                    originalRequest._retry = true;
                    if (isRefreshing) {
                        return new Promise(function (resolve, reject) {
                            failedQueue.push({ resolve, reject });
                        }).then(function (newToken) {
                            originalRequest.headers = originalRequest.headers || {};
                            originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
                            return apiInstance(originalRequest);
                        }).catch(function (err) {
                            return Promise.reject(err);
                        });
                    }

                    isRefreshing = true;

                    let newToken;
                    try {
                        newToken = await refreshAccessToken();
                        processQueue(null, newToken);
                    } catch (refreshErr) {
                        processQueue(refreshErr, null);
                        redirectAfterRefreshFailure();
                        return Promise.reject(refreshErr);
                    } finally {
                        isRefreshing = false;
                    }

                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
                    try {
                        return await apiInstance(originalRequest);
                    } catch (retryErr) {
                        if (retryErr.response && retryErr.response.status === 401) {
                            redirectAfterRefreshFailure();
                        }
                        return Promise.reject(retryErr);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    // 5. Native fetch 401 Interceptor integration
    // This guarantees that any existing code calling fetch() (such as loadNotifications() in auth.js)
    // automatically refreshes on 401 and retries transparently!
    if (typeof global.fetch === 'function') {
        const nativeFetch = global.fetch;
        if (!global.originalFetch) {
            global.originalFetch = nativeFetch;
        }

        global.fetch = async function interceptedFetch(input, init) {
            init = init || {};
            const url = typeof input === 'string' ? input : (input && input.url ? input.url : '');

            // Don't intercept refresh itself or non-API calls
            const isRefreshCall = url.includes('/auth/refresh') || url.includes('/auth/refresh-token');
            const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register') || isRefreshCall;
            const isApi = url.includes('/api/') || (typeof window !== 'undefined' && window.API_URL && url.startsWith(window.API_URL));

            if (!isApi || isAuthCall || init._isRetry) {
                return nativeFetch(input, init);
            }

            // Ensure credentials are included so cookies pass
            if (!init.credentials) {
                init.credentials = 'include';
            }

            const response = await nativeFetch(input, init);

            const requestHeaders = init.headers || (typeof input !== 'string' && input ? input.headers : undefined);
            if (response.status === 401 && !init._isRetry && hasRequestAccessToken(requestHeaders)) {
                let newToken;
                try {
                    if (isRefreshing) {
                        newToken = await new Promise(function (resolve, reject) {
                            failedQueue.push({ resolve, reject });
                        });
                    } else {
                        isRefreshing = true;
                        try {
                            newToken = await refreshAccessToken();
                            processQueue(null, newToken);
                        } catch (refErr) {
                            processQueue(refErr, null);
                            throw refErr;
                        } finally {
                            isRefreshing = false;
                        }
                    }

                } catch (e) {
                    // Refresh failed, return original 401
                    redirectAfterRefreshFailure();
                    return response;
                }

                const nextInit = { ...init, _isRetry: true };
                const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined) || {});
                headers.set('Authorization', 'Bearer ' + newToken);
                nextInit.headers = headers;

                const retryResponse = await nativeFetch(input, nextInit);
                if (retryResponse.status === 401) {
                    redirectAfterRefreshFailure();
                }
                return retryResponse;
            }

            return response;
        };
    }

    // 6. Global Exports
    const apiModule = {
        api: apiInstance,
        apiClient: apiInstance,
        axios: axiosLib,
        refreshAccessToken: refreshAccessToken,
        getAccessToken: getAccessToken,
        saveAccessToken: saveAccessToken
    };

    if (typeof global !== 'undefined') {
        global.api = apiInstance;
        global.apiClient = apiInstance;
        global.refreshAccessToken = refreshAccessToken;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = apiModule;
    }
})(typeof window !== 'undefined' ? window : globalThis);

const CACHE_NAME = 'gomoku-v1';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './game.js',
    './ai.js',
    './app.js',
    './manifest.json',
    './icon.svg',
    './icon-192.png',
    './icon-512.png'
];

// 安装Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => {
                return self.clients.claim();
            })
    );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 如果缓存中有，直接返回
                if (response) {
                    return response;
                }

                // 否则尝试网络请求
                return fetch(event.request)
                    .then((response) => {
                        // 检查是否是有效响应
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 克隆响应（因为响应流只能使用一次）
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // 网络失败时，返回离线页面（如果有的话）
                        return caches.match('/index.html');
                    });
            })
    );
});

const CACHE_NAME = 'pokechill-calc-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
];

// 安装：预缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// 请求拦截：优先缓存，离线回退
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // 对 Tesseract 语言包等大文件使用缓存优先
  if (event.request.url.includes('tessdata') || event.request.url.includes('worker.min.js')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // 其他资源：网络优先，失败回退缓存
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then(cached => cached || caches.match('./index.html'))
    )
  );
});
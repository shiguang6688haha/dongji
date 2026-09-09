/* 董记 Service Worker */
const VER = 'dongji-v3';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './js/icons.js',
  './js/store.js',
  './js/stats.js',
  './js/sound.js',
  './js/ui-record.js',
  './js/ui-calendar.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VER)
      .then((c) => c.addAll(SHELL).catch(() => null))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== VER).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 导航请求：network-first + 离线回退（避免 index.html 被强缓存导致永不更新）
  // 关键：只在响应 ok 时才写缓存。否则 401/403/502 这类错误页会被缓存下来，
  // 之后即使恢复网络也一直白屏（托管方访问鉴权过期时尤其致命）。
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cached = () =>
        (await caches.match('./index.html')) || caches.match('./');
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) {
          const c = await caches.open(VER);
          c.put('./index.html', fresh.clone());
          return fresh;
        }
        // 401 等非成功响应：不缓存，直接回退到已缓存版本
        return await cached();
      } catch (err) {
        return await cached();
      }
    })());
    return;
  }

  // 其它同源资源：stale-while-revalidate
  e.respondWith((async () => {
    const c = await caches.open(VER);
    const hit = await c.match(req);
    const net = fetch(req)
      .then((r) => {
        if (r && r.ok) c.put(req, r.clone());
        return r;
      })
      .catch(() => hit);
    return hit || net;
  })());
});

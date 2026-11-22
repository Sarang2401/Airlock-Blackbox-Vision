const scope = self.registration.scope;
const cachePrefix = `escrowhealth-shell:${scope}:`;
const cacheName = cachePrefix + VERSION;
const home = new URL('index.html', scope).href;
const assets = new Set(ASSETS.map((asset) => new URL(asset, scope).href));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) =>
    cache.addAll([...assets].map((asset) => new Request(asset, { cache: 'reload' })))
  ));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => key.startsWith(cachePrefix) && key !== cacheName)
    .map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate' && (request.url === scope || request.url === home)) {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(cacheName);
      return await cache.match(home, { ignoreVary: true }) ?? Response.error();
    }));
  } else if (assets.has(request.url)) {
    // Every entry here is a versioned, same-origin public asset. Browser
    // font and module requests can add Origin to a response with Vary: Origin.
    event.respondWith(caches.open(cacheName).then(async (cache) =>
      await cache.match(request.url, { ignoreVary: true }) ?? fetch(request)
    ));
  }
});

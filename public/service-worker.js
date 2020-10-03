const CACHE_NAME = "static-cache-v2"; // For static files. 
const DATA_CACHE_NAME = "data-cache-v1"; // Cache for all trasnactions on server.

const FILES_TO_CACHE = [
  "/",
  "/manifest.webmanifest",
  "/styles.css",
  "/index.js"
];

// install
self.addEventListener("install", function (evt) {
  // pre cache image data
  evt.waitUntil(
    caches.open(DATA_CACHE_NAME).then((cache) => cache.add("/api/transaction"))
  );
    
  // pre cache all static assets
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  ); // ???ASK PHIL??? cashes keyword is refering to the webrowser cache tool?

  // tell the browser to activate this service worker immediately once it
  // has finished installing
  self.skipWaiting();
});

// activate
// ???ASK PHIL. not sure what lines 38-40 do. Clears cache to get ready for the fetch?
self.addEventListener("activate", function(evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetch
self.addEventListener("fetch", function(evt) {
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(evt.request);
          });
      }).catch(err => console.log(err))
    );

    return;
  }

  evt.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(evt.request).then(response => {
        return response || fetch(evt.request);
      });
    })
  );
});

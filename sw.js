// Service Worker — cache dla trybu offline
const CACHE_NAME = "leszczyk-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/main.js",
  "./manifest.json",
  "./odra-miejscowki.json",
  "./data/ryby.json",
  "./data/przynety.json",
  "./img/guma.jpg",
  "./img/wobler.jpg",
  "./img/obrotowka.jpg",
  "./img/wahadlowka.jpg",
  "./img/ryba-szczupak.jpg",
  "./img/ryba-sandacz.jpg",
  "./img/ryba-okon.jpg",
  "./img/ryba-bolen.jpg",
  "./img/ryba-sum.jpg",
  "./img/ryba-klen.jpg",
  "./img/ryba-jaz.jpg"
];

// Instalacja — cache podstawowych zasobów
self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(CORE_ASSETS);
    }).then(function(){ return self.skipWaiting(); })
  );
});

// Aktywacja — usuń stare cache
self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// Fetch — najpierw cache, potem sieć (offline-first dla zasobów lokalnych)
self.addEventListener("fetch", function(e){
  const url = new URL(e.request.url);
  // Nie cache'uj zewnętrznych (CDN, mapy, API)
  if(url.origin !== self.location.origin){
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        // Cache tylko udane odpowiedzi GET
        if(response && response.status === 200 && e.request.method === "GET"){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, clone); });
        }
        return response;
      }).catch(function(){
        // Fallback offline dla nawigacji
        if(e.request.mode === "navigate"){
          return caches.match("./index.html");
        }
      });
    })
  );
});

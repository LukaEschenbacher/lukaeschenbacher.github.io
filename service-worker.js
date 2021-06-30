const CACHE_NAME_FOOD = 'food-cache';
const CACHE_NAME_LOCATIONS = 'locations-cache';
const CACHE_NAME_APP = 'general-cache';

let urlsApp = [
    'manifest.webmanifest',
    //images
    'images/sun.png',
    'images/water.jpg',
    'images/android-icon-36x36.png',
    'images/android-icon-48x48.png',
    'images/android-icon-72x72.png',
    'images/android-icon-96x96.png',
    'images/android-icon-144x144.png',
    'images/android-icon-192x192.png',
    'images/favicon-16x16.png',
    'images/favicon-32x32.png',
    'images/favicon-96x96.png',
    //html
    'offline.html',
    //css, js
    'js/materialize.min.js',
    'js/navbar.js',
    'css/materialize.min.css',
    '/style.css',
    'script.js',
    'js/http_code.jquery.com_jquery-3.6.0.js',
    'js/http_button.glitch.me_button.js'
]

let urlsLocations = [
    'index.html',
    'images/summer1.jpg',
    'images/summer2.jpg',
    'images/summer3.jpg',
    'images/summer4.jpg'
]

let urlsFood = [
    'food.html',
    'images/icecream.jpg',
    'images/salad.jpg',
    'images/lemonade.jpg',
    'images/watermelon.jpg'
]

let myCaches = [
    {
        cacheName: CACHE_NAME_APP,
        urlsToCache: urlsApp
    },
   /* {
        cacheName: CACHE_NAME_LOCATIONS,
        urlsToCache: urlsLocations
    },*/
    {
        cacheName: CACHE_NAME_FOOD,
        urlsToCache: urlsFood
    }
]

// is called after SW was registered
self.addEventListener('install', function (event) {
    console.log('[ServiceWorker] installed');


    //perform install steps
    event.waitUntil(Promise.all(
        myCaches.map(function (myCache) {
                return caches.open(myCache.cacheName).then(function (cache) {
                    console.log("opened " + myCache.cacheName);
                    return cache.addAll(myCache.urlsToCache);
                })
            }
        )
    ))
    //const cache = await caches.open(CACHE1_NAME);
    // Setting {cache: 'reload'} in the new request will ensure that the response
    // isn't fulfilled from the HTTP cache; i.e., it will be from the network.
    //await cache.add(new Request(OFFLINE_URL, {cache: 'reload'}));
    //})());
    //self.skipWaiting();
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    /*event.waitUntil((async () => {
        // Enable navigation preload if it's supported.
        // See https://developers.google.com/web/updates/2017/02/navigation-preload
        if ('navigationPreload' in self.registration) {
            await self.registration.navigationPreload.enable();
        }
    })());*/

    // Tell the active service worker to take control of the page immediately.
    event.waitUntil(clients.claim());
});

// is called after HTTP request
self.addEventListener('fetch', function (event) {
    console.log('[Service Worker] Fetch', event.request.url);

    //determine type
    let urlLocations = false;
    for (const url of urlsLocations) {
        if (event.request.url.indexOf(url) !== -1) {
            console.log("found location url: " + event.request.url);
            urlLocations = true;
            break;
        }
    }
    let urlFood = false;
    for (const url of urlsFood) {
        if (event.request.url.indexOf(url) !== -1) {
            console.log("found food url: " + event.request.url);
            urlFood = true;
            break;
        }
    }

    if (urlLocations) {
        //try network first
        console.log("fetch from server: ", event.request.url);
        event.respondWith(
            fetch(event.request).catch(function () {
                console.log("fetch offline page from cache: ", event.request.url);
               return caches.match('offline.html');
            }))
    } else {
        //try cache first (in general)
        console.log("try cache: ", event.request.url);
        event.respondWith(
            caches.match(event.request).catch(function () {
                if (urlFood) {
                    console.log("fetch offline page from cache: ", event.request.url);
                    return caches.match('offline.html');
                } else {
                    console.log("fallback to network: ", event.request.url);
                    fetch(event.request).then(
                        function (response) {
                            // Check if we received a valid response
                            if (!response) {
                                console.error("fetch eventhandler error 1: no response");
                                return Response.error();
                            }
                            if (response.status !== 200 && response.status !== 201) { // || response.type !== 'basic'
                                console.warn("fetch eventhandler error 1: bad response", response.status, response.type);
                                return response;
                            }
                            // we received a valid response
                            // Caching
                            // IMPORTANT: Clone the response. A response is a stream
                            // and because we want the browser to consume the response
                            // as well as the cache consuming the response, we need
                            // to clone it so we have two streams.
                            let responseToCache = response.clone();
                            caches.open(CACHE_NAME_APP)
                                .then(function (cache) {
                                    console.log(`cached ${event.request.url}`);
                                    cache.put(event.request, responseToCache).then(function () {
                                    });
                                });
                            return response;
                        }, function (err_response) {
                            console.error("fetch eventhandler:", err_response);
                            return Response.error();
                        }
                    )
                }
            })
        )
    }
});

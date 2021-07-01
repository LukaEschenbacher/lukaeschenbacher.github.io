const CACHE_NAME_FOOD = 'food-cache';
const CACHE_NAME_APP = 'general-cache';
const CACHE_NAME_OFFLINE = 'offline-cache';
let version = 3.9;

let urlsApp = [
    'manifest.webmanifest',
    //images
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
    //css, js
    'js/materialize.min.js',
    'js/navbar.js',
    'css/materialize.min.css',
    'style.css',
    'script.js',
    'js/http_code.jquery.com_jquery-3.6.0.js',
    'js/http_button.glitch.me_button.js'
]

let urlsOffline = [
    'offline.html'
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
    {
        cacheName: CACHE_NAME_OFFLINE,
        urlsToCache: urlsOffline
    },
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
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    console.log(`ServiceWorker activated at ${new Date().toLocaleTimeString()}`);

    // caches die nicht gelöscht werden sollen hier einfügen
    //caches that should not be deleted
    let cacheWhitelist = [CACHE_NAME_OFFLINE, CACHE_NAME_FOOD];

    //delete caches of previous versions
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log("deleting old cache " + cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

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
            caches.match(event.request).then(function (cacheResponse) {
                    if (cacheResponse) {
                        return cacheResponse;
                    }

                    // error handling for Chromium dev tools, see
                    // https://stackoverflow.com/questions/48463483/what-causes-a-failed-to-execute-fetch-on-serviceworkerglobalscope-only-if
                    if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
                        return;
                    }

                    if (urlFood) {
                        console.log("fetch offline page from cache: ", event.request.url);
                        return caches.match('offline.html');
                    }

                    console.log("fallback to network: ", event.request.url);

                    // IMPORTANT: Clone the request. A request is a stream and
                    // can only be consumed once. Since we are consuming this
                    // once by cache and once by the browser for fetch, we need
                    // to clone the response.
                    let fetchRequest = event.request.clone();
                    return fetch(fetchRequest).then(
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
            )
        )
    }
});

addEventListener('message', event => {
    // event is an ExtendableMessageEvent object
    console.log("Message arrived in SW: ", event.data);
    if (event.data === "get_version") {
        event.source.postMessage({'version': version});
    }
});



/*self.addEventListener('notificationclick', function (event) {
    console.log('On notification click: ', event.notification.tag);
    if (event.notification.tag === 'myNotification') {
        // Assume that all of the resources needed to render
        // /inbox/ have previously been cached, e.g. as part
        // of the install handler.
        new WindowClient();
    }
});*/

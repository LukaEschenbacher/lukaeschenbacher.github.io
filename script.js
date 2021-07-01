const divInstall = document.getElementById('installContainer');
const butInstall = document.getElementById('butInstall');

/* Put code here */
window.addEventListener('beforeinstallprompt', (event) => {
    console.log('👍', 'beforeinstallprompt', event);
    // Stash the event so it can be triggered later.
    window.deferredPrompt = event;
    // Remove the 'hidden' class from the install button container
    divInstall.classList.toggle('hidden', false);
});

butInstall.addEventListener('click', async () => {
    console.log('👍', 'butInstall-clicked');
    const promptEvent = window.deferredPrompt;
    if (!promptEvent) {
        // The deferred prompt isn't available.
        return;
    }
    // Show the install prompt.
    promptEvent.prompt();
    // Log the result
    const result = await promptEvent.userChoice;
    console.log('👍', 'userChoice', result);
    // Reset the deferred prompt variable, since
    // prompt() can only be called once.
    window.deferredPrompt = null;
    // Hide the install button.
    divInstall.classList.toggle('hidden', true);
});

window.addEventListener('appinstalled', (event) => {
    console.log('👍', 'appinstalled', event);
    // Clear the deferredPrompt so it can be garbage collected
    window.deferredPrompt = null;
});


/* Only register a service worker if it's supported */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
}

navigator.serviceWorker.ready.then(registration => {
    registration.active.postMessage("get_info");
});

navigator.serviceWorker.addEventListener('message', event => {
    // event is a MessageEvent object
    console.log("Message Event: ", event.data);
    if (event.data.hasOwnProperty('version')) {
        let version = event.data.version;
        console.log("Version: ", version);
        $("#swVersion").text("SW version: " + version);
    }
    if (event.data.hasOwnProperty('foodcache')) {
        let exists = event.data.foodcache;
        console.log("Food Cache: ", exists);
        if (exists) {
            $("#foodCacheControl").text("Delete Food Cache");
        } else {
            $("#foodCacheControl").text("Populate Food Cache");
        }
    }
});

$("#foodCacheControl").click(function () {
    if ($(this).text() === "Delete Food Cache") {
        navigator.serviceWorker.ready.then(registration => {
            registration.active.postMessage("delete_food_cache");
        });
        $(this).text("Populate Food Cache");
    } else if ($(this).text() === "Populate Food Cache") {
        navigator.serviceWorker.ready.then(registration => {
            registration.active.postMessage("populate_food_cache");
        });
        $(this).text("Delete Food Cache");
    }
});


/**
 * Warn the page must be served over HTTPS
 * The `beforeinstallprompt` event won't fire if the page is served over HTTP.
 * Installability requires a service worker with a fetch event handler, and
 * if the page isn't served over HTTPS, the service worker won't load.
 */
/*
if (window.location.protocol === 'http:') {
    const requireHTTPS = document.getElementById('requireHTTPS');
    const link = requireHTTPS.querySelector('a');
    link.href = window.location.href.replace('http://', 'https://');
    requireHTTPS.classList.remove('hidden');
}*/

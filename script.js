const divInstall = document.getElementById('installContainer');
const butInstall = document.getElementById('butInstall');
const butNotification = document.getElementById('butNotification');

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

butNotification.addEventListener('click', async () => {
    console.log("Notification Button clicked");
    Notification.requestPermission().then(function (result) {
        console.log("result: ", result);
        if (result === 'granted') {
            console.log("permission to show notifications");
            navigator.serviceWorker.ready.then(function (registration) {
                console.log("service worker ready");
                registration.showNotification("Service Worker Ready!", {
                    body: 'Test! Buzz!',
                    vibrate: [200, 100, 200, 100, 200, 100, 200],
                    tag: 'myNotification'
                })
            });
        }
    }).catch(function (result) {
        console.log("test55");
    })
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

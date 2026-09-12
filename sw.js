importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Service Worker para Notificaciones Push de Debt Mate
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Escuchar eventos de notificación locales
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'Debt Mate', body: 'Tienes un pago pendiente pronto.' };
    
    const options = {
        body: data.body,
        icon: 'icon.png',
        badge: 'icon.png',
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});
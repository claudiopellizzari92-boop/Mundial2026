// Service Worker — Quiniela Mundial 2026
// Versión: 2026-06-08-v1
// LIMPIA cachés viejos y toma control inmediato

const SW_VERSION = "2026-06-08-v1";

// Al instalar: limpiar TODOS los cachés anteriores
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          console.log("[SW] Eliminando caché viejo:", cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function () {
      console.log("[SW] Instalado v" + SW_VERSION + " — skipWaiting");
      return self.skipWaiting();
    })
  );
});

// Al activar: tomar control de todos los clientes inmediatamente
self.addEventListener("activate", function (event) {
  event.waitUntil(
    clients.claim().then(function () {
      console.log("[SW] Activo v" + SW_VERSION + " — controlando todos los clientes");
    })
  );
});

// NO interceptar fetch — dejar que la red maneje todo
// Esto evita que cualquier caché corrupto rompa la app en iOS

// Push notifications
self.addEventListener("push", function (event) {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "Quiniela 2026", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Quiniela 2026", {
      body: data.body || "",
      icon: "/logo192.png",
      badge: "/logo192.png",
      tag: data.tag || "quiniela",
      renotify: true,
      data: { url: "https://mundial2026-plum.vercel.app" },
    })
  );
});

// Notification click
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url =
    event.notification.data?.url || "https://mundial2026-plum.vercel.app";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (const client of clientList) {
          if (client.url.includes("mundial2026") && "focus" in client)
            return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});

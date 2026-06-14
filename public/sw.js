// Service Worker — Quiniela Mundial 2026
// Versión: 2026-06-14-v2
// LIMPIA cachés viejos y toma control inmediato
const SW_VERSION = "2026-06-14-v2";

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

// Push notifications
self.addEventListener("push", function (event) {
  if (!event.data) return;

  let raw = {};
  try {
    raw = event.data.json();
  } catch (e) {
    raw = {};
  }

  // FCM puede entregar el contenido en distintos lugares según el tipo de mensaje.
  // Buscamos título/cuerpo en todas las ubicaciones posibles, en orden de prioridad.
  const n = raw.notification || {};
  const webpushN = (raw.webpush && raw.webpush.notification) || {};
  const d = raw.data || {};

  const title =
    raw.title || n.title || webpushN.title || d.title || "Quiniela 2026";
  const body =
    raw.body || n.body || webpushN.body || d.body || "";
  const tag =
    raw.tag || webpushN.tag || n.tag || d.tag || "quiniela";

  // Si no hay texto en absoluto, intentar como texto plano
  const finalBody = body || (event.data.text ? event.data.text() : "");

  event.waitUntil(
    self.registration.showNotification(title, {
      body: finalBody,
      icon: "/logo192.png",
      badge: "/logo192.png",
      tag: tag,
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

// Service Worker — Quiniela Mundial 2026
// public/sw.js

self.addEventListener("push", function(event) {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch(e) { data = { title: "Quiniela 2026", body: event.data.text() }; }
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

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  const url = event.notification.data?.url || "https://mundial2026-plum.vercel.app";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes("mundial2026") && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener("install", function() { self.skipWaiting(); });
self.addEventListener("activate", function(event) { event.waitUntil(clients.claim()); });

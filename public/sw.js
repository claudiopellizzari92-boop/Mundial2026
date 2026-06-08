// Service Worker — Quiniela Mundial 2026
// public/sw.js

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAWTaWlboBH-oZ0mdrpm1-DcOT329Nijd4",
  authDomain: "quiniela-2026-8e03c.firebaseapp.com",
  projectId: "quiniela-2026-8e03c",
  storageBucket: "quiniela-2026-8e03c.firebasestorage.app",
  messagingSenderId: "1033273841478",
  appId: "1:1033273841478:web:462aec25e01fc44bd2f747",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, tag } = payload.notification || {};
  self.registration.showNotification(title || "Quiniela 2026", {
    body: body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: tag || "quiniela",
    renotify: true,
    data: { url: "https://mundial2026-plum.vercel.app" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "https://mundial2026-plum.vercel.app";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("mundial2026") && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

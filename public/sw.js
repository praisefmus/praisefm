self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.artist ? `${data.title} — ${data.artist}` : data.title,
    icon: '/icon-192x192.webp',
    badge: '/icon-192x192.webp',
    sound: 'default'
  };
  event.waitUntil(
    self.registration.showNotification(data.station || 'Praise FM U.S.', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://praisefm.vercel.app/')
  );
});

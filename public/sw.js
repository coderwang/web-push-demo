self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

// ---- 接收推送 ----

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: '新消息', body: event.data?.text() || '' };
  }

  const title = data.title || '新通知';
  const options = {
    body: data.body || '',
    icon: data.icon,
    badge: data.badge,
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction ?? false,
    silent: data.silent ?? false,
    tag: data.tag || 'web-push-notification',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ---- 通知交互 ----

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ('focus' in client) return client.focus();
        }
        return clients.openWindow(event.notification.data?.url || '/');
      })
  );
});

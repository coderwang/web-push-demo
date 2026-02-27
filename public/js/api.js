export async function fetchVapidPublicKey() {
  const res = await fetch('/vapid-public-key');
  if (!res.ok) throw new Error('获取 VAPID 公钥失败');
  return res.text();
}

export async function saveSubscription(subscription) {
  const res = await fetch('/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });
  if (!res.ok) throw new Error('保存订阅失败');
  return res.json();
}

export async function removeSubscription(endpoint) {
  const res = await fetch('/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  });
  if (!res.ok) throw new Error('取消订阅失败');
  return res.json();
}

export async function sendTestNotification(payload) {
  const res = await fetch('/send-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '推送失败');
  return data;
}

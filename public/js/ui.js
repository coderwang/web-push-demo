const statusEl = document.getElementById('status');
const subscribeBtn = document.getElementById('subscribeBtn');
const unsubscribeBtn = document.getElementById('unsubscribeBtn');
const testBtn = document.getElementById('testBtn');
const subscriptionInfoEl = document.getElementById('subscriptionInfo');

export function updateStatus(text, className) {
  statusEl.textContent = text;
  statusEl.className = `status ${className}`;
}

export function showSubscribed(subscription) {
  updateStatus('✅ 已订阅推送通知！关闭页面也能收到消息', 'subscribed');
  showSubscriptionInfo(subscription);
  subscribeBtn.disabled = true;
  unsubscribeBtn.disabled = false;
  testBtn.disabled = false;
}

export function showUnsubscribed() {
  updateStatus('🔔 未订阅推送通知，点击下方按钮开始订阅', 'unsubscribed');
  subscriptionInfoEl.textContent = '-';
  subscribeBtn.disabled = false;
  subscribeBtn.textContent = '🔔 订阅通知';
  unsubscribeBtn.disabled = true;
  testBtn.disabled = true;
}

export function setTestBtnLoading(loading) {
  testBtn.disabled = loading;
  testBtn.textContent = loading ? '⏳ 发送中...' : '📨 测试推送';
}

export function bindEvents({ onSubscribe, onUnsubscribe, onTest }) {
  subscribeBtn.addEventListener('click', onSubscribe);
  unsubscribeBtn.addEventListener('click', onUnsubscribe);
  testBtn.addEventListener('click', onTest);
}

function showSubscriptionInfo(sub) {
  const info = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.getKey('p256dh') ? '✓' : '✗',
      auth: sub.getKey('auth') ? '✓' : '✗',
    },
  };
  subscriptionInfoEl.textContent = JSON.stringify(info, null, 2);
}

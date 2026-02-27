import * as api from './api.js';
import * as ui from './ui.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// ---- 推送订阅 ----

async function subscribePush() {
  try {
    ui.updateStatus('⏳ 正在订阅...', 'loading');

    const reg = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      ui.updateStatus('❌ 需要授予通知权限才能订阅', 'unsubscribed');
      return;
    }

    const vapidKey = await api.fetchVapidPublicKey();
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    await api.saveSubscription(subscription);
    ui.showSubscribed(subscription);
  } catch (err) {
    console.error('订阅失败:', err);
    ui.updateStatus(`❌ 订阅失败: ${err.message}`, 'unsubscribed');
  }
}

async function unsubscribePush() {
  try {
    ui.updateStatus('⏳ 正在取消订阅...', 'loading');

    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await api.removeSubscription(subscription.endpoint);
    }

    ui.showUnsubscribed();
    ui.updateStatus('🔔 已取消订阅', 'unsubscribed');
  } catch (err) {
    console.error('取消订阅失败:', err);
    ui.updateStatus(`❌ 取消订阅失败: ${err.message}`, 'subscribed');
  }
}

// ---- 测试推送 ----

async function testPush() {
  try {
    ui.setTestBtnLoading(true);
    await api.sendTestNotification({
      title: '🎉 测试通知',
      body: '恭喜！您已成功配置 Web Push！\n即使关闭页面也能收到消息！',
      icon: '/icon.png',
    });
    alert('✅ 推送已发送！请查看桌面通知');
  } catch (err) {
    console.error('推送失败:', err);
    alert(`❌ 推送失败: ${err.message}`);
  } finally {
    ui.setTestBtnLoading(false);
  }
}

// ---- 初始化 ----

async function init() {
  ui.updateStatus('🔍 检测浏览器环境...', 'loading');

  if (!('serviceWorker' in navigator)) {
    ui.updateStatus('❌ 浏览器不支持 Service Worker', 'unsubscribed');
    return;
  }
  if (Notification.permission === 'denied') {
    ui.updateStatus('❌ 通知权限已被拒绝，请在浏览器设置中开启', 'unsubscribed');
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('Service Worker 已注册:', reg.scope);

    const subscription = await reg.pushManager.getSubscription();
    subscription ? ui.showSubscribed(subscription) : ui.showUnsubscribed();
  } catch (err) {
    console.error('初始化失败:', err);
    ui.updateStatus(`❌ 初始化失败: ${err.message}`, 'unsubscribed');
  }
}

ui.bindEvents({
  onSubscribe: subscribePush,
  onUnsubscribe: unsubscribePush,
  onTest: testPush,
});

window.addEventListener('load', init);

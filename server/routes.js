const express = require('express');
const { webpush, vapidKeys } = require('./vapid');
const store = require('./subscriptions');

const router = express.Router();

// ---- 公钥 ----

router.get('/vapid-public-key', (_req, res) => {
  res.send(vapidKeys.publicKey);
});

// ---- 订阅管理 ----

router.post('/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription?.endpoint) {
    return res.status(400).json({ error: '无效的订阅数据' });
  }

  const isNew = store.add(subscription);
  console.log(
    isNew
      ? `✅ 新增订阅: ${subscription.endpoint.substring(0, 60)}...`
      : 'ℹ️  订阅已存在'
  );
  console.log(`📊 当前订阅数: ${store.count}`);
  res.json({ success: true });
});

router.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: '缺少 endpoint' });
  }

  const removed = store.remove(endpoint);
  if (removed) {
    console.log(`❌ 已移除订阅: ${endpoint.substring(0, 60)}...`);
  }
  console.log(`📊 当前订阅数: ${store.count}`);
  res.json({ success: true, removed });
});

// ---- 推送 ----

router.post('/send-notification', async (req, res) => {
  const { title, body, icon } = req.body;
  const subs = store.getAll();

  if (subs.length === 0) {
    return res.status(400).json({ error: '没有订阅者' });
  }

  const payload = JSON.stringify({
    title: title || '新通知',
    body: body || '您有一条新消息',
    icon: icon || '/icon.png',
  });

  console.log(`📨 准备向 ${subs.length} 个订阅者推送...`);

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(sub, payload, { TTL: 86400 }).catch((err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          store.remove(sub.endpoint);
          console.log('🗑️  移除失效订阅');
        }
        throw err;
      })
    )
  );

  const successCount = results.filter((r) => r.status === 'fulfilled').length;
  const failCount = results.filter((r) => r.status === 'rejected').length;
  console.log(`📊 推送完成: 成功 ${successCount}, 失败 ${failCount}`);

  res.json({ success: true, sent: subs.length, successCount, failCount });
});

// ---- 调试 ----

router.get('/subscriptions', (_req, res) => {
  const subs = store.getAll();
  res.json({
    count: subs.length,
    subscriptions: subs.map((sub) => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys?.p256dh ? '✓' : '✗',
        auth: sub.keys?.auth ? '✓' : '✗',
      },
    })),
  });
});

router.post('/clear-subscriptions', (_req, res) => {
  const cleared = store.clear();
  console.log(`🗑️  已清空 ${cleared} 个订阅`);
  res.json({ success: true, cleared });
});

module.exports = router;

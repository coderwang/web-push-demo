const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const VAPID_FILE = path.join(__dirname, '..', 'vapid-keys.json');

function loadOrGenerateKeys() {
  if (!fs.existsSync(VAPID_FILE)) {
    const keys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_FILE, JSON.stringify(keys, null, 2));
    console.log('✅ 已自动生成 VAPID 密钥:', VAPID_FILE);
  }
  return JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
}

const vapidKeys = loadOrGenerateKeys();

webpush.setVapidDetails(
  'mailto:webpush@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

module.exports = { webpush, vapidKeys };

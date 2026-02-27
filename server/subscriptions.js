// 生产环境应替换为数据库存储
const subscriptions = new Map();

module.exports = {
  add(subscription) {
    if (!subscription?.endpoint) return false;
    if (subscriptions.has(subscription.endpoint)) return false;
    subscriptions.set(subscription.endpoint, subscription);
    return true;
  },

  remove(endpoint) {
    return subscriptions.delete(endpoint);
  },

  getAll() {
    return [...subscriptions.values()];
  },

  clear() {
    const count = subscriptions.size;
    subscriptions.clear();
    return count;
  },

  get count() {
    return subscriptions.size;
  },
};

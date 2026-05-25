# Web Push Demo

Web Push 推送通知的简单示例项目 —— 订阅推送通知，即使关闭页面也能收到消息。

## 功能特性

- 订阅 / 取消订阅推送通知
- 一键测试推送，验证完整流程
- 自动生成 VAPID 密钥（首次运行时）
- 自动清理失效订阅（410 / 404 响应）
- 通知点击后自动聚焦或打开页面
- 响应式 UI，支持移动端

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Express + web-push |
| 前端 | 原生 JavaScript (ES Module) |
| 推送代理 | Service Worker + Push API + Notification API |
| 密钥 | VAPID（自动生成，存储在 `vapid-keys.json`） |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务

```bash
npm start        # 生产启动
npm run dev      # 开发模式（nodemon 热重载）
```

服务默认运行在 **http://localhost:3009**。

### 3. 使用

1. 打开浏览器访问 `http://localhost:3009`
2. 点击 **"订阅通知"** 按钮
3. 授予浏览器通知权限
4. 点击 **"测试推送"** 查看桌面通知
5. **关闭页面**，再次通过 API 发送推送，验证离线接收

## 项目结构

```
web-push-demo/
├── server.js               # Express 入口，启动 HTTP 服务
├── vapid-keys.json         # VAPID 密钥（首次运行自动生成）
├── package.json
├── server/
│   ├── vapid.js            # VAPID 密钥加载/生成 + web-push 配置
│   ├── subscriptions.js    # 订阅存储（内存 Map，生产应替换为数据库）
│   └── routes.js           # API 路由定义
├── public/
│   ├── index.html          # 前端页面
│   ├── sw.js               # Service Worker：接收推送 + 处理通知点击
│   ├── css/
│   │   └── style.css       # 页面样式
│   └── js/
│   │   ├── app.js          # 主逻辑：订阅、取消订阅、测试推送、初始化
│   │   ├── api.js          # 后端 API 调用封装
│   │   └── ui.js           # DOM 操作与状态更新
```

## API 接口

### 获取 VAPID 公钥

```
GET /vapid-public-key
```

返回 VAPID 公钥字符串，供前端 `pushManager.subscribe()` 使用。

### 订阅推送

```
POST /subscribe
Body: PushSubscription 对象（JSON）
```

将浏览器生成的推送订阅保存到服务端。

### 取消订阅

```
POST /unsubscribe
Body: { endpoint: string }
```

根据 endpoint 移除已保存的订阅。

### 发送推送通知

```
POST /send-notification
Body: { title?: string, body?: string, icon?: string }
```

向所有已订阅的用户推送通知。默认 TTL 为 86400 秒（24 小时）。

返回：

```json
{
  "success": true,
  "sent": 1,
  "successCount": 1,
  "failCount": 0
}
```

### 查看订阅列表（调试）

```
GET /subscriptions
```

返回当前所有订阅的摘要信息（endpoint + keys 是否存在）。

### 清空订阅（调试）

```
POST /clear-subscriptions
```

清除所有已保存的订阅数据。

## 推送流程

```
┌──────────┐       ┌──────────────┐       ┌────────────────┐       ┌──────────┐
│  前端页面 │       │  应用服务器   │       │  推送服务       │       │ Service  │
│  (浏览器) │       │  (Express)   │       │  (Google/Mozilla│       │ Worker   │
└──────────┘       └──────────────┘       │  /Apple等)      │       └──────────┘
     │                     │               └────────────────┘            │
     │ 1. 注册 Service Worker + 请求通知权限                    │
     │──────────────────────────────────────────────────►       │
     │                                                      │  sw.js
     │ 2. pushManager.subscribe(applicationServerKey)         │  install
     │──────────────────────────────────────────►              │
     │         PushSubscription 对象                          │
     │◄──────────────────────────────────────────              │
     │                                                      │
     │ 3. 将 PushSubscription 发送到服务器                     │
     │────────────────► POST /subscribe                      │
     │                 保存订阅                               │
     │                                                      │
     │ ───── 用户关闭页面 ─────                               │
     │                                                      │
     │                 4. 调用 web-push.sendNotification()    │
     │                 POST /send-notification                │
     │                 ─────────────────────►                 │
     │                                      │                │
     │                                      │ 5. 推送消息     │
     │                                      │ ─────────────► │
     │                                      │                │
     │                                      │ 6. push 事件   │
     │                                      │    showNotif   │
     │                                      │    ication()   │
     │  7. 用户看到桌面通知                  │◄────────────── │
     │◄────────────────────────────────────────────────────── │
```

核心步骤：

1. **前端注册 Service Worker**，请求通知权限
2. **浏览器生成 PushSubscription**（包含 endpoint 和加密密钥）
3. **前端将订阅对象发送到服务器保存**
4. **服务器调用 `web-push.sendNotification()`** 向推送服务发送消息
5. **推送服务将消息转发到浏览器**
6. **Service Worker 接收 `push` 事件**，调用 `showNotification()` 显示通知
7. **用户看到桌面通知**

## Service Worker 功能

### 接收推送 (`push` 事件)

- 解析推送数据（支持 JSON 和纯文本格式）
- 使用 `showNotification()` 展示通知，支持以下选项：
  - `icon` / `badge` — 通知图标
  - `actions` — 通知操作按钮
  - `requireInteraction` — 通知是否保持显示直到用户操作
  - `tag` — 通知标签（相同标签会替换旧通知）

### 通知点击 (`notificationclick` 事件)

- 关闭通知
- 尝试聚焦已有窗口，若无则打开新窗口
- 支持 `notification.data.url` 指定打开的 URL

## 浏览器兼容性

| 浏览器 | 支持情况 |
|--------|---------|
| Chrome | 完全支持 |
| Edge | 完全支持 |
| Firefox | 完全支持 |
| Safari 16.4+ | 支持 |
| iOS Safari | 需将网站添加到主屏幕（PWA 模式） |

**注意事项：**

- 必须使用 **HTTPS**（本地 `localhost` 例外）
- 浏览器进程完全关闭后（如 Chrome 关闭所有窗口）无法接收推送
- macOS 上 Chrome 需保持 Chrome 进程在后台运行（默认行为）

## 生产环境建议

1. **订阅存储**：当前使用内存 Map，重启后丢失。应替换为数据库（Redis、MongoDB、PostgreSQL 等）
2. **VAPID 邮箱**：`vapid.js` 中 `mailto:webpush@example.com` 应替换为真实邮箱
3. **VAPID 密钥**：生产环境应妥善保管 `vapid-keys.json`，不要提交到公开仓库
4. **推送内容加密**：可在 payload 中加入自定义数据，Service Worker 端自行解析处理
5. **并发与限流**：大量订阅时应分批推送，避免一次性 `Promise.allSettled` 导致内存压力
6. **错误重试**：对临时失败的推送可加入重试机制

## 许可证

MIT
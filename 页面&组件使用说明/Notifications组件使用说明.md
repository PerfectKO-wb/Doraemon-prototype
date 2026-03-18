# Notifications v2 通知中心组件使用说明

## 概述

`notifications.js` 是一个自包含的可复用通知中心组件，按照消息中心优化 PRD（Sprint 43）实现：

- **4 个业务分组**：🔴紧急、📝翻译、🎧客服、📌其他
- **分组判定**：`type=urgent` → 紧急；title 模式匹配 → 翻译；`source_from=CS` → 客服；其余 → 其他
- **翻译分组按 appID 聚合**：同一 appID 下同类标题消息 >2 条时自动合并为摘要卡片
- **紧急分组不可折叠**，始终展开；其他分组支持折叠/展开
- **已读消息被消费移除**，不再展示在列表中

---

## 快速开始

```html
<script>
window.NotificationsConfig = {
  items: [
    { id: 'n1', type: 'urgent', title: '审批超时', time: '09:15' },
    { id: 'n2', title: 'gamedemo Text Translation', appID: 'gamedemo', time: '10:30' },
    { id: 'n3', source_from: 'CS', title: '新客服咨询', time: '07:30' },
    { id: 'n4', title: '对话已完成', time: '10:45' }
  ]
};
</script>
<script src="notifications.js"></script>
```

---

## 分组定义（4 组）

| 优先级 | 分组标识 | 名称 | Emoji | 可折叠 | 判定规则 |
|--------|-----------|------|-------|--------|----------|
| 1 | `urgent` | 紧急 | 🔴 | **否** | `type` = `'urgent'` 或 `urgent: true` |
| 2 | `translation` | 翻译 | 📝 | 是 | title 匹配 4 种翻译模式（见下方） |
| 3 | `cs` | 客服 | 🎧 | 是 | `source_from` = `'CS'` |
| 4 | `others` | 其他 | 📌 | 是 | 以上均不匹配 |

**规则：** 无消息的分组不展示；分组按固定优先级排序

---

## 翻译分组 Title 匹配规则

以下 4 种标题模式的消息自动归入「翻译」分组：

| 标题模式 | 示例 | 是否聚合 |
|----------|------|----------|
| `"有 X 个图片翻译任务待处理"` | `"ja→en 有 89 个图片翻译任务待处理"` | **否**，逐条展示 |
| `"【游戏名】 Text Translation"` | `"gamedemo Text Translation"` | **是**（>2条时按 appID） |
| `"【游戏名】 Announcement Translation"` | `"gamedemo Announcement Translation"` | **是**（>2条时按 appID） |
| `"Text Translation Updated"` | `"Text Translation Updated"` | **是**（>2条时按 appID） |

> **注意**：分组判定以 title 模式匹配为准，不依赖 sourceType。同一 sourceType 下的消息可能因 title 不同分别归入不同分组。

---

## 翻译聚合规则

- **聚合维度**：`appID` + 标题类型
- **触发条件**：同一 appID 下同类标题消息 **> 2 条**（≥3 条）时触发
- **≤ 2 条时**：逐条展示，不聚合
- **"有 X 个图片翻译任务待处理"**：始终不聚合
- 聚合卡片内消息被逐条标记已读移除后，剩余 ≤ 3 条时自动解除聚合

### 聚合卡片展示格式

```
┌─────────────────────────────────────────────┐
│ [图标] gamedemo Text Translation    (5条) ▼ │
│ 10:30 · 点击展开查看详情                      │
├─────────────────────────────────────────────┤ ← 点击展开
│  · gamedemo Text Translation     10:30   →  │
│  · gamedemo Text Translation     10:20   →  │
│  · gamedemo Text Translation     10:10   →  │
│  · gamedemo Text Translation     09:50   →  │
│  · gamedemo Text Translation     09:30   →  │
└─────────────────────────────────────────────┘
```

---

## 通知项 (item) 数据结构

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | String | 推荐 | 唯一标识 |
| `title` | String | **是** | 通知标题（同时用于翻译分组的模式匹配） |
| `type` | String | 否 | `'urgent'` 时归入紧急分组 |
| `source_from` | String | 否 | `'CS'` 时归入客服分组 |
| `group` | String | 否 | 显式指定分组（优先级最高） |
| `appID` | String | 否 | 游戏/应用标识，翻译聚合的核心维度 |
| `time` | String | 否 | 时间文本 |
| `description` | String | 否 | 通知描述 |
| `icon` | String | 否 | 图标类型：`mail` / `warning` / `info` / `success` |
| `actions` | Array | 否 | 操作按钮 `[{ id, label, type }]` |
| `urgent` | Boolean | 否 | `true` 等效于 `type: 'urgent'` |

**分组优先级**：`group`（显式指定）> `type=urgent` > title 模式匹配 > `source_from=CS` > 默认 `others`

---

## 完整配置示例

匹配 PRD 3.3 整体布局设计：

```javascript
window.NotificationsConfig = {
  title: 'Notifications',
  items: [
    // 🔴 紧急 (2)
    { id: 'urg-1', type: 'urgent', title: '审批待处理超过4小时', time: '09:15', icon: 'warning' },
    { id: 'urg-2', type: 'urgent', title: 'CS升级工单待处理', time: '08:42' },

    // 📝 翻译 — Text Translation ×5 → 聚合
    { id: 'tr-1', title: 'gamedemo Text Translation', appID: 'gamedemo', time: '10:30' },
    { id: 'tr-2', title: 'gamedemo Text Translation', appID: 'gamedemo', time: '10:20' },
    { id: 'tr-3', title: 'gamedemo Text Translation', appID: 'gamedemo', time: '10:10' },
    { id: 'tr-4', title: 'gamedemo Text Translation', appID: 'gamedemo', time: '09:50' },
    { id: 'tr-5', title: 'gamedemo Text Translation', appID: 'gamedemo', time: '09:30' },

    // 📝 翻译 — 图片翻译（不聚合）
    { id: 'tr-12', title: 'ja→en 有 89 个图片翻译任务待处理', time: '09:20' },

    // 🎧 客服 (1)
    { id: 'cs-1', source_from: 'CS', title: '新客服咨询', time: '07:30' },

    // 📌 其他 (5)
    { id: 'oth-1', title: '@你 在「版本评审」中提到了你', time: '11:02' },
    { id: 'oth-2', title: '周末游玩计划调查', time: '08:00' }
  ]
};
```

---

## JavaScript API

### 面板控制

| 方法 | 说明 |
|------|------|
| `Notifications.open()` | 打开通知面板 |
| `Notifications.close()` | 关闭通知面板 |
| `Notifications.toggle()` | 切换面板 |

### 数据操作

| 方法 | 参数 | 说明 |
|------|------|------|
| `setItems(items)` | Array | 替换全部数据 |
| `addItem(item)` | Object | 新增通知（自动分组） |
| `removeItem(id)` | String | 移除通知 |
| `markAllRead()` | — | 全部已读，清空消息 |
| `markGroupRead(groupId)` | String | 分组已读并移除 |
| `markItemRead(id)` | String | 单条已读并移除 |
| `getUnreadCount()` | — | 获取总未读数 |
| `getItems()` | — | 获取数据副本 |

### 回调函数

| 回调 | 参数 | 触发时机 |
|------|------|----------|
| `onItemClick(item)` | item 对象 | 点击通知卡片，消息自动已读移除 |
| `onActionClick(item, actionId)` | item, 按钮 ID | 点击操作按钮 |
| `onDismiss(item)` | item 对象 | hover × 按钮删除 |
| `onMarkAllRead()` | — | 全部已读 |
| `onMarkGroupRead(groupId)` | 分组 ID | 分组已读 |

---

## 交互行为

| 操作 | 行为 |
|------|------|
| 点击铃铛 | 打开/关闭面板 |
| 点击分组标题行 | 折叠/展开（**紧急分组除外，始终展开**） |
| 点击「本组已读」 | 该组消息全部移除，分组消失 |
| 点击「全部已读」 | 全部消息移除 |
| 点击聚合卡片头部 | 展开/收起明细列表 |
| 点击聚合明细中的消息 | 触发 onItemClick，该消息已读移除 |
| Hover 普通卡片 | 显示右上角 × 删除按钮 |

---

## 文件位置

- 组件：`/notifications.js`
- 说明：`/页面&组件使用说明/Notifications组件使用说明.md`
- PRD：`/消息中心优化PRD_Sprint43.md`

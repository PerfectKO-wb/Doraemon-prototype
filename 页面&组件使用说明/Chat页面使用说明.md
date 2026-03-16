# Chat 页面使用说明

## 概述

`chat.html` 是一个通用的 AI 对话页面，支持通过 **URL 参数** 驱动不同的初始聊天内容。其他页面跳转到 `chat.html` 时，可以传入场景参数来展示定制化的对话。

---

## 基本用法

### 直接打开（默认场景）

```
chat.html
```

显示默认的英文对话 Demo 内容。

### 通过 URL 参数指定场景

```
chat.html?scene=场景名称
```

例如：

```html
<a href="chat.html?scene=email-reply-1">编辑回复</a>
<button onclick="location.href='chat.html?scene=email-reply-2'">编辑后发送</button>
```

---

## 内置场景列表

| 场景名称 (`scene`) | 用途 | 说明 |
|---|---|---|
| `default` | 默认通用对话 | 英文 Q3 Marketing Campaign Demo |
| `email-reply-1` | 邮件回复 — 田中监修反馈 | 针对 A 出版社田中太郎的角色监修反馈邮件，AI 已生成回复草稿 |
| `email-reply-2` | 邮件催促 — 佐藤花子任务逾期 | 针对 B 工作室佐藤花子的任务逾期催促邮件，AI 已生成催促草稿 |
| `email-reply-3` | 邮件回复 — 铃木预算审批 | 针对 C 工作室铃木一郎的海外发行预算审批回复 |

---

## 如何添加新场景

在 `chat.html` 的 `<script>` 中找到 `CHAT_PRESETS` 对象，按以下格式添加新场景：

```javascript
const CHAT_PRESETS = {
    // ... 已有场景 ...

    '你的场景名': {
        // 侧边栏高亮项的标题（可选）
        title: '场景标题',

        // 输入框占位文字（可选）
        placeholder: '输入提示文字…',

        // 初始聊天消息列表（必须）
        messages: [
            { role: 'ai',   text: 'AI 的消息内容' },
            { role: 'user', text: '用户的消息内容' },
            { role: 'ai',   text: '更多 AI 回复…' },
            // 如果消息中包含 HTML，需要加 html: true
            { role: 'user', text: '<span class="mention-tag">@系统</span> 执行操作', html: true },
        ],

        // 关键词匹配的自定义回复（可选）
        // 用户输入的文字中包含 key，就返回对应 value
        responses: {
            '关键词1': '匹配到关键词1时的 AI 回复',
            '关键词2': '匹配到关键词2时的 AI 回复',
        }
    }
};
```

### 配置项说明

| 字段 | 类型 | 必须 | 说明 |
|---|---|---|---|
| `title` | `string` | 否 | 左侧侧边栏当前激活项显示的文字 |
| `placeholder` | `string` | 否 | 底部输入框的占位提示文字 |
| `messages` | `Array` | 是 | 初始聊天消息列表 |
| `messages[].role` | `'user'` \| `'ai'` | 是 | 消息发送者：用户或 AI |
| `messages[].text` | `string` | 是 | 消息内容（纯文本或 HTML） |
| `messages[].html` | `boolean` | 否 | 设为 `true` 表示 `text` 字段包含 HTML，将直接渲染而非转义 |
| `responses` | `Object` | 否 | 关键词→回复的映射表，用于模拟 AI 对特定输入的回复 |

---

## 完整示例

### 示例 1：从邮件助手跳转

在 `email_assistant.html` 中：

```html
<button onclick="location.href='chat.html?scene=email-reply-1'">编辑回复</button>
```

跳转后 `chat.html` 将显示：
- AI 消息：邮件回复草稿
- 输入框提示："编辑回复内容…"
- 用户输入"语气更正式一些"等指令，AI 会返回修改后的版本

### 示例 2：新增一个自定义场景

假设需要添加一个"项目日报"场景：

1. 在 `CHAT_PRESETS` 中添加：

```javascript
'daily-report': {
    title: '项目日报生成',
    placeholder: '告诉我日报的要点…',
    messages: [
        { role: 'ai', text: '你好！我可以帮你生成今天的项目日报。请告诉我以下信息：\n\n1. 今天完成了哪些工作？\n2. 遇到了什么问题？\n3. 明天的计划是什么？' },
    ],
    responses: {
        '发送': '日报已生成并准备发送给团队。确认发送吗？',
    }
}
```

2. 在其他页面链接到该场景：

```html
<a href="chat.html?scene=daily-report">生成日报</a>
```

### 示例 3：包含 HTML 的消息

```javascript
messages: [
    {
        role: 'user',
        text: '<span class="mention-tag">@A-System</span> 创建任务',
        html: true
    }
]
```

设置 `html: true` 后，`@A-System` 会以标签样式渲染，而非显示为纯文本。

---

## 与其他页面的集成关系

```
email_assistant.html
├── 邮件1「编辑回复」→ chat.html?scene=email-reply-1
├── 邮件1「直接发送」→ chat.html?scene=email-reply-1
├── 邮件2「编辑后发送」→ chat.html?scene=email-reply-2
├── 邮件2「直接发送」  → chat.html?scene=email-reply-2
├── 邮件3「编辑回复」→ chat.html?scene=email-reply-3
└── 邮件3「直接发送」→ chat.html?scene=email-reply-3

workspace.html
└── （可扩展，添加 ?scene=xxx 参数即可）

其他页面
└── <a href="chat.html?scene=自定义场景">跳转</a>
```

---

## 注意事项

1. **场景名不存在时会降级**：如果 URL 中的 `scene` 值在 `CHAT_PRESETS` 中找不到，会自动使用 `default` 场景。
2. **responses 匹配规则**：用户输入的文字中只要**包含**关键词（不区分大小写）就会匹配对应回复，匹配顺序为对象中的定义顺序。
3. **HTML 安全**：普通消息默认做 HTML 转义，只有显式设置 `html: true` 的消息才会渲染 HTML 标签。
4. **CTW Bot 组件**：`chat.html` 底部同样集成了 CTW Bot 浮窗组件，与聊天主体互不干扰。

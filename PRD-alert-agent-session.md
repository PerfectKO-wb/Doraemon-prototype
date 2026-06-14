| 项目名称 | Doraemon 线上告警驱动系统专用 Agent 会话 |
| --- | --- |
| 文档版本 | v1.5 |
| 创建日期 | 2026年4月27日 |
| 修改记录 | 2026-04-27 初始版本；2026-04-28 新增 A 票自动创建与 PAP 消费闭环逻辑；2026-04-28 补充告警弹窗交互、PAP→首页→会话完整路径、告警级别统一为 WARNING；2026-04-28 明确推送消息字段规范，A 票负责人改为取自消息 assigner 字段；2026-05-06 v1.4 PAP 新增置顶 Alerts 区块、A 票直接跳转告警会话（移除首页弹窗中间步骤）、Alerts 区块强化视觉警示；2026-05-06 v1.5 推送字段 `system` 更名为 `project`，A 票聚合维度改为 `project + affected_service + alert_type` 三元组（同一天同一组合唯一） |

---

## 一、背景

### 1. 现状

Doraemon（以下简称 D 系统）是一个企业内部 AI 协作平台。当前外部系统产生线上告警时，完全依赖线下渠道（钉钉 / 邮件 / 电话）通知开发人员，D 系统无参与，开发人员无专用工具辅助排查。

### 2. 痛点

- **告警分散**：线上告警通过钉钉、邮件、电话等多种渠道触达开发人员，信息不集中，容易遗漏

### 3. 实现思路

在 D 系统中构建一套「告警 → 通知 → 专用 Agent 会话」的完整链路：

1. 各线上系统通过标准 API 将告警推送到 D 系统
2. D 系统同步创建告警会话并自动建 A 票，开发人员在 PAP 中看到对应任务
3. 开发人员在 PAP 点击 A 票直接进入对应告警会话，告警上下文已自动注入
4. 开发人员在会话中处理问题，完成后返回 PAP 填写 output 完成闭环

**核心设计原则**：

- **PAP 作为统一任务入口**：所有线上告警自动转化为 PAP 中的 A 票任务，开发人员通过日常工作台统一感知并处理，无需依赖钉钉 / 邮件等分散渠道
- **上下文自动注入**：告警的详细信息（日志、指标、错误堆栈等）自动作为会话上下文注入，开发人员无需重复描述问题
- **按维度独立建票**：以 `project + affected_service + alert_type` 为维度，同一天同一组合唯一对应一张 A 票；同组合后续告警不重复建票

---

## 二、目标

1. 线上告警自动转化为 PAP 任务，开发人员通过日常工作台统一感知，无需依赖钉钉 / 邮件等分散渠道
2. 告警从推送到开发人员开始处理的平均响应时间缩短
3. 告警处理过程在 D 系统中形成可追溯、可复用的会话记录
4. A 票作为闭环载体，将处理结果沉淀到 PAP，形成可量化的交付记录

---

## 三、整体流程

### 3.1 端到端流程

```
外部系统（publisher 等）检测到线上异常
    │
    ▼
调用 D 系统 POST /api/alerts 推送告警
    │
    ▼
D 系统后端（同步执行）：
  ├── 解析告警，同步创建告警会话，获取会话链接
  ├── 自动创建 A 票（以 project + affected_service + alert_type 为唯一键，同步写入 PAP / A 系统）
  │     ├── 当日已有同组合 A 票 → 跳过，不重复创建，不追加内容
  │     └── 当日无同组合 A 票 → 新建（Severity: Urgent，类型: bug，负责人: 取自消息 assigner 字段，内容: 本次告警会话链接）
  └── 生成告警通知（可选，辅助感知）
    │
    ▼
A 票实时出现在 PAP（通用视图）
  ├── 【Alerts 区块】页面顶部（Quick Pick 上方）独立置顶展示
  │     ├── 收起态：单张入口卡片，🚨 图标闪烁 + 徽章呼吸动效，「Requires immediate attention!」
  │     └── 展开态：每条 A 票以强视觉卡片呈现
  │           ├── 红底白字 URGENT 标签 + 所属系统
  │           ├── 服务名加粗，错误类型等宽字体红色高亮
  │           ├── DDL + 时钟图标 + 逾期状态
  │           └── 「View Details →」按钮，点击**直接跳转**告警会话
  └── 【To Do 区块】同时在 To Do 列表平铺展示 A 票（ ▶ 按钮可切为 Doing）
    │
    ▼
负责人在 PAP Alerts 区块点击「View Details →」
    │
    └──▶ **直接跳转**到对应告警会话
    │
    ▼
开发人员进入告警会话，告警上下文已自动注入首条消息
    │
    ▼
开发人员在会话中使用专用工具处理线上问题
    │
    ▼
确认服务恢复正常后返回 PAP
    │
    ▼
在 A 票输入框填写处理 output，点击完成
    │
    ▼
A 票状态更新为已完成，D 系统对应告警标记已处理
```

### 3.2 A 票自动创建与消费流程

告警推送后，D 系统**同步**在 A 系统（PAP）中创建或更新当日汇总 A 票。A 票是开发人员处理告警的唯一任务入口，处理结果通过 PAP 完成交付闭环。

**创建规则**

```
D 系统收到 POST /api/alerts（告警推送时即触发，无需等待会话创建）
    │
    ├── 唯一键：project + affected_service + alert_type（同一天同一组合复用同一张 A 票）
    │
    ├── 查询 A 系统：当日是否已存在同组合 A 票
    │     ├── 存在 → 跳过，不重复创建，不追加内容
    │     └── 不存在 → 创建新 A 票：
    │           ├── 所属部门：Tech 票
    │           ├── Severity：Urgent
    │           ├── 标题：[{affected_service}] {alert_type} 处理
    │           ├── 负责人：取自推送消息的 assigner 字段（邮箱格式）
    │           ├── DDL：当天
    │           ├── 内容：本次告警会话链接
    │           ├── 项目：取自推送消息的 project 字段
    │           ├── 类型：bug
    │           └── 部门：Tech
    │
    └── A 票立即出现在 PAP To Do 列表
```

**A票消费流程**

```
负责人（王彬）在 PAP看到告警

路径 A：通过 Alerts 区块（置顶，优先推荐）
    ├── Alerts 区块收起态：🚨 Urgent Alerts [N] 入口卡片，点击展开
    │     ├── 呼吸动效数量徽章 + 闪烁图标，不容忽视
    │     └── 展开后逐条展示告警卡片
    │           ├── 红底白字 URGENT 标签 + 所属系统名称
    │           ├── 服务名加粗，错误类型等宽字体红色高亮
    │           ├── 时钟图标 + 逾期 DDL 强调
    │           └── 点击「View Details →」直接跳转对应告警会话

路径 B：通过 To Do 列表（辅助）
    ├── A 票以 ⚠ Urgent 标签平铺于 To Do 列表
    └── 悬浮卡片 → 点击 ▶ 按钮 → A 票切换为 Doing 状态
    │
    ▼
开发人员在告警会话中核实处理结果，确认服务恢复正常
    │
    ▼
返回 PAP 页面，在 A 票下方输入框填写 output（如：已完成回退，服务恢复正常）
    │
    ▼
点击完成
    │
    ▼
A 票状态变更为已完成并填写 outputs
```

**A 票字段说明**

| 字段 | 值 | 说明 |
| --- | --- | --- |
| 所属部门 | Tech 票 | 固定值 |
| Severity | Urgent | 固定值，线上告警默认紧急 |
| 标题 | `[{affected_service}] {alert_type} 处理` | 按受影响服务名 + 告警类型动态生成，如 `[vividarmy-game-server] deploy_failed 处理` |
| 负责人 | 取自推送消息 `assigner` 字段 | 邮箱格式，D 系统据此在 PAP 中分配任务 |
| DDL | 创建当天 | 当日必须处理 |
| 内容 | 告警会话链接 | 创建时写入对应告警会话链接；同组合当日已有 A 票则不重复创建，不追加内容 |
| 项目 | 取自推送消息 `project` 字段 | 直接映射 A 票「项目」字段 |
| 类型 | bug | 固定值 |
| 部门 | Tech | 固定值 |
| **唯一键** | `project + affected_service + alert_type` | 同一天同一组合复用同一张 A 票，不重复创建 |

---

## 四、需求

### 1. 功能范围

| 范围 | 说明 |
| --- | --- |
| 触发源 | 外部系统通过 API 推送的线上告警 |
| 处理入口 | PAP A 票 → 告警会话 |

### 2. 功能需求清单

### 2.1 告警推送 API

| 需求项 | 说明 |
| --- | --- |
| 推送接口 | 提供 `POST /api/alerts` 接口，接收外部系统的告警；字段规范详见下方「外部系统推送消息字段规范」 |
| 必填字段 | `type`、`assigner`、`project`、`metadata` |
| 重复告警去重 | 相同 `project` + `metadata.affected_service` + `metadata.alert_type` 的告警在 5 分钟内只处理一次，避免告警风暴 |
| A 票去重 | 同一天 `project + affected_service + alert_type` 三元组唯一对应一张 A 票；同组合的后续告警向已有 A 票内容追加描述，不重复创建 |

**外部系统推送消息字段规范**

外部系统调用 `POST /api/alerts` 时必须提供以下字段：

| 字段 | 类型 | 是否必填 | 说明 | 示例 |
| --- | --- | --- | --- | --- |
| `type` | string | ✅ | 消息类型，固定值 | `"System Warning"` |
| `assigner` | string | ✅ | 本次告警的处理负责人，邮箱格式；D 系统将以此作为 A 票负责人 | `"wangbin@company.com"` |
| `project` | string | ✅ | 告警所属项目名称，直接映射为 A 票「项目」字段 | `"publisher"` |
| `metadata` | object | ✅ | 告警详细信息，将完整注入 Agent 上下文；子字段说明见下方 | 见下方示例 |

**`metadata` 子字段说明**

| 子字段 | 类型 | 是否必填 | 含义 | 示例 |
| --- | --- | --- | --- | --- |
| `alert_type` | string | ✅ | 告警类型标识，用于 A 票去重判断 | `"deploy_failed"` / `"service_down"` / `"queue_backlog"` |
| `environment` | string | ✅ | 告警发生的环境，帮助 Agent 判断影响范围和处理优先级 | `"production"` / `"staging"` |
| `affected_service` | string | ✅ | 受影响的具体服务或组件名称，作为 Agent 排查的定位起点 | `"vividarmy-game-server"` / `"api-gateway"` / `"translation-worker"` |
| `summary` | string | ✅ | 告警内容的一句话摘要，用于 A 票文本内容和 D 系统弹窗展示 | `"vividarmy 游戏包部署至 production 失败，npm install 超时 300s"` |
| `log_snippet` | string | 建议 | 关键日志片段（建议截取最近 20 行或核心报错行），直接注入 Agent 上下文，供 Agent 快速定位根因 | `"npm ERR! code ETIMEDOUT\nnpm ERR! errno ETIMEDOUT\nnpm ERR! network request failed"` |
| `error_stack` | string | 可选 | 完整错误堆栈，适用于代码异常类告警 | `"Error: npm install failed\n  at BuildRunner.run (runner.js:42)"` |
| `detail_url` | string | 可选 | 告警详情页 URL（如 CI 构建页、监控大盘），Agent 可引导开发人员跳转查看 | `"https://ci.example.com/build/12345"` |
| `suggested_actions` | array | 可选 | 外部系统建议的处理动作列表，Agent 可参考并优先执行 | `["查看构建日志", "回退到上一版本"]` |

### 2.2 告警会话创建

| 需求项 | 说明 |
| --- | --- |
| 会话创建时机 | 告警推送时同步创建，无需等待开发人员操作 |
| 告警上下文注入 | 自动将告警信息注入会话首条消息，作为告警摘要展示 |
| 会话标题 | 格式：`[WARNING] project — alert_type`，如 `[WARNING] publisher — deploy_failed` |

### 2.3 告警首页与会话界面

**PAP AI 指挥中心**

| 需求项 | 说明 |
| --- | --- |
| Alerts 置顶区块 | 页面顶部（Quick Pick 上方）独立 Alerts 区块，有 Urgent A 票时自动出现 |
| 收起态 | 单张入口卡片：🚨 图标微闪、「Urgent Alerts [N]」标题（深红加粗）、红底白字数量徽章（呼吸动效）、副标题「Requires immediate attention!」，点击展开 |
| 展开态 | 每张 A 票以强视觉卡片呈现：5px 粗红左描边、红底白字「⚠ Urgent · {system}」标签、服务名加粗 + 错误类型等宽字体红色高亮、时钟图标 + 逾期 DDL、「View Details →」跳转按钮 |
| 跳转逻辑 | 点击 Alerts 区块「View Details →」→ 直接跳转对应告警会话；不经过首页弹窗 |
| To Do 区块 | Urgent A 票同时平铺于 To Do 列表（无额外折叠），仅 ▶ 按钮用于切换 Doing 状态 |

### 2.4 A 票自动创建与 PAP 消费

| 需求项 | 说明 |
| --- | --- |
| A 票自动创建 | 告警推送（POST /api/alerts）时，D 系统后端同步调用 A 系统 API 创建 A 票，无需等待开发人员操作 |
| 创建维度 | 以 `project + affected_service + alert_type` 为唯一键，同一天同一组合只建一张 A 票；后续同组合告警直接跳过，不重复创建，不追加内容 |
| A 票字段映射 | 参见 3.2 节字段说明；负责人取自推送消息 `assigner` 字段，项目取自推送消息 `project` 字段，其余为固定值 |
| PAP Alerts 区块 | PAP 页面顶部（Quick Pick 上方）独立 Alerts 区块，有 Urgent A 票时自动显示；收起态：单张入口卡片，🚨 图标闪烁 + 红底白字数量徽章呼吸动效；展开态：每张 A 票以强视觉卡片呈现（粗红左描边、红底白字 URGENT 标签、服务名加粗、错误类型等宽字体红色高亮、时钟 + 逾期 DDL、「View Details →」跳转按钮） |
| PAP To Do 区块 | A 票同时平铺于 To Do 列表（无折叠），标注 ⚠ Urgent 标识，提供 ▶ 按钮切换为 Doing 状态 |
| PAP 作为入口 | 开发人员在 Alerts 区块点击「View Details →」**直接跳转**告警会话，无需经过首页弹窗；To Do 区块 ▶ 仅用于切换任务优先级 |
| PAP 消费 | 处理完成后返回 PAP，在 A 票下方输入框填写 output，点击发送，A 票状态更新为已完成 |
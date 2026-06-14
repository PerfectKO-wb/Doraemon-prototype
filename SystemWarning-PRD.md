
| 项目名称 | Doraemon 线上告警驱动系统专用 Agent 会话                                                                                                                       |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 文档版本 | v1.3                                                                                                                                               |
| 创建日期 | 2026年4月27日                                                                                                                                         |
| 修改记录 | 2026-04-27 初始版本；2026-04-28 新增 A 票自动创建与 PAP 消费闭环逻辑；2026-04-28 补充告警弹窗交互、PAP→首页→会话完整路径、告警级别统一为 WARNING；2026-04-28 明确推送消息字段规范，A 票负责人改为取自消息 assigner 字段；2026-04-30 v1.4 调整 A 票聚合粒度（按 system+service+alert_type 独立建票）、告警会话改为推送时即创建；2026-04-30 v1.5 PAP To Do Urgent 折叠方式调整为统一入口卡片（非按系统分组），非 Urgent 卡片去除红色描边 |


---

## 一、背景

### 1. 现状

Doraemon（以下简称 D 系统）是一个企业内部 AI 协作平台，围绕不同业务场景构建了多类会话：


| 会话类型 | 底层驱动 Agent         | 说明              |
| ---- | ------------------ | --------------- |
| 通用会话 | OS-Agent（通用 Agent） | 用户主动发起，处理日常通用任务 |


**当前信息流转路径**：

```
用户主动发起对话
    │
    └──▶ 使用 OS-Agent（通用 Agent）
          │
          └──▶ 使用通用工具处理

外部系统产生线上告警
    │
    └──▶ 通过钉钉 / 邮件 / 电话 通知开发人员        ← 线下流程，无 D 系统参与
          │
          └──▶ 开发人员手动排查处理                   ← 无专用工具辅助
```

### 2. 痛点

- **告警分散**：线上告警通过钉钉、邮件、电话等多种渠道触达开发人员，信息不集中，容易遗漏

### 3. 实现思路

在 D 系统中构建一套「告警推送 → 自动建票建会话 → PAP 任务入口 → 专用 Agent 处理」的完整链路：

1. 各线上系统通过标准 API 将告警推送到 D 系统
2. D 系统**同步**为每条告警创建独立 A 票（同 system + service + alert_type 去重）并创建专用 Agent 告警会话
3. A 票与会话链接实时出现在 PAP（开发人员日常工作台）
4. 开发人员在 PAP 点击 A 票，直接跳转到已创建好的告警会话
5. 告警上下文已自动注入会话，专用 Agent 可立即开始协助处理

```
外部系统（publisher / cs-gateway / data-pipeline …）检测到线上异常
    │
    └──▶ 调用 POST /api/alerts 推送告警（携带 agent_id · severity · metadata）
          │
          └──▶ D 系统后端同步执行                              ← 推送即完备，无需人工触发
                ├──▶ 解析告警，验证 Agent 注册表
                ├──▶ 创建告警会话
                │     ├── 按 agent_id 路由到系统专用 Agent
                │     ├── 注入告警上下文到首条 Bot 消息
                │     └── 加载专用 MCP Tools
                ├──▶ 创建 / 复用 A 票
                │     ├── 相同 system + service + alert_type → 复用已有 A 票
                │     └── 否则新建（Severity: Urgent · type: bug · DDL: 当天）
                │           └── A 票内容写入告警会话链接
                └──▶ 生成告警通知（可选，辅助感知）
          │
          └──▶ PAP 工作台 To Do 列表实时出现 A 票              ← 开发人员统一任务入口
                ├── <= 2 张 Urgent：直接平铺展示
                └──  > 2 张 Urgent：折叠为「⚠ Urgent 告警 [N]」入口卡片
          │
          └──▶ 负责人展开入口 → 悬浮 A 票卡片 → 点击 ▶ 切换为 Doing
          │
          └──▶ 点击 Doing 卡片 → 直接跳转到对应告警会话        ← 无需再次创建
          │
          └──▶ 与专用 Agent 对话，调用专用工具处理
                ├── deploy_rollback / view_logs / restart_service …
                └── 工具调用以 AI thinking 折叠样式展示
          │
          └──▶ 确认服务恢复 → 返回 PAP → 填写处理 output → 点击完成
                └── A 票状态 → 已完成，D 系统告警 → 标记已处理
```

**核心设计原则**：

- **PAP 作为统一任务入口**：开发人员无需关注告警渠道，所有线上告警自动转化为 PAP 中的 A 票任务，通过日常工作台即可感知并处理
- **推送即完备**：告警推送时，D 系统同步完成 A 票创建和告警会话创建，开发人员点击即可直接处理，无需再触发任何「创建」操作
- **告警消息自带路由标识**：每条告警消息携带 `agent_id`，D 系统据此路由到对应的系统专用 Agent，而非通用 OS-Agent
- **各系统自建 Agent**：每个系统（如 publisher、A-System）负责开发自己的 Agent 和配套 MCP Tools，D 系统只提供注册和路由机制
- **上下文自动注入**：告警的详细信息（日志、指标、错误堆栈等）自动作为会话上下文注入，开发人员无需重复描述问题
- **按告警独立建票**：每条告警（system + affected_service + alert_type 唯一组合）单独创建一张 A 票；PAP To Do 将所有 Urgent A 票统一折叠为一个入口卡片展示，既保持独立可追踪，又避免列表过长

---

## 二、目标

1. 线上告警自动转化为 PAP 任务，开发人员通过日常工作台统一感知，无需依赖钉钉 / 邮件等分散渠道
2. 告警从推送到开发人员开始处理的平均响应时间缩短
3. 告警处理过程在 D 系统中形成可追溯、可复用的会话记录
4. A 票作为闭环载体，将处理结果沉淀到 PAP，形成可量化的交付记录
5. 各系统通过自建 Agent 沉淀排障经验，降低人工排查成本

---

## 三、整体流程

### 3.1 端到端流程

1. 外部系统（publisher 等）检测到线上异常
2. 调用 `POST /api/alerts` 推送告警
3. D 系统后端**同步**执行以下操作：
   - 解析告警，提取 `agent_id`，验证 Agent 注册表
   - **创建告警会话**：根据 `agent_id` 路由，立即创建 `type=alert` 的专用 Agent 会话，注入告警上下文到首条 Bot 消息，加载专用 Tools
   - **创建 A 票**：查询 A 系统是否已存在相同 `system + affected_service + alert_type` 的 A 票；若存在则复用，若不存在则新建（Severity: Urgent，类型: bug，负责人取自 `assigner` 字段），A 票内容写入告警会话链接
   - 生成告警通知（可选，辅助感知）
4. A 票与告警会话链接**实时**出现在 PAP（D-PAP-AI-CENTER，PDM 视图）To Do 列表，所有 Urgent A 票折叠为一个统一入口卡片，标注 ⚠ Urgent 标识与数量
5. 负责人在 PAP 看到 A 票，点击 ▶ 切换为 Doing
6. 点击 Doing 状态的 A 票卡片，**直接跳转**到对应的告警会话（无需再创建）
7. 开发人员与专用 Agent 对话，使用专用工具处理线上问题
8. 确认服务恢复正常后返回 PAP
9. 在 A 票输入框填写处理 output，点击完成
10. A 票状态更新为已完成，D 系统对应告警标记已处理

### 3.2 各系统接入流程

### 3.2.1 系统 Agent 注册流程

每个系统首次接入 D 系统告警会话前，需要完成 Agent 注册：

```
系统团队（如 publisher 团队）
    │
    ▼
① 开发 MCP Server
   ├── 实现系统专用的 Tools（如 deploy_rollback、restart_service、view_logs）
   ├── 部署 MCP Server（streamable_http / stdio）
   └── 测试 Tools 可用性
    │
    ▼
② 在 D 系统中注册 Agent
   ├── 调用 POST /api/agents/register
   ├── 提供_agent_id、name、description、system
   ├── 声明 supported_alert_types（可处理的告警类型）
   └── 关联 MCP Server 地址
    │
    ▼
③ 在 MCP Manager 中配置 MCP Server
   ├── 进入 D 系统 → MCP Manager 页面
   ├── 添加 MCP Server（填写 name、transport type、base URL）
   └── 验证 Tools 加载成功
    │
    ▼
④ 配置告警推送
   ├── 在外部系统中配置 Webhook / 消息队列
   ├── 告警触发时调用 POST /api/alerts
   └── 消息中携带 agent_id 指向已注册的 Agent
    │
    ▼
⑤ 验证端到端流程
   ├── 触发测试告警 → D 系统通知中心收到通知
   ├── 点击通知 → 打开专用 Agent 会话
   └── 告警上下文正确注入 → Agent 可调用专用工具

```

### 3.3 A 票自动创建与消费流程

告警推送时，D 系统**同步**完成「告警会话创建 + A 票创建」。每条告警独立建票，PAP To Do 将全部 Urgent A 票统一折叠为一个入口卡片展示。

**创建规则**

`POST /api/alerts` 触发时即执行：

- 查询 A 系统是否已存在相同 `system + affected_service + alert_type` 的 A 票（不限日期）
  - **存在**：复用该 A 票（通常为同一问题重复告警），不重复创建
  - **不存在**：新建 A 票，字段如下：
    - 所属部门：Tech 票
    - Severity：Urgent
    - 标题：`[{system}] {affected_service} — {alert_type}`（如 `[publisher] vividarmy-game-server — deploy_failed`）
    - 负责人：取自推送消息的 `assigner` 字段（邮箱格式）
    - DDL：当天
    - 内容：本次告警会话链接（会话在同一次推送中同步创建，链接可直接写入）
    - 项目：取自告警 `metadata`
    - 类型：bug
    - 部门：Tech
- A 票与告警会话链接立即出现在 D-PAP-AI-CENTER（role=pdm）To Do 列表，所有 Urgent A 票折叠为统一入口卡片

**消费规则**

1. 负责人在 D-PAP-AI-CENTER To Do 列表看到 **Urgent 告警折叠入口卡片**（显示 "⚠ Urgent 告警 [N]" 及数量）；仅 1 张时直接平铺展示，无需折叠
2. 点击入口卡片展开，平铺显示所有 Urgent A 票；悬浮单张卡片 → 点击 ▶ 按钮 → 该 A 票切换为 Doing 状态
3. 点击 Doing 区域的 A 票卡片
4. **直接跳转**到对应的告警会话（会话已在告警推送时创建，无需二次触发）
5. 开发人员在告警会话中与专用 Agent 协作，确认服务恢复正常
6. 返回 PAP，在 A 票下方输入框填写 output（如：已完成回退，服务恢复正常）
7. 点击完成 → A 票状态变更为已完成，D 系统对应告警标记已处理

**A 票字段说明**

| 字段 | 值 | 说明 |
| -- | -- | -- |
| 所属部门 | Tech 票 | 固定值 |
| Severity | Urgent | 固定值，线上告警默认紧急 |
| 标题 | `[{system}] {affected_service} — {alert_type}` | 按告警三元组动态生成，唯一标识一类告警 |
| 负责人 | 取自消息 `assigner` 字段 | 外部系统推送时指定，邮箱格式 |
| DDL | 创建当天 | 当日必须处理 |
| 内容 | 告警会话链接 | 与 A 票同步创建的告警会话链接，可直接跳转 |
| 项目 | 取自 `metadata` 中相关字段 | 如 `metadata.system` 或 `metadata.project` |
| 类型 | bug | 固定值 |
| 部门 | Tech | 固定值 |


---

## 四、需求

### 1. 功能范围


| 范围   | 说明                                  |
| ---- | ----------------------------------- |
| 触发源  | 外部系统通过 API 推送的线上告警                  |
| 通知目标 | D 系统通知中心 → 对应开发人员的告警会话              |
| 会话驱动 | 由告警消息中的 `agent_id` 路由到对应的系统专用 Agent |
|      |                                     |


### 2. 功能需求清单

### 2.1 Agent 注册（开发）


| 需求项      | 说明                                    |
| -------- | ------------------------------------- |
| Agent 注册 | 各系统开发自己的 Agent，提供 agent_id、名称、描述、所属系统 |


### 2.2 告警推送 API


| 需求项    | 说明                                                         |
| ------ | ---------------------------------------------------------- |
| 推送接口 | 提供 `POST /api/alerts` 接口，接收外部系统的告警；字段规范详见下方「外部系统推送消息字段规范」 |
| 必填字段 | `type`、`assigner`、`agent_id`、`system`、`metadata` |
| 重复告警去重 | 相同 `system + affected_service + alert_type` 的告警在 5 分钟内只处理一次，避免告警风暴 |
| A 票去重维度 | 相同 `system + affected_service + alert_type` 复用同一张 A 票，不重复建票 |
| 同步创建会话 | 告警推送时 D 系统同步创建告警会话，会话链接同步写入 A 票内容，开发人员点击 PAP 卡片即可直接跳转 |


**外部系统推送消息字段规范**

外部系统调用 `POST /api/alerts` 时必须提供以下字段：


| 字段         | 类型     | 是否必填 | 说明                               | 示例                      |
| ---------- | ------ | ---- | -------------------------------- | ----------------------- |
| `type`     | string | ✅    | 消息类型，固定值                         | `"System Warning"`      |
| `assigner` | string | ✅    | 本次告警的处理负责人，邮箱格式；D 系统将以此作为 A 票负责人 | `"wangbin@company.com"` |
| `agent_id` | string | ✅    | 处理本次告警的 Agent 标识，需已在 D 系统完成注册    | `"publisher-agent"`     |
| `system`   | string | ✅    | 消息所属系统名称，用于 A 票标题生成和每日聚合         | `"publisher"`           |
| `metadata` | object | ✅    | 告警详细信息，将完整注入 Agent 上下文；子字段说明见下方  | 见下方示例                   |


`metadata` **子字段说明**


| 子字段                 | 类型     | 是否必填 | 含义                                                      | 示例                                                                                       |
| ------------------- | ------ | ---- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `alert_type`        | string | ✅    | 告警类型标识，用于 Agent 路由二次匹配和告警去重判断                           | `"deploy_failed"` / `"service_down"` / `"queue_backlog"`                                 |
| `environment`       | string | ✅    | 告警发生的环境，帮助 Agent 判断影响范围和处理优先级                           | `"production"` / `"staging"`                                                             |
| `affected_service`  | string | ✅    | 受影响的具体服务或组件名称，作为 Agent 排查的定位起点                          | `"vividarmy-game-server"` / `"api-gateway"` / `"translation-worker"`                     |
| `summary`           | string | ✅    | 告警内容的一句话摘要，用于 A 票文本内容和 D 系统弹窗展示                         | `"vividarmy 游戏包部署至 production 失败，npm install 超时 300s"`                                   |
| `log_snippet`       | string | 建议   | 关键日志片段（建议截取最近 20 行或核心报错行），直接注入 Agent 上下文，供 Agent 快速定位根因 | `"npm ERR! code ETIMEDOUT\\nnpm ERR! errno ETIMEDOUT\\nnpm ERR! network request failed"` |
| `error_stack`       | string | 可选   | 完整错误堆栈，适用于代码异常类告警                                       | `"Error: npm install failed\\n at BuildRunner.run (runner.js:42)"`                       |
| `detail_url`        | string | 可选   | 告警详情页 URL（如 CI 构建页、监控大盘），Agent 可引导开发人员跳转查看              | `"<https://ci.example.com/build/12345>"`                                                 |
| `suggested_actions` | array  | 可选   | 外部系统建议的处理动作列表，Agent 可参考并优先执行                            | `["查看构建日志", "回退到上一版本"]`                                                                  |


**不同告警类型的** `metadata` **示例**

*deploy_failed — 部署失败*

```json
"metadata": {
  "alert_type": "deploy_failed",
  "environment": "production",
  "affected_service": "vividarmy-game-server",
  "summary": "vividarmy 游戏包部署至 production 失败，npm install 超时 300s",
  "log_snippet": "npm ERR! code ETIMEDOUT\\nnpm ERR! network request to <https://registry.npmjs.org> failed",
  "detail_url": "<https://ci.example.com/build/12345>",
  "suggested_actions": ["查看构建日志", "回退到上一版本"]
}

```

*service_down — 服务错误率异常*

```json
"metadata": {
  "alert_type": "service_down",
  "environment": "production",
  "affected_service": "api-gateway",
  "summary": "API Gateway 5xx 错误率从 0.1% 升至 12.3%，已持续 5 分钟",
  "log_snippet": "[ERROR] upstream connect error or disconnect/reset before headers. retried and the latest reset reason: connection failure",
  "detail_url": "<https://grafana.example.com/d/api-gateway-overview>",
  "suggested_actions": ["检查上游服务健康状态", "查看最近部署记录"]
}

```

*queue_backlog — 队列积压*

```json
"metadata": {
  "alert_type": "queue_backlog",
  "environment": "production",
  "affected_service": "translation-worker",
  "summary": "翻译任务队列积压超过 800 条，消费速度下降 90%",
  "log_snippet": "Worker process exited unexpectedly (exit code 137, OOMKilled)\\nQueue depth: 823, consumer count: 0",
  "detail_url": "<https://dashboard.example.com/queues/translation>",
  "suggested_actions": ["重启 worker 进程", "检查内存配额"]
}

```

### 2.3 告警感知（辅助渠道）

> **说明**：开发人员的主要告警感知入口已改为 PAP（A 票自动推送），通知中心作为辅助感知渠道保留，提供实时提醒能力。


| 需求项             | 说明                                                 |
| --------------- | -------------------------------------------------- |
| 告警浮动卡片          | D 系统首页右上角以队列方式展示外显告警卡片，每次显示一张，关闭后自动显示下一张（辅助感知）     |
| Urgent Alert 弹窗 | 进入 D 系统首页时自动弹出聚合弹窗，展示当日所有待处理告警，支持翻页与 Start Chat 跳转 |


### 2.4 告警会话创建

| 需求项 | 说明 |
| -- | -- |
| 创建时机 | 告警推送（`POST /api/alerts`）时 D 系统后端**同步**创建告警会话，不依赖开发人员的任何操作 |
| Agent 路由 | 根据告警中的 `agent_id` 确定驱动该会话的 Agent；未匹配时按 `system` 兜底，最终降级到 OS-Agent |
| 告警上下文注入 | 自动将告警 `metadata` 完整注入会话首条 Bot 消息，开发人员进入会话即可立即开始处理 |
| 会话标题 | 格式：`[WARNING] system — alert_type`，如 `[WARNING] publisher — deploy_failed` |
| 会话复用 | 同一 `alert_id` 对应的会话已存在时直接复用，不重复创建 |


### 2.5 告警首页与会话界面

**告警首页（homepage）**

| 需求项 | 说明 |
| -- | -- |
| 外显浮动告警卡片 | 页面右上角以队列形式逐条展示告警浮动卡片，每次显示一张，关闭后自动显示下一张（辅助感知，无交互） |
| Urgent Alert 弹窗 | 页面加载后自动弹出聚合弹窗，展示当日所有待处理告警；弹窗包含：顶部警告图标、告警数量说明、当前告警详情卡片（含系统名、告警摘要、时间戳）、Previous / Next 翻页按钮、「查看会话」跳转按钮 |
| 「查看会话」行为 | 点击后直接跳转到该告警对应的已创建会话（会话已在告警推送时同步创建），不触发新建会话 |

**告警会话界面（chat）**

| 需求项 | 说明 |
| -- | -- |
| 侧边栏告警会话折叠分组 | 同一 severity 的多条告警会话在侧边栏合并为一个可折叠分组，交互规则如下：**折叠态**：显示该分组第一条会话的标题（如 `[WARNING] publisher — 部署失败`），右侧显示展开箭头；**展开态**：顶部显示分组标题 `WARNING`（小字灰色），展开箭头翻转，列出该 severity 下所有告警会话条目；点击分组行切换折叠/展开状态 |
| 侧边栏活跃态 | 当前正在查看的告警会话对应的条目高亮显示；若所在分组处于折叠态，自动展开该分组 |
| 会话内容 | AI 自然语言对话形式，工具调用以「AI thinking」折叠样式展示，日志以纯文本形式内嵌 |
| 降级提示 | 当 Agent 降级到 OS-Agent 时，在会话中提示「当前使用通用 Agent，部分系统专用工具不可用」 |

### 2.6 A 票自动创建与 PAP 消费

| 需求项 | 说明 |
| -- | -- |
| A 票自动创建 | 告警推送（`POST /api/alerts`）时，D 系统后端同步调用 A 系统 API 创建 A 票，同时创建告警会话并将会话链接写入 A 票内容 |
| A 票粒度 | 每条唯一告警（`system + affected_service + alert_type`）单独创建一张 A 票；相同组合复用已有 A 票 |
| PAP 折叠展示 | PAP To Do 列表将全部 Urgent A 票折叠为一个统一入口卡片（仅当 Urgent A 票数 > 2 时触发折叠）：折叠态显示「⚠ Urgent 告警 [N]」与「今日 DDL · 点击展开处理」；展开态顶部为轻量标题行，各 A 票卡片直接平铺（无外层包装盒）；≤ 2 张时直接平铺不折叠；非 Urgent 普通 To Do 卡片无红色描边 |
| PAP 作为入口 | 开发人员以 PAP A 票为唯一处理入口：点击入口展开 → 悬浮卡片点击 ▶ 切换为 Doing → 点击卡片 → **直接跳转**到对应告警会话 |
| PAP 消费 | 处理完成后返回 PAP，在 A 票下方输入框填写 output，点击发送，A 票状态更新为已完成 |
| 告警状态同步 | A 票完成后，D 系统将该告警标记为「已处理」 |
| 未完成提醒 | A 票 DDL 到期前 2 小时若仍未完成，PAP 显示逾期标识，通知负责人 |




| 项目名称 | Doraemon 线上告警驱动系统专用 Agent 会话 |
| ---- | ---------------------------- |
| 文档版本 | v1.3                         |
| 创建日期 | 2026年4月27日                   |
| 修改记录 | 2026-04-27 初始版本；2026-04-28 新增 A 票自动创建与 PAP 消费闭环逻辑；2026-04-28 补充告警弹窗交互、PAP→首页→会话完整路径、告警级别统一为 WARNING；2026-04-28 明确推送消息字段规范，A 票负责人改为取自消息 assigner 字段 |


---

## 一、背景

### 1. 现状

Doraemon（以下简称 D 系统）是一个企业内部 AI 协作平台，围绕不同业务场景构建了多类会话：


| 会话类型            | 底层驱动 Agent              | 说明                                        |
| --------------- | ----------------------- | ----------------------------------------- |
| 通用会话            | OS-Agent（通用 Agent）      | 用户主动发起，处理日常通用任务                           |
| Expert Agent 会话 | CS Agent / i18n Agent 等 | 用户在侧边栏选择 Expert Agent 后发起，Agent 拥有专用工具和知识 |
|                 |                         |                                           |


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

在 D 系统中构建一套「告警 → 通知 → 专用 Agent 会话」的完整链路：

1. 各线上系统通过标准 API 将告警推送到 D 系统
2. 自动创建A票，开发人员在PAP（通用角色PAP）中看到对应任务
3. 开发人员点击任务进入D系统，D 系统展示告警
4. 开发人员点击告警通知后，D 系统自动创建一个使用该系统专用 Agent 的会话
5. 告警上下文自动注入会话首条消息，专用 Agent 可立即开始处理

**核心设计原则**：

- **PAP 作为统一任务入口**：开发人员无需关注告警渠道，所有线上告警自动转化为 PAP 中的 A 票任务，通过日常工作台即可感知并处理
- **告警消息自带路由标识**：每条告警消息携带 `agent_id`，D 系统据此路由到对应的系统专用 Agent，而非通用 OS-Agent
- **各系统自建 Agent**：每个系统（如 publisher、A-System）负责开发自己的 Agent 和配套 MCP Tools，D 系统只提供注册和路由机制
- **上下文自动注入**：告警的详细信息（日志、指标、错误堆栈等）自动作为会话上下文注入，开发人员无需重复描述问题
- **每日聚合处理**：同一系统当日多条告警合并到一张 A 票，开发人员统一处理、统一交付，减少上下文切换

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

```
外部系统（publisher 等）检测到线上异常
    │
    ▼
调用 D 系统 POST /api/alerts 推送告警
    │
    ▼
D 系统后端（同步执行）：
  ├── 解析告警，提取 agent_id，验证 Agent 注册表
  ├── 自动创建或更新当日 A 票（同步写入 PAP / A 系统）
  │     ├── 当日已有同系统 A 票 → 追加本次告警描述文本到 A 票内容
  │     └── 当日无 A 票 → 新建（Severity: Urgent，类型: bug，负责人: 取自消息 assigner 字段）
  └── 生成告警通知（可选，辅助感知）
    │
    ▼
A 票实时出现在 PAP（D-PAP-AI-CENTER，PDM 视图）To Do 列表
  └── 标注 ⚠ Urgent 标识，内含本次告警会话链接
    │
    ▼
负责人在 PAP 看到 A 票 → 点击 ▶ 切换为 Doing
    │
    ▼
点击 Doing 状态的 A 票卡片
    │
    ▼
跳转到 D 系统首页，自动弹出 Urgent Alert 弹窗
  ├── 展示当日所有告警列表（支持 Previous / Next 翻页）
  ├── 每条告警显示：系统名、告警摘要、时间戳
  └── 点击「Start Chat」→ 进入对应系统专用 Agent 会话
    │
    ▼
D 系统前端（进入会话时）：
  ├── 读取告警中的 agent_id → 确定 Agent
  ├── 创建或复用告警会话（conversation.type = alert）
  ├── 注入告警上下文到首条 Bot 消息
  └── 加载专用 Agent 的 Tools 和 Skill
    │
    ▼
开发人员与专用 Agent 对话，使用专用工具处理线上问题
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

### 3.2 各系统接入流程

#### 3.2.1 系统 Agent 注册流程

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

#### 3.2.2 publisher 系统接入示例

```
publisher 系统
    │
    ├── ① 开发 publisher-mcp-server
    │     ├── deploy_rollback: 回退部署版本
    │     ├── restart_service: 重启服务
    │     ├── view_logs: 查看服务日志
    │     └── check_deploy_status: 查询部署状态
    │
    ├── ② 注册 Agent
    │     POST /api/agents/register
    │     {
    │       "agent_id": "publisher-agent",
    │       "name": "Publisher 运维 Agent",
    │       "system": "publisher",
    │       "supported_alert_types": ["deploy_failed", "service_down", "rollback_needed"]
    │     }
    │
    ├── ③ 配置 MCP Server
    │     └── MCP Manager → Add → publisher-mcp-server
    │
    ├── ④ 配置告警推送
    │     └── publisher CI/CD → deploy 失败时 → POST /api/alerts
    │
    └── ⑤ 验证
          └── 模拟部署失败 → D 系统通知中心 → 点击 → publisher-agent 会话
```



### 3.3 A 票自动创建与消费流程

告警推送后，D 系统**同步**在 A 系统（PAP）中创建或更新当日汇总 A 票。A 票是开发人员处理告警的唯一任务入口，处理结果通过 PAP 完成交付闭环。

**创建规则**

```
D 系统收到 POST /api/alerts（告警推送时即触发，无需等待会话创建）
    │
    ├── 查询 A 系统：当日是否已存在同 system 的汇总 A 票
    │     ├── 存在 → 追加本次告警描述文本到 A 票内容字段（格式：`[severity] system — 告警摘要`）
    │     └── 不存在 → 创建新 A 票：
    │           ├── 所属部门：Tech 票
    │           ├── Severity：Urgent
    │           ├── 标题：[{system}系统] 线上问题处理
    │           ├── 负责人：取自推送消息的 assigner 字段（邮箱格式）
    │           ├── DDL：当天
    │           ├── 内容：本次告警描述文本（格式：`[severity] system — 告警摘要`，后续每条告警追加一行）
    │           ├── 项目：对应项目（取自告警 metadata）
    │           ├── 类型：bug
    │           └── 部门：Tech
    │
    └── A 票立即出现在 D-PAP-AI-CENTER（role=pdm）To Do 列表
```

**消费规则**

```
负责人（王彬）在 D-PAP-AI-CENTER To Do 列表看到 A 票任务卡片
    │
    ▼
悬浮卡片 → 点击 ▶ 按钮 → A 票切换为 Doing 状态
    │
    ▼
点击 Doing 区域的 A 票卡片
    │
    ▼
跳转到 D 系统首页（homepage_urgent_warning.html）
    │
    ▼
自动弹出 Urgent Alert 弹窗
  ├── 展示当日告警数量与摘要
  ├── 通过 Previous / Next 按钮切换查看各条告警详情
  └── 点击「Start Chat」→ 进入告警会话（chat_urgent_warning.html）
    │
    ▼
开发人员在告警会话中核实处理结果，确认服务恢复正常
    │
    ▼
返回 PAP 页面，在 A 票下方输入框填写 output（如：已完成回退，服务恢复正常）
    │
    ▼
点击发送（完成）
    │
    ▼
A 票状态变更为已完成，D 系统对应告警标记已处理
```

**A 票字段说明**

| 字段 | 值 | 说明 |
| -- | -- | -- |
| 所属部门 | Tech 票 | 固定值 |
| Severity | Urgent | 固定值，线上告警默认紧急 |
| 标题 | `[{system}系统] 线上问题处理` | 按系统名动态生成 |
| 负责人 | 取自消息 `assigner` 字段 | 外部系统推送时指定，邮箱格式，D 系统据此在 PAP 中分配任务 |
| DDL | 创建当天 | 当日必须处理 |
| 内容 | 告警描述文本列表 | 每条告警追加一行，格式：`[severity] system — 告警摘要`；A 票创建时尚无会话链接，以文本描述代替 |
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

#### 2.1 Agent 注册管理


| 需求项        | 说明                                                                 |
| ---------- | ------------------------------------------------------------------ |
| Agent 注册   | 各系统通过 API 注册自己的 Agent，提供 agent_id、名称、描述、所属系统、可处理告警类型、关联 MCP Server |
| Agent 列表查询 | D 系统前端可查询所有已注册的 Agent 列表                                           |
| Agent 信息更新 | 系统团队可更新 Agent 的工具列表、告警类型等                                          |
| Agent 注销   | 系统团队可注销不再使用的 Agent，注销前需确认无活跃告警会话                                   |


#### 2.2 告警推送 API

| 需求项    | 说明                                                                                    |
| ------ | ------------------------------------------------------------------------------------- |
| 推送接口   | 提供 `POST /api/alerts` 接口，接收外部系统的告警；字段规范详见下方「外部系统推送消息字段规范」 |
| 必填字段   | `type`、`assigner`、`agent_id`、`system`、`metadata`                                     |
| 重复告警去重 | 相同 `system` + `metadata.alert_type` 的告警在 5 分钟内只处理一次，避免告警风暴                           |
| 告警聚合   | 同系统同类型告警在 D 系统首页弹窗中聚合展示，同日共享一张 A 票                                                  |

**外部系统推送消息字段规范**

外部系统调用 `POST /api/alerts` 时必须提供以下字段：

| 字段 | 类型 | 是否必填 | 说明 | 示例 |
| -- | -- | :--: | -- | -- |
| `type` | string | ✅ | 消息类型，固定值 | `"System Warning"` |
| `assigner` | string | ✅ | 本次告警的处理负责人，邮箱格式；D 系统将以此作为 A 票负责人 | `"wangbin@company.com"` |
| `agent_id` | string | ✅ | 处理本次告警的 Agent 标识，需已在 D 系统完成注册 | `"publisher-agent"` |
| `system` | string | ✅ | 消息所属系统名称，用于 A 票标题生成和每日聚合 | `"publisher"` |
| `metadata` | object | ✅ | 告警详细信息，将完整注入 Agent 上下文；子字段说明见下方 | 见下方示例 |

**`metadata` 子字段说明**

| 子字段 | 类型 | 是否必填 | 含义 | 示例 |
| -- | -- | :--: | -- | -- |
| `alert_type` | string | ✅ | 告警类型标识，用于 Agent 路由二次匹配和告警去重判断 | `"deploy_failed"` / `"service_down"` / `"queue_backlog"` |
| `environment` | string | ✅ | 告警发生的环境，帮助 Agent 判断影响范围和处理优先级 | `"production"` / `"staging"` / `"pre-release"` |
| `affected_service` | string | ✅ | 受影响的具体服务或组件名称，作为 Agent 排查的定位起点 | `"vividarmy-game-server"` / `"api-gateway"` / `"translation-worker"` |
| `summary` | string | ✅ | 告警内容的一句话摘要，用于 A 票文本内容和 D 系统弹窗展示 | `"vividarmy 游戏包部署至 production 失败，npm install 超时 300s"` |
| `log_snippet` | string | 建议 | 关键日志片段（建议截取最近 20 行或核心报错行），直接注入 Agent 上下文，供 Agent 快速定位根因 | `"npm ERR! code ETIMEDOUT\nnpm ERR! errno ETIMEDOUT\nnpm ERR! network request failed"` |
| `error_stack` | string | 可选 | 完整错误堆栈，适用于代码异常类告警 | `"Error: npm install failed\n  at BuildRunner.run (runner.js:42)"` |
| `detail_url` | string | 可选 | 告警详情页 URL（如 CI 构建页、监控大盘），Agent 可引导开发人员跳转查看 | `"https://ci.example.com/build/12345"` |
| `suggested_actions` | array | 可选 | 外部系统建议的处理动作列表，Agent 可参考并优先执行 | `["查看构建日志", "回退到上一版本"]` |

**不同告警类型的 `metadata` 示例**

*deploy_failed — 部署失败*
```json
"metadata": {
  "alert_type": "deploy_failed",
  "environment": "production",
  "affected_service": "vividarmy-game-server",
  "summary": "vividarmy 游戏包部署至 production 失败，npm install 超时 300s",
  "log_snippet": "npm ERR! code ETIMEDOUT\nnpm ERR! network request to https://registry.npmjs.org failed",
  "detail_url": "https://ci.example.com/build/12345",
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
  "detail_url": "https://grafana.example.com/d/api-gateway-overview",
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
  "log_snippet": "Worker process exited unexpectedly (exit code 137, OOMKilled)\nQueue depth: 823, consumer count: 0",
  "detail_url": "https://dashboard.example.com/queues/translation",
  "suggested_actions": ["重启 worker 进程", "检查内存配额"]
}
```


#### 2.3 告警感知（辅助渠道）

> **说明**：开发人员的主要告警感知入口已改为 PAP（A 票自动推送），通知中心作为辅助感知渠道保留，提供实时提醒能力。

| 需求项    | 说明                                                            |
| ------ | ------------------------------------------------------------- |
| 告警浮动卡片 | D 系统首页右上角以队列方式展示外显告警卡片，每次显示一张，关闭后自动显示下一张（辅助感知） |
| Urgent Alert 弹窗 | 进入 D 系统首页时自动弹出聚合弹窗，展示当日所有待处理告警，支持翻页与 Start Chat 跳转 |
| 通知中心告警分组 | 通知中心保留 `alert` 类型分组（可选），按 severity 排序，聚合同系统同类型告警 |
| 标记已读   | A 票完成后，D 系统对应告警自动标记已处理                                       |


#### 2.4 告警会话创建


| 需求项      | 说明                                                                                          |
| -------- | ------------------------------------------------------------------------------------------- |
| 会话类型     | 新增 `alert` 类型会话，区别于普通会话（`normal`）                                                           |
| Agent 路由 | 根据告警中的 `agent_id` 确定驱动该会话的 Agent；若 `agent_id` 为空，按 `system` 匹配 Agent 注册表；若均未匹配，降级到 OS-Agent |
| 告警上下文注入  | 自动将告警信息注入会话首条 Bot 消息，作为告警摘要卡片展示                                                             |
| 会话标题     | 格式：`[severity] system — alert_type`，如 `[WARNING] publisher — 部署失败`                          |
| 会话复用     | 同一告警（同一 alert_id）点击后复用已有会话，不重复创建                                                            |
| 侧边栏标识    | 告警会话在侧边栏显示系统 Agent 图标和告警级别色标                                                                |


#### 2.5 告警首页与会话界面

**告警首页（homepage）**

| 需求项 | 说明 |
| -- | -- |
| 外显浮动告警卡片 | 页面右上角以队列形式逐条展示告警浮动卡片，每次显示一张，关闭后自动显示下一张 |
| Urgent Alert 弹窗 | 页面加载后自动弹出聚合弹窗，展示当日所有待处理告警；弹窗包含：顶部警告图标、告警数量说明、当前告警详情卡片（含系统名、告警摘要、时间戳）、Previous / Next 翻页按钮、Start Chat 跳转按钮 |
| 弹窗触发时机 | 页面加载完成约 0.6s 后自动弹出；点击背景蒙层可关闭 |
| Start Chat 行为 | 点击后关闭弹窗，跳转到 `chat_urgent_warning.html?scene=publisher-alert` |

**告警会话界面（chat）**

| 需求项       | 说明                                                          |
| --------- | ----------------------------------------------------------- |
| 侧边栏告警分组   | 侧边栏「Yesterday」中支持 `[WARNING]` 会话折叠分组，折叠显示首条标题，展开显示全部       |
| 会话内容      | AI 自然语言对话形式，工具调用以「AI thinking」折叠样式展示，日志以纯文本形式内嵌              |
| 工具调用      | deploy_rollback / check_deploy_status 等操作以可展开的 AI thinking 块呈现 |
| 降级提示      | 当 Agent 降级到 OS-Agent 时，在会话中提示「当前使用通用 Agent，部分系统专用工具不可用」     |


#### 2.6 A 票自动创建与 PAP 消费


| 需求项 | 说明 |
| -- | -- |
| A 票自动创建 | 告警推送（POST /api/alerts）时，D 系统后端同步调用 A 系统 API 创建当日汇总 A 票，无需等待开发人员操作 |
| 每日聚合 | 同一系统同一天的多条告警共享一张 A 票，不重复创建；新告警向 A 票内容字段追加一行告警描述文本 |
| A 票字段映射 | 参见 3.3 节字段说明；负责人取自推送消息 `assigner` 字段，项目取自 `metadata`，其余为固定值 |
| PAP 显示 | A 票告警推送后**立即**出现在 D-PAP-AI-CENTER（role=pdm）To Do 列表，标注 ⚠ Urgent 标识，内含告警会话链接列表 |
| PAP 作为入口 | 开发人员以 PAP A 票为处理入口：点击 ▶ 切换为 Doing → 点击卡片 → 进入 D 系统首页查看告警弹窗 → Start Chat 进入会话 |
| PAP 消费 | 处理完成后返回 PAP，在 A 票下方输入框填写 output，点击发送，A 票状态更新为已完成 |
| 告警状态同步 | A 票完成后，D 系统将该批告警会话标记为「已处理」，通知中心对应条目消失或标灰 |
| 未完成提醒 | A 票当日 DDL 到期前 2 小时若仍未完成，PAP 显示逾期标识，通知负责人 |


### 3. 消息协议

#### 3.1 告警消息结构

外部系统推送示例（publisher 部署失败）：

```json
{
  "type": "System Warning",
  "assigner": "wangbin@company.com",
  "agent_id": "publisher-agent",
  "system": "publisher",
  "metadata": {
    "alert_type": "deploy_failed",
    "environment": "production",
    "affected_service": "vividarmy-game-server",
    "summary": "vividarmy 游戏包部署至 production 失败，npm install 超时 300s",
    "log_snippet": "npm ERR! code ETIMEDOUT\nnpm ERR! network request to https://registry.npmjs.org failed",
    "error_stack": "Error: npm install failed\n  at BuildRunner.run (runner.js:42)",
    "detail_url": "https://ci.example.com/build/12345",
    "suggested_actions": ["查看构建日志", "回退到上一版本"]
  }
}
```

> D 系统接收后自动补充 `id`（系统生成）和 `time`（接收时间戳），无需外部系统传入。

#### 3.2 Agent 注册数据结构

```json
{
  "agent_id": "publisher-agent",
  "name": "Publisher 运维 Agent",
  "description": "处理 publisher 系统的线上部署告警和运维操作",
  "system": "publisher",
  "icon": "🚀",
  "color": "#ef4444",
  "mcp_servers": ["publisher-mcp-server"],
  "tools": [
    { "name": "deploy_rollback", "description": "回退部署版本" },
    { "name": "restart_service", "description": "重启服务" },
    { "name": "view_logs", "description": "查看服务日志" },
    { "name": "check_deploy_status", "description": "查询部署状态" }
  ],
  "supported_alert_types": ["deploy_failed", "service_down", "rollback_needed"],
  "status": "active"
}
```

#### 3.3 Agent 路由规则

```
告警消息进入 D 系统
    │
    ├── 消息中包含 agent_id?
    │     ├── 是 → 查询 Agent 注册表，验证 agent_id 有效
    │     │         ├── 有效 → 路由到指定 Agent ✅
    │     │         └── 无效 → 降级到 OS-Agent，会话中提示
    │     └── 否 → 按 source_from / system 匹配注册表
    │              ├── 匹配到唯一 Agent → 路由到该 Agent ✅
    │              ├── 匹配到多个 Agent → 按 supported_alert_types 二次匹配
    │              │         ├── 匹配到唯一 → 路由 ✅
    │              │         └── 仍多个 → 路由到第一个 + 提示
    │              └── 未匹配 → 路由到 OS-Agent（兜底）⚠️
    │
    └── 路由结果记录到会话元数据中
```

### 4. API 设计


| 方法     | 路径                            | 说明             | 调用方             |
| ------ | ----------------------------- | -------------- | --------------- |
| POST   | `/api/alerts`                 | 推送告警           | 外部系统            |
| GET    | `/api/alerts`                 | 查询告警列表         | D 系统前端          |
| GET    | `/api/alerts/:alert_id`       | 查询告警详情         | D 系统前端          |
| POST   | `/api/agents/register`        | 注册 Agent       | 系统团队            |
| GET    | `/api/agents`                 | 查询 Agent 列表    | D 系统前端          |
| GET    | `/api/agents/:agent_id`       | 查询 Agent 详情    | D 系统前端          |
| PUT    | `/api/agents/:agent_id`       | 更新 Agent 信息    | 系统团队            |
| DELETE | `/api/agents/:agent_id`       | 注销 Agent       | 系统团队            |
| POST   | `/api/conversations`          | 创建告警会话         | D 系统前端（点击告警时调用） |
| GET    | `/api/conversations/:conv_id` | 查询会话详情（含告警上下文） | D 系统前端          |
| POST   | `/api/a-tickets`              | 创建 A 票          | D 系统后端（告警会话创建时） |
| PATCH  | `/api/a-tickets/:ticket_id`   | 追加告警文本 / 更新状态   | D 系统后端 / PAP 前端 |
| GET    | `/api/a-tickets/today`        | 查询当日 A 票        | PAP 前端           |


### 5. 前端页面变更点


| 页面                         | 变更内容                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `homepage_urgent_warning.html` | 右上角浮动告警卡片队列（逐条展示，关闭后显示下一条）；页面加载后自动弹出 Urgent Alert 聚合弹窗（支持翻页，Start Chat 跳转告警会话）；通知面板与 OS 系统消息在当前原型中隐藏 |
| `chat_urgent_warning.html`     | 告警会话界面；侧边栏 `[WARNING]` 多会话折叠分组；通过 `?scene=` 参数加载不同告警场景；通知铃铛在当前原型中隐藏 |
| `D-PAP-AI-CENTER.html`         | PDM 视图（role=pdm, user=u5）To Do 列表中展示告警 A 票（带 Urgent 标识）；点击 ▶ 切入 Doing；Doing 状态下点击 A 票卡片跳转首页查看告警详情；在 PAP 输入框填写 output 完成 A 票消费 |
| `mcp_manager_v3.html`          | 各系统 Agent 关联的 MCP Server 在此管理，无额外改动 |
| 侧边栏                          | 新增「系统 Agent」分组，展示所有已注册的系统 Agent，有活跃告警时显示红点/数字 |


---

## 五、会话类型对比


|          | 普通会话         | Expert Agent 会话         | **告警会话（本次新增）**                    |
| -------- | ------------ | ----------------------- | --------------------------------- |
| 触发方式     | 用户主动发起       | 用户选择 Expert Agent 发起    | **系统告警触发，点击通知打开**                 |
| 底层 Agent | OS-Agent（通用） | CS Agent / i18n Agent 等 | **系统专用 Agent（publisher-agent 等）** |
| 首条消息     | 用户输入         | 用户输入                    | **系统注入的告警摘要卡片**                   |
| 可用工具     | 通用工具集        | Expert 专用工具             | **系统 MCP Server 提供的专用工具**         |
| 上下文面板    | Skill + 知识   | Skill + 知识 + 用户信息       | **告警详情 + 系统状态 + Agent 工具**        |
| 会话入口     | 侧边栏新建对话      | 侧边栏 Expert Agent        | **通知中心点击告警**                      |
| 消息 type  | `normal`     | `normal`                | `**alert`**                       |
| agent_id | 空            | expert agent id         | **系统 agent id**                   |


---

## 六、非功能需求


| 需求项        | 说明                                   |
| ---------- | ------------------------------------ |
| 告警推送延迟     | 从外部系统调用 API 到 D 系统通知中心展示，延迟 < 5 秒    |
| 告警去重窗口     | 相同告警 5 分钟内不重复推送通知                    |
| 告警聚合       | 同系统同类型 > 2 条告警自动聚合                   |
| 会话创建延迟     | 点击通知到会话界面渲染完成 < 1 秒                  |
| Agent 路由容错 | agent_id 无效或未注册时降级到 OS-Agent，不阻断用户操作 |
| 权限控制       | 只有对应系统的开发团队成员才能收到该系统的告警通知            |
| 审计日志       | 告警推送、Agent 调用工具等操作均记录审计日志            |


---

## 附录

### 测试场景罗列


| 场景          | 输入                                            | 预期结果                               |
| ----------- | --------------------------------------------- | ---------------------------------- |
| 正常告警推送      | POST /api/alerts，severity=warning，agent_id 有效  | 首页弹出 Urgent Alert 弹窗，点击 Start Chat 打开专用 Agent 会话 |
| 无 agent_id  | POST /api/alerts，agent_id 为空，system=publisher | 按 system 匹配到 publisher-agent，正常路由  |
| agent_id 无效 | POST /api/alerts，agent_id=non-existent        | 降级到 OS-Agent，会话中提示 Agent 不可用       |
| 重复告警去重      | 5 分钟内推送相同告警 3 次                               | 通知中心只显示 1 条                        |
| 告警聚合        | 10 分钟内推送 5 条同类型告警                             | 通知中心聚合为「5 条部署失败告警」                 |
| 告警会话复用      | 对同一 alert_id 点击 2 次                           | 复用同一会话，不重复创建                       |
| 专用工具调用      | 在 publisher-agent 会话中请求回退                     | Agent 调用 deploy_rollback 工具，展示执行结果 |
| 多系统并发       | publisher 和 A-System 同时推送告警                   | 两条告警分别路由到各自 Agent                  |
| 权限验证        | 非 publisher 团队成员查看 publisher 告警               | 不可见或无权限提示                          |
| A 票首次创建     | 当日首条 publisher 告警推送（POST /api/alerts）          | D 系统同步在 A 系统新建 A 票，PAP To Do 列表**立即**出现告警 A 票卡片 |
| A 票追加文本     | 当日第 2/3 条告警推送                                 | A 票内容字段新增一行告警描述文本，PAP 卡片内条目数量实时更新  |
| A 票 PAP 消费   | 切换 Doing → 点击卡片进入首页弹窗 → Start Chat → 确认处理结果 → 回 PAP 填写 output 点击完成 | A 票状态变更为已完成，D 系统对应告警标记已处理 |
| A 票逾期提醒     | A 票 DDL 前 2 小时未完成                             | PAP 显示逾期标识                          |


### 各系统接入 Checklist


| 序号  | 步骤                                    | 负责方         | 产出物             | 状态  |
| --- | ------------------------------------- | ----------- | --------------- | --- |
| 1   | 开发 MCP Server，实现专用 Tools              | 系统团队        | 可用的 MCP Server  |     |
| 2   | 部署 MCP Server 到内网                     | 系统团队        | MCP Server URL  |     |
| 3   | 调用 POST /api/agents/register 注册 Agent | 系统团队        | agent_id        |     |
| 4   | 在 D 系统 MCP Manager 中配置 MCP Server     | 系统团队        | MCP Server 配置完成 |     |
| 5   | 验证 Tools 加载成功                         | 系统团队 + 平台团队 | Tools 列表可见      |     |
| 6   | 在外部系统中配置告警推送（Webhook/MQ）              | 系统团队        | 告警可推送到 D 系统     |     |
| 7   | 端到端验证                                 | 系统团队 + 平台团队 | 完整链路可用          |     |
| 8   | 上线                                    | 系统团队 + 平台团队 | 正式接入            |     |


### 待确认事项


| 序号  | 事项                                      | 影响范围   | 当前状态 |
| --- | --------------------------------------- | ------ | ---- |
| 1   | 告警推送 API 的鉴权方式（API Key / OAuth / 内网白名单） | 所有接入系统 | 待确认  |
| 2   | 各系统开发团队的成员名单和权限管理方式                     | 告警通知目标 | 待确认  |
| 3   | 告警去重窗口时间（当前默认 5 分钟）是否需要按系统可配置           | 告警去重逻辑 | 待确认  |
| 4   | 是否需要告警升级机制（如 critical 告警 15 分钟未处理自动升级）  | 告警处理流程 | 待确认  |
| 5   | 告警会话是否需要与现有的 Expert Agent 会话共享会话列表      | 会话管理   | 待确认  |
| 6   | OS-Agent 降级时是否允许用户手动切换到系统专用 Agent       | 会话交互   | 待确认  |
| 7   | 告警历史数据的保留策略                             | 数据存储   | 待确认  |
| 8   | A 票同步创建的 A 系统鉴权方式（Service Token / OAuth）及超时失败处理策略 | A 票创建   | 待确认  |
| 9   | 当日 A 票的聚合维度：同 system + 同 assigner 算一张，还是仅按 system 聚合？ | A 票聚合逻辑 | 待确认  |
| 10  | A 票完成后 D 系统告警状态同步的时效要求                   | 状态联动   | 待确认  |



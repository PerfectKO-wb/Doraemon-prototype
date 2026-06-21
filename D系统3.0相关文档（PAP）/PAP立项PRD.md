# D系统3.0 · PAP（People · Agent · People）立项

| 文档信息 | 内容 |
|---|---|
| 当前版本 | v0.1 |
| 创建日期 | 2026/6/21 |
| 项目周期 | 待填写 |
| 是否资本化 | 待确认 |
| OA项目编号 | 待填写 |

---

## 原型链接

| 视图 | 适用角色 | 原型链接 |
|---|---|---|
| 通用员工视图 · Dispatch Center | 一线员工（客服 / 翻译官 / 运营等） | |
| 通用员工视图 · Finance | 财务员工 | |
| PAP Manager · 任务管理 | 决策者 | |
| PAP Manager · AI Center | 决策者 | |
| 翻译官视图 | 翻译官 | |
| 维护者视图 | 系统维护者 | |

---

## 1. 项目概述

### 1.1 项目背景

D 系统要成为「人 · AI Agent · 人」控制链的基础设施，从决策层开始，拆解任务，分发任务，并管理人类节点使用合适的工具高效完成工作。

当前 D 系统 2.0 的主要局限：

- 员工自行制定工作任务，工具散落各子系统（CS、Adnext、Auxin、i18n 等），切换成本高，容易遗漏
- AI Agent 能力（Minion / Admin Agent）已具备，但与人工步骤之间缺乏统一协作接口，AI 产出无法自然交接给下一个人或 Agent
- 决策者没有全局视图，团队目标进展、员工工作状态只能靠人工汇报获取
- 没有标准化渠道让 Agent 在执行过程中触达对应员工，信息传递依赖 IM，不可追溯

### 1.2 项目描述

**PAP（People · Agent · People）** 是 D 系统 3.0 的人机协作总线，覆盖三类角色：

**整体流程：**

\[决策者制定目标\] → \[PAP + Agent 拆解编排任务\] → \[一线员工接收并执行\] → \[Agent 辅助执行 / 请求人工介入\] → \[结果验收回流\] → \[决策者汇总监控\]

**核心转变：** 从「员工自行制定工作任务」转为「AI 根据岗位职责主动分派任务，并进行评估和验收」。

**项目涉及三个主要模块：**

1. **通用员工视图**：接收任务（操作型 / 审查型）、响应 Agent 请求（Dispatch Center）、任务引导与产出提交
2. **PAP Manager（决策者视图）**：制定目标、协同拆解、汇总监控各岗位员工与 Agent 工作情况
3. **Agent 编排层**：PAP 作为唯一 Trigger 源，读取 Mission Storybook 进行编排，路由给 Minion Agent / Admin Agent / 人工，并管理执行回调

### 1.3 项目有可能成功理由

| 字段 | 内容 |
|---|---|
| 已完成的原型 | 见顶部原型链接表 |
| 执行层已就绪 | Minion Agent（Auxin/Adnext API）与 Admin Agent（G123 Web）已具备操作能力，无需重做 API 集成 |
| 知识资产已有雏形 | `game-launch-checklist.yaml` 已结构化定义游戏上线全流程，可直接迁移为首个 Storybook |
| PAP 已存在 | 全员任务系统已上线，员工已接入统一任务总线，本项目是增量扩展 |
| 团队准备情况 | 产研测试人员待确认 |

---

## 2. OA 资本化立项信息

| 字段 | 内容 | 说明 |
|---|---|---|
| OA事件类型 | 资本立项 | 对应 OA 审批字段 |
| 是否资本化 | 待确认 | 对应 OA 审批字段 |
| OA项目编号 | 待填写 | 对应 OA「编号」 |
| 项目名称 | \[D系统\] PAP 人机协作总线 | 对应 OA「名称」 |
| 项目周期 | 待填写 | 对应 OA「项目周期」 |
| 项目描述 | 构建 D 系统 3.0 人机协作总线，覆盖通用员工视图、决策者视图与 Agent 编排层 | 对应 OA「描述」 |
| OA审批链接 | 待补充 | OA 流程创建后补充 |

---

## 3. 参与人员

| 角色 | 姓名/团队 | 职责 |
|---|---|---|
| 产品负责人 | | 输出 PRD、协调需求评审、跟进变更记录、排期 |
| 研发负责人 | | 产品方案确认 & 技术方案评估 |
| 前端研发 | | 前端页面及交互开发 |
| 后端研发 | | PAP 编排引擎、推送接口、callback 路由、消息持久化 |
| 测试负责人 | | 测试用例设计、测试执行、缺陷回归 |
| OA审批人 | | 完成资本立项审批 |
| 运维/发布负责人 | | 上线发布、回滚预案、发布记录维护 |

---

## 4. 预算信息

### 4.1 预算汇总

| 字段 | 内容 |
|---|---|
| 预算总额 | |
| 资本化金额 | |
| 非资本化金额 | |
| 预算类型 | 技术开发 |
| 预算归属部门 | tech |
| 预算确认人 | |
| 预算确认时间 | |

---

# 模块一：通用员工视图

## 1.1 功能概述

一线员工通过通用员工视图接收 PAP 分派的任务，响应 Agent 的协作请求，完成工作并提交产出。视图由三个区域构成：**Dispatch Center**（Agent 推送的消息与请求）、**To Do**（待执行的人工任务）、**Doing**（当前推进中的工作）。

## 1.2 入口与页面结构

| 区域 | 说明 |
|---|---|
| Dispatch Center | 嵌入主内容区，展示 Agent / 系统推送的消息与任务请求，有未处理消息时渲染，无消息时不显示 |
| To Do | 员工当前待执行的人工任务队列 |
| Doing | 员工正在推进中的工作，展示 A 票执行状态与任务引导 |
| 左侧固定 History 标签 | 始终可见，点击打开历史消息抽屉 |

## 1.3 Dispatch Center · 消息类型

Dispatch Center 接收四种类型的消息，类型决定交互方式：

| 类型 | 类型标识 | 说明 | 消费方式 |
|---|---|---|---|
| Status | `a-status` | 系统状态通知，只读告知 | 点击「Mark as read」→ 归档，记录 `Read` |
| Quick Action | `b-quick` | Agent 已完成分析，员工做一次授权决策 | 点击 execute / defer / escalate 按钮 → 触发 callback → 归档 |
| Chat Task | `c-chat` | 需员工通过多轮会话提供输入或确认 | 点击「Start Chat」→ 客户端标签页打开 Agent 会话 → 会话完成后归档，记录 `Chat done` |
| Jump Task | `d` | 需员工前往另一个系统操作 | 点击标题行 → 客户端标签页打开目标系统 → 归档，记录 `Jumped` |

## 1.4 Dispatch Center · Quick Action 按钮规范

Quick Action 的按钮由语义 Slot 决定样式和排列，label 允许自定义，最多 3 个：

| Semantic | 语义 | 排列位置 | 示例 label |
|---|---|---|---|
| `execute` | 主操作，立即执行，通常不可逆 | 最左 | Approve / Publish Now / Confirm |
| `defer` | 推迟处理 | 中间 | Schedule / Remind Me |
| `escalate` | 上报，转交决策者介入 | 最右 | Help |

`escalate` 路径通知决策者介入，原卡片挂起；其他按钮触发 PAP → callback → 创建方的执行链路。

## 1.5 Dispatch Center · 消息队列规则

- 同一时刻**只展示一条**消息卡片（最新或当前激活）
- 多条未处理消息时，标题旁显示红色数字徽标，点击徽标展开队列浮层，可切换激活消息
- 消费一条后自动展示下一条
- 左侧固定 History 图标标签始终可见，与消息是否存在无关

## 1.6 Dispatch Center · 历史抽屉

| 区域 | 内容 |
|---|---|
| 未处理（Unread） | 当前所有未消费消息，点击后激活为主区域当前卡片 |
| 已处理（按日期分组） | 已消费消息，记录操作动作（Approved / Help sent / Chat done / Jumped / Read） |
| 清空功能 | 支持一键清空已处理历史 |

## 1.7 Dispatch Center · 卡片状态

| 状态 | 说明 |
|---|---|
| 展示中 | 消息在主区域展示，等待用户消费 |
| 执行中 | Quick Action 点击后等待 callback 返回（显示 spinner） |
| 失败 | callback 返回 `failed`，卡片保留并显示错误态，等待人工处理或重试 |
| 已消费 | 卡片动画退出，写入历史 |

---

# 模块二：PAP Manager（决策者视图）

## 2.1 功能概述

决策者通过 PAP Manager 完成目标制定、任务监控和结果审核。视图分为两个子模块：**任务管理**（Mission 任务树 · 步骤状态追踪）和 **AI Center**（员工与 Agent 工作情况汇总）。

## 2.2 入口与页面结构

| 页面 | 说明 |
|---|---|
| PAP Manager · 任务管理 | 展示 Mission 列表与单 Mission 的步骤任务树，支持发布目标、协同拆解、审核验收 |
| PAP Manager · AI Center | 汇总展示各岗位员工工作情况和各 Agent 运行情况 |

## 2.3 任务管理 · 功能说明

**Mission 任务树**：展示 Mission 下所有步骤的层级结构，每个步骤包含：

| 字段 | 说明 |
|---|---|
| 步骤名称 | 来自 Storybook 定义 |
| 负责方 | `@minion` / `@admin` / `@角色名` |
| 状态 | To do / Running / Need Input / Review / Done / Failed |
| 依赖关系 | 前置步骤完成后方可开始，视觉标注依赖链 |

**Need Input / Review 状态**：Minion 执行过程中需要人工介入的步骤会标注对应状态，决策者可通过 hover tooltip 查看「谁在等 · 等什么」，点击后跳转至对应会话。

**核心操作：**

1. 发布 Mission：填写目标、类型、上线日期等输入参数 → PAP 加载 Storybook 生成执行计划
2. 协同拆解：对 Agent 无法自动判断的步骤提供决策输入
3. 验收确认：对 `confirm_by` 指向决策者的步骤进行最终审核

## 2.4 AI Center · 功能说明

| 模块 | 内容 |
|---|---|
| 员工工作情况 | 按岗位/员工查看任务完成率、工作量、延误情况 |
| Agent 运行情况 | 查看各 subagent 的执行状态、成功率、耗时、异常 |

---

# 模块三：Agent 编排层

## 3.1 功能概述

PAP 作为唯一 Trigger 源和人机任务总线，根据 Mission Storybook 生成结构化执行计划，按 `route` 路由给 Minion Agent / Admin Agent / 相关人员，并管理全链路的执行回调与状态推进。

## 3.2 路由规则

| 路由标记 | 执行者 | 负责范围 |
|---|---|---|
| `@minion` | Minion Agent | 涉及 Auxin / Adnext 的任务 |
| `@admin` | Admin Agent | 涉及 G123 Web 的任务 |
| `@<role>` | 相关负责人（人） | 没有任何 Agent 能做的任务（原创设计 / 外部沟通 / 最终业务判断等） |

路由决策完全由 Storybook 中每个 Step 的 `route` 字段声明，PAP 不做隐式推断。

## 3.3 Subagent 执行闭环

1. 接收 PAP 派发的步骤（route + skill + 参数 + 依赖）
2. 读取 Skill Knowledge Card，判定依赖与信息是否齐全
   - **信息齐全**：直接调用接口执行
   - **缺信息**：反向在 PAP 建任务，向对应员工请求补充（通过 Dispatch Center 推送 Chat Task / Quick Action）
3. 员工在 PAP 提交信息后回调给 subagent，subagent 收齐后执行
4. 执行完成后，通过 PAP 请 `confirm_by` 指定的确认人验收
5. 确认通过后，subagent 通知 PAP Task Done，PAP 推进 Mission 进度

## 3.4 PAP ↔ Subagent 接口契约

| 方向 | 内容 | 载体 |
|---|---|---|
| PAP → subagent | 派发步骤（route + skill + 参数 + 依赖） | PAP 派发接口 |
| subagent → PAP | 反向建人工任务，请求补足信息 | PAP 任务创建 API |
| PAP → subagent | 回调补足信息 / 确认结果 | callback Webhook |
| subagent → PAP | Task Done / failed 通知 | PAP 状态更新接口 |

## 3.5 知识层：Mission Storybook + Skill Knowledge Card

| 层级 | 名称 | 读取方 | 作用 |
|---|---|---|---|
| 第 1 层 | Mission Storybook | PAP 中枢 | 定义做什么、路由给谁、依赖顺序、验收规则 |
| 第 2 层 | Skill Knowledge Card | subagent | 定义怎么做、需要什么输入、缺信息找谁、完成后找谁确认 |

首个 Mission：游戏上线（复用并迁移现有 `game-launch-checklist.yaml`）。

---

## 5. 范围说明

### In scope（Phase 1）

- 通用员工视图：Dispatch Center 四种消息类型 · 消息队列 · 历史抽屉
- 通用员工视图：To Do / Doing 区域（接收任务 · 提交产出 · 执行引导）
- PAP Manager：Mission 任务树 · 步骤状态追踪（含 Need Input / Review 交互态）
- Agent 编排层：Trigger · Storybook 编排 · 路由派发 · 依赖推进 · subagent 执行闭环
- 首个端到端 Mission：游戏上线

### Out of scope（后续）

- 维护者视图（Works / Tools / Agents / Logs）
- 工作过程监控（客服在 CS 系统的行为采集）
- 员工工作量汇报 Dashboard
- 移动端适配
- Workflow 自学习

---

## 6. 风险与待确认事项

| 风险 | 等级 | 应对 |
|---|---|---|
| PAP API 不支持程序化建任务 / callback / 确认 | 高 | Phase 0 优先验证 PAP 接口能力，必要时推动扩展 |
| subagent 反向摇人闭环状态机复杂 | 中 | 明确超时、重试、取消语义；先在游戏上线单 Mission 跑通 |
| PAP 缺少服务端实时推送能力 | 中 | 评估 WebSocket / SSE 接入成本，Phase 1 可降级为轮询 |
| Quick Action callback 超时 / 失败处理 | 中 | 明确 failed 态卡片行为（保留 + 错误提示 + 重试入口） |
| Knowledge Card 与真实接口漂移 | 中 | 建立定期对账机制 |

**待确认：**

- `route: "@<role>"` 中角色到具体人的映射在哪维护（PAP 组织架构 or Storybook）？
- 消息的 TTL 由创建方声明还是 PAP 统一配置？超时未响应后如何处理？
- 是否资本化，项目周期如何定义？
- 各视图的研发优先级与排期？

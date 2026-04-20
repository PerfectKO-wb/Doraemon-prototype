

| 项目名称 | Tech Table 状态变更自动通知用户功能 |
|------|-------------------------|
| 文档版本 | v3.0                    |
| 创建日期 | 2026年3月5日               |
| 修改记录 |                         |


---

## 一、背景

### 1. 现状

系统中有一个需求/bug反馈表（Tech Table），围绕用户反馈（bug / suggestion）形成了以下协作链路

| 角色  | 载体  | 说明  |
|-----|-----|-----|
| 用户 ↔ AI | CTW BOT用户会话（后续简称会话1）） | 用户在此与 AI 对话，提出问题、反馈 bug 或建议 |
| AI ↔ 内部专家 | Tech Expert咨询会话 （后续简称会话2） | AI 识别到 bug/suggestion 后自动创建，用于 AI 与产品/技术专家交流，用户不在此会话中 |
| 内部专家 | Tech Table（Tech问题反馈记录表） | AI 同步将 bug/suggestion 记录到 Tech Table，供技术部门统一管理 |

**当前信息流转路径**：

```
用户在会话1提出问题
    │
    ▼
AI 意图识别：bug / suggestion
    │
    ├──▶ 创建会话2（AI ↔ 内部专家）
    │
    └──▶ 在 Tech Table 创建记录（默认状态: pending）

内部专家在会话2中回复
    │
    ▼
AI 在会话1中将专家反馈转达给用户  ✅ 已实现

内部专家在 Tech Table 中修改记录状态
    │
    ▼
用户在会话1中收到状态变更通知      ❌ 未实现（本次需求）
```

**Tech Table 状态定义**：

| 状态  | 含义  | 创建时默认 |
|-----|-----|-------|
| `pending` | 待处理 / 暂时搁置 | **是**（创建记录时默认）⚠️ 本次修改 |
| `in-progress` | 处理中 | 否     |
| `completed` | 已完成 | 否     |
|  `reject`  | 已拒绝 / 不处理 | 否     |

> **==Bug Fix==**：***当前线上版本创建记录时默认状态为*** `***in-progress***`***，不符合实际业务流程——新记录尚未被专家评估和排期，应为*** `***pending***`***（待处理）。本次同步修正为*** `***pending***`***。***

**Tech Table 字段定义**：

| 字段名 | 含义  | 数据类型 | 消息模板中的作用 |
|-----|-----|------|----------|
| `system_name` | suggestion 或 bug 所属系统 | 标签   | 提供系统上下文，帮助用户识别是哪个系统的问题 |
| `issue_details` | 问题描述（由 AI 归纳） | 文本   | 作为消息中的问题摘要，帮助用户回忆反馈内容 |
| `solution` | 处理方案。首次由 AI 填充（如委派信息），后期可由专家修改为实际解决方案 | 文本   | 在 completed 通知中展示处理结果。**注意**：内容可能包含内部信息（专家姓名、内部邮箱等），发送给用户前需脱敏处理 |
| `issue_source` | 会话 2（咨询会话）的链接 | 链接   | 用于关联 Tech Table 记录 → 会话 2 → 会话 1，实现通知目标定位 |
| `submitter` | 提交人邮箱 | 邮箱   | 用于辅助定位提交问题的用户及其会话 1 |
| `issue_type` | 问题类型 | 枚举：`suggestion` / `bug` | 决定消息措辞："您反馈的问题" vs "您提出的建议" |
| `update_time` | 记录更新时间（任何字段编辑均更新） | 时间戳  | 轮询方案中用于检测记录变更 |
| `assignees` | 处理人信息。默认为空，人工维护 | 文本   | 可在通知中展示处理人信息（如已指定） |
| `status` | 记录状态 | 枚举：`pending` / `in-progress` / `completed`/`reject` | 核心监听字段，状态变更触发通知流程 |
| `expected_golive_date` | 预计上线时间。专家将状态改为 `in-progress` 时填写 | 日期 / 文本（支持选择具体日期"或者为空）<br>teable支持日期选择器 |  ⚠️ **==本次新增==**。在 → `in-progress` 通知中告知用户预计时间；值为"空"时告知用户正在排期  |

 

### 2. 痛点

* 用户提交 bug/suggestion 后，仅在专家通过会话 2 主动回复时才能收到反馈。如果专家只在 Tech Table 中更新了状态而未在会话 2 中回复，用户将无法获知问题的最新进展

### 3. 实现思路

在 Tech Table 状态变更时，自动向用户的会话 1 发送轻量状态通知消息。

**核心设计原则**：

* **仅前进通知，回退线下处理**：只在状态向前推进时（→ in-progress、→ completed）自动通知用户；状态回退由处理人通过钉钉/线下方式联系
* **AI 驱动消息生成**：不使用固定模板拼接，而是将 Tech Table 字段信息作为上下文提供给 AI，由 AI 根据用户语言生成通知消息，支持国际化

  


---

## 二、目标

1、用户反馈闭环率

2、用户主动追问率下降

3、用户对处理进度的感知满意度提升


---

## 三、需求

### 1. 功能范围

* **触发源**：Tech Table 中记录的状态字段（`pending` / `in-progress` / `completed`/`reject`）发生变更
* **通知目标**：该记录对应的用户会话（CTW Bot会话 1）
* **通知形式**：AI 以对话消息的形式在会话 1 (CTW BOT会话)中发送通知，保持与现有会话体验一致

  

### 2. 功能需求清单

#### 2.1 状态变更监听

| 需求项 | 说明  |
|-----|-----|
| 监听范围 | 仅监听 Tech Table 中状态字段的变更，其他字段变更不触发通知 |
| 无效变更过滤 | 1、状态未实际发生变化（如 `in-progress` → `in-progress`）不发消息<br>2、状态回退（例如`completed`→`in-progress`）不发消息<br>3、终态变更（例如`completed` → `reject`）不发消息 |
| 2、状态回退的情况 |     |

#### 2.2 新增字段

1、在Tech Table中新增字段`expected_golive_date`，字段含义是预期上线时间，格式为时间，通过steable原生的日期选择器选择时间
2、在Tech Table中新增字段`create_time`

#### 2.3 通知决策引擎

#### 状态变更通知策略

**设计原则**：

* **所有回退不通知**：状态回退（completed/reject → 其他、in-progress → pending）由处理人通过钉钉或线下方式联系 submitter
* **仅前进方向和终态决策通知**：在状态向前推进（→ in-progress、→ completed）或做出终态决策（→ reject）时通知用户

| 状态变更方向 | 是否通知用户 | 说明  |
|--------|--------|-----|
| `pending` → `in-progress` | **是**  | 问题开始处理，告知用户预计上线时间（`expected_golive_date`） |
| `pending` → `completed` | **是**  | 问题直接完成（bug: 告知已修复；suggestion: 告知方案结论） |
| `in-progress` → `completed` | **是**  | 最核心场景：问题已解决 |
| `pending` → `reject` | **是**  | 问题评估后拒绝，告知用户拒绝原因（`solution` 字段） |
| `in-progress` → `reject` | **是**  | 处理中转为拒绝，告知用户拒绝原因 |
| `in-progress` → `pending` | **否**  | 状态回退，由处理人线下联系 |
| `completed` → `in-progress` | **否**  | 状态回退，由处理人通过钉钉/线下联系 submitter |
| `completed` → `pending` | **否**  | 状态回退，由处理人通过钉钉/线下联系 submitter |
| `reject` → `pending` | **否**  | 重新打开，由处理人线下联系 |
| `reject` → `in-progress` | **否**  | 重新打开并处理，由处理人线下联系 |
| `reject`→`completed` | **否**  | 终态切换，由处理人线下联系 |
| `completed`→`reject` | **否**  | 终态切换，由处理人线下联系 |

#### 2.4 消息生成（AI 驱动）

#### AI 消息生成方案

| 需求项 | 说明  |
|-----|-----|
| 生成方式 | 将 Tech Table 字段信息作为结构化上下文提供给 AI，由 AI 生成面向用户的通知消息 |
| 语言适配 | AI 使用 submitter 的**语言**回复 |
| 消息长度 | 控制在 3-5 句话以内，简洁明了 |
| 消息开头 | 统一以"问题跟踪状态更新"（或对应语言的等价表述）作为消息标识 |


####  AI System Prompt 示例

```
Rules:
1. Reply in the user's language
2. Start with a status update identifier (e.g., "Issue tracking status update:" in the appropriate language)
3. Keep the message to 3–5 sentences, professional and friendly
4. NEVER include internal process descriptions
5. NEVER fabricate information not present in the provided context
6. If a context field is empty or not provided, simply omit that information from the message. Do NOT mention that information is missing or unavailable.
7. Only when the new status is in-progress AND expected golive date is provided, include the expected golive date.
8. If the issue type is bug AND the new status is NOT reject, do NOT use or mention the solution field.
9. When the new status is reject, use the solution field as the rejection reason if provided. Be tactful and objective — do not use harsh wording like "rejected". Prefer phrasing such as "will not be addressed at this time" or "not planned for implementation".

Context:
Issue type: {issue_type}
- System: {system_name}
- Issue description: {issue_details}
- New status: {new_status}
- Expected golive date: {expected_golive_date}
- Solution: {solution}
```

```
规则：
1.使用用户的语言进行回复。
2.以状态更新标识开头（例如：问题跟踪状态更新：）。
3.消息控制在 3–5 句话，专业且友好。
4.严禁包含内部流程说明。
5.严禁编造上下文未提供的信息。
6.若上下文字段为空或未提供，直接在消息中省略该信息即可，不要提及信息缺失或不可用。
7.仅当新状态为处理中，且已提供预计上线日期时，才在消息中包含预计上线日期。
8.若问题类型为缺陷（bug），且新状态不是驳回，则不得使用或提及解决方案字段。
9.若新状态为驳回，且已提供解决方案字段，则将其作为驳回原因。表述需委婉、客观，不使用 “驳回” 等生硬措辞，优先使用「当前暂不处理」或「暂无实施计划」等表达。
上下文：
- 问题类型：{issue_type}
- 系统：{system_name}
- 问题描述：{issue_details}
- 新状态：{new_status}
- 预计上线日期：{expected_golive_date}
- 解决方案：{solution}
```





---

## 附录

### 测试场景罗列

| `issue_type` | new_statues |  情况说明 |
|------------|-------------|-------|
| bug        | in-progress | 1、`expected_golive_date`为空2、`solution`为空3、`expected_golive_date`、`solution`都为空4、`expected_golive_date`、`solution`都有 |
| bug        | completed   | 1、`expected_golive_date`为空2、`solution`为空3、`expected_golive_date`、`solution`都为空4、`expected_golive_date`、`solution`都有 |
| bug        | reject      | 1、`expected_golive_date`为空2、`solution`为空3、`expected_golive_date`、`solution`都为空4、`expected_golive_date`、`solution`都有 |
| suggesttion | in-progress | 1、`expected_golive_date`为空2、`solution`为空3、`expected_golive_date`、`solution`都为空4、`expected_golive_date`、`solution`都有 |
| suggesttion | completed   | 1、`expected_golive_date`为空2、`solution`为空3、`expected_golive_date`、`solution`都为空4、`expected_golive_date`、`solution`都有 |
| suggesttion | reject      | 1、`expected_golive_date`为空2、`solution`为空3、`expected_golive_date`、`solution`都为空4、`expected_golive_date`、`solution`都有 |

### 待确认事项

| 序号  | 事项  | 影响范围 | 当前状态 |
|-----|-----|------|------|
|     |     |      |      |
|     |     |      |      |
|     |     |      |      |
|     |     |      |      |
|     |     |      |      |
|     |     |      |      |
|     |     |      |      |
|     |     |      |      |



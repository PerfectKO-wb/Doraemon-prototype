# OA 自动创建与 Chat 确认流程设计

> 适用模块：F-PAP-PAYMENT-REQUEST / F-PAP-PAYMENT-REVIEW / F-PAP-VOUCHER-COLLECTION  
> 状态：设计确认中  
> 最后更新：2026-04-29

---

## 一、背景与目标

系统中存在大量待打款的 Invoice（Non-Administrative，JP/US/SG）和待报销的 Voucher（Administrative，CN/TW）。实际打款前需先提交 OA 申请，经领导审批后财务方可执行打款。

**目标**：设计一套规则，每月固定时间自动扫描符合条件的 Invoice & Voucher，按类型和地区分批生成 OA 草稿，并通过 F Expert Chat 让相关人员完成二次确认后自动提交。

---

## 二、单据 ID 规则

### 2.1 ID 格式

```
{前缀}-{年月}-{四位序号}
```

| 单据类型 | 前缀 | 示例 |
|---|---|---|
| Invoice | `INV` | `INV-202604-0001` |
| Voucher | `VCH` | `VCH-202604-0001` |

**规则说明：**
- 年月取单据上传时间，格式 `YYYYMM`（如 `202604` = 2026年4月）
- 序号为当月当类型的流水号，补零至四位（`0001`、`0002` …）
- 跨月不重置前缀，仅序号在各月独立计数

### 2.2 ID 在各模块的展示位置

| 模块 | 展示位置 |
|---|---|
| Invoice Collection（收票页） | 列表 ID 列 |
| Invoice Review（审核页） | 列表 ID 列 |
| Voucher Collection（凭证收集页） | 列表 ID 列 |
| OA Chat 确认页 | OA Draft 正文 Content 表格、自然语言操作指令 |

---

## 三、定时批处理规则

### 3.1 触发时间

```
每月 5 日 和 20 日，10:00（UTC+8 绝对时间）
```

各办公室本地对应时间：

| 办公室 | 时区 | 本地时间 |
|---|---|---|
| 中国（上海） | UTC+8 | 10:00 |
| 台北 | UTC+8 | 10:00 |
| 日本（东京） | UTC+9 | 11:00 |
| 纽约（EDT） | UTC-4 | 前日 22:00（异步，不影响流程） |

> 系统定时任务使用统一绝对时间（UTC+8 10:00），无需按地区拆分调度。OA 创建为异步通知，各地区审批人在本地工作时间处理即可。

### 3.2 扫描条件

满足以下**全部三个条件**的记录进入本次批处理：

```
state         = checked          （已通过财务审核）
oaState       = pending_init     （尚未发起 OA）
payoutRequired = yes             （需要打款）
```

> `oaState = not_required` 的记录明确排除在外，不得误创建 OA。

### 3.3 分组规则

按 **paymentType → region → currency** 三层分组，每个非空分组生成一个 OA：

```
Administrative（行政类）—— 仅 CN / TW
├── CN  →  1 个 OA（RMB）
└── TW  →  1 个 OA（TWD）

Non-Administrative（非行政类）—— JP / US / SG
├── JP  →  1 个 OA（JPY）
├── US  →  1 个 OA（USD）
└── SG  →  1 个 OA（SGD）
```

- 每次触发最多产生 **5 个 OA**，空分组跳过不创建。
- **同一 OA 内不允许跨币种汇总**，currency 作为硬性分组边界。

#### paymentType 枚举映射

由于 Invoice 和 Voucher 的 paymentType 枚举不一致，系统在扫描时需做以下映射：

| 来源 | 原始值 | 映射为 |
|---|---|---|
| Invoice | `Administrative` / `Non-Administrative` | 保持不变 |
| Voucher | `admin` | `Administrative` |
| Voucher | `business` / `project` | `Non-Administrative` |

### 3.4 OA 草稿字段填充规则

| OA 字段 | 填充逻辑 |
|---|---|
| `type` | 按 paymentType 默认映射（见下方 §3.5） |
| `office` | 分组对应的 region（Tokyo / New York / Singapore / …） |
| `department` | 默认填入 `Management-Finance` |
| `currency` | 分组统一币种 |
| `amount` | 组内所有条目金额求和（同币种） |
| `content` | 组内所有 Invoice / Voucher 的明细表格（ID、Currency、Amount、Payee Name、Bank Name） |
| `estPayDay` | 触发日 + 15 天（默认，可在 Chat 中调整） |
| `applicant` | 系统账号（auto-created） |
| `state` | `draft`（草稿，未正式提交） |

### 3.5 OA Type 默认映射

```
Administrative（CN / TW）   →  総務備品購入
Non-Administrative（JP / US / SG）  →  共通経費（默认，可在 Chat 确认阶段覆盖）
```

可选类型（与现有 OA 系统枚举保持一致）：`共通経費` / `IT 外部サービス` / `総務備品購入`

### 3.6 生成后的状态变更

```
OA 草稿创建成功
    ↓
暂不变更 Invoice / Voucher 的 oaState（维持 pending_init）
    ↓
系统在 F Expert 创建 Chat 确认会话（见第四章）
    ↓
等待人工 confirm 后正式提交
```

> OA 草稿阶段 oaState 不变更，确认提交后才统一更新为 `in_review`，避免误操作导致状态污染。

---

## 四、Chat 确认流程

### 4.1 会话入口与标识

OA 确认会话统一展示在 F Expert 侧边栏，入口样式如下：

- **标题**：OA ID，格式为 `OA-{YYYY}-{MMDD}`（例：`OA-2026-0410`）
- **副标题**：`OA confirm`
- **状态徽章**：`PENDING`（黄色，草稿待确认）/ `IN REVIEW`（蓝色，已提交审批中）
- **通知图标**：Bell icon + 未读计数徽章，右上角展示

> 会话入口不展示分组标签、条目数、地区、币种等细节信息，所有内容在 Chat 线程中查看。

### 4.2 系统初始消息格式（Markdown 渲染）

系统自动生成的 OA 草稿在 Chat 中以 Markdown 格式展示，**不以卡片组件形式渲染**：

```markdown
#### [OA Draft]

---

| 字段 | 内容 |
|---|---|
| Type | 共通経費 |
| Office | Tokyo |
| Content | （见下方明细表） |
| Currency | JPY |
| Amount | ¥448,500 |
| Estimated Payment Date | 2026/04/10 |
| 所在部门 | Management-Finance |

**Content 明细：**

| ID | Currency | Amount | Payee Name | Bank Name |
|---|---|---|---|---|
| INV-202604-0006 | JPY | 128,500 | クラウドワークス株式会社 | 三井住友銀行 |
| INV-202604-0008 | JPY | 320,000 | 戦略コンサル合同会社 | みずほ銀行 |
```

**字段顺序**：Type → Office → Content → Currency → Amount → Estimated Payment Date → 所在部门

### 4.3 AI 支持的自然语言操作

所有交互**仅通过 Chat 输入框**完成，不提供额外按钮。

| 操作类型 | 示例输入 | AI 执行动作 |
|---|---|---|
| **移除条目** | "把 INV-202604-0006 移出" | 从草稿移除该条目，更新合计金额，在同一条回复中输出操作说明 + 完整新 OA Draft |
| **补充条目** | "把 INV-202604-0011 加进来" | 校验条目条件，满足则加入，更新合计，在同一条回复中输出操作说明 + 完整新 OA Draft |
| **修改 OA 类型** | "OA 类型改成 IT 外部サービス" | 更新草稿 `type` 字段，在同一条回复中输出修改说明 + 完整新 OA Draft |
| **确认提交** | "confirm" / "没问题" / "提交" / "LGTM" | 触发正式提交（见 §4.4） |
| **查询当前内容** | "现在包含哪些？" | 输出当前草稿完整明细 |

#### 历史消息不可变原则

每次操作后 AI 追加**新的 OA Draft 消息**，历史消息中的 OA Draft 内容保持原样（快照不可变），记录操作轨迹。

#### 补充条目的前置校验

AI 在执行「补充条目」前需验证：
1. 该条目 `state = checked`
2. 该条目 `oaState = pending_init`
3. 该条目 `region` 和 `currency` 与当前 OA 一致（不允许跨地区/跨币种合并）

校验失败时，AI 说明具体原因，不执行添加。

### 4.4 确认提交后的自动动作

```
用户发送 confirm（或等效语义）
    ↓
1. OA state: draft → in_review（正式提交至审批系统）
2. 所有关联 Invoice / Voucher 的 oaState → in_review
3. 关联 activeOaId → 本 OA 的 ID
4. Chat 会话状态徽章更新为 IN REVIEW，变为只读存档
5. 通知对应 region 的审批人（发送审批请求）
6. 记录操作日志（提交人、提交时间、最终条目列表）
```

### 4.5 超时未确认处理

| 时间节点 | 动作 |
|---|---|
| 草稿创建后 **24 小时** 未有任何回复 | Chat 中发送提醒消息，再次 @相关人员 |
| 草稿创建后 **48 小时** 仍未 confirm | 升级通知至上级，标记为「待处理超时」|
| 下一个触发周期（5日/20日）到来时 | 重新扫描，若该草稿仍为 draft 则提示冲突，需人工处理 |

---

## 五、紧急 OA（Chat 手动触发）

支持在非定时触发时间通过 Chat 手动发起单笔紧急 OA，规则如下：

```
触发方式：在 F Expert Chat 中发出指令
         例："帮我给 INV-202604-0006 紧急发起 OA"
前置条件：
  ├── 人工指定 Invoice / Voucher ID（不触发全量扫描）
  ├── oaState 必须为 pending_init（已在 in_review 的不可重复提交）
  └── 需填写紧急理由（reason 字段，必填）
生成后：
  ├── OA 打标记 urgent = true
  └── 审批人收到高优先级通知
```

---

## 六、数据状态流转总览

```
Invoice / Voucher 状态机（oaState 维度）：

  pending_init
      │
      ├─── 定时批处理 / 手动触发 ──→  [OA 草稿创建，oaState 暂不变]
      │                                        │
      │                              Chat 确认 confirm
      │                                        │
      └───────────────────────────────→  in_review
                                               │
                              ┌────────────────┴──────────────────┐
                              ↓                                    ↓
                           approved                            rejected
                         （可执行打款）                   （oaState 回退至 pending_init，
                                                           下次批处理重新纳入）
```

---

## 七、边界情况说明

| 情况 | 处理方式 |
|---|---|
| 本次扫描结果为空（无符合条目） | 不创建 OA，记录日志"本次扫描无符合条目" |
| OA 被审批人驳回（rejected） | 关联条目 oaState 回退至 `pending_init`，下一个批处理周期自动重新纳入 |
| 同一条目被重复加入两个草稿 | 系统校验 oaState，`pending_init` 才可加入；加入后立即锁定（逻辑标记），防并发冲突 |
| 月末临时提交的条目（截止后才审核通过） | 自动纳入下一个批处理周期（5日或20日） |
| Chat 中调整后合计金额为 0 | 系统提示"当前 OA 无有效条目"，阻止提交，提示关闭或重新添加 |
| Chat 操作移除条目后历史消息 | 历史 OA Draft 保持原始快照不变，仅新追加的消息反映最新状态 |

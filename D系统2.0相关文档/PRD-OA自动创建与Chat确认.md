| 项目名称 | OA 自动创建与 Chat 确认系统 |
| --- | --- |
| 文档版本 | v1.1 |
| 创建日期 | 2026年4月29日 |
| 修改记录 | 2026-04-29 初始版本；2026-04-29 v1.1 统一单据 ID 格式（INV/VCH-YYYYMM-NNNN）、OA Draft 改为 Markdown 渲染、确认交互移除操作按钮、历史消息快照不可变机制 |

---

## 一、背景

### 1. 现状

Doraemon D 系统中，Finance 团队每月需处理来自 JP / US / SG / CN / TW 多个地区的 Invoice 和 Voucher 付款申请。当前流程中，Invoice / Voucher 审核通过后，财务人员需手动判断是否需要发起 OA 申请、手动汇总金额、逐笔填写 OA 表单，每月重复操作耗时且易出错。

### 2. 痛点

- **人工扫描低效**：财务人员需逐条核对 Invoice / Voucher 状态，判断是否符合打款条件，无自动化筛选机制
- **汇总易错**：跨地区、跨币种金额手动求和，合计金额和归类容易出错
- **流程依赖人工记忆**：OA 申请的发起时间和内容完全依赖个人记忆与推动，无系统提醒，容易遗漏批次
- **审批链路启动慢**：从 Invoice 审核完成到 OA 提交进入审批，中间缺少自动衔接，导致打款周期被拉长

### 3. 实现思路

在 D 系统中构建一套「定时批处理 → OA 草稿自动生成 → Chat 自然语言确认」的完整自动化链路：

1. 每月固定时间，系统自动扫描符合打款条件的 Invoice 和 Voucher，按 paymentType / region / currency 三层规则分组
2. 每个分组自动生成 OA 草稿并填充关键字段（金额、单据明细、预计打款日等）
3. 系统在 F Expert 创建 Chat 确认会话，将 OA 草稿以 Markdown 形式推送给财务专员
4. 财务专员在 Chat 中通过自然语言完成调整与确认，系统解析指令后提交 OA 进入审批流程

**核心设计原则**：

- **全程无需打开表单**：OA 草稿由系统自动填充，人工仅需在 Chat 中确认或微调
- **Chat 作为唯一操作入口**：所有条目增删、类型修改均通过自然语言在 Chat 中完成，不提供额外操作按钮
- **历史快照不可变**：每次调整追加新 OA Draft 消息，历史记录保持原始快照，完整保留操作轨迹

---

## 二、目标

1. OA 草稿覆盖率 ≥ 95%，符合条件的 Invoice / Voucher 均被正确纳入对应 OA 分组
2. 财务人员单次 OA 确认耗时 ≤ 3 分钟（从查看草稿到发送 confirm）
3. OA 草稿生成后 48 小时内提交率 ≥ 80%
4. AI 自然语言操作解析准确率 ≥ 90%（移除、添加、修改类型指令）
5. 误创建 OA（`oaState = not_required` 被纳入）发生次数为 0

---

## 三、整体流程

### 3.1 端到端流程

```
每月 5日 / 20日  10:00（UTC+8）
    │
    ▼
系统扫描 Invoice & Voucher
  ├── state = checked
  ├── oaState = pending_init
  └── payoutRequired = yes
    │
    ▼
按 paymentType → region → currency 三层分组
  ├── Administrative / CN  →  CN-RMB 组
  ├── Administrative / TW  →  TW-TWD 组
  ├── Non-Administrative / JP  →  JP-JPY 组
  ├── Non-Administrative / US  →  US-USD 组
  └── Non-Administrative / SG  →  SG-SGD 组（空分组跳过）
    │
    ▼
每组生成 OA 草稿（state = draft），oaState 暂不变更
    │
    ▼
在 F Expert 创建 Chat 确认会话，推送 Markdown OA Draft，@财务专员
    │
    ▼
财务专员查看草稿，[可选] 通过自然语言调整（移除条目 / 加入条目 / 改类型）
    │
    ▼
财务专员发送「confirm」
    │
    ▼
系统正式提交 OA（state: draft → in_review）
  ├── 所有关联 Invoice/Voucher oaState → in_review
  ├── 关联 activeOaId → 本 OA ID
  ├── Chat 会话状态徽章更新为 IN REVIEW，变为只读存档
  └── 通知对应 region 审批人
    │
    ▼
审批通过 → Invoice/Voucher oaState → approved → 可执行打款
```

### 3.2 定时批处理触发时间

各办公室本地对应时间（系统统一使用 UTC+8 绝对时间）：

| 办公室 | 时区 | 本地时间 |
| --- | --- | --- |
| 中国（上海）/ 台北 | UTC+8 | 10:00 |
| 日本（东京） | UTC+9 | 11:00 |
| 纽约（EDT） | UTC-4 | 前日 22:00（异步，不影响流程） |

### 3.3 Chat 确认流程

```
系统推送 OA Draft（Markdown 格式，含 Type / Office / Content 明细表 / Currency / Amount / 预计打款日 / 所在部门）
    │
    ▼
财务专员查看草稿
    │
    ├── 无需调整 → 直接发送「confirm」
    │
    └── 需要调整 → 自然语言操作：
          ├── "把 INV-202604-0006 移出" → 移除该条目，系统追加更新说明 + 新 OA Draft（单条回复）
          ├── "把 INV-202604-0011 加进来" → 校验后加入，追加新 OA Draft
          └── "OA 类型改成 IT 外部サービス" → 更新 type，追加新 OA Draft
    │
    ▼
发送「confirm」/ 「没问题」/ 「LGTM」/ 「提交」
    │
    ▼
系统提交 OA，状态流转，通知审批人
```

---

## 四、需求

### 1. 功能范围

| 范围 | 说明 |
| --- | --- |
| 触发源 | 系统定时任务（每月 5日/20日 UTC+8 10:00） |
| 处理单据 | 已通过财务审核（state = checked）、尚未发起 OA（oaState = pending_init）、需打款（payoutRequired = yes）的 Invoice 和 Voucher |
| 操作入口 | F Expert Chat 会话，财务专员通过自然语言完成 OA 确认与提交 |

### 2. 功能需求清单

### 2.1 单据 ID 规范

| 需求项 | 说明 |
| --- | --- |
| ID 格式 | `{前缀}-{YYYYMM}-{四位序号}`，Invoice 前缀为 `INV`，Voucher 前缀为 `VCH`；示例：`INV-202604-0001`、`VCH-202604-0001` |
| 年月规则 | 取单据上传时间的年月，格式 `YYYYMM` |
| 序号规则 | 当月当类型连续流水号，左填零至四位（0001、0002 …） |
| 展示位置 | Invoice Collection 列表、Invoice Review 列表、Voucher Collection 列表及 OA Chat Draft Content 表格统一展示 |
| AI 解析兼容 | AI 自然语言操作中引用的 ID 需兼容新格式（`INV-202604-0006`），正确提取末尾数字序号 |

### 2.2 定时批处理

| 需求项 | 说明 |
| --- | --- |
| 触发时间 | 每月 5 日和 20 日，10:00 UTC+8（绝对时间，误差 ≤ 60 秒） |
| 扫描条件 | `state = checked` AND `oaState = pending_init` AND `payoutRequired = yes`，三条件全部满足方纳入 |
| 排除条件 | `oaState = not_required` 的记录严格排除，不得误创建 OA |
| 分组规则 | 按 `paymentType → region → currency` 三层分组，每组生成一个 OA，最多 5 个；空分组跳过，不创建 OA |
| paymentType 映射 | Voucher 的 `admin → Administrative`；`business / project → Non-Administrative`；Invoice 保持原值不变 |
| 补偿机制 | 触发后 5 分钟内未检测到执行记录，自动重试，最多 3 次 |

### 2.3 OA 草稿生成

| OA 字段 | 填充逻辑 |
| --- | --- |
| `type` | Administrative → `総務備品購入`；Non-Administrative → `共通経費`（默认，可在 Chat 中修改） |
| `office` | 分组对应城市名（Tokyo / New York / Singapore / Shanghai / Taipei） |
| `department` | 默认 `Management-Finance` |
| `currency` | 分组统一币种 |
| `amount` | 组内所有条目金额求和（同币种，使用整数分运算避免浮点误差） |
| `content` | 组内所有单据明细表格：`ID \| Currency \| Amount \| Payee Name \| Bank Name` |
| `estPayDay` | 触发日 + 15 天 |
| `state` | `draft`（草稿，未正式提交） |

OA 草稿创建后，关联 Invoice / Voucher 的 `oaState` 保持 `pending_init` 不变，confirm 提交后统一更新，避免误操作导致状态污染。

### 2.4 Chat 确认会话

| 需求项 | 说明 |
| --- | --- |
| 会话标题 | OA ID，格式 `OA-{YYYY}-{MMDD}`，示例：`OA-2026-0410` |
| 会话副标题 | `OA confirm` |
| 状态徽章 | `PENDING`（黄色）草稿待确认；`IN REVIEW`（蓝色）已提交审批中 |
| 通知图标 | Bell icon + 未读计数徽章，展示于会话标题右侧 |
| OA Draft 格式 | 以 Markdown 渲染，不以卡片组件形式展示；字段顺序固定：Type → Office → Content（明细表格）→ Currency → Amount → Estimated Payment Date → 所在部门 |
| 操作方式 | 所有调整操作通过 Chat 输入框完成，页面不提供额外操作按钮 |
| 历史快照不可变 | 每次操作追加新 OA Draft 消息，历史消息保持原始快照，不被覆盖或修改 |

### 2.5 AI 自然语言操作

| 操作类型 | 触发示例 | 系统响应 |
| --- | --- | --- |
| 移除条目 | "把 INV-202604-0006 移出" | 移除该条目，更新合计金额，单条回复（操作说明 + 新 OA Draft） |
| 添加条目 | "把 INV-202604-0011 加进来" | 前置校验通过后加入，单条回复；不满足条件时说明具体原因 |
| 修改 OA 类型 | "OA 类型改成 IT 外部サービス" | 更新 `type` 字段，单条回复（修改说明 + 新 OA Draft） |
| 确认提交 | "confirm" / "没问题" / "LGTM" / "提交" | 触发正式提交，执行 §2.6 提交后动作 |
| 查询明细 | "现在包含哪些？" | 输出当前草稿完整条目明细 |
| 无法识别 | 其他输入 | 回复操作提示列表，不执行任何变更 |

**添加条目前置校验（全部通过方可执行）**

| 校验项 | 规则 |
| --- | --- |
| 审核状态 | 目标条目 `state = checked` |
| OA 状态 | 目标条目 `oaState = pending_init` |
| 地区一致性 | 目标条目 `region` 与当前 OA 一致 |
| 币种一致性 | 目标条目 `currency` 与当前 OA 一致 |

### 2.6 提交后动作

| 步骤 | 动作 |
| --- | --- |
| 1 | OA state：`draft` → `in_review` |
| 2 | 所有关联 Invoice / Voucher 的 `oaState` → `in_review`，`activeOaId` → 本 OA ID |
| 3 | Chat 状态徽章更新为 `IN REVIEW`，输入框禁用，会话变为只读存档 |
| 4 | 通知对应 region 审批人（30 秒内送达） |
| 5 | 写入操作日志（提交人、提交时间、最终条目列表，不可篡改） |

### 2.7 超时与异常处理

| 场景 | 系统行为 |
| --- | --- |
| 草稿创建后 24 小时无任何回复 | Chat 追加提醒消息，再次 @相关人员 |
| 草稿创建后 48 小时仍未 confirm | 升级通知至上级，标记「待处理超时」 |
| 下一触发周期到来，草稿仍为 draft | 提示冲突，需人工处理后方可继续 |
| 本次扫描结果为空 | 不创建 OA，记录日志"本次扫描无符合条目" |
| Chat 调整后合计金额为 0 | 阻止提交，提示"当前 OA 无有效条目" |
| 同一条目并发加入两个 OA | 加入时校验 oaState + 分布式锁，防止重复加入 |

### 2.8 紧急 OA（手动触发）

| 需求项 | 说明 |
| --- | --- |
| 触发方式 | 财务专员在 F Expert Chat 中通过自然语言指令发起，例："帮我给 INV-202604-0006 紧急发起 OA" |
| 前置条件 | 目标条目 `oaState = pending_init`；`reason`（紧急原因）字段必填，为空时系统拒绝执行 |
| 生成后 | OA 打标 `urgent = true`；审批人收到高优先级通知；`oaState = in_review` 的条目不可重复触发 |

---

## 五、数据状态流转

```
Invoice / Voucher 状态机（oaState 维度）：

  pending_init
      │
      ├─── 定时批处理 / 紧急手动触发 ──→  [OA 草稿创建，oaState 暂不变更]
      │                                              │
      │                                    Chat confirm 提交
      │                                              │
      └──────────────────────────────────→  in_review
                                                     │
                                ┌────────────────────┴───────────────────┐
                                ↓                                         ↓
                             approved                                 rejected
                           （可执行打款）                    （oaState 回退至 pending_init，
                                                              下次批处理周期重新纳入）
```

---

## 六、不在范围内（Not in Scope）

- OA 审批侧界面改造（审批流程使用现有 OA 系统）
- 多币种 OA 合并（跨币种合并不在设计内）
- Invoice / Voucher 上传与审核流程改造
- 自然语言修改 OA 金额或收款方信息（仅支持条目增删和类型修改）
- 移动端 Chat 界面

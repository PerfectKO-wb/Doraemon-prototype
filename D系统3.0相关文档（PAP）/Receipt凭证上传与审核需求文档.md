
| 项目名称  | Voucher（报销凭证）上传与审核功能                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 文档版本  | v1.0                                                                                                                                 |
| 创建日期  | 2026年4月21日                                                                                                                           |
| 参考文档  | [上海&台北行政报销](/doc/ceb9e860-e6bf-4d95-918c-126b9012c365)                                                                               |
| 原型地址  | [https://doraemon-prototype.vercel.app/F-PAP-PAYMENT-REQUEST.html](https://doraemon-prototype.vercel.app/F-PAP-PAYMENT-REQUEST.html) |
| 设计稿地址 | —                                                                                                                                    |
| 修改记录  | —                                                                                                                                    |


---

## 一 、功能点

1. 上线 Voucher 独立的上传、解析、用户确认、财务审核链路，与 Invoice 解耦。
2. 在列表页以 Tab 区分 Invoice / Voucher，满足财务按类型批量审核的场景。
3. 为 Voucher 引入「AI 解析 → 用户核对 → 财务审核」三段式流程，把字段校对前置到最熟悉业务的申请人手中。
4. 为 Invoice 与 Voucher已审核记录提供补救能力：
  - `Approved`：支持再编辑（编辑后自动保持 Approved）与删除
  - `Denied`：支持删除

---

## 二、场景

### 名词解释


| 名词               | 说明                                   |
| ---------------- | ------------------------------------ |
| **Invoice**      | 由开票方提供的正式发票，带税率、发票号、开票方等信息，现有流程      |
| Voucher          | 上海、台北地区上传的用于报销的凭证，本次新增类型             |
| **解析（Parsing）**  | AI 从用户上传的 PDF / 图片中抽取关键字段的过程         |
| **上传用户**         | 通常为行政、HR、业务归口人；负责上传凭证、核对 AI 解析结果     |
| **F Expert（财务）** | 最终审核人，决定 `Approve / Reject`          |
| **SubmissionID** | 每次上传产生的记录 ID，用于贯穿 Receipt 从上传到审核的全过程 |


### Receipt 状态机


| 状态码         | 中文        | 归属方  | 说明                                |
| ----------- | --------- | ---- | --------------------------------- |
| `parsing`   | 解析中       | 系统   | AI 正在抽取字段，用户看到加载动效                |
| `unconfirmed` | 待确认     | 上传用户 | 解析完成、用户尚未点击"Confirm & Submit"核对字段 |
| `pending`   | 已确认 · 待审核 | 财务   | 用户已核对字段并提交，等待财务审核                 |
| `checked`   | 已通过       | 财务   | 财务 `Approve`，Receipt 生效           |
| `denied`    | 已驳回       | 财务   | 财务 `Reject`，需申请人处理后重新上传           |


状态流转：

`upload → parsing → unconfirmed ──(user confirm)──► pending ──(F approve)──► checked                                                          ──(F reject) ──► denied checked / denied ──(F edit)──► checked            （仅 checked） checked / denied ──(F delete)──► 记录移除`

> 展示说明：`parsing` 为系统中间态，列表页一律以 `Unconfirmed` 显示；详情抽屉在解析未完成时展示加载/空状态，解析完成后以 `Unconfirmed` 呈现可编辑表单。

### 重复上传规则（Invoice 与 Voucher 通用）


| 同名文件当前状态                            | 再次上传行为                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `unconfirmed` / `pending` / `checked` | **拒绝上传**，Toast 提示 `已审核/处理中，无法重复上传`（仅 `checked` 可解锁：需财务 `Delete` 后方可再次上传） |
| `denied`                            | **允许上传**，自动移除旧的驳回记录，以新记录进入 `unconfirmed`（Voucher）或 `pending`（Invoice）                                     |
| 列表中无同名记录                            | 正常上传                                                                     |


### 场景


| 浏览路径                                         | 说明                                              | 范围       |
| -------------------------------------------- | ----------------------------------------------- | -------- |
| `[Payment Request] → 点击 Upload → 选择 Receipt` | 选择本地文件上传，进入 AI 解析流程                             | 行政       |
| `[Payment Request] → 列表 Tab: Receipt → 点击记录` | 右侧抽屉打开：左侧预览原件、右侧展示解析字段，用户核对后 `Confirm & Submit` | 上传用户     |
| `[Payment Review] → 列表 Tab: Receipt → 点击记录`  | 进入详情页：左侧 PDF 预览、右侧只读字段表单，财务 `Approve / Reject`  | F Expert |
| `[Payment Review] → 详情页（已审核）→ Edit / Delete` | 已审核记录的再编辑或删除                                    | F Expert |




---

## 三、需求

### 1. 功能范围

- **新增类型**：Receipt（付款凭证），与 Invoice 并列为 `Payment Request` 与 `Payment Review` 的二级类型
- **支持文件类型**：`.pdf` / `.jpg` / `.jpeg` / `.png`，支持多文件批量上传
- **支持地区**：台北、上海
- **涉及页面**：
  - `F-PAP-PAYMENT-REQUEST.html`（上传端 · 行政/业务）
  - `F-PAP-PAYMENT-REVIEW.html`（审核端 · 财务）

### 2. 功能需求清单

 2.1表单区


| 字段              | 类型                                          | 是否可编辑       | 默认值                                       |
| --------------- | ------------------------------------------- | ----------- | ----------------------------------------- |
| Apply Date      | 文本                                          | ❌（固定）       | 自动取上传时间 `yyyy-MM-dd HH:mm`                |
| Payee Name      | 文本                                          | ✅           | AI 解析值                                    |
| Bank Name       | 文本                                          | ✅           | AI 解析值                                    |
| Amount          | 文本                                          | ✅           | AI 解析值                                    |
| Currency        | 下拉（`TWD` / `RMB`）                           | ✅           | 台北 → `TWD`；上海 → `RMB`                     |
| Payment Purpose | 文本                                          | ✅           | AI 解析值                                    |
| Payment Bank    | 文本                                          | ✅           | 台北 → `富邦銀行`；上海 → `招商銀行`；切换 Currency 时自动同步 |
| Payment Type    | 下拉（`Administrative` / `Non-Administrative`） | ✅           | 默认 `Administrative`                       |
| Applicant       | 文本                                          | ❌（自动带入当前用户） | 当前登录用户                                    |
| Memo            | 文本域                                         | ✅           | 可空                                        |


22行为


| 按钮 / 动作                                | 行为                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `Confirm & Submit`                     | 保存字段并置状态为 `Pending`，抽屉关闭，Toast 提示 `Receipt submitted for finance review` |
| `Cancel` / `×` / `Esc` / 点击遮罩 / 跳转其他页面 | **自动保存当前字段为草稿并关闭抽屉，状态保持 `Unconfirmed` 不变**；下次打开时按已保存的值回显；不触发 Toast             |
| 已 `Pending` 或 `Checked` 的记录再次打开      | 表单所有字段只读，按钮隐藏 `Confirm & Submit`，改为只读态浏览                                   |


> 自动保存仅持久化字段值，不推进状态；只有点击 `Confirm & Submit` 才会将 `Unconfirmed` 推进至 `Pending` 进入财务审核队列。



#### 2.3 已审核记录的二次处理（Payment Review · Invoice + Voucher通用）

为防止财务误 Approve / Reject 后无法回退，引入以下补救能力：

23.1 Approved（`Checked`）记录


| 按钮                                | 行为                                                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `Edit`                            | 顶部出现黄色提示横条 `Editing — make your changes below, then click Save & Re-Approve`；所有可编辑字段解锁；底部按钮切换为 `Cancel / Save & Re-Approve` |
| `Delete`                          | 红色危险按钮，二次确认后从列表中永久移除记录                                                                                                      |
| `Cancel`（进入 Edit 后）               | 回滚本次修改，返回 Edit / Delete 视图                                                                                                  |
| `Save & Re-Approve`（进入 Edit 后）    | 保存字段修改，状态**保持** `Checked`，Toast `Invoice/Receipt updated & re-approved`                                                     |
| `×` / `Esc` / 点击遮罩 / 跳转其他页面（在编辑态） | **自动以 `Save & Re-Approve` 行为保存字段、状态保持 `Checked`**，不弹 Toast；下次打开回显最新值。若要丢弃本次修改，需显式点击 `Cancel`                                |


23.3 详情页关闭时的自动保存总则（Invoice + Voucher 通用）


| 场景                                                    | 关闭行为（`×` / `Esc` / 点击遮罩 / 跳转其他页面）                   |
| ----------------------------------------------------- | --------------------------------------------------- |
| Voucher Collection · `Unconfirmed`（含解析完成待确认）              | 自动保存字段为草稿，状态保持 `Unconfirmed`，**不**触发 `Confirm & Submit` |
| Review · Invoice `Pending` / Voucher `Pending`（待审核） | 自动保存字段，状态保持不变，**不**触发 `Approve / Reject`            |
| Review · `Checked` 的编辑态                               | 自动以 `Save & Re-Approve` 保存字段，状态保持 `Checked`         |
| 只读态（`Pending` / `Checked` 非编辑 / `Denied`）           | 直接关闭，无保存动作                                          |


> 自动保存的范围仅限已允许编辑的字段；`Apply Date` 与 `Applicant` 始终保持固定；自动保存不改变状态，不发送 Toast，不触发财务流转。

23.2 字段只读策略（Invoice 与 Voucher 一致）


| 场景                                        | 字段可编辑性 | 底部按钮                         |
| ----------------------------------------- | ------ | ---------------------------- |
| Pending（Invoice）/ Pending（Voucher）· 未终审 | 可编辑    | `Approve / Reject`           |
| Checked（已通过 · 查看模式）                       | 只读     | `Edit / Delete`              |
| Checked（已通过 · 编辑模式）                       | 可编辑    | `Cancel / Save & Re-Approve` |
| Denied（已驳回）                               | 只读     | `Delete`                     |


#### 2.4 状态 × 操作矩阵

> 注：「列表页操作」在列表行可直接点击；「详情页操作」在点击行进入抽屉或详情后可用。

**Invoice · Collection（`F-PAP-PAYMENT-REQUEST.html`）**


| 状态        | 列表页可执行操作 | 详情页可执行操作 |
| --------- | -------- | -------- |
| `pending` | 查看；删除    | 无        |
| `checked` | 查看       | 无        |
| `denied`  | 查看       | 无        |


*Collection 侧不提供字段编辑与 Approve/Reject。*

**Invoice · Review（`F-PAP-PAYMENT-REVIEW.html`）**


| 状态        | 列表页可执行操作 | 详情页可执行操作                              |
| --------- | -------- | ------------------------------------- |
| `pending` | 查看       | 编辑字段；`Approve`；`Reject`               |
| `checked` | 查看       | `Edit` / `Save & Re-Approve`；`Delete` |
| `denied`  | 查看       | `Delete`                              |


**Voucher · Collection（`F-PAP-VOUCHER-COLLECTION.html`）**


| 状态              | 列表页可执行操作 | 详情页可执行操作                                      |
| --------------- | -------- | --------------------------------------------- |
| `pending`（含解析中） | 查看       | 未解析完成：显示加载/空状态；解析完成：编辑解析字段；`Confirm & Submit` |
| `confirmed`     | 查看       | 无（只读预览）                                       |
| `checked`       | 查看       | 无（只读预览）                                       |


**Voucher · Review（`F-PAP-PAYMENT-REVIEW.html`）**


| 状态               | 列表页可执行操作 | 详情页可执行操作                              |
| ---------------- | -------- | ------------------------------------- |
| `confirmed`（待财务） | 查看       | 编辑字段；`Approve`；`Reject`               |
| `checked`        | 查看       | `Edit` / `Save & Re-Approve`；`Delete` |
| `denied`         | 查看       | `Delete`                              |


---

## 三、OA 审批集成（多 Invoice 捆绑）

在 F Expert 审核完 Invoice 后，针对需要付款（`Payout required = Yes`）的发票，需要通过 OA 审批流程取得公司侧授权。本章节描述 Invoice 与 OA 之间的数据关系、状态机与原型落点。

### 3.1 目标与约束

- 支持 **多张 Invoice 合并到一个 OA 审批**（例如一个月度费用清单、一次性集中报销等）。
- Invoice 与 OA 是 `1 : N ↔ 1` 关系：一个 OA 可包含多张 Invoice；一张 Invoice 在某一时刻仅归属一个 OA。
- 多张 Invoice 捆绑发起时 **币种必须一致**；不一致直接拒绝发起并提示。
- OA 页面是 F Expert 的独立工作台：`F-PAP-OA-APPROVAL.html`。
- 原型侧 OA 决策使用 `[Mock] Approve` / `[Mock] Reject with reason`，真实侧由 OA 系统回调。

### 3.2 状态机

**Invoice 的 OA 状态（`invoice.oaState`）**


| 状态码            | 中文    | 说明                                                  |
| -------------- | ----- | --------------------------------------------------- |
| `not_required` | 无需审批  | 该 Invoice 的 `Payout required = No`，无需 OA            |
| `pending_init` | 待发起   | 财务已 Approve 且需要付款，但尚未发起任何 OA                        |
| `in_review`    | 审批中   | 已捆绑到某条 OA 并提交，等待 OA 决策                               |
| `approved`     | 通过    | OA 决策通过                                             |
| `rejected`     | 拒绝    | OA 决策拒绝（支持重新发起）                                     |

**OA 记录的状态（`oa.state`）**


| 状态码         | 中文    | 说明                                      |
| ----------- | ----- | --------------------------------------- |
| `draft`     | 草稿    | `Save as Draft` 后的 OA，未提交                |
| `in_review` | 审批中   | 已提交到 OA 系统等待决策                           |
| `approved`  | 通过    | OA 系统或 Mock 决策通过                         |
| `rejected`  | 拒绝    | OA 系统或 Mock 决策拒绝（需提供拒绝原因）                |

**状态流转**

```
Invoice 视角：
  财务 Approve ┬─► (Payout=No)  oaState = not_required
               └─► (Payout=Yes) oaState = pending_init
  pending_init ──(进入 OA 并提交)──► in_review
  in_review    ──(OA 通过)────────► approved
  in_review    ──(OA 拒绝)────────► rejected
  rejected     ──(再次发起 OA)─────► in_review

OA 视角：
  (new) ─► draft ─(submit)─► in_review ─(mock approve)─► approved
                                       └─(mock reject)──► rejected
  rejected ──(编辑复制后新发起)──► 新 OA 从 in_review 起
```

### 3.3 入口

1. **Review 列表页 · 批量浮条**（主入口）
   - 列表首列新增多选框，仅对 `state=checked` + `payoutRequired=yes` + `oaState ∈ {pending_init, rejected}` 的 Invoice 可选
   - 选中 ≥1 条后底部浮条展示：已选数量、合计金额（按币种聚合显示）、`Clear selection`、`Initiate OA Approval`
   - 多币种时浮条显示警告且禁用 `Initiate OA Approval`
   - 点击 `Initiate OA Approval` 进入 `F-PAP-OA-APPROVAL.html?action=new&invoiceIds=...`，新建态 OA 自动预链接选中 Invoice、自动同步币种/合计/Content
2. **Review 详情页 · OA 区块**
   - 对 `state=checked` 的 Invoice，右侧 Summary 顶部新增 `OA Approval` 区块，显示当前 `oaState` 胶囊
   - `pending_init` → 显示 `Initiate OA` 按钮，跳转 `F-PAP-OA-APPROVAL.html?action=new&invoiceIds=<self>`
   - `in_review` → 显示 `View <OA-ID>` 跳转到 OA 详情；字段全部只读并提示「OA 审批中，字段已锁定」
   - `approved` → 显示 `View <OA-ID>`；不可再修改金额
   - `rejected` → 显示 `View <OA-ID>` + `Re-initiate` 按钮；不可再修改金额
   - `not_required` → 仅显示状态胶囊
3. **OA 页自身 · Initiate OA**
   - 右上角 `+ Initiate OA` 可独立进入空白新建表单；用户在表单内通过 `+ Add invoice` 弹窗挑选待捆绑的 Invoice

### 3.4 OA 发起表单（多 Invoice 捆绑）

表单整体分为 2 个 Section + 1 个右侧 Invoice Preview：

**Section A · Linked Invoices**

- 卡片列表：`文件名 · 金额 · 币种 · ✕ 移除`
- 底部 `+ Add invoice` 打开「Invoice Picker」弹窗
- 合计栏：`Total = Σ amount`；多币种时显示黄色告警徽章「Mixed currencies — cannot submit」并禁用提交

**Section B · Request Info（动态字段）**

| 字段                   | 适用 Type                                | 必填 | 备注                                             |
| -------------------- | -------------------------------------- | -- | ---------------------------------------------- |
| Type                 | 所有                                     | ✅  | `共通経費 / 給与・経費精算 / 総務備品購入 / IT 外部サービス / 契約 / Internal Transaction` |
| Office               | 所有                                     | ✅  | 根据 Linked Invoice 首张自动建议                        |
| Content              | 所有                                     | ✅  | 自动生成 `invoice://<filename>.pdf`，每张 Invoice 一行，只读 |
| Currency / Amount    | 所有                                     | ✅  | 根据 Linked Invoice 自动同步；多币种禁止提交                  |
| Est. Pay Day         | 所有                                     | ✅  | 预计付款日期                                          |
| Remarks              | 所有                                     | ⭕  | 备注                                              |
| Recipient            | `給与・経費精算`                              | ⭕  | 领款人                                             |
| Counterparty         | `総務備品購入` / `契約`                        | ⭕  | 供应商 / 对方                                        |
| Service Name         | `IT 外部サービス`                            | ⭕  | 服务名称                                            |
| Service Description  | `IT 外部サービス`                            | ⭕  | 服务描述                                            |
| Attachment Reference | `契約`                                   | ⭕  | 合同附件引用                                          |
| Cost / Plan          | `Internal Transaction`                 | ⭕  | 成本 / 计划                                         |

**右侧 Invoice Preview**

- 多张 Invoice 以 Tab 形式切换
- iframe 内嵌 PDF 预览；点击左侧 Invoice 卡片或 Tab 都可切换当前预览

**动作区**

| 按钮                | 行为                                                                              |
| ----------------- | ------------------------------------------------------------------------------- |
| `Cancel`          | 放弃本次变更并退出表单                                                                     |
| `Save as Draft`   | 保存为 `draft`；被捆绑的 Invoice `oaState` 回退至 `pending_init`，`activeOaId` 指向该草稿         |
| `Submit`          | 校验必填 + 币种一致，保存为 `in_review`，被捆绑 Invoice `oaState = in_review`，`activeOaId` 绑定 |

### 3.5 Invoice 字段可编辑矩阵（基于 OA 状态）

**前提**：只有 `state = checked`（财务已 Approve）的 Invoice 才进入本矩阵；`pending` / `denied` 保留原 Approve 流程下的编辑规则，与 OA 无关。

| oaState        | 是否允许 `Edit` | 可编辑字段范围                                | 允许修改「Amount」 |
| -------------- | ---------- | -------------------------------------- | ----------- |
| `not_required` | ✅          | 原本就支持编辑的字段（不含 Applicant / Apply Date）  | ❌           |
| `pending_init` | ✅          | 同上                                     | ❌           |
| `in_review`    | ❌（字段全锁）    | —                                      | ❌           |
| `approved`     | ✅          | 原本就支持编辑的字段                             | ✅           |
| `rejected`     | ✅          | 原本就支持编辑的字段                             | ✅           |

> 原则：
> - `in_review` 期间禁止修改 Invoice，避免与正在审批中的 OA 表单数据漂移；
> - `not_required` / `pending_init` 允许修改除 `Amount` 外的所有原可编辑字段——Amount 在 OA 未发起/无需审批时被视为 AI 解析原值，需保持一致；
> - `approved` / `rejected` 属于 OA 已关闭的终态，此时 Amount 可被财务再编辑（例如驳回后调整再重新发起、或通过后补正），因此放开所有原可编辑字段（含 Amount）；
> - 「原本就不支持编辑的字段」（如 Applicant、Apply Date、系统自填字段）在任何 OA 状态下都保持只读。

#### 原型必须覆盖的 5 种情景

`F-PAP-PAYMENT-REVIEW.html` 的 seed 数据已按下表配置，确保 Demo 可以直接点开对照：

| 情景                          | Invoice ID（seed） | 预期表现                                                                 |
| --------------------------- | ---------------- | -------------------------------------------------------------------- |
| `checked` + `not_required`  | id 4             | 详情页 `Edit` 可点击；进入编辑后 Amount 只读，其余可改；OA 区域隐藏                |
| `checked` + `pending_init`  | id 6 / id 8      | 详情页 `Edit` 可点击；Amount 只读，其余可改；OA 区域显示 `Initiate OA` 按钮   |
| `checked` + `in_review`     | id 5             | 详情页 `Edit` 按钮隐藏；全表单只读；OA 区域显示 `View OA-2026-0005` + 蓝色提示 |
| `checked` + `approved`      | id 3             | 详情页 `Edit` 可点击；所有字段（含 Amount）可改；OA 区域显示 `View OA-2026-0003`   |
| `checked` + `rejected`      | id 7             | 详情页 `Edit` 可点击；所有字段（含 Amount）可改；OA 区域显示 `View OA-2026-0007` + `Re-initiate` |

### 3.6 OA 页结构

`F-PAP-OA-APPROVAL.html`

```
┌─────────┬──────────────┬─────────────────────────────────────────┐
│ Sidebar │ OA 列表（含    │ 主区：空态 / 只读详情 / 新建或编辑表单         │
│         │ 筛选 + 搜索）   │   · Linked Invoices                      │
│         │  · Draft      │   · Request Info（随 Type 动态）           │
│         │  · In review  │   · Invoice Preview（右侧 Tab）           │
│         │  · Approved   │   · 底部 Cancel / Save as Draft / Submit │
│         │  · Rejected   │   · [Mock] Approve / Reject（仅 in_review）│
└─────────┴──────────────┴─────────────────────────────────────────┘
```

- `+ Initiate OA`：主区右上角，进入空白新建表单
- 列表项点击：右侧展示对应 OA 只读详情 + 决策栏
- 左侧浅灰「Back」图标 / 主区 `Back` 按钮：返回 `F-PAP-PAYMENT-REVIEW.html`
- Invoice 与 OA 之间通过 `sessionStorage` 同步 `oa.records` 与 `oa.invoiceAnnotations`，保证两页面数据一致（原型阶段实现）

### 3.7 交互约束与校验

- 提交 OA 前的硬校验：
  - `Linked Invoices` 非空
  - 币种一致（若不一致直接禁用 Submit 且给出警告徽章）
  - 必填字段（Type / Office / Content / Currency / Amount / Est. Pay Day）
- 在 OA `in_review` 期间：
  - 不允许从 OA 侧移除/增加 Invoice；需先驳回或撤回
- Invoice Picker 仅展示符合条件的 Invoice（`checked + Payout=Yes + oaState ∈ pending_init | rejected`），并自动禁用币种不一致项

---



### 待确认事项


| 序号  | 事项                              | 影响范围       | 当前状态   |
| --- | ------------------------------- | ---------- | ------ |
| 1   | 上海和台湾的需要传company name吗，如果要传，传什么 | Invoice 表单 | 待业务方确认 |
|     |                                 |            |        |
|     |                                 |            |        |
|     |                                 |            |        |
|     |                                 |            |        |
|     |                                 |            |        |


---


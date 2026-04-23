
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


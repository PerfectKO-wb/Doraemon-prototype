# Invoice 详情页字段规范 — 分地区展示策略

> 基于 179 个真实样本统计分析，按地区说明 Invoice 详情页的字段展示策略、展示原因、手填方式及必填规则。
>
> **符号说明**
> - ✅ 展示 ｜ ❌ 不展示
> - ✏️ 文本输入 ｜ 🔢 数字输入 ｜ 📅 日期选择器 ｜ 🔽 下拉选择
> - 必填列：**PURCHASE** = 采购方向 ｜ **SALE** = 销售方向 ｜ ✅ 必填 ｜ ⚪ 选填 ｜ — 不适用

---

## 通用说明

所有地区的 API 返回**完全相同的字段结构**，无地区分支。详情页使用同一套模板，差异体现在：
1. 部分字段仅在特定地区有实际值（如 `tax_registration_no` 仅 JP 有）
2. 付款路由字段因支付体系不同而使用不同子字段（`ext_data.payment_rail.*`）
3. 所有地区的 `accounting_date` 均为 null，必须由财务手填

**字段归属说明**：

`payer` / `payee` 的角色由 `invoice_direction` 决定，而非固定为 CTW：

| `invoice_direction` | 付款方（payer） | 收款方（payee） | 样本占比 |
|---|---|---|---|
| `PURCHASE`（主流） | CTW | 供应商 | 95.5%（171/179） |
| `SALES` | 客户 | CTW | 2.8%（5/179） |

- `payee_bank_name` / `payee_account_no`（顶层）：发票收款方银行的平铺字段。PURCHASE 下为供应商银行；SALES 下为 CTW 银行
- `ext_data.bank_account.*`：收款方银行账户的**结构化版本**，与 `payee_bank_name` 同源，优先取此字段展示
- `payee_name`（顶层）：与 `ext_data.bank_account.account_name` 业务含义等价（已确认）。前端不单独展示该字段；**写入规则**：保存时须将 `ext_data.bank_account.account_name` 的值同步覆盖 `payee_name`，保持两字段一致
- `ext_data.payment_rail.*`：收款方侧转账路由参数（SWIFT / ACH / 片假名等）
- `payer_bank_name`（顶层）：发票付款方银行。PURCHASE 下为 CTW 出款银行；SALES 下为客户银行（当前 SALES 样本均为空）。填充率 5.6%，仅在发票正文本身提及付款账户时 AI 才识别（如信用卡账单、口座振替凭证）

> ⚠️ PAP 付款审核流程当前主要处理 PURCHASE 类发票，因此实际使用中 payer ≈ CTW、payee ≈ 供应商。SALES 方向发票属于少数边缘情况，前端可暂按 PURCHASE 逻辑展示，后续如有需要再做方向差异化处理。

**【待确认】CTW 固定银行账户主数据**

> 根据样本数据推断，CTW 在各地区拥有固定的银行账户列表（如 JP 的三井住友銀行 赤坂支店 普通預金 9564069）。不同 `invoice_direction` 下，对应的付款方或收款方银行账户应从这批 CTW 固定账户中选择，而非自由输入：
>
> | `invoice_direction` | 需从 CTW 账户中选择的字段 | 说明 |
> |---|---|---|
> | `PURCHASE` | `payer_bank_name`（CTW 出款账户） | CTW 作为付款方，财务需确认从哪个 CTW 账户出款 |
> | `SALES` | `ext_data.bank_account.*`（CTW 收款账户） | CTW 作为收款方，需指定客户应打入哪个 CTW 账户 |
>
> **待确认事项：**
> 1. CTW 各地区的固定银行账户清单是否由后端维护（主数据接口）？
> 2. 前端是否通过下拉接口动态拉取，还是硬编码枚举值？
> 3. 账户是否按 `region_code` 或 `company_code` 过滤，避免跨地区选错账户？

---

## 一、JP 地区（日本）

**付款特征**：日本内汇，使用金融机构代码体系（银行代码 + 支行代码 + 口座番号 + 片假名账户名），适格請求書登録番号合规要求。

### 需要展示的字段

| 前端标签 | 字段路径 | 展示原因 | 手填方式 | 必填（PURCHASE/SALE）|
|---|---|---|---|---|
| Description | `invoice_description` | AI 生成的发票内容摘要，帮助财务快速理解 | ✏️ 文本输入（多行，AI 识别错误时财务可修正） | ⚪ / ⚪ |
| Region | `region_code` | 标识发票所属地区，决定后续付款路由规则 | 🔽 下拉选择（枚举值：JP / US / SG / CN / TW） | ✅ / ✅ |
| Direction | `invoice_direction` | 决定付款方/收款方角色分配，影响 payer_bank_name 和 bank_account 字段的填写逻辑 | 🔽 下拉选择（枚举值：PURCHASE / SALES） | ✅ / ✅ |
| Company | `company_code` | 标识付款主体（CTW 哪家法人实体出款），与财务账套强关联 | 🔽 下拉选择（枚举值：JP_CTW_INC / US_CTW_INC / SG_CTW_INC / SH_WYYCX_INC 等） | ✅ / ✅ |
| Document Type | `document_type` | 区分 INVOICE / PAYMENT_REPORT / RECEIPT 等 9 种类型，影响审核逻辑 | ✏️ 文本输入（AI 识别率高，可修正） | ✅ / ✅ |
| Vendor Name | `vendor_name` | 标识开票方，与付款对象核对 | ✏️ 文本输入 | ✅ / ✅ |
| Invoice No. | `invoice_number` | 发票编号，用于溯源和重复检查（59% 有值，合同/收据类可能无编号） | ✏️ 文本输入 | ⚪ / ⚪ |
| Currency | `currency` | 币种，JPY，用于汇率换算和金额展示 | 🔽 下拉选择（枚举值：JPY / USD / CNY / SGD / TWD） | ✅ / ✅ |
| Total Amount | `total_amount` | 含税总金额，主要付款金额 | 🔢 数字输入（AI 识别错误时财务可修正） | ✅ / ✅ |
| Excl. Tax Amount | `amount_excluding_tax` | 税前金额，拆分税务处理 | 🔢 数字输入 | ⚪ / ⚪ |
| Tax Amount | `tax_amount` | 税额，与税前金额相加核验（免税发票允许为 0） | 🔢 数字输入 | ⚪ / ⚪ |
| Tax Reg. No. | `tax_registration_no` | 適格請求書登録番号，日本消费税合规字段；其他地区亦展示（如 EIN、GST Reg No.、统编），财务可补填 | ✏️ 文本输入（AI 识别错误或为空时财务可修正；JP 需与原始发票完全一致，修改需自行核实合规性） | ⚪ / ⚪ |
| Business Category | `business_category` | 费用类别，用于会计科目映射 | ✏️ 文本输入（AI 识别后可修正） | ✅ / ✅ |
| Payment Type | `payment_type` | 行政类/非行政类，影响审批流程 | 🔽 下拉选择（枚举值：ADMINISTRATIVE / NON_ADMINISTRATIVE） | ✅ / ✅ |
| Line Items | `line_items[*]` | 费用明细行，核验并修正 AI 解析的明细数据；每行包含：`item_name`（品名）、`tax_inclusive_amount`（含税金额）、`tax_rate`（税率）、`amount_excluding_tax`（税前金额）、`description`（明细说明）、`service_period_start/end`（明细服务期间）。示例：品名 `G123-PSP`，含税 `25428.64`，税率 `8%` | ✏️ 可编辑表格（逐行修改，不支持新增/删除行） | ⚪ / ⚪ |
| Purpose | `payment_purpose` | 打款用途，说明这笔钱用于什么 | ✏️ 文本输入 | ✅ / ✅ |
| Invoice Date | `invoice_date` | 发票开具日期，判断发票有效期（DDL 允许 NULL，AI 可能未识别，前端非强制） | 📅 日期选择器 | ⚪ / ⚪ |
| Due Date | `due_date` | 付款截止日期，超期需预警（57% 有值，合同类无此字段） | 📅 日期选择器 | ⚪ / ⚪ |
| Service Period | `service_period_start` / `service_period_end` | 服务期间，用于费用摊销判断 | 📅 日期选择器（开始 + 结束各一个） | ⚪ / ⚪ |
| Accounting Date | `accounting_date` | 入账日期，决定进哪个月的账 | 📝 日期选择器（AI 从不识别，0/179，必须手填） | ✅ / ✅ |
| Bank Name | `ext_data.bank_account.bank_name` | **收款方**银行名称（结构化），转账必要信息 | ✏️ 文本输入 | ✅ / ✅ |
| Branch Name | `ext_data.bank_account.branch_name` | **收款方**支行名称（JP 内汇建议填写） | ✏️ 文本输入 | ⚪ / ⚪ |
| Account Type | `ext_data.bank_account.account_type` | **收款方**账户类型（e.g. 普通預金） | ✏️ 文本输入 | ⚪ / ⚪ |
| Account No. | `ext_data.bank_account.account_no` | **收款方**口座番号（7位） | ✏️ 文本输入（限 7 位数字） | ✅ / ✅ |
| Account Name | `ext_data.bank_account.account_name` | **收款方**账户名称（JP 需片假名）；PURCHASE 下为供应商账户名，SALE 下为 CTW 收款账户名，两个方向均需核验 | ✏️ 文本输入 | ✅ / ✅ |
| Bank Code | `ext_data.payment_rail.bank_code` | 银行代码（4位，JP 金融机构代码） | ✏️ 文本输入（限 4 位数字） | ⚪ / ⚪ |
| Branch Code | `ext_data.payment_rail.branch_code` | 支行代码（3位） | ✏️ 文本输入（限 3 位数字） | ⚪ / ⚪ |
| Account Name (Kana) | `ext_data.payment_rail.account_name_kana` | **JP 必要**：口座名義（半角片假名），日本内汇银行系统强制要求；PURCHASE 方向为供应商 kana 名（必填），SALE 方向为 CTW 自身 kana 账户名（可预填，非强制手填） | ✏️ 文本输入（半角片假名格式，AI 识别率 5%，多数需财务补填） | ✅ / ⚪ |
| Bank Name (Kana) | `ext_data.payment_rail.bank_name_kana` | 銀行名（半角片假名），部分银行系统报文要求；AI 几乎不识别，财务可补填 | ✏️ 文本输入（半角片假名格式） | ⚪ / ⚪ |
| Payer Bank | `payer_bank_name` | 发票付款方银行。PURCHASE 下为 CTW 出款银行；仅在发票正文提及时 AI 识别（如信用卡账单、口座振替凭证） | 🔽 下拉选择（【待确认】从 CTW 固定银行账户中选择，AI 识别率 5.6%） | ✅ / ⚪ |
| Payer Account | `payer_account_name` | 付款方账户名称，与 `payer_bank_name` 配套使用，明确付款主体。PURCHASE 下为 CTW 实体名称 | ✏️ 文本输入 | ✅ / ⚪ |
| Recognition | `recognition_policy` | 控制费用在时间轴上的确认方式，直接决定 AI 将生成几条 JE 及其所属期间 | 🔽 下拉选择（枚举值：IMMEDIATE / PREPAID_MONTHLY / PREPAID_DAILY / ACCRUAL_BY_SERVICE_PERIOD / MONTHLY_BY_LINE_ITEM） | ✅ / ✅ |
| Allocation | `allocation_method` | recognition_policy ≠ IMMEDIATE 时，指定分摊的数学计算方式（ACCRUAL_BY_SERVICE_PERIOD 时财务可选；其余策略自动匹配） | 🔽 下拉选择（枚举值：MONTHLY_EQUAL / DAILY_PRORATA / MONTHLY_BY_LINE_ITEM），仅当 ACCRUAL_BY_SERVICE_PERIOD 时可编辑 | ⚪ / ⚪ |

> ⚠️ **bank_account 必填规则**：`bank_name` 和 `account_no` 双方向均为必填——PURCHASE 方向为供应商（收款方）银行账户，是银行转账的必要信息；SALES 方向为 CTW（收款方）银行账户，客户需依此打款。若财务确认该发票为信用卡/自动扣款（无需手动发起转账），可勾选"Auto-debit / 自动扣款"跳过银行信息校验并填写说明。
>
> ⚠️ **line_items 内部必填规则**：有明细行时，每行的 `item_name`、`tax_inclusive_amount`、`tax_rate` 为必填；`amount_excluding_tax`、`description`、`service_period` 为选填。
>
> ⚠️ **recognition_policy 联动交互规则**（所有地区通用）：
>
> | recognition_policy 选择 | allocation_method | service_period（Header 级）| line_items.service_period |
> |---|---|---|---|
> | `IMMEDIATE` | 不展示 | 保持选填 | 保持选填 |
> | `PREPAID_MONTHLY` | 自动锁定 MONTHLY_EQUAL（不可改） | **升级为必填（高亮提示）** | 保持选填 |
> | `PREPAID_DAILY` | 自动锁定 DAILY_PRORATA（不可改） | **升级为必填（高亮提示）** | 保持选填 |
> | `ACCRUAL_BY_SERVICE_PERIOD` | 可选：MONTHLY_EQUAL / DAILY_PRORATA | **升级为必填（高亮提示）** | 保持选填 |
> | `MONTHLY_BY_LINE_ITEM` | 自动锁定 MONTHLY_BY_LINE_ITEM（不可改） | 不适用（Header 级不展示必填提示） | **每行 service_period 升级为必填** |

### 不需要展示的字段

| 字段路径 | 不展示原因 |
|---|---|
| `ext_data.payment_rail.swift_code` | JP 内汇不使用 SWIFT，该字段对日本付款无意义 |
| `ext_data.payment_rail.ach_routing` / `wire_routing` | 美国支付路由体系，日本不适用 |
| `ext_data.payment_rail.paynow_uen` | 新加坡 PayNow 专用，日本不适用 |
| `payee_bank_name` / `payee_account_no` | 与 `ext_data.bank_account.*` 内容重复，优先展示结构化字段，平铺字段不重复展示 |
| `payee_name` | 与 `ext_data.bank_account.account_name` 业务含义等价（已确认），以结构化字段为准展示；**写入规则**：前端保存时须将 `ext_data.bank_account.account_name` 的值同步覆盖顶层 `payee_name` 字段 |

---

## 二、US 地区（美国）

**付款特征**：美国本地转账走 ACH（Routing + Account），跨境电汇走 Wire Routing 或 SWIFT。无片假名要求，无数字银行代码体系。

### 需要展示的字段

| 前端标签 | 字段路径 | 展示原因 | 手填方式 | 必填（PURCHASE/SALE）|
|---|---|---|---|---|
| Description | `invoice_description` | 同 JP | ✏️ 文本输入（多行，AI 识别错误时财务可修正） | ⚪ / ⚪ |
| Region | `region_code` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Direction | `invoice_direction` | 同 JP | 🔽 下拉选择（枚举值：PURCHASE / SALES） | ✅ / ✅ |
| Company | `company_code` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Document Type | `document_type` | 同 JP | ✏️ 文本输入（AI 识别后可修正） | ✅ / ✅ |
| Vendor Name | `vendor_name` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice No. | `invoice_number` | 同 JP | ✏️ 文本输入 | ⚪ / ⚪ |
| Currency | `currency` | USD | 🔽 下拉选择（枚举值：JPY / USD / CNY / SGD / TWD） | ✅ / ✅ |
| Total Amount | `total_amount` | 同 JP | 🔢 数字输入 | ✅ / ✅ |
| Excl. Tax Amount | `amount_excluding_tax` | 同 JP | 🔢 数字输入 | ⚪ / ⚪ |
| Tax Amount | `tax_amount` | 同 JP | 🔢 数字输入 | ⚪ / ⚪ |
| Tax Reg. No. | `tax_registration_no` | EIN / 卖方税号，AI 可能识别，财务可补填（US 样本多为空） | ✏️ 文本输入 | ⚪ / ⚪ |
| Business Category | `business_category` | 同 JP | ✏️ 文本输入（AI 识别后可修正） | ✅ / ✅ |
| Payment Type | `payment_type` | 同 JP | 🔽 下拉选择（枚举值：ADMINISTRATIVE / NON_ADMINISTRATIVE） | ✅ / ✅ |
| Line Items | `line_items[*]` | 同 JP | ✏️ 可编辑表格（逐行修改，不支持新增/删除行） | ⚪ / ⚪ |
| Purpose | `payment_purpose` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice Date | `invoice_date` | 同 JP | 📅 日期选择器 | ⚪ / ⚪ |
| Due Date | `due_date` | 同 JP | 📅 日期选择器 | ⚪ / ⚪ |
| Service Period | `service_period_start` / `service_period_end` | 同 JP | 📅 日期选择器（开始 + 结束各一个） | ⚪ / ⚪ |
| Accounting Date | `accounting_date` | 同 JP | 📝 日期选择器（必须手填） | ✅ / ✅ |
| Bank Name | `ext_data.bank_account.bank_name` | **收款方**银行名称（结构化） | ✏️ 文本输入 | ✅ / ✅ |
| Account Type | `ext_data.bank_account.account_type` | **收款方**账户类型（e.g. CHECKING） | ✏️ 文本输入 | ⚪ / ⚪ |
| Account No. | `ext_data.bank_account.account_no` | **收款方**账号 | ✏️ 文本输入 | ✅ / ✅ |
| Account Name | `ext_data.bank_account.account_name` | **收款方**账户持有人名称；两个方向均需核验 | ✏️ 文本输入 | ✅ / ✅ |
| SWIFT Code | `ext_data.payment_rail.swift_code` | **收款方路由**：跨境收款时必需，收款方在非美国银行时使用 | ✏️ 文本输入（8 或 11 位） | ⚪ / ⚪ |
| ACH Routing | `ext_data.payment_rail.ach_routing` | **收款方路由**：ACH 路由号（9位），美国本地转账必需 | ✏️ 文本输入（限 9 位数字，AI 识别率 5.6%） | ⚪ / — |
| Wire Routing | `ext_data.payment_rail.wire_routing` | **收款方路由**：Wire 路由号，电汇专用 | ✏️ 文本输入（限 9 位数字） | ⚪ / — |
| Payer Bank | `payer_bank_name` | 发票付款方银行。PURCHASE 下为 CTW 出款账户，AI 可能识别到信用卡信息（如 `Visa 4*** 5636`） | 🔽 下拉选择（【待确认】从 CTW 固定银行账户中选择，AI 识别率低） | ✅ / ⚪ |
| Payer Account | `payer_account_name` | 付款方账户名称。PURCHASE 下为 CTW 实体名称，与 `payer_bank_name` 配套 | ✏️ 文本输入 | ✅ / ⚪ |
| Recognition | `recognition_policy` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Allocation | `allocation_method` | 同 JP | 🔽 下拉选择（枚举值同 JP），仅 ACCRUAL_BY_SERVICE_PERIOD 时可编辑 | ⚪ / ⚪ |

> ⚠️ US 付款路由必填联动：`ach_routing` 和 `wire_routing` 至少填一个；若两者均为空且 `swift_code` 也为空，则无法发起付款。bank_account 联动逻辑同 JP。

### 不需要展示的字段

| 字段路径 | 不展示原因 |
|---|---|
| `ext_data.payment_rail.bank_code` / `branch_code` | 美国银行系统不使用数字银行代码，用 routing number 代替 |
| `ext_data.payment_rail.account_name_kana` / `bank_name_kana` | 日本片假名字段，美国完全不适用 |
| `ext_data.payment_rail.paynow_uen` | 新加坡 PayNow 专用，美国不适用 |
| `payee_bank_name` / `payee_account_no` | 与 `ext_data.bank_account.*` 重复，不重复展示 |
| `payee_name` | 与 `ext_data.bank_account.account_name` 业务含义等价（已确认），以结构化字段为准；写入时须同步覆盖顶层 `payee_name` |
| 所有系统内部字段 | 见通用规范 |

---

## 三、SG 地区（新加坡）

**付款特征**：新加坡本地转账可用 PayNow（UEN）或 FAST，跨境汇款用 SWIFT。有银行代码体系（部分银行）。

### 需要展示的字段

| 字段路径 | 展示原因 | 手填方式 | 必填（PURCHASE/SALE）|
|---|---|---|---|
| 前端标签 | 字段路径 | 展示原因 | 手填方式 | 必填（PURCHASE/SALE）|
|---|---|---|---|---|
| Description | `invoice_description` | 同 JP | ✏️ 文本输入（多行，AI 识别错误时财务可修正） | ⚪ / ⚪ |
| Region | `region_code` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Direction | `invoice_direction` | 同 JP | 🔽 下拉选择（枚举值：PURCHASE / SALES） | ✅ / ✅ |
| Company | `company_code` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Document Type | `document_type` | 同 JP | ✏️ 文本输入（AI 识别后可修正） | ✅ / ✅ |
| Vendor Name | `vendor_name` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice No. | `invoice_number` | 同 JP | ✏️ 文本输入 | ⚪ / ⚪ |
| Currency | `currency` | SGD / USD | 🔽 下拉选择（枚举值：JPY / USD / CNY / SGD / TWD） | ✅ / ✅ |
| Total Amount | `total_amount` | 同 JP | 🔢 数字输入 | ✅ / ✅ |
| Excl. Tax Amount | `amount_excluding_tax` | 同 JP | 🔢 数字输入 | ✅ / ✅ |
| Tax Amount | `tax_amount` | 同 JP | 🔢 数字输入 | ⚪ / ⚪ |
| Tax Reg. No. | `tax_registration_no` | GST 登记号，AI 可能识别，财务可补填（SG 样本多为空） | ✏️ 文本输入 | ⚪ / ⚪ |
| Business Category | `business_category` | 同 JP | ✏️ 文本输入（AI 识别后可修正） | ✅ / ✅ |
| Payment Type | `payment_type` | 同 JP | 🔽 下拉选择（枚举值：ADMINISTRATIVE / NON_ADMINISTRATIVE） | ✅ / ✅ |
| Line Items | `line_items[*]` | 同 JP | ✏️ 可编辑表格（逐行修改，不支持新增/删除行） | ⚪ / ⚪ |
| Purpose | `payment_purpose` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice Date / Due Date | `invoice_date` / `due_date` | 同 JP | 📅 日期选择器 | ⚪ / ⚪ |
| Service Period | `service_period_start` / `service_period_end` | 同 JP | 📅 日期选择器（开始 + 结束各一个） | ⚪ / ⚪ |
| Accounting Date | `accounting_date` | 同 JP | 📝 日期选择器（必须手填） | ✅ / ✅ |
| Bank Name | `ext_data.bank_account.bank_name` | **收款方**银行名称（结构化） | ✏️ 文本输入 | ✅ / ✅ |
| Branch Name | `ext_data.bank_account.branch_name` | **收款方**支行名称 | ✏️ 文本输入 | ⚪ / ⚪ |
| Account Type | `ext_data.bank_account.account_type` | **收款方**账户类型（e.g. CHECKING） | ✏️ 文本输入 | ⚪ / ⚪ |
| Account No. | `ext_data.bank_account.account_no` | **收款方**账号 | ✏️ 文本输入 | ✅ / ✅ |
| Account Name | `ext_data.bank_account.account_name` | **收款方**账户持有人名称；两个方向均需核验 | ✏️ 文本输入 | ✅ / ✅ |
| Bank Code | `ext_data.payment_rail.bank_code` | 新加坡部分银行有 bank code | ✏️ 文本输入 | ⚪ / ⚪ |
| Branch Code | `ext_data.payment_rail.branch_code` | 新加坡部分银行有 branch code | ✏️ 文本输入 | ⚪ / ⚪ |
| SWIFT Code | `ext_data.payment_rail.swift_code` | **SG 跨境汇款必需**：新加坡对外付款走 SWIFT | ✏️ 文本输入（8 或 11 位） | ⚪ / ⚪ |
| PayNow UEN | `ext_data.payment_rail.paynow_uen` | **SG 特有**：PayNow UEN，本地快速转账标识（当前样本均为 null，预留展示位） | ✏️ 文本输入（AI 暂不识别，需财务补填） | ⚪ / ⚪ |
| Payer Bank | `payer_bank_name` | 发票付款方银行。PURCHASE 下为 CTW 出款银行，当发票正文提及时 AI 识别 | 🔽 下拉选择（【待确认】从 CTW 固定银行账户中选择，AI 识别率低） | ✅ / ⚪ |
| Payer Account | `payer_account_name` | 付款方账户名称。PURCHASE 下为 CTW 实体名称，与 `payer_bank_name` 配套 | ✏️ 文本输入 | ✅ / ⚪ |
| Recognition | `recognition_policy` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Allocation | `allocation_method` | 同 JP | 🔽 下拉选择（枚举值同 JP），仅 ACCRUAL_BY_SERVICE_PERIOD 时可编辑 | ⚪ / ⚪ |

> ⚠️ SG 付款路由说明：`swift_code`、`bank_code`、`paynow_uen` 三个路由字段视具体付款方式填写其中一种。bank_account 联动逻辑同 JP。

### 不需要展示的字段

| 字段路径 | 不展示原因 |
|---|---|
| `ext_data.payment_rail.ach_routing` / `wire_routing` | 美国支付体系，新加坡不适用 |
| `ext_data.payment_rail.account_name_kana` / `bank_name_kana` | 日本专用，新加坡不适用 |
| `payee_bank_name` / `payee_account_no` | 与 `ext_data.bank_account.*` 重复，不重复展示 |
| `payee_name` | 与 `ext_data.bank_account.account_name` 业务含义等价（已确认），以结构化字段为准；写入时须同步覆盖顶层 `payee_name` |
| 所有系统内部字段 | 见通用规范 |

---

## 四、CN 地区（中国大陆）

**付款特征**：对外付款（CN → 境外）走 SWIFT 国际电汇。当前 CTW 中国地区发票多为集团内部结算（CTW SH → CTW 其他主体），金额较大。

### 需要展示的字段

| 字段路径 | 展示原因 | 手填方式 | 必填（PURCHASE/SALE）|
|---|---|---|---|
| 前端标签 | 字段路径 | 展示原因 | 手填方式 | 必填（PURCHASE/SALE）|
|---|---|---|---|---|
| Description | `invoice_description` | 同 JP | ✏️ 文本输入（多行，AI 识别错误时财务可修正） | ⚪ / ⚪ |
| Region | `region_code` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Direction | `invoice_direction` | 同 JP | 🔽 下拉选择（枚举值：PURCHASE / SALES） | ✅ / ✅ |
| Company | `company_code` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Document Type | `document_type` | 同 JP | ✏️ 文本输入（AI 识别后可修正） | ✅ / ✅ |
| Vendor Name | `vendor_name` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice No. | `invoice_number` | 同 JP | ✏️ 文本输入 | ⚪ / ⚪ |
| Currency | `currency` | USD（样本为跨境结算） | 🔽 下拉选择（枚举值：JPY / USD / CNY / SGD / TWD） | ✅ / ✅ |
| Total Amount | `total_amount` | 同 JP | 🔢 数字输入 | ✅ / ✅ |
| Excl. Tax Amount | `amount_excluding_tax` | 同 JP | 🔢 数字输入 | ✅ / ✅ |
| Tax Amount | `tax_amount` | 同 JP | 🔢 数字输入 | ⚪ / ⚪ |
| Tax Reg. No. | `tax_registration_no` | 统一社会信用代码，AI 可能识别，财务可补填（CN 样本多为空） | ✏️ 文本输入 | ⚪ / ⚪ |
| Business Category | `business_category` | 同 JP | ✏️ 文本输入（AI 识别后可修正） | ✅ / ✅ |
| Payment Type | `payment_type` | 同 JP | 🔽 下拉选择（枚举值：ADMINISTRATIVE / NON_ADMINISTRATIVE） | ✅ / ✅ |
| Line Items | `line_items[*]` | CN 样本明细行最多达 6 行（技术服务费按项目拆分），明细核验重要性高 | ✏️ 可编辑表格（逐行修改，不支持新增/删除行） | ⚪ / ⚪ |
| Purpose | `payment_purpose` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice Date / Due Date | `invoice_date` / `due_date` | 同 JP | 📅 日期选择器 | ⚪ / ⚪ |
| Service Period | `service_period_start` / `service_period_end` | 同 JP | 📅 日期选择器（开始 + 结束各一个） | ⚪ / ⚪ |
| Accounting Date | `accounting_date` | 同 JP | 📝 日期选择器（必须手填） | ✅ / ✅ |
| Bank Name | `ext_data.bank_account.bank_name` | **收款方**银行名称（结构化） | ✏️ 文本输入 | ✅ / ✅ |
| Branch Name | `ext_data.bank_account.branch_name` | **收款方**支行名称 | ✏️ 文本输入 | ⚪ / ⚪ |
| Account Type | `ext_data.bank_account.account_type` | **收款方**账户类型（e.g. CHECKING） | ✏️ 文本输入 | ⚪ / ⚪ |
| Account No. | `ext_data.bank_account.account_no` | **收款方**账号 | ✏️ 文本输入 | ✅ / ✅ |
| Account Name | `ext_data.bank_account.account_name` | **收款方**账户持有人名称；两个方向均需核验 | ✏️ 文本输入 | ✅ / ✅ |
| SWIFT Code | `ext_data.payment_rail.swift_code` | **CN 对外付款必需**：中国银行对外汇款强制要求收款方 SWIFT Code | ✏️ 文本输入（8 或 11 位） | ✅ / ✅ |
| Payer Bank | `payer_bank_name` | 发票付款方银行。PURCHASE 下为 CTW 出款银行，当发票正文提及时 AI 识别 | 🔽 下拉选择（【待确认】从 CTW 固定银行账户中选择，AI 识别率低） | ✅ / ⚪ |
| Payer Account | `payer_account_name` | 付款方账户名称。PURCHASE 下为 CTW 实体名称，与 `payer_bank_name` 配套 | ✏️ 文本输入 | ✅ / ⚪ |
| Recognition | `recognition_policy` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Allocation | `allocation_method` | 同 JP | 🔽 下拉选择（枚举值同 JP），仅 ACCRUAL_BY_SERVICE_PERIOD 时可编辑 | ⚪ / ⚪ |

> ⚠️ CN 付款路由：`swift_code` 为对外汇款强制要求，若为空则无法发起 CN 付款。bank_account 联动逻辑同 JP。

### 不需要展示的字段

| 字段路径 | 不展示原因 |
|---|---|
| `ext_data.payment_rail.ach_routing` / `wire_routing` | 美国支付体系，中国不适用 |
| `ext_data.payment_rail.paynow_uen` | 新加坡专用，中国不适用 |
| `ext_data.payment_rail.account_name_kana` / `bank_name_kana` | 日本专用，中国不适用 |
| `ext_data.payment_rail.bank_code` / `branch_code` | 中国跨境付款使用 SWIFT，不使用本地银行代码 |
| `payee_bank_name` / `payee_account_no` | 与 `ext_data.bank_account.*` 重复，不重复展示 |
| `payee_name` | 与 `ext_data.bank_account.account_name` 业务含义等价（已确认），以结构化字段为准；写入时须同步覆盖顶层 `payee_name` |
| 所有系统内部字段 | 见通用规范 |

---

## 五、TW 地区（台湾）

> ⚠️ 当前样本仅 1 条，以下规则基于该样本的实际字段推断。

**付款特征**：TW 样本使用 SWIFT 汇款（跨境），`swift_code` 为实际必填路由字段；本地银行代码体系（`bank_code` / `branch_code`）暂无样本支撑，列为可选展示。CTW 台湾主体为 AINEKOX CO LTD.。

### 需要展示的字段

| 字段路径 | 展示原因 | 手填方式 | 必填（PURCHASE/SALE）|
|---|---|---|---|
| 前端标签 | 字段路径 | 展示原因 | 手填方式 | 必填（PURCHASE/SALE）|
|---|---|---|---|---|
| Description | `invoice_description` | 同 JP | ✏️ 文本输入（多行，AI 识别错误时财务可修正） | ⚪ / ⚪ |
| Region | `region_code` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Direction | `invoice_direction` | 同 JP | 🔽 下拉选择（枚举值：PURCHASE / SALES） | ✅ / ✅ |
| Company | `company_code` | 标识付款主体，TW 对应 AINEKOX CO LTD. | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Document Type | `document_type` | 同 JP | ✏️ 文本输入（AI 识别后可修正） | ✅ / ✅ |
| Vendor Name | `vendor_name` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice No. | `invoice_number` | 同 JP | ✏️ 文本输入 | ⚪ / ⚪ |
| Currency | `currency` | TWD（或 USD 跨境结算） | 🔽 下拉选择（枚举值：JPY / USD / CNY / SGD / TWD） | ✅ / ✅ |
| Total Amount | `total_amount` | 同 JP | 🔢 数字输入 | ✅ / ✅ |
| Excl. Tax Amount | `amount_excluding_tax` | 同 JP | 🔢 数字输入 | ⚪ / ⚪ |
| Tax Amount | `tax_amount` | 同 JP | 🔢 数字输入 | ⚪ / ⚪ |
| Tax Reg. No. | `tax_registration_no` | 台湾统一编号（统编），AI 可能识别，财务可补填 | ✏️ 文本输入 | ⚪ / ⚪ |
| Business Category | `business_category` | 同 JP | ✏️ 文本输入（AI 识别后可修正） | ✅ / ✅ |
| Payment Type | `payment_type` | 同 JP | 🔽 下拉选择（枚举值：ADMINISTRATIVE / NON_ADMINISTRATIVE） | ✅ / ✅ |
| Line Items | `line_items[*]` | 同 JP | ✏️ 可编辑表格（逐行修改，不支持新增/删除行） | ⚪ / ⚪ |
| Purpose | `payment_purpose` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice Date / Due Date | `invoice_date` / `due_date` | 同 JP | 📅 日期选择器 | ⚪ / ⚪ |
| Service Period | `service_period_start` / `service_period_end` | 同 JP | 📅 日期选择器（开始 + 结束各一个） | ⚪ / ⚪ |
| Accounting Date | `accounting_date` | 同 JP | 📝 日期选择器（必须手填） | ✅ / ✅ |
| Bank Name | `ext_data.bank_account.bank_name` | **收款方**银行名称（结构化） | ✏️ 文本输入 | ✅ / ✅ |
| Branch Name | `ext_data.bank_account.branch_name` | **收款方**支行名称 | ✏️ 文本输入 | ⚪ / ⚪ |
| Account Type | `ext_data.bank_account.account_type` | **收款方**账户类型（e.g. CHECKING） | ✏️ 文本输入 | ⚪ / ⚪ |
| Account No. | `ext_data.bank_account.account_no` | **收款方**账号 | ✏️ 文本输入 | ✅ / ✅ |
| Account Name | `ext_data.bank_account.account_name` | **收款方**账户持有人名称；两个方向均需核验 | ✏️ 文本输入 | ✅ / ✅ |
| Bank Code | `ext_data.payment_rail.bank_code` | 台湾银行代码（3位），**本地转账**路由（暂无样本支撑，保留备用） | ✏️ 文本输入（限 3 位数字） | ⚪ / ⚪ |
| Branch Code | `ext_data.payment_rail.branch_code` | 台湾支行代码，**本地转账**路由（暂无样本支撑，保留备用） | ✏️ 文本输入 | ⚪ / ⚪ |
| SWIFT Code | `ext_data.payment_rail.swift_code` | **实际样本使用 SWIFT 汇款，为 TW 主要付款路由**，收款方银行国际识别码 | ✏️ 文本输入（8 或 11 位） | ✅ / ⚪ |
| Payer Bank | `payer_bank_name` | 发票付款方银行。PURCHASE 下为 AINEKOX 出款银行，当发票正文提及时 AI 识别 | 🔽 下拉选择（【待确认】从 CTW 固定银行账户中选择，AI 识别率低） | ✅ / ⚪ |
| Payer Account | `payer_account_name` | 付款方账户名称。PURCHASE 下为 AINEKOX 实体名称，与 `payer_bank_name` 配套 | ✏️ 文本输入 | ✅ / ⚪ |
| Recognition | `recognition_policy` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Allocation | `allocation_method` | 同 JP | 🔽 下拉选择（枚举值同 JP），仅 ACCRUAL_BY_SERVICE_PERIOD 时可编辑 | ⚪ / ⚪ |

> ⚠️ TW 付款路由：当前样本使用 SWIFT 汇款，`swift_code` 为必填项；`bank_code` / `branch_code` 为本地转账备用字段，暂无样本支撑，AI 不识别时由财务手填。bank_account 联动逻辑同 JP。

### 不需要展示的字段

| 字段路径 | 不展示原因 |
|---|---|
| `ext_data.payment_rail.ach_routing` / `wire_routing` | 美国支付体系，台湾不适用 |
| `ext_data.payment_rail.paynow_uen` | 新加坡专用，台湾不适用 |
| `ext_data.payment_rail.account_name_kana` / `bank_name_kana` | 日本专用片假名字段，台湾不适用 |
| `payee_bank_name` / `payee_account_no` | 与 `ext_data.bank_account.*` 重复，不重复展示 |
| `payee_name` | 与 `ext_data.bank_account.account_name` 业务含义等价（已确认），以结构化字段为准；写入时须同步覆盖顶层 `payee_name` |
| 所有系统内部字段 | 见通用规范 |

---

## 六、各地区字段差异速查表

| 字段路径 | JP | US | SG | CN | TW | 手填方式 |
|---|---|---|---|---|---|---|
| `region_code` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔽 下拉选择（JP / US / SG / CN / TW） |
| `company_code` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔽 下拉选择（JP_CTW_INC / US_CTW_INC / SG_CTW_INC / SH_WYYCX_INC / AINEKOX CO LTD. 等） |
| `tax_registration_no` | ⚪（JP 适格請求書登録番号） | ⚪（EIN / 卖方税号） | ⚪（GST 登记号） | ⚪（统一社会信用代码） | ⚪（台湾统编） | ✏️ 文本输入（所有地区均展示，均为选填） |
| `ext_data.payment_rail.bank_code` | ✅ | ❌ | ✅ | ❌ | ⚪（本地转账备用） | ✏️ 文本输入（收款方路由） |
| `ext_data.payment_rail.branch_code` | ✅ | ❌ | ✅ | ❌ | ⚪（本地转账备用） | ✏️ 文本输入（收款方路由） |
| `ext_data.payment_rail.account_name_kana` | ✅ / ⚪（PURCHASE 必填；SALE 为 CTW 自身账户名可预填） | ❌ | ❌ | ❌ | ❌ | ✏️ 文本输入（收款方半角片假名，AI 识别率低） |
| `ext_data.payment_rail.bank_name_kana` | ✅（⚪/⚪，财务可补填） | ❌ | ❌ | ❌ | ❌ | ✏️ 文本输入（半角片假名，AI 几乎不识别） |
| `ext_data.payment_rail.swift_code` | ❌ | ✅（跨境时） | ✅ | ✅ | ✅（主要路由） | ✏️ 文本输入（8 或 11 位） |
| `ext_data.payment_rail.ach_routing` | ❌ | ✅（本地转账） | ❌ | ❌ | ❌ | ✏️ 文本输入（9 位，AI 识别率 5.6%） |
| `ext_data.payment_rail.wire_routing` | ❌ | ✅（电汇） | ❌ | ❌ | ❌ | ✏️ 文本输入（9 位） |
| `ext_data.payment_rail.paynow_uen` | ❌ | ❌ | ✅（预留） | ❌ | ❌ | ✏️ 文本输入（AI 暂不识别） |
| `payer_bank_name` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔽 下拉选择（【待确认】PURCHASE 下从 CTW 固定账户中选，AI 识别率 5.6%） |
| `payer_account_name` | ✅ | ✅ | ✅ | ✅ | ✅ | ✏️ 文本输入（付款方账户名，PURCHASE 下必填） |
| `accounting_date` | ✅ | ✅ | ✅ | ✅ | ✅ | 📝 日期选择器（所有地区必须手填，AI 从不识别） |
| `due_date` | ✅ | ✅ | ✅ | ✅ | ✅ | 📅 日期选择器（AI 57% 有值，缺失时手填） |
| `invoice_number` | ✅ | ✅ | ✅ | ✅ | ✅ | ✏️ 文本输入（AI 59% 有值，合同类常为空） |

---

## 七、字段手填策略总结

### 📝 日期选择器（必须手填，AI 从不识别）
- `accounting_date`：入账日期，决定进哪个月报表，需财务根据会计准则主动填写

### 🔽 下拉选择（联动控制字段）
- `recognition_policy`：费用确认策略，控制 AI 生成 JE 的数量和期间分布。枚举值及联动规则：
  - `IMMEDIATE`：立即全额确认，无需其他摊销信息
  - `PREPAID_MONTHLY`：按月均摊（MONTHLY_EQUAL），Header 级 `service_period_start/end` 升级为必填
  - `PREPAID_DAILY`：按天比例摊销（DAILY_PRORATA），Header 级 `service_period_start/end` 升级为必填
  - `ACCRUAL_BY_SERVICE_PERIOD`：按服务期摊销，Header 级 `service_period_start/end` 必填 + `allocation_method` 可选
  - `MONTHLY_BY_LINE_ITEM`：按明细行各月确认，每条 `line_items[*].service_period_start/end` 升级为必填
- `allocation_method`：仅在 `ACCRUAL_BY_SERVICE_PERIOD` 时展示并可编辑（MONTHLY_EQUAL / DAILY_PRORATA）；其余策略自动匹配对应方法，不展示独立选项

### ✏️ 文本输入（特殊说明）
- `tax_registration_no`（JP）：法定適格請求書登録番号，AI 识别错误或为空时财务可修正；修改须与原始发票核实，自行确保合规
- `document_type`：AI 识别率高，可手动修正；参考值：INVOICE / PAYMENT_REPORT / RECEIPT / STATEMENT / CONTRACT / CREDIT_NOTE / PROFORMA_INVOICE / QUOTATION / EXPENSE_CLAIM
- `business_category`：AI 识别后可手动修正；参考值：ADVERTISING / ROYALTY / OFFICE_ADMIN / SAAS / CLOUD / PROFESSIONAL_SERVICE / COMMUNICATION / PAYMENT_PROCESSING / TAX / OTHER

### 🔽 下拉选择（固定枚举值）
- `currency`：JPY / USD / CNY / SGD / TWD
- `payment_type`：ADMINISTRATIVE / NON_ADMINISTRATIVE
- `ext_data.bank_account.account_type`：JP 为 普通預金 / 当座預金；US 为 CHECKING / SAVINGS；SG/CN 为 CHECKING / SAVINGS / CURRENT

### 📅 日期选择器（AI 有值时回填，缺失时手填）
- `invoice_date`、`due_date`、`service_period_start`、`service_period_end`

### 🔢 数字输入（AI 有值时回填，识别错误时可修正）
- `total_amount`、`amount_excluding_tax`、`tax_amount`

### ✏️ 文本输入（AI 有值时回填，缺失或识别错误时可修正）
- 主体信息：`vendor_name`、`invoice_number`、`payment_purpose`、`invoice_description`（多行文本）
- 收款方银行账户：`ext_data.bank_account.bank_name`、`ext_data.bank_account.branch_name`、`ext_data.bank_account.account_no`、`ext_data.bank_account.account_name`
- 收款方路由：`ext_data.payment_rail.bank_code`、`ext_data.payment_rail.branch_code`（JP/SG）、`ext_data.payment_rail.account_name_kana`（JP）、`ext_data.payment_rail.swift_code`（US/SG/CN）、`ext_data.payment_rail.ach_routing`、`ext_data.payment_rail.wire_routing`（US）、`ext_data.payment_rail.paynow_uen`（SG）
- 打款方：`payer_bank_name`（【待确认】PURCHASE 下从 CTW 固定银行账户下拉选择；SALES 下同理，`ext_data.bank_account.*` 应从 CTW 固定收款账户中选择）、`payer_account_name`（PURCHASE 下为 CTW 实体名称，文本输入）

### ✏️ 可编辑表格（逐行修改，不支持新增/删除行）
- `line_items[*]`：每行字段包括 `item_name`（品名）、`tax_inclusive_amount`（含税金额）、`tax_rate`（税率）、`amount_excluding_tax`（税前金额）、`description`（明细说明）、`service_period_start` / `service_period_end`（明细服务期间）

---

*文档更新时间：2026-05-22*
*样本来源：3月份 invoice cases，共 179 个 JSON 文件*

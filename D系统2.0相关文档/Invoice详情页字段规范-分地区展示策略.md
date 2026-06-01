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
| Description | `invoice_description` | AI 生成的发票内容摘要，帮助财务快速理解 | ✏️ 文本输入（多行，AI 识别错误时财务可修正） | ✅ / ⚪ |
| Region | `region_code` | 标识发票所属地区，决定后续付款路由规则 | 🔽 下拉选择（枚举值：JP / US / SG / CN / TW） | ✅ / ✅ |
| Company | `company_code` | 标识付款主体（CTW 哪家法人实体出款），与财务账套强关联 | 🔽 下拉选择（枚举值：JP_CTW_INC / US_CTW_INC / SG_CTW_INC / SH_WYYCX_INC 等） | ✅ / ✅ |
| Vendor Name | `vendor_name` | 标识开票方，与付款对象核对 | ✏️ 文本输入 | ✅ / ✅ |
| Invoice No. | `invoice_number` | 发票编号，用于溯源和重复检查 | ✏️ 文本输入 | ✅ / ⚪ |
| Currency | `currency` | 币种，JPY，用于汇率换算和金额展示 | 🔽 下拉选择（枚举值：JPY / USD / CNY / SGD / TWD） | ✅ / ✅ |
| Total Amount | `total_amount` | 含税总金额，主要付款金额 | 🔢 数字输入（AI 识别错误时财务可修正） | ✅ / ✅ |
| Excl. Tax Amount | `amount_excluding_tax` | 税前金额，拆分税务处理 | 🔢 数字输入 | ✅ / ⚪ |
| Tax Amount | `tax_amount` | 税额，与税前金额相加核验（免税发票允许为 0） | 🔢 数字输入 | ✅ / ⚪ |
| Tax Reg. No. | `tax_registration_no` | 適格請求書登録番号，日本消费税合规字段；财务可补填，需与原始发票完全一致 | ✏️ 文本输入 | ✅ / —（SALE 方向不展示）|
| Payment Type | `payment_type` | 行政类/非行政类，影响审批流程；默认选中 NON_ADMINISTRATIVE | 🔽 下拉选择（枚举值：ADMINISTRATIVE / NON_ADMINISTRATIVE） | ✅ / ✅ |
| Line Items | `line_items[*]` | 费用明细行，核验并修正 AI 解析的明细数据；每行包含：`item_name`（品名）、`tax_inclusive_amount`（含税金额）、`tax_rate`（税率）、`amount_excluding_tax`（税前金额）、`description`（明细说明）、`service_period_start/end`（明细服务期间）。示例：品名 `G123-PSP`，含税 `25428.64`，税率 `8%` | ✏️ 可编辑表格（逐行修改，支持新增/删除行） | ⚪ / ⚪ |
| Purpose | `payment_purpose` | 打款用途，说明这笔钱用于什么 | ✏️ 文本输入 | ✅ / ✅ |
| Invoice Date | `invoice_date` | 发票开具日期 | 📅 日期选择器 | ✅ / ✅ |
| Due Date | `due_date` | 付款截止日期（57% 有值，合同类无此字段） | 📅 日期选择器 | ⚪ / —（SALE 方向不展示）|
| Service Period | `service_period_start` / `service_period_end` | 服务期间，用于费用摊销判断 | 📅 日期选择器（开始 + 结束各一个） | ⚪ / ✅ |
| Accounting Date | `accounting_date` | 入账日期，决定进哪个月的账 | 📝 日期选择器（AI 从不识别，0/179，必须手填） | ✅ / ✅ |
| Bank Name | `ext_data.bank_account.bank_name` | **收款方**银行名称（结构化），转账必要信息 | ✏️ 文本输入 | ✅ / ⚪ |
| Branch Name | `ext_data.bank_account.branch_name` | **收款方**支行名称（JP 内汇必填） | ✏️ 文本输入 | ✅ / ⚪ |
| Account Type | `ext_data.bank_account.account_type` | **收款方**账户类型，JP 专用枚举 | 🔽 下拉选择（普通預金 / 当座預金 / 定期預金） | ✅ / ⚪ |
| Account No. | `ext_data.bank_account.account_no` | **收款方**口座番号（7位） | ✏️ 文本输入（限 7 位数字） | ✅ / ⚪ |
| Account Name | `ext_data.bank_account.account_name` | **收款方**账户名称（JP 需片假名）；PURCHASE 下为供应商账户名，SALE 下为 CTW 收款账户名 | ✏️ 文本输入 | ✅ / ⚪ |
| Bank Code | `ext_data.payment_rail.bank_code` | 银行代码（4位，JP 金融机构代码） | ✏️ 文本输入（限 4 位数字） | ✅ / ⚪ |
| Branch Code | `ext_data.payment_rail.branch_code` | 支行代码（3位） | ✏️ 文本输入（限 3 位数字） | ✅ / ⚪ |
| Account Name (Kana) | `ext_data.payment_rail.account_name_kana` | 口座名義（半角片假名）；日本内汇银行系统格式要求，AI 识别率 5%，多数需财务补填 | ✏️ 文本输入（半角片假名格式，AI 识别率 5%，多数需财务补填） | ⚪ / —（SALE 方向不展示）|
| Bank Name (Kana) | `ext_data.payment_rail.bank_name_kana` | 銀行名（半角片假名），部分银行系统报文要求 | ✏️ 文本输入（半角片假名格式） | ⚪ / —（SALE 方向不展示）|
| SWIFT Code | `ext_data.payment_rail.swift_code` | 国际汇款时使用；JP 内汇通常不需要，但对外付款或特殊场景下可填写 | ✏️ 文本输入（8 或 11 位） | ⚪ / —（SALE 方向不展示）|
| Payer Bank | `payer_bank_name` | 发票付款方银行。PURCHASE 下为 CTW 出款银行；仅在发票正文提及时 AI 识别 | ✏️ 文本输入（可手动填写/修改；输入框右侧提供快速填充图标，选择预设后同步填入 Payer Bank + Payer Account） | ⚪ / ⚪ |
| Payer Account | `payer_account_name` | 付款方账户名称，与 `payer_bank_name` 配套使用，明确付款主体 | ✏️ 文本输入（可手动填写/修改；通过 Payer Bank 快速填充联动写入） | ⚪ / ⚪ |
| Allocation Required | `allocation_required` | 是否需要跨期分摊，控制 Allocation 字段的显示；Yes = 需要摊销，显示 Allocation；No = 不摊销，Allocation 隐藏 | 🔽 下拉选择（Yes / No） | ⚪ / ⚪ |
| Allocation | `allocation_method` | 摊销计算方式，仅 allocation_required=Yes 时展示；枚举值：MONTHLY_EQUAL（按月平均）/ DAILY_PRORATA（按天比例）/ MONTHLY_BY_LINE_ITEM（明细行已按月拆分）/ BY_LINE_ITEM_PERIOD（行项目按非月度期间拆分）/ BY_EXPLICIT_SCHEDULE（按单据 schedule）/ USAGE_BASED（按用量分摊）/ MANUAL（证据不足，人工处理） | 🔽 下拉选择（7 个枚举值，条件展示） | ⚪ / ⚪ |
| Recognition | `recognition_policy` | 费用确认策略，决定 AI 生成几条 JE 及所属期间；枚举值：IMMEDIATE（立即确认）/ PREPAID_MONTHLY（预付按月摊）/ PREPAID_DAILY（预付按天摊）/ ACCRUAL_BY_SERVICE_PERIOD（按可见服务期计提）/ MONTHLY_BY_LINE_ITEM（月度明细行即确认依据）/ SCHEDULED_BY_DOCUMENT（按单据 schedule 确认）/ USAGE_BASED（按用量/消耗确认）/ MILESTONE_BASED（按里程碑验收确认） | 🔽 下拉选择（8 个枚举值） | ⚪ / ⚪ |

> ⚠️ **bank_account 必填规则**：`bank_name`、`branch_name`、`account_no`、`account_name`（JP 还需 `account_type`、`bank_code`、`branch_code`）在 **PURCHASE** 方向为供应商（收款方）银行账户，是银行转账的必要信息，均为必填；**SALE** 方向为 CTW 收款账户，客户依此打款，此时 bank_account 字段调整为选填（CTW 账户信息由系统预置，财务可按需补填）。JP 专用字段 `account_name_kana`、`bank_name_kana` 在 PURCHASE 方向为选填，SALE 方向不展示。
>
> ⚠️ **line_items 内部必填规则**：有明细行时，每行的 `item_name`、`tax_inclusive_amount`、`tax_rate` 为必填；`amount_excluding_tax`、`description`、`service_period` 为选填。
>
> 联动规则详见「**九、Fee Recognition 联动规则**」章节。

### 不需要展示的字段

| 字段路径 | 不展示原因 |
|---|---|
| `business_category` | 前端详情页不展示，由系统根据其他字段自动映射 |
| `document_type` | 前端详情页不展示，后端字段保留；AI 识别值由系统内部流转使用，财务无需感知 |
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
| Description | `invoice_description` | 同 JP | ✏️ 文本输入（多行，AI 识别错误时财务可修正） | ✅ / ⚪ |
| Region | `region_code` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Company | `company_code` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Vendor Name | `vendor_name` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice No. | `invoice_number` | 同 JP | ✏️ 文本输入 | ✅ / ⚪ |
| Currency | `currency` | USD | 🔽 下拉选择（枚举值：JPY / USD / CNY / SGD / TWD） | ✅ / ✅ |
| Total Amount | `total_amount` | 同 JP | 🔢 数字输入 | ✅ / ✅ |
| Excl. Tax Amount | `amount_excluding_tax` | 同 JP | 🔢 数字输入 | ✅ / ⚪ |
| Tax Amount | `tax_amount` | 同 JP | 🔢 数字输入 | ✅ / ⚪ |
| Tax Reg. No. | `tax_registration_no` | EIN / 卖方税号，AI 可能识别，财务可补填（US 样本多为空） | ✏️ 文本输入 | ⚪ / —（SALE 方向不展示）|
| Payment Type | `payment_type` | 同 JP；默认选中 NON_ADMINISTRATIVE | 🔽 下拉选择（枚举值：ADMINISTRATIVE / NON_ADMINISTRATIVE） | ✅ / ✅ |
| Line Items | `line_items[*]` | 同 JP | ✏️ 可编辑表格（逐行修改，支持新增/删除行） | ⚪ / ⚪ |
| Purpose | `payment_purpose` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice Date | `invoice_date` | 同 JP | 📅 日期选择器 | ✅ / ✅ |
| Due Date | `due_date` | 同 JP | 📅 日期选择器 | ⚪ / —（SALE 方向不展示）|
| Service Period | `service_period_start` / `service_period_end` | 同 JP | 📅 日期选择器（开始 + 结束各一个） | ⚪ / ✅ |
| Accounting Date | `accounting_date` | 同 JP | 📝 日期选择器（必须手填） | ✅ / ✅ |
| Bank Name | `ext_data.bank_account.bank_name` | **收款方**银行名称（结构化） | ✏️ 文本输入 | ✅ / ⚪ |
| Account No. | `ext_data.bank_account.account_no` | **收款方**账号 | ✏️ 文本输入 | ✅ / ⚪ |
| Account Name | `ext_data.bank_account.account_name` | **收款方**账户持有人名称；两个方向均需核验 | ✏️ 文本输入 | ✅ / ⚪ |
| SWIFT Code | `ext_data.payment_rail.swift_code` | **收款方路由**：跨境收款时使用 | ✏️ 文本输入（8 或 11 位） | ⚪ / —（SALE 方向不展示）|
| ACH Routing | `ext_data.payment_rail.ach_routing` | **收款方路由**：ACH 路由号（9位），美国本地转账必需 | ✏️ 文本输入（限 9 位数字，AI 识别率 5.6%） | ⚪ / —（SALE 方向不展示）|
| Wire Routing | `ext_data.payment_rail.wire_routing` | **收款方路由**：Wire 路由号，电汇专用 | ✏️ 文本输入（限 9 位数字） | ⚪ / —（SALE 方向不展示）|
| Payer Bank | `payer_bank_name` | 发票付款方银行。PURCHASE 下为 CTW 出款账户 | ✏️ 文本输入（可手动填写/修改；输入框右侧提供快速填充图标，选择预设后同步填入 Payer Bank + Payer Account） | ⚪ / ⚪ |
| Payer Account | `payer_account_name` | 付款方账户名称。PURCHASE 下为 CTW 实体名称，与 `payer_bank_name` 配套 | ✏️ 文本输入（可手动填写/修改；通过 Payer Bank 快速填充联动写入） | ⚪ / ⚪ |
| Allocation Required | `allocation_required` | 同 JP | 🔽 下拉选择（Yes / No） | ⚪ / ⚪ |
| Allocation | `allocation_method` | 同 JP，allocation_required=Yes 时展示 | 🔽 下拉选择（枚举值同 JP，条件展示） | ⚪ / ⚪ |
| Recognition | `recognition_policy` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ⚪ / ⚪ |

> ⚠️ US 付款路由必填联动：`ach_routing` 和 `wire_routing` 至少填一个；若两者均为空且 `swift_code` 也为空，则无法发起付款。bank_account 联动逻辑同 JP。

### 不需要展示的字段

| 字段路径 | 不展示原因 |
|---|---|
| `business_category` | 前端详情页不展示，由系统根据其他字段自动映射 |
| `document_type` | 前端详情页不展示，后端字段保留；AI 识别值由系统内部流转使用，财务无需感知 |
| `ext_data.bank_account.account_type` | JP 专用枚举字段（普通/当座/定期預金），美国不适用 |
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

| 前端标签 | 字段路径 | 展示原因 | 手填方式 | 必填（PURCHASE/SALE）|
|---|---|---|---|---|
| Description | `invoice_description` | 同 JP | ✏️ 文本输入（多行，AI 识别错误时财务可修正） | ✅ / ⚪ |
| Region | `region_code` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Company | `company_code` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Vendor Name | `vendor_name` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice No. | `invoice_number` | 同 JP | ✏️ 文本输入 | ✅ / ⚪ |
| Currency | `currency` | SGD / USD | 🔽 下拉选择（枚举值：JPY / USD / CNY / SGD / TWD） | ✅ / ✅ |
| Total Amount | `total_amount` | 同 JP | 🔢 数字输入 | ✅ / ✅ |
| Excl. Tax Amount | `amount_excluding_tax` | 同 JP | 🔢 数字输入 | ✅ / ⚪ |
| Tax Amount | `tax_amount` | 同 JP | 🔢 数字输入 | ✅ / ⚪ |
| Tax Reg. No. | `tax_registration_no` | GST 登记号，AI 可能识别，财务可补填（SG 样本多为空） | ✏️ 文本输入 | ⚪ / —（SALE 方向不展示）|
| Payment Type | `payment_type` | 同 JP；默认选中 NON_ADMINISTRATIVE | 🔽 下拉选择（枚举值：ADMINISTRATIVE / NON_ADMINISTRATIVE） | ✅ / ✅ |
| Line Items | `line_items[*]` | 同 JP | ✏️ 可编辑表格（逐行修改，支持新增/删除行） | ⚪ / ⚪ |
| Purpose | `payment_purpose` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice Date | `invoice_date` | 同 JP | 📅 日期选择器 | ✅ / ✅ |
| Due Date | `due_date` | 同 JP | 📅 日期选择器 | ⚪ / —（SALE 方向不展示）|
| Service Period | `service_period_start` / `service_period_end` | 同 JP | 📅 日期选择器（开始 + 结束各一个） | ⚪ / ✅ |
| Accounting Date | `accounting_date` | 同 JP | 📝 日期选择器（必须手填） | ✅ / ✅ |
| Bank Name | `ext_data.bank_account.bank_name` | **收款方**银行名称（结构化） | ✏️ 文本输入 | ✅ / ⚪ |
| Branch Name | `ext_data.bank_account.branch_name` | **收款方**支行名称 | ✏️ 文本输入 | ✅ / ⚪ |
| Account No. | `ext_data.bank_account.account_no` | **收款方**账号 | ✏️ 文本输入 | ✅ / ⚪ |
| Account Name | `ext_data.bank_account.account_name` | **收款方**账户持有人名称；两个方向均需核验 | ✏️ 文本输入 | ✅ / ⚪ |
| Bank Code | `ext_data.payment_rail.bank_code` | 新加坡部分银行有 bank code | ✏️ 文本输入 | ⚪ / ⚪ |
| Branch Code | `ext_data.payment_rail.branch_code` | 新加坡部分银行有 branch code | ✏️ 文本输入 | ⚪ / ⚪ |
| SWIFT Code | `ext_data.payment_rail.swift_code` | **SG 跨境汇款**：新加坡对外付款走 SWIFT | ✏️ 文本输入（8 或 11 位） | ⚪ / —（SALE 方向不展示）|
| PayNow UEN | `ext_data.payment_rail.paynow_uen` | **SG 特有**：PayNow UEN，本地快速转账标识 | ✏️ 文本输入（AI 暂不识别，需财务补填） | ⚪ / —（SALE 方向不展示）|
| Payer Bank | `payer_bank_name` | 发票付款方银行。PURCHASE 下为 CTW 出款银行 | 🔽 下拉选择（【待确认】从 CTW 固定银行账户中选择） | ⚪ / ⚪ |
| Payer Account | `payer_account_name` | 付款方账户名称。PURCHASE 下为 CTW 实体名称，与 `payer_bank_name` 配套 | ✏️ 文本输入 | ⚪ / ⚪ |
| Allocation Required | `allocation_required` | 同 JP | 🔽 下拉选择（Yes / No） | ⚪ / ⚪ |
| Allocation | `allocation_method` | 同 JP，allocation_required=Yes 时展示 | 🔽 下拉选择（枚举值同 JP，条件展示） | ⚪ / ⚪ |
| Recognition | `recognition_policy` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ⚪ / ⚪ |

> ⚠️ SG 付款路由说明：`swift_code`、`bank_code`、`paynow_uen` 三个路由字段视具体付款方式填写其中一种。bank_account 联动逻辑同 JP。

### 不需要展示的字段

| 字段路径 | 不展示原因 |
|---|---|
| `business_category` | 前端详情页不展示，由系统根据其他字段自动映射 |
| `document_type` | 前端详情页不展示，后端字段保留；AI 识别值由系统内部流转使用，财务无需感知 |
| `ext_data.bank_account.account_type` | JP 专用枚举字段（普通/当座/定期預金），新加坡不适用 |
| `ext_data.payment_rail.ach_routing` / `wire_routing` | 美国支付体系，新加坡不适用 |
| `ext_data.payment_rail.account_name_kana` / `bank_name_kana` | 日本专用，新加坡不适用 |
| `payee_bank_name` / `payee_account_no` | 与 `ext_data.bank_account.*` 重复，不重复展示 |
| `payee_name` | 与 `ext_data.bank_account.account_name` 业务含义等价（已确认），以结构化字段为准；写入时须同步覆盖顶层 `payee_name` |
| 所有系统内部字段 | 见通用规范 |

---

## 四、CN 地区（中国大陆）

**付款特征**：对外付款（CN → 境外）走 SWIFT 国际电汇。当前 CTW 中国地区发票多为集团内部结算（CTW SH → CTW 其他主体），金额较大。

### 需要展示的字段

| 前端标签 | 字段路径 | 展示原因 | 手填方式 | 必填（PURCHASE/SALE）|
|---|---|---|---|---|
| Description | `invoice_description` | 同 JP | ✏️ 文本输入（多行，AI 识别错误时财务可修正） | ✅ / ⚪ |
| Region | `region_code` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Company | `company_code` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Vendor Name | `vendor_name` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice No. | `invoice_number` | 同 JP | ✏️ 文本输入 | ✅ / ⚪ |
| Currency | `currency` | USD（样本为跨境结算） | 🔽 下拉选择（枚举值：JPY / USD / CNY / SGD / TWD） | ✅ / ✅ |
| Total Amount | `total_amount` | 同 JP | 🔢 数字输入 | ✅ / ✅ |
| Excl. Tax Amount | `amount_excluding_tax` | 同 JP | 🔢 数字输入 | ✅ / ⚪ |
| Tax Amount | `tax_amount` | 同 JP | 🔢 数字输入 | ✅ / ⚪ |
| Tax Reg. No. | `tax_registration_no` | 统一社会信用代码，AI 可能识别，财务可补填（CN 样本多为空） | ✏️ 文本输入 | ⚪ / —（SALE 方向不展示）|
| Payment Type | `payment_type` | 同 JP；默认选中 NON_ADMINISTRATIVE | 🔽 下拉选择（枚举值：ADMINISTRATIVE / NON_ADMINISTRATIVE） | ✅ / ✅ |
| Line Items | `line_items[*]` | CN 样本明细行最多达 6 行（技术服务费按项目拆分），明细核验重要性高 | ✏️ 可编辑表格（逐行修改，支持新增/删除行） | ⚪ / ⚪ |
| Purpose | `payment_purpose` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice Date | `invoice_date` | 同 JP | 📅 日期选择器 | ✅ / ✅ |
| Due Date | `due_date` | 同 JP | 📅 日期选择器 | ⚪ / —（SALE 方向不展示）|
| Service Period | `service_period_start` / `service_period_end` | 同 JP | 📅 日期选择器（开始 + 结束各一个） | ⚪ / ✅ |
| Accounting Date | `accounting_date` | 同 JP | 📝 日期选择器（必须手填） | ✅ / ✅ |
| Bank Name | `ext_data.bank_account.bank_name` | **收款方**银行名称（结构化） | ✏️ 文本输入 | ✅ / ⚪ |
| Branch Name | `ext_data.bank_account.branch_name` | **收款方**支行名称 | ✏️ 文本输入 | ✅ / ⚪ |
| Account No. | `ext_data.bank_account.account_no` | **收款方**账号 | ✏️ 文本输入 | ✅ / ⚪ |
| Account Name | `ext_data.bank_account.account_name` | **收款方**账户持有人名称；两个方向均需核验 | ✏️ 文本输入 | ✅ / ⚪ |
| SWIFT Code | `ext_data.payment_rail.swift_code` | **CN 对外付款**：中国银行对外汇款时使用 | ✏️ 文本输入（8 或 11 位） | ⚪ / —（SALE 方向不展示）|
| Payer Bank | `payer_bank_name` | 发票付款方银行。PURCHASE 下为 CTW 出款银行 | 🔽 下拉选择（【待确认】从 CTW 固定银行账户中选择） | ⚪ / ⚪ |
| Payer Account | `payer_account_name` | 付款方账户名称。PURCHASE 下为 CTW 实体名称，与 `payer_bank_name` 配套 | ✏️ 文本输入 | ⚪ / ⚪ |
| Allocation Required | `allocation_required` | 同 JP | 🔽 下拉选择（Yes / No） | ⚪ / ⚪ |
| Allocation | `allocation_method` | 同 JP，allocation_required=Yes 时展示 | 🔽 下拉选择（枚举值同 JP，条件展示） | ⚪ / ⚪ |
| Recognition | `recognition_policy` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ⚪ / ⚪ |

> ⚠️ CN 付款路由：`swift_code` 为对外汇款路由字段（选填），实际跨境付款时需填写。bank_account 联动逻辑同 JP。

### 不需要展示的字段

| 字段路径 | 不展示原因 |
|---|---|
| `business_category` | 前端详情页不展示，由系统根据其他字段自动映射 |
| `document_type` | 前端详情页不展示，后端字段保留；AI 识别值由系统内部流转使用，财务无需感知 |
| `ext_data.bank_account.account_type` | JP 专用枚举字段（普通/当座/定期預金），中国不适用 |
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

| 前端标签 | 字段路径 | 展示原因 | 手填方式 | 必填（PURCHASE/SALE）|
|---|---|---|---|---|
| Description | `invoice_description` | 同 JP | ✏️ 文本输入（多行，AI 识别错误时财务可修正） | ✅ / ⚪ |
| Region | `region_code` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Company | `company_code` | 标识付款主体，TW 对应 AINEKOX CO LTD. | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Vendor Name | `vendor_name` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice No. | `invoice_number` | 同 JP | ✏️ 文本输入 | ✅ / ⚪ |
| Currency | `currency` | TWD（或 USD 跨境结算） | 🔽 下拉选择（枚举值：JPY / USD / CNY / SGD / TWD） | ✅ / ✅ |
| Total Amount | `total_amount` | 同 JP | 🔢 数字输入 | ✅ / ✅ |
| Excl. Tax Amount | `amount_excluding_tax` | 同 JP | 🔢 数字输入 | ✅ / ⚪ |
| Tax Amount | `tax_amount` | 同 JP | 🔢 数字输入 | ✅ / ⚪ |
| Tax Reg. No. | `tax_registration_no` | 台湾统一编号（统编），AI 可能识别，财务可补填 | ✏️ 文本输入 | ⚪ / —（SALE 方向不展示）|
| Payment Type | `payment_type` | 同 JP；默认选中 NON_ADMINISTRATIVE | 🔽 下拉选择（枚举值：ADMINISTRATIVE / NON_ADMINISTRATIVE） | ✅ / ✅ |
| Line Items | `line_items[*]` | 同 JP | ✏️ 可编辑表格（逐行修改，支持新增/删除行） | ⚪ / ⚪ |
| Purpose | `payment_purpose` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice Date | `invoice_date` | 同 JP | 📅 日期选择器 | ✅ / ✅ |
| Due Date | `due_date` | 同 JP | 📅 日期选择器 | ⚪ / —（SALE 方向不展示）|
| Service Period | `service_period_start` / `service_period_end` | 同 JP | 📅 日期选择器（开始 + 结束各一个） | ⚪ / ✅ |
| Accounting Date | `accounting_date` | 同 JP | 📝 日期选择器（必须手填） | ✅ / ✅ |
| Bank Name | `ext_data.bank_account.bank_name` | **收款方**银行名称（结构化） | ✏️ 文本输入 | ✅ / ⚪ |
| Branch Name | `ext_data.bank_account.branch_name` | **收款方**支行名称 | ✏️ 文本输入 | ✅ / ⚪ |
| Account No. | `ext_data.bank_account.account_no` | **收款方**账号 | ✏️ 文本输入 | ✅ / ⚪ |
| Account Name | `ext_data.bank_account.account_name` | **收款方**账户持有人名称；两个方向均需核验 | ✏️ 文本输入 | ✅ / ⚪ |
| Bank Code | `ext_data.payment_rail.bank_code` | 台湾银行代码（3位），**本地转账**路由（暂无样本支撑，保留备用） | ✏️ 文本输入（限 3 位数字） | ⚪ / ⚪ |
| Branch Code | `ext_data.payment_rail.branch_code` | 台湾支行代码，**本地转账**路由（暂无样本支撑，保留备用） | ✏️ 文本输入 | ⚪ / ⚪ |
| SWIFT Code | `ext_data.payment_rail.swift_code` | 实际样本使用 SWIFT 汇款，为 TW 主要付款路由 | ✏️ 文本输入（8 或 11 位） | ⚪ / —（SALE 方向不展示）|
| Payer Bank | `payer_bank_name` | 发票付款方银行。PURCHASE 下为 AINEKOX 出款银行 | ✏️ 文本输入（可手动填写/修改；输入框右侧提供快速填充图标，选择预设后同步填入 Payer Bank + Payer Account） | ⚪ / ⚪ |
| Payer Account | `payer_account_name` | 付款方账户名称。PURCHASE 下为 AINEKOX 实体名称，与 `payer_bank_name` 配套 | ✏️ 文本输入（可手动填写/修改；通过 Payer Bank 快速填充联动写入） | ⚪ / ⚪ |
| Allocation Required | `allocation_required` | 同 JP | 🔽 下拉选择（Yes / No） | ⚪ / ⚪ |
| Allocation | `allocation_method` | 同 JP，allocation_required=Yes 时展示 | 🔽 下拉选择（枚举值同 JP，条件展示） | ⚪ / ⚪ |
| Recognition | `recognition_policy` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ⚪ / ⚪ |

> ⚠️ TW 付款路由：当前样本使用 SWIFT 汇款，`swift_code` 为选填路由字段（可依实际付款方式决定是否填写）；`bank_code` / `branch_code` 为本地转账备用字段，暂无样本支撑，AI 不识别时由财务手填。bank_account 联动逻辑同 JP。

### 不需要展示的字段

| 字段路径 | 不展示原因 |
|---|---|
| `business_category` | 前端详情页不展示，由系统根据其他字段自动映射 |
| `document_type` | 前端详情页不展示，后端字段保留；AI 识别值由系统内部流转使用，财务无需感知 |
| `ext_data.bank_account.account_type` | JP 专用枚举字段（普通/当座/定期預金），台湾不适用 |
| `ext_data.payment_rail.ach_routing` / `wire_routing` | 美国支付体系，台湾不适用 |
| `ext_data.payment_rail.paynow_uen` | 新加坡专用，台湾不适用 |
| `ext_data.payment_rail.account_name_kana` / `bank_name_kana` | 日本专用片假名字段，台湾不适用 |
| `payee_bank_name` / `payee_account_no` | 与 `ext_data.bank_account.*` 重复，不重复展示 |
| `payee_name` | 与 `ext_data.bank_account.account_name` 业务含义等价（已确认），以结构化字段为准；写入时须同步覆盖顶层 `payee_name` |
| 所有系统内部字段 | 见通用规范 |

---

## 六、KY 地区（开曼群岛）

> ⚠️ 当前暂无真实样本，以下规则基于开曼群岛离岸实体的通用付款特征推断。CTW 开曼主体为 CTW CAYMAN。

**付款特征**：开曼群岛为 CTW 集团离岸持股实体，对外付款走 SWIFT 国际电汇（USD）。与 CN 地区类似，无本地银行代码体系，付款路由依赖 SWIFT Code。

### 需要展示的字段

| 前端标签 | 字段路径 | 展示原因 | 手填方式 | 必填（PURCHASE/SALE）|
|---|---|---|---|---|
| Description | `invoice_description` | 同 JP | ✏️ 文本输入（多行，AI 识别错误时财务可修正） | ✅ / ⚪ |
| Region | `region_code` | 同 JP | 🔽 下拉选择（枚举值同 JP，含 KY） | ✅ / ✅ |
| Company | `company_code` | 开曼主体对应 CTW CAYMAN | 🔽 下拉选择（枚举值同 JP） | ✅ / ✅ |
| Vendor Name | `vendor_name` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice No. | `invoice_number` | 同 JP | ✏️ 文本输入 | ✅ / ⚪ |
| Currency | `currency` | USD（开曼离岸结算以 USD 为主） | 🔽 下拉选择（枚举值：JPY / USD / CNY / SGD / TWD） | ✅ / ✅ |
| Total Amount | `total_amount` | 同 JP | 🔢 数字输入 | ✅ / ✅ |
| Excl. Tax Amount | `amount_excluding_tax` | 同 JP | 🔢 数字输入 | ✅ / ⚪ |
| Tax Amount | `tax_amount` | 同 JP | 🔢 数字输入 | ✅ / ⚪ |
| Tax Reg. No. | `tax_registration_no` | 开曼公司注册编号，AI 可能识别，财务可补填 | ✏️ 文本输入 | ⚪ / —（SALE 方向不展示）|
| Payment Type | `payment_type` | 同 JP；默认选中 NON_ADMINISTRATIVE | 🔽 下拉选择（枚举值：ADMINISTRATIVE / NON_ADMINISTRATIVE） | ✅ / ✅ |
| Line Items | `line_items[*]` | 同 JP | ✏️ 可编辑表格（逐行修改，支持新增/删除行） | ⚪ / ⚪ |
| Purpose | `payment_purpose` | 同 JP | ✏️ 文本输入 | ✅ / ✅ |
| Invoice Date | `invoice_date` | 同 JP | 📅 日期选择器 | ✅ / ✅ |
| Due Date | `due_date` | 同 JP | 📅 日期选择器 | ⚪ / —（SALE 方向不展示）|
| Service Period | `service_period_start` / `service_period_end` | 同 JP | 📅 日期选择器（开始 + 结束各一个） | ⚪ / ✅ |
| Accounting Date | `accounting_date` | 同 JP | 📝 日期选择器（必须手填） | ✅ / ✅ |
| Bank Name | `ext_data.bank_account.bank_name` | **收款方**银行名称（结构化） | ✏️ 文本输入 | ✅ / ⚪ |
| Branch Name | `ext_data.bank_account.branch_name` | **收款方**支行名称 | ✏️ 文本输入 | ✅ / ⚪ |
| Account No. | `ext_data.bank_account.account_no` | **收款方**账号 | ✏️ 文本输入 | ✅ / ⚪ |
| Account Name | `ext_data.bank_account.account_name` | **收款方**账户持有人名称；两个方向均需核验 | ✏️ 文本输入 | ✅ / ⚪ |
| SWIFT Code | `ext_data.payment_rail.swift_code` | **KY 对外付款主要路由**：离岸结算均走 SWIFT 国际电汇 | ✏️ 文本输入（8 或 11 位） | ⚪ / —（SALE 方向不展示）|
| Payer Bank | `payer_bank_name` | 发票付款方银行。PURCHASE 下为 CTW CAYMAN 出款银行 | ✏️ 文本输入（可手动填写/修改；输入框右侧提供快速填充图标，选择预设后同步填入 Payer Bank + Payer Account） | ⚪ / ⚪ |
| Payer Account | `payer_account_name` | 付款方账户名称。PURCHASE 下为 CTW CAYMAN，与 `payer_bank_name` 配套 | ✏️ 文本输入（可手动填写/修改；通过 Payer Bank 快速填充联动写入） | ⚪ / ⚪ |
| Allocation Required | `allocation_required` | 同 JP | 🔽 下拉选择（Yes / No） | ⚪ / ⚪ |
| Allocation | `allocation_method` | 同 JP，allocation_required=Yes 时展示 | 🔽 下拉选择（枚举值同 JP，条件展示） | ⚪ / ⚪ |
| Recognition | `recognition_policy` | 同 JP | 🔽 下拉选择（枚举值同 JP） | ⚪ / ⚪ |

> ⚠️ KY 付款路由：对外付款走 SWIFT 国际电汇，`swift_code` 为主要路由字段（选填，实际付款时需填写）。无本地银行代码体系，`bank_code` / `branch_code` 不适用。bank_account 联动逻辑同 JP。

### 不需要展示的字段

| 字段路径 | 不展示原因 |
|---|---|
| `business_category` | 前端详情页不展示，由系统根据其他字段自动映射 |
| `document_type` | 前端详情页不展示，后端字段保留；AI 识别值由系统内部使用，财务无需感知 |
| `ext_data.bank_account.account_type` | JP 专用枚举字段（普通/当座/定期預金），开曼不适用 |
| `ext_data.payment_rail.ach_routing` / `wire_routing` | 美国支付体系，开曼不适用 |
| `ext_data.payment_rail.paynow_uen` | 新加坡专用，开曼不适用 |
| `ext_data.payment_rail.account_name_kana` / `bank_name_kana` | 日本专用，开曼不适用 |
| `ext_data.payment_rail.bank_code` / `branch_code` | 开曼无本地银行代码体系，付款依赖 SWIFT |
| `payee_bank_name` / `payee_account_no` | 与 `ext_data.bank_account.*` 重复，不重复展示 |
| `payee_name` | 与 `ext_data.bank_account.account_name` 业务含义等价（已确认），以结构化字段为准；写入时须同步覆盖顶层 `payee_name` |
| 所有系统内部字段 | 见通用规范 |

---

## 七、各地区字段差异速查表

> ✅ 必填展示 ｜ ⚪ 选填展示 ｜ ❌ 不展示 ｜ **粗体**字段为前端 Required 标注字段
>
> **必填（P/S）** 列：P = `invoice_direction=PURCHASE`，S = `invoice_direction=SALE`；`—` 表示该方向下此字段不在页面展示

| 字段路径 | 前端标签 | JP | US | SG | CN | TW | KY | 必填（P/S）| 手填方式 |
|---|---|---|---|---|---|---|---|---|---|
| **基本信息** | | | | | | | | | |
| `region_code` | Region | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 全地区必填 | 🔽 下拉选择（JP / US / SG / CN / TW / KY） |
| `company_code` | Company | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 全地区必填 | 🔽 下拉选择（AINEKOX / CTW G123 / CTW INC / CTW US INC / CTW CAYMAN 等） |
| `vendor_name` | Vendor Name | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 全地区必填 | ✏️ 文本输入（AI 识别率高） |
| `invoice_number` | Invoice No. | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | P: 全地区必填 ｜ S: 选填 | ✏️ 文本输入 |
| `invoice_description` | Description | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | P: 全地区必填 ｜ S: 选填 | ✏️ 文本输入（AI 识别率较高） |
| **金额** | | | | | | | | | |
| `currency` | Currency | ✅ JPY | ✅ USD | ✅ SGD | ✅ CNY | ✅ TWD | ✅ USD | 全地区必填 | 🔽 下拉选择（JPY / USD / SGD / CNY / TWD） |
| `total_amount` | Total Amount | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 全地区必填 | 🔢 数字输入（AI 识别率高） |
| `amount_excluding_tax` | Excl. Tax Amount | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | P: 全地区必填 ｜ S: 选填 | 🔢 数字输入 |
| `tax_amount` | Tax Amount | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | P: 全地区必填 ｜ S: 选填 | 🔢 数字输入 |
| `tax_rate` | Tax Rate | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 选填 | ✏️ 数字输入（%） |
| `tax_registration_no` | Tax Reg. No. | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | P: JP 必填，其他选填 ｜ S: 全地区不展示 | ✏️ 文本输入 |
| **费用分类** | | | | | | | | | |
| `business_category` | Business Category | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 前端不展示 | 系统自动映射 |
| `payment_type` | Payment Type | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 全地区必填（默认 NON_ADMINISTRATIVE） | 🔽 下拉选择（ADMINISTRATIVE / NON_ADMINISTRATIVE） |
| `line_items[*]` | Line Items | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 选填 | ✏️ 可编辑表格（item_name / amount / tax_rate / service_period 等） |
| `payment_purpose` | Purpose | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 全地区必填 | ✏️ 文本输入（打款用途） |
| **日期** | | | | | | | | | |
| `invoice_date` | Invoice Date | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 全地区必填 | 📅 日期选择器（AI 识别，可修正） |
| `due_date` | Due Date | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | P: 选填 ｜ S: 不展示 | 📅 日期选择器 |
| `service_period_start / end` | Service Period | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | P: 选填（摊销类 recognition 策略时提示填写）｜ S: 必填 | 📅 日期选择器（开始 + 结束） |
| `accounting_date` | Accounting Date | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 全地区必填 | 📝 日期选择器（必须手填，AI 从不识别） |
| **收款方银行** | | | | | | | | | |
| `ext_data.bank_account.bank_name` | Bank Name | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | P: 全地区必填 ｜ S: 选填 | ✏️ 文本输入（收款方银行名称） |
| `ext_data.bank_account.branch_name` | Branch Name | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | P: 展示地区必填 ｜ S: 选填 | ✏️ 文本输入 |
| `ext_data.bank_account.account_type` | Account Type | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | P: JP 必填 ｜ S: 选填 | 🔽 下拉选择（普通預金 / 当座預金 / 定期預金，仅 JP） |
| `ext_data.bank_account.account_no` | Account No. | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | P: 全地区必填 ｜ S: 选填 | ✏️ 文本输入（收款方账号） |
| `ext_data.bank_account.account_name` | Account Name | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | P: 全地区必填 ｜ S: 选填 | ✏️ 文本输入（收款方账户持有人） |
| `ext_data.payment_rail.bank_code` | Bank Code | ✅ | ❌ | ⚪ | ❌ | ⚪ | ❌ | P: JP 必填，其他选填 ｜ S: 全地区选填 | ✏️ 文本输入 |
| `ext_data.payment_rail.branch_code` | Branch Code | ✅ | ❌ | ⚪ | ❌ | ⚪ | ❌ | P: JP 必填，其他选填 ｜ S: 全地区选填 | ✏️ 文本输入 |
| `ext_data.payment_rail.account_name_kana` | Account Name (Kana) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | P: JP 选填 ｜ S: 不展示 | ✏️ 文本输入（半角片假名） |
| `ext_data.payment_rail.bank_name_kana` | Bank Name (Kana) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | P: JP 选填 ｜ S: 不展示 | ✏️ 文本输入（半角片假名） |
| `ext_data.payment_rail.swift_code` | SWIFT Code | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | P: 选填 ｜ S: 不展示 | ✏️ 文本输入（8 或 11 位） |
| `ext_data.payment_rail.ach_routing` | ACH Routing | ❌ | ⚪ | ❌ | ❌ | ❌ | ❌ | P: 选填 ｜ S: 不展示 | ✏️ 文本输入（9 位） |
| `ext_data.payment_rail.wire_routing` | Wire Routing | ❌ | ⚪ | ❌ | ❌ | ❌ | ❌ | P: 选填 ｜ S: 不展示 | ✏️ 文本输入（9 位） |
| `ext_data.payment_rail.paynow_uen` | PayNow UEN | ❌ | ❌ | ⚪ | ❌ | ❌ | ❌ | P: 选填 ｜ S: 不展示 | ✏️ 文本输入 |
| **付款方银行** | | | | | | | | | |
| `payer_bank_name` | Payer Bank | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 选填 | ✏️ 文本输入（支持手动填写；右侧快速填充图标可一键预填 Payer Bank + Payer Account） |
| `payer_account_name` | Payer Account | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 选填 | ✏️ 文本输入（支持手动填写；可由 Payer Bank 快速填充联动写入） |
| **费用确认** | | | | | | | | | |
| `allocation_required` | Allocation Required | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 选填 | 🔽 下拉选择（Yes / No） |
| `allocation_method` | Allocation | ⚪ 条件展示 | ⚪ 条件展示 | ⚪ 条件展示 | ⚪ 条件展示 | ⚪ 条件展示 | ⚪ 条件展示 | 选填（allocation_required=Yes 时展示） | 🔽 下拉选择（MONTHLY_EQUAL / DAILY_PRORATA / MONTHLY_BY_LINE_ITEM / BY_LINE_ITEM_PERIOD / BY_EXPLICIT_SCHEDULE / USAGE_BASED / MANUAL） |
| `recognition_policy` | Recognition | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 选填 | 🔽 下拉选择（IMMEDIATE / PREPAID_MONTHLY / PREPAID_DAILY / ACCRUAL_BY_SERVICE_PERIOD / MONTHLY_BY_LINE_ITEM / SCHEDULED_BY_DOCUMENT / USAGE_BASED / MILESTONE_BASED） |
| **提交人** | | | | | | | | | |
| `applicant` | Applicant | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | P: 只读（系统确保有值）｜ S: 只读 | 只读（上传者，系统自动填充） |
| `application_date` | Application Date | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | P: 只读（系统确保有值）｜ S: 只读 | 只读（上传时间，系统自动填充） |
| `document_type` | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 前端不展示 | 后端保留供系统内部使用 |

---

## 八、字段手填策略总结

### 📝 日期选择器（必须手填，AI 从不识别）
- `accounting_date`：入账日期，决定进哪个月报表，需财务根据会计准则主动填写

### ✏️ 文本输入（特殊说明）
- `tax_registration_no`（JP PURCHASE）：法定適格請求書登録番号，AI 识别错误或为空时财务可修正；修改须与原始发票核实，自行确保合规。**SALE 方向不展示此字段。**

### ⚡ invoice_direction 对必填逻辑的影响

以下字段在 `invoice_direction` 不同时，必填状态或展示状态有差异：

| 字段 | PURCHASE | SALE |
|---|---|---|
| Invoice No. | 必填 | 选填 |
| Description | 必填 | 选填 |
| Excl. Tax Amount | 必填 | 选填 |
| Tax Amount | 必填 | 选填 |
| Tax Reg. No. | JP 必填，其他选填 | **不展示** |
| Due Date | 选填 | **不展示** |
| Service Period | 选填 | **必填** |
| Bank Name | 必填 | 选填 |
| Branch Name | 展示地区必填 | 选填 |
| Account Type | JP 必填 | 选填 |
| Account No. | 必填 | 选填 |
| Account Name | 必填 | 选填 |
| Bank Code | JP 必填，其他选填 | 选填 |
| Branch Code | JP 必填，其他选填 | 选填 |
| Account Name (Kana) | JP 选填 | **不展示** |
| Bank Name (Kana) | JP 选填 | **不展示** |
| SWIFT Code | 选填 | **不展示** |
| ACH Routing | 选填 | **不展示** |
| Wire Routing | 选填 | **不展示** |
| PayNow UEN | 选填 | **不展示** |


### 🔽 下拉选择（固定枚举值）

| 字段路径 | 前端标签 | 枚举值 | 备注 |
|---|---|---|---|
| `region_code` | Region | JP / US / SG / CN / TW | 与 company_code 联动 |
| `company_code` | Company | AINEKOX CO LTD. / SHANGHAI WEIYOUYI CHUXIN TECH CO LTD / CTW G123 SINGAPORE PTE LTD / CTW INC / CTW US INC / CTW CAYMAN | 随 Region 自动填充，可手动修改 |
| `currency` | Currency | JPY / USD / SGD / CNY / TWD | 随 Region 联动默认值 |
| `payment_type` | Payment Type | ADMINISTRATIVE / NON_ADMINISTRATIVE | 默认选中 NON_ADMINISTRATIVE |
| `ext_data.bank_account.account_type` | Account Type | 普通預金 / 当座預金 / 定期預金 | 仅 JP 展示；PURCHASE 方向必填，SALE 方向选填 |
| `recognition_policy` | Recognition | IMMEDIATE / PREPAID_MONTHLY / PREPAID_DAILY / ACCRUAL_BY_SERVICE_PERIOD / MONTHLY_BY_LINE_ITEM / SCHEDULED_BY_DOCUMENT / USAGE_BASED / MILESTONE_BASED | 选填；对 Service Period 必填的影响见上方说明 |
| `allocation_method` | Allocation | MONTHLY_EQUAL / DAILY_PRORATA / MONTHLY_BY_LINE_ITEM / BY_LINE_ITEM_PERIOD / BY_EXPLICIT_SCHEDULE / USAGE_BASED / MANUAL | 仅 allocation_required=Yes 时展示 |
| `allocation_required` | Allocation Required | Yes / No | 控制 allocation_method 的显示与否 |

#### Payer Bank 快速填充交互说明

`Payer Bank` 和 `Payer Account` 均支持**手动文本输入**，同时 `Payer Bank` 输入框右侧提供**快速填充**按钮（📋 图标）。点击后弹出当前地区 CTW 出款账户预设列表，选中某条预设后**同时自动填入 `Payer Bank` 和 `Payer Account` 两个字段**，填入后财务可进一步手动修改。

**交互流程：**
1. 财务在详情页选定 Region（地区）
2. 点击 Payer Bank 输入框右侧的快速填充图标（📋）
3. 弹出下拉列表，展示该地区 CTW 的出款账户选项（含银行名称 + 账户名称）
4. 选择一条预设后，**Payer Bank 和 Payer Account 同步填入**
5. 财务可在任意字段上进行手动修改

**各地区预设值（Mock，正式银行账户信息收集中）：**

| 地区 | Payer Bank（银行名称）| Payer Account（账户名称）|
|---|---|---|
| JP | SMBC（三井住友銀行）| 三井住友 (法人) |
| JP | みずほ銀行 | CTW INC |
| US | East West Bank (MM) | CTW US INC |
| US | Citibank NA | CTW US INC |
| SG | Citibank (SGD) | CTW G123 SINGAPORE PTE LTD |
| SG | DBS Bank | CTW G123 SINGAPORE PTE LTD |
| CN | 中国工商银行（上海）| SHANGHAI WEIYOUYI CHUXIN TECH CO LTD |
| TW | 台新銀行 | AINEKOX CO LTD. |
| TW | 國泰世華 | AINEKOX CO LTD. |

> ⚠️ **待确认**：各地区 CTW 正式出款银行账户信息尚在收集中，当前列表为 Mock 数据，上线前需替换为真实账户列表。

### 📅 日期选择器（AI 有值时回填，缺失时手填）
- `invoice_date`（必填）、`accounting_date`（必填）、`due_date`（选填）、`service_period_start`、`service_period_end`（均选填，选择摊销类 recognition 策略时前端提示填写）

### 🔢 数字输入（AI 有值时回填，识别错误时可修正）
- `total_amount`（必填）、`amount_excluding_tax`（必填）、`tax_amount`（必填）、`tax_rate`（选填）

### ✏️ 文本输入（AI 有值时回填，缺失或识别错误时可修正）
- 必填：`vendor_name`、`invoice_number`、`invoice_description`（多行文本）、`payment_purpose`
- 选填：`tax_registration_no`（JP 必填，其他选填）
- 收款方银行（必填）：`ext_data.bank_account.bank_name`、`ext_data.bank_account.account_no`、`ext_data.bank_account.account_name`
- 收款方银行（JP 必填，其他展示地区必填）：`ext_data.bank_account.branch_name`（US 不展示）
- 收款方路由（JP 必填）：`ext_data.payment_rail.bank_code`、`ext_data.payment_rail.branch_code`、`ext_data.payment_rail.account_name_kana`、`ext_data.payment_rail.bank_name_kana`
- 收款方路由（选填）：`ext_data.payment_rail.swift_code`（US/SG/CN/TW）、`ext_data.payment_rail.ach_routing`、`ext_data.payment_rail.wire_routing`（US）、`ext_data.payment_rail.paynow_uen`（SG）
- 打款方（选填）：`payer_bank_name`（文本输入 + 快速填充，选后同步写入 `payer_account_name`）、`payer_account_name`（文本输入，也可由快速填充联动写入）

### ✏️ 可编辑表格（逐行修改，支持新增/删除行）
- `line_items[*]`：每行字段包括 `item_name`（品名）、`tax_inclusive_amount`（含税金额）、`tax_rate`（税率）、`amount_excluding_tax`（税前金额）、`description`（明细说明）、`service_period_start` / `service_period_end`（明细服务期间）

---

*文档更新时间：2026-05-25*
*样本来源：3月份 invoice cases，共 179 个 JSON 文件*

---

## 九、Fee Recognition 联动规则

Fee Recognition 区块包含三个字段，适用于所有地区：Allocation Required（`allocation_required`）、Allocation（`allocation_method`）、Recognition（`recognition_policy`）。

**Allocation Required 控制 Allocation 的显示。** 选 No（默认）时，Allocation 字段隐藏，系统将 `allocation_method` 置为空（不摊销）。选 Yes 时，Allocation 下拉展示，财务从以下 7 个值中选择：MONTHLY_EQUAL（按月平均分摊）、DAILY_PRORATA（按天数比例分摊）、MONTHLY_BY_LINE_ITEM（明细行已按月拆分，按行项目月份确认）、BY_LINE_ITEM_PERIOD（行项目按明确的非月度期间拆分）、BY_EXPLICIT_SCHEDULE（按单据给出的摊销表 / 比例 / schedule）、USAGE_BASED（按用量或消耗量分摊）、MANUAL（需要摊销但证据不支持确定性方法，只能人工处理）。

**Recognition 有 8 个枚举值：** IMMEDIATE（立即确认，不做跨期处理）、PREPAID_MONTHLY（预付费用按月摊销）、PREPAID_DAILY（预付费用按天摊销）、ACCRUAL_BY_SERVICE_PERIOD（按可见服务期计提确认）、MONTHLY_BY_LINE_ITEM（月度行项目本身即确认依据）、SCHEDULED_BY_DOCUMENT（按单据提供的 schedule 确认）、USAGE_BASED（按用量消耗确认）、MILESTONE_BASED（按交付物或里程碑验收确认）。

**Recognition 联动 Service Period 必填状态。** 选 PREPAID_MONTHLY、PREPAID_DAILY 或 ACCRUAL_BY_SERVICE_PERIOD 时，Header 级 Service Period 升级为必填并高亮提示。选 MONTHLY_BY_LINE_ITEM 时，Header 级 Service Period 不适用，改为 Line Items 每行的 service_period 升级为必填。其余策略（IMMEDIATE、SCHEDULED_BY_DOCUMENT、USAGE_BASED、MILESTONE_BASED）不对 Service Period 产生额外必填要求。



# Invoice 详情页字段评估 — API 字段分析

> 基于 **179 个真实样本**（3月份 invoice cases）的全量统计分析。
>
> **核心结论：所有地区 API 返回完全相同的字段结构（schema 统一），前端使用同一套模板，按字段填充率决定是否必须展示。**
>
> 分级说明：✅ 必须展示（填充率 ≥ 90%）｜ ⚠️ 条件展示（有值则展示）｜ ❌ 不展示（内部/系统字段）

---

## 一、样本统计概览

| 维度 | 分布 |
|---|---|
| **总样本数** | 179 个文件 |
| **地区分布** | JP 118（65.9%）/ US 46（25.7%）/ SG 6（3.4%）/ CN 5（2.8%）/ TW 1（0.6%）/ 未知 3 |
| **公司代码** | JP_CTW_INC 118 / US_CTW_INC 46 / SG_CTW_INC 9 / SH_WYYCX_INC 2 / 未知 4 |
| **Document Type** | INVOICE 97（54.2%）/ PAYMENT_REPORT 37（20.7%）/ RECEIPT 24（13.4%）/ STATEMENT 11（6.1%）/ CONTRACT 2 / CREDIT_NOTE 2 / 其他 5 |
| **币种** | JPY 128（71.5%）/ USD 48（26.8%）/ 未识别 3 |
| **Payment Type** | NON_ADMINISTRATIVE 137（76.5%）/ ADMINISTRATIVE 39（21.8%）|
| **Business Category** | ADVERTISING 47 / ROYALTY 35 / OFFICE_ADMIN 30 / SAAS 27 / CLOUD 12 / PROFESSIONAL_SERVICE 9 / 其他 19 |
| **明细行数** | 0行 3个 / 1行 106个（主流）/ 2~5行 41个 / 6行以上 29个（最多51行）|
| **明细行总计** | 667 行 |

---

## 二、顶层字段填充率与展示策略

| 字段名 | 含义 | 填充率 | 展示建议 | 值示例 |
|---|---|---|---|---|
| `region_code` | 地区 | 98.3% | ✅ 必须展示 | `JP` / `US` / `SG` |
| `company_code` | 付款公司 | 97.8% | ✅ 必须展示 | `JP_CTW_INC` / `US_CTW_INC` / `SG_CTW_INC` |
| `document_type` | 凭证类型 | 98.3% | ✅ 必须展示（Tag 区分颜色） | `INVOICE` / `RECEIPT` / `PAYMENT_REPORT` |
| `vendor_name` | 供应商/开票方名称 | 98.3% | ✅ 必须展示 | `PagerDuty` / `麻布プラザ株式会社` / `CTW SH Co.,Ltd.` |
| `payee_name` | 收款方名称 | 98.3% | ✅ 必须展示 | `PagerDuty` / `麻布プラザ株式会社` / `CTW SH Co.,Ltd.` |
| `invoice_date` | 发票开具日期 | 98.3% | ✅ 必须展示 | `2026-03-31` / `2026-02-28` |
| `service_period_start` / `end` | 服务期间 | 98.3% | ✅ 必须展示 | `2026-03-01` ～ `2026-03-31` |
| `currency` | 币种 | 98.3% | ✅ 必须展示 | `JPY` / `USD` |
| `total_amount` | 含税总金额 | 98.3% | ✅ 必须展示（主金额） | `68551.0000` / `989441.0600` / `250.0000` |
| `amount_excluding_tax` | 税前金额 | 98.3% | ✅ 必须展示 | `11300.0000` / `182320.0000` |
| `tax_amount` | 税额 | 98.3% | ✅ 必须展示 | `1130.0000` / `4874.0000` / `0.0000` |
| `payment_purpose` | 打款用途/费用名 | 98.3% | ✅ 必须展示 | `Adobe Stock利用料` / `2026年2月 technical service…` |
| `invoice_description` | AI 解析描述 | 98.3% | ✅ 必须展示（多行文本） | `Adobe Stock - 750 点のアセット/月…` / `件名は「CMアウト作業 2026.3月」…` |
| `payment_type` | 行政类/非行政类 | 98.3% | ✅ 必须展示 | `ADMINISTRATIVE` / `NON_ADMINISTRATIVE` |
| `business_category` | 业务分类 | 98.3% | ✅ 必须展示 | `SAAS` / `CLOUD` / `ADVERTISING` |
| `invoice_direction` | 发票方向 | 98.3% | ⚠️ 条件展示（默认 PURCHASE 可省略） | `PURCHASE` / `SALES` |
| `tax_registration_no` | 税务登记号 | 77.1% | ⚠️ 有值则展示（JP 合规字段） | `T3700150007275` / `T5370501000886` |
| `payee_bank_name` | 收款方银行名 | 63.1% | ⚠️ 有值则展示 | `三菱UFJ銀行 きよなみ支店` / `CITIBANK N.A. SINGAPORE` |
| `payee_account_no` | 收款方账号 | 63.7% | ⚠️ 有值则展示 | `普通預金 2782530` / `18800102531` |
| `invoice_number` | 发票编号 | 59.2% | ⚠️ 有值则展示（41% 可能无编号） | `INV01178666` / `26000671-001(01)` |
| `due_date` | 付款截止日期 | 57.0% | ⚠️ 有值则展示（建议醒目样式） | `2026-04-30` / `2026-03-31` |
| `accounting_date` | 入账日期 | **0%（全部为 null）** | ✅ 用户手动填写 | — |
| `payer_bank_name` | 打款银行 | 5.6% | ⚠️ 有值则展示（极少由 AI 识别） | `三井住友銀行 赤坂支店` / `三菱ＵＦＪ銀行 日本橋中央支店` |
| `vendor_code` | 供应商代码 | — | ❌ 内部匹配字段，不展示 | — |

---

## 三、ext_data.bank_account 填充率

| 字段名 | 含义 | 填充率 | 展示建议 | 值示例 |
|---|---|---|---|---|
| `bank_name` | 银行名称 | 63.1% | ⚠️ 有值则展示 | `三菱UFJ銀行` / `CITIBANK N.A. SINGAPORE` / `CHINA MERCHANTS BANK H.O. SHENZHEN` |
| `account_no` | 银行账号 | 63.1% | ⚠️ 有值则展示 | `2782530` / `18800102531` / `121983402732002` |
| `account_name` | 账户持有人名称 | 59.8% | ⚠️ 有值则展示 | `CTW SH Co.,Ltd.` / `ALIBABA CLOUD (SINGAPORE) PTE LTD` / `アザブプラザ(カ…` |
| `account_type` | 账户类型 | 49.2% | ⚠️ 有值则展示 | `普通預金` / `当座預金` / `CHECKING` |
| `branch_name` | 支行名称 | 47.5% | ⚠️ 有值则展示 | `神田駅前支店` / `きよなみ支店` / `H.O. SHENZHEN` |

> 说明：`payee_bank_name` 与 `ext_data.bank_account.bank_name` 内容一致，优先取 `ext_data.bank_account` 的结构化数据。

---

## 四、ext_data.payment_rail 填充率

| 字段名 | 含义 | 填充率 | 展示建议 | 值示例 |
|---|---|---|---|---|
| `swift_code` | SWIFT/BIC Code | 19.6% | ⚠️ 有值则展示（跨境汇款必需） | `CMBCCNBS` / `CITISGSGXXX` / `HSBCHKHHHKH` |
| `branch_code` | 支行代码 | 6.1% | ⚠️ 有值则展示 | `938` / `133` / `001` |
| `ach_routing` | ACH Routing（美国本地转账） | 5.6% | ⚠️ 有值则展示 | `121000248` / `121000358` / `022000020` |
| `account_name_kana` | 账户名片假名（日本） | 5.0% | ⚠️ 有值则展示 | `ｶﾝﾄｳｱｲﾃｨｿﾌﾄｳｪｱ…` / `アエタスカブシキガイシャ` / `ヤナギユキヒロ` |
| `bank_code` | 银行代码 | 4.5% | ⚠️ 有值则展示 | `7214` / `0005` / `0010` |
| `wire_routing` | Wire Routing（美国电汇） | 3.4% | ⚠️ 有值则展示 | `121000248` / `021001088` / `026009593` |
| `paynow_uen` | PayNow UEN（新加坡扫码支付标识） | **0%** | ⚠️ 字段预留，当前样本均为 null | — |
| `bank_name_kana` | 银行名片假名（日本） | **0%** | ⚠️ 字段预留，当前样本均为 null | — |

---

## 五、line_items 明细行字段填充率

基于 667 行明细数据：

| 字段名 | 含义 | 填充率 | 展示建议 | 值示例 |
|---|---|---|---|---|
| `item_name` | 品名 | **100%** | ✅ 必须展示 | `G123-PSP` / `Publisher` / `A System` |
| `tax_inclusive_amount` | 含税金额 | **100%** | ✅ 必须展示（主金额列） | `25428.6400` / `231430.2600` / `319985.2400` |
| `tax_rate` | 税率 | **100%** | ✅ 必须展示 | `0.0000` / `0.0800` / `0.1000` |
| `service_period_start` / `end` | 明细行服务期间 | **100%** | ⚠️ 与发票级一致时可折叠 | `2026-03-01` ～ `2026-03-31` |
| `description` | 明细说明 | 79.3% | ⚠️ 有值则展示 | `Payment system feature development…` / `Ticket system development 2.0 service.` |
| `amount_excluding_tax` | 税前金额 | 72.6% | ⚠️ 有值则展示（27.4% 为空） | `25428.6400` / `231430.2600` |
| `payment_amount` | 支付金额 | 72.6% | ⚠️ 有值则展示 | `25428.6400` / `319985.2400` |

> ⚠️ `amount_excluding_tax` 和 `payment_amount` 在约 27% 的明细行中为空字符串（`""`），前端必须做空值兼容，以 `tax_inclusive_amount`（100% 填充）为主金额列兜底。

---

## 六、Document Type 枚举值说明

| 枚举值 | 数量 | 中文说明 |
|---|---|---|
| `INVOICE` | 97 | 标准发票 |
| `PAYMENT_REPORT` | 37 | 支払報告書（版税/销售分成报告） |
| `RECEIPT` | 24 | 收据 |
| `STATEMENT` | 11 | 对账单/账单 |
| `CONTRACT` | 2 | 合同/报价确认单 |
| `CREDIT_NOTE` | 2 | 信用票据/红字发票 |
| `PROFORMA_INVOICE` | 1 | 形式发票 |
| `QUOTATION` | 1 | 报价单 |
| `EXPENSE_CLAIM` | 1 | 费用报销单 |

> 建议：`document_type` 用不同颜色 Tag 展示，至少区分 INVOICE / PAYMENT_REPORT / RECEIPT / CREDIT_NOTE 四类。

---

## 七、Business Category 枚举值说明

| 枚举值 | 数量 | 说明 |
|---|---|---|
| `ADVERTISING` | 47 | 广告费 |
| `ROYALTY` | 35 | 版税/授权费 |
| `OFFICE_ADMIN` | 30 | 办公行政类 |
| `SAAS` | 27 | SaaS 软件服务费 |
| `CLOUD` | 12 | 云服务费 |
| `PROFESSIONAL_SERVICE` | 9 | 专业服务费 |
| `OTHER` | 6 | 其他 |
| `TAX` | 4 | 税费 |
| `COMMUNICATION` | 4 | 通信费 |
| `PAYMENT_PROCESSING` | 2 | 支付手续费 |

---

## 八、前端渲染注意事项

1. **空值统一处理**：`null`、`""` 均显示为 `—`，禁止展示原始空字符串
2. **line_items 金额兜底**：`amount_excluding_tax` / `payment_amount` 约 27% 为空，以 `tax_inclusive_amount`（100% 填充）为主金额列
3. **accounting_date 全为 null**：此字段不由 AI 识别，始终由用户手动选择
4. **document_type 多样化**：9 种枚举值，建议用 Tag 颜色区分类型
5. **明细行数量跨度大**：1~51 行均有，明细表需支持滚动，不能固定高度
6. **Unicode 支持**：vendor_name 可能含日文、韩文、中文，禁止截断
7. **Schema 统一**：所有地区字段名相同，无需按地区条件渲染不同字段

---

## 九、系统/内部字段（不展示）

| 字段名 | 含义 |
|---|---|
| `group_id` | 发票分组 ID，用于将同一批次上传的多张发票关联归组 |
| `vendor_code` | 供应商系统内部编码，用于与主数据库匹配，通常为空 |
| `allocation_required` | 是否需要跨期摊销（0=不需要，1=需要），会计内部处理标志 |
| `allocation_method` | 摊销方式（如 `BY_LINE_ITEM_PERIOD`），指导系统如何按行/按期分摊费用 |
| `recognition_policy` | 费用确认策略（如 `IMMEDIATE`=当期全额确认，`MONTHLY_BY_LINE_ITEM`=按月按行确认）|
| `source_channel` | 发票来源渠道（`UPLOAD`=手动上传，未来可能有 `EMAIL`/`API` 等）|
| `document_hash` | 文件内容哈希值，用于去重和防篡改校验 |
| `file_hash` | 原始文件哈希值，与 `document_hash` 配合做完整性验证 |
| `storage_provider` | 文件存储服务商（当前为 `S3`，即 AWS S3）|
| `storage_key` | 文件在存储服务中的完整路径（S3 对象 Key）|
| `extraction_status` | AI 字段提取状态（`EXTRACTED`=已提取，`FAILED`=提取失败）|
| `matching_status` | 与供应商/合同的匹配状态（`INIT`=未匹配，`MATCHED`=已匹配）|
| `status` | 发票整体流转状态（`NORMALIZED`=已规范化，后续可能有 `APPROVED`/`PAID` 等）|
| `version` | 数据版本号，用于乐观锁并发控制 |
| `is_deleted` | 软删除标志（0=正常，1=已删除）|
| `created_by` | 创建人（系统账号或用户 ID）|
| `deleted_at` | 软删除时间戳 |
| `ext_data.source_file_id` | 原始文件在上传系统中的 ID，用于关联溯源 |
| `ext_data.recipient` | 收票方信息（固定为 CTW 自身公司，无需对财务展示）|

---

*文档更新时间：2026-05-21*
*样本来源：3月份 invoice cases，共 179 个 JSON 文件，667 条明细行*

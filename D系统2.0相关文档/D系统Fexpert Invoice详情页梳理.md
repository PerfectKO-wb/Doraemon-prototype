# D系统 F Expert — Invoice 详情页字段梳理

| 项目名称 | F Expert Invoice 详情页字段规范 |
| ---- | -------------------------- |
| 文档版本 | v2.0 |
| 更新日期 | 2026-05-18 |
| 修改记录 | v1.x 初版（含旧 JE tool 内容，已迁移至《D系统支持创建JE.md》）；v2.0 按最新实现全量整理，新增 Description / Tax Rate / Detail Payload / 五个日期字段 / 折旧字段 |
| 原型地址 | F-PAP-PAYMENT-REVIEW.html |

---

## 一、字段总览

Invoice 详情页字段共 37 个，分为四个区块：

1. **基本信息** — 公司主体、地区、币种、付款方式
2. **收款银行信息** — 按地区（JP / US / SG）显示不同子集
3. **金额与费用内容** — 金额、税率、费用明细表、用途备注
4. **日期字段** — 上传时间（只读）+ 四个业务日期（可编辑）+ 折旧字段

---

## 二、基本信息字段

| # | 字段名（英文） | 字段名（中文） | 字段 ID | 类型 | 地区 | 说明 |
|---|---|---|---|---|---|---|
| 1 | Description | 费用名 | `description` | 文本输入 | 全部 | 费用简要名称，置于详情页最顶部，例：`マーケティング費用 4月分` |
| 2 | Company | 付款公司主体 | `company` | 下拉选择 | 全部 | 与 Region 联动自动填充（见下方联动规则） |
| 3 | Region | 地区 | `region` | 下拉选择 | 全部 | JP / US / SG，决定后续银行字段显示范围，并联动 Currency 默认值 |
| 4 | Currency | 币种 | `currency` | 下拉选择 | 全部 | JPY / USD / SGD，随 Region 变更自动切换 |
| 5 | Payment Type | 打款类型 | `payment_type` | 下拉选择 | 全部 | Administrative（行政类）/ Non-Administrative（非行政类） |
| 6 | Payment Bank | 打款银行 | `payment_bank` | 文本输入 | 全部 | 付款方出账银行名称 |
| 7 | Payment Account Name | 付款账户名称 | `payment_account_name` | 文本输入 | 全部 | 付款方账户名称 |

### Company ↔ Region 联动规则

| Region | 自动填充 Company |
|---|---|
| JP | CTW INC |
| US | CTW US INC |
| SG | CTW G123 SINGAPORE PTE LTD |
| TW | AINEKOX CO LTD. |
| CN | 不自动填充 |

**Company 完整枚举值：**
`AINEKOX CO LTD.` / `SHANGHAI WEIYOUYI CHUXIN TECH CO LTD` / `CTW G123 SINGAPORE PTE LTD` / `CTW INC` / `CTW US INC` / `CTW CAYMAN`

---

## 三、收款银行信息字段（按地区显示）

| # | 字段名（英文） | 字段名（中文） | 字段 ID | JP | US | SG | 说明 |
|---|---|---|---|:---:|:---:|:---:|---|
| 8 | Payee Name | 收款人名称 | `payee_name` | ✅ | ✅ | ✅ | 收款方完整名称 |
| 9 | Account Holder (Kana) | 账户名（片假名） | `account_holder_kana` | ✅ | ❌ | ❌ | 半角片假名，日本专用 |
| 10 | Bank Name | 银行名称 | `bank_name` | ✅ | ✅ | ✅ | 收款方银行名称 |
| 11 | Bank Name (Kana) | 银行名（片假名） | `bank_name_kana` | ✅ | ❌ | ❌ | 半角片假名，日本专用 |
| 12 | Bank Code | 银行代码 | `bank_code` | ✅ | ❌ | ✅ | 日本金融机构代码 / SG bank code |
| 13 | Branch Name (Kana) | 支店名（片假名） | `branch_name_kana` | ✅ | ❌ | ❌ | 半角片假名，日本专用 |
| 14 | Branch Code | 支店代码 | `branch_code` | ✅ | ❌ | ✅ | 日本支店番号 / SG branch code |
| 15 | Account Type | 账户类型 | `account_type` | ✅ | ❌ | ❌ | Normal（普通）/ Current（活期），日本专用 |
| 16 | Account No. | 银行账号 | `account_no` | ✅ | ✅ | ✅ | 收款方银行账号 |
| 17 | SWIFT Code | 国际汇款代码 | `swift_code` | ❌ | ✅ | ✅ | 美国、新加坡使用 |
| 18 | ACH Routing | ACH 路由号 | `ach_routing` | ❌ | ✅ | ❌ | 美国 ACH 转账路由号，默认走 ACH |
| 19 | Wire Routing | Wire 路由号 | `wire_routing` | ❌ | ✅ | ❌ | 美国 Wire 汇款路由号，可选 |
| 20 | PayNow UEN | PayNow 企业编号 | `paynow_uen` | ❌ | ❌ | ✅ | 新加坡 PayNow 企业注册编号，可选 |

---

## 四、金额与费用内容字段

| # | 字段名（英文） | 字段名（中文） | 字段 ID | 类型 | 地区 | 说明 |
|---|---|---|---|---|---|---|
| 21 | Amount | 金额 | `amount` | 文本输入 | 全部 | 发票总金额，带千分位格式，例：`250,000` |
| 22 | Tax Rate | 税费率 | `tax_rate` | 数字输入（%） | 全部 | 发票适用税率，百分比，例：`10`（表示 10%） |
| 23 | Detail | 费用内容明细 | `invoice_detail_payload` | 只读动态表格 | 全部 | AI 从发票中解析的费用行，通用结构见下方说明 |
| 24 | Purpose | 打款用途 | `purpose` | 文本输入 | 全部 | 打款用途描述，用于银行备注 |
| 25 | Memo | 备注 | `memo` | 多行文本 | 全部 | 补充备注信息 |

### Detail 字段（invoice_detail_payload）数据结构

采用通用"表头 + 行数组"结构，前端渲染为动态表格，支持横向滚动处理宽表：

```json
{
  "headers": ["列名1", "列名2", "列名3"],
  "rows": [
    ["行1列1", "行1列2", "行1列3"],
    ["行2列1", "行2列2", "行2列3"]
  ],
  "footer": [["合计行1", "合计行2", "合计行3"]]
}
```

**三种典型格式示例（对应三个地区的 Mock 数据）：**

| 地区 | 列结构 | 典型场景 |
|---|---|---|
| JP | `内容（実施日・委託業務）` / `請求額` | 委托服务费（2列窄表） |
| US | `Line#` / `Description - Advertising Services` / `Campaign Label` / `Total` | 广告明细（4列宽表，19行） |
| SG | `商品名` / `コード` / `数量` / `単価` / `金額` | 商品采购清单（5列表） |

---

## 五、日期字段

| # | 字段名（英文） | 字段名（中文） | 字段 ID | 类型 | 可编辑 | 说明 |
|---|---|---|---|---|:---:|---|
| 26 | Applicant | 申请人 | `applicant` | 只读文本 | ❌ | 发票上传人邮箱账号 |
| 27 | Application Date | 上传时间 | `application_date` | 只读文本 | ❌ | 发票上传至系统的时间，格式：`YYYY-MM-DD HH:mm` |
| 28 | Invoice Date | 发票开具日期 | `invoice_date` | 日期选择器 | ✅ | 供应商开票日期（請求書発行日），格式：`YYYY-MM-DD` |
| 29 | Transaction Date | 交易发生日 | `transaction_date` | 日期选择器 | ✅ | 业务真实发生日期，货交当天 / 服务提供日（取引日 / 納品日） |
| 30 | Service Period | 服务期间 | `service_period_start` / `service_period_end` | 日期选择器（Start → End） | ✅ | 服务合同有效期，用于按月摊销计算 |
| 31 | Accounting Date | 入账日期 | `accounting_date` | 日期选择器 | ✅ | JE Posting Date，决定进哪个月报表，财务手动选择 |

### 四个业务日期的含义对比

| 字段 | 日文对应 | 业务含义 | 影响对象 | 填写方 |
|---|---|---|---|---|
| Invoice Date | 請求書発行日 | 供应商把发票开出来的日期 | 归档 / 对账追溯 | AI 预填，财务可改 |
| Transaction Date | 取引日 / 納品日 | 货物交付或服务实际提供的日期 | 判断业务生效期间 | AI 预填，财务可改 |
| Service Period | サービス期間 | 服务合同的开始和结束日期 | 按月摊销的计算区间 | AI 预填，财务可改 |
| Accounting Date | JE計上日 / 会計日 | JE 入账到总账的日期 | 月结 / 关账 / 损益表 PL | 财务必须手动填写 |

---

## 六、折旧字段

仅当 **One-time Expense = No** 时展示折旧填写区。

| # | 字段名 | 字段 ID | 类型 | 说明 |
|---|---|---|---|---|
| 32 | One-time Expense（是否一次性费用） | `one_time_expense` | 单选 Yes / No | 默认 **Yes**；选 No 时展开折旧区 |
| 33 | Depreciation Method（折旧方法） | `depreciation_method` | 下拉选择 | Straight-line（定額法）/ Declining Balance（定率法） |
| 34 | Depreciation Period（折旧期间） | `depreciation_start` / `depreciation_end` | Month 选择器（Start → End） | 折旧开始月和结束月 |
| 35 | Salvage Value（残值） | `salvage_value` | 数字输入 | **仅定額法**，资产残余价值 |
| 36 | Depreciation Rate（折旧率） | `depreciation_rate` | 数字输入（%） | **仅定率法**，年折旧率 |
| 37 | Description（折旧描述） | `depreciation_description` | 多行文本 | 描述具体折旧项目，例：`オフィス設備 — 3F改装費用` |

### 两种折旧方法字段对比

| 字段 | 定額法 Straight-line | 定率法 Declining Balance |
|---|:---:|:---:|
| 折旧期间（Start → End） | ✅ | ✅ |
| 残值（Salvage Value） | ✅ | ❌ |
| 折旧率（Depreciation Rate） | ❌ | ✅ |
| 描述（Description） | ✅ | ✅ |

---

## 七、字段完整展示顺序

```
────────── 基本信息 ──────────
Description（费用名）
Company
Region
Currency
Payment Type
Payment Bank
Payment Account Name

────────── 收款银行信息 ──────────
Payee Name
Account Holder (Kana)        ← JP only
Bank Name
Bank Name (Kana)             ← JP only
Bank Code                    ← JP / SG
Branch Name (Kana)           ← JP only
Branch Code                  ← JP / SG
Account Type                 ← JP only
Account No.
SWIFT Code                   ← US / SG
ACH Routing                  ← US only
Wire Routing                 ← US only
PayNow UEN                   ← SG only

────────── 金额与费用内容 ──────────
Amount
Tax Rate
Detail（费用内容动态表格）
Purpose
Memo

────────── 日期与审计 ──────────
Applicant                    ← 只读
Application Date             ← 只读
Invoice Date
Transaction Date
Service Period（Start → End）
Accounting Date

────────── 折旧（仅 One-time Expense = No 时展示）──────────
One-time Expense
  └─ No →
       Depreciation Method（下拉：定額法 / 定率法）
         ├─ 定額法：Depreciation Period / Salvage Value / Description
         └─ 定率法：Depreciation Period / Depreciation Rate / Description
```

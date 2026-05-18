
| 项目名称 | F Expert — Invoice 详情页字段梳理                                   |
| ---- | -------------------------------------------------------------- |
| 文档版本 | v2.0                                                           |
| 创建日期 | 2026年4月30日                                                     |
| 修改记录 | v1.x：初版（JE tool 相关内容已迁移至《D系统支持创建JE.md》）v2.0：按最新实现全量整理 Invoice 详情页字段，新增 Description / Tax Rate / Detail Payload / 折旧字段 / 五个日期字段 |
| 原型   | [F-PAP-PAYMENT-REVIEW.html](https://doraemon-prototype.vercel.app/F-PAP-PAYMENT-REVIEW.html) |


---

## 一、字段总览

Invoice 详情页字段分为四个区块：**基本信息**、**收款银行信息**、**金额与费用内容**、**日期信息**。  
其中收款银行字段按地区（JP / US / SG）显示不同子集。

---

## 二、基本信息字段

| # | 字段名 | 字段 ID | 类型 | 地区 | 说明 |
|---|---|---|---|---|---|
| 1 | Description（费用名） | `ivDescription` | 文本输入 | 全部 | 费用的简要名称，置于详情页最顶部，例：`マーケティング費用 4月分` |
| 2 | Company | `ivCompany` | 下拉选择 | 全部 | 付款方公司主体，与 Region 联动自动填充（见下方联动规则） |
| 3 | Region | `ivRegion` | 下拉选择 | 全部 | JP / US / SG，决定后续银行字段显示范围，并联动 Currency 默认值 |
| 4 | Currency | `ivCurrency` | 下拉选择 | 全部 | JPY / USD / SGD，随 Region 变更自动切换 |
| 5 | Payment Type | `ivPaymentType` | 下拉选择 | 全部 | Administrative / Non-Administrative |
| 6 | Payment Bank | `ivPaymentBank` | 文本输入 | 全部 | 付款银行名称 |
| 7 | Payment Account Name | `ivPaymentAccountName` | 文本输入 | 全部 | 付款方账户名称 |

**Company ↔ Region 联动规则：**

| Region | 自动填充 Company |
|---|---|
| JP | CTW INC |
| US | CTW US INC |
| SG | CTW G123 SINGAPORE PTE LTD |
| TW | AINEKOX CO LTD. |
| CN | 不自动填充 |

Company 完整枚举值：`AINEKOX CO LTD.` / `SHANGHAI WEIYOUYI CHUXIN TECH CO LTD` / `CTW G123 SINGAPORE PTE LTD` / `CTW INC` / `CTW US INC` / `CTW CAYMAN`

---

## 三、收款银行信息字段（按地区显示）

| # | 字段名 | 字段 ID | 类型 | JP | US | SG | 说明 |
|---|---|---|---|---|---|---|---|
| 8 | Payee Name | `ivPayeeName` | 文本输入 | ✅ | ✅ | ✅ | 收款方名称 |
| 9 | Account Holder (Kana) | `ivAccountHolderKana` | 文本输入 | ✅ | ❌ | ❌ | 半角片假名，日本专用 |
| 10 | Bank Name | `ivBankName` | 文本输入 | ✅ | ✅ | ✅ | 收款银行名称 |
| 11 | Bank Name (Kana) | `ivBankNameKana` | 文本输入 | ✅ | ❌ | ❌ | 半角片假名，日本专用 |
| 12 | Bank Code | `ivBankCode` | 文本输入 | ✅ | ❌ | ✅ | 日本金融机构代码 / SG bank code |
| 13 | Branch Name (Kana) | `ivBranchNameKana` | 文本输入 | ✅ | ❌ | ❌ | 支店名（半角片假名），日本专用 |
| 14 | Branch Code | `ivBranchCode` | 文本输入 | ✅ | ❌ | ✅ | 支店番号 / SG branch code |
| 15 | Account Type | `ivAccountType` | 下拉选择 | ✅ | ❌ | ❌ | Normal（普通）/ Current（活期），日本专用 |
| 16 | Account No. | `ivAccountNo` | 文本输入 | ✅ | ✅ | ✅ | 收款方银行账号 |
| 17 | SWIFT Code | `ivSwiftCode` | 文本输入 | ❌ | ✅ | ✅ | 美国、新加坡使用 |
| 18 | ACH Routing | `ivAchRouting` | 文本输入 | ❌ | ✅ | ❌ | 美国 ACH 转账路由号 |
| 19 | Wire Routing | `ivWireRouting` | 文本输入 | ❌ | ✅ | ❌ | 美国 Wire 路由号 |
| 20 | PayNow UEN | `ivPayNowUen` | 文本输入 | ❌ | ❌ | ✅ | 新加坡 PayNow 企业注册编号 |

---

## 四、金额与费用内容字段

| # | 字段名 | 字段 ID | 类型 | 地区 | 说明 |
|---|---|---|---|---|---|
| 21 | Amount（金额） | `ivAmount` | 文本输入 | 全部 | 发票总金额，格式为带千分位数字 |
| 22 | Tax Rate（税费率） | `ivTaxRate` | 数字输入（%） | 全部 | 发票适用税率，百分比，例：`10`（表示10%）|
| 23 | Detail（费用内容） | `ivPayloadWrap` | 只读表格 | 全部 | AI 从发票中解析出的费用明细行，采用通用结构：`{ headers, rows, footer? }`，支持任意列数和格式（详见下方说明） |
| 24 | Purpose（打款用途） | `ivPurpose` | 文本输入 | 全部 | 打款用途描述，用于银行备注 |
| 25 | Memo | `ivMemo` | 多行文本 | 全部 | 补充备注信息 |

### Detail 字段数据结构

`invoice_detail_payload` 采用通用的"表头 + 行数组"结构，渲染为动态表格，支持横向滚动：

```json
{
  "headers": ["列名1", "列名2", "..."],
  "rows": [
    ["行1列1", "行1列2", "..."],
    ["行2列1", "行2列2", "..."]
  ],
  "footer": [["合计行1", "合计行2", "..."]]
}
```

**三种典型格式示例：**

| 地区 | 列结构 | 示例场景 |
|---|---|---|
| JP | `内容（実施日・委託業務）` / `請求額` | 委托服务费（2列窄表） |
| US | `Line#` / `Description - Advertising Services` / `Campaign Label` / `Total` | 广告明细（4列宽表） |
| SG | `商品名` / `コード` / `数量` / `単価` / `金額` | 商品采购清单（5列表） |

---

## 五、日期字段

| # | 字段名 | 字段 ID | 类型 | 可编辑 | 说明 |
|---|---|---|---|---|---|
| 26 | Applicant（申请人） | `ivApplicant` | 只读文本 | ❌ | 发票上传人，显示邮箱账号 |
| 27 | Application Date（上传时间） | `ivApplicationDate` | 只读文本 | ❌ | 发票上传至系统的时间，格式：`YYYY-MM-DD HH:mm` |
| 28 | Invoice Date（发票开具日期） | `ivInvoiceDate` | 日期选择器 | ✅ | 供应商开票日期，`請求書発行日`，格式：`YYYY-MM-DD` |
| 29 | Transaction Date（交易发生日） | `ivTransactionDate` | 日期选择器 | ✅ | 业务真实发生日期（交货日 / 服务提供日），`取引日 / 納品日`，格式：`YYYY-MM-DD` |
| 30 | Service Period（服务期间） | `ivServicePeriodStart` / `ivServicePeriodEnd` | 日期选择器（Start → End） | ✅ | 服务合同有效期，用于按月摊销计算。格式：`YYYY-MM-DD`，同行展示 `start → end` |
| 31 | Accounting Date（入账日期） | `ivAccountingDate` | 日期选择器 | ✅ | JE Posting Date，决定进哪个月报表，需财务手动选择 |

**日期字段业务含义对比：**

| 字段 | 日文对应 | 影响对象 | 谁填写 |
|---|---|---|---|
| Invoice Date | 請求書発行日 | 归档 / 对账 | AI 预填，可改 |
| Transaction Date | 取引日 / 納品日 | 判断业务生效日期 | AI 预填，可改 |
| Service Period | サービス期間 | 摊销计算月份 | AI 预填，可改 |
| Accounting Date | JE計上日 | 月结报表归属期间 | 财务手动填写 |

---

## 六、折旧字段（仅当 One-time Expense = No 时展示）

| # | 字段名 | 字段 ID | 类型 | 说明 |
|---|---|---|---|---|
| 32 | One-time Expense（是否一次性费用） | `ivOneTime` | 单选（Yes / No） | 默认 Yes。选 No 时展开折旧填写区 |
| 33 | Depreciation Method（折旧方法） | `depMethodSelect` | 下拉选择 | Straight-line（定額法）/ Declining Balance（定率法） |
| 34 | Depreciation Period（折旧期间） | `depStraightStart` / `depStraightEnd` 或 `depDecliningStart` / `depDecliningEnd` | Month 选择器（Start → End） | 折旧开始月和结束月 |
| 35 | Salvage Value（残值）| `depStraightSalvage` | 数字输入 | 仅定額法，资产残余价值 |
| 36 | Depreciation Rate（折旧率） | `depDecliningRate` | 数字输入（%） | 仅定率法，年折旧率 |
| 37 | Description（折旧描述） | `depStraightDesc` / `depDecliningDesc` | 多行文本 | 描述具体折旧项目，例：`オフィス設備 — 3F改装費用` |

**折旧方法字段对比：**

| 字段 | 定額法（Straight-line） | 定率法（Declining Balance） |
|---|---|---|
| 折旧期间 | ✅ | ✅ |
| 残值 | ✅ | ❌ |
| 折旧率 | ❌ | ✅ |
| 描述 | ✅ | ✅ |

---

## 七、字段展示顺序（实际页面排列）

```
Description
Company
Region
Currency
Payment Type
Payment Bank
Payment Account Name
Payee Name
Account Holder (Kana)        [JP only]
Bank Name
Bank Name (Kana)             [JP only]
Bank Code                    [JP / SG]
Branch Name (Kana)           [JP only]
Branch Code                  [JP / SG]
Account Type                 [JP only]
Account No.
SWIFT Code                   [US / SG]
ACH Routing                  [US only]
Wire Routing                 [US only]
PayNow UEN                   [SG only]
Amount
Tax Rate
Detail（费用内容表格）
Purpose
Memo
Applicant                    [只读]
Application Date             [只读]
Invoice Date
Transaction Date
Service Period（Start → End）
Accounting Date
One-time Expense
  └─ [No] → Depreciation Method
            └─ 定額法：Period / Salvage Value / Description
            └─ 定率法：Period / Depreciation Rate / Description
```

# Invoice Review Workbench 开发规格

本文档用于指导 AI 或开发者实现发票解析结果的财务核对页面。开发对象为 F-PAP-PAYMENT-REVIEW_副本.html 当前 demo。

目标是让财务不再默认面对几十个字段，而是先看到与汇款和记账最相关的核对卡片；完整字段仍保留在 All Fields 页签中，方便财务灵活修改。

## 业务背景

AI 已完成发票 OCR、字段解析和业务异常判断，并为字段产出置信度。置信度越高，代表 AI 解析越可靠，越不需要人工逐项确认。

本页面不再处理业务异常提醒。业务异常已由 OCR 和 AI 在前置环节判断，页面只负责字段核对、低置信提醒、必填缺失提醒和人工修改。

财务在页面中主要完成两类核对：

1. 汇款核对：确认是否需要付款，以及付款对象、金额、收款银行、付款账户是否齐备。
2. 记账核对：确认入账主体、金额、日期、确认与分摊信息、明细摘要是否齐备。

## UI 语言规则

页面所有静态 UI 文案必须使用英文，包括页签、卡片标题、字段标签、按钮、提示、弹窗、抽屉、空状态和 tooltip。

字段状态标签也使用英文。必填字段为空时显示 Missing，低置信字段显示 Review。

AI 从发票中解析出的原始内容不需要翻译，例如供应商名称、银行名称、描述、明细行内容。地区性账户类型的实际值可以保留原语言，但下拉选项的展示文案应尽量使用英文。

## 页面结构

右侧核对区包含三个页签：

1. Payment Review
2. Accounting Review
3. All Fields

默认进入 Payment Review。

顶部不要展示 AI Parsed Invoice 概览区，也不要展示汇款待确认数量、记账待确认数量、人工确认数量、已修改字段数量等统计卡片。

## 字段状态标签

字段级标签只显示需要财务动作的字段。

Missing 用于适用于当前场景的必填字段为空。颜色为红色。Missing 的优先级最高，如果同一个字段既为空又低置信，只显示 Missing，不显示 Review。

Review 用于适用于当前场景且置信度低的字段。颜色为黄色。高置信和中置信字段不显示任何标签，避免页面信息过载。

以下情况不显示字段状态标签：

- 高置信字段。
- 中置信字段。
- 不适用于当前地区的字段。
- Requires Finance Payout 为 No 时的银行、路由和付款方账户字段。
- OCR 和 AI 已经判断过的业务异常。

## 卡片颜色规则

卡片不显示右上角状态文字，例如 Payable、Ready、Needs Review。卡片只通过颜色表达状态。

卡片标题下不展示副标题或说明文案，例如不展示 Posting entity、Payment currency, amount, and due date 这类辅助说明。卡片只保留标题、字段行、必要的字段标签和编辑入口。

编辑入口放在卡片右上角，与卡片标题同一行。编辑入口只显示编辑图标，不显示 Edit 文字，也不要显示按钮边框或背景盒子。编辑入口不要放在卡片底部，以减少纵向占用。

Vendor Name 和 Total Amount 是财务核对的关键锚点，需要在卡片字段行中做轻量视觉加强。Vendor Name 的字段值应比普通字段更醒目。Total Amount 的字段值应使用更强字重和略大的字号，金额数字应便于快速扫读。加强方式应保持克制，不要新增大面积背景块，不要破坏卡片的简洁密度。

卡片颜色优先级如下：

1. 红色：卡片内存在适用于当前场景的必填字段为空，或存在阻断型路由字段缺失。
2. 黄色：卡片内没有必填空值，但存在低置信字段需要人工确认，或存在非阻断型路由信息建议确认。
3. 白色：卡片内无必填空值，无低置信字段。

## Requires Finance Payout 规则

如果 Requires Finance Payout 为 No，则表示不需要汇款。

此时 Payment Review 只显示 No Payout 一张卡片。银行、路由、付款方账户字段不参与 Payment Review 的 Missing 判断、Review 判断、计数和卡片颜色判断。

Accounting Review 不受影响，仍按地区和通用记账规则正常展示。

如果 Requires Finance Payout 为 Yes，则根据地区显示对应的 Payment Review 卡片和字段。汇款字段参与 Missing、Review 和卡片颜色判断。

## 通用 Accounting Review

所有地区的 Accounting Review 基础卡片一致。Region 不在卡片内显示，因为地区信息已经在页面其他位置体现。

所有地区都固定显示以下四张基础卡片：

1. Entity
2. Amount Breakdown
3. Accounting Date
4. Recognition & Allocation

Line Items 为条件卡片。只有当该 invoice 实际存在明细行时才展示。如果没有明细行，不展示此卡片，也不因为没有明细行而把 Accounting Review 置为异常。

### Entity

显示字段：

- Company

必填规则：

- 与现有系统保持一致。

不显示字段：

- Region
- Tax Reg. No.
- Business Category
- Payment Type

### Amount Breakdown

显示字段：

- Total Amount
- Excl. Tax
- Tax Amount

必填规则：

- 与现有系统保持一致。

显示说明：

Currency 不单独作为字段行展示，但可参与金额展示和现有完整性判断。页面不做金额勾稽异常判断。

### Accounting Date

显示字段：

- Invoice Date
- Accounting Date

必填规则：

- 与现有系统保持一致。

不显示字段：

- Service Period
- Allocation Required
- Allocation
- Recognition

### Recognition & Allocation

显示字段：

- Service Period
- Allocation Required
- Allocation
- Recognition

必填规则：

- 与现有系统保持一致。

显示说明：

Service Period 不放在 Accounting Date 卡片中，而是放在 Recognition & Allocation 卡片中。页面不做服务期异常判断。

### Line Items

展示条件：

- 只有当发票实际存在明细行时展示。
- 如果发票没有明细行、明细行为空或 AI 没有解析到明细行，则不展示此卡片。
- 不因为没有明细行而显示红色，也不把明细行缺失计入 Missing。

显示字段：

- Line Count：展示明细行数量，用于判断是否存在多行需要进一步核对。
- Main Item：展示第一条明细的项目名称和描述摘要，内容需要适当截断，帮助财务快速识别费用内容。
- Service Coverage：展示明细行覆盖的服务期间。若多行有服务期间，则展示最早开始日期到最晚结束日期。若没有服务期间，则显示 Not provided。

不显示字段：

- Line Excl. Tax Sum
- Amount Check
- Purpose
- Tax Rate

显示说明：

Line Items 卡片只展示明细摘要，不展开完整表格。完整明细仍保留在 All Fields 中，财务可在 All Fields 中编辑。

## 通用 Payment Review 卡片

当 Requires Finance Payout 为 Yes 时，多数地区显示以下四张汇款卡片：

1. Payee
2. Payment Amount
3. Payee Bank
4. Payer Account

### Payee

显示字段：

- Vendor Name
- Description

必填规则：

- 与现有系统保持一致。

显示说明：

Description 用于帮助财务快速理解发票内容，只显示一行，超过卡片宽度时截断省略。Account Name 不在 Payee 卡片显示，应放在 Payee Bank 卡片。Invoice No. 不在 Payee 卡片显示。

### Payment Amount

显示字段：

- Currency
- Total Amount
- Amount Due
- Due Date

必填规则：

- 与现有系统保持一致。

显示说明：

China 和 Taiwan 场景中，Due Date 可以展示。其是否参与必填判断与现有系统保持一致。

### Payee Bank

Payee Bank 的展示字段按地区变化，详见下方地区逻辑。

必填规则：

- 与现有系统保持一致。

Account Name 必须显示在 Payee Bank 卡片中，不显示在 Payee 卡片中。

### Payer Account

显示字段：

- Payer Bank
- Payer Account

必填规则：

- 与现有系统保持一致。

显示说明：

Payer Account 作为辅助展示字段。

## 地区逻辑

以下按地区列出 Payment Review 和 Accounting Review 的展示规则。

各地区的必填规则、路由完整性判断和缺失字段判断均与现有系统保持一致。本文档不再重复罗列各地区字段的必填清单。

## Japan

### Payment Review

Requires Finance Payout 为 Yes 时显示以下卡片。

Payee 卡片显示 Vendor Name 和 Description。

Payment Amount 卡片显示 Currency、Total Amount、Amount Due、Due Date。

Payee Bank 卡片显示 Bank Name、Branch Name、Account No.、Account Name、Bank and Branch Code、Account Kana。

Bank and Branch Code 是组合展示字段，由 Bank Code 与 Branch Code 拼接。缺失状态和卡片颜色判断与现有系统保持一致。

Payer Account 卡片显示 Payer Bank 和 Payer Account。

### Accounting Review

固定显示 Entity、Amount Breakdown、Accounting Date、Recognition & Allocation 四张卡片。

当发票存在明细行时，额外显示 Line Items 卡片。Line Items 显示 Line Count、Main Item、Service Coverage。

## United States

### Payment Review

Requires Finance Payout 为 Yes 时显示以下卡片。

Payee 卡片显示 Vendor Name 和 Description。

Payment Amount 卡片显示 Currency、Total Amount、Amount Due、Due Date。

Payee Bank 卡片显示 Bank Name、Branch Name、Account No.、Account Name、ACH Routing、Wire Routing、SWIFT。

路由完整性判断与现有系统保持一致。

Payer Account 卡片显示 Payer Bank 和 Payer Account。

### Accounting Review

固定显示 Entity、Amount Breakdown、Accounting Date、Recognition & Allocation 四张卡片。

当发票存在明细行时，额外显示 Line Items 卡片。Line Items 显示 Line Count、Main Item、Service Coverage。

## Singapore

### Payment Review

Requires Finance Payout 为 Yes 时显示以下卡片。

Payee 卡片显示 Vendor Name 和 Description。

Payment Amount 卡片显示 Currency、Total Amount、Amount Due、Due Date。

Payee Bank 卡片显示 Bank Name、Branch Name、Account No.、Account Name、PayNow UEN、Bank and Branch Code、SWIFT。

路由提示和卡片颜色判断与现有系统保持一致。Bank and Branch Code 组合展示 Bank Code 与 Branch Code。

Payer Account 卡片显示 Payer Bank 和 Payer Account。

### Accounting Review

固定显示 Entity、Amount Breakdown、Accounting Date、Recognition & Allocation 四张卡片。

当发票存在明细行时，额外显示 Line Items 卡片。Line Items 显示 Line Count、Main Item、Service Coverage。

## China

### Payment Review

Requires Finance Payout 为 Yes 时显示以下卡片。

Payee 卡片显示 Vendor Name 和 Description。

Payment Amount 卡片显示 Currency、Total Amount、Amount Due、Due Date。

Payee Bank 卡片显示 Bank Name、Branch Name、Account No.、Account Name、Bank Code、Branch Code、SWIFT。

路由提示和卡片颜色判断与现有系统保持一致。

Payer Account 卡片显示 Payer Bank 和 Payer Account。

### Accounting Review

固定显示 Entity、Amount Breakdown、Accounting Date、Recognition & Allocation 四张卡片。

当发票存在明细行时，额外显示 Line Items 卡片。Line Items 显示 Line Count、Main Item、Service Coverage。

## Taiwan

### Payment Review

Requires Finance Payout 为 Yes 时显示以下卡片。

Payee 卡片显示 Vendor Name 和 Description。

Payment Amount 卡片显示 Currency、Total Amount、Amount Due、Due Date。

Payee Bank 卡片显示 Bank Name、Branch Name、Account No.、Account Name、Bank Code、Branch Code、SWIFT。

路由提示和卡片颜色判断与现有系统保持一致。

Payer Account 卡片显示 Payer Bank 和 Payer Account。

### Accounting Review

固定显示 Entity、Amount Breakdown、Accounting Date、Recognition & Allocation 四张卡片。

当发票存在明细行时，额外显示 Line Items 卡片。Line Items 显示 Line Count、Main Item、Service Coverage。

## Cayman

### Payment Review

Requires Finance Payout 为 Yes 时显示以下卡片。

Payee 卡片显示 Vendor Name 和 Description。

Payment Amount 卡片显示 Currency、Total Amount、Amount Due、Due Date。

Payee Bank 卡片显示 Bank Name、Branch Name、Account No.、Account Name、SWIFT。

Cayman 为国际汇款场景。SWIFT 的缺失状态和卡片颜色判断与现有系统保持一致。

Payer Account 卡片显示 Payer Bank 和 Payer Account。

### Accounting Review

固定显示 Entity、Amount Breakdown、Accounting Date、Recognition & Allocation 四张卡片。

当发票存在明细行时，额外显示 Line Items 卡片。Line Items 显示 Line Count、Main Item、Service Coverage。

## No Payout 场景

当 Requires Finance Payout 为 No 时，不区分地区，Payment Review 只显示 No Payout 卡片。

No Payout 卡片显示 Requires Payout、Vendor Name、Invoice No.、Total Amount。

基础完整性判断与现有系统保持一致。银行、路由、付款方账户字段完全不参与 Payment Review 判断。

No Payout 卡片通常为白色；只有基础字段缺失时才显示红色。

## All Fields 页签

All Fields 用于保留完整字段和灵活修改能力。

All Fields 不展示搜索框、All、Review、Edited、统一展开或收起等筛选工具。

All Fields 按原始字段分组展示所有字段。字段保持可编辑，财务可以在这里修改任何解析结果。

Dates 分组展示 Invoice Date、Due Date、Accounting Date。

Fee Recognition 分组展示 Service Period、Allocation Required、Allocation、Recognition。

Service Period 必须放在 Fee Recognition 分组中，不放在 Dates 分组中。

各分组可以保留单独的展开和收起能力，以降低纵向噪音。不要因为置信度或修改状态隐藏字段，避免财务误以为字段不可编辑或不存在。

## 验收标准

1. 页面所有静态 UI 文案使用英文，发票原始数据可以保留原语言。
2. 页面不展示顶部 AI Parsed Invoice 概览统计区。
3. 卡片右上角不出现 Payable、Ready、Needs Review 等状态胶囊文案。
4. 卡片编辑入口位于右上角，只显示编辑图标，不显示 Edit 文字，也不显示按钮边框或背景盒子。
5. 低置信字段显示黄色 Review。
6. 必填空字段显示红色 Missing。
7. 红色优先级高于黄色。
8. Payee 卡片显示 Vendor Name 和 Description，Description 只显示一行，超过宽度时截断省略。
9. Vendor Name 和 Total Amount 在卡片字段行中有轻量视觉加强，但不增加大面积背景块。
10. Account Name 显示在 Payee Bank 卡片，不显示在 Payee 卡片。
11. Entity 卡片只显示 Company，不显示 Region、Tax Reg. No.、Business Category、Payment Type。
12. Accounting Date 卡片只显示 Invoice Date 和 Accounting Date。
13. Service Period、Allocation Required、Allocation、Recognition 显示在 Recognition & Allocation 卡片。
14. Requires Finance Payout 为 No 时，不显示银行、路由、付款方账户核对卡片。
15. Requires Finance Payout 为 No 时，银行、路由、付款方账户字段不进入 Review 或 Missing 判断。
16. 所有地区均显示四张基础 Accounting Review 卡片。
17. Line Items 仅在发票实际存在明细行时显示。
18. Line Items 卡片只显示 Line Count、Main Item、Service Coverage。
19. Line Items 卡片不显示 Line Excl. Tax Sum、Amount Check、Purpose、Tax Rate。
20. All Fields 不展示搜索框和筛选按钮。
21. All Fields 中 Service Period 放在 Fee Recognition 分组。
22. 页面不展示 OCR 已判断过的业务异常逻辑。

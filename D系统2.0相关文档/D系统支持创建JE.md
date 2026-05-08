支持财务通过D系统的chat来创建JE

原型：[https://doraemon-prototype.vercel.app/chat_create_JE.html?scene=create-je](https://doraemon-prototype.vercel.app/chat_create_JE.html?scene=create-je)



1创建JE tool：

入参：


| 序号  | 字段名称                 | 字段类型    | 是否必填 | 字段说明                                                                             |
| --- | -------------------- | ------- | ---- | -------------------------------------------------------------------------------- |
| 1   | Accounting Date 会计日期 | Date 日期 | ✅ 必填 | 分录所属会计期间，格式：YYYY-MM-DD                                                           |
| 2   | Region地区             | 枚举文本    | ✅ 必填 | 业务归属地区：JP / US / SG / KY                                                         |
| 3   | Description 描述       | Text 文本 | ✅ 必填 | 平账原因、业务描述、单据备注，用于对账追溯                                                            |
| 4   | 凭证分录 lines           | List 列表 | ✅ 必填 | 支持多条借贷分录（1借多贷 / 多借1贷），借贷合计须相等。每条分录包含：科目代码（account）、科目名称（account_name / Report Name）、借方金额（debit）、贷方金额（credit） |


> 凭证分录约束：至少包含一条借方分录和一条贷方分录；所有分录借方金额之和 = 所有分录贷方金额之和。

具体case可参考原型



2删除JE tool（只支持删除通过D创建的JE）：

入参： je_id

具体case可参考原型

## 3.编辑JE tool（只支持编辑通过D创建的JE）：


| 序号  | 字段名称       | 字段类型    | 是否必填 | 字段说明                                                            |
| --- | ---------- | ------- | ---- | --------------------------------------------------------------- |
| 1   | je_id      | -       | ✅ 必填 | JE 唯一 id                                                        |
| 2   | 会计日期       | Date 日期 | 可选   | 分录所属会计期间，格式：YYYY-MM-DD                                          |
| 3   | 地区         | 枚举文本    | 可选   | 业务归属地区：JP / US / CN / SG / TW                                   |
| 4   | Description 描述 | Text 文本 | 可选   | 平账原因、业务描述、单据备注，用于对账追溯                                           |
| 5   | 凭证分录 lines | List 列表 | 可选   | 需修改的分录明细，每条包含：科目代码（account）、科目名称（account_name / Report Name）、借方金额（debit）、贷方金额（credit）；修改后借贷合计须相等 |


> 凭证分录约束（同创建）：如传入 lines，须至少包含一条借方分录和一条贷方分录，且借贷合计相等。

具体case可参考原型

## 4.Tool的permission：

Position为：fin

 
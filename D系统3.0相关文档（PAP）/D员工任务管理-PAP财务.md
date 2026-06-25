# D System 3.0 — 财务员工任务管理 PRD

**版本**: v1.0 **创建日期**: 2026-04-09 **负责人**: TBD **状态**: Draft

原型：<https://doraemon-prototype.vercel.app/D-PAP-FINANCE-TASKS.html>


---

## 1. Executive Summary

### 问题陈述

财务岗位需执行两项核心任务——Invoice 审核与打款处理。目前缺乏统一的任务管理界面，导致：

* 财务人员无法快速获知待处理工作量
* 单条 Invoice 的审核和打款状态缺乏独立追踪
* 打款完成状态（JE 关联）仅月底可知，容易遗漏

### 解决方案

在 D System 3.0 中为财务岗位构建专属任务管理界面：

* **审核**：所有待审核 Invoice 以独立卡片展示（所有财务可见）；已审核区仅展示当前用户审核通过的 Invoice
* **打款**：以 Invoice 维度展示，每条由当前用户审核通过的 Invoice 自动生成打款卡片，月底系统查询 JE 关联状态自动标记完成
* **提醒**：月中（15日早上起）黄色提醒打款，月末（最后一天早上起）红色紧急提醒
* **结算**：每月最后一天 18:00 系统结算，按 JE 关联状态自动标记打款完成


---

## 2. 背景

D 系统的定位调整为**决策层通过 Agent 下发目标，Agent 管理一线员工**。

财务岗位的两项核心任务（Invoice 审核、打款）具有高度数据驱动特征：

**审核任务**：每条 Invoice 独立对应一个任务卡片。所有财务人员可看到所有待审核 Invoice。

**打款任务**：以 Invoice 维度展示，每位财务仅看到**自己审核通过**的 Invoice 的打款卡片。月底系统查询 JE 关联状态后自动标记完成。

**关键约束**：JE 关联集中在月底操作，月中无法通过 JE 状态判断是否已打款。因此设计两级提醒：月中黄色提醒（15日早上起）、月末红色提醒（最后一天早上起）。每月最后一天 18:00 进行系统结算。


---

## 3. 用户角色与画像

### 主要用户：Finance Specialist

| 属性  | 描述  |
|-----|-----|
| 角色  | 财务团队成员 |
| 核心职责 | Invoice 审核、银行打款 |
| 使用频率 | 每日  |


---

## 4. CASE

### Case1：查看今日任务列表

> 作为财务专员，我希望打开任务管理页面就能看到今天所有待处理任务，以便快速了解工作量。

* 页面加载后显示当前日期（MM/DD/YYYY 格式），问候语格式为 "Hi, here are your tasks today: X pending review, X pending payment."
* 页面分为三个聚合卡片：📋 Pending Review、💰 Pending Payment、✅ Payment Completed
* 卡片不显示状态标签

### Case2：查看待审核 Invoice

> 作为财务专员，我希望看到所有待审核 Invoice，不限于分配给我的。

* 将 F Expert 中**所有** status=pending 的 Invoice 聚合展示为一张 "Pending Review" 卡片（所有财务可见）
* 卡片显示待审核的数量，例如 "X invoice(s)"
* 点击卡片整体跳转至 F Expert 对应的票据审核页面

### Case3：查看打款任务

> 作为财务专员，我希望看到我需要处理的打款 Invoice，以便了解打款工作量。

* 将\*\*当前用户审核通过的（已审核）**且**未关联 JE（待打款）\*\*的 Invoice 聚合在一起（因为审核完成后即进入待打款状态）
* 以 Invoice 维度展示，每条一张卡片，显示 {Account Name} Payment 及打款金额
* 卡片高度设计更小（紧凑模式）
* 默认最多显示 5 条，超过 5 条时底部显示 "View More" 按钮，点击后展开全部
* 点击卡片跳转至 F System 的 Invoice 管理列表页
* 月中（15日早上起）未关联 JE 的卡片变为黄色边框，提示 "Remember to make payment"
* 月末（最后一天早上起）未关联 JE 的卡片变为红色边框，提示 "Month-end approaching, please complete payment soon"

### Case4：查看已打款任务

> 作为财务专员，我希望看到我已经完成打款的 Invoice 数量。

* 将当前用户已关联 JE 的 Invoice 聚合展示为一张 "Payment Completed" 卡片
* 卡片显示已完成打款的数量，例如 "X invoice(s)"
* 点击卡片整体跳转至 F System 的 Invoice 管理列表页

### Case5：月中提醒

> 作为财务专员，我希望在月中收到打款提醒，以免遗漏。

* 每月 15 日早上起，Pending Payment 区中未关联 JE 的卡片变为黄色边框
* 卡片提示 "Remember to make payment"

### Case6：月末提醒

> 作为财务专员，我希望在月末最后一天早上收到紧急打款提醒。

* 每月最后一天早上起，Pending Payment 区中未关联 JE 的卡片变为红色边框
* 卡片提示 "Month-end approaching, please complete payment soon"

### Case7：月底结算

> 作为财务专员，每月最后一天 18:00 系统进行结算，我希望看到结算后的完成状态。

**场景描述**：系统在每月最后一天 18:00 批量查询所有 approved Invoice 的 JE 关联状态，更新打款完成情况。

**验收标准**：

* 所有审核 Invoice 已完成 → Pending Review 区清空，全部移至 Reviewed 区
* 部分打款 Invoice 关联了 JE → 移至 Payment Completed 区，显示 "Payment Amount ¥XX,XXX · JE Linked"
* 仍有未关联 JE 的 Invoice → 保留在 Pending Payment 区
* 页面顶部显示绿色成功 Banner："Month-end Settlement Completed"
* Banner 描述："All invoices reviewed. X payment(s) completed, Y still pending."

### 权限

* 财务任务界面仅对财务角色开放
* Pending Review 区：所有财务可见
* Reviewed 区和 Payment 区：仅显示当前用户相关数据（仅显示自己点击review的invoice）

## 

## 



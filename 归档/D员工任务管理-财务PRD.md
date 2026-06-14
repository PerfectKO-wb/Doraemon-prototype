
# D System 3.0 — 财务员工任务管理 PRD

**版本**: v2.0
**创建日期**: 2026-04-09
**负责人**: TBD
**状态**: Draft

---

## 变更记录

| 时间 | 内容 | 负责人 |
|------|------|--------|
| 20260409 | 初版创建 | — |
| 20260409 | 打款任务改为提醒模式 | — |
| 20260409 | 审核粒度改为每条 Invoice 一个卡片 | — |
| 20260409 | 打款改为 Invoice 维度，月底查 JE 自动标记完成 | — |
| 20260409 | **v2.0**：移除全部 A Ticket 逻辑；增加月中黄色提醒；月底结算场景改为全部审核完成 + 部分打款完成；卡片内容改为英文 | — |

---

## 1. Executive Summary

### 问题陈述

财务岗位需执行两项核心任务——Invoice 审核与打款处理。目前缺乏统一的任务管理界面，导致：
- 财务人员无法快速获知待处理工作量
- 单条 Invoice 的审核和打款状态缺乏独立追踪
- 打款完成状态（JE 关联）仅月底可知，容易遗漏

### 解决方案

在 D System 3.0 中为财务岗位构建专属任务管理界面：
- **审核**：所有待审核 Invoice 以独立卡片展示（所有财务可见）；已审核区仅展示当前用户审核通过的 Invoice
- **打款**：以 Invoice 维度展示，每条由当前用户审核通过的 Invoice 自动生成打款卡片，月底系统查询 JE 关联状态自动标记完成
- **提醒**：月中（15日早上起）黄色提醒打款，月末（最后一天早上起）红色紧急提醒
- **结算**：每月最后一天 18:00 系统结算，按 JE 关联状态自动标记打款完成

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

| 属性 | 描述 |
|------|------|
| 角色 | 财务团队成员 |
| 核心职责 | Invoice 审核、银行打款 |
| 使用频率 | 每日 |

---

## 4. CASE

### Case1：查看今日任务列表

> 作为财务专员，我希望打开任务管理页面就能看到今天所有待处理任务，以便快速了解工作量。

- [ ] 页面加载后显示当前日期（MM/DD/YYYY 格式），问候语格式为 "Hi, here are your tasks today: X pending review, X pending payment."
- [ ] 页面分为三个聚合卡片：📋 Pending Review、💰 Pending Payment、✅ Payment Completed
- [ ] 卡片不显示状态标签

### Case2：查看待审核 Invoice

> 作为财务专员，我希望看到所有待审核 Invoice，不限于分配给我的。

- [ ] 将 F Expert 中**所有** status=pending 的 Invoice 聚合展示为一张 "Pending Review" 卡片（所有财务可见）
- [ ] 卡片显示待审核的数量，例如 "X invoice(s)"
- [ ] 点击卡片整体跳转至 F Expert 对应的票据审核页面

### Case3：查看打款任务

> 作为财务专员，我希望看到我需要处理的打款 Invoice，以便了解打款工作量。

- [ ] 将**当前用户审核通过的（已审核）**且**未关联 JE（待打款）**的 Invoice 聚合在一起（因为审核完成后即进入待打款状态）
- [ ] 以 Invoice 维度展示，每条一张卡片，显示 {Account Name} Payment 及打款金额
- [ ] 卡片高度设计更小（紧凑模式）
- [ ] 默认最多显示 5 条，超过 5 条时底部显示 "View More" 按钮，点击后展开全部
- [ ] 点击卡片跳转至 F System 的 Invoice 管理列表页
- [ ] 月中（15日早上起）未关联 JE 的卡片变为黄色边框，提示 "Remember to make payment"
- [ ] 月末（最后一天早上起）未关联 JE 的卡片变为红色边框，提示 "Month-end approaching, please complete payment soon"

### Case4：查看已打款任务

> 作为财务专员，我希望看到我已经完成打款的 Invoice 数量。

- [ ] 将当前用户已关联 JE 的 Invoice 聚合展示为一张 "Payment Completed" 卡片
- [ ] 卡片显示已完成打款的数量，例如 "X invoice(s)"
- [ ] 点击卡片整体跳转至 F System 的 Invoice 管理列表页

### Case5：月中提醒

> 作为财务专员，我希望在月中收到打款提醒，以免遗漏。

- [ ] 每月 15 日早上起，Pending Payment 区中未关联 JE 的卡片变为黄色边框
- [ ] 卡片提示 "Remember to make payment"

### Case6：月末提醒

> 作为财务专员，我希望在月末最后一天早上收到紧急打款提醒。

- [ ] 每月最后一天早上起，Pending Payment 区中未关联 JE 的卡片变为红色边框
- [ ] 卡片提示 "Month-end approaching, please complete payment soon"

### Case7：月底结算

> 作为财务专员，每月最后一天 18:00 系统进行结算，我希望看到结算后的完成状态。

**场景描述**：系统在每月最后一天 18:00 批量查询所有 approved Invoice 的 JE 关联状态，更新打款完成情况。

**验收标准**：
- [ ] 所有审核 Invoice 已完成 → Pending Review 区清空，全部移至 Reviewed 区
- [ ] 部分打款 Invoice 关联了 JE → 移至 Payment Completed 区，显示 "Payment Amount ¥XX,XXX · JE Linked"
- [ ] 仍有未关联 JE 的 Invoice → 保留在 Pending Payment 区
- [ ] 页面顶部显示绿色成功 Banner："Month-end Settlement Completed"
- [ ] Banner 描述："All invoices reviewed. X payment(s) completed, <span style='color:red'>Y still pending</span>."

---

## 5. 功能需求

### 5.1 任务管理界面

#### 页面布局

| 区域 | 说明 |
|------|------|
| 主内容区 | 居中展示（max-width: 560px），glassmorphism 风格，包含用户信息、日期、问候语、三个聚合卡片 |

#### 用户信息区

- 左上角胶囊按钮：用户头像（姓名缩写）、姓名、角色（Finance Specialist）、下拉切换

#### 日期与问候

- 顶部显示当前日期（MM/DD/YYYY）和星期（英文）
- 下方以打字机效果输出问候文本
- 问候格式：`Hi, here are your tasks today: X pending review, X pending payment.`
- 结算完成时：`Hi, month-end settlement is done 🎉`

#### 任务卡片

页面分为三个聚合卡片，不再单独展示每条 Invoice：

**📋 Pending Review（所有财务可见）**

| 元素 | 说明 |
|------|------|
| 图标 | 📋 |
| 标题 | Pending Review |
| 描述 | "X invoice(s)" |
| 交互 | 点击卡片整体跳转至 F Expert 对应的票据审核页面 |

**💰 Pending Payment（仅当前用户审核过的）**

将已审核和待打款的 Invoice 聚合在这一区域，**以 Invoice 维度逐条展示卡片**：

| 元素 | 说明 |
|------|------|
| 图标 | 💰 |
| 标题 | "{Account Name} Payment" |
| 描述 | "Payment Amount ¥XX,XXX" |
| 样式 | 卡片高度较小（紧凑设计） |
| 展示逻辑 | 默认最多显示 5 条。超过 5 条时，底部显示 "View More" 按钮，点击展开全部 |
| 交互 | 点击卡片跳转至 F System 的 Invoice 管理列表页 |
| 黄色边框 | 月中（15日早上起）：warning 状态，提示 "Remember to make payment" |
| 红色边框 | 月末（最后一天早上起）：urgent 状态，提示 "Month-end approaching, please complete payment soon" |

**✅ Payment Completed**

| 元素 | 说明 |
|------|------|
| 图标 | ✅ |
| 标题 | Payment Completed |
| 描述 | "X invoice(s)" |
| 交互 | 点击卡片整体跳转至 F System 的 Invoice 管理列表页 |
| 样式 | 完成态（灰色半透明背景） |

### 5.2 打款完成判定

完成判定通过系统查询 JE 关联状态实现：

| 时机 | 查询逻辑 | 结果处理 |
|------|----------|----------|
| 页面加载时 | 查询 F 系统 `je_id` 字段 | `je_id IS NOT NULL` → 打款卡片移至 Payment Completed 区 |
| 月中 15 日早上起 | 同上 | `je_id IS NULL` 的卡片显示黄色边框（warning） |
| 月末最后一天早上起 | 同上 | `je_id IS NULL` 的卡片显示红色边框（urgent） |
| 每月最后一天 18:00 | 批量查询所有 approved Invoice | 按 JE 关联状态更新打款完成情况，页面显示结算 Banner |

### 5.3 数据来源与查询

| 数据 | 来源 | 查询方式 | 可见性 |
|------|------|----------|--------|
| 待审核 Invoice | F Expert | `status=pending`，当月 | **所有财务可见** |
| 待打款 Invoice | F Expert & F 系统 | 聚合查询：当前用户审核通过的（`status=approved`）且未关联 JE（`je_id IS NULL`） | **仅当前用户** |
| 打款完成 Invoice | F 系统 | 当前用户审核通过的（`status=approved`）且已关联 JE（`je_id IS NOT NULL`） | **仅当前用户** |
| Invoice 审核详情 | F-PAP-PAYMENT-REVIEW | 点击卡片整体跳转链接 | — |

> **重要说明**：`je_id IS NULL` 在月中不等于"未打款"，因为 JE 录入集中在月底。月底通过 JE 关联状态可获得最终完成情况。

### 5.4 提醒机制

两级提醒，仅针对待打款卡片：

| 级别 | 触发时间 | 卡片变化 | 提示文案 |
|------|----------|----------|----------|
| Warning（黄色） | 每月 15 日早上起 | 黄色边框 + 黄色脉冲圆点 | "Remember to make payment" |
| Urgent（红色） | 每月最后一天早上起 | 红色边框 + 红色脉冲圆点 | "Month-end approaching, please complete payment soon" |

---

## 6. 技术规格

### 6.1 架构概览

```
D System 3.0 (Frontend)
    │
    ├── 任务管理界面 (D-PAP-FINANCE-TASKS)
    │       ├── 用户信息 ← P 系统 (员工信息)
    │       ├── 待审核 Invoice ← F Expert API（所有 pending）
    │       ├── 已审核 Invoice ← F Expert API（当前用户 approved）
    │       └── 打款 Invoice ← F 系统 API（当前用户审核过的，按 JE 状态分组）
    │
    ├── Invoice 审核界面 (F-PAP-PAYMENT-REVIEW)
    │       └── 审核操作 → F Expert
    │
    └── Agent (后端)
            ├── 打款完成判定（月底定时查询 JE 关联状态）
            ├── 月中提醒触发（15日早上起打款卡片黄色边框）
            └── 月末提醒触发（最后一天早上起打款卡片红色边框）
```

### 6.2 接口依赖

| 接口 | 用途 | 方向 |
|------|------|------|
| F Expert API — GET /invoices?status=pending&month=YYYY-MM | 获取所有待审核 Invoice 列表 | D → F |
| F Expert API — GET /invoices?status=approved&reviewer={user}&month=YYYY-MM | 获取当前用户已审核 Invoice 列表 | D → F |
| F 系统 API — GET /invoices?status=approved&reviewer={user}&month=YYYY-MM | 获取当前用户审核过的 Invoice（含 je_id 字段，区分待打款/已完成） | D → F |
| P 系统 API — GET /employees/{id} | 获取员工信息 | D → P |

### 6.3 安全与权限

- 财务任务界面仅对财务角色开放（role=finance）
- Pending Review 区：所有财务可见
- Reviewed 区和 Payment 区：仅显示当前用户相关数据
- 所有数据查询通过后端 API 代理，前端不直接连接数据库

---

## 7. 非功能需求

| 需求 | 标准 |
|------|------|
| 页面加载时间 | ≤ 2 秒（首屏渲染） |
| 数据刷新频率 | 实时（用户操作后立即更新）+ 每 5 分钟自动刷新 |
| 浏览器兼容 | Chrome 90+、Edge 90+、Safari 15+ |
| 响应式 | 支持 ≥ 768px 宽度设备 |
| 可用性 | 99.9% uptime |

---

## 8. 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| F Expert API 响应延迟 | 任务卡片数据无法及时更新 | 中 | 增加缓存层，展示"数据更新中"状态 |
| 月中 JE 未关联数偏高（已打款但未录 JE） | 财务看到待打款数不准确 | 高 | 打款卡片不追踪进度，月底才判定完成 |
| F 系统与 D 系统数据不一致 | 显示与实际不符 | 中 | 定时对账任务，不一致时告警 |
| reviewer 字段缺失 | 无法按用户筛选已审核/打款 | 低 | F Expert 审核操作必须记录 reviewer |

---

## 9. Roadmap

### Phase 1 — MVP（2 周）

- [ ] 任务管理界面前端实现（参照原型 D-PAP-FINANCE-TASKS.html）
- [ ] F Expert API 对接（待审核/已审核 Invoice 列表）
- [ ] 按 Invoice 粒度展示审核卡片

### Phase 2 — 打款与提醒（2 周）

- [ ] F 系统 API 对接（当前用户审核过的 Invoice，含 JE 关联状态）
- [ ] 打款卡片按 Invoice 维度展示（{Account Name} Payment + Payment Amount）
- [ ] 月中（15日早上起）黄色提醒
- [ ] 月末（最后一天早上起）红色提醒
- [ ] 每月最后一天 18:00 系统结算（批量查询 JE 关联状态，更新完成情况）

### Phase 3 — 增强（2 周）

- [ ] 数据报表（月度审核/打款统计）
- [ ] 财务主管看板（团队维度任务概览）

---

## 10. 范围外

| 项目 | 说明 |
|------|------|
| Invoice 审核操作界面 | 已在 F-PAP-PAYMENT-REVIEW.html 实现 |
| 银行打款操作 | 由银行系统或 ERP 系统负责 |
| JE 录入操作 | 由财务 ERP 系统负责 |
| 员工排班/请假 | 由 P 系统负责 |
| A Ticket 创建与管理 | 本版本不创建 A Ticket |

---

## 11. 原型

HTML 原型文件：`D-PAP-FINANCE-TASKS.html`

参考设计：https://prototype-henna-kappa.vercel.app/pap?role=artist&user=u3

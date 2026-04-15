
# F Expert — JE Review Chat PRD

**版本**: v1.0
**创建日期**: 2026-04-09
**负责人**: TBD
**状态**: Draft

---

## 变更记录

| 时间 | 内容 | 负责人 |
|------|------|--------|
| 20260409 | 初版创建 | — |

---

## 1. Executive Summary

### 问题陈述

F System 每月从银行拉取流水并通过 AI 自动生成 Journal Entry (JE)。在这个过程中：
- AI 匹配可能不准确（流水描述与 Invoice 内容不一致、Counterparty 名称模糊匹配等）
- 错误的 JE 会导致财务数据不准确，合规风险高
- 目前缺乏人工审核环节，AI 生成的 JE 直接入账

### 解决方案

在 F Expert 中新增 **JE Review Chat** 会话类型：
- F System AI 对低置信度的 JE 发起审核请求，通过 Chat 形式展示流水和 Invoice 数据
- 财务在 Chat 中查看、确认或修正 AI 的匹配结果
- 确认后 F System 正式生成 JE

---

## 2. 背景

### 流程概述

```
银行流水 → F System 拉取 → AI 分析 & 匹配 Invoice → 生成 JE Draft
    │
    ├── 高置信度（≥ 85%）→ 自动生成 JE
    │
    └── 低置信度（< 85%）→ 发送至 F Expert → 财务 Chat 审核
                                                  │
                                                  ├── 确认 → F System 生成 JE
                                                  └── 拒绝/修改 → AI 重新匹配
```

### 数据来源

**银行流水字段**：

| 字段 | 说明 |
|------|------|
| ID | 流水唯一标识 |
| Bank Name | 银行名称 |
| Currency | 币种 |
| Amount | 金额 |
| Description | 摘要描述 |
| Counterparty Bank | 对方银行 |
| Memo | 备注 |
| Transaction Date | 交易日期 |
| Accounting Date | 记账日期 |
| Transaction & Clearing | 交易与清算 |
| Transaction Type | 交易类型 |
| Counterparty Name | 对方名称 |
| Transfer Type | 转账类型 |
| Counterparty Branch | 对方分行 |
| Counterparty Account | 对方账号 |
| Reconciliation & System | 对账与系统 |
| Bank Reference | 银行参考号 |
| Edi Info | EDI 信息 |
| Customer Reference | 客户参考号 |

**Invoice 字段（多地区）**：

| 类别 | 字段 | JP | US | SG |
|------|------|-----|-----|-----|
| 公共 | Bank Name | ✅ (半角片假名) | ✅ | ✅ |
| 公共 | Account Name | ✅ (片假名 + 非片假) | ✅ | ✅ |
| 公共 | Account Number | ✅ | ✅ | ✅ |
| 公共 | Amount | ✅ | ✅ | ✅ |
| 公共 | Purpose | ✅ | ✅ | ✅ |
| 公共 | Applicant | ✅ | ✅ | ✅ |
| 公共 | Date | ✅ | ✅ | ✅ |
| 公共 | Remitting Bank | ✅ (三井住友-法人) | ✅ (EW MM) | ✅ (CitiBank SGD) |
| 公共 | Payment Type | ✅ | ✅ | ✅ |
| 公共 | Currency | JPY | USD | SGD |
| 交叉 | Bank Code | ✅ | — | ✅ |
| 交叉 | Branch Code | ✅ | — | ✅ |
| 交叉 | SWIFT Code | — | ✅ | ✅ |
| 特有 | Branch Name | ✅ (半角片假名) | — | — |
| 特有 | Account Type | ✅ | — | — |
| 特有 | ACH Routing | — | ✅ | — |

---

## 3. 用户角色

### 主要用户：Finance Specialist

| 属性 | 描述 |
|------|------|
| 角色 | 财务团队成员 |
| 核心职责 | 审核 AI 生成的 JE Draft，确认流水与 Invoice 的匹配 |
| 使用频率 | 每月（集中在月初流水导入后） |

---

## 4. CASE

### Case1：查看待审核 JE 列表

> 作为财务专员，我希望在 F Expert 中看到所有需要审核的 JE，以便快速了解工作量。

- [ ] 在 F Expert 左侧 Sidebar 新增 "JE Review" 筛选标签
- [ ] JE Review 会话以 📊 图标标识，与 Invoice Review (📋) 区分
- [ ] 每个会话显示：流水 ID、Counterparty Name、Amount、状态标签（Pending / Confirmed）
- [ ] Pending 状态的会话显示橙色圆点

### Case2：Chat 审核流水与 Invoice

> 作为财务专员，我希望通过 Chat 的形式审核 AI 匹配的流水和 Invoice。

- [ ] 打开 JE Review 会话后，AI 以消息卡片形式展示：
  - 银行流水关键字段（Amount, Counterparty, Description, Date, Bank）
  - 匹配到的 Invoice 关键字段（Account Name, Amount, Purpose, Submitter）
- [ ] 不确定的字段以 ⚠ 标记高亮（橙色）
- [ ] 显示 AI 置信度指标（低/中/高）
- [ ] AI 明确提出需要确认的问题（例如："描述不一致，是否为同一服务？"）

### Case3：查看完整参考数据

> 作为财务专员，我希望查看完整的流水和 Invoice 原始数据。

- [ ] 右侧参考面板提供三个 Tab：Transaction、Invoice、AI JE Draft
- [ ] Transaction Tab 展示银行流水全部字段，需要关注的字段用 ⚠ 标记
- [ ] Invoice Tab 展示匹配到的 Invoice 全部字段
- [ ] AI JE Draft Tab 展示 AI 生成的 JE 草稿（借方/贷方科目、金额、税码等）

### Case4：确认并生成 JE

> 作为财务专员，确认匹配无误后，我希望一键让 F System 生成 JE。

- [ ] Chat 中提供 "Confirm & Generate JE" 按钮
- [ ] 点击后：
  - 会话状态从 Pending → Confirmed
  - AI 返回 JE 创建成功的确认卡片（JE ID、借贷科目、金额、状态）
  - 右侧面板状态更新为 "Confirmed — JE Generated"
  - F System 正式创建 JE

### Case5：拒绝或修改匹配

> 作为财务专员，如果匹配错误，我希望拒绝或通过 Chat 修改。

- [ ] Chat 中提供 "Reject Match" 按钮
- [ ] 财务可以直接在 Chat 中输入修正信息（例如："这笔应该匹配 Invoice INV-53_2"）
- [ ] AI 根据修正重新匹配并展示更新后的 JE Draft
- [ ] 财务再次确认后生成 JE

### Case6：月中/月末提醒

> 作为财务专员，我希望在有待审核 JE 时收到提醒。

- [ ] Sidebar 中 JE Review 筛选标签显示待审核数量
- [ ] 与 D System 任务管理联动，在 Pending Payment 中体现

---

## 5. 功能需求

### 5.1 会话类型

在 F Expert 中新增 "JE Review" 会话类型：

| 属性 | 说明 |
|------|------|
| 会话图标 | 📊 |
| 会话标题 | JE Review — {Transaction ID} |
| 触发条件 | F System AI 置信度 < 85% |
| 参与者 | F Expert AI + 财务专员 |

### 5.2 Chat 界面

| 组件 | 说明 |
|------|------|
| AI 消息 | 左对齐，F Expert AI 头像，支持数据卡片嵌入 |
| 用户消息 | 右对齐，灰色气泡 |
| 数据卡片 | 展示流水/Invoice/JE 关键字段，支持高亮标记 |
| 置信度条 | 黄色背景，显示 AI 匹配置信度（Low/Medium/High） |
| 操作按钮 | Confirm & Generate JE / Reject Match / Edit Fields |

### 5.3 参考面板

三个 Tab 切换：

**Transaction Tab**
- 展示银行流水全部 19 个字段
- 需关注的字段以 ⚠ 橙色标记

**Invoice Tab**
- 根据地区（JP/US/SG）展示对应字段
- 公共字段始终显示，交叉/特有字段按地区显示

**AI JE Draft Tab**
- 展示 AI 生成的 JE 草稿
- 字段：Debit Account, Credit Account, Amount, Tax Code, Tax Amount, Description, Vendor, Invoice Ref, Transaction Ref, Period
- 底部显示 AI 置信度和不确定原因

### 5.4 状态流转

```
F System AI 检测低置信度
  → 创建 JE Review 会话（Pending）
    → 财务打开 Chat 审核
      → 确认 → Confirmed → F System 生成 JE
      → 拒绝 → AI 重新匹配 → 再次审核
      → 修改 → 更新 JE Draft → 再次确认
```

---

## 6. 技术规格

### 6.1 架构概览

```
F System (Backend)
    │
    ├── 银行流水拉取 → AI JE 生成引擎
    │       ├── 高置信度 → 自动生成 JE
    │       └── 低置信度 → 创建 F Expert JE Review 会话
    │
    └── JE 生成 API ← F Expert 确认触发

F Expert (Frontend)
    │
    ├── Sidebar：新增 JE Review 筛选 + 会话列表
    ├── Chat Area：AI 消息 + 数据卡片 + 操作按钮
    └── Reference Panel：Transaction / Invoice / AI JE Draft
```

### 6.2 接口依赖

| 接口 | 用途 | 方向 |
|------|------|------|
| F System API — POST /je-reviews | 创建 JE Review 会话 | F System → F Expert |
| F System API — GET /transactions/{id} | 获取银行流水详情 | F Expert → F System |
| F Expert API — GET /invoices/{id} | 获取 Invoice 详情 | F Expert → F System |
| F System API — POST /je | 确认后生成 JE | F Expert → F System |
| F System API — PUT /je-reviews/{id}/confirm | 确认 JE Review | F Expert → F System |
| F System API — PUT /je-reviews/{id}/reject | 拒绝 JE Review | F Expert → F System |

### 6.3 AI 置信度计算

| 置信度 | 阈值 | 处理 |
|--------|------|------|
| High | ≥ 85% | 自动生成 JE，不进入审核 |
| Medium | 60% – 84% | 进入审核，AI 标记不确定字段 |
| Low | < 60% | 进入审核，AI 明确提示无法匹配 |

不确定因素包括：
- Counterparty Name 模糊匹配（流水用缩写 vs Invoice 全称）
- Description 与 Invoice Purpose 不一致
- 金额不完全匹配（含手续费、税差等）
- 找不到对应 Invoice

---

## 7. 非功能需求

| 需求 | 标准 |
|------|------|
| 会话响应时间 | AI 首条消息 ≤ 3 秒 |
| 数据刷新 | 实时推送新的 JE Review 会话 |
| 浏览器兼容 | Chrome 90+、Edge 90+、Safari 15+ |
| 安全 | 仅财务角色可访问 JE Review 会话 |
| 审计 | 所有确认/拒绝操作记录审计日志 |

---

## 8. 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| AI 置信度阈值过低 | 大量会话涌入，财务负担过重 | 中 | 初期设 85%，后续根据数据调优 |
| 流水描述不规范 | AI 匹配困难 | 高 | 支持财务在 Chat 中手动指定 Invoice |
| 多地区 Invoice 字段差异 | 匹配逻辑复杂 | 中 | 按地区维护独立的匹配规则 |
| 财务审核延迟 | 月底 JE 未及时生成 | 中 | 在 D System 任务管理中显示提醒 |

---

## 9. Roadmap

### Phase 1 — MVP（3 周）

- [ ] F Expert 新增 JE Review 会话类型
- [ ] Chat 界面：AI 消息 + 数据卡片 + 确认/拒绝按钮
- [ ] 参考面板：Transaction + Invoice + AI JE Draft
- [ ] F System API 对接：创建会话、确认/拒绝

### Phase 2 — 增强（2 周）

- [ ] 支持财务在 Chat 中修改 JE 字段（Edit Fields）
- [ ] 多地区 Invoice 字段适配（JP/US/SG）
- [ ] AI 置信度优化（基于历史确认数据学习）

### Phase 3 — 联动（2 周）

- [ ] 与 D System 任务管理联动（JE 审核提醒）
- [ ] 审计日志与报表
- [ ] 批量审核模式（多笔低置信度 JE 一起处理）

---

## 10. 范围外

| 项目 | 说明 |
|------|------|
| 银行流水拉取 | 由 F System 负责 |
| JE 自动生成（高置信度） | 由 F System AI 引擎负责 |
| ERP JE 录入 | 由 ERP 系统负责 |
| Invoice 提交与审核 | 已在 F-PAP-PAYMENT-REVIEW 实现 |

---

## 11. 原型

HTML 原型文件：`F-JE-REVIEW-CHAT.html`

关联页面：
- `F-PAP-PAYMENT-REVIEW.html` — Invoice 审核界面
- `D-PAP-FINANCE-TASKS.html` — 财务任务管理界面

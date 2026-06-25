# Invoice 全流程图

**状态**: Draft  
**创建日期**: 2026-06-15  
**关联系统**: F Expert · F Agent · F System

---

## 全流程图

虚线框内为 **F Expert** 负责的功能范围。

```mermaid
flowchart TD

    A2([邮件爬虫\nbilling.ctw.inc 共享邮箱])

    subgraph FEXPERT["F Expert"]

        subgraph SRC["来源层"]
            A1([员工手动上传])
            A3[API 接口上传\n生成待确认条目]
        end

        subgraph CONFIRM["人工确认层 - 爬虫专属"]
            A4{人工确认\n是否为正确发票}
            A5([Skip\n退款单、收据、非发票\n不进入解析])
        end

        subgraph PARSE["解析层"]
            B1[AI 解析\nOCR + 字段提取]
            B2([Failed\n图片模糊或非标票据\n人工介入或丢弃])
            B3[(Pending\n解析完成，待 Review)]
        end

        subgraph REVIEW["Review 层"]
            C1[财务 Review\n验证 AI 解析内容]
            C2([Approved])
            C3([Rejected\n终态])
        end

        subgraph EXPERT["专家确认层 - 低置信度回流"]
            E1[人工确认 JE\nF Expert 专家介入]
        end

    end

    subgraph DS["F Agent and F System"]
        D1[AI 自动生成 JE\n基于解析内容]
        D2{置信度检查}
        D3([JE 生成完成\n进入 F System])
    end

    A1 --> B1
    A2 --> A3 --> A4
    A4 -->|确认正确| B1
    A4 -->|Skip| A5

    B1 -->|解析通过| B3
    B1 -->|模糊或非标类型| B2

    B3 --> C1
    C1 -->|Approve| C2
    C1 -->|Reject| C3

    C2 --> D1
    D1 --> D2
    D2 -->|置信度高| D3
    D2 -->|置信度低| E1
    E1 --> D3
```

---

## 各层说明

### 来源层

| 来源 | 操作方 | 说明 |
|------|--------|------|
| 员工手动上传 | 员工（F Expert 内） | 在 F Expert 中直接上传发票文件（JPG / PNG / PDF） |
| 邮件爬虫 | Bot（F Expert 外部） | 定时抓取共享邮箱附件，通过 API 接口自动上传至 F Expert，无需人工触发 |

---

### 人工确认层（爬虫专属）

仅爬虫上传的文件需要经过此步骤，员工手动上传直接进入解析。

| 操作 | 触发条件 | 结果 |
|------|---------|------|
| 确认正确 | 文件确为应付发票 | 进入 AI 解析 |
| Skip | 退款单、收据、非发票类文件 | 终止，不进入解析流程 |

---

### 解析层（AI 门禁）

| 状态 | 触发条件 | 后续处理 |
|------|---------|---------|
| 解析通过 → `pending` | 图像清晰、票据类型合法（正式发票） | 进入 Review 队列 |
| 解析失败 → `failed` | 图像模糊、扫描不清晰；或为收据、非正式票据等不支持的类型 | 阻断流程，需人工介入处理或丢弃 |

---

### Review 层（F Expert · 财务）

| 操作 | 结果 | 说明 |
|------|------|------|
| Approve | `checked` | 财务确认 AI 解析内容正确，票据进入下游处理 |
| Reject | `denied`（终态） | 财务驳回，流程终止 |

---

### 下游层（F Agent & F System）

| 节点 | 说明 |
|------|------|
| AI 自动生成 JE | F Agent 基于发票解析内容自动生成会计分录（Journal Entry） |
| 置信度高 | JE 直接写入 F System，流程完成 |
| 置信度低 → 回流 F Expert | 转人工专家在 F Expert 中确认 JE 内容，确认后写入 F System |

---

## F Expert 功能边界

| 功能 | 是否在 F Expert |
|------|----------------|
| 员工手动上传入口 | ✅ |
| 邮件爬虫（共享邮箱抓取） | ❌（F Expert 外部） |
| 爬虫 API 接收 & 展示 | ✅ |
| 人工确认爬虫文件（Confirm / Skip） | ✅ |
| AI 解析 & 门禁（failed 处理） | ✅ |
| 财务 Review（Approve / Reject） | ✅ |
| AI 自动生成 JE | ❌（F Agent） |
| JE 写入系统 | ❌（F System） |
| 低置信度专家人工确认 JE | ✅（回流） |

## 方案一

### 现状分析

metaknow 项目已有的相关能力：

| 已有能力 | 模块  | 说明  |
|------|-----|-----|
| 客服员工技能画像 | `staffskill` | 基于 CS 对话记录，通过 pipeline 生成/更新员工技能描述（文本摘要），存储于 mt_staff_skill 表 |
| 会话关闭触发 | `OnCsConversationClosed / OnCsTicketClosed` | 会话/工单关闭后异步触发技能更新（增量模式） |
| 反馈提取 | `FeedbackHandle / feedbackExtract` | 从专家会话中提取反馈信息，写入 agentable 表 |
| 知识库  | `knowledge + recall` | 支持向量/全文/混合检索的知识管理系统，含 RAG 召回 |
| AI Pipeline | `AskAI / ops` | 可组合的 pipeline 执行框架 |
| CS 专家会话 | `CSExpertAgent` | 客服通过专家系统获取 AI 辅助回复草稿，确认后发送给玩家 |

### 痛点

* 现有 staffskill 只生成员工能力画像（文本摘要），不产出可复用的话术模板
* 优秀客服的回复话术散落在历史对话中，新人无法快速学习
* 缺乏从实际对话中自动提炼、结构化沉淀话术的机制
* AI 辅助回复无法利用已验证有效的话术作为参考

### 目标

根据客服回复玩家的实际对话，自动生成结构化话术 Skill，实现：


1. 自动提取：客服对话关闭后，自动分析客服回复质量，提炼优质话术
2. 结构化存储：话术按场景/类别/语言组织，支持检索
3. 辅助回复：AI 生成回复草稿时可召回相关话术作为参考
4. 持续优化：话术可人工审核、编辑、评分，形成闭环


---

## 功能需求

### 话术自动生成

触发时机：客服对话关闭（复用现有 `OnCsConversationClosed / OnCsTicketClosed` 钩子）

生成流程：


1. 收集对话上下文（玩家问题 + 客服回复 + 解决状态）
2. 通过 LLM Pipeline 分析对话，提取话术：
   * 场景识别：自动识别问题场景（如：充值问题、账号封禁、Bug 反馈等）
   * 话术提炼：从客服回复中提取可复用的回复模板
   * 质量评估：评估话术质量（是否解决问题、语气是否专业、是否有通用性）
3. 满足质量阈值的话术自动入库

生成规则：

* 仅对已解决工单生成话术
* 仅处理客服实际发送给玩家的回复（MarkSentUser 标记为已发送）
* 去重：与现有话术相似度 > 阈值时，合并而非新增

### 话术管理

| 功能  | 说明  |
|-----|-----|
| 列表查看 | 按场景/游戏/语言/状态筛选，支持全文搜索 |
| 审核  | 管理员可审核 draft 状态话术，通过/拒绝/编辑 |
| 手动创建 | 客服可手动添加话术 |
| 编辑  | 修改话术内容、分类、关键词 |
| 归档/删除 | 过时话术可归档 |
| 评分  | 使用后可评价话术有效性，影响质量分 |

### 话术召回（AI 辅助回复集成）

当 CS Expert Agent 生成 AI 回复草稿时：


1. 根据玩家问题，通过向量 + 关键词混合检索相关话术
2. 将匹配的话术作为参考注入到 Expert Agent 的 Payload 中
3. AI 参考话术生成更贴合实际的回复建议


## 方案二

### 产品定位

**客服话术 Skill** — 从客服回复玩家的真实对话中，自动学习并生成**结构化的场景处理 Skill**。

每个 Skill 封装了处理某类玩家问题的完整能力：

* **何时激活**（Trigger）— 什么场景下触发
* **理解什么**（Knowledge）— 问题分析 + 需要收集的信息 + 处理路径
* **如何回应**（Response Guide）— 回应策略、原则、口径、验证案例

Skill 可被 AI Agent 在后续遇到同类问题时**自动匹配并激活执行**，不是让 AI 复制模板，而是让 AI **基于 Skill 定义的策略灵活生成回复**。

### Skill vs 模板 vs 知识

|     | 话术模板 | 知识库（Knowledge） | **话术 Skill** |
|-----|------|----------------|----------|
| 本质  | 一段可复制的文本 | 事实/FAQ 条目      | 可执行的场景处理能力 |
| 回答的问题 | "这个问题怎么回复" | "事实是什么"        | "怎么分析、怎么处理、怎么回复" |
| AI 使用方式 | 检索 → 复制改写 | 检索 → 引用事实      | 匹配 → 激活 → 按策略生成 |
| 演进方式 | 不断新增条目 | 人工维护更新         | 同场景新对话持续强化已有 Skill |
| 内容  | 回复文本 | 问答对 / 文档       | trigger + knowledge + response_guide |

### 与现有 Skill 体系的关系

| 模块  | 定位  | 本功能的关系 |
|-----|-----|--------|
| `staffskill` | 员工个人能力画像 | 互补：staffskill 描述"人的能力"，Script Skill 描述"场景的处理能力" |
| `knowledge` | FAQ / 文档知识库 | 互补：knowledge 提供事实依据，Skill 提供处理策略 |
| **话术 Skill** | 场景处理能力 | AI 基于 Skill 定义的策略灵活生成回复 |

### 目标用户

| 用户角色 | 使用场景 |
|------|------|
| AI Agent | 自动匹配激活 Skill，按策略生成回复 |
| 全体客服 | 查阅 Skill 了解场景处理方法 |
| 客服管理者 | 审核 Skill、查看场景覆盖度和 Skill 效果 |

## Skill 数据模型

### Skill 结构定义

一个 Skill 不是一段话术文本，而是一个**结构化的能力定义**：

```json
{
  "id": "skill-xxxx",
  "name": "充值未到账处理",
  "scene": "payment/not_received",
  "app_code": "game001",
  "language": "zh",
  "version": 3,

  "trigger": {
    "description": "玩家反馈充值后未收到游戏币或道具",
    "keywords": ["充值", "没到账", "没收到", "扣款", "道具没有"],
    "embedding": [0.12, -0.03, ...]
  },

  "knowledge": {
    "problem_analysis": "充值未到账常见原因：1) 网络延迟导致发货延迟 2) 支付成功但游戏服务器未同步 3) 支付实际未成功但玩家以为成功 4) 系统异常",
    "required_info": ["订单号", "充值时间", "支付方式", "游戏区服"],
    "resolution_paths": [
      {
        "condition": "订单已到账但玩家未刷新",
        "action": "引导玩家重启游戏刷新"
      },
      {
        "condition": "订单支付成功但发货失败",
        "action": "记录订单号，提交补发工单"
      },
      {
        "condition": "订单支付未成功",
        "action": "引导玩家确认扣款记录，建议重新充值"
      }
    ]
  },

  "response_guide": {
    "tone": "专业、共情、耐心",
    "structure": ["问候安抚", "收集信息", "查询处理", "给出方案", "确认结束"],
    "principles": [
      "先安抚情绪，再处理问题",
      "主动要求提供订单号，减少来回沟通",
      "给出明确预期（如处理时间）"
    ],
    "validated_examples": [
      {
        "player": "我充了648但是钻石没到账，都过了一个小时了",
        "response": "非常抱歉给您带来不便！充值未到账的问题我来帮您处理。请您提供一下订单号（可在支付平台查看），我立即为您查询。",
        "source_ticket": 12345
      }
    ]
  },

  "quality": 0.87,
  "confidence": 0.92,
  "usage_count": 156,
  "success_rate": 0.78,
  "status": "active",
  "source_ticket_ids": [12345, 12389, 12456],

  "created_at": "2026-03-15T10:00:00Z",
  "updated_at": "2026-03-27T15:30:00Z"
}
```

### 核心区块说明

| 区块  | 字段  | 作用  |
|-----|-----|-----|
| **trigger** | description | 人类可读的场景描述 |
| **trigger** | keywords | 关键词匹配（快速过滤） |
| **trigger** | embedding | 语义向量（精确匹配） |
| **knowledge** | problem_analysis | AI 理解此类问题的背景和常见原因 |
| **knowledge** | required_info | AI 知道需要向玩家收集哪些信息 |
| **knowledge** | resolution_paths | 按条件分支的处理路径（AI 按实际情况选择） |
| **response_guide** | tone | 回复语气要求 |
| **response_guide** | structure | 回复结构（如：问候 → 收集 → 处理 → 结束） |
| **response_guide** | principles | 处理原则（从真实对话中提炼的最佳实践） |
| **response_guide** | validated_examples | 经验证的真实对话案例（参考，非照搬） |

### 质量指标说明

| 指标  | 含义  | 更新时机 |
|-----|-----|------|
| quality | Skill 内容的结构化质量（LLM 评估） | 创建 / 增量更新时 |
| confidence | 置信度，反映被多少真实案例验证过 | 每次增量更新 +0.01（上限 0.99） |
| usage_count | 被 AI 激活使用的次数 | 每次 match 成功时 |
| success_rate | 激活后工单实际解决的比例 | feedback 反馈时滚动计算 |

### 状态定义

| 状态  | 可被匹配激活 | 说明  |
|-----|:------:|-----|
| draft | 否      | AI 刚学习生成的新 Skill，待人工审核 |
| active | 是      | 审核通过，可被 AI Agent 匹配激活执行 |
| inactive | 否      | 手动停用或质量过低被自动停用 |


---

## 需求详情

### 功能列表

| 编号  | 功能  | 优先级 | 说明  |
|-----|-----|:---:|-----|
| F-01 | Skill 学习 | P0  | 对话关闭后自动提炼场景处理 Skill |
| F-02 | Skill 增量进化 | P0  | 同场景新对话强化已有 Skill（追加案例、路径、原则） |
| F-03 | Skill 匹配激活 | P0  | AI Agent 根据玩家问题匹配并激活适用 Skill |
| F-04 | Skill 管理 API | P0  | CRUD + 审核 |
| F-05 | AI Agent 集成 | P1  | activated_skills 注入 Expert Agent Payload |


---

### F-01 Skill 学习

#### 触发条件

| 条件  | 说明  |
|-----|-----|
| 触发时机 | CS 对话关闭（`PushClient` 发送并关闭后）或工单关闭（`OnCsTicketClosed`） |
| 前置条件 | 工单状态为**已解决（resolved）** |
| 输入范围 | 客服**已实际发送给玩家**的回复（`MarkSentUser` 标记） |
| 执行方式 | 异步 goroutine（不阻塞主流程） |

#### 学习流程

```
对话关闭（已解决）
  │
  ▼
1. 收集对话上下文
  ├─ 完整对话记录（玩家 + 客服）
  ├─ 工单元信息（app_code, language, resolved）
  │
  ▼
2. LLM Pipeline 分析提炼
  ├─ 场景识别（scene 分类）
  ├─ 知识提取（problem_analysis, required_info, resolution_paths）
  ├─ 策略提炼（tone, structure, principles）
  ├─ 案例抽取（validated_example，脱敏处理）
  ├─ 质量评估（quality 评分）
  │
  ▼
3. Skill 匹配判断
  ├─ 生成 trigger embedding
  ├─ 向量 + scene 匹配已有 Skill
  │
  ├─ 匹配到（相似度 > 0.85）→ F-02 增量进化
  └─ 无匹配 → 创建新 Skill（status = draft）
```

#### Pipeline 输入输出

**输入**：

```json
{
  "messages": [
    {"role": "player", "content": "我充值了但是没到账..."},
    {"role": "staff",  "content": "您好，请提供一下订单号..."},
    {"role": "player", "content": "订单号是 XXX123"},
    {"role": "staff",  "content": "已查询到，系统显示已到账，请重启游戏刷新..."}
  ],
  "app_code": "game001",
  "language": "zh",
  "resolved": true,
  "ticket_id": 12345
}
```

**输出**：

```json
{
  "scene": "payment/not_received",
  "name": "充值未到账处理",
  "trigger": {
    "description": "玩家反馈充值后未收到游戏币或道具",
    "keywords": ["充值", "没到账", "没收到"]
  },
  "knowledge": {
    "problem_analysis": "充值未到账常见原因：...",
    "required_info": ["订单号", "充值时间"],
    "resolution_paths": [
      {"condition": "已到账未刷新", "action": "引导重启刷新"},
      {"condition": "支付成功发货失败", "action": "提交补发工单"}
    ]
  },
  "response_guide": {
    "tone": "专业、共情",
    "structure": ["问候安抚", "收集信息", "查询处理", "给出方案", "确认结束"],
    "principles": ["先安抚再处理", "主动要求订单号"],
    "validated_example": {
      "player": "我充了648但是钻石没到账...",
      "response": "非常抱歉给您带来不便！..."
    }
  },
  "quality": 0.85
}
```

#### Pipeline Prompt 核心指令

```
你是一个客服话术 Skill 分析器。分析以下客服与玩家的对话，提炼出可复用的场景处理能力（Skill）。

注意：你要提炼的不是"回复模板"，而是"处理能力"——即：
1. 场景识别：这类问题的 scene 分类和触发关键词（trigger）
2. 问题分析：此类问题的常见原因和背景知识（knowledge.problem_analysis）
3. 所需信息：处理此类问题需要收集哪些信息（knowledge.required_info）
4. 处理路径：不同情况下的分支处理方案（knowledge.resolution_paths）
5. 回应策略：回复的语气、结构、原则（response_guide）
6. 验证案例：当前对话作为参考案例，需脱敏（response_guide.validated_example）

要求：
- 所有内容必须通用化，不含具体玩家信息
- 重点是"策略和方法"，不是"固定话术文本"
- resolution_paths 要覆盖对话中体现的不同处理分支
- principles 提炼客服回复中体现的好的处理原则
- quality 评分标准：问题分析深度(30%) + 处理路径完整性(30%) + 策略可操作性(40%)
- quality < 0.6 视为不可用
```


---

### F-02 Skill 增量进化

> **核心设计：同场景的新对话不是产出新 Skill，而是强化已有 Skill。**

当新对话提炼的 Skill 匹配到已有 active Skill（同 scene，embedding 相似度 > 0.85）时：

| 字段  | 更新策略 |
|-----|------|
| trigger.keywords | 合并去重新关键词 |
| trigger.embedding | 加权平均更新向量 |
| knowledge.problem_analysis | 如新对话揭示新原因，LLM 合并扩写 |
| knowledge.required_info | 合并去重 |
| knowledge.resolution_paths | 如发现新处理路径，追加 |
| response_guide.principles | 如体现新原则，追加 |
| response_guide.validated_examples | 追加新案例（保留最多 10 条，按 quality 排序淘汰最差） |
| confidence | +0.01（上限 0.99） |
| source_ticket_ids | 追加新 ticket_id |
| version | +1   |

**进化示例**：

```
Skill "充值未到账处理" v1 (来自 ticket#12345)
  resolution_paths: [引导刷新, 提交补发]

                    ↓ ticket#12456 关闭，同场景

Skill "充值未到账处理" v2
  resolution_paths: [引导刷新, 提交补发, 联系支付渠道确认]  ← 新增路径
  validated_examples: [案例1, 案例2]                        ← 新增案例
  confidence: 0.51 → 0.52                                  ← 置信度提升
```


---

### F-03 Skill 匹配激活

当 AI Agent 需要为客服生成回复草稿时：

```
玩家消息
  │
  ▼
1. 生成查询 embedding
  │
  ▼
2. 混合匹配
  ├─ 向量相似度检索（embedding cosine）
  ├─ 关键词命中（trigger.keywords）
  ├─ 候选范围：status = active
  │
  ▼
3. 排序（综合评分）
  score = similarity × 0.4
        + confidence × 0.25
        + success_rate × 0.25
        + quality × 0.1
  │
  ▼
4. 返回 Top-N Skill（默认 N=2）
```

**匹配结果**：

```json
{
  "matched_skills": [
    {
      "skill_id": "skill-xxxx",
      "name": "充值未到账处理",
      "similarity": 0.93,
      "score": 0.88,
      "knowledge": { ... },
      "response_guide": { ... }
    }
  ]
}
```


---

### F-04 Skill 管理

#### 接口列表

**管理接口**：

| Method | Path | 说明  | 权限  |
|--------|------|-----|-----|
| GET    | `/api/v1/cs-script-skill/list` | 列表查询 | 全体客服 |
| GET    | `/api/v1/cs-script-skill/:id` | 详情（完整 Skill 结构） | 全体客服 |
| POST   | `/api/v1/cs-script-skill` | 手动创建 Skill | 管理者 |
| PUT    | `/api/v1/cs-script-skill/:id` | 编辑 Skill | 管理者 |
| DELETE | `/api/v1/cs-script-skill/:id` | 删除  | 管理者 |
| POST   | `/api/v1/cs-script-skill/:id/review` | 审核（draft → active） | 管理者 |
| GET    | `/api/v1/cs-script-skill/scenes` | 场景分类列表 | 全体客服 |
| GET    | `/api/v1/cs-script-skill/stats` | 统计  | 管理者 |

**AI 使用接口**：

| Method | Path | 说明  | 权限  |
|--------|------|-----|-----|
| POST   | `/api/v1/cs-script-skill/match` | 匹配激活 Skill | 内部服务 |
| POST   | `/api/v1/cs-script-skill/:id/feedback` | 使用反馈 | 内部服务 |

#### 列表查询参数

| 参数  | 类型  | 必填  | 说明  |
|-----|-----|:---:|-----|
| scene | string | 否   | 按场景筛选 |
| app_code | string | 否   | 按游戏筛选 |
| language | string | 否   | 按语言筛选 |
| status | string | 否   | draft / active / inactive |
| keyword | string | 否   | 搜索 name、trigger.keywords |
| page | int | 否   | 页码，默认 1 |
| page_size | int | 否   | 每页条数，默认 20 |
| sort_by | string | 否   | confidence / success_rate / usage_count / created_at |

### F-05 AI Agent 集成

#### 集成流程

```
玩家提问 → CS Expert 系统
              │
              ▼
     CSExpertAgent.buildPayload
              │
              ├── SkillService.Match(玩家问题, appCode, language)
              │           │
              │           ▼
              │     返回匹配的 Skill(s)
              │
              ▼
     Payload.Context["activated_skills"] = [
         {
           "skill_id": "skill-xxxx",
           "name": "充值未到账处理",
           "knowledge": {
             "problem_analysis": "...",
             "required_info": [...],
             "resolution_paths": [...]
           },
           "response_guide": {
             "tone": "...",
             "structure": [...],
             "principles": [...],
             "validated_examples": [...]
           }
         }
     ]
              │
              ▼
     外部 Expert Agent 服务
     （system prompt 增加 Skill 执行指引）
              │
              ▼
     AI 基于 Skill 策略生成回复
              │
              ▼
     客服审阅 → 发送给玩家
              │
              ▼
     Skill usage_count + 1
```

#### Expert Agent Prompt 增加的指引

```
你已激活以下话术 Skill，请基于 Skill 中的能力定义生成回复：

1. 参考 knowledge.problem_analysis 理解问题背景
2. 按 knowledge.required_info 判断是否需要向玩家收集更多信息
3. 基于当前已知信息，从 knowledge.resolution_paths 中选择适用的处理路径
4. 按 response_guide.structure 组织回复结构
5. 遵循 response_guide.principles 中的原则
6. 可参考 validated_examples 的风格，但不要照搬内容
7. 语气按 response_guide.tone 要求

重要：你是在"执行 Skill"而非"复制模板"，需要结合具体情况灵活应用。
```


---



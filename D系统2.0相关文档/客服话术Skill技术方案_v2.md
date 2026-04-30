# CS Agent Skill 技术方案 v2

## 架构定位

```
玩家提问
  │
  ├──────────────────────────┬──────────────────────────┐
  │                          │                          │
  ▼                          ▼                          │
Skill 匹配                 Knowledge RAG 检索           │
(intent + keywords          (向量 + 全文)               │
 + conditions)                │                         │
  │                          │                          │
  ├── 命中 Skill             │                          │
  │     │                    │                          │
  │     ▼                    ▼                          │
  │   ┌─────────────────────────────────────────────┐  │
  │   │              CS Expert Agent                 │  │
  │   │                                              │  │
  │   │  ┌─────────────┐   ┌──────────────────────┐ │  │
  │   │  │    Skill     │   │  Knowledge           │ │  │
  │   │  │              │   │                      │ │  │
  │   │  │ instructions │   │ knowledge_refs 精准  │ │  │
  │   │  │ tools        │   │ + RAG 检索补充       │ │  │
  │   │  │ guardrails   │   │ → 去重合并后注入      │ │  │
  │   │  └─────────────┘   └──────────────────────┘ │  │
  │   └─────────────────────────────────────────────┘  │
  │                                                     │
  └── 未命中 ──→ 仅使用 Knowledge RAG 结果 ─────────────┘
```

### Knowledge 与 Skill 的关系

**Knowledge 始终被检索。Skill 激活时，`knowledge_refs` 提供精准优先知识，RAG 补充可能遗漏的内容；未命中 Skill 时，仅使用 RAG 结果。**

| | Knowledge | Skill |
|---|---|---|
| 定位 | **知识仓库** — 存储事实、政策、文档，始终被检索 | **场景处理能力** — 封装策略、工具、约束 |
| 何时使用 | **始终**：RAG 每次都运行；Skill 激活时额外加载 `knowledge_refs` | 匹配到场景时激活 |
| 内容来源 | 人工编写/维护 | AI 从对话学习 + 人工创建（Chat 方式） |
| 例子 | "充值到账时间说明"、"VIP 补偿政策"、"支付渠道信息" | "VIP 充值未到账处理"、"账号封禁申诉" |

### 触发逻辑

```
玩家消息进来
  │
  ├──────────────────┬───────────────────────┐
  │                  │                       │
  ▼                  ▼                       │
Skill 匹配       Knowledge RAG 检索          │
  │              (始终执行)                   │
  │                  │                       │
  ├── 命中 Skill     │                       │
  │     │            │                       │
  │     ▼            ▼                       │
  │   加载 Skill    合并知识                  │
  │   instructions  ① knowledge_refs 精准加载 │
  │   + tools       ② RAG 检索结果           │
  │   + guardrails  → 去重后注入 Agent        │
  │                                          │
  └── 未命中                                  │
        └── 仅使用 RAG 检索结果 ──────────────┘
```

**核心设计**：
- **Knowledge RAG 始终运行**，因为 Skill 可能未被激活，且即使激活了，`knowledge_refs` 也可能不完整
- Skill 激活时，`knowledge_refs` 提供高优先级精准知识，RAG 结果作为补充
- 两个来源的知识**去重合并**后注入 Agent（`knowledge_refs` 命中的条目优先，RAG 结果补充新内容）

---

## Knowledge 模块的定位

### 之前：两条独立链路

```
玩家消息 ──→ Knowledge RAG 检索 ──→ 返回知识片段 ──┐
         ──→ Skill 匹配         ──→ 返回 Skill ───┤
                                                    ▼
                                              合并注入 Agent
                                          （两条链路互不知道对方）
```

问题：Knowledge 检索是"盲目的"，不知道 Skill 需要什么知识，可能检索到无关内容或漏掉关键信息。

### 之后：RAG 始终运行 + Skill 引用精准补充

```
                    ┌──────────────────────┐
                    │   Knowledge Base     │
                    │   （知识仓库）         │
                    └──────┬───────────────┘
                           │
              ┌────────────┼────────────────┐
              │            │                │
              ▼            ▼                ▼
         Skill 引用    Skill 引用        RAG 检索
       (充值未到账)   (账号封禁)       (始终运行)
              │            │                │
              └────────────┼────────────────┘
                           │
                       去重合并
                     注入 Agent
```

**为什么 RAG 必须始终运行？**

1. **Skill 可能未激活**：不是所有问题都能匹配到 Skill，未命中时只能靠 RAG
2. **`knowledge_refs` 可能不完整**：Skill 设置时无法预见所有可能需要的知识
3. **`knowledge_refs` 可能不正确**：引用的知识条目可能已过期或不再适用
4. **对话可能偏离 Skill 场景**：用户可能追问 Skill 未覆盖的相关问题

| 维度 | 改造前 | 改造后 |
|---|---|---|
| RAG 检索 | 每次盲目检索，和 Skill 无关 | **始终运行**，但结果与 `knowledge_refs` 去重合并 |
| 与 Skill 的关系 | 无关，各自独立 | Skill 通过 `knowledge_refs` 提供精准优先知识，RAG 补充 |
| 知识优先级 | 无优先级 | `knowledge_refs` 命中的 > RAG 检索到的 |
| 维护方式 | 独立维护，不知道被谁引用 | 独立维护，能看到被哪些 Skill 引用 |
| Context 效率 | 可能检索到无关知识 | `knowledge_refs` 精准 + RAG 补充，去重后注入 |

### 知识合并策略

```
① knowledge_refs 加载（如果 Skill 激活）
     ↓
② Knowledge RAG 检索（始终执行）
     ↓
③ 去重：RAG 结果中与 knowledge_refs 重复的条目去掉
     ↓
④ 合并注入 Agent：
   - knowledge_refs 的结果标记为「Skill 引用」，优先级高
   - RAG 补充的结果标记为「RAG 检索」，优先级低
```

### Knowledge 模块的能力

| 能力 | 状态 | 说明 |
|---|---|---|
| 知识 CRUD | ✅ 保留 | 仍然需要管理知识条目 |
| 向量 + 全文检索 | ✅ 保留 | **始终运行**，不论 Skill 是否激活 |
| RAG 召回 | ✅ 保留 | 作为兜底保障，确保知识覆盖完整 |
| 被 Skill 引用 | 🆕 新增 | Skill 通过 `knowledge_refs` 精准引用，提供优先级 |
| 被引用追踪 | 🆕 新增 | 每条知识可查看"被哪些 Skill 引用" |

---

## Skill 结构定义

对齐主流 Agent Skill 模式（OpenAI function calling / Coze / Dify），一个 Skill 由六层组成：

```
┌─────────────────────────────────┐
│  trigger         何时激活        │  ← 场景匹配入口
├─────────────────────────────────┤
│  instructions    怎么处理        │  ← Agent 执行指令
├─────────────────────────────────┤
│  tools           能做什么        │  ← 可调用的工具（标准 function schema）
├─────────────────────────────────┤
│  knowledge_refs  需要知道什么    │  ← 引用 Knowledge 条目作为事实支撑
├─────────────────────────────────┤
│  examples        参考案例        │  ← few-shot 示例
├─────────────────────────────────┤
│  guardrails      不能做什么      │  ← 约束与边界
└─────────────────────────────────┘
```

### 完整 Skill 示例

```json
{
  "id": "skill-xxxx",
  "name": "VIP 充值未到账处理",
  "description": "处理 VIP 用户充值后未收到游戏币或道具的场景，包含信息收集、订单查询、补发和升级转接的完整处理能力",
  "version": 3,
  "status": "active",

  "trigger": {
    "intent": "payment/not_received",
    "description": "玩家反馈充值后未收到游戏币或道具",
    "keywords": ["充值", "没到账", "没收到", "扣款", "道具没有"],
    "conditions": {
      "user_segment": ["vip"],
      "app_codes": ["vividarmy", "puzzles"]
    }
  },

  "instructions": {
    "goal": "快速定位充值未到账原因并解决，优先保障 VIP 用户体验",
    "tone": "共情、专业、高优先级",
    "steps": [
      "1. 安抚情绪，表达重视",
      "2. 调用 query_order 主动查询订单状态（VIP 不要让用户提供信息，系统拉取）",
      "3. 根据订单状态走不同处理路径：",
      "   - 已到账未刷新 → 引导重启游戏",
      "   - 支付成功发货失败 → 调用 create_redelivery 补发",
      "   - 支付未成功 → 引导确认扣款记录",
      "   - 72h 内重复反馈 → 调用 transfer 升级主管",
      "4. 给出明确处理时间预期",
      "5. 确认用户问题已解决"
    ],
    "principles": [
      "先给方案再解释原因，不要让用户等解释",
      "VIP 用户主动从系统拉取信息，减少用户操作",
      "明确告知处理时间预期（如：预计 10 分钟内到账）"
    ]
  },

  "tools": [
    {
      "name": "query_order",
      "description": "根据用户 ID 查询最近的充值订单状态",
      "parameters": {
        "type": "object",
        "properties": {
          "user_id": { "type": "string", "description": "用户的 G123 ID" },
          "time_range_hours": { "type": "integer", "description": "查询最近多少小时的订单，默认 24", "default": 24 }
        },
        "required": ["user_id"]
      },
      "returns": {
        "type": "object",
        "properties": {
          "order_id": { "type": "string" },
          "amount": { "type": "number" },
          "status": { "type": "string", "enum": ["paid_delivered", "paid_not_delivered", "not_paid"] },
          "paid_at": { "type": "string" }
        }
      }
    },
    {
      "name": "create_redelivery",
      "description": "为支付成功但发货失败的订单创建补发工单",
      "parameters": {
        "type": "object",
        "properties": {
          "order_id": { "type": "string", "description": "需要补发的订单 ID" },
          "priority": { "type": "string", "enum": ["normal", "high", "urgent"], "description": "工单优先级，VIP 用户默认 high" }
        },
        "required": ["order_id"]
      }
    },
    {
      "name": "transfer",
      "description": "将当前会话转接给指定团队或人员",
      "parameters": {
        "type": "object",
        "properties": {
          "target": { "type": "string", "description": "转接目标", "examples": ["@vip_escalation_team", "@supervisor"] },
          "reason": { "type": "string", "description": "转接原因" }
        },
        "required": ["target", "reason"]
      }
    },
    {
      "name": "tag_conversation",
      "description": "给当前会话添加标签",
      "parameters": {
        "type": "object",
        "properties": {
          "tags": { "type": "array", "items": { "type": "string" }, "description": "标签列表" }
        },
        "required": ["tags"]
      }
    }
  ],

  "knowledge_refs": [
    {
      "id": "kb-001",
      "title": "充值到账时间说明",
      "query": "充值到账时间 延迟 异常",
      "why": "用于告知用户正常到账时间和异常判断标准"
    },
    {
      "id": "kb-002",
      "title": "VIP 补偿政策",
      "query": "VIP 充值补偿 优先级",
      "why": "用于确定不同 VIP 等级的补偿方案和处理优先级"
    },
    {
      "id": "kb-003",
      "title": "支付渠道与订单格式",
      "query": "支付渠道 订单号格式",
      "why": "用于帮助用户定位订单信息和确认支付方式"
    }
  ],

  "examples": [
    {
      "input": "我充了648但是钻石没到账，都过了一个小时了",
      "context": "VIP4 用户，R等级 11，情绪激动",
      "output": "非常抱歉让您遇到这个问题！我立即为您查询订单状态。",
      "tool_calls": [
        { "name": "query_order", "arguments": { "user_id": "G25G55GXO", "time_range_hours": 2 } }
      ],
      "follow_up": "查询到订单支付成功但未发货 → 调用 create_redelivery → 告知预计 10 分钟到账",
      "source_ticket": 12345
    }
  ],

  "guardrails": [
    "未确认订单状态前，不要承诺补发或退款",
    "金额 >= 1000 的补发必须转接 @vip_escalation_team，不可自行处理",
    "不要向用户透露内部系统名称或工单编号",
    "不要编造订单状态，必须通过 query_order 工具查询"
  ],

  "metadata": {
    "quality": 0.87,
    "confidence": 0.92,
    "usage_count": 156,
    "success_rate": 0.78,
    "source_ticket_ids": [12345, 12389, 12456],
    "created_at": "2026-03-15T10:00:00Z",
    "updated_at": "2026-03-27T15:30:00Z",
    "created_by": "system",
    "reviewed_by": "admin_001"
  }
}
```

### 六层说明

| 层 | 标准对应 | 解决的问题 | 说明 |
|---|---|---|---|
| **trigger** | Intent routing | 何时激活 | 场景意图 + 关键词 + 用户条件 + 适用游戏（`app_codes`）过滤，匹配时激活 Skill |
| **instructions** | System prompt | 怎么处理 | Agent 的执行指令：目标、语气、步骤流程、处理原则 |
| **tools** | Function calling schema | 能做什么 | 标准 tool 定义（name + description + parameters + returns），Agent 按需调用，自动执行 |
| **knowledge_refs** | Context injection | 优先知道什么 | 引用 Knowledge 条目作为精准优先知识，与 RAG 检索结果去重合并 |
| **examples** | Few-shot examples | 参考怎么做 | 输入 → 输出 → tool_calls 的完整示例，含真实 ticket 来源 |
| **guardrails** | Safety constraints | 不能做什么 | 边界约束，防止 Agent 越权操作或输出不当内容 |

### knowledge_refs 的作用

`knowledge_refs` **不替代 RAG 检索**，而是提供精准优先知识。RAG 始终运行，两者结果去重合并后注入 Agent。

每条 ref 支持两种加载模式：

| 模式 | 字段 | 说明 |
|---|---|---|
| 静态引用 | `id` | 直接绑定特定知识条目 ID，Skill 激活时直接加载该条目最新内容 |
| 动态检索 | `query` | 用预设 query 去 Knowledge 检索 Top-1，适用于知识可能更新或条目 ID 不确定的场景 |

- `why` 字段告诉 Agent 和审核者"为什么这个 Skill 需要这条知识"，提升可解释性
- `knowledge_refs` 加载的结果会被标记为「Skill 引用」，与 RAG 结果去重后一起注入 Agent
- 即使 `knowledge_refs` 为空或引用有误，RAG 检索仍然能兜底提供相关知识

---

## 渐进式加载

Skill 不是一次性全部塞进 Agent context，而是按需分层加载：

```
          ┌─────────────────────────────────────────┐
          │  Knowledge RAG 检索（始终并行执行）        │
          └──────────────────────────┬──────────────┘
                                     │
Step 1: 场景匹配（轻量）              │
  │  只用 trigger 层做初筛            │
  │  intent 语义匹配 + keywords       │
  │  + conditions 过滤                │
  │  返回候选 Skill 列表              │
  │                                   │
  ▼                                   │
Step 2: 激活 Skill（核心加载）         │
  │  加载 instructions + tools         │
  │  + guardrails                      │
  │  加载 knowledge_refs              │
  │  tools 注册为可调用函数            │
  │                                   │
  ▼                                   ▼
Step 3: 知识合并
  │  knowledge_refs 结果（精准优先）
  │  + RAG 检索结果（补充兜底）
  │  → 去重合并后注入 Agent context
  │
  ▼
Step 4: 加载 examples（可选）
  │  简单问题不需要 few-shot
  │  复杂/低置信度场景追加 examples
```

**关键设计**：
- Knowledge RAG 与 Skill 匹配**并行执行**，不等 Skill 匹配结果
- 即使 Skill 未命中或 `knowledge_refs` 不完整，RAG 结果仍能保障知识覆盖
- `knowledge_refs` 提供的知识优先级高于 RAG，去重后合并注入

---

## Skill 生命周期

```
   Chat 方式创建             AI 从对话学习
        │                      │
        ▼                      ▼
    ┌────────┐           ┌────────┐
    │ draft  │           │ draft  │
    └───┬────┘           └───┬────┘
        │                    │
        ▼                    ▼
    ┌──────────────────────────────────┐
    │           人工审核                │
    │  • 审核 instructions 准确性       │
    │  • 审核 tools 权限是否合理         │
    │  • 审核 knowledge_refs 引用正确性  │
    │  • 审核 guardrails 完整性         │
    └─────────┬────────────────────────┘
              │
              ▼
    ┌──────────────────────────┐
    │       沙盒测试            │
    │  • 用历史对话模拟匹配     │
    │  • 验证 tool call 正确性  │
    │  • 验证引用知识是否加载    │
    │  • 检查回复质量           │
    └─────────┬────────────────┘
              │
              ▼
        ┌────────┐
        │ active │ ◄─── 正式上线，可被 Agent 匹配激活
        └───┬────┘
            │
            ├── 增量进化（新对话学习 → 新版本 draft → 审核 → 测试）
            │
            ├── 手动编辑（Chat 方式）→ 新版本 → 审核
            │
            └── 版本回退（回退到任意历史版本）
```

### 版本管理与回退

```json
{
  "skill_id": "skill-xxxx",
  "versions": [
    {
      "version": 1,
      "status": "archived",
      "change_type": "created",
      "change_note": "从 ticket#12345 学习创建",
      "created_at": "2026-03-15T10:00:00Z",
      "reviewed_by": "admin_001",
      "snapshot": { "..." }
    },
    {
      "version": 2,
      "status": "archived",
      "change_type": "evolved",
      "change_note": "ticket#12456 学习，新增处理路径：联系支付渠道",
      "created_at": "2026-03-20T14:00:00Z",
      "reviewed_by": "admin_001",
      "snapshot": { "..." }
    },
    {
      "version": 3,
      "status": "active",
      "change_type": "manual_edit",
      "change_note": "增加 knowledge_ref: VIP 补偿政策",
      "created_at": "2026-03-27T15:30:00Z",
      "reviewed_by": "admin_002",
      "snapshot": { "..." }
    }
  ]
}
```

**版本回退流程**：
1. 在 Skill 管理面板点击「回退版本」
2. 弹出历史版本列表，展示每个版本的变更说明、审核人、日期
3. 选择目标历史版本（如 v2）并确认
4. 系统**不会直接覆盖**当前 active 版本，而是基于 v2 的 snapshot 生成一个**全新的 Draft 版本**（如 v4）
5. 新的 Draft 版本需经过常规的「审核 → 测试 → 上线」流程才能成为 active 版本，保证线上安全。

### 单条 Skill 测试（沙盒测试）

审核通过前，支持对单条 Skill 进行沙盒测试。在 Skill 管理页面点击「测试」按钮，输入模拟玩家消息、选择用户类型（如 VIP/普通）和适用游戏，系统将运行测试并展示 4 项结果：

| 测试维度 | 验证内容 | 结果展示 |
|---|---|---|
| **匹配测试** | Skill 是否被正确匹配激活 | intent 匹配度（带进度条/百分比）、keywords 命中情况 |
| **回复测试** | Agent 的回复质量是否符合 instructions | 模拟回复文本、语气符合度评分、步骤遵循情况检查 |
| **Tool Call 测试** | Agent 是否在正确时机调用了正确的 tool | 调用的 tool 名称和参数 JSON、调用时机是否正确 |
| **约束检查** | Agent 是否遵守了 guardrails | 逐条打钩验证（如：✓ 未在查询前承诺补发） |

此外，还支持批量的**回归测试**：用该 Skill 历史匹配过的 ticket 样本跑自动化测试，确保新版本仍能正确处理历史案例，防止能力退化。

---

## Agent 集成

### Payload 注入

激活 Skill 后，instructions 注入 Agent system prompt，tools 注册为可调用函数。知识来自两个来源：`knowledge_refs` 精准引用 + RAG 检索补充，去重合并后注入：

```json
{
  "messages": ["..."],

  "activated_skills": [
    {
      "skill_id": "skill-xxxx",
      "name": "VIP 充值未到账处理",
      "instructions": {
        "goal": "快速定位充值未到账原因并解决",
        "tone": "共情、专业、高优先级",
        "steps": ["..."],
        "principles": ["..."]
      },
      "guardrails": ["..."]
    }
  ],

  "knowledge": [
    {
      "title": "充值到账时间说明",
      "content": "常规充值 5 分钟内到账；高峰期可能延迟至 30 分钟；超过 1 小时未到账视为异常。",
      "source": "skill_ref",
      "why": "用于告知用户正常到账时间和异常判断标准"
    },
    {
      "title": "VIP 补偿政策",
      "content": "VIP4+ 用户充值问题优先处理，补发工单自动标记为 high priority。单笔 ≥1000 需转 VIP 专属组。",
      "source": "skill_ref",
      "why": "用于确定补偿方案和优先级"
    },
    {
      "title": "支付渠道与订单格式",
      "content": "支持 Apple Pay、Google Pay、信用卡、PayPal，订单号前缀 ORD-。",
      "source": "skill_ref",
      "why": "用于帮助用户定位订单信息"
    },
    {
      "title": "充值异常处理时效要求",
      "content": "普通用户 48h 内处理，VIP 用户 2h 内处理。超时未处理自动升级。",
      "source": "rag",
      "relevance": 0.85
    }
  ],

  "tools": [
    {
      "type": "function",
      "function": {
        "name": "query_order",
        "description": "根据用户 ID 查询最近的充值订单状态",
        "parameters": {
          "type": "object",
          "properties": {
            "user_id": { "type": "string", "description": "用户的 G123 ID" },
            "time_range_hours": { "type": "integer", "default": 24 }
          },
          "required": ["user_id"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "create_redelivery",
        "description": "为支付成功但发货失败的订单创建补发工单",
        "parameters": {
          "type": "object",
          "properties": {
            "order_id": { "type": "string" },
            "priority": { "type": "string", "enum": ["normal", "high", "urgent"] }
          },
          "required": ["order_id"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "transfer",
        "description": "将当前会话转接给指定团队或人员",
        "parameters": {
          "type": "object",
          "properties": {
            "target": { "type": "string" },
            "reason": { "type": "string" }
          },
          "required": ["target", "reason"]
        }
      }
    }
  ]
}
```

注意 `knowledge` 数组中每条知识带有 `source` 字段：
- `"skill_ref"`：来自 Skill 的 `knowledge_refs` 精准引用，附带 `why` 说明
- `"rag"`：来自 Knowledge RAG 检索补充，附带 `relevance` 分数

### Agent System Prompt 注入

```
## 当前激活 Skill：VIP 充值未到账处理

### 目标
快速定位充值未到账原因并解决，优先保障 VIP 用户体验

### 参考知识（Skill 引用）
- **充值到账时间说明**：常规 5 分钟内到账；高峰期可能延迟至 30 分钟；超过 1 小时视为异常
- **VIP 补偿政策**：VIP4+ 优先处理，补发工单自动 high priority，单笔 ≥1000 需转 VIP 专属组
- **支付渠道**：支持 Apple Pay、Google Pay、信用卡、PayPal，订单号前缀 ORD-

### 补充知识（RAG 检索）
- **充值异常处理时效要求**：普通用户 48h 内处理，VIP 用户 2h 内处理，超时未处理自动升级

### 处理步骤
1. 安抚情绪，表达重视
2. 调用 query_order 主动查询订单状态（VIP 不要让用户提供信息）
3. 根据订单状态选择处理路径：
   - paid_delivered → 引导重启游戏刷新
   - paid_not_delivered → 调用 create_redelivery 补发
   - not_paid → 引导确认扣款记录
   - 72h 内重复反馈 → 调用 transfer 升级主管
4. 给出明确处理时间预期
5. 确认用户问题已解决

### 原则
- 先给方案再解释原因
- VIP 用户主动从系统拉取信息
- 明确告知处理时间预期

### 约束
- 未确认订单状态前，不要承诺补发或退款
- 金额 >= 1000 的补发必须转接 @vip_escalation_team
- 不要向用户透露内部系统名称
- 不要编造订单状态，必须通过 query_order 查询
```

### Tool Call 执行流

Tool call 自动执行，客服观察结果：

```
Agent 生成回复 + tool_call
  │
  ├─ 纯文本回复 → 直接展示
  │
  └─ 包含 tool_call → 自动执行
       │
       ▼
  ┌─────────────────────────────────────┐
  │  🔧 query_order                     │
  │  参数：user_id="G25G55GXO"          │
  │  状态：✓ 已执行                      │
  ├─────────────────────────────────────┤
  │  ✓ 返回结果                          │
  │  order_id: "ORD-20240702-12345"     │
  │  status: "paid_not_delivered"       │
  └─────────────────────────────────────┘
       │
       ▼
  Agent 根据 tool 返回结果继续生成回复
  （客服全程可见 tool 调用和结果，但不需要手动确认）
```

---

## 与原方案及主流模式的对比

| 维度 | 原方案二 | 主流 Agent Skill | 本方案（v2） |
|---|---|---|---|
| Skill 本质 | 结构化知识注入 | Tool / Function | instructions + tools + knowledge_refs + guardrails |
| 知识集成 | knowledge 和 Skill 独立 | 无标准 | RAG 始终运行 + Skill `knowledge_refs` 精准优先，去重合并 |
| 行为指导 | knowledge + response_guide 混合 | system prompt | instructions（独立结构化字段） |
| 工具能力 | 无 | function calling | tools（标准 function schema），自动执行 |
| 安全约束 | 无 | 依赖 system prompt | guardrails（独立字段，可审核） |
| 加载方式 | 整体注入 context | 按需注册 tools | 渐进式（trigger → instructions + tools + knowledge_refs → examples） |
| 版本管理 | version +1 | 无标准 | 完整版本链 + snapshot + 回退 |
| 测试能力 | 无 | 无标准 | 沙盒测试（匹配 / 回复 / tool call / 回归） |
| Tool 执行 | 无 | Agent 自主执行 | 自动执行，客服可见结果 |
| Skill 创建 | 无 | 无标准 | Chat 方式创建/编辑 + AI 自动学习 |

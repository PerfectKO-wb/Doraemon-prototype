变更记录：

| 时间  | 内容  | 负责人 |     |
|-----|-----|-----|-----|
|     |     |     |     |

# 背景

PAP模式岗位通用模式，给未定制的岗位展示默认管理逻辑，承接A系统任务管理机制

提供任务督促

# 目标

* 给出 A 票完成建议
* 提醒用户按时完成任务

# 需求

## 原型

<https://prototype-henna-kappa.vercel.app/pap?role=pdm&user=u5>

## 触发规则（优先级自上而下，只命中一个主 Case）

| Case | 判定  | 备注  |
|------|-----|-----|
| **Case 2 · Doing 超 DDL** | `now > ddl_doing`（以 23:59:59 为界） | 最高优先级 |
| **Case 1 · 时间烧掉 4/5** | `(now - startedAt) / (ddl - startedAt) >= 0.8` 且未逾期 | 仅当 `startedAt` 有值 |
| **Case 3 · To do 超 DDL** | Doing 正常，但存在 `now > ddl_pending` 的 To do 任务 | 用 banner 叠加 |
| **Normal** | 以上都不命中 | 常规节奏提示 |


## 反馈输出

AI 按 prompt 拼装输出（流式）

### 示例输出（`output_language = "Simplified Chinese"`）

**Case 1 · 时间烧掉 4/5** Input: `case='burndown'`, `doing={title:'Q2 Launch Plan 评审', daysUntilDdl:1, elapsedRatio:0.82, suggestions:['砍掉 roadmap 附录，只保留里程碑','用上周结论直接出一版决策文档','今晚 20:00 前发评审群预热']}`

> 「Q2 Launch Plan 评审」已消耗 82% 的计划时间，只剩 1 day，不够再迭代一轮了。按下面顺序收口：
>
> 
> 1. 砍掉 roadmap 附录，只保留里程碑
> 2. 用上周结论直接出一版决策文档
> 3. 今晚 20:00 前发评审群预热 做完后点右边的 ➤ 把 output 抓紧交我，自动接下一个任务。

**Case 2 · Doing 超 DDL** Input: `case='overdue'`, `doing={title:'Creator Console 需求澄清', daysUntilDdl:-2, suggestions:['先把已定稿的 3 个模块发出，剩余标 TBD','拉 15 分钟 sync 逐条关掉 open question','今晚同步到 Jira，避免下游再等']}`

> ❗「Creator Console 需求澄清」已逾期 2 day —— 评审窗口随时会被取消，立刻把当前 output 先交出来止血，哪怕 80% 版本也先给我；剩下两条动作并行收口：
>
> 
> 1. 先把已定稿的 3 个模块发出，剩余标 TBD
> 2. 拉 15 分钟 sync 逐条关掉 open question
> 3. 今晚同步到 Jira，避免下游再等 做完后点右边的 ➤ 把 output 抓紧交我，自动接下一个任务。

**Case 3 · To do 超 DDL（叠加在 Normal 上）** Input: `case='pending-overdue'`, `overduePendingCount=2`, `topOverduePending={title:'Payment SDK 对接反馈', overdueDays:3}`, `doing={title:'Season Pass 文档', daysUntilDdl:3, suggestions:['先出目录 + 核心章节骨架','关键截图今天内敲定','预留半天给 legal review']}`

> ⚠ To do 里已有 2 项逾期（最紧：「Payment SDK 对接反馈」逾期 3 day）。腾出手就先清这批。 离 DDL 还有 3 day，节奏稳。建议按下面顺序推进，避免 last-day 堆积：
>
> 
> 1. 先出目录 + 核心章节骨架
> 2. 关键截图今天内敲定
> 3. 预留半天给 legal review 做完后点右边的 ➤ 把 output 抓紧交我，自动接下一个任务。

### System Prompt 示例

注入变量：

```
Output language: {{output_language}}
Input trigger & data: {{input_json}}
```

Prompt：

```
You are an on-call task coach embedded in a task console. Write ONE short
message (~120–220 chars) that nudges the user to land the current task
on time.

Output language: {{output_language}}
Input trigger & data: {{input_json}}

Keep English nouns: DDL, Doing, To do, day.

Rules:
1. Tone — direct, concrete, no filler openings, no emoji except the
   single allowed 🎉 in the "nothing left" case.
2. Output these 4 sections in order, skip a section if its data is
   missing; never invent content not in input:

   · Banner — only when input.overduePendingCount > 0. Template:
     "⚠ To do has {overduePendingCount} overdue items (most urgent:
      「{topOverduePending.title}」 overdue {topOverduePending.overdueDays} day).
      Clear them first when you get a gap."

   · Lead — ONE sentence matching input.case:
     - case2-overdue     → 「{doing.title}」 is overdue by
                           {abs(doing.daysUntilDdl)} day; ship current
                           output immediately, even an 80% cut.
     - case1-burndown    → 「{doing.title}」 has burned
                           {round(doing.elapsedRatio*100)}% of its budget
                           with little runway left — lock scope now.
     - normal            → acknowledge remaining time
                           ({doing.daysUntilDdl} day) and set a calm path.
     - no doing,
       has nextPending   → propose starting 「{nextPending.title}」 next.
     - nothing left      → "All tasks done today 🎉" (skip Bullets & Tail).

   · Bullets — number the first 3 items of doing.suggestions as
     "1. … / 2. … / 3. …". Skip if empty.

   · Tail — close with: "Done? Tap ➤ to submit output; next task auto-starts."

3. Never mention case id, ratio, or any meta. Speak directly to the user.
4. Never restate the DDL date — the UI already shows it.
5. Translate ALL templates above into {{output_language}} before emitting;
   keep placeholder values (titles, numbers) verbatim.
```



# Tech Table Mock Data - AI 消息生成测试用

> 本文档用于测试 AI System Prompt 在不同场景下的消息生成效果。数据覆盖了 PRD 附录中的全部测试场景组合。

---

## 一、正式数据

### F-1

```json
{
  "issue_type": "suggestion",
  "system_name": "D",
  "language": "zh-TW",
  "issue_details": "用戶反映 D 系統（https://d.g123.jp/）目前缺少中文版本介面選項，提出希望系統能增加中文介面功能。",
  "new_status": "completed",
  "expected_golive_date": "2025/10/25",
  "solution": "产品反馈已在排期中，第一期会支持简中、繁中、英语、日语四种语言，允许用户自主切换"
}
```

### F-2

```json
{
  "issue_type": "suggestion",
  "system_name": "D",
  "language": "zh-TW",
  "issue_details": "1. D系統翻譯工具目前表格內容被鎖定，無法用滑鼠選中複製原文、文本key及其他欄位內容，影響作業效率。需求為整個介面都需支持滑鼠選中複製功能，不再限制內容複製。\n2. D系統翻譯工具在翻譯界面無法直接新增字典，目前只能切換到dictionary表格頁面操作，流程繁瑣。建議參考上一版設計，在翻譯介面可直接選中原文並輸入對應字典內容完成添加。",
  "new_status": "completed",
  "expected_golive_date": "",
  "solution": "2个需求都已经实现"
}
```

### F-3

```json
{
  "issue_type": "suggestion",
  "system_name": "D",
  "language": "zh-TW",
  "issue_details": "用戶建議在 i18n text table 中增加篩選條件保存功能，讓使用者可以保存常用的篩選條件組合（如 app_id、語言、Source Update 等），下次進入時可直接點擊已儲存的條件快速切換到對應遊戲和篩選狀態，無需每次重新輸入。此需求參考 A 系統現有設計，適用於每日多次切換不同遊戲場景。",
  "new_status": "completed",
  "expected_golive_date": "",
  "solution": "wb 优化需求：支持保存自定义筛选条件"
}
```

---

## 二、Mock 数据

### 1. Bug + in-progress

**测试规则 7**（仅 in-progress 且有 golive_date 时展示日期）、**规则 8**（bug + 非 reject 不展示 solution）

#### 1.1 golive_date 有值，solution 为空

```json
{
  "issue_type": "bug",
  "system_name": "D",
  "language": "en",
  "issue_details": "在移动端浏览器中，D 系统的对话气泡宽度溢出屏幕，导致部分文字被截断无法阅读",
  "new_status": "in-progress",
  "expected_golive_date": "2026-03-12",
  "solution": ""
}
```

#### 1.2 golive_date 为空，solution 有值

```json
{
  "issue_type": "bug",
  "system_name": "D",
  "language": "zh",
  "issue_details": "上传图片后图片显示为空白，刷新页面后恢复正常，复现率约 30%",
  "new_status": "in-progress",
  "expected_golive_date": "",
  "solution": "已确认为前端图片懒加载组件的缓存失效问题，正在修复"
}
```

#### 1.3 golive_date 为空，solution 为空

```json
{
  "issue_type": "bug",
  "system_name": "D",
  "language": "ja",
  "issue_details": "在 D 系统中发送长文本回复时，发送按钮变为不可点击状态，需要等待 10 秒以上才恢复",
  "new_status": "in-progress",
  "expected_golive_date": "",
  "solution": ""
}
```

#### 1.4 golive_date 和 solution 都有值

```json
{
  "issue_type": "bug",
  "system_name": "D",
  "language": "ko",
  "issue_details": "在 D 系统翻译表格的 All Language 视图下，切换语言筛选后表格数据不刷新，仍显示上一语言的翻译内容",
  "new_status": "in-progress",
  "expected_golive_date": "2026-03-20",
  "solution": "初步定位为视图切换时的筛选参数未正确传递给后端查询接口，前端组件需配合修改"
}
```

---

### 2. Bug + completed

**测试规则 8**（bug + 非 reject → 不展示 solution，无论 solution 是否有值）

#### 2.1 golive_date 有值，solution 为空

```json
{
  "issue_type": "bug",
  "system_name": "D",
  "language": "ko",
  "issue_details": "用户在 D 系统会话中发送中文标点符号（如「」、——）时，AI 回复出现乱码",
  "new_status": "completed",
  "expected_golive_date": "2026-03-10",
  "solution": ""
}
```

#### 2.2 golive_date 为空，solution 有值

```json
{
  "issue_type": "bug",
  "system_name": "D",
  "language": "en",
  "issue_details": "D 系统筛选列表中，处理完会话后状态变为 close，但该会话仍残留在 Waiting 列表中未被移除",
  "new_status": "completed",
  "expected_golive_date": "",
  "solution": "修复了状态变更后的列表刷新逻辑，处理完成后自动刷新列表并移除已关闭会话"
}
```

#### 2.3 golive_date 为空，solution 为空

```json
{
  "issue_type": "bug",
  "system_name": "D",
  "language": "ja",
  "issue_details": "夜间时段（UTC+8 23:00-06:00），D 系统偶尔无响应，用户发送消息后无任何回复",
  "new_status": "completed",
  "expected_golive_date": "",
  "solution": ""
}
```

#### 2.4 golive_date 和 solution 都有值

```json
{
  "issue_type": "bug",
  "system_name": "D",
  "language": "zh",
  "issue_details": "D 系统导出 Excel 时，多语言列的排序与页面显示顺序不一致",
  "new_status": "completed",
  "expected_golive_date": "2026-03-14",
  "solution": "导出逻辑改为复用前端视图的排序参数，确保导出顺序与页面一致"
}
```

---

### 3. Bug + reject

**测试规则 9**（reject → solution 作为拒绝原因，措辞委婉）

#### 3.1 golive_date 有值，solution 为空

```json
{
  "issue_type": "bug",
  "system_name": "D",
  "language": "zh",
  "issue_details": "用户希望在 D 系统对话界面增加字体大小调节功能",
  "new_status": "reject",
  "expected_golive_date": "2026-03-15",
  "solution": ""
}
```

#### 3.2 golive_date 为空，solution 有值

```json
{
  "issue_type": "bug",
  "system_name": "D",
  "language": "ja",
  "issue_details": "D 系统回复速度在周五下午明显变慢，平均响应时间超过 15 秒",
  "new_status": "reject",
  "expected_golive_date": "",
  "solution": "经排查，周五下午响应变慢主要由公司网络出口带宽限制导致，非 D 系统本身问题，已提交工单给 IT 部门协调网络资源"
}
```

#### 3.3 golive_date 为空，solution 为空

```json
{
  "issue_type": "bug",
  "system_name": "D",
  "language": "ko",
  "issue_details": "D 系统页面在 Safari 浏览器中滚动不流畅",
  "new_status": "reject",
  "expected_golive_date": "",
  "solution": ""
}
```

#### 3.4 golive_date 和 solution 都有值

```json
{
  "issue_type": "bug",
  "system_name": "D",
  "language": "en",
  "issue_details": "希望 D 系统翻译表格支持批量删除选中行",
  "new_status": "reject",
  "expected_golive_date": "2026-03-20",
  "solution": "系统原生已支持多选删除功能，可通过按住 Shift/Cmd 点击行首复选框进行多选，再使用工具栏的删除按钮批量操作，当前版本无需额外开发"
}
```

---

### 4. Suggestion + in-progress

**测试规则 7**（有 golive_date 时展示日期）、suggestion 无规则 8 限制（可展示 solution）

#### 4.1 golive_date 有值，solution 为空

```json
{
  "issue_type": "suggestion",
  "system_name": "D",
  "language": "ja",
  "issue_details": "建议在 D 系统中增加快捷指令功能，用户输入 \"/\" 可以快速选择常用操作",
  "new_status": "in-progress",
  "expected_golive_date": "2026-03-25",
  "solution": ""
}
```

#### 4.2 golive_date 为空，solution 有值

```json
{
  "issue_type": "suggestion",
  "system_name": "D",
  "language": "ko",
  "issue_details": "建议在 D 系统中增加翻译进度看板，展示每种语言的翻译完成率",
  "new_status": "in-progress",
  "expected_golive_date": "",
  "solution": "计划基于现有统计聚合能力实现，初步设计为在每张表顶部增加进度条组件，统计已填写 vs 未填写字段比例"
}
```

#### 4.3 golive_date 为空，solution 为空

```json
{
  "issue_type": "suggestion",
  "system_name": "D",
  "language": "en",
  "issue_details": "希望 D 系统支持语音消息输入功能",
  "new_status": "in-progress",
  "expected_golive_date": "",
  "solution": ""
}
```

#### 4.4 golive_date 和 solution 都有值

```json
{
  "issue_type": "suggestion",
  "system_name": "D",
  "language": "zh",
  "issue_details": "建议在 D 系统咨询会话中增加消息搜索功能，方便专家快速查找历史对话内容",
  "new_status": "in-progress",
  "expected_golive_date": "2026-04-01",
  "solution": "目前计划在会话顶部增加搜索栏，支持按关键词检索历史消息，搜索范围覆盖用户和专家的所有消息"
}
```

---

### 5. Suggestion + completed

**测试 suggestion + completed 场景，solution 可以正常展示**

#### 5.1 golive_date 有值，solution 为空

```json
{
  "issue_type": "suggestion",
  "system_name": "D",
  "language": "en",
  "issue_details": "建议在 D 系统首次回复时增加欢迎语，引导新用户了解系统的功能",
  "new_status": "completed",
  "expected_golive_date": "2026-03-08",
  "solution": ""
}
```

#### 5.2 golive_date 为空，solution 有值

```json
{
  "issue_type": "suggestion",
  "system_name": "D",
  "language": "zh",
  "issue_details": "建议在 D 系统图片管理模块中增加图片预览功能，点击缩略图可以查看大图",
  "new_status": "completed",
  "expected_golive_date": "",
  "solution": "已在图片字段列增加了点击预览能力，支持放大、缩小和全屏查看，同时支持左右切换同一记录中的多张图片"
}
```

#### 5.3 golive_date 为空，solution 为空

```json
{
  "issue_type": "suggestion",
  "system_name": "D",
  "language": "ko",
  "issue_details": "建议 D 系统的回复支持 Markdown 格式渲染，方便展示代码片段和列表",
  "new_status": "completed",
  "expected_golive_date": "",
  "solution": ""
}
```

#### 5.4 golive_date 和 solution 都有值

```json
{
  "issue_type": "suggestion",
  "system_name": "D",
  "language": "ja",
  "issue_details": "建议为 D 系统会话增加标签/分类功能，专家可以给会话打标签方便管理",
  "new_status": "completed",
  "expected_golive_date": "2026-03-12",
  "solution": "已实现会话标签功能，支持预设标签和自定义标签，可在会话列表和会话详情中查看和管理标签"
}
```

---

### 6. Suggestion + reject

**测试规则 9**（reject → solution 作为拒绝原因，措辞委婉）

#### 6.1 golive_date 有值，solution 为空

```json
{
  "issue_type": "suggestion",
  "system_name": "D",
  "language": "ko",
  "issue_details": "建议将 D 系统的对话记录同步导出为 PDF 报告",
  "new_status": "reject",
  "expected_golive_date": "2026-03-18",
  "solution": ""
}
```

#### 6.2 golive_date 为空，solution 有值

```json
{
  "issue_type": "suggestion",
  "system_name": "D",
  "language": "en",
  "issue_details": "建议 D 系统自动检测翻译质量，对翻译异常的内容进行高亮提示",
  "new_status": "reject",
  "expected_golive_date": "",
  "solution": "自动翻译质量检测需要集成专业翻译评估模型，当前系统架构暂不支持接入，该需求已记录到产品长期规划中，待基础架构升级后评估可行性"
}
```

#### 6.3 golive_date 为空，solution 为空

```json
{
  "issue_type": "suggestion",
  "system_name": "D",
  "language": "zh",
  "issue_details": "建议将 D 系统咨询会话从即时通讯模式改为工单系统模式",
  "new_status": "reject",
  "expected_golive_date": "",
  "solution": ""
}
```

#### 6.4 golive_date 和 solution 都有值

```json
{
  "issue_type": "suggestion",
  "system_name": "D",
  "language": "ja",
  "issue_details": "建议 D 系统支持多轮任务执行，例如用户说\"帮我创建 3 个翻译任务\"，系统可以一次性完成多个操作",
  "new_status": "reject",
  "expected_golive_date": "2026-04-15",
  "solution": "多轮任务编排能力需要底层架构重构，涉及对话状态管理、任务队列和错误回滚等多个模块。当前产品阶段优先聚焦单任务场景的稳定性，多任务编排列入 Q3 技术规划"
}
```

---

## 测试要点速查

### Prompt 规则验证矩阵

| 规则 | 验证目标 | 对应数据 |
|------|---------|---------|
| **规则 1**: 使用用户语言回复 | en → 英文回复；zh → 简中；ja → 日文；ko → 韩文；zh-TW → 繁中 | 全部数据 |
| **规则 7**: 仅 in-progress + 有 golive_date 时展示日期 | 1.4、4.4 应展示日期；1.3、4.3 不应展示；2.x、3.x、5.x、6.x 全部不应展示 | 1.1~1.4, 4.1~4.4 |
| **规则 8**: bug + 非 reject 不展示 solution | 2.2、2.4 的 solution 虽有值但不应出现在消息中 | 2.1~2.4 |
| **规则 9**: reject 用 solution 做拒绝原因，措辞委婉 | 3.2、3.4、6.2、6.4 应以委婉方式引用 solution | 3.1~3.4, 6.1~6.4 |
| **规则 6**: 字段为空时直接省略，不提缺失 | 1.3、2.3、3.3、4.3、5.3、6.3 多字段为空 | 1.3, 2.3, 3.3, 4.3, 5.3, 6.3 |
| **正式数据验证** | F-1 expected_golive_date 不展示（completed）；F-2/F-3 solution 能否自然表达 | F-1, F-2, F-3 |

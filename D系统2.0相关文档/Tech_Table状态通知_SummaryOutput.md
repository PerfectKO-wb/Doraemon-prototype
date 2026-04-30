# Tech Table 状态通知 Summary Output

## F-1

問題追蹤狀態更新：針對你提出 D 系統缺少中文介面選項的建議，我們已完成評估並將多語言介面能力納入產品規劃。後續版本將提供簡體中文、繁體中文、英文和日文四種介面語言，支援使用者在介面中自行切換。

## F-2

問題追蹤狀態更新：關於翻譯工具中表格內容無法滑鼠選中複製，以及無法在翻譯介面直接新增字典這兩點需求，相關優化已經完成。現在整個介面支援對原文、文本 key 等欄位進行滑鼠選取與複製，同時也可以在翻譯介面中直接選中原文並新增對應字典條目。

## F-3

問題追蹤狀態更新：針對在 i18n text table 中增加篩選條件保存功能的建議，功能已經實現。使用者可以保存常用的篩選條件組合，例如 app_id、語言及 Source Update 等，以便下次直接切換到對應遊戲與篩選狀態。

## 1.1

Issue status update: we have confirmed the display issue where chat bubbles in the D system’s mobile view can overflow the screen and cut off text. This bug is currently being handled, and we are adjusting the layout so that message bubbles correctly adapt to the available screen width. The fix is planned to be released around 2026-03-12.

## 1.2

问题跟踪状态更新：关于在移动端上传图片后偶发出现图片显示为空白的问题，我们已经确认该缺陷并将其纳入处理中。当前正在优化相关展示与缓存逻辑，以提升图片上传后的稳定性。

## 1.3

問題対応状況のご連絡です。D システムで長文の返信を送信した際に送信ボタンが一定時間押下できなくなる事象を確認しています。現在、この挙動の原因調査と改善対応を進めており、長文でも送信操作が滞りなく行えるよう調整中です。

## 1.4

문제 진행 현황 안내드립니다. D 시스템 번역 테이블의 All Language 뷰에서 언어 필터를 변경해도 데이터가 갱신되지 않는 현상을 확인했습니다. 현재 원인 분석과 수정 작업을 진행 중이며, 언어 전환 시 해당 언어의 번역 내용이 정상적으로 표시되도록 개선하고 있습니다. 이 수정 사항은 2026-03-20 전후 배포를 목표로 하고 있습니다.

## 2.1

문제 처리 결과 안내드립니다. D 시스템에서 중국어 문장부호 사용 시 AI 답변이 깨져 보이던 현상에 대한 수정이 완료되었습니다. 최신 버전에서는 해당 문장부호를 포함한 메시지도 정상적으로 표시되도록 반영되어 있습니다。

## 2.2

Issue status update: the problem where conversations remained in the Waiting list even after their status changed to close has been fixed. In the current version of the D system, handled and closed conversations are now removed from the Waiting list according to their updated status.

## 2.3

問題対応状況のご連絡です。夜間帯（UTC+8 23:00〜06:00）に D システムが無応答になる事象について、調査および対応を行い、安定性を改善するための調整を適用しました。現在は同時間帯における応答状況が従来より安定するよう設定されています。

## 2.4

问题跟踪状态更新：关于 D 系统导出 Excel 时多语言列排序与页面显示顺序不一致的问题，我们已经完成修复。现在导出的 Excel 会复用前端视图的排序参数，确保导出结果与页面展示顺序保持一致。

## 3.1

问题跟踪状态更新：关于在 D 系统对话界面增加字体大小调节功能的需求，我们已经完成评估。该项能力当前暂不处理，后续会在整体体验规划中继续关注相关方向。

## 3.2

問題対応状況のご連絡です。金曜日の午後に D システムの返信速度が大きく低下する件について調査した結果、主な要因は社内ネットワーク出口帯域の制約によるものであり、D システム本体の不具合ではないことが判明しました。現時点ではシステム側での個別改修は行わず、ネットワーク環境の改善を別途進める方針としています。

## 3.3

문제 진행 현황 안내드립니다. Safari 브라우저에서 D 시스템 페이지 스크롤이 매끄럽지 않은 현상에 대해 검토를 진행했습니다. 여러 환경과 우선순위를 고려한 결과, 해당 항목은 현재 단계에서는 별도 개선을 진행하지 않으며, 추후 전반적인 성능·호환성 개선 계획 속에서 함께 검토하기로 했습니다.

## 3.4

Issue status update: we have reviewed the request for D system’s translation table to support bulk deletion of selected rows. After checking the current behavior, the system is confirmed to already support multi-select deletion via row selection and the toolbar delete action, so no additional development is planned for this request at the moment.

## 4.1

問題対応状況のご連絡です。ユーザーが「/」を入力してよく使う操作を素早く呼び出せるショートカット機能の提案について、開発対応を開始しています。この機能は D システムの操作ステップ削減を目的とした改善項目として扱われており、2026-03-25 ごろのリリースを目標にしています。

## 4.2

요청하신 기능 상태 안내드립니다. D 시스템에 각 언어별 번역 완료율을 보여주는 진행 현황 보드를 추가하는 제안은 승인되었으며, 현재 구현을 진행 중입니다. 기존 통계 집계 능력을 활용하여 각 테이블 상단에 번역 완료 비율을 시각적으로 표시하는 구성으로 설계하고 있습니다.

## 4.3

Issue status update: the suggestion to add a voice message input capability for D system has been recorded and is under evaluation. 当前正在结合产品路线和技术架构评估语音输入的可行性和优先级。

## 4.4

问题跟踪状态更新：关于在 D 系统咨询会话中增加消息搜索功能的建议，我们已经完成立项并进入开发阶段。当前方案为在会话顶部增加搜索栏，支持按关键词检索历史消息，覆盖用户和专家的全部消息内容。该能力预计会在 2026-04-01 前后随新版本一并发布。

## 5.1

Issue status update: the suggestion to add a welcome message for first-time users of D system has been accepted and implemented. When users interact with the system for the first time, they now receive an introductory message that介绍系统的主要能力和使用方式。

## 5.2

问题跟踪状态更新：关于在 D 系统图片管理模块中增加图片预览功能的需求，我们已经完成实现。现在在图片字段列可以点击缩略图查看大图，并支持放大、缩小和全屏查看，同一记录下的多张图片也可以在预览模式中左右切换。

## 5.3

기능 제안 처리 결과를 안내드립니다. D 시스템 답변에서 Markdown 형식 렌더링을 지원해 달라는 요청은 검토 후 반영이 완료되었습니다. 현재는 코드 블록이나 리스트 등 Markdown 서식을 사용하는 경우, 보다 구조화된 형태로 표시되도록 조정되어 있습니다.

## 5.4

問題対応状況のご連絡です。D システムの会話にタグ／分類機能を追加してほしいというご要望について、実装が完了しました。現在はプリセットタグに加えカスタムタグも設定でき、会話一覧および会話詳細画面の双方でタグの確認と管理が可能です。

## 6.1

요청하신 제안 검토 결과를 안내드립니다. D 시스템 대화 기록을 PDF 보고서 형태로 자동 내보내는 기능에 대해서는, 다양한 시나리오와 우선순위를 검토한 결과 현재 단계에서는 별도 구현을 진행하지 않기로 했습니다. 향후 리포트·요약 기능을 전반적으로 설계·개편할 때 함께 검토할 계획입니다.

## 6.2

Issue status update: we have evaluated the suggestion for D system to automatically detect translation quality issues and highlight problematic entries. Because this requires integrating specialized evaluation models and infrastructure that the current architecture does not yet support, the feature has no近期实施计划，并已记录在中长期产品规划中以供后续评估。

## 6.3

问题跟踪状态更新：关于将 D 系统咨询会话从即时通讯模式整体改为工单模式的建议，我们已经完成评估。结合当前用户使用习惯与产品定位，这一方向目前暂无实施计划，将在后续整体形态规划中继续关注相关诉求和数据变化。

## 6.4

問題対応状況のご連絡です。D システムで「一度の指示で複数の翻訳タスクをまとめて作成する」といった多段タスク実行の要望について、対話状態管理やタスクキュー、エラー時のロールバックなど基盤レベルへの大きな変更が必要となるため、現段階では単一タスクの安定性向上を優先する方針としています。この多段タスク機能は中長期の技術計画に記録されており、基盤整備の進捗に合わせて実現可能性をあらためて検討する予定です。

# Tech Table 状态通知 Summary Output

## F-1

問題追蹤狀態更新：感謝你針對 D 系統提出增加中文介面選項的建議。我們已完成對此需求的評估，並已將多語言介面能力納入產品規劃。後續版本將支援簡體中文、繁體中文、英文與日文等多種介面語言，讓不同地區的用戶都能有更舒適的使用體驗。未來若對語言切換方式或顯示細節有更多想法，也非常歡迎持續與我們分享。

## F-2

問題追蹤狀態更新：關於翻譯工具中表格內容無法滑鼠選取複製，以及無法在翻譯介面直接新增字典的兩點建議，我們已完成處理。目前整個介面已支援滑鼠選中並複製原文、文本 key 等欄位內容，方便你在翻譯流程中靈活引用。同時，你也可以在翻譯介面中直接選中原文並新增對應字典條目，無需再切換到其他頁面操作。後續使用中若仍有任何不順手的地方，也歡迎隨時提出。

## F-3

問題追蹤狀態更新：感謝你建議在 i18n text table 中增加篩選條件保存功能，幫助頻繁切換遊戲與語言場景的使用者節省時間。我們已根據這一需求完成優化，現在可以保存自訂的篩選條件組合，方便你下次進入時快速切換到常用視圖。希望這一改動能讓日常翻譯與檢查流程更加順暢，如有其他想進一步優化的操作路徑，也非常歡迎繼續反饋。

## 1.1

Issue status update: thank you for reporting that chat bubbles in the D system’s mobile view sometimes overflow the screen and cut off text. We have confirmed this display problem and the team is actively working on improvements so that messages adapt correctly to the screen width. The fix is currently in progress and is planned to be released around 2026-03-12. After the update, you should be able to read the full content of each message without it being truncated.

## 1.2

问题跟踪状态更新：我们已经关注到你反馈的在移动端上传图片后偶发出现图片显示为空白的情况。该问题目前已处于处理中，我们会重点优化相关显示与缓存逻辑，以提升图片上传后的稳定性。修复版本上线后，这类图片短暂显示异常的情况应会明显减少。如果后续仍有类似现象或出现新的异常场景，也欢迎继续反馈具体操作路径和复现情况。

## 1.3

問題対応状況のご連絡です。D システムで長文の返信を送信した際、送信ボタンがしばらく押せなくなる事象について問題を確認しています。現在、この挙動の原因を調査しつつ、長文でもできるだけスムーズに送信できるよう改善対応を進めています。今後の更新で改善版が反映される予定ですので、しばらく様子を見ていただければ幸いです。

## 1.4

문제 진행 현황 안내드립니다. D 시스템 번역 테이블의 All Language 뷰에서 언어 필터를 변경해도 데이터가 새로고침되지 않는 현상을 확인했습니다. 현재 관련 동작을 수정하기 위한 작업을 진행 중이며, 언어 전환 시 화면이 올바르게 갱신되도록 개선하고 있습니다. 이 수정 사항은 2026-03-20 전후로 배포 예정인 버전에 포함을 목표로 하고 있습니다.

## 2.1

문제 처리 결과 안내드립니다. D 시스템 대화 중 중국어 문장부호를 사용할 때 답변이 깨져 보이던 현상은 이미 수정이 완료되었습니다。현재 버전에서는 해당 문장부호를 포함한 메시지도 정상적으로 표시되도록 조정되어 있습니다。이후에도 특정 문장부호에서 이상이 보일 경우, 예시 문장과 함께 알려 주시면 추가 확인에 큰 도움이 됩니다.

## 2.2

Issue status update: the problem where conversations remained in the Waiting list even after their status changed to close has been resolved. In the current version of the D system, handled and closed conversations should now behave as expected in the relevant list views. If you still notice any specific cases where a closed conversation appears in the wrong list, please share an example so we can double-check.

## 2.3

問題対応状況のご連絡です。夜間帯（UTC+8 23:00〜06:00）に D システムが無応答になるケースについて、いただいた報告をもとに対応を完了しました。現在はこの時間帯でも、以前より安定して返信が返るよう調整を行っています。もし引き続き深夜帯で極端な遅延や無応答が発生する場合は、発生時間や画面の状況を共有いただけると、さらなる改善に役立ちます。

## 2.4

问题跟踪状态更新：关于 D 系统导出 Excel 时多语言列排序与页面不一致的问题，我们已完成修复。现在导出的文件会更好地对齐页面上的显示顺序，便于你对多语言内容进行对比和整理。若在后续使用中仍发现导出结果与页面展示存在明显差异，也欢迎随时提供示例，我们会继续排查优化。

## 3.1

问题跟踪状态更新：我们已经评估了在 D 系统对话界面增加字体大小调节功能的建议。结合当前产品规划与整体优先级，这项能力目前暂不处理，后续会在统一体验规划中持续关注相关诉求。在此期间，如在具体场景下存在阅读困难的情况，也欢迎提供示例，便于后续整体方案设计时一并考虑。

## 3.2

問題対応状況のご連絡です。金曜日の午後に D システムの返信速度が大きく低下するというご指摘について、詳細な調査を行いました。その結果、主な要因は社内ネットワークの出口帯域の制約によるものであり、D システム本体の不具合ではないことが分かりました。このため、現時点ではアプリ側での個別改修は行わず、IT 部門と連携しながらネットワーク環境の改善状況を見守る方針としています。今後も体感上大きな遅延が続くようであれば、発生時間帯やご利用環境を共有いただけると助かります。

## 3.3

문제 진행 현황 안내드립니다. Safari 브라우저에서 D 시스템 페이지 스크롤이 매끄럽지 않은 현상에 대해 내부적으로 검토를 진행했습니다. 여러 환경과 우선순위를 종합적으로 고려한 결과, 해당 항목은 현재 단계에서는 별도 개선을 진행하지 않고, 향후 전반적인 성능·호환성 개선 계획 속에서 함께 검토하기로 했습니다. 다만 특정 화면에서 스크롤 문제가 업무에 큰 영향을 주는 경우가 있다면, 구체적인 페이지와 상황을 알려 주시면 추후 계획 수립 시 참고하겠습니다.

## 3.4

Issue status update: we’ve reviewed your request for D system’s translation table to support bulk deletion of selected rows. After checking the current capabilities, we found that the existing version already supports multi-select and bulk delete, so there is no additional development planned for now. You can use row selection (including modifier keys for multi-select) together with the toolbar delete action to remove multiple records at once. If this interaction still feels hard to discover or use in your workflow, please let us know so we can consider UX improvements in future iterations.

## 4.1

問題対応状況のご連絡です。ユーザーが「/」を入力してよく使う操作を素早く呼び出せるショートカット機能のご提案を受け取りました。この機能は現在 D システムの改善項目として実装を進めており、日常の操作ステップを減らすことを目指しています。リリースは 2026-03-25 ごろを目標としており、実装後は「/」入力から頻出コマンドをすぐに選択できるようになる予定です。実際の使い勝手についても、リリース後にぜひご意見をお聞かせください。

## 4.2

요청하신 기능 상태 안내드립니다. D 시스템에 각 언어별 번역 완료율을 보여주는 진행 현황 보드를 추가해 달라는 제안은 검토를 마치고 작업을 진행하고 있습니다. 현재는 기존 통계 집계 기능을 기반으로, 각 테이블 상단에 번역 완료 비율을 시각적으로 보여주는 진행률 바 컴포넌트를 추가하는 방향으로 설계하고 있습니다. 이 기능이 도입되면 언어별 번역 진행 상황을 한눈에 파악하고, 우선적으로 채워야 할 영역을 더 쉽게 확인하실 수 있을 것으로 기대합니다.

## 4.3

Issue status update: thank you for suggesting a voice message input capability for D system. We have recorded this idea and are evaluating how voice input could fit into the current product roadmap and technical stack. Our goal is to understand the main usage scenarios so that any future voice feature can genuinely improve efficiency rather than add extra steps. If you have concrete workflows or tools you’d like to combine with voice input, sharing them will help us assess the design more precisely.

## 4.4

问题跟踪状态更新：关于在 D 系统咨询会话中增加消息搜索功能的建议，我们已经正式立项并进入开发阶段。当前方案计划在会话顶部增加搜索栏，支持按关键词检索历史消息，覆盖用户与专家的全部对话内容。该能力预计会在 2026-04-01 前后随新版本一并发布，方便你在长会话中快速回溯关键信息。上线后如在搜索范围或结果展示上还有进一步需求，也欢迎继续提出，我们会在后续迭代中持续优化。

## 5.1

Issue status update: your suggestion to add a welcome message when users first interact with D system has been accepted and implemented. New users will now receive a short introductory message that explains key capabilities and how to get started. We hope this helps them understand the system more quickly and feel more comfortable exploring its features. We’ll continue refining the wording based on real usage and feedback.

## 5.2

问题跟踪状态更新：关于在 D 系统图片管理模块中增加图片预览功能的需求，我们已完成实现。现在你可以点击图片缩略图查看大图，并支持放大、缩小和全屏查看等操作。同一记录下的多张图片也可以在预览模式中左右切换，方便你一次性检查整组资源。后续如在预览体验上还有其他想优化的细节，也欢迎继续反馈。

## 5.3

기능 제안 처리 결과를 안내드립니다. D 시스템 답변에서 Markdown 형식 렌더링을 지원해 달라는 요청은 검토를 마치고 대응을 완료했습니다. 이제 코드 블록이나 리스트 등 Markdown 서식을 활용하는 경우, 이전보다 더 읽기 쉽고 구조화된 형태로 표시되도록 조정되어 있습니다. 실제 사용 중에 제대로 렌더링되지 않는 패턴이 있다면, 예시와 함께 보내 주시면 후속 개선에 참고하겠습니다.

## 5.4

問題対応状況のご連絡です。D システムの会話にタグ／分類機能を追加してほしいというご要望について、実装が完了しました。現在はあらかじめ用意したタグに加えてカスタムタグも設定でき、会話一覧および詳細画面の双方でタグの確認と管理が可能です。運用の中でよく使う分類パターンや不足しているタグが見えてきましたら、ぜひフィードバックをお寄せください。

## 6.1

요청하신 제안 검토 결과를 안내드립니다. D 시스템 대화 기록을 PDF 보고서 형태로 자동 내보내는 기능에 대해서 내부 논의를 진행했습니다. 여러 사용 시나리오와 개발 우선순위를 함께 검토한 결과, 이 기능은 현재 단계에서는 별도 구현을 진행하지 않고, 향후 리포트·요약 기능 전반을 설계할 때 함께 검토하는 방향으로 두기로 했습니다. 그동안에는 필요 시 기존 내보내기 기능이나 사내 보고 포맷을 활용해 주시면 감사하겠습니다.

## 6.2

Issue status update: we’ve carefully evaluated your suggestion for D system to automatically detect translation quality issues and highlight problematic entries. Because this would require integrating specialized evaluation models and infrastructure that the current architecture does not yet support, there is no near-term implementation plan. We have, however, recorded this idea in the longer-term product roadmap and will revisit it once the underlying platform is upgraded. Your input is very valuable in shaping our future quality-related capabilities.

## 6.3

问题跟踪状态更新：关于将 D 系统咨询会话从即时通讯模式整体改为工单模式的建议，我们已经完成评估。结合当前用户使用习惯与产品定位，这一方向目前暂无实施计划，会在后续整体形态规划中持续关注相关诉求和数据变化。如果你在现有即时沟通模式下遇到具体的流程痛点，也欢迎分享详细场景，我们会优先从这些问题入手做针对性优化。

## 6.4

問題対応状況のご連絡です。D システムで「一度の指示で複数の翻訳タスクをまとめて作成する」といった多段タスク実行をサポートしてほしいというご要望について検討しました。この種の多段タスク編成には、対話状態管理やタスクキュー、エラー時のロールバックなど基盤レベルの大きな改修が必要となるため、現段階では単一タスクの安定性向上を優先する方針としています。このアイデア自体は中長期の技術計画に取り込んでおり、基盤整備が進んだ段階であらためて実現可能性を検討していく予定です。


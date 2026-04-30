CTW Bot组建特性：不同页面（html）调用组建时通过传入不同的参数可以显示不同的初始化聊天内容


实现原理
每个页面在加载 ctw-bot.js 之前，通过 window.CTWBotConfig 设置页面专属的配置：
<script>
window.CTWBotConfig = {
    title: 'CTW Bot · 邮件助手',        // 标题栏文字
    welcome: '你好！我是邮件助手…',       // 初始欢迎语
    placeholder: '例如：帮我写一封邮件…', // 输入框占位文字
    quickReplies: ['写邮件', '查规则'],   // 快捷问题气泡
    conversation: [                       // 或者直接预设一段对话历史
        { role: 'bot',  text: '你好！' },
        { role: 'user', text: '查进度' },
        { role: 'bot',  text: '正在查询…' }
    ],
    responses: {                          // 关键词 → 定制回复
        '感谢': '好的，帮你草拟感谢邮件…',
        '总结': '今天有 5 封未读邮件…'
    }
};
</script>
<script src="ctw-bot.js"></script>
/**
 * CTW Bot — 可复用浮窗聊天组件
 *
 * 使用方式：
 *   1. 在 <script src="ctw-bot.js"> 之前设置配置（可选）
 *      <script>
 *        window.CTWBotConfig = {
 *          title: 'CTW Bot',
 *          welcome: '你好！我是 CTW Bot~',
 *          placeholder: '输入你的问题…',
 *          quickReplies: ['介绍一下CTW', '查看日程'],
 *          conversation: [
 *            { role: 'bot',  text: '你好！有什么可以帮你？' },
 *            { role: 'user', text: '帮我查一下项目进度' },
 *            { role: 'bot',  text: '好的，正在为你查询…' }
 *          ],
 *          responses: { ... }
 *        };
 *      </script>
 *      <script src="ctw-bot.js"></script>
 *
 *   2. 也可在初始化后通过 API 动态更新
 *      CTWBot.open()
 *      CTWBot.close()
 *      CTWBot.toggle()
 *      CTWBot.setConfig({ welcome: '新的欢迎语', quickReplies: [...] })
 *      CTWBot.reset()          — 清空聊天并重新初始化
 *      CTWBot.addBotMsg(text)  — 外部追加一条 Bot 消息
 *      CTWBot.addUserMsg(text) — 外部追加一条用户消息
 */
function initCTWBot() {
  'use strict';
  if (window.CTWBot) return;

  const DEFAULT_CONFIG = {
    title: 'CTW Bot',
    welcome: 'Hello~! 💕 I\'m CTW\'s administrative assistant♪ Feel free to ask me anything~✨ What can I help you with? (^o^)/',
    placeholder: 'What can I help you with?',
    quickReplies: [],
    conversation: null,
    responses: null
  };

  let cfg = Object.assign({}, DEFAULT_CONFIG, window.CTWBotConfig || {});

  const DEFAULT_RESPONSES = [
    'Let me look into that for you~ (＾▽＾)💕\n\nBased on what I found, here\'s what I can tell you…',
    'Great question! ✨\n\nI\'d be happy to help with that. Let me check the relevant information for you~',
    'Sure thing~ (^o^)/\n\nHere\'s what I\'ve got for you. Let me know if you need more details!',
    'I\'m on it! 💕\n\nGive me a moment to gather the information you need~',
  ];

  /* ====== CSS ====== */
  const STYLE = document.createElement('style');
  STYLE.textContent = `
/* ---------- trigger fab ---------- */
.ctw-bot-fab{
  position:fixed;bottom:28px;right:28px;z-index:9998;
  width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;
  background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
  box-shadow:0 4px 14px rgba(102,126,234,.4);
  display:flex;align-items:center;justify-content:center;
  transition:transform .2s,box-shadow .2s;
}
.ctw-bot-fab:hover{transform:scale(1.08);box-shadow:0 6px 20px rgba(102,126,234,.55);}
.ctw-bot-fab.open{transform:scale(0);pointer-events:none;}
.ctw-bot-fab svg{width:26px;height:26px;}

/* ---------- widget ---------- */
.ctw-bot-widget{
  position:fixed;bottom:28px;right:28px;z-index:9999;
  width:375px;height:624px;
  background:#f9fafb;
  border:1px solid #e5e7eb;
  border-radius:16px;
  box-shadow:0 9px 28px rgba(0,0,0,.05),0 3px 6px -4px rgba(0,0,0,.12),0 6px 16px rgba(0,0,0,.08);
  display:flex;flex-direction:column;
  overflow:hidden;
  opacity:0;transform:translateY(20px) scale(.96);pointer-events:none;
  transition:opacity .25s ease,transform .25s ease;
}
.ctw-bot-widget.visible{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}

/* header */
.ctw-bot-header{
  height:48px;min-height:48px;padding:0 16px;
  display:flex;align-items:center;justify-content:space-between;
  border-bottom:1px solid #e5e7eb;background:#fff;
  border-radius:16px 16px 0 0;
}
.ctw-bot-header-title{
  font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
  font-size:16px;font-weight:500;color:#131825;letter-spacing:.32px;line-height:24px;
}
.ctw-bot-close{
  width:28px;height:28px;border:none;background:transparent;
  border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;
  color:#73726e;transition:background .15s;
}
.ctw-bot-close:hover{background:#efefef;}
.ctw-bot-close svg{width:16px;height:16px;}

/* messages area */
.ctw-bot-messages{
  flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px;
}
.ctw-bot-messages::-webkit-scrollbar{width:4px;}
.ctw-bot-messages::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px;}

/* single message row */
.ctw-bot-msg{display:flex;gap:10px;align-items:flex-start;max-width:100%;}
.ctw-bot-msg.user{flex-direction:row-reverse;}

/* avatar */
.ctw-bot-avatar{
  width:32px;height:32px;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg,#00d2ff 0%,#3a7bd5 100%);
  display:flex;align-items:center;justify-content:center;
  position:relative;overflow:hidden;
}
.ctw-bot-avatar svg{width:20px;height:20px;}

/* bubble */
.ctw-bot-bubble{
  max-width:calc(100% - 52px);
  font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
  font-size:14px;line-height:22px;color:#131825;
  word-break:break-word;white-space:pre-wrap;
}
.ctw-bot-msg.user .ctw-bot-bubble{
  background:#efefef;padding:6px 14px;border-radius:6px;
  color:#131825;
}

/* quick replies */
.ctw-bot-quick-replies{
  display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;
  padding:0;
}
.ctw-bot-quick-btn{
  background:#efefef;border:none;border-radius:6px;
  padding:6px 14px;cursor:pointer;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
  font-size:14px;color:#131825;line-height:22px;
  transition:background .15s;white-space:nowrap;
}
.ctw-bot-quick-btn:hover{background:#e2e2e2;}

/* loading dots */
.ctw-bot-loading{display:flex;align-items:center;gap:4px;padding:4px 0;}
.ctw-bot-loading span{
  width:8px;height:8px;border-radius:50%;background:#131825;
  animation:ctwDotPulse 1.4s ease-in-out infinite both;
}
.ctw-bot-loading span:nth-child(2){animation-delay:.2s;}
.ctw-bot-loading span:nth-child(3){animation-delay:.4s;}
@keyframes ctwDotPulse{
  0%,80%,100%{opacity:.25;transform:scale(.8);}
  40%{opacity:1;transform:scale(1);}
}

/* input area */
.ctw-bot-input-area{
  padding:12px 20px 20px;flex-shrink:0;
}
.ctw-bot-input-box{
  display:flex;align-items:center;gap:8px;
  background:#fff;border:1px solid #e5e7eb;
  border-radius:24px;padding:8px 8px 8px 16px;
  box-shadow:0 8px 12px rgba(0,0,0,.1);
}
.ctw-bot-input{
  flex:1;border:none;outline:none;background:transparent;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
  font-size:14px;color:#131825;line-height:22px;
}
.ctw-bot-input::placeholder{color:#ababa9;}
.ctw-bot-send{
  width:32px;height:32px;border-radius:50%;border:none;cursor:pointer;
  background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  transition:opacity .15s;opacity:.5;
}
.ctw-bot-send.active{opacity:1;}
.ctw-bot-send svg{width:14px;height:14px;}

/* action button inside bubble */
.ctw-bot-action{
  display:inline-flex;align-items:center;gap:4px;margin-top:10px;
  padding:6px 16px;border-radius:6px;border:none;cursor:pointer;
  background:#131825;color:#fff;font-size:13px;font-weight:500;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
  transition:background .15s,color .15s;
}
.ctw-bot-action:hover{background:#2a2f3a;}
.ctw-bot-action.confirmed{
  background:#e8e8e8;color:#999;cursor:default;
  border-radius:20px;padding:6px 14px;font-weight:400;
}
`;
  document.head.appendChild(STYLE);

  /* ====== HTML ====== */
  const ROOT = document.createElement('div');
  ROOT.id = 'ctwBotRoot';
  ROOT.innerHTML = `
<button class="ctw-bot-fab" id="ctwBotFab" aria-label="Open CTW Bot">
  <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.04 2 11c0 2.76 1.36 5.22 3.5 6.84V22l3.74-2.06c.9.26 1.8.06 2.76.06 5.52 0 10-4.04 10-9S17.52 2 12 2z" fill="#fff"/><circle cx="8.5" cy="11" r="1.5" fill="#667eea"/><circle cx="12" cy="11" r="1.5" fill="#667eea"/><circle cx="15.5" cy="11" r="1.5" fill="#667eea"/></svg>
</button>
<div class="ctw-bot-widget" id="ctwBotWidget">
  <div class="ctw-bot-header">
    <span class="ctw-bot-header-title" id="ctwBotTitle"></span>
    <button class="ctw-bot-close" id="ctwBotClose" aria-label="Close">
      <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>
  <div class="ctw-bot-messages" id="ctwBotMessages"></div>
  <div class="ctw-bot-input-area">
    <div class="ctw-bot-input-box">
      <input class="ctw-bot-input" id="ctwBotInput" type="text">
      <button class="ctw-bot-send" id="ctwBotSend" aria-label="Send">
        <svg viewBox="0 0 14 14" fill="none"><path d="M7 11V3M4 6l3-3 3 3" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  </div>
</div>`;
  document.body.appendChild(ROOT);

  /* ====== REFS ====== */
  const fab      = document.getElementById('ctwBotFab');
  const widget   = document.getElementById('ctwBotWidget');
  const closeBtn = document.getElementById('ctwBotClose');
  const titleEl  = document.getElementById('ctwBotTitle');
  const msgArea  = document.getElementById('ctwBotMessages');
  const input    = document.getElementById('ctwBotInput');
  const sendBtn  = document.getElementById('ctwBotSend');

  /* ====== HELPERS ====== */
  const BOT_SVG = `<svg viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="url(#ctwG)"/>
    <defs><linearGradient id="ctwG" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#00d2ff"/><stop offset="1" stop-color="#3a7bd5"/></linearGradient></defs>
    <rect x="9" y="13" width="4" height="5" rx="2" fill="#000"/>
    <rect x="19" y="13" width="4" height="5" rx="2" fill="#000"/>
    <path d="M8 10c0-4 4-6 8-6s8 2 8 6" stroke="#000" stroke-width="1.5" fill="none"/>
    <circle cx="10" cy="8" r="2" fill="#00d2ff"/>
    <circle cx="22" cy="8" r="2" fill="#00d2ff"/>
  </svg>`;

  function createAvatar() {
    const d = document.createElement('div');
    d.className = 'ctw-bot-avatar';
    d.innerHTML = BOT_SVG;
    return d;
  }

  function scrollBottom() {
    requestAnimationFrame(() => { msgArea.scrollTop = msgArea.scrollHeight; });
  }

  function addBotMsg(text, useHTML) {
    const row = document.createElement('div');
    row.className = 'ctw-bot-msg bot';
    const bubble = document.createElement('div');
    bubble.className = 'ctw-bot-bubble';
    if (useHTML) bubble.innerHTML = text;
    else bubble.textContent = text;
    row.appendChild(createAvatar());
    row.appendChild(bubble);
    msgArea.appendChild(row);
    scrollBottom();
  }

  function addUserMsg(text) {
    const row = document.createElement('div');
    row.className = 'ctw-bot-msg user';
    const bubble = document.createElement('div');
    bubble.className = 'ctw-bot-bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    msgArea.appendChild(row);
    scrollBottom();
  }

  function addQuickReplies(items) {
    if (!items || !items.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'ctw-bot-quick-replies';
    items.forEach(label => {
      const btn = document.createElement('button');
      btn.className = 'ctw-bot-quick-btn';
      btn.textContent = label;
      btn.addEventListener('click', () => {
        wrap.remove();
        handleSend(label);
      });
      wrap.appendChild(btn);
    });
    msgArea.appendChild(wrap);
    scrollBottom();
  }

  function showLoading() {
    const row = document.createElement('div');
    row.className = 'ctw-bot-msg bot';
    row.id = 'ctwBotLoading';
    const dots = document.createElement('div');
    dots.className = 'ctw-bot-loading';
    dots.innerHTML = '<span></span><span></span><span></span>';
    row.appendChild(createAvatar());
    row.appendChild(dots);
    msgArea.appendChild(row);
    scrollBottom();
  }

  function removeLoading() {
    const el = document.getElementById('ctwBotLoading');
    if (el) el.remove();
  }

  /* ====== RESPONSE MATCHING ====== */
  function getResponse(userText) {
    const custom = cfg.responses;
    if (custom) {
      const lower = userText.toLowerCase();
      for (const key in custom) {
        if (lower.includes(key.toLowerCase())) {
          const val = custom[key];
          if (!val || (Array.isArray(val) && !val.length)) continue;
          return Array.isArray(val) ? val[Math.floor(Math.random() * val.length)] : val;
        }
      }
    }
    return DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
  }

  /* ====== RENDER INITIAL STATE ====== */
  function renderInit() {
    titleEl.textContent = cfg.title;
    input.placeholder = cfg.placeholder;
    msgArea.innerHTML = '';

    if (cfg.conversation && cfg.conversation.length) {
      cfg.conversation.forEach(m => {
        if (m.role === 'bot') addBotMsg(m.text, !!m.html);
        else addUserMsg(m.text);
      });
    } else if (cfg.welcome) {
      addBotMsg(cfg.welcome);
    }

    if (cfg.quickReplies && cfg.quickReplies.length) {
      addQuickReplies(cfg.quickReplies);
    }
  }

  renderInit();

  /* ====== OPEN / CLOSE ====== */
  function open()  { widget.classList.add('visible'); fab.classList.add('open'); setTimeout(() => input.focus(), 300); }
  function close() { widget.classList.remove('visible'); fab.classList.remove('open'); }
  function toggle(){ widget.classList.contains('visible') ? close() : open(); }

  fab.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  /* ====== SEND ====== */
  function handleSend(text) {
    if (!text) return;
    addUserMsg(text);
    const responseText = getResponse(text);

    showLoading();
    setTimeout(() => {
      removeLoading();
      addBotMsg(responseText);
    }, 800 + Math.random() * 1200);
  }

  function send() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendBtn.classList.remove('active');
    handleSend(text);
  }

  input.addEventListener('input', () => {
    sendBtn.classList.toggle('active', input.value.trim().length > 0);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  sendBtn.addEventListener('click', send);

  /* ====== PUBLIC API ====== */
  function setConfig(newCfg) {
    cfg = Object.assign({}, DEFAULT_CONFIG, newCfg);
    renderInit();
  }

  function reset() {
    cfg = Object.assign({}, DEFAULT_CONFIG, window.CTWBotConfig || {});
    renderInit();
  }

  window.CTWBot = { open, close, toggle, setConfig, reset, addBotMsg, addUserMsg };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCTWBot);
} else {
  initCTWBot();
}

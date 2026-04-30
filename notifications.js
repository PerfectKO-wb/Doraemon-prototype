/**
 * Notifications v2 — 分组聚合通知中心组件
 *
 * 根据消息中心优化 PRD (Sprint 43) 实现：
 *   - 4 个业务分组：🔴紧急 📝翻译 🎧客服 📌其他
 *   - 分组判定：type=urgent→紧急, title模式匹配→翻译, source_from=CS→客服, 其余→其他
 *   - 翻译分组内按 appID + 标题类型聚合（>2条触发）
 *   - 紧急分组不可折叠，始终展开
 *   - 已读消息被消费移除
 *
 * 使用方式：
 *   <script>
 *     window.NotificationsConfig = {
 *       items: [
 *         { id:'n1', title:'审批超时', type:'urgent', time:'09:15' },
 *         { id:'n2', title:'gamedemo Text Translation', appID:'gamedemo', time:'10:30' },
 *         { id:'n3', title:'新客服咨询', source_from:'CS', time:'07:30' }
 *       ]
 *     };
 *   </script>
 *   <script src="notifications.js"></script>
 *
 * API:
 *   Notifications.open() / .close() / .toggle()
 *   Notifications.setItems([...]) / .addItem({...}) / .removeItem(id)
 *   Notifications.markAllRead() / .markGroupRead(groupId) / .markItemRead(id)
 *   Notifications.getUnreadCount() / .getItems()
 */
(function () {
  'use strict';
  if (window.Notifications) return;

  /* ====== 4 Group Definitions (fixed order) ====== */
  var GROUP_DEFS = [
    { id: 'urgent',      label: 'Urgent', emoji: '🔴', priority: 1, collapsible: false },
    { id: 'translation', label: 'Translation', emoji: '📝', priority: 2, collapsible: true },
    { id: 'cs',          label: 'Customer Service', emoji: '🎧', priority: 3, collapsible: true },
    { id: 'others',      label: 'Others', emoji: '📌', priority: 4, collapsible: true }
  ];

  /* ====== Translation title patterns ====== */
  // Returns { group, translationType, aggregatable, extractedApp } or null
  function matchTranslationTitle(title) {
    if (!title) return null;
    var m;
    // Pattern 1: "有 X 个图片翻译任务待处理" — not aggregatable
    if (/有\s*\d+\s*个图片翻译任务待处理/.test(title)) {
      return { group: 'translation', translationType: 'image_task', aggregatable: false };
    }
    // Pattern 2: "【appName】 Text Translation"
    m = title.match(/^(.+?)\s+Text Translation$/);
    if (m) {
      return { group: 'translation', translationType: 'text_translation', aggregatable: true, extractedApp: m[1] };
    }
    // Pattern 3: "【appName】 Announcement Translation"
    m = title.match(/^(.+?)\s+Announcement Translation$/);
    if (m) {
      return { group: 'translation', translationType: 'announcement_translation', aggregatable: true, extractedApp: m[1] };
    }
    // Pattern 4: "Text Translation Updated"
    if (/^Text Translation Updated$/.test(title.trim())) {
      return { group: 'translation', translationType: 'text_updated', aggregatable: true };
    }
    return null;
  }

  /* ====== Config ====== */
  var DEFAULT_CONFIG = {
    title: 'Notifications',
    position: { top: '52px', right: '16px' },
    bellPosition: { top: '16px', right: '16px' },
    items: [],
    onItemClick: null,
    onActionClick: null,
    onMarkAllRead: null,
    onMarkGroupRead: null,
    onDismiss: null
  };

  var cfg = Object.assign({}, DEFAULT_CONFIG, window.NotificationsConfig || {});
  if (!Array.isArray(cfg.items)) cfg.items = [];
  cfg.items = cfg.items.map(normalizeItem);

  function normalizeItem(item, i) {
    var n = Object.assign({ id: item.id || 'notif-' + i, unread: true }, item);

    // Determine group
    if (!n.group) {
      if (n.type === 'urgent' || n.urgent) {
        n.group = 'urgent';
      } else {
        var tmatch = matchTranslationTitle(n.title);
        if (tmatch) {
          n.group = 'translation';
          n._translationType = tmatch.translationType;
          n._aggregatable = tmatch.aggregatable;
          if (tmatch.extractedApp && !n.appID) n.appID = tmatch.extractedApp;
        } else if (n.source_from === 'CS') {
          n.group = 'cs';
        } else {
          n.group = 'others';
        }
      }
    } else {
      // If group is explicitly set, still parse translation info
      if (n.group === 'translation') {
        var tm = matchTranslationTitle(n.title);
        if (tm) {
          n._translationType = tm.translationType;
          n._aggregatable = tm.aggregatable;
          if (tm.extractedApp && !n.appID) n.appID = tm.extractedApp;
        }
      }
    }
    return n;
  }

  /* ====== SVG Icons ====== */
  var ICON_BELL = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18.333a1.667 1.667 0 001.667-1.666H8.333A1.667 1.667 0 0010 18.333zM15 13.333V9.167a5 5 0 00-4.167-4.925V3.333a.833.833 0 10-1.666 0v.909A5 5 0 005 9.167v4.166L3.333 15v.833h13.334V15L15 13.333z" fill="#131825"/></svg>';
  var ICON_CHECK = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 6l1.5 1.5L8 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.2"/></svg>';
  var ICON_CLOSE = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="#73726e" stroke-width="1.2" stroke-linecap="round"/></svg>';
  var ICON_CHEVRON = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_LINK = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 3H3a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1V7.5M7 2h3v3M5.5 6.5L10 2" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_DOC = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3h12v10H2V3z" stroke="#1890ff" stroke-width="1.3" stroke-linecap="round"/><path d="M5 7h6M5 9.5h4" stroke="#1890ff" stroke-width="1" stroke-linecap="round"/></svg>';

  var CARD_ICON_MAP = {
    mail:    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4l6 4 6-4M2 3h12v10H2V3z" stroke="#722ed1" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    warning: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.333l6.667 11.334H1.333L8 1.333z" stroke="#d48806" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6v3M8 11h.007" stroke="#d48806" stroke-width="1.3" stroke-linecap="round"/></svg>',
    info:    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#1890ff" stroke-width="1.3"/><path d="M8 5.333v5.334M5.333 8h5.334" stroke="#1890ff" stroke-width="1.3" stroke-linecap="round"/></svg>',
    success: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#52c41a" stroke-width="1.3"/><path d="M5.333 8l2 2 3.334-3.333" stroke="#52c41a" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  /* ====== CSS ====== */
  var style = document.createElement('style');
  style.textContent = [
    '/* ===== Notifications v2 ===== */',
    '.notif-bell{position:fixed;z-index:100;width:32px;height:32px;display:flex;align-items:center;justify-content:center;padding:6px;border-radius:16px;cursor:pointer;transition:background .15s;}',
    '.notif-bell:hover{background:#f0f0f0;}',
    '.notif-badge{position:absolute;top:0;right:-3px;min-width:19px;height:12px;background:var(--error-base,#f5222d);border:1px solid var(--bg-container,#fff);border-radius:7px;display:flex;align-items:center;justify-content:center;padding:0 3px;}',
    '.notif-badge span{font-size:10px;font-weight:400;line-height:10px;color:#fff;}',
    '.notif-overlay{position:fixed;top:0;left:0;width:100%;height:100%;z-index:199;display:none;}',
    '.notif-overlay.show{display:block;}',

    /* Panel */
    '.notif-panel{position:fixed;z-index:200;width:380px;background:var(--bg-container,#fff);border:1px solid var(--border-divider,#e5e7eb);border-radius:12px;box-shadow:0 9px 28px rgba(0,0,0,.05),0 3px 6px -4px rgba(0,0,0,.12),0 6px 16px rgba(0,0,0,.08);display:none;flex-direction:column;max-height:580px;font-family:"Inter",-apple-system,BlinkMacSystemFont,sans-serif;}',
    '.notif-panel.show{display:flex;}',

    /* Panel header */
    '.notif-hdr{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border-divider,#e5e7eb);min-height:44px;}',
    '.notif-hdr-left{display:flex;align-items:baseline;gap:6px;}',
    '.notif-hdr-title{font-size:14px;font-weight:600;line-height:22px;color:var(--text-default,#131825);}',
    '.notif-hdr-count{font-size:12px;font-weight:400;line-height:18px;color:var(--text-secondary,#73726e);}',
    '.notif-hdr-allread{display:flex;align-items:center;gap:4px;cursor:pointer;font-size:12px;color:var(--text-secondary,#73726e);transition:opacity .15s;}',
    '.notif-hdr-allread:hover{opacity:.7;}',

    /* Scrollable list */
    '.notif-scroll{flex:1;overflow-y:auto;padding:4px 0;}',
    '.notif-scroll::-webkit-scrollbar{width:4px;}',
    '.notif-scroll::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px;}',

    /* Group section */
    '.notif-grp{border-bottom:1px solid var(--border-divider,#e5e7eb);}',
    '.notif-grp:last-child{border-bottom:none;}',
    '.notif-grp-hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;user-select:none;transition:background .12s;}',
    '.notif-grp.collapsible .notif-grp-hdr{cursor:pointer;}',
    '.notif-grp.collapsible .notif-grp-hdr:hover{background:var(--bg-hover,#f5f5f5);}',
    '.notif-grp-hdr-left{display:flex;align-items:center;gap:6px;min-width:0;}',
    '.notif-grp-emoji{font-size:14px;line-height:1;}',
    '.notif-grp-label{font-size:13px;font-weight:600;line-height:20px;color:var(--text-default,#131825);white-space:nowrap;}',
    '.notif-grp-badge{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--primary,#1C64F2);font-size:11px;font-weight:500;color:#fff;display:flex;align-items:center;justify-content:center;}',
    '.notif-grp.is-urgent .notif-grp-badge{background:var(--error-base,#f5222d);color:#fff;}',
    '.notif-grp-hdr-right{display:flex;align-items:center;gap:8px;flex-shrink:0;}',
    '.notif-grp-read{font-size:11px;color:var(--text-disabled,#ababa9);cursor:pointer;white-space:nowrap;transition:color .15s;}',
    '.notif-grp-read:hover{color:var(--primary,#1C64F2);}',
    '.notif-grp-chevron{display:flex;transition:transform .2s;color:var(--text-disabled,#ababa9);}',
    '.notif-grp.collapsed .notif-grp-chevron{transform:rotate(-90deg);}',
    '.notif-grp-body{padding:4px 12px 8px;display:flex;flex-direction:column;gap:6px;}',
    '.notif-grp.collapsed .notif-grp-body{display:none;}',

    /* Card base */
    '.notif-card{position:relative;padding:10px 12px;border-radius:10px;cursor:pointer;transition:background .15s;display:flex;flex-direction:column;gap:3px;background:var(--bg-layout,#f9fafb);}',
    '.notif-card:hover{background:var(--bg-hover,#efefef);}',
    '.notif-grp.is-urgent .notif-card{background:var(--error-bg,#fff1f0);}',
    '.notif-grp.is-urgent .notif-card:hover{background:#ffe8e6;}',

    '.notif-card-row{display:flex;align-items:flex-start;gap:8px;}',
    '.notif-card-icon{width:24px;height:24px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}',
    '.notif-card-icon.mail{background:var(--purple-bg,#f9f0ff);}',
    '.notif-card-icon.warning{background:var(--warning-bg,#fff7e6);}',
    '.notif-card-icon.info{background:var(--blue-bg,#e6f7ff);}',
    '.notif-card-icon.success{background:var(--success-bg,#f6ffed);}',
    '.notif-card-body{flex:1;min-width:0;}',
    '.notif-card-title{font-size:13px;font-weight:500;line-height:20px;color:var(--text-default,#131825);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.notif-grp.is-urgent .notif-card-title{font-size:14px;font-weight:600;line-height:22px;white-space:normal;overflow:visible;text-overflow:unset;}',
    '.notif-card-desc{font-size:12px;line-height:18px;color:var(--text-secondary,#73726e);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
    '.notif-card-time{font-size:11px;color:var(--text-disabled,#ababa9);white-space:nowrap;flex-shrink:0;margin-top:2px;}',
    '.notif-card-meta{display:flex;align-items:center;gap:8px;margin-top:4px;}',
    '.notif-card-meta .notif-card-time{margin-top:0;}',
    '.notif-card-urgent-tag{display:inline-flex;align-items:center;height:22px;padding:0 10px;border-radius:11px;background:var(--error-base,#f5222d);font-size:12px;font-weight:600;color:#fff;white-space:nowrap;}',

    /* Dismiss */
    '.notif-dismiss{position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:#e0e0e0;border:none;cursor:pointer;display:none;align-items:center;justify-content:center;transition:background .15s;z-index:1;}',
    '.notif-dismiss:hover{background:#d0d0d0;}',
    '.notif-card:hover .notif-dismiss{display:flex;}',

    /* Aggregated card (translation) */
    '.notif-agg{position:relative;border-radius:10px;background:var(--bg-layout,#f9fafb);transition:background .12s;overflow:hidden;}',
    '.notif-agg-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;cursor:pointer;transition:background .12s;}',
    '.notif-agg-hdr:hover{background:var(--bg-hover,#efefef);}',
    '.notif-agg-hdr-left{display:flex;align-items:center;gap:8px;min-width:0;flex:1;}',
    '.notif-agg-icon{width:24px;height:24px;border-radius:6px;background:var(--blue-bg,#e6f7ff);display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
    '.notif-agg-icon svg{width:14px;height:14px;}',
    '.notif-agg-info{flex:1;min-width:0;}',
    '.notif-agg-title{font-size:13px;font-weight:500;line-height:20px;color:var(--text-default,#131825);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.notif-agg-sub{font-size:11px;line-height:16px;color:var(--text-secondary,#73726e);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.notif-agg-hdr-right{display:flex;align-items:center;gap:6px;flex-shrink:0;}',
    '.notif-agg-count{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#d6e4ff;font-size:10px;font-weight:500;color:#1C64F2;display:flex;align-items:center;justify-content:center;}',
    '.notif-agg-chevron{display:flex;transition:transform .2s;color:var(--text-disabled,#ababa9);}',
    '.notif-agg.expanded .notif-agg-chevron{transform:rotate(180deg);}',
    '.notif-agg-detail{display:none;border-top:1px solid var(--border-divider,#e5e7eb);}',
    '.notif-agg.expanded .notif-agg-detail{display:block;}',
    '.notif-agg-item{display:flex;align-items:center;gap:8px;padding:8px 12px 8px 44px;cursor:pointer;transition:background .12s;border-bottom:1px solid var(--border-divider,#e5e7eb);}',
    '.notif-agg-item:last-child{border-bottom:none;}',
    '.notif-agg-item:hover{background:var(--bg-hover,#efefef);}',
    '.notif-agg-item-dot{width:4px;height:4px;border-radius:50%;background:var(--primary,#1C64F2);flex-shrink:0;}',
    '.notif-agg-item-title{flex:1;font-size:12px;line-height:18px;color:var(--text-default,#131825);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.notif-agg-item-time{font-size:11px;color:var(--text-disabled,#ababa9);white-space:nowrap;flex-shrink:0;}',
    '.notif-agg-item-del{display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:transparent;border:none;cursor:pointer;flex-shrink:0;opacity:0;transition:opacity .15s,background .15s;}',
    '.notif-agg-item:hover .notif-agg-item-del{opacity:1;}',
    '.notif-agg-item-del:hover{background:#e0e0e0;}',

    /* Empty */
    '.notif-empty{padding:32px 12px;text-align:center;font-size:13px;color:var(--text-disabled,#ababa9);line-height:20px;}'
  ].join('\n');
  document.head.appendChild(style);

  /* ====== DOM ====== */
  var bell = document.createElement('div');
  bell.className = 'notif-bell';
  bell.style.top = cfg.bellPosition.top;
  bell.style.right = cfg.bellPosition.right;
  bell.innerHTML = ICON_BELL + '<div class="notif-badge"><span>0</span></div>';

  var overlay = document.createElement('div');
  overlay.className = 'notif-overlay';

  var panel = document.createElement('div');
  panel.className = 'notif-panel';
  panel.style.top = cfg.position.top;
  panel.style.right = cfg.position.right;
  panel.innerHTML = [
    '<div class="notif-hdr">',
    '  <div class="notif-hdr-left">',
    '    <span class="notif-hdr-title">' + esc(cfg.title) + '</span>',
    '    <span class="notif-hdr-count"></span>',
    '  </div>',
    '  <div class="notif-hdr-allread">' + ICON_CHECK + ' <span>Mark All Read</span></div>',
    '</div>',
    '<div class="notif-scroll"></div>'
  ].join('');

  document.body.appendChild(bell);
  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  var badgeEl = bell.querySelector('.notif-badge');
  var countEl = panel.querySelector('.notif-hdr-count');
  var scrollEl = panel.querySelector('.notif-scroll');
  var allReadBtn = panel.querySelector('.notif-hdr-allread');

  /* ====== Utility ====== */
  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function getGroupDef(id) {
    for (var i = 0; i < GROUP_DEFS.length; i++) {
      if (GROUP_DEFS[i].id === id) return GROUP_DEFS[i];
    }
    return GROUP_DEFS[GROUP_DEFS.length - 1];
  }

  /* ====== Grouping ====== */
  function buildGroups() {
    var groupMap = {};
    cfg.items.forEach(function (item) {
      var gid = item.group || 'others';
      if (!groupMap[gid]) groupMap[gid] = [];
      groupMap[gid].push(item);
    });

    var result = [];
    GROUP_DEFS.forEach(function (def) {
      var items = groupMap[def.id];
      if (!items || items.length === 0) return;
      var group = { def: def, items: items, entries: null };
      if (def.id === 'translation') {
        group.entries = buildTranslationEntries(items);
      }
      result.push(group);
    });
    return result;
  }

  /* ====== Translation Aggregation by appID + title type ====== */
  function buildTranslationEntries(items) {
    var aggBuckets = {};  // key = appID + '||' + translationType
    var singles = [];

    items.forEach(function (item) {
      if (item._aggregatable && item.appID) {
        var key = item.appID + '||' + (item._translationType || '');
        if (!aggBuckets[key]) aggBuckets[key] = { appID: item.appID, translationType: item._translationType, items: [] };
        aggBuckets[key].items.push(item);
      } else {
        singles.push({ type: 'single', item: item });
      }
    });

    var entries = [];
    Object.keys(aggBuckets).forEach(function (key) {
      var bucket = aggBuckets[key];
      if (bucket.items.length > 2) {
        entries.push({ type: 'agg', appID: bucket.appID, translationType: bucket.translationType, items: bucket.items });
      } else {
        bucket.items.forEach(function (it) {
          entries.push({ type: 'single', item: it });
        });
      }
    });

    singles.forEach(function (s) { entries.push(s); });

    // Sort: aggregated cards first (by first item position), then singles by original position
    entries.sort(function (a, b) {
      var ia = a.type === 'agg' ? cfg.items.indexOf(a.items[0]) : cfg.items.indexOf(a.item);
      var ib = b.type === 'agg' ? cfg.items.indexOf(b.items[0]) : cfg.items.indexOf(b.item);
      return ia - ib;
    });

    return entries;
  }

  function getAggTitle(entry) {
    var app = entry.appID;
    switch (entry.translationType) {
      case 'text_translation': return app + ' Text Translation';
      case 'announcement_translation': return app + ' Announcement Translation';
      case 'text_updated': return 'Text Translation Updated - ' + app;
      default: return app;
    }
  }

  /* ====== Render ====== */
  var groupCollapseState = {};

  function renderAll() {
    scrollEl.innerHTML = '';
    var groups = buildGroups();

    if (groups.length === 0) {
      scrollEl.innerHTML = '<div class="notif-empty">No notifications</div>';
      updateBadge();
      return;
    }

    groups.forEach(function (g) {
      scrollEl.appendChild(renderGroup(g));
    });
    updateBadge();
  }

  function renderGroup(g) {
    var isUrgent = g.def.id === 'urgent';
    var sec = document.createElement('div');
    sec.className = 'notif-grp';
    if (isUrgent) sec.classList.add('is-urgent');
    if (g.def.collapsible) sec.classList.add('collapsible');
    sec.dataset.group = g.def.id;
    if (g.def.collapsible && groupCollapseState[g.def.id]) sec.classList.add('collapsed');

    // Group header
    var hdr = document.createElement('div');
    hdr.className = 'notif-grp-hdr';
    var chevronHTML = g.def.collapsible ? '<span class="notif-grp-chevron">' + ICON_CHEVRON + '</span>' : '';
    hdr.innerHTML = [
      '<div class="notif-grp-hdr-left">',
      '  <span class="notif-grp-emoji">' + g.def.emoji + '</span>',
      '  <span class="notif-grp-label">' + esc(g.def.label) + '</span>',
      '  <span class="notif-grp-badge">' + g.items.length + '</span>',
      '</div>',
      '<div class="notif-grp-hdr-right">',
      '  <span class="notif-grp-read">Mark Read</span>',
      '  ' + chevronHTML,
      '</div>'
    ].join('');
    sec.appendChild(hdr);

    if (g.def.collapsible) {
      hdr.addEventListener('click', function (e) {
        if (e.target.closest('.notif-grp-read')) return;
        sec.classList.toggle('collapsed');
        groupCollapseState[g.def.id] = sec.classList.contains('collapsed');
      });
    }

    hdr.querySelector('.notif-grp-read').addEventListener('click', function (e) {
      e.stopPropagation();
      markGroupRead(g.def.id);
    });

    // Group body
    var body = document.createElement('div');
    body.className = 'notif-grp-body';

    if (g.entries) {
      g.entries.forEach(function (entry) {
        if (entry.type === 'agg') {
          body.appendChild(renderAggCard(entry));
        } else {
          body.appendChild(renderCard(entry.item));
        }
      });
    } else {
      g.items.forEach(function (item) {
        body.appendChild(renderCard(item));
      });
    }

    sec.appendChild(body);
    return sec;
  }

  function renderCard(item) {
    var card = document.createElement('div');
    card.className = 'notif-card';
    card.dataset.id = item.id;

    var isUrgent = item.group === 'urgent';
    var hasIcon = !isUrgent && item.icon && CARD_ICON_MAP[item.icon];
    var hasDesc = !isUrgent && item.description;
    var html = '';

    html += '<button class="notif-dismiss" title="Dismiss">' + ICON_CLOSE + '</button>';

    if (isUrgent) {
      // Urgent style: title on first line, Urgent tag + time on second line
      html += '<div class="notif-card-title">' + esc(item.title) + '</div>';
      html += '<div class="notif-card-meta">';
      html += '<span class="notif-card-urgent-tag">Urgent</span>';
      if (item.time) html += '<span class="notif-card-time">' + esc(item.time) + '</span>';
      html += '</div>';
    } else if (hasIcon || hasDesc) {
      html += '<div class="notif-card-row">';
      if (hasIcon) html += '<div class="notif-card-icon ' + item.icon + '">' + CARD_ICON_MAP[item.icon] + '</div>';
      html += '<div class="notif-card-body">';
      html += '<div class="notif-card-title">' + esc(item.title) + '</div>';
      if (hasDesc) html += '<div class="notif-card-desc">' + esc(item.description) + '</div>';
      html += '</div>';
      if (item.time) html += '<span class="notif-card-time">' + esc(item.time) + '</span>';
      html += '</div>';
    } else {
      html += '<div class="notif-card-row">';
      html += '<div class="notif-card-body"><div class="notif-card-title">' + esc(item.title) + '</div></div>';
      if (item.time) html += '<span class="notif-card-time">' + esc(item.time) + '</span>';
      html += '</div>';
    }

    card.innerHTML = html;

    card.querySelector('.notif-dismiss').addEventListener('click', function (e) {
      e.stopPropagation();
      removeItem(item.id);
      if (cfg.onDismiss) cfg.onDismiss(item);
    });

    card.addEventListener('click', function (e) {
      if (e.target.closest('.notif-dismiss')) return;
      markItemRead(item.id);
      if (cfg.onItemClick) cfg.onItemClick(item);
    });

    return card;
  }

  function renderAggCard(entry) {
    var wrapper = document.createElement('div');
    wrapper.className = 'notif-agg';

    var aggTitle = getAggTitle(entry);
    var latestTime = entry.items[0] ? entry.items[0].time : '';

    var hdr = document.createElement('div');
    hdr.className = 'notif-agg-hdr';
    hdr.innerHTML = [
      '<div class="notif-agg-hdr-left">',
      '  <div class="notif-agg-icon">' + ICON_DOC + '</div>',
      '  <div class="notif-agg-info">',
      '    <div class="notif-agg-title">' + esc(aggTitle) + '</div>',
      '    <div class="notif-agg-sub">' + esc(latestTime) + ' · Click to expand</div>',
      '  </div>',
      '</div>',
      '<div class="notif-agg-hdr-right">',
      '  <span class="notif-agg-count">' + entry.items.length + '</span>',
      '  <span class="notif-agg-chevron">' + ICON_CHEVRON + '</span>',
      '</div>'
    ].join('');
    wrapper.appendChild(hdr);

    hdr.addEventListener('click', function () {
      wrapper.classList.toggle('expanded');
    });

    var detail = document.createElement('div');
    detail.className = 'notif-agg-detail';

    entry.items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'notif-agg-item';
      row.dataset.id = item.id;
      row.innerHTML = [
        '<span class="notif-agg-item-dot"></span>',
        '<span class="notif-agg-item-title">' + esc(item.title) + '</span>',
        item.time ? '<span class="notif-agg-item-time">' + esc(item.time) + '</span>' : '',
        '<button class="notif-agg-item-del" title="Delete">' + ICON_CLOSE + '</button>'
      ].join('');

      row.querySelector('.notif-agg-item-del').addEventListener('click', function (e) {
        e.stopPropagation();
        removeItem(item.id);
        if (cfg.onDismiss) cfg.onDismiss(item);
      });

      row.addEventListener('click', function (e) {
        if (e.target.closest('.notif-agg-item-del')) return;
        e.stopPropagation();
        markItemRead(item.id);
        if (cfg.onItemClick) cfg.onItemClick(item);
      });

      detail.appendChild(row);
    });

    wrapper.appendChild(detail);
    return wrapper;
  }

  function updateBadge() {
    var total = cfg.items.length;
    var unread = getUnreadCount();
    countEl.textContent = total > 0 ? total + ' items' : '';
    if (unread > 0) {
      badgeEl.style.display = 'flex';
      badgeEl.querySelector('span').textContent = unread > 99 ? '99+' : unread;
    } else {
      badgeEl.style.display = 'none';
    }
  }

  function getUnreadCount() {
    return cfg.items.filter(function (it) { return it.unread !== false; }).length;
  }

  function getUrgentItems() {
    return cfg.items.filter(function (it) { return it.group === 'urgent'; }).slice();
  }

  /* ====== Operations ====== */
  function markItemRead(id) {
    cfg.items = cfg.items.filter(function (it) { return it.id !== id; });
    renderAll();
  }

  function markGroupRead(groupId) {
    cfg.items = cfg.items.filter(function (it) { return it.group !== groupId; });
    renderAll();
    if (cfg.onMarkGroupRead) cfg.onMarkGroupRead(groupId);
  }

  function markAllRead() {
    cfg.items = [];
    renderAll();
    if (cfg.onMarkAllRead) cfg.onMarkAllRead();
  }

  function removeItem(id) {
    cfg.items = cfg.items.filter(function (it) { return it.id !== id; });
    renderAll();
  }

  function addItem(item) {
    item = normalizeItem(item, Date.now());
    cfg.items.unshift(item);
    renderAll();
  }

  function setItems(items) {
    cfg.items = items.map(normalizeItem);
    renderAll();
  }

  /* ====== Panel ====== */
  function openPanel() { panel.classList.add('show'); overlay.classList.add('show'); }
  function closePanel() { panel.classList.remove('show'); overlay.classList.remove('show'); }
  function togglePanel() { panel.classList.contains('show') ? closePanel() : openPanel(); }

  bell.addEventListener('click', function (e) { e.stopPropagation(); togglePanel(); });
  overlay.addEventListener('click', closePanel);
  allReadBtn.addEventListener('click', markAllRead);
  panel.addEventListener('click', function (e) { e.stopPropagation(); });

  /* ====== Init ====== */
  renderAll();
  var existingBell = document.getElementById('notifBell');
  var existingPanel = document.getElementById('notifPanel');
  if (existingBell) existingBell.style.display = 'none';
  if (existingPanel) existingPanel.style.display = 'none';

  /* ====== Public API ====== */
  window.Notifications = {
    open: openPanel,
    close: closePanel,
    toggle: togglePanel,
    setItems: setItems,
    addItem: addItem,
    removeItem: removeItem,
    markAllRead: markAllRead,
    markGroupRead: markGroupRead,
    markItemRead: markItemRead,
    getUnreadCount: getUnreadCount,
    getItems: function () { return cfg.items.slice(); },
    getUrgentItems: getUrgentItems,
    setConfig: function (newCfg) {
      Object.assign(cfg, newCfg);
      if (newCfg.items) cfg.items = newCfg.items.map(normalizeItem);
      if (newCfg.title) panel.querySelector('.notif-hdr-title').textContent = newCfg.title;
      renderAll();
    }
  };
})();

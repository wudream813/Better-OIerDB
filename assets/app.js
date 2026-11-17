/* ============================================================
 * OI·竞迹 — app.js（前端应用：路由 + 四大功能视图 + 图表）
 * 消费 assets/data.js 生成的 window.OIER_DATA（结构化数据）
 * ============================================================ */
(function () {
  'use strict';

  var DB = null;
  var view = document.getElementById('view');

  /* ---------------- 工具函数 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function debounce(fn, delay) { var timer; return function () { var args = arguments, self = this; clearTimeout(timer); timer = setTimeout(function () { fn.apply(self, args); }, delay); }; }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  var TYPE_COLOR = { 'NOI': 'var(--t-noi)', 'NOIP': 'var(--t-noip)', 'CSP-S': 'var(--t-csps)', 'CSP-J': 'var(--t-cspj)' };
  var TYPE_CLASS = { 'NOI': 'c-noi', 'NOIP': 'c-noip', 'CSP-S': 'c-csps', 'CSP-J': 'c-cspj' };
  var AWARD_CLASS = { '金牌': 'gold', '银牌': 'silver', '铜牌': 'bronze', '一等奖': 'a1', '二等奖': 'a2', '三等奖': 'a3' };
  var SEG_CLASS = { '金牌': 'seg-gold', '银牌': 'seg-silver', '铜牌': 'seg-bronze', '一等奖': 'seg-a1', '二等奖': 'seg-a2', '三等奖': 'seg-a3' };

  function awardBadge(a) { return '<span class="badge ' + (AWARD_CLASS[a] || 'type') + '">' + esc(a) + '</span>'; }
  function typeDot(t) { return '<span class="type-dot ' + esc(t) + '" title="' + esc(t) + '"></span>'; }
  function verifyBadge(r) {
    if (r.verified === null) return '<span class="badge type" title="数据源未提供逐条官方核验状态">来自 OIerDb</span>';
    return r.verified
      ? '<span class="badge ok" title="已对照来源核验">✓ 已核验</span>'
      : '<span class="badge warn" title="' + esc(r.note || '待人工核验') + '">⚠ 待核验</span>';
  }
  function scoreLabel(score) { return score == null || !Number.isFinite(Number(score)) ? '—' : String(score); }
  function rankPill(rank) {
    var cls = rank === 1 ? ' r1' : rank === 2 ? ' r2' : rank === 3 ? ' r3' : '';
    return '<span class="rank-pill' + cls + '">' + rank + '</span>';
  }
  function contestById(id) { return DB.contestById[id]; }
  function personLink(p, extra) {
    return '<a href="#/player/' + p.id + '"' + (extra || '') + '>' + esc(p.name) + '</a>';
  }

  /* ---------------- 可嵌入选手卡片 ---------------- */
  /* 卡片是独立的静态页 card.html，可被任意页面用 iframe 引用；
     这里负责生成地址、iframe 代码，以及档案页的预览弹窗。 */
  var EMBED_HEIGHT = { card: 220, mini: 68 };
  var EMBED_MAXW = { card: 380, mini: 560 };

  function siteBaseUrl() {
    return location.origin + location.pathname.replace(/[^/]*$/, '');
  }
  function currentSiteTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function cardUrl(p, opt, previewTheme, copiedAt) {
    var contest = p.bestContestId != null ? contestById(p.bestContestId) : null;
    var snapshot = {
      snapshot: '1', id: p.id, name: p.name, py: p.py || p.ini || '',
      school: p.currentSchool || '', province: p.province || '', grade: p.currentGrade || '',
      count: p.count || 0, first: p.firstYear || '', last: p.lastYear || '', cohort: p.cohort || '',
      award: p.bestAward || '', rank: p.bestRank || '',
      contest: contest ? contest.name : '', contestYear: contest ? contest.year : '',
      version: DB.meta.version, staticVersion: DB.meta.staticVersion || '', copiedAt: copiedAt || ''
    };
    var q = Object.keys(snapshot).map(function (key) { return key + '=' + encodeURIComponent(snapshot[key]); });
    if (opt.variant !== 'card') q.push('variant=' + encodeURIComponent(opt.variant));
    if (opt.theme !== 'auto') q.push('theme=' + encodeURIComponent(opt.theme));
    else if (previewTheme) q.push('theme=' + encodeURIComponent(previewTheme));
    if (!opt.link) q.push('link=0');
    return siteBaseUrl() + 'card.html?' + q.join('&');
  }
  function embedSnippet(p, opt, copiedAt) {
    var attrs = [
      'src="' + cardUrl(p, opt, null, copiedAt) + '"',
      'width="100%"',
      'height="' + EMBED_HEIGHT[opt.variant] + '"',
      'title="' + esc(p.name) + ' · OI·竞迹 选手卡片"',
      'style="border:0;max-width:' + EMBED_MAXW[opt.variant] + 'px;min-width:260px"',
      'loading="lazy"',
      'scrolling="no"'
    ];
    if (opt.auto) attrs.push('data-oijing-card');
    var code = '<iframe ' + attrs.join(' ') + '></iframe>';
    if (opt.auto) code += '\n<script async src="' + siteBaseUrl() + 'assets/embed.js"></script>';
    return code;
  }
  function copyText(text, okMsg) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;left:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      toast(ok ? (okMsg || '已复制') : '复制失败：请手动选中代码复制');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg || '已复制'); }, fallback);
    } else fallback();
  }

  function openEmbedModal(p) {
    closeEmbedModal();
    var opt = { variant: 'card', theme: 'auto', link: true, auto: true };
    var lastFocus = document.activeElement;

    var wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.setAttribute('data-embed-modal', '');
    wrap.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="embed-title">' +
        '<div class="modal-head">' +
          '<div>' +
            '<h3 id="embed-title">嵌入选手卡片</h3>' +
            '<p class="small muted">把 <b>' + esc(p.name) + '</b> 的竞赛成绩卡片放进个人主页、博客、文档或简历。</p>' +
          '</div>' +
          '<button class="modal-close" data-act="close-embed" type="button" aria-label="关闭">×</button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div class="embed-stage">' +
            '<div class="embed-stage-head"><span>轻量卡片预览</span><span id="embed-size-note"></span></div>' +
            '<div class="embed-preview" id="embed-preview"></div>' +
          '</div>' +
          '<div class="embed-controls">' +
            '<div class="embed-field"><label>样式</label>' +
              '<div class="seg" data-group="variant">' +
                '<button type="button" data-v="card" class="on">标准卡片</button>' +
                '<button type="button" data-v="mini">迷你条</button>' +
              '</div>' +
            '</div>' +
            '<div class="embed-field"><label>主题</label>' +
              '<div class="seg" data-group="theme">' +
                '<button type="button" data-v="auto" class="on">跟随系统</button>' +
                '<button type="button" data-v="light">浅色</button>' +
                '<button type="button" data-v="dark">深色</button>' +
              '</div>' +
            '</div>' +
            '<div class="embed-field"><label>选项</label>' +
              '<span style="display:flex;gap:16px;flex-wrap:wrap;padding:5px 0">' +
                '<label class="embed-check"><input type="checkbox" id="embed-link" checked> 点击卡片跳转档案</label>' +
                '<label class="embed-check"><input type="checkbox" id="embed-auto" checked> 自动高度</label>' +
              '</span>' +
            '</div>' +
          '</div>' +
          '<div class="embed-code">' +
            '<div class="embed-code-head"><span>iframe 代码</span></div>' +
            '<pre id="embed-code"></pre>' +
          '</div>' +
          '<div class="modal-foot">' +
            '<button class="btn primary" data-act="copy-code" type="button">复制代码</button>' +
            '<button class="btn" data-act="copy-url" type="button">复制卡片链接</button>' +
            '<button class="btn" data-act="open-card" type="button">新标签页打开卡片</button>' +
            '<span class="hint">复制时会记录时间与数据版本；卡片仅检查上游版本清单（不下载整库），发现更新会提醒重新生成。</span>' +
          '</div>' +
          '<div class="modal-note">' +
            '支持 Markdown 的编辑器若禁止 iframe，可改用「复制卡片链接」插入文字链接。' +
            '卡片只展示公开竞赛信息（姓名 / 学校 / 省份 / 年级 / 成绩），数据版本与站内一致；' +
            '请在转载时保留「OI·竞迹 · OIerDb-ng」署名，并遵循上游 AGPL-3.0 许可。卡片是信息快照，更新后请重新生成。' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(wrap);
    document.body.style.overflow = 'hidden';

    var preview = $('#embed-preview', wrap);
    var codeEl = $('#embed-code', wrap);
    var noteEl = $('#embed-size-note', wrap);

    function syncPreview() {
      var src = cardUrl(p, opt, currentSiteTheme());
      var frame = $('iframe', preview);
      if (!frame) {
        frame = document.createElement('iframe');
        frame.setAttribute('title', p.name + ' 卡片预览');
        frame.setAttribute('scrolling', 'no');
        preview.appendChild(frame);
      }
      if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);
      frame.style.height = EMBED_HEIGHT[opt.variant] + 'px';
      preview.classList.toggle('is-mini', opt.variant === 'mini');
      codeEl.textContent = embedSnippet(p, opt);
      noteEl.textContent = (opt.variant === 'mini' ? '迷你条' : '标准卡片') + ' · 宽 100% / 最大 ' + EMBED_MAXW[opt.variant] + 'px';
    }

    function onMessage(e) {
      var d = e.data || {};
      var frame = $('iframe', preview);
      if (!frame || d.type !== 'oijing-card-height' || e.source !== frame.contentWindow) return;
      if (!opt.auto) return;
      var h = Math.max(40, Math.round(d.height));
      frame.style.height = h + 'px';
      noteEl.textContent = (opt.variant === 'mini' ? '迷你条' : '标准卡片') + ' · 实测高度 ' + h + 'px';
    }
    window.addEventListener('message', onMessage);

    function onKey(e) { if (e.key === 'Escape') closeEmbedModal(); }
    document.addEventListener('keydown', onKey);

    wrap._cleanup = function () {
      window.removeEventListener('message', onMessage);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    wrap.addEventListener('click', function (e) {
      var actEl = e.target.closest('[data-act]');
      var act = actEl && actEl.getAttribute('data-act');
      if (e.target === wrap || act === 'close-embed') return closeEmbedModal();
      if (act === 'copy-code') return copyText(embedSnippet(p, opt, new Date().toISOString()), '已复制 iframe 代码（含生成时间）');
      if (act === 'copy-url') return copyText(cardUrl(p, opt, null, new Date().toISOString()), '已复制卡片链接（含生成时间）');
      if (act === 'open-card') {
        window.open(cardUrl(p, opt, currentSiteTheme()), '_blank', 'noopener');
        return;
      }
      var segBtn = e.target.closest('.seg button');
      if (segBtn) {
        var group = segBtn.parentNode.getAttribute('data-group');
        opt[group] = segBtn.getAttribute('data-v');
        $all('button', segBtn.parentNode).forEach(function (b) { b.classList.toggle('on', b === segBtn); });
        syncPreview();
      }
    });

    var linkBox = $('#embed-link', wrap);
    var autoBox = $('#embed-auto', wrap);
    linkBox.addEventListener('change', function () { opt.link = linkBox.checked; syncPreview(); });
    autoBox.addEventListener('change', function () { opt.auto = autoBox.checked; syncPreview(); });

    syncPreview();
    var closeBtn = $('.modal-close', wrap);
    if (closeBtn) closeBtn.focus();
    wrap._p = p;
  }

  function closeEmbedModal() {
    var wrap = $('[data-embed-modal]');
    if (!wrap) return;
    if (wrap._cleanup) wrap._cleanup();
    wrap.remove();
  }

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._tm);
    t._tm = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  /* 让条形图从 0 动画展开 */
  function animateBars(root) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        $all('[data-w]', root || document).forEach(function (el) { el.style.width = el.getAttribute('data-w'); });
      });
    });
  }

  /* ---------------- 路由 ---------------- */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var qi = h.indexOf('?');
    var path = (qi >= 0 ? h.slice(0, qi) : h);
    var params = {};
    if (qi >= 0) {
      h.slice(qi + 1).split('&').forEach(function (kv) {
        if (!kv) return;
        var p = kv.split('=');
        params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      });
    }
    var seg = path.split('/').filter(Boolean);
    return { seg: seg, params: params, path: path };
  }
  function buildHash(segArr, params) {
    var qs = Object.keys(params).filter(function (k) { return params[k] !== '' && params[k] != null; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
    return '#/' + segArr.join('/') + (qs ? '?' + qs : '');
  }
  function setParamsSilently(segArr, params) {
    history.replaceState(null, '', buildHash(segArr, params));
  }

  var PAGE = { players: 60, search: 40, contest: 100 };
  var visible = { players: PAGE.players, search: PAGE.search, contest: PAGE.contest };

  var state = {
    players: { q: '', province: '', grade: '', award: '', contestType: '', year: '', sort: 'count' },
    contest: { q: '', province: '', grade: '', school: '', sortKey: 'rank', sortDir: 1 },
    analysis: { tab: 'province', metric: 'people' },
    search: { q: '' }
  };

  /* ---------------- 查询逻辑 ---------------- */
  /* 名称索引匹配：中文 / 全拼 / 首字母 / 简称（省份与学校共用） */
  function matchIndexEntry(entry, q) {
    if (!entry) return false;
    var keys = entry.keys;
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (!k) continue;
      if (k === entry.ini) { if (q.length >= 2 && k.indexOf(q) >= 0) return true; }
      else if (k.indexOf(q) >= 0) return true;
    }
    return false;
  }
  function matchProvince(q, prov) { return matchIndexEntry(DB.provinceIndex[prov], q); }
  function matchSchool(q, school) { return matchIndexEntry(DB.schoolIndex[school], q); }

  function matchPerson(q, p) {
    if (!q) return true;
    q = q.trim().toLowerCase();
    if (!q) return true;
    if (p.searchText != null) return p.searchText.indexOf(q) >= 0 || matchProvince(q, p.province);
    if (p.name.toLowerCase().indexOf(q) >= 0) return true;
    if (p.py.indexOf(q) >= 0) return true;
    if (q.length >= 2 && p.ini.indexOf(q) === 0) return true;
    for (var i = 0; i < p.aliases.length; i++) if (p.aliases[i].toLowerCase().indexOf(q) >= 0) return true;
    if (matchProvince(q, p.province)) return true;
    for (var k = 0; k < p.schools.length; k++) if (matchSchool(q, p.schools[k].n)) return true;
    for (var j = 0; j < p.records.length; j++) if (matchSchool(q, p.records[j].school)) return true;
    return false;
  }

  /* 省份 / 学校实体命中（用于搜索结果中的实体卡片） */
  function findProvinces(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    return Object.keys(DB.provinceIndex).filter(function (pv) { return matchProvince(q, pv); })
      .map(function (pv) { return DB.provinceIndex[pv]; });
  }
  function findSchools(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    return Object.keys(DB.schoolIndex).filter(function (sc) { return matchSchool(q, sc); })
      .map(function (sc) { return DB.schoolIndex[sc]; })
      .sort(function (a, b) { return b.people - a.people; });
  }
  function attachEntitySuggestions(input, onChoose) {
    var wrap = document.createElement('div');
    wrap.className = 'entity-autocomplete';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    var menu = document.createElement('div');
    menu.className = 'autocomplete-menu';
    menu.hidden = true;
    wrap.appendChild(menu);
    function update() {
      var q = input.value.trim().toLowerCase();
      if (q.length < 2) { menu.hidden = true; return; }
      var options = [];
      Object.keys(DB.provinceIndex).forEach(function (name) {
        if (matchProvince(q, name)) options.push({ kind: '省份', name: name, hint: DB.provinceIndex[name].py });
      });
      Object.keys(DB.schoolIndex).forEach(function (name) {
        if (matchSchool(q, name)) options.push({ kind: '学校', name: name, hint: DB.schoolIndex[name].province || '' });
      });
      options = options.slice(0, 8);
      menu.innerHTML = options.map(function (o, i) {
        return '<button type="button" class="suggestion" data-index="' + i + '"><span>' + esc(o.name) + '</span><small>' + esc(o.kind + (o.hint ? ' · ' + o.hint : '')) + '</small></button>';
      }).join('');
      menu.hidden = !options.length;
      $all('.suggestion', menu).forEach(function (button, i) {
        button.addEventListener('mousedown', function (e) { e.preventDefault(); menu.hidden = true; onChoose(options[i]); });
      });
    }
    input.addEventListener('input', update);
    input.addEventListener('blur', function () { setTimeout(function () { menu.hidden = true; }, 120); });
    input.addEventListener('focus', update);
  }
  /* 搜索框的省份 / 学校建议：选中后默认进入对应的选手列表（可通过 onChoose 自定义） */
  function attachQuickSuggest(input, onChoose) {
    attachEntitySuggestions(input, onChoose || function (item) {
      location.hash = buildHash(['players'], item.kind === '省份' ? { province: item.name } : { q: item.name });
    });
  }
  function gradeOrder(p) { return p.currentGradeIndex == null ? 99 : p.currentGradeIndex; }

  function getProvinces() {
    var m = {};
    DB.people.forEach(function (p) { m[p.province] = 1; });
    return Object.keys(m).sort(function (a, b) { return a.localeCompare(b, 'zh'); });
  }

  var GRADES = ['初一', '初二', '初三', '高一', '高二', '高三'];
  function matchGradeFilter(p, g) {
    if (!g) return true;
    if (g === '初中') return p.currentGradeIndex != null && p.currentGradeIndex >= 7 && p.currentGradeIndex <= 9;
    if (g === '高中') return p.currentGradeIndex != null && p.currentGradeIndex >= 10 && p.currentGradeIndex <= 12;
    return p.currentGrade === g;
  }

  function sortPeople(list, mode) {
    var arr = list.slice();
    if (mode === 'name') arr.sort(function (a, b) { return a.name.localeCompare(b.name, 'zh'); });
    else if (mode === 'grade') arr.sort(function (a, b) { return gradeOrder(a) - gradeOrder(b) || b.count - a.count; });
    else if (mode === 'gradeDesc') arr.sort(function (a, b) { return gradeOrder(b) - gradeOrder(a) || b.count - a.count; });
    else if (mode === 'recent') arr.sort(function (a, b) { return (b.lastYear || 0) - (a.lastYear || 0) || b.count - a.count; });
    else if (mode === 'award') arr.sort(function (a, b) {
      return (DB.awardOrder[b.bestAward] || 0) - (DB.awardOrder[a.bestAward] || 0) || (a.bestRank || 999) - (b.bestRank || 999);
    });
    else arr.sort(function (a, b) { return b.count - a.count || (b.lastYear || 0) - (a.lastYear || 0); });
    return arr;
  }

  function personCard(p) {
    var dup = (DB.dupGroups[p.name] || []).length > 1;
    return '<a class="pcard" href="#/player/' + p.id + '">' +
      '<div class="nm">' + esc(p.name) +
      '<span class="py">' + esc(p.py) + '</span>' +
      (dup ? '<span class="badge dup" title="库内存在同名选手">同名×' + DB.dupGroups[p.name].length + '</span>' : '') +
      (p.unverified ? '<span class="badge warn">待核验×' + p.unverified + '</span>' : '') +
      '</div>' +
      '<div class="meta">' + esc(p.province) + ' · ' + esc(p.currentSchool) + '</div>' +
      '<div class="row">' +
      '<span class="badge grade' + (p.currentGrade === '已毕业' ? ' grad' : '') + '" title="' + p.cohort + ' 届（按 ' + DB.season + '–' + (DB.season + 1) + ' 学年推算）">' + esc(p.currentGrade) + ' · ' + p.cohort + '届</span>' +
      (p.bestAward ? awardBadge(p.bestAward) : '<span class="badge type">暂无奖项记录</span>') +
      '<span class="badge type">' + p.count + ' 条记录</span>' +
      '<span class="yrs">' + p.firstYear + '–' + p.lastYear + '</span>' +
      '</div></a>';
  }

  /* ---------------- 视图：首页 ---------------- */
  function renderHome() {
    var c = DB.meta.counts;
    var hotContests = DB.contests.slice().sort(function (a, b) { return b.year - a.year || b.month - a.month; }).slice(0, 4);

    view.innerHTML =
      '<div class="view">' +
      '<section class="hero">' +
        '<div class="hero-badge">● OIerDb-ng 数据 ' + esc(DB.meta.version) + ' · 读取于 ' + esc(DB.meta.generatedAt) + '</div>' +
        '<h1>把每一份比赛记录，<br><span class="grad">变成可查询、可追溯的历程</span></h1>' +
        '<p class="sub">面向 OI 公开竞赛记录的查询与分析平台：选手档案 · 赛事结果 · 学校/地区分析 · 历程时间线。数据结构参考 OIerDb 的组织方式，每条记录带来源与核验状态。</p>' +
        '<form class="search-big" id="hero-search">' +
          '<span class="s-ic"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg></span>' +
          '<input type="text" id="hero-q" placeholder="搜索选手 / 赛事 / 学校 / 省份" autocomplete="off">' +
          '<button type="submit">搜索</button>' +
        '</form>' +
      '</section>' +

      '<div class="stats-strip">' +
        '<div class="stat"><div class="v">' + c.people + '</div><div class="k">选手记录</div></div>' +
        '<div class="stat"><div class="v">' + c.records + '</div><div class="k">参赛记录</div></div>' +
        '<div class="stat"><div class="v">' + c.contests + '</div><div class="k">覆盖赛事</div></div>' +
        '<div class="stat"><div class="v">' + c.provinces + '</div><div class="k">覆盖省份</div></div>' +
        '<div class="stat"><div class="v">' + c.schools + '<small>+</small></div><div class="k">出现学校</div></div>' +
        '<div class="stat hl"><div class="v">' + c.unverified + '</div><div class="k">待核验记录</div></div>' +
      '</div>' +

      '<div class="grid-2" style="margin-top:20px">' +
        '<div>' +
          '<h2 class="section-title">热门赛事</h2>' +
          '<div class="contest-grid">' + hotContests.map(contestCard).join('') + '</div>' +
        '</div>' +
        '<div>' +
          healthCard() +
          '<div class="card">' +
            '<div class="card-title">数据源 <span class="sub">Source 表</span></div>' +
            DB.sources.map(function (s) {
              return '<div style="margin-bottom:10px"><div style="font-size:13.5px;font-weight:600">' + esc(s.name) +
                ' <span class="badge type">' + esc(s.type) + '</span></div>' +
                '<div class="small muted">采集于 ' + esc(s.accessed) + (s.url ? ' · <a href="' + esc(s.url) + '" target="_blank" rel="noopener">链接</a>' : '') + '</div></div>';
            }).join('') +
            '<a class="small" href="#/about">查看完整数据说明 →</a>' +
          '</div>' +
          '<div class="card">' +
            '<div class="card-title">统计口径</div>' +
            '<p class="small muted" style="margin:0">统计基于 OIerDb-ng 当前发布的数据集（' + c.records + ' 条记录）；' +
            '「有记录的选手数」≠「真实参赛人数」。每个分析图表旁均附口径说明。</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '</div>';

    attachQuickSuggest($('#hero-q'));
    var form = $('#hero-search');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = $('#hero-q').value.trim();
      location.hash = buildHash(['search'], { q: q });
    });
  }

  function healthCard() {
    var c = DB.meta.counts;
    return '<div class="card">' +
      '<div class="card-title">数据体检 <span class="sub">生成时自动计算</span></div>' +
      '<div class="kv-grid" style="grid-template-columns:1fr 1fr">' +
        '<div class="kv"><b>' + c.dupNameGroups + ' 组</b><span>同名选手（需消歧）</span></div>' +
        '<div class="kv"><b>' + c.unverified + ' 条</b><span>待核验记录</span></div>' +
        '<div class="kv"><b>' + esc(DB.meta.yearRange || '—') + '</b><span>覆盖年份</span></div>' +
        '<div class="kv"><b>' + c.records + ' 条</b><span>全部带来源标注</span></div>' +
      '</div>' +
      '<p class="small muted" style="margin:10px 0 0">本页统计由当前下载的数据集计算；上游未提供的逐条官方核验和历史变更信息不会在此推断。</p>' +
      '</div>';
  }

  function contestCard(ct) {
    return '<a class="ccard" href="#/contest/' + ct.id + '">' +
      '<div class="t">' + typeDot(ct.type) + esc(ct.name) + '</div>' +
      '<div class="full">' + esc(ct.full) + '</div>' +
      '<div class="row"><span class="badge type">' + ct.year + ' 年 ' + ct.month + ' 月</span>' +
      '<span class="badge type">满分 ' + ct.maxScore + '</span>' +
      '<span class="cnt">' + ct.recordCount + ' 条记录</span></div></a>';
  }

  /* ---------------- 视图：统一搜索 ---------------- */
  function renderSearch() {
    var q = state.search.q;
    view.innerHTML =
      '<div class="view">' +
      '<h1 class="section-title">搜索</h1>' +
      '<div class="toolbar"><div class="grow">' +
      '<input type="search" id="search-q" placeholder="姓名 / 拼音 / 学校 / 省份（支持拼音、首字母、简称）/ 赛事名…" value="' + esc(q) + '">' +
      '</div><span class="count" id="search-count"></span></div>' +
      '<div id="search-body"></div>' +
      '</div>';
    var input = $('#search-q');
    attachQuickSuggest(input);
    input.addEventListener('input', function () {
      state.search.q = input.value;
      visible.search = PAGE.search;
      setParamsSilently(['search'], { q: input.value });
      renderSearchBody();
    });
    input.focus();
    renderSearchBody();
  }

  function renderSearchBody() {
    var q = state.search.q.trim();
    var body = $('#search-body');
    if (!q) {
      body.innerHTML = '<div class="empty"><div class="big">🔍</div><b>输入关键词开始搜索</b><p class="small">支持姓名、别名（如「小舟」）、拼音与首字母（如 czh）、学校（如 雅礼 / hzez / renda）、省份（如 浙江 / zhejiang / zj）、赛事名。</p></div>';
      $('#search-count').textContent = '';
      return;
    }
    var people = DB.people.filter(function (p) { return matchPerson(q, p); });
    var contests = DB.contests.filter(function (c) {
      return (c.name + c.full + c.type + c.year).toLowerCase().indexOf(q.toLowerCase()) >= 0;
    });
    var provHits = findProvinces(q), schoolHits = findSchools(q);
    $('#search-count').textContent = '选手 ' + people.length + ' · 赛事 ' + contests.length +
      (provHits.length ? ' · 省份 ' + provHits.length : '') + (schoolHits.length ? ' · 学校 ' + schoolHits.length : '');

    var html = '';
    if (provHits.length || schoolHits.length) {
      html += '<h2 class="section-title">省份 / 学校</h2><div class="entity-hits">' +
        provHits.map(function (e) {
          return '<a class="chip prov" href="#/players?province=' + encodeURIComponent(e.name) + '">📍 ' + esc(e.name) + ' <span class="py">' + esc(e.py) + '</span><span class="n">' + e.people + ' 人</span></a>';
        }).join('') +
        schoolHits.slice(0, 10).map(function (e) {
          return '<a class="chip school" href="#/players?q=' + encodeURIComponent(e.name) + '">🏫 ' + esc(e.name) + ' <span class="py">' + esc(e.ini) + (e.aliases.length ? ' · ' + esc(e.aliases[0]) : '') + '</span><span class="n">' + e.people + ' 人 · ' + e.records + ' 条</span></a>';
        }).join('') +
        '</div>';
    }
    if (people.length) {
      var dupHit = people.length > 1 && people.every(function (p) { return p.name === people[0].name; });
      html += '<h2 class="section-title">选手' + (dupHit ? ' <span class="badge dup">发现 ' + people.length + ' 位同名选手，请选择</span>' : '') + '</h2>';
      if (dupHit) {
        html += '<div class="callout info"><span class="ic">ℹ</span><span>同名选手<b>不会自动合并</b>：请按省份 / 学校确认你要查看的人。这是「Better OIerDb」的消歧设计——姓名只是检索入口，不是身份主键。</span></div>';
      }
      html += '<div class="people-grid">' + people.slice(0, visible.search).map(personCard).join('') + '</div>' +
          (people.length > visible.search ? '<button class="btn more-results" data-act="more-search">加载更多选手（已显示 ' + visible.search + ' / ' + people.length + '）</button>' : '');
    }
    if (contests.length) {
      html += '<h2 class="section-title">赛事</h2><div class="contest-grid">' + contests.map(contestCard).join('') + '</div>';
    }
    if (!people.length && !contests.length) {
      html = '<div class="empty"><div class="big">🫥</div><b>没有找到「' + esc(q) + '」相关的选手或赛事</b>' +
        '<p class="small">当前数据集共 ' + DB.meta.counts.people + ' 个选手档案、' + DB.meta.counts.contests + ' 场赛事。试试姓名、赛事名、学校名或省份拼音。</p></div>';
    }
    body.innerHTML = html;
  }

  /* ---------------- 视图：选手列表 ---------------- */
  function renderPlayers() {
    var s = state.players;
    view.innerHTML =
      '<div class="view">' +
      '<h1 class="section-title">选手查询</h1>' +
      '<div class="toolbar">' +
        '<div class="grow"><input type="search" id="pl-q" placeholder="姓名 / 拼音 / 学校 / 省份（支持拼音与简称，如 zhejiang、hzez、雅礼）…" value="' + esc(s.q) + '"></div>' +
        '<select id="pl-prov"><option value="">全部省份</option>' +
          getProvinces().map(function (pv) { return '<option value="' + esc(pv) + '"' + (s.province === pv ? ' selected' : '') + '>' + esc(pv) + '</option>'; }).join('') +
        '</select>' +
        '<select id="pl-grade" title="按当前年级筛选（' + DB.season + '–' + (DB.season + 1) + ' 学年）"><option value="">全部年级</option>' +
          GRADES.map(function (g) { return '<option value="' + esc(g) + '"' + (s.grade === g ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('') +
          '<option value="初中"' + (s.grade === '初中' ? ' selected' : '') + '>初中在读</option>' +
          '<option value="高中"' + (s.grade === '高中' ? ' selected' : '') + '>高中在读</option>' +
          '<option value="已毕业"' + (s.grade === '已毕业' ? ' selected' : '') + '>已毕业</option>' +
        '</select>' +
        '<select id="pl-sort">' +
          '<option value="count"' + (s.sort === 'count' ? ' selected' : '') + '>按记录数</option>' +
          '<option value="award"' + (s.sort === 'award' ? ' selected' : '') + '>按最佳奖项</option>' +
          '<option value="recent"' + (s.sort === 'recent' ? ' selected' : '') + '>按最近活跃</option>' +
          '<option value="grade"' + (s.sort === 'grade' ? ' selected' : '') + '>按年级（低→高）</option>' +
          '<option value="gradeDesc"' + (s.sort === 'gradeDesc' ? ' selected' : '') + '>按年级（高→低）</option>' +
          '<option value="name"' + (s.sort === 'name' ? ' selected' : '') + '>按姓名</option>' +
        '</select>' +
        '<span class="count" id="pl-count"></span>' +
      '</div>' +
      '<div class="toolbar" style="margin-top:-8px">' +
        '<select id="pl-award" aria-label="按奖项筛选"><option value="">全部奖项</option>' +
          Array.from(new Set(DB.people.reduce(function (a, p) { return a.concat(p.records.map(function (r) { return r.award; })); }, []).filter(Boolean))).sort(function (a, b) { return (DB.awardOrder[b] || 0) - (DB.awardOrder[a] || 0) || a.localeCompare(b, 'zh'); }).map(function (a) { return '<option value="' + esc(a) + '"' + (s.award === a ? ' selected' : '') + '>' + esc(a) + '</option>'; }).join('') +
        '</select>' +
        '<select id="pl-type" aria-label="按赛事类型筛选"><option value="">全部赛事类型</option>' +
          Array.from(new Set(DB.contests.map(function (c) { return c.type; }).filter(Boolean))).sort().map(function (t) { return '<option value="' + esc(t) + '"' + (s.contestType === t ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') +
        '</select>' +
        '<select id="pl-year" aria-label="按比赛年份筛选"><option value="">全部年份</option>' +
          Array.from(new Set(DB.contests.map(function (c) { return c.year; }))).sort(function (a, b) { return b - a; }).map(function (y) { return '<option value="' + y + '"' + (String(s.year) === String(y) ? ' selected' : '') + '>' + y + ' 年</option>'; }).join('') +
        '</select>' +
      '</div>' +
      '<div id="pl-hint"></div>' +
      '<div id="players-list"></div>' +
      '</div>';

    function sync() {
      setParamsSilently(['players'], { q: s.q, province: s.province, grade: s.grade, award: s.award, type: s.contestType, year: s.year, sort: s.sort });
      visible.players = PAGE.players;
      renderPlayersList();
    }
    var qEl = $('#pl-q'), pvEl = $('#pl-prov'), stEl = $('#pl-sort'), grEl = $('#pl-grade');
    var awardEl = $('#pl-award'), typeEl = $('#pl-type'), yearEl = $('#pl-year');
    qEl.addEventListener('input', debounce(function () { s.q = qEl.value; sync(); }, 160));
    pvEl.addEventListener('change', function () { s.province = pvEl.value; sync(); });
    grEl.addEventListener('change', function () { s.grade = grEl.value; sync(); });
    stEl.addEventListener('change', function () { s.sort = stEl.value; sync(); });
    awardEl.addEventListener('change', function () { s.award = awardEl.value; sync(); });
    typeEl.addEventListener('change', function () { s.contestType = typeEl.value; sync(); });
    yearEl.addEventListener('change', function () { s.year = yearEl.value; sync(); });
    attachQuickSuggest(qEl, function (item) {
      if (item.kind === '省份') { s.province = item.name; s.q = ''; qEl.value = ''; }
      else { s.q = item.name; qEl.value = item.name; }
      pvEl.value = s.province; sync();
    });
    renderPlayersList();
  }

  function renderPlayersList() {
    var s = state.players;
    var list = DB.people.filter(function (p) {
      return (!s.province || p.province === s.province) && matchGradeFilter(p, s.grade) && matchPerson(s.q, p) &&
        (!s.award || p.records.some(function (r) { return r.award === s.award; })) &&
        (!s.contestType || p.records.some(function (r) { return r.contestType === s.contestType; })) &&
        (!s.year || p.records.some(function (r) { return String(r.year) === String(s.year); }));
    });
    list = sortPeople(list, s.sort);
    $('#pl-count').textContent = '共 ' + list.length + ' 位选手';

    var hint = $('#pl-hint'), hintHtml = '';
    var q = s.q.trim();
    if (q && DB.dupGroups[q] && list.length > 1) {
      hintHtml = '<div class="callout info"><span class="ic">ℹ</span><span>「' + esc(q) + '」在库内有 <b>' + DB.dupGroups[q].length + ' 位同名选手</b>，已分别列出，不会自动合并。</span></div>';
    }
    var provHits = q ? findProvinces(q) : [], schoolHits = q ? findSchools(q) : [];
    if (provHits.length || schoolHits.length) {
      hintHtml += '<div class="entity-hits">' +
        provHits.map(function (e) {
          return '<a class="chip prov" href="#/players?province=' + encodeURIComponent(e.name) + '">📍 ' + esc(e.name) + ' <span class="py">' + esc(e.py) + '</span><span class="n">' + e.people + ' 人</span></a>';
        }).join('') +
        schoolHits.slice(0, 8).map(function (e) {
          return '<a class="chip school" href="#/players?q=' + encodeURIComponent(e.name) + '">🏫 ' + esc(e.name) + ' <span class="py">' + esc(e.ini) + '</span><span class="n">' + e.people + ' 人</span></a>';
        }).join('') +
        '</div>';
    }
    if (s.sort === 'grade' || s.sort === 'gradeDesc' || s.grade) {
      hintHtml += '<div class="small muted" style="margin:0 0 10px">年级按 <b>' + DB.season + '–' + (DB.season + 1) + ' 学年</b>推算：以最近一条记录的「当时年级」顺延，届别 = 预计高三毕业年份；7 月 NOI 记入上一学年。</div>';
    }
    hint.innerHTML = hintHtml;

    var el = $('#players-list');
    el.innerHTML = list.length
      ? '<div class="people-grid">' + list.slice(0, visible.players).map(personCard).join('') + '</div>' +
        (list.length > visible.players ? '<button class="btn more-results" data-act="more-players">加载更多选手（已显示 ' + visible.players + ' / ' + list.length + '）</button>' : '')
      : '<div class="empty"><div class="big">🫥</div><b>没有匹配的选手</b><p class="small">换个关键词，或清空筛选条件。</p></div>';
  }

  /* ---------------- 视图：选手档案（含时间线） ---------------- */
  function renderPlayer(id) {
    var p = DB.peopleById[id];
    if (!p) return render404('选手不存在');
    var dups = (DB.dupGroups[p.name] || []).filter(function (x) { return x !== p.id; });
    var rs = p.records.slice().sort(function (a, b) { return b.year - a.year || b.rank - a.rank; });

    /* 时间线按年份分组（年份倒序；同年内按比赛月份倒序。
       注意：不能用 Object.keys 的顺序——数字型键会被强制升序排列） */
    var years = {}, yearOrder = [];
    p.records.slice().sort(function (a, b) {
      if (b.year !== a.year) return b.year - a.year;
      return contestById(b.contestId).month - contestById(a.contestId).month;
    }).forEach(function (r) {
      if (!years[r.year]) { years[r.year] = []; yearOrder.push(r.year); }
      years[r.year].push(r);
    });
    var tlHtml = yearOrder.map(function (y) {
      return '<div class="tl-year">' + y + ' 年</div>' + years[y].map(function (r) {
        var ct = contestById(r.contestId);
        var top = r.rank <= 3 || r.award === '金牌';
        return '<div class="tl-item' + (top ? ' top' : '') + '">' +
          '<div class="l1">' + typeDot(ct.type) +
            '<span class="cname"><a href="#/contest/' + ct.id + '">' + esc(ct.name) + '</a></span>' +
            '<span class="badge type">' + esc(r.grade) + '</span>' +
            awardBadge(r.award) + verifyBadge(r) +
            '<span class="sp">' + ct.year + ' 年 ' + ct.month + ' 月</span>' +
          '</div>' +
          '<div class="l2">' +
            '<span>成绩 <b>' + scoreLabel(r.score) + '</b> / ' + r.maxScore + '</span>' +
            '<span>总名次 <b>' + rankPill(r.rank) + '</b> <span class="muted small">（数据集内 ' + r.total + ' 人）</span></span>' +
            '<span>省内名次 <b>' + r.provinceRank + '</b></span>' +
          '</div>' +
          '<div class="l3">🏫 ' + esc(r.school) + ' · ' + esc(r.province) +
            ' <span class="muted">| 来源：<a href="' + esc(r.sourceUrl) + '" target="_blank" rel="noopener">' + esc(sourceName(r.sourceId)) + '</a> · 采集 ' + esc(r.accessed) + '</span>' +
          '</div>' +
          (r.note ? '<div class="note-line">⚠ ' + esc(r.note) + '</div>' : '') +
          '</div>';
      }).join('');
    }).join('');

    var schoolHist = p.schools.map(function (s, i) {
      return (i ? '<span class="arr">→</span>' : '') +
        '<span class="sh">' + esc(s.n) + ' <span class="st">' + esc(s.st) + ' · ' + s.f + '–' + s.t + '</span></span>';
    }).join('');

    var tblRows = rs.map(function (r) {
      var ct = contestById(r.contestId);
      return '<tr>' +
        '<td>' + typeDot(ct.type) + ' <a href="#/contest/' + ct.id + '">' + esc(ct.name) + '</a></td>' +
        '<td>' + ct.year + '</td><td>' + esc(r.grade) + '</td>' +
        '<td class="num">' + scoreLabel(r.score) + ' / ' + r.maxScore + '</td>' +
        '<td>' + rankPill(r.rank) + '</td><td class="num">' + r.provinceRank + '</td>' +
        '<td>' + awardBadge(r.award) + '</td>' +
        '<td>' + esc(r.school) + '</td>' +
        '<td>' + verifyBadge(r) + '</td></tr>';
    }).join('');

    view.innerHTML =
      '<div class="view">' +
      '<div class="crumb"><a href="#/players">选手</a> <span>/</span> <span>' + esc(p.name) + '</span> <span class="mono muted">' + esc(p.id) + '</span></div>' +

      '<div class="profile-head">' +
        '<div class="avatar">' + esc(p.name.charAt(0)) + '</div>' +
        '<div class="info">' +
          '<h1>' + esc(p.name) +
            (dups.length ? '<span class="badge dup">同名×' + (dups.length + 1) + '</span>' : '') +
            (p.unverified ? '<span class="badge warn">待核验×' + p.unverified + '</span>' : '') +
          '</h1>' +
          '<div class="alias mono">' + esc(p.py) + (p.aliases.length ? ' · 别名：' + p.aliases.map(esc).join('、') : '') + '</div>' +
          '<div class="tags">' +
            '<span class="badge prov">📍 ' + esc(p.province) + '</span>' +
            '<span class="badge grade' + (p.currentGrade === '已毕业' ? ' grad' : '') + '" title="按 ' + DB.season + '–' + (DB.season + 1) + ' 学年推算；届别 = 预计高三毕业年份">🎓 ' + esc(p.currentGrade) + ' · ' + p.cohort + ' 届</span>' +
            '<span class="badge type">🏫 ' + esc(p.currentSchool) + '</span>' +
            '<span class="badge type">活跃 ' + p.firstYear + '–' + p.lastYear + '</span>' +
            (p.bestAward ? '<span class="muted small">最佳：' + esc(p.bestAward) + '（' + esc(contestById(p.bestContestId).name) + ' 第 ' + p.bestRank + ' 名）</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="profile-side">' +
          '<div class="profile-stats">' +
            '<div class="pstat"><div class="v">' + p.count + '</div><div class="k">参赛记录</div></div>' +
            '<div class="pstat"><div class="v">' + (p.bestRank != null ? p.bestRank : '—') + '</div><div class="k">最佳名次<small>（数据集内）</small></div></div>' +
            '<div class="pstat"><div class="v">' + new Set(p.records.map(function (r) { return r.contestId; })).size + '</div><div class="k">覆盖赛事</div></div>' +
            '<div class="pstat"><div class="v">' + new Set(p.records.map(function (r) { return r.year; })).size + '</div><div class="k">活跃年份</div></div>' +
          '</div>' +
          '<button class="btn embed-btn" type="button" data-act="embed-card" data-id="' + esc(p.id) + '" title="生成可嵌入其他网站的选手卡片">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="12" height="12" rx="2"></rect><path d="M9 21h10a2 2 0 0 0 2-2V9"></path></svg>嵌入卡片' +
          '</button>' +
        '</div>' +
      '</div>' +

      (dups.length ? '<div class="callout warn" style="margin-top:14px"><span class="ic">⚠</span><span><b>同名消歧：</b>库内还有 ' +
        dups.map(function (did) {
          var o = DB.peopleById[did];
          return '<a href="#/player/' + did + '">' + esc(o.name) + '（' + esc(o.province) + ' · ' + esc(o.currentSchool) + '）</a>';
        }).join('、') +
        '。两条档案独立维护，未做任何自动合并。</span></div>' : '') +

      (p.unverified ? '<div class="callout warn" style="margin-top:' + (dups.length ? '10' : '14') + 'px"><span class="ic">⚠</span><span>该选手有 <b>' + p.unverified + '</b> 条记录处于「待核验」状态（见时间线中的标注与备注），展示时已与已核验记录明确区分。</span></div>' : '') +

      '<div class="grid-2" style="margin-top:18px">' +
        '<div>' +
          '<h2 class="section-title">历程时间线</h2>' +
          '<div class="timeline">' + tlHtml + '</div>' +
          '<div class="split" style="margin-top:20px"><h2 class="section-title" style="margin:0">全部参赛记录</h2>' +
          '<button class="btn" data-act="export-person" data-id="' + p.id + '">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16"></path></svg>导出 CSV</button></div>' +
          '<div class="table-wrap" style="margin-top:10px;max-height:none"><table class="tbl"><thead><tr>' +
            '<th>赛事</th><th>年份</th><th>年级</th><th class="num">成绩</th><th>总名次</th><th class="num">省内</th><th>奖项</th><th>当时学校</th><th>核验</th>' +
          '</tr></thead><tbody>' + tblRows + '</tbody></table></div>' +
        '</div>' +
        '<div>' +
          '<div class="card"><div class="card-title">学校经历</div><div class="school-hist">' + schoolHist + '</div>' +
          '<p class="small muted" style="margin:10px 0 0">学校经历按来源记录整理；「当时学校」以每条参赛记录为准，升学 / 转学不会覆盖历史。</p></div>' +
          '<div class="card"><div class="card-title">数据质量</div>' +
            '<div class="kv-grid" style="grid-template-columns:1fr 1fr">' +
              '<div class="kv"><b>' + p.count + ' 条</b><span>参赛记录</span></div>' +
              '<div class="kv"><b>' + (p.count - p.unverified) + ' 条</b><span>已核验</span></div>' +
              '<div class="kv"><b>' + p.unverified + ' 条</b><span>待核验</span></div>' +
              '<div class="kv"><b>' + (dups.length ? dups.length + ' 人' : '无') + '</b><span>同名档案</span></div>' +
            '</div>' +
            '<p class="small muted" style="margin:10px 0 0">记录来源为 OIerDb-ng 发布数据；本只读站不提供在线更改，若有疑问请通过上游仓库的 Issue / 讨论反馈。</p>' +
          '</div>' +
          '<div class="card"><div class="card-title">隐私边界</div>' +
          '<p class="small muted" style="margin:0">仅收录与竞赛成绩相关的必要信息：姓名、学校、省份、年级与成绩。不推断性别、不收录联系方式与住址等个人信息。</p></div>' +
        '</div>' +
      '</div>' +
      '</div>';
  }

  function sourceName(sid) {
    var s = DB.sources.filter(function (x) { return x.id === sid; })[0];
    return s ? s.name : sid;
  }

  /* ---------------- 视图：赛事列表 ---------------- */
  function renderContests() {
    var groups = Array.from(new Set(DB.contests.map(function (c) { return c.type || '其他赛事'; })));
    groups.sort(function (a, b) { return a.localeCompare(b, 'zh'); });
    var html = groups.map(function (g) {
      var list = DB.contests.filter(function (c) { return c.type === g; }).sort(function (a, b) { return b.year - a.year || b.month - a.month; });
      return '<div><h2 class="section-title">' + typeDot(g) + ' ' + esc(g) + '</h2>' +
        '<div class="contest-grid">' + list.map(contestCard).join('') + '</div></div>';
    }).join('');
    view.innerHTML =
      '<div class="view"><h1 class="section-title">赛事结果</h1>' +
      '<div class="callout info"><span class="ic">ℹ</span><span>以下结果来自 OIerDb-ng 当前发布的数据集。记录覆盖度、字段和名次口径遵循上游数据；请查看原始来源，勿将其误认为官方完整名单。</span></div>' +
      '<div class="contest-groups">' + html + '</div></div>';
  }

  /* ---------------- 视图：单场赛事结果 ---------------- */
  function renderContest(id) {
    var ct = contestById(id);
    if (!ct) return render404('赛事不存在');
    var s = state.contest;
    var contestRecords = DB.recordsByContest[id] || DB.records.filter(function (r) { return r.contestId === id; });
    var provList = (function () {
      var m = {};
      contestRecords.forEach(function (r) { m[r.province] = 1; });
      return Object.keys(m).sort(function (a, b) { return a.localeCompare(b, 'zh'); });
    })();
    var gradeList = (function () {
      var m = {};
      contestRecords.forEach(function (r) { m[r.grade] = r.gradeIndex; });
      return Object.keys(m).sort(function (a, b) { return m[a] - m[b]; });
    })();
    var schoolList = (function () {
      var m = {};
      contestRecords.forEach(function (r) { m[r.school] = 1; });
      return Object.keys(m).sort(function (a, b) { return a.localeCompare(b, 'zh'); });
    })();

    view.innerHTML =
      '<div class="view">' +
      '<div class="crumb"><a href="#/contests">赛事</a> <span>/</span> <span>' + esc(ct.name) + '</span></div>' +
      '<div class="card" style="padding:22px 24px">' +
        '<div class="split">' +
          '<div><h1 style="font-size:24px;margin-bottom:2px">' + typeDot(ct.type) + ' ' + esc(ct.name) + '</h1>' +
          '<div class="muted small">' + esc(ct.full) + '</div></div>' +
          '<button class="btn primary" data-act="export-contest" data-id="' + ct.id + '">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16"></path></svg>导出当前结果 CSV</button>' +
        '</div>' +
        '<div class="pill-row" style="margin-top:12px">' +
          '<span class="badge type">' + ct.year + ' 年 ' + ct.month + ' 月</span>' +
          '<span class="badge type">满分 ' + ct.maxScore + '</span>' +
          '<span class="badge type">数据集内 ' + ct.recordCount + ' 条记录</span>' +
          '<span class="badge type">来源：' + esc(sourceName(ct.sourceId)) + ' · 采集于 ' + esc(ct.accessed) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="callout warn" style="margin-top:14px"><span class="ic">⚠</span><span><b>口径说明：</b>本表展示当前 OIerDb-ng 数据集中 ' + ct.recordCount + ' 条记录。数据源未提供逐条官方核验状态；请以原始公告及数据来源说明为准。</span></div>' +

      '<div class="toolbar">' +
        '<div class="grow"><input type="search" id="ct-q" placeholder="在结果中搜索姓名 / 学校 / 省份（支持拼音、简称）…" value="' + esc(s.q) + '"></div>' +
        '<select id="ct-prov"><option value="">全部省份</option>' +
          provList.map(function (pv) { return '<option value="' + esc(pv) + '"' + (s.province === pv ? ' selected' : '') + '>' + esc(pv) + '</option>'; }).join('') +
        '</select>' +
        '<select id="ct-grade" title="按参赛时年级筛选"><option value="">全部年级</option>' +
          gradeList.map(function (gd) { return '<option value="' + esc(gd) + '"' + (s.grade === gd ? ' selected' : '') + '>' + esc(gd) + '</option>'; }).join('') +
        '</select>' +
        '<select id="ct-school" title="按本场赛事记录中的学校筛选"><option value="">全部学校</option>' +
          schoolList.map(function (sc) { return '<option value="' + esc(sc) + '"' + (s.school === sc ? ' selected' : '') + '>' + esc(sc) + '</option>'; }).join('') +
        '</select>' +
        '<span class="count" id="ct-count"></span>' +
      '</div>' +
      '<div id="ct-table"></div>' +
      '</div>';

    function sync() {
      setParamsSilently(['contest', id], { q: s.q, province: s.province, grade: s.grade, school: s.school, sort: s.sortKey + (s.sortDir < 0 ? ':desc' : '') });
      visible.contest = PAGE.contest;
      renderContestTable(id);
    }
    var qEl = $('#ct-q'), pvEl = $('#ct-prov');
    qEl.addEventListener('input', debounce(function () { s.q = qEl.value; sync(); }, 160));
    pvEl.addEventListener('change', function () { s.province = pvEl.value; sync(); });
    var grEl = $('#ct-grade');
    grEl.addEventListener('change', function () { s.grade = grEl.value; sync(); });
    attachEntitySuggestions(qEl, function (item) {
      s.q = ''; qEl.value = '';
      if (item.kind === '省份') s.province = item.name; else s.school = item.name;
      pvEl.value = s.province; $('#ct-school').value = s.school; sync();
    });
    var scEl = $('#ct-school');
    scEl.addEventListener('change', function () { s.school = scEl.value; sync(); });
    renderContestTable(id);
  }

  function getContestRows(id) {
    var s = state.contest;
    var rows = (DB.recordsByContest[id] || DB.records.filter(function (r) { return r.contestId === id; })).slice();
    if (s.province) rows = rows.filter(function (r) { return r.province === s.province; });
    if (s.grade) rows = rows.filter(function (r) { return r.grade === s.grade; });
    if (s.school) rows = rows.filter(function (r) { return r.school === s.school; });
    if (s.q.trim()) {
      var q = s.q.trim().toLowerCase();
      rows = rows.filter(function (r) {
        var p = DB.peopleById[r.personId];
        return matchSchool(q, r.school) || matchProvince(q, r.province) || p.name.toLowerCase().indexOf(q) >= 0 || p.py.indexOf(q) >= 0 ||
          (q.length >= 2 && p.ini.indexOf(q) === 0);
      });
    }
    var dir = s.sortDir, key = s.sortKey;
    rows.sort(function (a, b) {
      var va, vb;
      if (key === 'name') { va = DB.peopleById[a.personId].name; vb = DB.peopleById[b.personId].name; return va.localeCompare(vb, 'zh') * dir; }
      if (key === 'school') { return a.school.localeCompare(b.school, 'zh') * dir; }
      if (key === 'province') { return a.province.localeCompare(b.province, 'zh') * dir || a.rank - b.rank; }
      if (key === 'grade') { return (a.gradeIndex - b.gradeIndex) * dir || a.rank - b.rank; }
      if (key === 'score') { va = a.score; vb = b.score; }
      else if (key === 'provRank') { va = a.provinceRank; vb = b.provinceRank; }
      else { va = a.rank; vb = b.rank; }
      return (va - vb) * dir;
    });
    return rows;
  }

  function renderContestTable(id) {
    var rows = getContestRows(id);
    var s = state.contest;
    $('#ct-count').textContent = '显示 ' + rows.length + ' 条';
    function th(label, key, cls) {
      var on = s.sortKey === key;
      var arrow = on ? '<span class="arr">' + (s.sortDir > 0 ? '▲' : '▼') + '</span>' : '';
      return '<th class="sortable' + (cls ? ' ' + cls : '') + '" data-act="sort" data-key="' + key + '">' + label + arrow + '</th>';
    }
    var displayRows = rows.slice(0, visible.contest);
    var html = rows.length ?
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      th('总名次', 'rank') + th('省内', 'provRank', 'num') + th('姓名', 'name') + th('学校', 'school') + th('省份', 'province') +
      th('年级', 'grade') + th('成绩', 'score', 'num') + '<th>奖项</th><th>核验</th><th>来源</th>' +
      '</tr></thead><tbody>' +
      displayRows.map(function (r) {
        var p = DB.peopleById[r.personId];
        return '<tr>' +
          '<td>' + rankPill(r.rank) + ' <span class="muted small">/ ' + r.total + '</span></td>' +
          '<td class="num">' + r.provinceRank + '</td>' +
          '<td class="nm-cell">' + personLink(p) + '</td>' +
          '<td>' + esc(r.school) + '</td>' +
          '<td><span class="badge prov">' + esc(r.province) + '</span></td>' +
          '<td>' + esc(r.grade) + '</td>' +
          '<td class="num"><b>' + scoreLabel(r.score) + '</b> <span class="muted small">/ ' + r.maxScore + '</span></td>' +
          '<td>' + awardBadge(r.award) + '</td>' +
          '<td>' + verifyBadge(r) + '</td>' +
          '<td><a class="small" href="' + esc(r.sourceUrl) + '" target="_blank" rel="noopener">' + esc(r.accessed) + '</a></td>' +
          '</tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="small muted" style="margin-top:10px">提示：点击表头可排序；姓名可进入选手档案；「核验」列区分已核验与待核验记录。</p>' +
      (rows.length > visible.contest ? '<button class="btn more-results" data-act="more-contest">加载更多结果（已显示 ' + visible.contest + ' / ' + rows.length + '）</button>' : '')
      : '<div class="empty"><div class="big">🫥</div><b>没有符合条件的记录</b><p class="small">试试清空搜索词或省份筛选。</p></div>';
    $('#ct-table').innerHTML = html;
  }

  /* ---------------- 视图：分析 ---------------- */
  function renderAnalysis() {
    var s = state.analysis;
    var tabs = [['province', '按省份'], ['school', '按学校'], ['year', '按年份'], ['award', '奖项分布']];
    view.innerHTML =
      '<div class="view">' +
      '<h1 class="section-title">学校 / 地区分析</h1>' +
      '<div class="callout info"><span class="ic">ℹ</span><span>以下全部为<b>描述性统计</b>：口径基于当前 OIerDb-ng 数据集中的记录，「有记录的选手数」不等于真实参赛规模。每个标签页附统计口径说明。</span></div>' +
      '<div class="tabs" id="an-tabs">' + tabs.map(function (t) {
        return '<button data-act="tab" data-v="' + t[0] + '"' + (s.tab === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>';
      }).join('') + '</div>' +
      '<div id="analysis-body"></div>' +
      '</div>';
    renderAnalysisBody();
  }

  function renderAnalysisBody() {
    var s = state.analysis;
    var body = $('#analysis-body');
    if (s.tab === 'province') body.innerHTML = analysisProvince();
    else if (s.tab === 'school') body.innerHTML = analysisSchool();
    else if (s.tab === 'year') body.innerHTML = analysisYear();
    else body.innerHTML = analysisAward();
    animateBars(body);
  }

  function metricToggle() {
    var s = state.analysis;
    return '<div class="metric-toggle">' +
      '<button data-act="metric" data-v="people"' + (s.metric === 'people' ? ' class="on"' : '') + '>选手数</button>' +
      '<button data-act="metric" data-v="records"' + (s.metric === 'records' ? ' class="on"' : '') + '>记录数</button>' +
      '</div>';
  }

  function barRows(items, colorCls) {
    var max = Math.max.apply(null, items.map(function (i) { return i.value; }).concat([1]));
    return '<div class="bars">' + items.map(function (it) {
      return '<div class="bar-row">' +
        '<span class="lb">' + (it.href ? '<a href="' + it.href + '">' + esc(it.label) + '</a>' : esc(it.label)) + '</span>' +
        '<span class="bar-track"><i class="bar-fill ' + (colorCls || '') + '" data-w="' + (it.value / max * 100).toFixed(1) + '%"></i></span>' +
        '<span class="vl">' + it.value + (it.sub ? ' <small>' + esc(it.sub) + '</small>' : '') + '</span>' +
        '</div>';
    }).join('') + '</div>';
  }

  function analysisProvince() {
    var s = state.analysis;
    var m = {};
    DB.records.forEach(function (r) {
      var e = m[r.province] = m[r.province] || { people: {}, records: 0, schools: {} };
      e.people[r.personId] = 1; e.records++; e.schools[r.school] = 1;
    });
    var items = Object.keys(m).map(function (pv) {
      return {
        label: pv,
        value: s.metric === 'people' ? Object.keys(m[pv].people).length : m[pv].records,
        sub: s.metric === 'people' ? m[pv].records + ' 条记录' : Object.keys(m[pv].people).length + ' 人',
        href: '#/players?province=' + encodeURIComponent(pv),
        _p: Object.keys(m[pv].people).length, _r: m[pv].records, _s: Object.keys(m[pv].schools).length
      };
    }).sort(function (a, b) { return b.value - a.value || a.label.localeCompare(b.label, 'zh'); });

    return '<div class="card"><div class="card-title">各省份' + (s.metric === 'people' ? '选手数' : '记录数') + ' <span class="sub">点击省份查看选手列表</span>' + metricToggle() + '</div>' +
      barRows(items) +
      '<hr class="sep">' +
      '<div class="table-wrap" style="max-height:none;box-shadow:none;border:0"><table class="tbl" style="min-width:420px"><thead><tr><th>省份</th><th class="num">选手</th><th class="num">记录</th><th class="num">出现学校</th></tr></thead><tbody>' +
      items.map(function (it) {
        return '<tr><td class="nm-cell"><a href="' + it.href + '">' + esc(it.label) + '</a></td><td class="num">' + it._p + '</td><td class="num">' + it._r + '</td><td class="num">' + it._s + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '</div>' +
      '<div class="callout info"><span class="ic">ℹ</span><span><b>统计口径：</b>选手数 = 数据集内该省份去重选手数；记录数 = 该省份的参赛记录条数；出现学校 = 记录中学校去重数（含初中）。数据覆盖不完整时，地区间不可直接比较强弱。</span></div>';
  }

  function analysisSchool() {
    var s = state.analysis;
    var m = {};
    DB.records.forEach(function (r) {
      var e = m[r.school] = m[r.school] || { people: {}, records: 0, province: r.province };
      e.people[r.personId] = 1; e.records++;
    });
    var items = Object.keys(m).map(function (sc) {
      return {
        label: sc,
        value: s.metric === 'people' ? Object.keys(m[sc].people).length : m[sc].records,
        sub: m[sc].province,
        href: '#/players?q=' + encodeURIComponent(sc),
        _p: Object.keys(m[sc].people).length, _r: m[sc].records
      };
    }).sort(function (a, b) { return b.value - a.value || a.label.localeCompare(b.label, 'zh'); });
    var top = items.slice(0, 15);

    return '<div class="card"><div class="card-title">学校排行 Top 15 <span class="sub">共 ' + items.length + ' 所学校 · 点击跳转选手列表</span>' + metricToggle() + '</div>' +
      barRows(top) +
      '</div>' +
      '<div class="callout info"><span class="ic">ℹ</span><span><b>统计口径：</b>按<b>记录中的当时学校</b>统计（含初中），同一选手升学后会在两所学校分别计数；结果受上游记录覆盖度影响，不代表学校教学质量。</span></div>';
  }

  function analysisYear() {
    var years = DB.meta.counts.years || [];
    var types = Array.from(new Set(DB.contests.map(function (c) { return c.type || '其他赛事'; })));
    var palette = ['#4f46e5','#0e9fdd','#12b76a','#f79009','#d946ef','#ef4444','#14b8a6','#64748b','#a855f7','#84cc16','#f43f5e','#0ea5e9','#ca8a04','#475467'];
    var counts = {};
    years.forEach(function (y) { counts[y] = { total: 0 }; types.forEach(function (t) { counts[y][t] = 0; }); });
    DB.records.forEach(function (r) { if (counts[r.year]) { counts[r.year][r.contestType] = (counts[r.year][r.contestType] || 0) + 1; counts[r.year].total++; } });
    var max = Math.max.apply(null, years.map(function (y) { return counts[y].total; }).concat([1]));
    max = Math.ceil(max / 4) * 4;

    var W = 960, H = 320, L = 50, R = 16, T = 22, B = 42;
    var plotW = W - L - R, plotH = H - T - B;
    var slot = years.length ? plotW / years.length : plotW;
    var bw = Math.max(8, Math.min(34, slot * 0.68));
    var svg = '<svg class="svg-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="按年份和赛事类型的记录数堆叠图">';
    for (var t2 = 0; t2 <= 4; t2++) {
      var yv = max / 4 * t2, yy = T + plotH - (yv / max) * plotH;
      svg += '<line x1="' + L + '" y1="' + yy + '" x2="' + (W - R) + '" y2="' + yy + '" stroke="var(--line)" stroke-width="1"></line>' +
        '<text x="' + (L - 8) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + Math.round(yv) + '</text>';
    }
    years.forEach(function (y, i) {
      var x = L + i * slot + (slot - bw) / 2;
      var acc = 0;
      types.forEach(function (tp, ti) {
        var v = counts[y][tp] || 0;
        if (!v) return;
        var h = (v / max) * plotH;
        var yTop = T + plotH - acc - h;
        svg += '<rect x="' + x + '" y="' + yTop + '" width="' + bw + '" height="' + Math.max(h - 1, 1) + '" rx="2" fill="' + palette[ti % palette.length] + '" opacity="0.9"><title>' + y + ' · ' + esc(tp) + '：' + v + ' 条</title></rect>';
        acc += h;
      });
      svg += '<text x="' + (x + bw / 2) + '" y="' + (T + plotH + 19) + '" text-anchor="middle" font-size="' + (years.length > 16 ? 9 : 11) + '" fill="var(--ink-2)">' + y + '</text>';
    });
    svg += '</svg>';

    var legend = '<div class="legend">' + types.map(function (tp, ti) {
      return '<span class="li"><i class="sw" style="background:' + palette[ti % palette.length] + '"></i>' + esc(tp) + '</span>';
    }).join('') + '</div>';
    var tbl = '<div class="table-wrap" style="max-height:60vh;box-shadow:none;border:0;margin-top:6px"><table class="tbl" style="min-width:460px"><thead><tr><th>年份</th>' +
      types.map(function (tp) { return '<th class="num">' + esc(tp) + '</th>'; }).join('') + '<th class="num">合计</th></tr></thead><tbody>' +
      years.map(function (y) {
        return '<tr><td class="nm-cell">' + y + '</td>' + types.map(function (tp) { return '<td class="num">' + (counts[y][tp] || 0) + '</td>'; }).join('') + '<td class="num"><b>' + counts[y].total + '</b></td></tr>';
      }).join('') + '</tbody></table></div>';
    return '<div class="card"><div class="card-title">每年记录数（按赛事类型堆叠）</div>' + legend + svg + tbl + '</div>' +
      '<div class="callout info"><span class="ic">ℹ</span><span><b>统计口径：</b>按参赛记录赛事年份计数。趋势反映 OIerDb-ng 数据集收录情况，不代表真实参赛规模变化。</span></div>';
  }

  function analysisAward() {
    var palette = ['#d99c24','#98a1ad','#ad6844','#e46b4a','#4786d8','#39a980','#8b5cf6','#14b8a6','#f97316','#64748b','#ec4899','#84cc16'];
    var allAwards = Array.from(new Set(DB.records.map(function (r) { return r.award; }))).sort(function (a, b) {
      return (DB.awardOrder[b] || 0) - (DB.awardOrder[a] || 0) || a.localeCompare(b, 'zh');
    });
    var countsByContest = {};
    DB.records.forEach(function (r) {
      var c = countsByContest[r.contestId] = countsByContest[r.contestId] || {};
      c[r.award] = (c[r.award] || 0) + 1;
    });
    var rows = DB.contests.slice().sort(function (a, b) { return b.year - a.year || a.type.localeCompare(b.type); }).map(function (ct) {
      var cnt = countsByContest[ct.id] || {};
      var n = ct.recordCount || 0;
      var segs = allAwards.map(function (aw, i) {
        var v = cnt[aw] || 0;
        if (!v || !n) return '';
        return '<i class="stacked-seg" data-w="' + (v / n * 100).toFixed(1) + '%" style="background:' + palette[i % palette.length] + '" title="' + esc(ct.name) + ' · ' + esc(aw) + '：' + v + ' 人（' + Math.round(v / n * 100) + '%）"></i>';
      }).join('');
      return '<div class="stacked-row"><span><a href="#/contest/' + ct.id + '">' + esc(ct.name) + '</a> <span class="muted small">n=' + n + '</span></span>' +
        '<span class="stacked-track">' + segs + '</span></div>';
    }).join('');
    var legend = '<div class="legend">' + allAwards.map(function (aw, i) {
      return '<span class="li"><i class="sw" style="width:11px;height:11px;border-radius:3.5px;display:inline-block;background:' + palette[i % palette.length] + '"></i>' + esc(aw) + '</span>';
    }).join('') + '</div>';
    return '<div class="card"><div class="card-title">各赛事奖项分布</div>' + legend + rows + '</div>' +
      '<div class="callout warn"><span class="ic">⚠</span><span><b>口径说明：</b>奖项字段来自 OIerDb-ng 数据集，本工具不按名次比例推算奖项。若发现缺漏或冲突，请核对对应官方公告及上游记录。</span></div>';
  }

  /* ---------------- 视图：关于数据 ---------------- */
  function renderAbout() {
    var c = DB.meta.counts;
    var unv = DB.records.filter(function (r) { return r.verified === false; });
    view.innerHTML =
      '<div class="view">' +
      '<h1 class="section-title">关于数据</h1>' +

      '<div class="card"><div class="card-title">这是什么</div>' +
      '<p style="font-size:14.5px">「OI·竞迹」是一个<b>只读的查询 / 分析工具</b>：直接读取 <a href="https://github.com/OIerDb-ng/OIerDb" target="_blank" rel="noopener">OIerDb-ng/OIerDb</a> 发布的版本化生成数据，并提供额外的检索、档案、时间线和统计视图。此站不是官方 OIerDb，也不代替上游数据维护。</p>' +
      '<p class="small muted" style="margin:0">当前数据：' + c.people + ' 个选手档案、' + c.records + ' 条参赛记录。上游未提供逐条官方核验状态时，页面只标注数据来自 OIerDb，不声称已对照官方名单。</p></div>' +

      '<div class="card"><div class="card-title">数据流水线（对应仓库结构）</div>' +
      '<div class="model-diagram">' +
        '<div class="model-stage"><span class="n">1</span><span class="t"><b>OIerDb-ng 发布数据</b><span>读取上游生成的版本化 static.json 与压缩 result.txt；不直接下载原始 raw.txt</span></span></div>' +
        '<div class="model-arrow">↓</div>' +
        '<div class="model-stage"><span class="n">2</span><span class="t"><b>上游生成器</b><span>OIerDb-ng 已完成记录解析、人员归并、学校规范化与数据生成；本工具消费其发布结果</span></span></div>' +
        '<div class="model-arrow">↓</div>' +
        '<div class="model-stage"><span class="n">3</span><span class="t"><b>查询适配层</b><span>将 OIerDb 压缩记录映射为选手、赛事、学校和参赛记录；未提供的逐条来源状态不做臆测</span></span></div>' +
        '<div class="model-arrow">↓</div>' +
        '<div class="model-stage"><span class="n">4</span><span class="t"><b>查询前端（只读）</b><span>搜索、赛事结果、时间线、统计图表 —— 对应 apps/frontend 的角色</span></span></div>' +
      '</div></div>' +

      '<div class="card"><div class="card-title">数据模型</div>' +
      '<div class="kv-grid">' +
        '<div class="kv"><b>Person 选手</b><span>稳定 ID（' + esc(DB.people[0].id) + ' 式）、姓名、别名、拼音；<b>姓名不是主键</b></span></div>' +
        '<div class="kv"><b>Participation 参赛记录</b><span>选手 × 赛事：成绩、名次、省内名次、当时年级 / 学校、核验状态、备注</span></div>' +
        '<div class="kv"><b>Contest 赛事</b><span>名称、类型、年份、月份、满分、记录数、来源与采集时间</span></div>' +
        '<div class="kv"><b>School 学校经历</b><span>学校、学段、起止年份；升学不覆盖历史，记录保留「当时学校」</span></div>' +
        '<div class="kv"><b>Source 来源</b><span>名称、类型、链接、采集时间、说明 —— 每条记录可回溯</span></div>' +
        '<div class="kv"><b>Review 复核状态</b><span>待核验 / 低置信匹配 / 同名歧义，以醒目标注展示而非隐藏</span></div>' +
      '</div></div>' +

      '<div class="card"><div class="card-title">可嵌入选手卡片 <span class="sub">Embed</span></div>' +
      '<p class="small" style="margin:0 0 10px">每位选手都有一个独立卡片页 <code>card.html?id=选手ID</code>，可以在个人主页、博客、文档或简历里用 iframe 直接引用；卡片数据与站内数据版本同步，无需自己维护。在任意选手档案页右上角点「嵌入卡片」即可实时预览、选择样式与主题并复制代码。</p>' +
      '<div class="embed-code"><div class="embed-code-head"><span>示例</span></div><pre>' +
        esc('<iframe src="' + siteBaseUrl() + 'card.html?id=' + esc(DB.people[0].id) + '" width="100%" height="220"\n        style="border:0;max-width:380px" scrolling="no" loading="lazy"></iframe>') +
      '</pre></div>' +
      '<p class="small muted" style="margin:9px 0 0">两种样式：标准卡片 / 迷你条；主题可跟随系统或固定浅色、深色。若编辑器禁止 iframe，可改用卡片链接；转载时请保留「OI·竞迹 · OIerDb-ng」署名并遵循上游 AGPL-3.0 许可。</p></div>' +

      '<div class="card"><div class="card-title">数据体检（自动计算）</div>' +
      '<div class="kv-grid">' +
        '<div class="kv"><b>' + c.people + ' 位选手</b><span>' + c.provinces + ' 个省份 · ' + c.schools + '+ 所学校</span></div>' +
        '<div class="kv"><b>' + c.records + ' 条记录</b><span>' + c.contests + ' 场赛事 · ' + esc(DB.meta.yearRange || '—') + '</span></div>' +
        '<div class="kv"><b>' + c.dupNameGroups + ' 组同名</b><span>独立档案，未自动合并</span></div>' +
        '<div class="kv"><b>' + c.unverified + ' 条待核验</b><span>已在档案与结果页标注</span></div>' +
      '</div>' +
      (unv.length ? '<hr class="sep"><div class="small"><b>待核验明细：</b><ul style="margin:6px 0 0;padding-left:20px;color:var(--muted)">' +
        unv.map(function (r) {
          var p = DB.peopleById[r.personId];
          return '<li><a href="#/player/' + p.id + '">' + esc(p.name) + '</a> · ' + esc(contestById(r.contestId).name) + ' — ' + esc(r.note) + '</li>';
        }).join('') + '</ul></div>' : '') +
      '</div>' +

      '<div class="card"><div class="card-title">数据来源（Source 表）</div>' +
      DB.sources.map(function (s) {
        return '<div class="src-card"><div class="t">' + esc(s.name) + ' <span class="badge type">' + esc(s.type) + '</span>' +
          (s.url ? '<a class="small" href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.url.replace(/^https?:\/\//, '')) + '</a>' : '') +
          '<span class="muted small" style="margin-left:auto">采集于 ' + esc(s.accessed) + '</span></div>' +
          '<div class="d">' + esc(s.note) + '</div></div>';
      }).join('') + '</div>' +

      '<div class="card"><div class="card-title">核验与消歧规则</div>' +
      '<div class="pill-row" style="margin-bottom:10px">' +
        '<span class="badge ok">✓ 已核验</span><span class="small muted">已对照来源确认</span>' +
        '<span class="badge warn">⚠ 待核验</span><span class="small muted">来源缺失 / 存在出入 / 低置信匹配，展示但明确标注</span>' +
        '<span class="badge dup">同名×N</span><span class="small muted">同名选手独立建档，绝不自动合并；合并需人工确认且可撤销</span>' +
      '</div>' +
      '<p class="small muted" style="margin:0">原则：<b>自动给候选，人工做决定</b>。错误合并比暂时漏合并更难修复，因此高置信自动通过、中置信人工确认、低置信保持独立并提示。</p></div>' +

      '<div class="card"><div class="card-title">隐私边界</div>' +
      '<div class="dl-cols"><div><ul class="dl-list yes">' +
        '<li>仅收录竞赛成绩相关的必要信息</li>' +
        '<li>姓名、学校、省份、年级、成绩、名次</li>' +
        '<li>为本人 / 监护人提供纠错与删除通道（设计目标）</li>' +
      '</ul></div><div><ul class="dl-list no">' +
        '<li>不推断、不展示性别等个人信息</li>' +
        '<li>不收录联系方式、住址、证件信息</li>' +
        '<li>不把推测信息当作事实展示</li>' +
      '</ul></div></div></div>' +

      '<div class="card"><div class="card-title">数据更新与边界</div>' +
      '<ol style="margin:0;padding-left:20px;font-size:14px;color:var(--ink-2)">' +
        '<li><b>版本检查：</b>每次载入先读取上游 SHA-512 清单，再下载对应版本的数据文件。</li>' +
        '<li><b>来源：</b>数据来自 OIerDb-ng 发布的生成结果；档案 ID、归并和记录内容遵循上游口径。</li>' +
        '<li><b>本地适配：</b>将成绩、学校、省份与参赛时年级映射为本工具的查询结构；映射规则公开在本仓库。</li>' +
        '<li><b>注意：</b>当前为只读镜像，不接收更正提交；上游未提供逐条官方来源的记录会明确标为“来自 OIerDb”。</li>' +
      '</ol></div>' +

      '</div>';
  }

  /* ---------------- 404 ---------------- */
  function render404(msg) {
    view.innerHTML = '<div class="view"><div class="empty"><div class="big">🧭</div><b>' + esc(msg || '页面不存在') + '</b>' +
      '<p class="small"><a href="#/">返回首页</a></p></div></div>';
  }

  /* ---------------- CSV 导出 ---------------- */
  function exportCSV(filename, header, rows) {
    var csv = '\ufeff' + [header].concat(rows).map(function (r) {
      return r.map(function (v) {
        v = String(v == null ? '' : v);
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(',');
    }).join('\n');
    try {
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      toast('已导出 ' + filename + '（' + rows.length + ' 行）');
    } catch (e) {
      toast('当前预览环境限制了下载，请在浏览器中打开页面后重试');
    }
  }

  function contestCSVHeader() {
    return ['总名次', '省内名次', '姓名', '选手ID', '学校', '省份', '年级', '成绩', '满分', '奖项', '核验状态', '备注', '来源', '来源链接', '采集时间', '数据版本'];
  }
  function recordToRow(r) {
    var p = DB.peopleById[r.personId];
    return [r.rank, r.provinceRank, p.name, p.id, r.school, r.province, r.grade, r.score, r.maxScore, r.award,
      r.verified ? '已核验' : '待核验', r.note || '', sourceName(r.sourceId), r.sourceUrl, r.accessed, DB.meta.version];
  }

  /* ---------------- 全局事件 ---------------- */
  view.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act');
    if (act === 'more-players') { visible.players += PAGE.players; renderPlayersList();
    } else if (act === 'more-search') { visible.search += PAGE.search; renderSearchBody();
    } else if (act === 'more-contest') { var rr = parseHash(); visible.contest += PAGE.contest; renderContestTable(rr.seg[1]);
    } else if (act === 'sort') {
      var key = el.getAttribute('data-key');
      if (state.contest.sortKey === key) state.contest.sortDir *= -1;
      else { state.contest.sortKey = key; state.contest.sortDir = (key === 'score') ? -1 : 1; }
      var r = parseHash();
      setParamsSilently(r.seg, Object.assign({}, r.params, { sort: state.contest.sortKey + (state.contest.sortDir < 0 ? ':desc' : '') }));
      renderContestTable(r.seg[1]);
    } else if (act === 'tab') {
      state.analysis.tab = el.getAttribute('data-v');
      $all('#an-tabs button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === state.analysis.tab); });
      setParamsSilently(['analysis'], { tab: state.analysis.tab, metric: state.analysis.metric });
      renderAnalysisBody();
    } else if (act === 'metric') {
      state.analysis.metric = el.getAttribute('data-v');
      setParamsSilently(['analysis'], { tab: state.analysis.tab, metric: state.analysis.metric });
      renderAnalysisBody();
    } else if (act === 'export-contest') {
      var ct = contestById(el.getAttribute('data-id'));
      var rows = getContestRows(ct.id);
      exportCSV(ct.id + '.csv', contestCSVHeader(), rows.map(recordToRow));
    } else if (act === 'export-person') {
      var p = DB.peopleById[el.getAttribute('data-id')];
      exportCSV('oier-' + p.id + '-' + p.name + '.csv', contestCSVHeader(),
        p.records.slice().sort(function (a, b) { return a.rank - b.rank === 0 ? 0 : a.year - b.year || a.rank - b.rank; }).map(recordToRow));
    } else if (act === 'embed-card') {
      var ep = DB.peopleById[el.getAttribute('data-id')];
      if (ep) openEmbedModal(ep);
    }
  });

  /* ---------------- 路由分发 ---------------- */
  function setNav(name) {
    $all('#mainnav a').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-nav') === name); });
  }

  function route() {
    closeEmbedModal();
    var h = parseHash();
    var seg = h.seg, pa = h.params;
    window.scrollTo({ top: 0 });

    if (!seg.length) {
      setNav('home');
      state.search.q = '';
      return renderHome();
    }
    switch (seg[0]) {
      case 'search':
        setNav('');
        state.search.q = pa.q || '';
        return renderSearch();
      case 'players':
        setNav('players');
        state.players = { q: pa.q || '', province: pa.province || '', grade: pa.grade || '', award: pa.award || '', contestType: pa.type || '', year: pa.year || '', sort: pa.sort || 'count' };
        return renderPlayers();
      case 'player':
        setNav('players');
        return renderPlayer(seg[1]);
      case 'contests':
        setNav('contests');
        return renderContests();
      case 'contest':
        setNav('contests');
        var srt = (pa.sort || 'rank').split(':');
        state.contest = { q: pa.q || '', province: pa.province || '', grade: pa.grade || '', school: pa.school || '', sortKey: srt[0], sortDir: srt[1] === 'desc' ? -1 : 1 };
        return renderContest(seg[1]);
      case 'analysis':
        setNav('analysis');
        state.analysis = { tab: pa.tab || 'province', metric: pa.metric || 'people' };
        return renderAnalysis();
      case 'about':
        setNav('about');
        return renderAbout();
      default:
        setNav('');
        return render404('页面不存在：' + seg.join('/'));
    }
  }

  /* ---------------- 主题 ---------------- */
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem('oijing-theme'); } catch (e) { }
    if (!saved) saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', saved);
    $('#theme-toggle').addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('oijing-theme', next); } catch (e) { }
    });
  }

  /* ---------------- 启动 ---------------- */
  function init() {
    initTheme();
    $('#ver-chip').textContent = DB.meta.version;
    $('#footer-meta').innerHTML =
      '<span><b>数据版本</b> ' + esc(DB.meta.version) + '</span>' +
      '<span><b>生成时间</b> ' + esc(DB.meta.generatedAt) + '</span>' +
      '<span><b>规模</b> ' + DB.meta.counts.people + ' 选手 · ' + DB.meta.counts.records + ' 记录 · ' + DB.meta.counts.contests + ' 赛事</span>' +
      '<span><b>流水线</b> 原始记录 → 生成器 → 结构化数据 → 前端</span>';
    window.addEventListener('hashchange', route);
    route();
  }

  function startWithData() {
    view.innerHTML = '<div class="empty"><div class="big">⏳</div><b>正在载入 OIerDb-ng 数据</b><p class="small">首次载入会下载并解析公开数据，之后可由浏览器缓存加速。</p></div>';
    Promise.resolve(window.OIER_READY).then(function (data) {
      DB = data || window.OIER_DATA;
      init();
    }).catch(function (error) {
      console.error('OIerDb data loading failed:', error);
      view.innerHTML = '<div class="empty"><div class="big">⚠️</div><b>数据载入失败</b><p class="small">无法连接 OIerDb-ng 数据源。请稍后重试，或检查网络访问权限。</p><button class="btn" id="retry-data">重试载入</button></div>';
      var retry = $('#retry-data');
      if (retry) retry.addEventListener('click', function () { location.reload(); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startWithData);
  else startWithData();
})();

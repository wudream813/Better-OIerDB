/* ============================================================
 * OI·竞迹 — 可嵌入选手卡片渲染器（card.html）
 *   card.html?id=<选手ID>&variant=card|mini&theme=auto|light|dark&link=1
 *   - 复用 assets/data.js 的 window.OIER_READY
 *   - 通过 postMessage 向父页面汇报高度，实现自适应 iframe
 * ============================================================ */
(function () {
  'use strict';

  var root = document.getElementById('card');
  var params = new URLSearchParams(location.search);
  var wantId = (params.get('id') || params.get('uid') || '').trim();
  var wantName = (params.get('name') || '').trim();
  var variant = params.get('variant') === 'mini' ? 'mini' : 'card';
  var themeParam = (params.get('theme') || 'auto').toLowerCase();
  var clickable = params.get('link') !== '0';
  var AWARD_CLASS = { '金牌': 'gold', '银牌': 'silver', '铜牌': 'bronze', '一等奖': 'a1', '二等奖': 'a2', '三等奖': 'a3' };

  document.body.className = 'card-page' + (variant === 'mini' ? ' is-mini' : '');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function awardClass(a) { return AWARD_CLASS[a] || 'type'; }

  /* ---------------- 主题 ---------------- */
  var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function applyTheme(theme) {
    var t = theme;
    if (!t || t === 'auto') t = mql && mql.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
  }
  applyTheme(themeParam);
  if (mql && mql.addEventListener) mql.addEventListener('change', function () { applyTheme(themeParam); });
  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.type === 'oijing-card-theme') applyTheme(d.theme);
  });

  /* ---------------- 高度自适应 ---------------- */
  function reportHeight() {
    if (window.parent === window) return;
    var h = Math.ceil(document.body.getBoundingClientRect().height);
    window.parent.postMessage({ type: 'oijing-card-height', id: wantId, variant: variant, height: h }, '*');
  }
  function watchSize() {
    reportHeight();
    if (window.requestAnimationFrame) requestAnimationFrame(reportHeight);
    if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.body);
    else window.addEventListener('resize', reportHeight);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reportHeight);
  }
  window.addEventListener('load', reportHeight);

  /* ---------------- 页面地址（用于「查看档案」链接） ---------------- */
  function siteBase() {
    var path = location.pathname.replace(/[^/]*$/, '');
    return location.origin + path + (path.slice(-1) === '/' ? '' : '/');
  }
  function profileUrl(id) { return siteBase() + '#/player/' + encodeURIComponent(id); }

  /* ---------------- 状态提示 ---------------- */
  function stateBox(html) {
    root.innerHTML = '<div class="oc-state">' + html + '</div>';
    watchSize();
    document.documentElement.setAttribute('data-ready', '1');
  }

  /* ---------------- 渲染 ---------------- */
  function renderCard(p, data) {
    var initials = esc(p.name.charAt(0));
    var py = p.py || p.ini || '';
    var years = p.firstYear && p.lastYear ? (p.firstYear === p.lastYear ? String(p.firstYear) : p.firstYear + '–' + p.lastYear) : '—';
    var bestContest = p.bestContestId && data.contestById[p.bestContestId] ? data.contestById[p.bestContestId] : null;
    var bestRank = p.bestRank != null ? p.bestRank : null;
    var medal = p.bestAward
      ? '<span class="oc-medal ' + awardClass(p.bestAward) + '">' + esc(p.bestAward) + '</span>'
      : '<span class="oc-medal">暂无奖项</span>';
    var bestLine = p.bestAward && bestContest
      ? '<div class="oc-best">' +
          '<span class="oc-best-label">最佳成绩</span>' +
          medal +
          '<b>' + esc(bestContest.name) + '</b>' +
          '<span class="oc-best-score">' + esc(bestContest.year) + '</span>' +
          (bestRank != null ? '<span class="oc-best-rank">第 ' + bestRank + ' 名</span>' : '') +
          (p.unverified ? '<span class="oc-best-score">· ' + p.unverified + ' 条待核验</span>' : '') +
        '</div>'
      : '<div class="oc-best"><span class="oc-best-label">最佳成绩</span>' + medal +
        '<span class="oc-best-score">该选手暂无可统计的奖项记录</span></div>';

    var href = clickable ? profileUrl(p.id) : '';
    var tagOpen = clickable
      ? '<a class="oc-card" href="' + esc(href) + '" target="_blank" rel="noopener">'
      : '<div class="oc-card oc-static">';

    if (variant === 'mini') {
      root.innerHTML =
        (clickable
          ? '<a class="oc-mini" href="' + esc(href) + '" target="_blank" rel="noopener">'
          : '<div class="oc-mini oc-static">') +
          '<span class="oc-mini-avatar">' + initials + '</span>' +
          '<b class="oc-mini-name">' + esc(p.name) + '</b>' +
          '<span class="oc-mini-sub">' + esc(p.province) + ' · ' + esc(p.currentSchool) + '</span>' +
          '<span class="oc-mini-spacer"></span>' +
          medal +
          '<span class="oc-mini-cnt">' + p.count + ' 条记录</span>' +
          '<span class="oc-mini-brand">OI·竞迹</span>' +
        (clickable ? '</a>' : '</div>');
    } else {
      root.innerHTML =
        tagOpen +
          '<div class="oc-accent"></div>' +
          '<div class="oc-body">' +
            '<div class="oc-head">' +
              '<div class="oc-avatar">' + initials + '</div>' +
              '<div class="oc-id">' +
                '<div class="oc-name">' + esc(p.name) +
                  (py ? '<span class="oc-py">' + esc(py) + '</span>' : '') +
                '</div>' +
                '<div class="oc-sub">' + esc(p.province || '省份未知') +
                  '<span class="oc-dot">·</span>' + esc(p.currentSchool || '学校未知') +
                '</div>' +
              '</div>' +
              '<span class="oc-medal ' + awardClass(p.bestAward) + '">' + esc(p.bestAward || '暂无奖项') + '</span>' +
            '</div>' +
            bestLine +
            '<div class="oc-stats">' +
              '<div class="oc-stat"><b>' + p.count + ' 条</b><span>参赛记录</span></div>' +
              '<div class="oc-stat"><b>' + (bestRank != null ? bestRank : '—') + '</b><span>最佳名次</span></div>' +
              '<div class="oc-stat"><b>' + esc(years) + '</b><span>活跃年份</span></div>' +
              '<div class="oc-stat"><b>' + esc(p.currentGrade || '—') + '</b><span>' + (p.cohort ? p.cohort + ' 届' : '届别未知') + '</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="oc-foot">' +
            '<span class="oc-brand"><i></i>OI·竞迹</span>' +
            '<span class="oc-src">OIerDb-ng 数据 ' + esc(data.meta.version) + '</span>' +
            (clickable ? '<span class="oc-go">查看档案 →</span>' : '') +
          '</div>' +
        (clickable ? '</a>' : '</div>');
    }

    watchSize();
    document.documentElement.setAttribute('data-ready', '1');
  }

  function pickPerson(data) {
    if (wantId) return data.peopleById[wantId] || null;
    if (wantName) {
      var exact = data.people.filter(function (p) { return p.name === wantName; });
      return exact[0] || data.people.filter(function (p) { return p.name.indexOf(wantName) >= 0; })[0] || null;
    }
    return null;
  }

  function snapshotData() {
    if (params.get('snapshot') !== '1') return null;
    var contestName = (params.get('contest') || '').slice(0, 100);
    var contestYear = Number(params.get('contestYear')) || 0;
    var p = {
      id: wantId || '', name: wantName || (params.get('name') || 'OI 选手').slice(0, 80),
      py: (params.get('py') || '').slice(0, 40), ini: '',
      province: (params.get('province') || '').slice(0, 40),
      currentSchool: (params.get('school') || '').slice(0, 120),
      currentGrade: (params.get('grade') || '').slice(0, 30),
      count: Number(params.get('count')) || 0,
      firstYear: Number(params.get('first')) || 0, lastYear: Number(params.get('last')) || 0,
      cohort: Number(params.get('cohort')) || 0,
      bestAward: (params.get('award') || '').slice(0, 40),
      bestRank: Number(params.get('rank')) || null, bestContestId: '' , unverified: 0
    };
    var data = { meta: { version: (params.get('version') || 'snapshot').slice(0, 60) }, contestById: {} };
    if (contestName) {
      p.bestContestId = 'snapshot-best';
      data.contestById[p.bestContestId] = { id: p.bestContestId, name: contestName, year: contestYear };
    }
    return { person: p, data: data };
  }

  function showLoadError(err) {
    if (err) console.error('card data loading failed:', err);
    stateBox('<span class="oc-state-ic">⚠️</span><b>数据载入失败</b>' +
      '<span>无法连接 OIerDb-ng 数据源。</span>' +
      '<button class="oc-retry" type="button">重试</button>');
    var btn = root.querySelector('.oc-retry');
    if (btn) btn.addEventListener('click', function () { location.reload(); });
  }

  function boot() {
    var snapshot = snapshotData();
    if (snapshot) {
      document.title = snapshot.person.name + ' · 选手卡片 · OI·竞迹';
      renderCard(snapshot.person, snapshot.data);
      return;
    }
    if (!wantId && !wantName) {
      stateBox('<span class="oc-state-ic">🔎</span><b>缺少选手参数</b><span>请从选手档案生成嵌入卡片。</span>');
      return;
    }
    stateBox('<span class="oc-state-ic">⏳</span><b>正在载入选手数据…</b>');
    function useLiveData() {
      Promise.resolve(window.OIER_READY).then(function (data) {
        var p = pickPerson(data);
        if (!p) {
          stateBox('<span class="oc-state-ic">🙈</span><b>没有找到该选手</b>' +
            '<span>数据集中不存在这条记录。</span><a href="' + esc(siteBase()) + '#/players" target="_blank" rel="noopener">去站内搜索 →</a>');
          return;
        }
        document.title = p.name + ' · 选手卡片 · OI·竞迹';
        renderCard(p, data);
      }).catch(showLoadError);
    }
    if (window.OIER_READY) return useLiveData();
    var script = document.createElement('script');
    script.src = 'assets/data.js';
    script.onload = useLiveData;
    script.onerror = showLoadError;
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

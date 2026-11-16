/* ============================================================
 * OI·竞迹 — 卡片 iframe 自适应高度助手
 * 在宿主页面引入一次即可：
 *   <script async src="https://wudream813.github.io/Better-OIerDB/assets/embed.js"></script>
 * 作用：
 *   1. 监听卡片页面 postMessage 的高度并在 iframe 上应用；
 *   2. 向卡片透传宿主页面的深浅色主题（宿主为 <html data-theme="dark"> 时）。
 * ============================================================ */
(function () {
  'use strict';
  if (window.__oijingEmbedLoaded) return;
  window.__oijingEmbedLoaded = true;

  function isCardFrame(frame) {
    if (!frame || frame.tagName !== 'IFRAME') return false;
    if (frame.hasAttribute('data-oijing-card')) return true;
    var src = frame.getAttribute('src') || '';
    return /(^|\/)card\.html(\?|$)/.test(src);
  }
  function cardFrames() {
    return Array.prototype.slice.call(document.querySelectorAll('iframe')).filter(isCardFrame);
  }
  function applyHeight(frame, height) {
    if (!height || !isFinite(height)) return;
    var h = Math.max(40, Math.round(height));
    frame.style.height = h + 'px';
    frame.setAttribute('height', String(h));
  }
  function hostTheme() {
    var attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function syncTheme(frame) {
    try {
      frame.contentWindow.postMessage({ type: 'oijing-card-theme', theme: hostTheme() }, '*');
    } catch (e) { /* 跨域/未就绪，忽略 */ }
  }

  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (!d || d.type !== 'oijing-card-height') return;
    cardFrames().forEach(function (frame) {
      if (frame.contentWindow === e.source) applyHeight(frame, d.height);
    });
  });

  function boot() {
    cardFrames().forEach(function (frame) {
      frame.addEventListener('load', function () { syncTheme(frame); });
      syncTheme(frame);
      // 兜底：部分浏览器不会回报高度时，用一个接近的默认值
      if (!frame.getAttribute('height')) applyHeight(frame, 216);
    });
    if (window.matchMedia) {
      var mql = window.matchMedia('(prefers-color-scheme: dark)');
      if (mql.addEventListener) mql.addEventListener('change', function () { cardFrames().forEach(syncTheme); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

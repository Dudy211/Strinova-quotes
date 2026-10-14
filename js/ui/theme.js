/**
 * theme.js —— 深浅色主题切换。
 * 首屏那一下由 index.html 里的内联脚本负责,这里只管后续切换。
 *
 * ★ 兼容性:不使用 ?. / ?? 等新语法,老 WebView 也能解析。
 */
import { readPref, writePref } from '../core/prefs.js';

const ICONS = { light: '🌙', dark: '☀️' };
let themeBtn = null;

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  const meta = document.getElementById('theme-color-meta');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#14101d' : '#fdf6ff');

  if (themeBtn) {
    themeBtn.textContent = ICONS[theme] !== undefined ? ICONS[theme] : ICONS.light;
    themeBtn.title = theme === 'dark' ? '切换到浅色' : '切换到深色';
  }
}

export function initTheme() {
  themeBtn = document.getElementById('theme-toggle');
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  apply(current);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      writePref('theme', next);
    });
  }

  // 用户没手动选过时,跟着系统走
  if (typeof window.matchMedia === 'function') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      if (!readPref('theme')) apply(e.matches ? 'dark' : 'light');
    };
    if (mq) {
      if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange);
      else if (typeof mq.addListener === 'function') mq.addListener(onChange);   // 老 Safari
    }
  }
}
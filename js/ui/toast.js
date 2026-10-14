/**
 * toast.js —— 页面底部的轻提示。
 */
import { CONFIG } from '../config.js';

let toastEl = null;
let toastTimer = 0;

export function initToast() {
  toastEl = document.getElementById('toast');
}

/**
 * @param {string} message
 * @param {'ok'|'err'|'info'} [type]
 */
export function showToast(message, type = 'info') {
  if (!toastEl) return;

  toastEl.textContent = message;
  toastEl.classList.remove('is-ok', 'is-err');
  if (type === 'ok') toastEl.classList.add('is-ok');
  if (type === 'err') toastEl.classList.add('is-err');

  // 重置动画:先移除再强制回流,连点也能重新触发
  toastEl.classList.remove('is-show');
  void toastEl.offsetWidth;
  toastEl.classList.add('is-show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), CONFIG.toastDuration);
}
/**
 * clipboard.js —— 复制到剪贴板,带降级方案。
 *
 * 优先 navigator.clipboard(需要 https 或 localhost);
 * 不可用时退回老牌的 execCommand('copy') + 临时 textarea。
 */

/**
 * @param {string} text
 * @returns {Promise<boolean>} 是否复制成功
 */
export async function copyText(text) {
  const value = String(text === undefined || text === null ? '' : text);
  if (!value) return false;

  // 现代 API —— 注意同步抛出也要接住
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (err) {
      console.warn('[clipboard] navigator.clipboard 失败,走降级:', err);
    }
  }

  return legacyCopy(value);
}

function legacyCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';

    // 保留用户当前滚动位置
    const scrollY = window.scrollY;
    const active = document.activeElement;

    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);

    const ok = document.execCommand('copy');
    document.body.removeChild(ta);

    if (active instanceof HTMLElement) active.focus({ preventScroll: true });
    window.scrollTo(0, scrollY);

    return ok;
  } catch (err) {
    console.error('[clipboard] 降级方案也失败了:', err);
    return false;
  }
}
/**
 * loader.js —— 取语录数据并解析。
 *
 * 有两条通道:
 *  1. 内嵌数据 —— 单文件离线版会把 txt 内容塞进 window.__YUNEKO_EMBEDDED_DATA__,
 *     这时完全不需要网络(file:// 也能跑)。
 *  2. fetch —— 正常的多文件版,去拿 quotes/quotes.txt。
 *
 * ★ 竞态安全:每次加载都带一个自增的 token,只有最后发起的请求能落地,
 *   避免用户狂点刷新时旧响应覆盖新数据。
 * ★ 兼容性:不用 globalThis / ?. / ??,老 WebView 也能解析。
 */
import { CONFIG } from '../config.js';
import { parseQuotes } from './parser.js';

let requestToken = 0;

/** 读出内嵌数据(没有就返回 null) */
function readEmbedded() {
  try {
    if (typeof window === 'undefined') return null;
    const v = window.__YUNEKO_EMBEDDED_DATA__;
    return typeof v === 'string' && v.length ? v : null;
  } catch (e) {
    return null;
  }
}

/**
 * @returns {Promise<{quotes:Array, missing:string[], stale:boolean}>}
 */
export async function loadQuotes() {
  // ---- 通道 1:内嵌数据(离线单文件版) ----
  const embedded = readEmbedded();
  if (embedded) {
    return { quotes: parseQuotes(embedded), missing: [], stale: false, embedded: true };
  }

  // ---- 通道 2:抓取 txt ----
  const token = ++requestToken;
  const url = './' + CONFIG.dataPath + '?v=' + encodeURIComponent(CONFIG.dataVersion);

  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const text = await res.text();
    if (token !== requestToken) return { quotes: [], missing: [], stale: true };

    return { quotes: parseQuotes(text), missing: [], stale: false };
  } catch (err) {
    console.warn('[loader] 读取 ' + CONFIG.dataPath + ' 失败:', err);
    if (token !== requestToken) return { quotes: [], missing: [], stale: true };
    return { quotes: [], missing: [CONFIG.dataPath], stale: false };
  }
}
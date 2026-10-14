/**
 * random.js —— 「随机一条」。
 *
 * ★ 尊重擦边开关:关掉时只在正常池里抽;开着时全池抽,
 *   但抽到擦边卡片仍然是揭开前的模糊状态(不替用户做决定喵)。
 * ★ 连续抽不重复:记忆上一次抽中的 id。
 */
import { readPref, writePref } from '../core/prefs.js';
import { showToast } from './toast.js';

let randomBtn = null;
let switchEl = null;
let lastId = null;

export function initRandom({ getAll, render, flash }) {
  randomBtn = document.getElementById('random-btn');
  switchEl = document.getElementById('nsfw-switch');

  if (switchEl) {
    switchEl.checked = readPref('randomNsfw') === '1';
    syncChip();
    switchEl.addEventListener('change', () => {
      writePref('randomNsfw', switchEl.checked ? '1' : '0');
      syncChip();
    });
  }

  if (randomBtn) randomBtn.addEventListener('click', () => {
    const all = getAll();
    if (!all.length) {
      showToast('还没有语录可以抽喵...', 'err');
      return;
    }

    const allowNsfw = switchEl ? switchEl.checked === true : false;
    const pool = allowNsfw ? all : all.filter((q) => !q.nsfw);

    if (!pool.length) {
      showToast('正常语录池是空的喵,试试打开「随机含擦边」', 'err');
      return;
    }

    const picked = pickNoRepeat(pool);
    if (!picked) return;

    lastId = picked.id;
    render([picked]);        // 单条视图
    flash(picked.id);
    showToast('今天的喵言是这条喵!', 'ok');
  });
}

function pickNoRepeat(pool) {
  if (pool.length === 1) return pool[0];
  let candidate;
  for (let i = 0; i < 12; i++) {
    candidate = pool[Math.floor(Math.random() * pool.length)];
    if (candidate.id !== lastId) return candidate;
  }
  return candidate;
}

/**
 * 给开关 chip 同步 is-on 类。
 * CSS 里已有 :has() 选择器,但老 WebView 不支持 :has(),
 * 所以这里补一个类名作为兜底 —— 新浏览器两条路都生效,不冲突。
 */
function syncChip() {
  if (!switchEl) return;
  const chip = switchEl.closest('.switch-chip');
  if (chip) chip.classList.toggle('is-on', switchEl.checked === true);
}
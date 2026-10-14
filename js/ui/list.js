/**
 * list.js —— 语录列表渲染 + 卡片交互。
 *
 * ★ 性能:用事件委托,只在容器上挂两个监听,不随语录数量增长。
 * ★ 擦边卡片的「已揭开」状态按 id 记在内存 Map 里,
 *   重新渲染(搜索、筛选、随机)时不会把用户刚揭开的内容又糊回去。
 * ★ 点卡片上的角色 chip 只做筛选,不会触发复制。
 */
import { copyText } from '../core/clipboard.js';
import { showToast } from './toast.js';

let container = null;
let emptyState = null;
let onCount = () => {};

/** id -> { revealed:boolean } */
const cardState = new Map();

const revealed = (id) => {
  const st = cardState.get(id);
  return !!st && st.revealed === true;
};
const setRevealed = (id) => cardState.set(id, { revealed: true });

export function initList({ onCounter }) {
  container = document.getElementById('quote-list');
  emptyState = document.getElementById('empty-state');
  if (onCounter) onCount = onCounter;

  // 点卡片 = 揭开(擦边未揭开时)否则复制;点 chip 由 main 层的委托处理
  container.addEventListener('click', handleClick);

  // 键盘可达:在卡片上按 Enter / 空格等同点击
  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.closest('.tag-chip')) return;   // chip 有自己的键盘行为
    const card = e.target.closest('.quote-card');
    if (!card) return;
    e.preventDefault();
    handleClick({ target: card });
  });
}

function handleClick(e) {
  // 点在角色 chip 上 → 交出去给筛选逻辑,不复制
  if (e.target.closest('.tag-chip')) return;

  const card = e.target.closest('.quote-card');
  if (!card) return;

  const id = card.dataset.id;

  // 第一次点擦边卡片:只揭开,不复制
  if (card.classList.contains('is-nsfw') && !revealed(id)) {
    setRevealed(id);
    card.classList.add('is-revealed');
    const veil = card.querySelector('.nsfw-veil');
    if (veil) veil.remove();
    updateHint(card, '已揭开 · 再点复制');
    return;
  }

  doCopy(card);
}

async function doCopy(card) {
  const id = card.dataset.id;
  const textEl = card.querySelector('.quote-text');
  const text = textEl ? textEl.textContent : '';

  const ok = await copyText(text);
  if (!ok) {
    showToast('复制失败了喵...请手动选中复制', 'err');
    return;
  }

  card.classList.add('is-copied');
  updateHint(card, '已复制 ✓');
  showToast('复制成功喵 :3', 'ok');

  clearTimeout(card._copiedTimer);
  card._copiedTimer = setTimeout(() => {
    card.classList.remove('is-copied');
    updateHint(card, hintFor(id, card.classList.contains('is-nsfw')));
  }, 1400);
}

function hintFor(id, nsfw) {
  if (nsfw && !revealed(id)) return '点击揭开';
  return '左键复制';
}

function updateHint(card, text) {
  const hint = card.querySelector('.hint');
  if (hint) hint.textContent = text;
}

/**
 * 渲染(或重渲染)。
 * @param {Array} quotes 要显示的语录(已过滤/排序)
 * @param {{total:number, nsfw:number}} meta 全量统计
 */
export function renderQuotes(quotes, meta) {
  container.querySelectorAll('.quote-card').forEach((c) => clearTimeout(c._copiedTimer));
  container.textContent = '';

  if (!quotes.length) {
    emptyState.hidden = false;
    onCount(0, meta);
    return;
  }
  emptyState.hidden = true;

  const frag = document.createDocumentFragment();

  for (const q of quotes) {
    const card = document.createElement('article');
    card.className = 'quote-card';
    card.dataset.id = q.id;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');

    if (q.nsfw) {
      card.classList.add('is-nsfw');
      if (revealed(q.id)) card.classList.add('is-revealed');
    }

    const p = document.createElement('p');
    p.className = 'quote-text';
    p.textContent = q.text;

    const foot = document.createElement('div');
    foot.className = 'card-foot';

    // 左:角色标签 chips
    const tagBox = document.createElement('div');
    tagBox.className = 'tag-row';
    for (const t of q.tags) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'tag-chip';
      chip.dataset.tag = t;
      chip.textContent = `#${t}`;
      tagBox.appendChild(chip);
    }
    if (q.nsfw) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = '擦边';
      tagBox.appendChild(badge);
    }
    foot.appendChild(tagBox);

    // 右:操作提示
    const hint = document.createElement('span');
    hint.className = 'hint';
    hint.textContent = hintFor(q.id, q.nsfw);
    foot.appendChild(hint);

    card.append(p, foot);

    if (q.nsfw && !revealed(q.id)) {
      const veil = document.createElement('span');
      veil.className = 'nsfw-veil';
      veil.textContent = '🐾 点击揭开';
      card.appendChild(veil);
      card.setAttribute('aria-label', '擦边语录,已模糊处理,点击揭开后可复制');
    } else {
      card.setAttribute('aria-label', `语录:${q.text} —— 点击复制`);
    }

    frag.appendChild(card);
  }

  container.appendChild(frag);
  onCount(quotes.length, meta);
}

/** 把某张卡片滚进视野并闪一下(随机抽取用) */
export function flashCard(id) {
  const card = container.querySelector(`.quote-card[data-id="${cssEscape(id)}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.remove('is-flash');
  void card.offsetWidth;
  card.classList.add('is-flash');
  setTimeout(() => card.classList.remove('is-flash'), 1200);
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
  return String(value).replace(/"/g, '\\"');
}
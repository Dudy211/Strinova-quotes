/**
 * main.js —— 装配层。只负责把各模块接起来,不写业务逻辑。
 *
 * 数据流:  quotes.txt ──loader──► parse ──► ALL(内存)
 *                                             │
 *              query + tag ──filter───────────┘
 *                                             ▼
 *                                        list / random 渲染
 *
 * ★ 兼容性:全文件不使用 ?. / ?? / globalThis,
 *   保证老一点的 WebView(手机端本地服务器 App 常见)也能解析执行。
 */
import { CONFIG } from './config.js';
import { loadQuotes } from './core/loader.js';
import { filterQuotes, tagCounts, loadTagFilter, saveTagFilter } from './core/search.js';
import { summarize } from './core/parser.js';
import { initTheme } from './ui/theme.js';
import { initToast, showToast } from './ui/toast.js';
import { initList, renderQuotes, flashCard } from './ui/list.js';
import { initRandom } from './ui/random.js';

/** 全部语录(保持文件里的顺序) */
let ALL = [];
let META = { total: 0, nsfw: 0, tags: [] };
/** 当前选中的角色标签,null = 全部 */
let activeTag = null;

const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------------ 启动 */

function boot() {
  applyBranding();
  initToast();
  initTheme();
  initList({ onCounter: updateCounter });
  initRandom({ getAll: () => ALL, render: renderSingle, flash: flashCard });
  bindSearch();
  bindTagBar();

  renderSkeletons(6);
  load();
}

async function load() {
  try {
    const result = await loadQuotes();

    ALL = result.quotes;
    META = summarize(ALL);

    // 上次选的标签如果已经不存在了(比如改了数据),自动清掉
    activeTag = loadTagFilter();
    if (activeTag && !hasTag(ALL, activeTag)) {
      activeTag = null;
      saveTagFilter(null);
    }

    if (!ALL.length) {
      renderQuotes([], META);
      renderTagBar();
      setEmptyText(
        result.missing.length
          ? '唔...没读到语录文件喵。请确认 ' + result.missing.join(' / ') + ' 存在,而且和网页放在一起。'
          : '语录文件是空的喵...往里写点内容再刷新吧。'
      );
      showToast('没有加载到语录喵', 'err');
      return;
    }

    if (result.missing.length) showToast('有文件没读到:' + result.missing.join('、'), 'err');

    renderTagBar();
    renderList();
  } catch (err) {
    console.error('[main] 加载出错:', err);
    showBootError(err);
  }
}

function hasTag(quotes, tag) {
  for (const q of quotes) {
    if (q.tags.indexOf(tag) !== -1) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ 渲染 */

function renderList() {
  const input = $('search-input');
  const query = input ? input.value : '';
  const hits = filterQuotes(ALL, query, activeTag);

  renderQuotes(
    hits.map((h) => h.quote),
    META
  );

  const clear = $('search-clear');
  if (clear) clear.hidden = !query;
}

/** 「随机一条」用的单条视图(不受搜索/标签筛选影响) */
function renderSingle(quotes) {
  renderQuotes(quotes, META);

  const input = $('search-input');
  const clear = $('search-clear');
  if (input) input.value = '';
  if (clear) clear.hidden = true;
}

function renderTagBar() {
  const bar = $('tag-bar');
  if (!bar) return;

  const groups = tagCounts(ALL);
  bar.textContent = '';

  // 一条标签都没有就整条隐藏,省得占地方
  if (!groups.length) {
    bar.hidden = true;
    return;
  }
  bar.hidden = false;

  bar.appendChild(makeChip('全部', null, ALL.length));
  for (const g of groups) {
    bar.appendChild(makeChip(g.tag, g.tag, g.count));
  }
}

/** 只更新选中态,不重建 DOM(搜索时用) */
function syncTagBar() {
  const bar = $('tag-bar');
  if (!bar || bar.hidden) return;

  const chips = bar.querySelectorAll('.tag-chip.is-filter');
  for (const chip of chips) {
    const v = chip.dataset.tagValue ? chip.dataset.tagValue : null;
    chip.classList.toggle('is-active', v === activeTag);
  }
}

function makeChip(label, value, count) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tag-chip is-filter';
  btn.dataset.tagValue = value === null || value === undefined ? '' : value;
  btn.textContent = value ? '#' + label : label;

  const num = document.createElement('span');
  num.className = 'chip-count';
  num.textContent = count;
  btn.appendChild(num);

  if (value === activeTag) btn.classList.add('is-active');
  return btn;
}

function updateCounter(shown, meta) {
  const el = $('counter');
  if (!el) return;

  const total = meta.total;
  const nsfw = meta.nsfw;
  if (!total) {
    el.textContent = '';
    return;
  }

  const parts = [];
  if (activeTag) parts.push('#' + activeTag);

  if (shown !== total || parts.length) {
    parts.push('找到 ' + shown + ' / ' + total + ' 条');
  } else {
    parts.push('共 ' + total + ' 条(擦边 ' + nsfw + ' 条)');
  }
  el.textContent = parts.join(' · ');
}

function renderSkeletons(n) {
  const box = $('quote-list');
  if (!box) return;
  box.textContent = '';
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div');
    s.className = 'card-skeleton';
    box.appendChild(s);
  }
}

function setEmptyText(text) {
  const el = $('empty-state');
  if (el) el.textContent = text;
}

/* ------------------------------------------------------------------ 交互 */

function bindSearch() {
  const input = $('search-input');
  const clear = $('search-clear');
  if (!input) return;

  let timer = 0;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(renderList, CONFIG.searchDebounce);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(timer);
      renderList();
    }
    if (e.key === 'Escape') {
      input.value = '';
      renderList();
    }
  });

  if (clear) {
    clear.addEventListener('click', () => {
      input.value = '';
      renderList();
      input.focus();
    });
  }
}

/** 标签栏(顶部)和卡片上的角色 chip,统一在这里处理 */
function bindTagBar() {
  const bar = $('tag-bar');
  const list = $('quote-list');

  const pick = (tag) => {
    activeTag = activeTag === tag ? null : tag;
    saveTagFilter(activeTag);
    renderList();
    syncTagBar();
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (bar) {
    bar.addEventListener('click', (e) => {
      const chip = e.target.closest('.tag-chip');
      if (!chip) return;
      const v = chip.dataset.tagValue;
      pick(v ? v : null);
    });
  }

  // 卡片上的 chip → 直接筛选(事件委托,卡片是动态渲染的)
  if (list) {
    list.addEventListener('click', (e) => {
      const chip = e.target.closest('.tag-chip');
      if (!chip || !chip.dataset.tag) return;
      pick(chip.dataset.tag);
    });
  }
}

/* ------------------------------------------------------------------ 收尾 */

function applyBranding() {
  document.title = CONFIG.title;
  const t = $('site-title');
  const s = $('site-subtitle');
  if (t) t.textContent = CONFIG.title;
  if (s) s.textContent = CONFIG.subtitle;
}

function showBootError(err) {
  const box = $('boot-error');
  if (!box) return;

  // 标记一下:主脚本报的错更具体,让兜底脚本别重复覆盖
  window.__YUNEKO_ERROR_SHOWN = true;

  const title = $('boot-error-title');
  const msg = $('boot-error-msg');
  const hint = $('boot-error-hint');
  const diag = $('boot-error-diag');
  const diagBody = $('boot-error-diag-body');

  if (title) title.textContent = '唔...加载出错了喵';
  if (msg) msg.textContent = err && err.message ? String(err.message) : '未知错误';

  if (hint) {
    hint.innerHTML =
      '页面脚本本身跑起来了,是<b>读数据或渲染</b>这一步出的问题。<br>' +
      '常见原因:语录文件路径不对、服务器不让读取 txt、或者文件里有异常字符。';
  }

  // 把环境信息和错误堆栈摊开,方便排查
  if (diag && diagBody) {
    const lines = [];
    lines.push('protocoa: ' + location.protocol);
    lines.push('href    : ' + location.href);
    lines.push('UA      : ' + navigator.userAgent);
    lines.push('');
    lines.push('错误: ' + (err && err.message ? err.message : '未知'));
    if (err && err.stack) lines.push('');
    if (err && err.stack) lines.push(String(err.stack));
    const errs = window.__YUNEKO_ERRORS || [];
    if (errs.length) {
      lines.push('');
      lines.push('此前捕获 (' + errs.length + ' 条):');
      for (let i = 0; i < errs.length; i++) {
        lines.push('  [' + (i + 1) + '] ' + errs[i].msg + ' @ ' + errs[i].where);
      }
    }
    diagBody.textContent = lines.join('\n');
    diag.hidden = false;
  }

  box.style.display = 'grid';
}

window.__YUNEKO_BOOTED = true;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

/* 开发期调试用:控制台敲 __yuneko.ALL 看数据 */
window.__yuneko = {
  get ALL() { return ALL; },
  get META() { return META; },
  get tag() { return activeTag; },
  reload: load,
};
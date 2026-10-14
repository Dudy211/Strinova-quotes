/**
 * search.js —— 模糊搜索 + 标签筛选。
 *
 * 命中方式:
 *   1. 正文直接子串包含(有加分)
 *   2. 子序列匹配 —— 例如输入「猫语录」能命中「猫娘语录集」
 *   3. 角色标签命中(标签整体匹配额外加分)
 */
import { readPref, writePref } from './prefs.js';

const TAG_FILTER_KEY = 'tagFilter';

/** 归一化:小写 + 去掉空白 */
function norm(s) {
  return String(s).toLowerCase().replace(/\s+/g, '');
}

/** 计算匹配得分。不匹配返回 -1,分数越高越相关。 */
function score(needle, haystack) {
  if (!needle) return 0;

  const idx = haystack.indexOf(needle);
  if (idx !== -1) return 1000 - idx * 2 - (haystack.length - needle.length);

  let pos = 0;
  let gaps = 0;
  for (const ch of needle) {
    const found = haystack.indexOf(ch, pos);
    if (found === -1) return -1;
    gaps += found - pos;
    pos = found + 1;
  }
  return Math.max(1, 400 - gaps * 3 - (haystack.length - needle.length));
}

/**
 * 综合得分:正文 + 标签都是搜索范围。
 * @returns {number} -1 表示不匹配
 */
function scoreQuote(needle, quote) {
  const body = norm(quote.text);
  let s = score(needle, body);

  for (const tag of quote.tags) {
    const t = norm(tag);
    if (!t) continue;

    // 标签整体命中,比正文命中更「准」
    if (t.includes(needle)) {
      s = Math.max(s, 1400 - (t.length - needle.length));
      continue;
    }

    // ★ 子序列命中才有加分;不匹配时 score() 返回 -1,
    //   必须先判掉,否则 -1 + 200 会变成正分,造成「假命中」
    const tagScore = score(needle, t);
    if (tagScore >= 0) s = Math.max(s, tagScore + 200);
  }

  return s;
}

/**
 * @param {Array} quotes
 * @param {string} query
 * @param {string|null} tag 选中的角色标签,null = 不筛选
 * @returns {Array<{quote:object, score:number}>}
 */
export function filterQuotes(quotes, query = '', tag = null) {
  const needle = norm(query);
  const hits = [];

  for (const q of quotes) {
    if (tag && !q.tags.includes(tag)) continue;

    const s = needle ? scoreQuote(needle, q) : 0;
    if (s < 0) continue;
    hits.push({ quote: q, score: s });
  }

  if (needle) hits.sort((a, b) => b.score - a.score || a.quote.id.localeCompare(b.quote.id));
  return hits;
}

/** 所有出现过的角色标签 + 每条数量(按数量降序、同数量按拼音) */
export function tagCounts(quotes) {
  const map = new Map();
  for (const q of quotes) {
    for (const t of q.tags) {
      const cur = map.get(t);
      map.set(t, (cur === undefined ? 0 : cur) + 1);
    }
  }
  return [...map.entries()]
    .map((pair) => ({ tag: pair[0], count: pair[1] }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh'));
}

/* ------------------------- 标签筛选的持久化 ------------------------- */

export function loadTagFilter() {
  return readPref(TAG_FILTER_KEY, null);
}

export function saveTagFilter(tag) {
  if (tag) writePref(TAG_FILTER_KEY, tag);
  else writePref(TAG_FILTER_KEY, '');   // 空字符串代表「全部」
}
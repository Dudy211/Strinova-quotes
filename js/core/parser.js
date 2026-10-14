/**
 * parser.js —— 纯函数:把 txt 原文解析成语录数组。
 * 不碰网络、不碰 DOM,方便单独测试和以后加格式。
 *
 * ┌ 格式 ────────────────────────────────────────────────┐
 * │  语录内容写一行                                       │
 * │  #1#香奈美#星绘      ← 紧跟的「标签行」,可省略        │
 * │                                                       │
 * │  下一条语录                                           │
 * └───────────────────────────────────────────────────────┘
 *   · 一行 = 一条语录
 *   · 标签行必须以 # 开头,里面用 # 分隔:#1 表示擦边,其余是角色名
 *   · 空行随便打,纯粹为了好看,解析不依赖它
 *   · 语录与标签行之间隔了空行也能认出来(容错)
 *   · 语录内容想以 # 开头时,写成 \# 转义
 */

/** 被认定为「擦边」的标签写法(大小写不敏感) */
const NSFW_TOKENS = new Set(['1', 'nsfw', 'r18', '18', '擦边', '涩']);

/**
 * @param {string} raw 文件原文
 * @returns {Array<{id:string, text:string, nsfw:boolean, tags:string[]}>}
 */
export function parseQuotes(raw) {
  const out = [];
  let pending = null;   // 正在攒的语录原文
  let last = null;      // 上一条已定稿的语录(给容错合并用)

  const finalize = (tagInfo) => {
    if (pending === null) return;
    const text = pending.trim();
    pending = null;
    if (!text) return;

    const entry = {
      id: `q:${out.length}`,
      text,
      nsfw: tagInfo.nsfw,
      tags: tagInfo.tags,
    };
    out.push(entry);
    last = entry;
  };

  const none = { nsfw: false, tags: [] };

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();

    // 转义:内容确实要以 # 开头
    if (trimmed.startsWith('\\#')) {
      finalize(none);
      pending = trimmed.slice(1);
      continue;
    }

    // 标签行
    if (trimmed.startsWith('#')) {
      const info = parseTags(trimmed);
      if (pending !== null) {
        finalize(info);
      } else if (last) {
        // 容错:语录和标签行之间夹了空行
        last.tags = dedupe([...last.tags, ...info.tags]);
        if (info.nsfw) last.nsfw = true;
      }
      // 既没有待定语录、也没有历史语录 → 文件开头的注释,直接忽略
      continue;
    }

    // 空行:结束当前这条
    if (trimmed === '') {
      finalize(none);
      continue;
    }

    // 普通内容行:上一行没闭合就先收掉,然后开新的
    finalize(none);
    pending = line;
  }

  finalize(none);
  return out;
}

/** `#1#香奈美#星绘` → { nsfw:true, tags:['香奈美','星绘'] } */
function parseTags(line) {
  const parts = line
    .split('#')
    .map((s) => s.trim())
    .filter(Boolean);

  const tags = [];
  let nsfw = false;

  for (const p of parts) {
    if (NSFW_TOKENS.has(p.toLowerCase())) nsfw = true;
    else tags.push(p);
  }

  return { nsfw, tags: dedupe(tags) };
}

function dedupe(arr) {
  return [...new Set(arr)];
}

/** 调试用:统计一下解析出了多少条 */
export function summarize(quotes) {
  const total = quotes.length;
  let nsfw = 0;
  const tagSet = new Set();

  for (const q of quotes) {
    if (q.nsfw) nsfw++;
    for (const t of q.tags) tagSet.add(t);
  }

  return { total, normal: total - nsfw, nsfw, tags: [...tagSet] };
}
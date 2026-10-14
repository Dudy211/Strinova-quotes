/**
 * config.js —— 全站配置。日常维护只需要动这个文件。
 */
export const CONFIG = {
  /** 网页标题与副标题 */
  title: '猫娘语录集',
  subtitle: '卡拉彼丘 · 喵言喵语收藏所',

  /** 语录数据文件(单文件,擦边靠 #1 标签判定) */
  dataPath: 'quotes/quotes.txt',

  /** 擦边语录在卡片上显示的角标文字 */
  nsfwBadge: '擦边',

  /** 搜索防抖(ms) */
  searchDebounce: 120,

  /** Toast 停留时间(ms) */
  toastDuration: 1500,

  /**
   * ★★ 数据版本号 —— 改完 txt 后把它 +1,可以绕开 GitHub Pages 的 CDN 缓存立刻生效。
   * 忘记改也没关系,最多等约 10 分钟缓存自然过期。
   */
  dataVersion: '2',

  /** localStorage 键名,换名会清空用户已保存的偏好 */
  storagePrefix: 'yuneko-quotes:',
};
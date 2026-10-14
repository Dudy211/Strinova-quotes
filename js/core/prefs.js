/**
 * prefs.js —— 用户偏好存取(localStorage)。
 * 全部包在 try/catch 里:无痕模式、禁用存储时不至于炸掉页面。
 */
import { CONFIG } from '../config.js';

const KEY = (name) => `${CONFIG.storagePrefix}${name}`;

export function readPref(name, fallback = null) {
  try {
    const v = localStorage.getItem(KEY(name));
    return v === null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}

export function writePref(name, value) {
  try {
    localStorage.setItem(KEY(name), String(value));
  } catch (e) {
    /* 存不了就算了,不影响本次使用 */
  }
}
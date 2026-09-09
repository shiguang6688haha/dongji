/* ============================================================
 * 董记 · store.js
 * 本地存储（localStorage）+ 事项/记录管理 + 导出导入
 * ============================================================ */
(function () {
  'use strict';

  const K = {
    acts:  'dj:v1:activities',
    recs:  'dj:v1:records',
    icons: 'dj:v1:icons',
    set:   'dj:v1:settings',
    meta:  'dj:v1:meta'
  };

  const DEF_SET = {
    sound: true,
    vibrate: true,
    firstDay: 1,        // 1 = 周一
    gridMax: 4,
    rangeView: 'month',
    installHintDismissed: false,
    lastBackupReminderAt: 0,
    recordCountAtReminder: 0
  };

  const REC_REMIND_THRESHOLD = 50;
  const DAY_BACKUP_REMIND = 30;

  // ---------- 内部 ----------
  let state = {
    activities: [],
    records: {},
    icons: {},
    settings: { ...DEF_SET },
    meta: { schema: 1, createdAt: Date.now() }
  };

  const pending = {};
  let timer = null;

  function safeParse(s, def) {
    if (s == null) return def;
    try { return JSON.parse(s); } catch (_) { return def; }
  }

  function flushNow() {
    for (const k of Object.keys(pending)) {
      try {
        localStorage.setItem(pending[k].key, JSON.stringify(pending[k].value));
      } catch (e) {
        if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
          window.dispatchEvent(new CustomEvent('dj:quota'));
          window.UI?.toast?.('存储空间已满，请先导出备份并清理自定义图标');
          return;
        }
        throw e;
      }
    }
    Object.keys(pending).forEach((k) => delete pending[k]);
  }

  function schedule(key, value) {
    pending[key] = { key: K[key], value };
    if (timer) clearTimeout(timer);
    timer = setTimeout(flushNow, 300);
  }

  // ---------- 日期（本地，绝不用 toISOString） ----------
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function todayYMD() {
    const t = new Date();
    return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
  }

  // YYYY-MM-DD -> UTC 天数（规避时区/DST）
  function dnum(ymd) {
    if (!ymd) return 0;
    const p = ymd.split('-');
    return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000;
  }

  // 通用格式化（避免引 Date）
  function ymdFromParts(y, m0, d) {
    return y + '-' + pad(m0 + 1) + '-' + pad(d);
  }

  // ---------- 加载 / 保存 ----------
  function load() {
    state.activities = safeParse(localStorage.getItem(K.acts), []);
    state.records    = safeParse(localStorage.getItem(K.recs), {});
    state.icons      = safeParse(localStorage.getItem(K.icons), {});
    state.settings   = Object.assign({}, DEF_SET, safeParse(localStorage.getItem(K.set), {}));
    state.meta       = safeParse(localStorage.getItem(K.meta), { schema: 1, createdAt: Date.now() });

    // 兼容旧数据：如果 activities 是空数组，自动种入预置 8 个
    if (state.activities.length === 0 && Object.keys(state.records).length === 0) {
      seedDefault();
    }
    // 修正非法记录
    Object.values(state.records).forEach((rec) => {
      Object.keys(rec).forEach((k) => {
        if (typeof rec[k] !== 'number' || rec[k] <= 0) delete rec[k];
      });
    });

    return state;
  }

  function seedDefault() {
    const base = [
      ['hair', '洗头'], ['bath', '洗澡'], ['toilet', '拉屎'],
      ['sunrise', '早起'], ['moon', '早睡'], ['dumbbell', '健身'],
      ['baduan', '八段锦'], ['book', '看书']
    ];
    const now = Date.now();
    state.activities = base.map((p, i) => ({
      id: 'a_' + Math.random().toString(36).slice(2, 8),
      name: p[1],
      icon: { t: 'b', k: p[0] },
      order: i,
      createdAt: now,
      archived: false
    }));
    schedule('acts', state.activities);
  }

  // ---------- 事项 CRUD ----------
  function uid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 8);
  }

  function addActivity(name, iconRef) {
    name = (name || '').trim().slice(0, 6);
    if (!name) return null;
    const order = state.activities.reduce((m, a) => Math.max(m, a.order || 0), -1) + 1;
    const act = {
      id: uid('a'),
      name: name,
      icon: iconRef || { t: 'b', k: 'check' },
      order: order,
      createdAt: Date.now(),
      archived: false
    };
    state.activities.push(act);
    schedule('acts', state.activities);
    return act;
  }

  function updateActivity(id, patch) {
    const a = state.activities.find((x) => x.id === id);
    if (!a) return;
    Object.assign(a, patch);
    schedule('acts', state.activities);
  }

  function archiveActivity(id) {
    const a = state.activities.find((x) => x.id === id);
    if (!a) return;
    a.archived = true;
    schedule('acts', state.activities);
  }

  function restoreActivity(id) {
    const a = state.activities.find((x) => x.id === id);
    if (!a) return;
    a.archived = false;
    schedule('acts', state.activities);
  }

  function deleteActivityHard(id) {
    state.activities = state.activities.filter((x) => x.id !== id);
    delete state.records[id];
    schedule('acts', state.activities);
    schedule('recs', state.records);
  }

  function getActivity(id) {
    return state.activities.find((x) => x.id === id) || null;
  }

  function liveActivities() {
    return state.activities
      .filter((a) => !a.archived)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // ---------- 记录 ----------
  function bump(id, ymd, delta) {
    if (!ymd) ymd = todayYMD();
    const rec = state.records[id] || (state.records[id] = {});
    const next = (rec[ymd] || 0) + delta;
    if (next <= 0) {
      delete rec[ymd];
      if (Object.keys(rec).length === 0) delete state.records[id];
    } else {
      rec[ymd] = next;
    }
    schedule('recs', state.records);
    return next;
  }

  function count(id, ymd) {
    const rec = state.records[id];
    return rec ? (rec[ymd] || 0) : 0;
  }

  // 返回某事项的所有活跃日（已排序）
  function activeDays(id) {
    const rec = state.records[id];
    if (!rec) return [];
    return Object.keys(rec).sort();
  }

  // 返回某事项在指定月份的所有活跃日
  function activeDaysIn(id, ymPrefix) {
    const rec = state.records[id];
    if (!rec) return [];
    return Object.keys(rec).filter((d) => d.startsWith(ymPrefix)).sort();
  }

  // 指定月份的 [start, end] 包含所有日（按自然月）
  function monthBounds(year, month0) {
    const first = year + '-' + pad(month0 + 1) + '-01';
    const lastDay = new Date(year, month0 + 1, 0).getDate();
    const last = year + '-' + pad(month0 + 1) + '-' + pad(lastDay);
    return [first, last];
  }

  // 返回某日在某月所有事项 id（按 order）
  function activitiesOn(ymd) {
    const out = [];
    liveActivities().forEach((a) => {
      const c = (state.records[a.id] || {})[ymd] || 0;
      if (c > 0) out.push({ id: a.id, count: c });
    });
    return out;
  }

  // ---------- 备份 / 还原 ----------
  function exportJSON() {
    flushNow();
    return {
      app: 'dongji',
      schema: 1,
      exportedAt: new Date().toISOString(),
      activities: state.activities,
      records: state.records,
      icons: state.icons,
      settings: state.settings
    };
  }

  function downloadBackup() {
    const data = exportJSON();
    const text = JSON.stringify(data);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '董记-备份-' + todayYMD() + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1000);
    state.meta.lastBackupAt = Date.now();
    schedule('meta', state.meta);
  }

  async function importJSON(text, mode /* 'replace' | 'merge' */) {
    const data = safeParse(text, null);
    if (!data || data.app !== 'dongji' || data.schema !== 1) {
      throw new Error('备份文件格式不对');
    }
    // 先把当前存一份
    const backupKey = 'dj:v1:backup:' + Date.now();
    localStorage.setItem(backupKey, JSON.stringify({
      activities: state.activities, records: state.records,
      icons: state.icons, settings: state.settings, at: Date.now()
    }));

    if (mode === 'merge') {
      // activities：按 name 去重，icon 取更具体
      const map = new Map();
      data.activities.concat(state.activities).forEach((a) => {
        const k = a.name;
        const ex = map.get(k);
        if (!ex) map.set(k, a);
        else if (!a.archived) map.set(k, a);
      });
      state.activities = Array.from(map.values()).map((a, i) => {
        a.order = i; return a;
      });
      // records：取 max
      Object.keys(data.records).forEach((id) => {
        const cur = state.records[id] || (state.records[id] = {});
        Object.keys(data.records[id]).forEach((d) => {
          cur[d] = Math.max(cur[d] || 0, data.records[id][d]);
          if (cur[d] <= 0) delete cur[d];
        });
      });
      state.icons = Object.assign({}, data.icons, state.icons);
      state.settings = Object.assign({}, data.settings, state.settings);
    } else {
      state.activities = data.activities || [];
      state.records = data.records || {};
      state.icons = data.icons || {};
      state.settings = Object.assign({}, DEF_SET, data.settings || {});
    }

    schedule('acts', state.activities);
    schedule('recs', state.records);
    schedule('icons', state.icons);
    schedule('set', state.settings);
    flushNow();
    return true;
  }

  // ---------- 自定义图标（base64 存 localStorage） ----------
  async function compressIcon(file, size) {
    size = size || 96;
    let bmp;
    try { bmp = await createImageBitmap(file); }
    catch (_) {
      // 老 fallback
      bmp = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    }
    const s = Math.min(bmp.width, bmp.height);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
    if (bmp.close) bmp.close();

    let url = c.toDataURL('image/webp', 0.82);
    if (!url.startsWith('data:image/webp')) {
      url = c.toDataURL('image/jpeg', 0.85);
    }
    if (url.length > 200 * 1024) {
      // 再压缩一次
      return compressIcon(file, Math.max(64, Math.floor(size / 1.5)));
    }
    return url;
  }

  async function addCustomIcon(file) {
    const url = await compressIcon(file, 96);
    const id = uid('i');
    state.icons[id] = url;
    schedule('icons', state.icons);
    return { t: 'c', id, url };
  }

  function iconUrl(id) {
    return state.icons[id];
  }

  // ---------- 设置 ----------
  function getSettings() { return state.settings; }

  function patchSettings(patch) {
    Object.assign(state.settings, patch);
    schedule('set', state.settings);
  }

  // ---------- 备份提醒 ----------
  function shouldRemindBackup() {
    const s = state.settings;
    const total = Object.keys(state.records).reduce((m, id) => {
      return m + Object.values(state.records[id]).reduce((a, b) => a + b, 0);
    }, 0);
    if (total === 0) return false;
    const added = total - (s.recordCountAtReminder || 0);
    const days  = (Date.now() - (s.lastBackupReminderAt || state.meta.createdAt)) / 86400000;
    return (total - (s.recordCountAtReminder || 0) >= REC_REMIND_THRESHOLD) ||
           (days >= DAY_BACKUP_REMIND);
  }

  function markBackupReminded() {
    const total = Object.keys(state.records).reduce((m, id) => {
      return m + Object.values(state.records[id]).reduce((a, b) => a + b, 0);
    }, 0);
    state.settings.recordCountAtReminder = total;
    state.settings.lastBackupReminderAt = Date.now();
    schedule('set', state.settings);
  }

  // ---------- 暴露 ----------
  window.Store = {
    state,
    load, flushNow,
    todayYMD, dnum, ymdFromParts,
    addActivity, updateActivity, archiveActivity, restoreActivity, deleteActivityHard,
    getActivity, liveActivities,
    bump, count, activeDays, activeDaysIn, monthBounds, activitiesOn,
    exportJSON, downloadBackup, importJSON,
    compressIcon, addCustomIcon, iconUrl,
    getSettings, patchSettings,
    shouldRemindBackup, markBackupReminded,
    K
  };
})();
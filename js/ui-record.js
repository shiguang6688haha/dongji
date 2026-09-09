/* ============================================================
 * 董记 · ui-record.js
 * 记录页：统计条 / 事项网格 / 每日一句 / 添加/编辑事项 / Toast
 * ============================================================ */
(function () {
  'use strict';

  const ui = {
    statbar: null,
    grid: null,
    quote: null,
    topMonth: null,
    btnSound: null,
    btnSetting: null
  };

  let lastTapAt = 0;
  let longPressTimer = null;
  let longPressTriggered = false;
  let longPressStart = null;

  function bind() {
    ui.statbar = document.getElementById('statbar');
    ui.grid = document.getElementById('act-grid');
    ui.quote = document.getElementById('quote-text');
    ui.topMonth = document.getElementById('top-month');
    ui.btnSound = document.getElementById('btn-sound');
    ui.btnSetting = document.getElementById('btn-setting');

    ui.btnSound.addEventListener('click', toggleSound);
    ui.btnSetting.addEventListener('click', () => openSettingsSheet());

    document.addEventListener('visibilitychange', () => {
      // 跨天后立刻重渲染
      renderMonth();
      renderStatbar();
      renderGrid();
      renderQuote();
    });

    renderAll();
  }

  function renderAll() {
    renderMonth();
    renderStatbar();
    renderGrid();
    renderQuote();
    renderSoundBtn();
  }

  function renderMonth() {
    const t = new Date();
    ui.topMonth.textContent = (t.getMonth() + 1) + '月';
  }

  // ---------- 顶部统计条 ----------
  function renderStatbar() {
    const t = new Date();
    const ym = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0');
    const activities = Store.liveActivities();
    const chips = [];
    activities.forEach((a) => {
      let cnt = 0;
      const rec = Store.state.records[a.id];
      if (rec) {
        Object.keys(rec).forEach((d) => {
          if (d.startsWith(ym)) cnt += rec[d];
        });
      }
      if (cnt > 0) chips.push({ a, cnt });
    });
    if (chips.length === 0) {
      ui.statbar.innerHTML = '<span class="stat-empty">点下面的事来记录今天</span>';
      return;
    }
    ui.statbar.innerHTML = chips.map(({ a, cnt }) =>
      '<span class="chip" data-id="' + a.id + '">' +
      window.iconHTML(a.icon, 17) +
      '<b>' + cnt + '</b> ' + escapeHtml(a.name) +
      '</span>'
    ).join('');
  }

  function popChip(id) {
    const el = ui.statbar.querySelector('[data-id="' + id + '"]');
    if (!el) return;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }

  // ---------- 网格 ----------
  function renderGrid() {
    const activities = Store.liveActivities();
    const today = Store.todayYMD();
    let html = activities.map((a) => {
      const cnt = Store.count(a.id, today);
      return (
        '<div class="cell ' + (cnt > 0 ? 'done' : '') + '" data-id="' + a.id + '">' +
          '<div class="cell-ic">' + window.iconHTML(a.icon, 24) + '</div>' +
          '<div class="cell-name">' + escapeHtml(a.name) + '</div>' +
          (cnt > 0 ? '<span class="cell-badge">' + cnt + '</span>' : '') +
        '</div>'
      );
    }).join('');
    html +=
      '<div class="cell cell-add" data-act="add">' +
        '<div class="cell-ic">' +
          '<svg class="ic" width="22" height="22"><use href="#dj-plus"/></svg>' +
        '</div>' +
        '<div class="cell-name">添加</div>' +
      '</div>';
    ui.grid.innerHTML = html;
    bindCellEvents();
  }

  function bindCellEvents() {
    ui.grid.querySelectorAll('.cell').forEach((el) => {
      const id = el.dataset.id;
      const isAdd = el.dataset.act === 'add';

      // 长按判定变量
      let cancel = false;

      el.addEventListener('touchstart', (e) => {
        cancel = false;
        longPressTriggered = false;
        longPressStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        longPressTimer = setTimeout(() => {
          if (cancel) return;
          if (isAdd) return;
          longPressTriggered = true;
          if (navigator.vibrate) navigator.vibrate(20);
          openActivitySheet(id);
        }, 500);
      }, { passive: true });

      el.addEventListener('touchmove', (e) => {
        if (!longPressStart) return;
        const dx = e.touches[0].clientX - longPressStart.x;
        const dy = e.touches[0].clientY - longPressStart.y;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          cancel = true;
          clearTimeout(longPressTimer);
        }
      }, { passive: true });

      el.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
      });

      el.addEventListener('contextmenu', (e) => { e.preventDefault(); });

      el.addEventListener('click', (e) => {
        if (longPressTriggered) { longPressTriggered = false; return; }
        clearTimeout(longPressTimer);
        if (isAdd) { openAddActivitySheet(); return; }
        handleBump(id, el);
      });
    });
  }

  function handleBump(id, el) {
    const today = Store.todayYMD();
    const prev = Store.count(id, today);
    const next = Store.bump(id, today, +1);
    updateCellAfterBump(id, el, next);
    popChip(id);
    window.Sound.ding();
    showUndoToast(id, today, prev, +1);
  }

  function updateCellAfterBump(id, el, count) {
    let badge = el.querySelector('.cell-badge');
    if (count > 0) {
      el.classList.add('done');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cell-badge';
        el.appendChild(badge);
      }
      badge.textContent = count;
    }
    // 飞 +1
    flyPlus(el);
    renderStatbar();
    checkBackupReminder();
  }

  function flyPlus(el) {
    const f = document.createElement('span');
    f.className = 'fly';
    f.textContent = '+1';
    el.appendChild(f);
    setTimeout(() => f.remove(), 700);
  }

  function showUndoToast(actId, ymd, prevCount, delta) {
    const a = Store.getActivity(actId);
    if (!a) return;
    UI.toast({
      text: '已记「' + a.name + '」+1',
      action: '撤销',
      duration: 5000,
      onAction: () => {
        Store.bump(actId, ymd, -delta);
        renderGrid();
        renderStatbar();
      }
    });
  }

  // ---------- 每日一句 ----------
  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }
  function renderQuote() {
    const q = window.QUOTES;
    ui.quote.textContent = q[fnv1a(Store.todayYMD()) % q.length];
  }

  // ---------- 音效按钮 ----------
  function renderSoundBtn() {
    const on = Store.getSettings().sound;
    const use = document.getElementById('u-sound');
    if (use) use.setAttribute('href', on ? '#dj-volume' : '#dj-volume-off');
    ui.btnSound.classList.toggle('off', !on);
  }
  function toggleSound() {
    const s = Store.getSettings();
    Store.patchSettings({ sound: !s.sound });
    renderSoundBtn();
    if (!s.sound) window.Sound.ding();
  }

  // ---------- 添加/编辑事项 ----------
  function openAddActivitySheet() {
    openActivitySheet(null);
  }

  function openActivitySheet(actId) {
    const isEdit = !!actId;
    const a = isEdit ? Store.getActivity(actId) : null;
    let chosenIcon = a ? Object.assign({}, a.icon) : { t: 'b', k: 'check' };
    let name = a ? a.name : '';

    const html =
      '<div class="sheet-grab"></div>' +
      '<div class="sheet-head">' +
        '<div><div class="sheet-title">' + (isEdit ? '编辑事项' : '添加事项') + '</div>' +
          '<div class="sheet-sub">' + (isEdit ? '长按事项卡也能再编辑' : '起个短名，选个图标就行') + '</div></div>' +
        '<button class="sheet-close" aria-label="关闭"><svg class="ic" width="16" height="16"><use href="#dj-close"/></svg></button>' +
      '</div>' +
      '<div class="sheet-body">' +
        '<input id="act-name" class="field" maxlength="6" placeholder="如 洗头、健身" value="' + escapeAttr(name) + '" enterkeyhint="done">' +
        '<div class="sheet-label">选图标</div>' +
        '<div class="picker" id="picker"></div>' +
        '<input type="file" id="up-input" accept="image/*" style="display:none">' +
        '<div class="btn-row">' +
          (isEdit
            ? '<button class="btn btn-danger" id="btn-archive">' +
                (a && hasRecords(actId) ? '归档（保留数据）' : '删除') + '</button>' +
              '<button class="btn btn-primary" id="btn-save">保存</button>'
            : '<button class="btn btn-primary" id="btn-save">添加</button>') +
        '</div>' +
      '</div>';

    UI.openSheet(html, {
      onClose: () => {},
      onMount: (root) => {
        const nameInput = root.querySelector('#act-name');
        const picker = root.querySelector('#picker');
        const fileInput = root.querySelector('#up-input');
        let lastSel;

        function renderPicker() {
          const builtin = window.ICONS.filter((i) => i.key && !i.name === '' && !i.paths.endsWith(''));
          const icons = window.ICONS.filter((i) => i.name).concat(window.EMOJI_OPTIONS);
          picker.innerHTML = icons.map((i) => {
            if (i.emoji) {
              return '<div class="pk ' + (chosenIcon.t === 'e' && chosenIcon.emoji === i.emoji ? 'sel' : '') + '" data-kind="emoji" data-v=\'' + escapeAttr(JSON.stringify({ t:'e', emoji:i.emoji })) + '\'>' +
                '<span style="font-size:22px;line-height:1">' + i.emoji + '</span>' +
              '</div>';
            }
            return '<div class="pk ' + (chosenIcon.t === 'b' && chosenIcon.k === i.key ? 'sel' : '') + '" data-kind="b" data-k="' + i.key + '">' +
              window.iconHTML({ t: 'b', k: i.key }, 24) +
            '</div>';
          }).join('') +
          '<div class="pk up" id="pk-up"><svg class="ic" width="22" height="22"><use href="#dj-upload"/></svg></div>';
          picker.querySelectorAll('.pk').forEach((pk) => {
            pk.addEventListener('click', () => {
              if (pk.id === 'pk-up') { fileInput.click(); return; }
              if (pk.dataset.kind === 'b') {
                chosenIcon = { t: 'b', k: pk.dataset.k };
              } else {
                chosenIcon = JSON.parse(pk.dataset.v);
              }
              renderPicker();
            });
          });
        }

        fileInput.addEventListener('change', async (e) => {
          const f = e.target.files[0];
          if (!f) return;
          UI.toast({ text: '压缩图标中...' });
          try {
            chosenIcon = await Store.addCustomIcon(f);
            renderPicker();
            UI.toast({ text: '已添加自定义图标' });
          } catch (err) {
            UI.toast({ text: '图片处理失败' });
          }
        });

        renderPicker();

        root.querySelector('#btn-save').addEventListener('click', () => {
          const n = nameInput.value.trim();
          if (!n) { UI.toast({ text: '起个名字再保存' }); return; }
          if (isEdit) {
            Store.updateActivity(actId, { name: n, icon: chosenIcon });
          } else {
            Store.addActivity(n, chosenIcon);
          }
          UI.closeSheet();
          renderGrid();
          renderStatbar();
          UI.toast({ text: isEdit ? '已保存' : '已添加「' + n + '」' });
        });

        if (isEdit) {
          root.querySelector('#btn-archive').addEventListener('click', () => {
            UI.confirm({
              title: a.archived ? '取消归档？' : '归档「' + a.name + '」？',
              body: a.archived
                ? '恢复后该事项会重新出现在记录页。'
                : (hasRecords(actId)
                    ? '归档后将从记录页隐藏，但历史数据保留。如需彻底删除请去设置 → 数据管理。'
                    : '归档后将从记录页隐藏。'),
              okText: a.archived ? '恢复' : '归档',
              onOk: () => {
                if (a.archived) Store.restoreActivity(actId);
                else Store.archiveActivity(actId);
                UI.closeSheet();
                renderGrid();
                renderStatbar();
              }
            });
          });
        }
      }
    });
  }

  function hasRecords(actId) {
    const rec = Store.state.records[actId];
    return rec && Object.keys(rec).length > 0;
  }

  // ---------- 设置 ----------
  function openSettingsSheet() {
    const s = Store.getSettings();
    const html =
      '<div class="sheet-grab"></div>' +
      '<div class="sheet-head">' +
        '<div class="sheet-title">设置</div>' +
        '<button class="sheet-close" aria-label="关闭"><svg class="ic" width="16" height="16"><use href="#dj-close"/></svg></button>' +
      '</div>' +
      '<div class="sheet-body">' +
        '<div class="setting-row"><div class="lbl">音效 <small>完成时的「叮」</small></div>' +
          '<div class="switch ' + (s.sound ? 'on' : '') + '" data-set="sound"></div></div>' +
        '<div class="setting-row"><div class="lbl">震动 <small>完成时短振反馈</small></div>' +
          '<div class="switch ' + (s.vibrate ? 'on' : '') + '" data-set="vibrate"></div></div>' +
        '<div style="height:18px"></div>' +
        '<div class="sheet-label">数据管理</div>' +
        '<button class="btn-block btn-ghost" id="btn-backup" style="margin-bottom:10px">' +
          '<svg class="ic" width="16" height="16" style="vertical-align:-3px"><use href="#dj-download"/></svg> ' +
          '导出 JSON 备份</button>' +
        '<button class="btn-block btn-ghost" id="btn-restore" style="margin-bottom:10px">' +
          '<svg class="ic" width="16" height="16" style="vertical-align:-3px"><use href="#dj-upload"/></svg> ' +
          '从备份恢复</button>' +
        '<input type="file" id="restore-input" accept="application/json,.json" style="display:none">' +
        '<button class="btn-block btn-ghost" id="btn-archived" style="margin-bottom:10px">' +
          '管理已归档事项</button>' +
        '<div class="tip">数据只存本机。清浏览器缓存或换手机前记得导出备份。</div>' +
        '<div style="height:18px"></div>' +
        '<div class="sheet-label">关于</div>' +
        '<div class="tip">「董记」v1 · 给日常小事记个账，' +
        '看看隔多久做一次。<br><b>安装到桌面</b>：用 Chrome 打开 → 菜单 → 安装应用。' +
        '华为浏览器可能只建快捷方式，不影响使用。</div>' +
      '</div>';

    UI.openSheet(html, {
      onMount: (root) => {
        root.querySelectorAll('.switch[data-set]').forEach((sw) => {
          sw.addEventListener('click', () => {
            const k = sw.dataset.set;
            const cur = Store.getSettings()[k];
            Store.patchSettings({ [k]: !cur });
            sw.classList.toggle('on', !cur);
            if (k === 'sound' && !cur) window.Sound.ding();
            renderSoundBtn();
          });
        });
        root.querySelector('#btn-backup').addEventListener('click', () => {
          Store.downloadBackup();
          Store.markBackupReminded();
          UI.toast({ text: '备份文件已下载' });
        });
        root.querySelector('#btn-restore').addEventListener('click', () => {
          root.querySelector('#restore-input').click();
        });
        root.querySelector('#restore-input').addEventListener('change', async (e) => {
          const f = e.target.files[0];
          if (!f) return;
          const text = await f.text();
          UI.confirm({
            title: '从备份恢复？',
            body: '恢复前会自动保存当前数据为备份。恢复方式选「覆盖」会用备份完全替换当前数据；选「合并」会保留两边记录（取较大值）。',
            okText: '覆盖',
            cancelText: '合并',
            onOk: async () => {
              try {
                await Store.importJSON(text, 'replace');
                UI.closeSheet();
                renderGrid();
                renderStatbar();
                UI.toast({ text: '已覆盖恢复' });
              } catch (err) { UI.toast({ text: '恢复失败：' + err.message }); }
            },
            onCancel: async () => {
              try {
                await Store.importJSON(text, 'merge');
                UI.closeSheet();
                renderGrid();
                renderStatbar();
                UI.toast({ text: '已合并恢复' });
              } catch (err) { UI.toast({ text: '恢复失败：' + err.message }); }
            }
          });
        });
        root.querySelector('#btn-archived').addEventListener('click', openArchivedSheet);
      }
    });
  }

  function openArchivedSheet() {
    const archived = Store.state.activities.filter((a) => a.archived);
    if (archived.length === 0) {
      UI.openSheet(
        '<div class="sheet-grab"></div>' +
        '<div class="sheet-head"><div class="sheet-title">已归档事项</div>' +
          '<button class="sheet-close" aria-label="关闭"><svg class="ic" width="16" height="16"><use href="#dj-close"/></svg></button></div>' +
        '<div class="sheet-body"><div class="empty">' +
          '<svg class="ic" width="44" height="44"><use href="#dj-info"/></svg>' +
          '<p>暂无归档事项</p></div></div>',
        {}
      );
      return;
    }
    const rows = archived.map((a) =>
      '<div class="dr">' +
        '<div class="dr-ic">' + window.iconHTML(a.icon, 21) + '</div>' +
        '<div class="dr-name">' + escapeHtml(a.name) + '<div style="font-size:11.5px;color:var(--text-3)">共 ' + countTotal(a.id) + ' 次</div></div>' +
        '<button class="step-btn" data-act="restore" data-id="' + a.id + '" title="恢复" style="color:var(--accent)">' +
          '<svg class="ic" width="16" height="16"><use href="#dj-check"/></svg></button>' +
        '<button class="step-btn" data-act="del" data-id="' + a.id + '" title="彻底删除" style="color:var(--danger)">' +
          '<svg class="ic" width="16" height="16"><use href="#dj-trash-ui"/></svg></button>' +
      '</div>'
    ).join('');
    UI.openSheet(
      '<div class="sheet-grab"></div>' +
      '<div class="sheet-head"><div class="sheet-title">已归档事项</div>' +
        '<button class="sheet-close" aria-label="关闭"><svg class="ic" width="16" height="16"><use href="#dj-close"/></svg></button></div>' +
      '<div class="sheet-body">' + rows +
        '<div class="tip">归档只是从网格隐藏，旧记录仍在统计里。如果一个事项已经用不上了，可以彻底删除（不可恢复）。</div>' +
      '</div>',
      {
        onMount: (root) => {
          root.querySelectorAll('.step-btn').forEach((b) => {
            b.addEventListener('click', () => {
              const id = b.dataset.id;
              if (b.dataset.act === 'restore') {
                Store.restoreActivity(id);
                UI.closeSheet();
                openArchivedSheet();
                renderGrid();
              } else {
                const a = Store.getActivity(id);
                UI.confirm({
                  title: '彻底删除「' + a.name + '」？',
                  body: '该事项的 ' + countTotal(id) + ' 条历史记录将一起删除，此操作不可撤销。',
                  okText: '删除',
                  onOk: () => {
                    Store.deleteActivityHard(id);
                    UI.closeSheet();
                    openArchivedSheet();
                    renderGrid();
                    renderStatbar();
                  }
                });
              }
            });
          });
        }
      }
    );
  }

  function countTotal(actId) {
    const rec = Store.state.records[actId];
    if (!rec) return 0;
    return Object.values(rec).reduce((a, b) => a + b, 0);
  }

  // ---------- 备份提醒 ----------
  function checkBackupReminder() {
    if (Store.shouldRemindBackup()) {
      setTimeout(() => {
        UI.confirm({
          title: '记得定期备份',
          body: '数据只存在本机，建议点导出存一份。',
          okText: '现在导出',
          cancelText: '下次再说',
          onOk: () => { Store.downloadBackup(); Store.markBackupReminded(); },
          onCancel: () => { Store.markBackupReminded(); }
        });
      }, 1500);
    }
  }

  // ---------- 工具 ----------
  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function escapeAttr(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  window.UIRecord = { bind, renderGrid, renderStatbar, renderQuote, hasRecords };
})();
/* ============================================================
 * 董记 · ui-calendar.js
 * 日历页：月历 / 日期面板 / 月报点阵
 * ============================================================ */
(function () {
  'use strict';

  let curYear = 0, curMonth0 = 0;  // 当前显示月
  let rangeMode = 'month';          // 'month' | '90d'
  let touchStartX = 0, touchStartY = 0, touchStartT = 0;

  const ui = {};

  function bind() {
    ui.title = document.getElementById('cal-title');
    ui.prev = document.getElementById('cal-prev');
    ui.next = document.getElementById('cal-next');
    ui.weekhead = document.getElementById('weekhead');
    ui.grid = document.getElementById('calgrid');
    ui.scroll = document.getElementById('cal-scroll');
    ui.reportBody = document.getElementById('report-body');
    ui.seg = document.getElementById('range-seg');

    // 表头：周一开头
    ui.weekhead.innerHTML = WEEK.map((w, i) =>
      '<span class="' + (i >= 5 ? 'we' : '') + '">' + w + '</span>'
    ).join('');

    const t = new Date();
    curYear = t.getFullYear();
    curMonth0 = t.getMonth();

    ui.prev.addEventListener('click', () => navMonth(-1));
    ui.next.addEventListener('click', () => navMonth(+1));
    ui.title.addEventListener('click', () => openMonthPicker());

    ui.seg.querySelectorAll('.seg-btn').forEach((b) => {
      b.addEventListener('click', () => {
        rangeMode = b.dataset.range;
        ui.seg.querySelectorAll('.seg-btn').forEach((x) => x.classList.toggle('on', x === b));
        renderReport();
      });
    });

    // 横滑切月
    const grid = ui.grid;
    grid.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartT = Date.now();
    }, { passive: true });
    grid.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        navMonth(dx < 0 ? +1 : -1);
      }
    });

    document.addEventListener('visibilitychange', () => {
      const t = new Date();
      if (t.getFullYear() !== curYear || t.getMonth() !== curMonth0) {
        curYear = t.getFullYear(); curMonth0 = t.getMonth();
      }
      renderAll();
    });

    renderAll();
  }

  const WEEK = ['一','二','三','四','五','六','日'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function navMonth(delta) {
    let m = curMonth0 + delta, y = curYear;
    if (m < 0) { m = 11; y--; }
    else if (m > 11) { m = 0; y++; }
    curYear = y; curMonth0 = m;
    renderAll();
  }

  function renderAll() {
    ui.title.textContent = curYear + '年' + (curMonth0 + 1) + '月';
    renderGrid();
    renderReport();
  }

  // ---------- 月历网格 ----------
  function buildMonth(year, month0) {
    const first = new Date(year, month0, 1);
    const offset = (first.getDay() + 6) % 7;       // 周一=0
    const daysInMonth = new Date(year, month0 + 1, 0).getDate();
    const prevDays = new Date(year, month0, 0).getDate();
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const dno = i - offset + 1;
      if (dno < 1) {
        cells.push({ y: month0 === 0 ? year - 1 : year,
                     m: (month0 + 11) % 12,
                     d: prevDays + dno, cur: false });
      } else if (dno > daysInMonth) {
        cells.push({ y: month0 === 11 ? year + 1 : year,
                     m: (month0 + 1) % 12,
                     d: dno - daysInMonth, cur: false });
      } else {
        cells.push({ y: year, m: month0, d: dno, cur: true });
      }
    }
    return cells;
  }

  function cellYmd(c) {
    return c.y + '-' + pad(c.m + 1) + '-' + pad(c.d);
  }

  function renderGrid() {
    const cells = buildMonth(curYear, curMonth0);
    const today = Store.todayYMD();
    const gridMax = Store.getSettings().gridMax || 4;
    const html = cells.map((c) => {
      const ymd = cellYmd(c);
      const acts = c.cur ? Store.activitiesOn(ymd) : [];
      // sort by activity order
      acts.sort((a, b) => {
        const ao = Store.getActivity(a.id)?.order ?? 0;
        const bo = Store.getActivity(b.id)?.order ?? 0;
        return ao - bo;
      });

      let iconsHtml = '';
      if (acts.length === 0) {
        iconsHtml = '<span class="di"></span><span class="di"></span>';
      } else {
        const show = acts.slice(0, gridMax);
        const more = acts.length - show.length;
        iconsHtml = show.map((a, i) => {
          const act = Store.getActivity(a.id);
          if (!act) return '';
          if (i === show.length - 1 && more > 0) {
            return '<span class="di more">+' + more + '</span>';
          }
          const img = act.icon.t === 'c' ? Store.iconUrl(act.icon.id) : null;
          const html = window.iconHTML(act.icon, 15);
          return '<span class="di">' +
            (act.icon.t === 'c' && img
              ? '<img src="' + img + '" alt="">'
              : html) +
            (a.count > 1 ? '<span class="n">' + a.count + '</span>' : '') +
          '</span>';
        }).join('');
        if (show.length < 2) {
          // 补空格
          for (let i = show.length; i < 2; i++) iconsHtml += '<span class="di"></span>';
        }
      }

      return (
        '<div class="day ' + (c.cur ? '' : 'pad') +
        (ymd === today ? ' today' : '') +
        '" data-ymd="' + ymd + '">' +
          '<div class="day-num">' + c.d + '</div>' +
          '<div class="day-icons">' + iconsHtml + '</div>' +
        '</div>'
      );
    }).join('');
    ui.grid.innerHTML = html;
    ui.grid.querySelectorAll('.day').forEach((el) => {
      el.addEventListener('click', () => openDaySheet(el.dataset.ymd));
    });
  }

  // ---------- 日期面板 ----------
  function openDaySheet(ymd) {
    const activities = Store.liveActivities();
    const rec = { ymd };
    const list = activities.map((a) => {
      const c = Store.count(a.id, ymd);
      return { a, c };
    });

    const rows = list.filter((x) => x.c > 0).map(({ a, c }) =>
      '<div class="dr" data-id="' + a.id + '">' +
        '<div class="dr-ic">' + window.iconHTML(a.icon, 21) + '</div>' +
        '<div class="dr-name">' + escapeHtml(a.name) + '</div>' +
        '<div class="stepper">' +
          '<button class="step-btn minus" data-act="minus" aria-label="减一">' +
            '<svg class="ic" width="14" height="14"><use href="#dj-minus"/></svg></button>' +
          '<span class="step-n ' + (c === 0 ? 'zero' : '') + '">' + c + '</span>' +
          '<button class="step-btn plus" data-act="plus" aria-label="加一">' +
            '<svg class="ic" width="14" height="14"><use href="#dj-plus"/></svg></button>' +
        '</div>' +
      '</div>'
    ).join('');

    const titleParts = ymd.split('-');
    const dt = new Date(+titleParts[0], +titleParts[1] - 1, +titleParts[2]);
    const weekday = ['日','一','二','三','四','五','六'][dt.getDay()];
    const titleStr = (+titleParts[1]) + '月' + (+titleParts[2]) + '日 · 星期' + weekday;
    const isFuture = ymd > Store.todayYMD();

    const html =
      '<div class="sheet-grab"></div>' +
      '<div class="sheet-head">' +
        '<div><div class="sheet-title">' + titleStr + '</div>' +
          '<div class="sheet-sub">点图标可直接加一 · 点减号可撤销</div></div>' +
        '<button class="sheet-close" aria-label="关闭"><svg class="ic" width="16" height="16"><use href="#dj-close"/></svg></button>' +
      '</div>' +
      '<div class="sheet-body">' +
        (rows ? rows : '<div class="empty"><svg class="ic" width="44" height="44"><use href="#dj-info"/></svg><p>这天还没有记录</p></div>') +
        '<div class="sheet-label">补签 / 添加</div>' +
        '<div class="picker" id="picker"></div>' +
        (isFuture ? '<div class="tip">提示：日期是未来的，把要记录的事放到今天吧</div>' : '') +
      '</div>';

    UI.openSheet(html, {
      onMount: (root) => {
        root.querySelectorAll('.dr .step-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const dr = btn.closest('.dr');
            const id = dr.dataset.id;
            const n = btn.querySelector('.step-n') || dr.querySelector('.step-n');
            const cur = Store.count(id, ymd);
            if (btn.dataset.act === 'plus') {
              const next = Store.bump(id, ymd, +1);
              n.textContent = next;
              n.classList.toggle('zero', next === 0);
              window.Sound.ding();
            } else {
              // 减到 0 = 删除该记录
              if (cur === 1) {
                Store.bump(id, ymd, -1);
                // 从面板移除该行
                dr.style.transition = 'opacity .2s, height .2s, margin .2s';
                dr.style.opacity = '0';
                setTimeout(() => dr.remove(), 180);
                UI.toast({
                  text: '已撤销一条记录',
                  action: '撤销', duration: 4500,
                  onAction: () => {
                    Store.bump(id, ymd, +1);
                    UI.closeSheet();
                    openDaySheet(ymd);
                  }
                });
              } else {
                const next = Store.bump(id, ymd, -1);
                n.textContent = next;
                window.Sound.vibrate();
              }
            }
            // 同步日历 + 记录页
            renderGrid();
            if (window.UIRecord) {
              window.UIRecord.renderStatbar();
              window.UIRecord.renderGrid();
            }
            renderReport();
          });
        });

        const picker = root.querySelector('#picker');
        picker.innerHTML = activities.map((a) => {
          return '<div class="pk" data-id="' + a.id + '">' +
            window.iconHTML(a.icon, 24) +
          '</div>';
        }).join('');
        picker.querySelectorAll('.pk').forEach((pk) => {
          pk.addEventListener('click', () => {
            const id = pk.dataset.id;
            Store.bump(id, ymd, +1);
            window.Sound.ding();
            UI.closeSheet();
            // 重新打开刷新
            openDaySheet(ymd);
            renderGrid();
            if (window.UIRecord) {
              window.UIRecord.renderStatbar();
              window.UIRecord.renderGrid();
            }
            renderReport();
          });
        });
      }
    });
  }

  // ---------- 月报 ----------
  function renderReport() {
    const activities = Store.liveActivities().concat(
      Store.state.activities.filter((a) => a.archived)
    );
    const today = Store.todayYMD();
    const rows = [];

    activities.forEach((a) => {
      const rep = window.Stats.rangeReport(a.id, rangeMode, curYear, curMonth0);
      // 月报模式下：只显示本月有记录的事项；90 天模式：90 天内有记录
      if (rep.total <= 0 && rep.analyze.n <= 0) return;
      rows.push({ a, rep });
    });

    if (rows.length === 0) {
      ui.reportBody.innerHTML = '<div class="report-empty">' +
        (rangeMode === 'month' ? '本月还没有记录，去记一下？' : '近 90 天还没有记录') +
        '</div>';
      return;
    }

    ui.reportBody.innerHTML = rows.map(({ a, rep }) => {
      const ana = rep.analyze;
      const meta = [];
      meta.push('共 ' + rep.total + ' 次');
      if (ana.n === 0) meta.push('暂无间隔');
      else if (ana.n === 1) meta.push(ana.since + ' 天前');
      else {
        meta.push('平均 ' + (Math.round(ana.avg * 10) / 10).toFixed(1) + ' 天一次');
        meta.push('距上次 ' + ana.since + ' 天');
      }
      return (
        '<div class="rp-row">' +
          '<div class="rp-top">' +
            '<div class="rp-ic">' + window.iconHTML(a.icon, 19) + '</div>' +
            '<div class="rp-name">' + escapeHtml(a.name) + '</div>' +
            '<div class="rp-count">本月 <b>' + rep.total + '</b> 次</div>' +
          '</div>' +
          '<div class="rp-meta">' + meta.join(' · ') + '</div>' +
          renderStrip(rep.series, today) +
          (rangeMode === 'month'
            ? '<div class="rp-axis"><span>1日</span><span>15日</span><span>' + rep.series.length + '日</span></div>'
            : '<div class="rp-axis"><span>' + rep.start.slice(5) + '</span><span>现在</span></div>') +
        '</div>'
      );
    }).join('');
  }

  function renderStrip(series, today) {
    return '<div class="rp-strip">' + series.map((s) => {
      const cls = s.count > 0 ? (s.count >= 2 ? 'on t2' : 'on') : '';
      const todayCls = s.ymd === today ? ' today' : '';
      return '<i class="' + cls + todayCls + '"></i>';
    }).join('') + '</div>';
  }

  // ---------- 月份选择 ----------
  function openMonthPicker() {
    const html =
      '<div class="sheet-grab"></div>' +
      '<div class="sheet-head">' +
        '<div class="sheet-title">选月份</div>' +
        '<button class="sheet-close" aria-label="关闭"><svg class="ic" width="16" height="16"><use href="#dj-close"/></svg></button>' +
      '</div>' +
      '<div class="sheet-body">' +
        '<input type="month" id="month-input" class="field" value="' +
        curYear + '-' + pad(curMonth0 + 1) + '">' +
      '</div>';
    UI.openSheet(html, {
      onMount: (root) => {
        root.querySelector('#month-input').addEventListener('change', (e) => {
          const v = e.target.value;
          if (!v) return;
          const [y, m] = v.split('-').map(Number);
          curYear = y; curMonth0 = m - 1;
          UI.closeSheet();
          renderAll();
        });
      }
    });
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  window.UICalendar = { bind, renderGrid, renderReport };
})();
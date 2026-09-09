/* ============================================================
 * 董记 · stats.js
 * 间隔统计与月报数据
 * ============================================================ */
(function () {
  'use strict';

  const DAY = 86400000;

  function dnum(ymd) {
    const p = ymd.split('-');
    return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000;
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // dates: 已排序去重的 YYYY-MM-DD 数组
  // today: 'YYYY-MM-DD'
  function analyze(dates, today) {
    today = today || Store.todayYMD();
    const n = dates.length;
    if (n === 0) {
      return {
        n: 0, activeDays: 0,
        avg: null, median: null, min: null, max: null,
        last: null, since: null,
        display: '暂无记录'
      };
    }
    if (n === 1) {
      return {
        n: 1, activeDays: 1,
        avg: null, median: null, min: null, max: null,
        last: dates[0],
        since: dnum(today) - dnum(dates[0]),
        display: '仅 1 次 · ' + (dnum(today) - dnum(dates[0])) + ' 天前'
      };
    }
    const span = dnum(dates[n - 1]) - dnum(dates[0]);
    const avg = span / (n - 1);
    const gaps = dates.slice(1).map((d, i) => dnum(d) - dnum(dates[i]));
    const sorted = gaps.slice().sort((a, b) => a - b);
    const median = sorted.length % 2
      ? sorted[(sorted.length - 1) / 2]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    return {
      n, activeDays: n,
      avg, median,
      min: sorted[0], max: sorted[sorted.length - 1],
      last: dates[n - 1],
      since: dnum(today) - dnum(dates[n - 1]),
      display: '平均 ' + (Math.round(avg * 10) / 10).toFixed(1) + ' 天一次'
    };
  }

  // 区间内日序列：[{ymd, count}] 长度 = 区间天数
  function seriesInRange(actId, start, end) {
    const rec = Store.state.records[actId] || {};
    const out = [];
    const a = dnum(start), b = dnum(end);
    for (let t = a; t <= b; t++) {
      const dt = new Date(t * DAY);
      const ymd = dt.getUTCFullYear() + '-' +
                  pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate());
      out.push({ ymd, count: rec[ymd] || 0 });
    }
    return out;
  }

  // 给事项在当月跑出统计 + 系列
  function monthlyReport(actId, year, month0) {
    const rec = Store.state.records[actId] || {};
    const [start, end] = Store.monthBounds(year, month0);
    const allDays = Object.keys(rec).filter((d) => d >= start && d <= end).sort();
    const series = seriesInRange(actId, start, end);
    const today = Store.todayYMD();
    const ana = analyze(allDays, today);
    // 月内总次数
    let monthCount = 0;
    series.forEach((s) => (monthCount += s.count));
    return { analyze: ana, series, monthCount };
  }

  function rangeReport(actId, /* 'month' | '90d' */mode, year, month0) {
    let start, end;
    if (mode === '90d') {
      const t = new Date();
      end = Store.todayYMD();
      t.setDate(t.getDate() - 89);
      start = t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
    } else {
      [start, end] = Store.monthBounds(year, month0);
    }
    const rec = Store.state.records[actId] || {};
    const allDays = Object.keys(rec).filter((d) => d >= start && d <= end).sort();
    const series = seriesInRange(actId, start, end);
    const today = Store.todayYMD();
    let total = 0;
    series.forEach((s) => (total += s.count));
    return {
      analyze: analyze(allDays, today),
      series, start, end, total
    };
  }

  window.Stats = { analyze, seriesInRange, monthlyReport, rangeReport, dnum };
})();
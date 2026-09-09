/* ============================================================
 * 董记 · sound.js
 * Web Audio 合成「叮」音效 + 震动反馈
 * ============================================================ */
(function () {
  'use strict';

  let ctx = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') {
      try { ctx.resume(); } catch (_) {}
    }
    return ctx;
  }

  function ding() {
    const s = Store.getSettings();
    if (!s.sound) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime;
    const master = c.createGain();
    master.gain.value = 0.28;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 6000;
    master.connect(lp).connect(c.destination);

    const notes = [[1046.5, 0], [1318.5, 0.075]];
    notes.forEach(([freq, delay], i) => {
      const t = t0 + delay;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(i === 0 ? 0.85 : 0.65, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (i === 0 ? 0.22 : 0.26));

      const o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = freq;
      const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq * 2;
      const g2 = c.createGain(); g2.gain.value = 0.18;

      o1.connect(g);
      o2.connect(g2).connect(g);
      g.connect(master);

      o1.start(t); o2.start(t);
      o1.stop(t + 0.3); o2.stop(t + 0.3);
      o1.onended = () => {
        try { o1.disconnect(); o2.disconnect(); g.disconnect(); g2.disconnect(); } catch (_) {}
      };
    });
    setTimeout(() => { try { master.disconnect(); } catch (_) {} }, 500);

    if (s.vibrate && navigator.vibrate) {
      try { navigator.vibrate(15); } catch (_) {}
    }
  }

  // 静音但仍给震动（设置里允许）
  function vibrate() {
    const s = Store.getSettings();
    if (s.vibrate && navigator.vibrate) {
      try { navigator.vibrate(12); } catch (_) {}
    }
  }

  // 任何用户手势都触发一下，确保首次 resume()
  function resume() {
    ensure();
  }

  window.Sound = { ding, vibrate, resume };
})();
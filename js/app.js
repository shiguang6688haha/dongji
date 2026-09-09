/* ============================================================
 * 董记 · app.js
 * 启动 / Tab 路由 / 全局 UI 助手（Toast / Bottom Sheet / Confirm）
 * ============================================================ */
(function () {
  'use strict';

  // ---------- 基础 UI 助手 ----------
  const Toast = (() => {
    const wrap = () => document.getElementById('toast-wrap');
    function show({ text, action, duration, onAction }) {
      duration = duration || 2400;
      const w = wrap();
      const t = document.createElement('div');
      t.className = 'toast';
      t.innerHTML = '<span></span>' +
        (action ? '<span class="toast-undo">' + action + '</span>' : '');
      t.querySelector('span').textContent = text;
      if (action && onAction) {
        t.querySelector('.toast-undo').addEventListener('click', () => {
          onAction();
          dismiss();
        });
      }
      w.appendChild(t);
      const timer = setTimeout(dismiss, duration);
      function dismiss() {
        clearTimeout(timer);
        t.classList.add('out');
        setTimeout(() => t.remove(), 220);
      }
    }
    return { show };
  })();

  const Sheet = (() => {
    let onClose = null;
    function open(html, opts) {
      opts = opts || {};
      const sheet = document.getElementById('sheet');
      const mask = document.getElementById('mask');
      sheet.innerHTML = html;
      // 显示
      requestAnimationFrame(() => {
        sheet.classList.add('on');
        mask.classList.add('on');
      });
      onClose = opts.onClose || null;
      const close = () => closeSheet();

      // 关闭按钮
      const closeBtn = sheet.querySelector('.sheet-close');
      if (closeBtn) closeBtn.addEventListener('click', close);

      // 蒙板点击关闭
      mask.onclick = close;

      // 下滑关闭
      let startY = 0, dy = 0, drag = false;
      sheet.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        if (sheet.scrollTop > 0) return;
        startY = e.touches[0].clientY;
        drag = true;
      }, { passive: true });
      sheet.addEventListener('touchmove', (e) => {
        if (!drag) return;
        dy = e.touches[0].clientY - startY;
        if (dy < 0) dy = 0;
        sheet.style.transform = 'translateY(' + dy + 'px)';
        if (dy > 60) {
          drag = false;
          close();
        }
      }, { passive: true });
      sheet.addEventListener('touchend', () => {
        if (dy < 80) {
          sheet.style.transform = '';
        }
        drag = false; dy = 0; startY = 0;
      });

      if (opts.onMount) opts.onMount(sheet);
    }
    function close() {
      const sheet = document.getElementById('sheet');
      const mask = document.getElementById('mask');
      sheet.classList.remove('on');
      mask.classList.remove('on');
      sheet.style.transform = '';
      const cb = onClose; onClose = null;
      setTimeout(() => {
        sheet.innerHTML = '';
        if (cb) cb();
      }, 280);
    }
    return { open, close };
  })();

  const Confirm = (() => {
    let wrap;
    function show({ title, body, okText, cancelText, onOk, onCancel }) {
      okText = okText || '确认';
      cancelText = cancelText || '取消';
      const html =
        '<div class="sheet-grab"></div>' +
        '<div class="sheet-head"><div class="sheet-title">' + escapeHtml(title) + '</div>' +
          '<button class="sheet-close" aria-label="关闭"><svg class="ic" width="16" height="16"><use href="#dj-close"/></svg></button></div>' +
        '<div class="sheet-body">' +
          '<p style="margin:8px 0 16px;color:var(--text-2);font-size:14px;line-height:1.65">' + escapeHtml(body) + '</p>' +
          '<div class="btn-row">' +
            (onCancel ? '<button class="btn btn-ghost" id="confirm-cancel">' + cancelText + '</button>' : '') +
            '<button class="btn btn-primary" id="confirm-ok">' + okText + '</button>' +
          '</div>' +
        '</div>';
      Sheet.open(html, {
        onMount: (root) => {
          root.querySelector('#confirm-ok').addEventListener('click', () => {
            Sheet.close();
            if (onOk) onOk();
          });
          const cc = root.querySelector('#confirm-cancel');
          if (cc) cc.addEventListener('click', () => {
            Sheet.close();
            if (onCancel) onCancel();
          });
        }
      });
    }
    return { show };
  })();

  // ---------- Tab 路由 ----------
  function switchTab(name) {
    document.querySelectorAll('.tab').forEach((t) =>
      t.classList.toggle('on', t.dataset.view === name));
    document.querySelectorAll('.view').forEach((v) =>
      v.classList.toggle('hidden', v.id !== 'view-' + name));
    if (name === 'calendar') {
      if (window.UICalendar) window.UICalendar.renderGrid?.();
      window.UICalendar.renderReport?.();
    }
  }

  // ---------- 100vh / 安全区回退 ----------
  function setVh() {
    document.documentElement.style.setProperty('--vh', innerHeight * 0.01 + 'px');
  }

  // ---------- 启动 ----------
  function boot() {
    // 1. 注入 SVG sprite
    window.mountSprite();

    // 2. 加载数据
    Store.load();

    // 3. 视图绑定
    window.UIRecord.bind();
    window.UICalendar.bind();

    // 4. Tab 路由
    document.querySelectorAll('.tab').forEach((t) => {
      t.addEventListener('click', () => switchTab(t.dataset.view));
    });

    // 5. --vh 回退
    setVh();
    addEventListener('resize', setVh);
    addEventListener('orientationchange', setVh);

    // 6. 协议检测
    if (location.protocol === 'file:') {
      Toast.show({
        text: 'file:// 打开无法安装 PWA，请部署到 HTTPS',
        duration: 5000
      });
    }

    // 7. SW 注册
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' })
        .then((reg) => {
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                Toast.show({
                  text: '已更新，刷新一下',
                  action: '刷新',
                  duration: 8000,
                  onAction: () => {
                    if (nw) nw.postMessage({ type: 'SKIP_WAITING' });
                  }
                });
              }
            });
          });
        })
        .catch(() => {});

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        location.reload();
      });
    }

    // 8. 任何点击先唤醒 AudioContext
    document.addEventListener('pointerdown', () => window.Sound.resume(), { passive: true });

    // 9. 安装提示（仅在浏览器内、首次）
    maybeShowInstallHint();

    // 10. 检查备份提醒（首次启动也行）
    setTimeout(() => {
      if (Store.shouldRemindBackup()) {
        Confirm.show({
          title: '记得定期备份',
          body: '数据只存在本机，建议点导出存一份。',
          okText: '现在导出',
          cancelText: '下次再说',
          onOk: () => { Store.downloadBackup(); Store.markBackupReminded(); },
          onCancel: () => { Store.markBackupReminded(); }
        });
      }
    }, 1200);
  }

  // ---------- 安装提示 ----------
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // 仅当用户没关过
    if (!Store.getSettings().installHintDismissed) {
      showInstallHint();
    }
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    Toast.show({ text: '已安装到桌面！', duration: 2200 });
  });

  function showInstallHint() {
    const html =
      '<div class="sheet-grab"></div>' +
      '<div class="sheet-head">' +
        '<div><div class="sheet-title">把董记装到桌面</div>' +
          '<div class="sheet-sub">打开 App 时无地址栏、像原生应用</div></div>' +
        '<button class="sheet-close" aria-label="关闭"><svg class="ic" width="16" height="16"><use href="#dj-close"/></svg></button>' +
      '</div>' +
      '<div class="sheet-body">' +
        '<div class="tip">' +
          '<b>用 Chrome 浏览器：</b>右上角菜单 → 选择「<b>安装应用 / 添加到主屏幕</b>」。装好后在桌面点「董记」图标直接打开。<br><br>' +
          '<b>华为自带浏览器：</b>也支持「添加到桌面」，但可能是带地址栏的快捷方式，效果差一些。' +
          '建议安装一个 Chrome 或 Edge 用，效果更好。' +
        '</div>' +
        (deferredPrompt
          ? '<button class="btn btn-primary" id="btn-install">立即安装</button>'
          : '') +
      '</div>';
    let dismissed = false;
    Sheet.open(html, {
      onClose: () => {
        if (dismissed) return;
        dismissed = true;
        Store.patchSettings({ installHintDismissed: true });
      },
      onMount: (root) => {
        const btn = root.querySelector('#btn-install');
        if (btn) btn.addEventListener('click', async () => {
          deferredPrompt.prompt();
          const r = await deferredPrompt.userChoice;
          if (r.outcome === 'accepted') Sheet.close();
          deferredPrompt = null;
        });
      }
    });
  }

  function maybeShowInstallHint() {
    // 仅在浏览器内、未安装时显示一次
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true;
    if (standalone) return;
    if (Store.getSettings().installHintDismissed) return;
    setTimeout(() => {
      if (!deferredPrompt) {
        // 没有 beforeinstallprompt 也会给出文字指引
        showInstallHint();
      }
    }, 4000);
  }

  // ---------- 转义 ----------
  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ---------- 暴露 ----------
  window.UI = {
    toast: Toast.show,
    openSheet: Sheet.open,
    closeSheet: Sheet.close,
    confirm: Confirm.show,
    switchTab
  };

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
/* ============================================================
 * 董记 · icons.js
 * 内置 SVG 图标 sprite 注入 + 图标选择器数据 + 励志语录库
 * ============================================================ */
(function () {
  'use strict';

  // ---------- 1. 内置图标（Lucide 风格：24×24 / stroke-only） ----------
  // 形状都是「一眼能认」，单色墨黑，靠形状区分
  const ICONS = [
    { key: 'hair',      name: '洗头',  paths:
      '<circle cx="12" cy="9.4" r="4.2"/>'
    + '<path d="M5.2 20.5a6.8 6.8 0 0 1 13.6 0"/>'
    + '<circle cx="6.4" cy="3.6" r="1.3" fill="currentColor" stroke="none"/>'
    + '<circle cx="10.2" cy="2.1" r="1.6" fill="currentColor" stroke="none"/>'
    + '<circle cx="13.9" cy="4.1" r="0.9" fill="currentColor" stroke="none"/>'
    },

    { key: 'bath',      name: '洗澡',  paths:
      '<path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/>'
    + '<path d="M5 12V6.5A1.5 1.5 0 0 1 6.5 5H9"/>'
    + '<path d="M7.2 19 5.8 21.5"/>'
    + '<path d="M16.8 19 18.2 21.5"/>'
    + '<path d="M12 1.8c0 1.3-1.3 1.9-1.3 3.1a1.3 1.3 0 0 0 2.6 0c0-1.2-1.3-1.8-1.3-3.1z" fill="currentColor" stroke="none"/>'
    },

    { key: 'toilet',    name: '拉屎',  paths:
      '<rect x="6" y="2.6" width="12" height="5" rx="1.2"/>'
    + '<path d="M4.8 8.6h14.4"/>'
    + '<path d="M7.4 8.6v6.4a4.6 4.6 0 0 0 9.2 0V8.6"/>'
    + '<path d="M9.6 21h4.4"/>'
    },

    { key: 'sunrise',   name: '早起',  paths:
      '<path d="M12 2v8"/>'
    + '<path d="m4.93 10.93 1.41 1.41"/>'
    + '<path d="M2 18h2"/>'
    + '<path d="M20 18h2"/>'
    + '<path d="m19.07 10.93-1.41 1.41"/>'
    + '<path d="M22 22H2"/>'
    + '<path d="m8 6 4-4 4 4"/>'
    + '<path d="M16 18a4 4 0 0 0-8 0"/>'
    },

    { key: 'moon',      name: '早睡',  paths:
      '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'
    },

    { key: 'dumbbell',  name: '健身',  paths:
      '<path d="M3.5 9.5v5"/>'
    + '<path d="M6.5 6.5v11"/>'
    + '<path d="M6.5 12h11"/>'
    + '<path d="M17.5 6.5v11"/>'
    + '<path d="M20.5 9.5v5"/>'
    },

    { key: 'baduan',    name: '八段锦', paths:
      '<circle cx="12" cy="4" r="1.8"/>'
    + '<path d="M12 6.6v6.6"/>'
    + '<path d="m8.4 3.4 3.6 3.4 3.6-3.4"/>'
    + '<path d="m8.2 20.5 3.8-7.3 3.8 7.3"/>'
    },

    { key: 'book',      name: '看书',  paths:
      '<path d="M12 7v14"/>'
    + '<path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>'
    },

    { key: 'water',     name: '喝水',  paths:
      '<path d="M6.6 3h10.8l-1.3 16.1a2 2 0 0 1-2 1.9H9.9a2 2 0 0 1-2-1.9z"/>'
    + '<path d="M5 3h14"/>'
    + '<path d="M7.4 11.5h9.2"/>'
    },

    { key: 'pill',      name: '吃药',  paths:
      '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>'
    + '<path d="m8.5 8.5 7 7"/>'
    },

    { key: 'tooth',     name: '刷牙',  paths:
      '<path d="M12 21c-2.3 0-3.6-1.9-3.6-4.4 0-3.5 1-9 2.7-9 1 0 1 3.1 1.9 3.1.9 0 .9-3.5 2-3.5 1.7 0 2.6 5.5 2.6 9.4 0 2.5-1.3 4.4-3.6 4.4z"/>'
    },

    { key: 'meditate',  name: '冥想',  paths:
      '<circle cx="12" cy="4.2" r="1.9"/>'
    + '<path d="M12 6.8v5.4"/>'
    + '<path d="M8 11.2 12 9.6l4 1.6"/>'
    + '<path d="M3.5 18c2.6-2.8 4.7-3.4 8.5-3.4s5.9.6 8.5 3.4"/>'
    + '<path d="M4.5 21h15"/>'
    },

    { key: 'walk',      name: '走路',  paths:
      '<ellipse cx="8.2" cy="8.2" rx="2.4" ry="3.5"/>'
    + '<ellipse cx="15.8" cy="16.2" rx="2.4" ry="3.5"/>'
    },

    { key: 'notebook',  name: '写日记', paths:
      '<rect x="5" y="3" width="14" height="18" rx="2"/>'
    + '<path d="M9 3v18"/>'
    + '<path d="M11.5 8h5"/>'
    + '<path d="M11.5 12h5"/>'
    + '<path d="M11.5 16h5"/>'
    },

    { key: 'pen',       name: '练字',  paths:
      '<path d="M20 4.5a1.5 1.5 0 0 1 2.2 2L9 19.5l-5 1 1-5z" transform="translate(-3 -1)"/>'
    + '<path d="m9 9 4 4"/>'
    + '<path d="M4 19l1.5-4"/>'
    },

    { key: 'money',     name: '记账',  paths:
      '<circle cx="12" cy="12" r="8.5"/>'
    + '<path d="M9 8.4 12 13l3-4.6"/>'
    + '<path d="M8.8 14h6.4"/>'
    + '<path d="M8.8 16.5h6.4"/>'
    },

    { key: 'paw',       name: '遛狗',  paths:
      '<circle cx="7" cy="8.5" r="1.9"/>'
    + '<circle cx="12" cy="6.5" r="1.9"/>'
    + '<circle cx="17" cy="8.5" r="1.9"/>'
    + '<path d="M12 20.5c-3 0-5.5-1.6-5.5-3.8 0-2 2-3.2 5.5-3.2s5.5 1.2 5.5 3.2c0 2.2-2.5 3.8-5.5 3.8z"/>'
    },

    { key: 'cook',      name: '做饭',  paths:
      '<path d="M4 9h16v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/>'
    + '<path d="M3 9h18"/>'
    + '<path d="M7 6c0-1 1-1.2 1-2"/>'
    + '<path d="M10.5 5c0-1.2 1-1.5 1-2.5"/>'
    + '<path d="M14 6c0-1 1-1.2 1-2"/>'
    },

    { key: 'coffee',    name: '喝咖啡', paths:
      '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/>'
    + '<path d="M17 9.5h1.5a2.5 2.5 0 0 1 0 5H17"/>'
    + '<path d="M6 5c0-1 1-1.2 1-2"/>'
    + '<path d="M10 4.5c0-1.1 1-1.4 1-2.3"/>'
    },

    { key: 'gauge',     name: '称重',  paths:
      '<path d="M3.5 17a9 9 0 1 1 17 0"/>'
    + '<path d="M12 17 16 10.5"/>'
    + '<circle cx="12" cy="17" r="1.3" fill="currentColor" stroke="none"/>'
    },

    { key: 'laundry',   name: '洗衣服', paths:
      '<rect x="3" y="3" width="18" height="18" rx="2.5"/>'
    + '<circle cx="12" cy="13" r="4.5"/>'
    + '<path d="M5.5 3v4"/>'
    + '<path d="M8.5 3v3"/>'
    + '<path d="M11.5 3v4"/>'
    + '<path d="M14.5 3v3"/>'
    + '<path d="M17.5 3v4"/>'
    },

    { key: 'trash',     name: '倒垃圾', paths:
      '<path d="M3 6h18l-1.5 14a2 2 0 0 1-2 1.8H6.5a2 2 0 0 1-2-1.8z"/>'
    + '<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'
    + '<path d="M3 6h18"/>'
    + '<path d="M10 11v6"/>'
    + '<path d="M14 11v6"/>'
    },

    { key: 'sun',       name: '晒太阳', paths:
      '<circle cx="12" cy="12" r="4"/>'
    + '<path d="M12 2v2"/>'
    + '<path d="M12 20v2"/>'
    + '<path d="m4.93 4.93 1.41 1.41"/>'
    + '<path d="m17.66 17.66 1.41 1.41"/>'
    + '<path d="M2 12h2"/>'
    + '<path d="M20 12h2"/>'
    + '<path d="m4.93 19.07 1.41-1.41"/>'
    + '<path d="m17.66 6.34 1.41-1.41"/>'
    },

    { key: 'music',     name: '听歌',  paths:
      '<path d="M9 18V5l12-2v13"/>'
    + '<circle cx="6" cy="18" r="3"/>'
    + '<circle cx="18" cy="16" r="3"/>'
    },

    { key: 'heart',     name: '心情',  paths:
      '<path d="M19 14c1.5-1.5 3-3.4 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.2.8-4.5 2.3C10.7 3.8 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.1 1.5 4 3 5.5l7 7z"/>'
    },

    { key: 'check',     name: '打卡',  paths:
      '<circle cx="12" cy="12" r="9"/>'
    + '<path d="m8.5 12 2.5 2.5 4.5-4.5"/>'
    },

    { key: 'clock',     name: '作息',  paths:
      '<circle cx="12" cy="12" r="8.5"/>'
    + '<path d="M12 7.5V12l3.5 2"/>'
    },

    { key: 'wine',      name: '小酌',  paths:
      '<path d="M8 3h8l-1 6.5a3 3 0 0 1-3 2.5h0a3 3 0 0 1-3-2.5z"/>'
    + '<path d="M12 12v8"/>'
    + '<path d="M8 20h8"/>'
    },

    { key: 'chat',      name: '复盘',  paths:
      '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/>'
    },

    { key: 'star',      name: '目标',  paths:
      '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9L6.6 20l1-6.1L3.2 9.5l6.1-.9z"/>'
    },

    // ----- UI 内部图标 -----
    { key: 'volume',    name: '',      paths: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>' },
    { key: 'volume-off',name: '',      paths: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>' },
    { key: 'settings',  name: '',      paths: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>' },
    { key: 'plus',      name: '',      paths: '<path d="M12 5v14"/><path d="M5 12h14"/>' },
    { key: 'minus',     name: '',      paths: '<path d="M5 12h14"/>' },
    { key: 'close',     name: '',      paths: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>' },
    { key: 'chev-left', name: '',      paths: '<path d="m15 18-6-6 6-6"/>' },
    { key: 'chev-right',name: '',      paths: '<path d="m9 18 6-6-6-6"/>' },
    { key: 'chev-down', name: '',      paths: '<path d="m6 9 6 6 6-6"/>' },
    { key: 'check-circle',name:'',     paths: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/>' },
    { key: 'calendar',  name: '',      paths: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/>' },
    { key: 'quote',     name: '',      paths: '<path d="M6 18h4V9H7a4 4 0 0 1 4-4"/><path d="M14 18h4V9h-3a4 4 0 0 1 4-4"/>' },
    { key: 'upload',    name: '',      paths: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>' },
    { key: 'trash-ui',  name: '',      paths: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6 18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>' },
    { key: 'edit',      name: '',      paths: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4z"/>' },
    { key: 'download',  name: '',      paths: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>' },
    { key: 'info',      name: '',      paths: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>' }
  ];

  const ICON_INDEX = {};
  ICONS.forEach((ic) => (ICON_INDEX[ic.key] = ic));

  // emoji 备选（仅在图标选择器里展示为可选）
  const EMOJI_OPTIONS = [
    { emoji: '💩', name: '拉屎' },
    { emoji: '✨', name: '好事' },
    { emoji: '🍎', name: '吃饭' },
    { emoji: '🧘', name: '冥想' },
    { emoji: '🏃', name: '跑步' }
  ];

  // ---------- 2. 把图标注入 sprite ----------
  function mountSprite() {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('style', 'display:none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    ICONS.forEach((ic) => {
      const sym = document.createElementNS(SVG_NS, 'symbol');
      sym.setAttribute('id', 'dj-' + ic.key);
      sym.setAttribute('viewBox', '0 0 24 24');
      sym.setAttribute('fill', 'none');
      sym.setAttribute('stroke', 'currentColor');
      sym.setAttribute('stroke-width', '1.75');
      sym.setAttribute('stroke-linecap', 'round');
      sym.setAttribute('stroke-linejoin', 'round');
      sym.innerHTML = ic.paths;
      svg.appendChild(sym);
    });
    document.body.insertBefore(svg, document.body.firstChild);
  }

  // ---------- 3. 渲染助手 ----------
  // iconRef: {t:'b', k:'hair'} / {t:'c', id:'i_xx'} / {t:'e', emoji:'💩'}
  function iconHTML(ref, size, extraCls) {
    if (!ref) return '';
    size = size || 24;
    const cls = 'ic' + (extraCls ? ' ' + extraCls : '');
    if (ref.t === 'b' && ICON_INDEX[ref.k]) {
      return (
        '<svg class="' + cls + '" width="' + size + '" height="' + size +
        '"><use href="#dj-' + ref.k + '"/></svg>'
      );
    }
    if (ref.t === 'c') {
      // 由调用方传入 data-url
      return ref.url
        ? '<img class="' + cls + '" src="' + ref.url +
            '" width="' + size + '" height="' + size + '" alt="">'
        : '';
    }
    if (ref.t === 'e') {
      return (
        '<span class="' + cls +
        '" style="display:inline-flex;align-items:center;justify-content:center;' +
        'width:' + size + 'px;height:' + size + 'px;font-size:' +
        Math.round(size * 0.78) + 'px;line-height:1">' +
        (ref.emoji || '') + '</span>'
      );
    }
    return '';
  }

  // ---------- 4. 励志语录（自撰，离线可用） ----------
  const QUOTES = [
    '日拱一卒，功不唐捐。','慢慢来，比较快。','今天的记录，是明天的底气。','坚持就是胜利。',
    '小步走，不停步。','身体是唯一的本钱。','把小事做好，就是大事。','你不是一个人在坚持。',
    '今天的辛苦，换明天的轻松。','一滴水也能映出太阳。','日子在记录里会发光。','开始比完美更重要。',
    '种一棵树最好的时间是现在。','凡是过往，皆为序章。','慢慢走路，快快长大。','做，就对了。',
    '好的习惯，是给未来存钱。','记录，本身就是成长。','做对的事，剩下的交给时间。',
    '把今天过好，明天自然来。','简单的事，坚持做就不简单。','一日不读书，胸臆无佳想。','早起三光，晚起三慌。',
    '身体强健，灵魂自安。','保持节奏，不被带跑。','你比自己想的更厉害。','累，是因为在走上坡路。',
    '记录让坚持可见。','人最值得炫耀的，是自律。','种在心里的习惯最持久。',
    '今天没偷懒，明天感谢你。','认真生活的人，都自带光芒。','知止而后有定，定而后能静。',
    '流水不争先，争的是滔滔不绝。','千里之行，始于足下。','与其焦虑，不如记录。',
    '自律给我自由。','只要开始，就不算晚。','每天进步一点点。','想做就做，永远不嫌晚。',
    '把每天都过成想要的样子。','坚持是最朴素也最稀缺的品质。','小习惯，大改变。',
    '你坚持的样子很美。','好习惯受益一生。','记录今天，照见未来。','今日事，今日毕。',
    '一点点就是一大步。','不急，不停，不慌。','慢慢生活，好好生活。','日积月累，水滴石穿。',
    '今天也要元气满满。','照顾好自己，是最大的事。','日子不慌不忙，刚刚好。',
    '慢慢来，才最快。','先完成，再完美。','多想多做，少焦虑。','静水流深，沧笙踏歌。',
    '自爱，沉稳，而后爱人。','心境简单，日子就简单。','用心记，认真活。',
    '不疾而速，不行而至。','胸中有沟壑，眼里存山河。','心若简单，世界就简单。',
    '愿你眼里有光，心中有暖。','把日子过成一首小诗。','慢慢来，是顶级的自律。',
    '你只管努力，剩下的交给时间。','安静的人，往往最有力量。','你走的每一步都算数。',
    '别急，答案在路上。','愿你成为自己的太阳。','无论何时，记得好好吃饭。','记得喝水，记得休息。',
    '给时间一点时间。','愿你温柔，且有力量。','愿你心宽，似海；愿你眼明，如星。',
    '活好当下，便是最好。','记录就是最好的复盘。','心里有数，脚下有路。','每天一点点，年年一大变。',
    '慢慢熬，熬出真味。','不要小看一滴水的力量。','安安静静，认认真真。',
    '日子有功，功不唐捐。','今天也想成为更好的自己。','不乱于心，不困于情。','心若有所向往，何惧道阻且长。',
    '早起遇见一个更宽的世界。','小习惯，终成大器。','你自律的样子，真的很迷人。',
    '认真，是最高级的浪漫。','日复一日，自有万丈光芒。','人间清醒，持续自律。',
    '今天也要好好照顾自己。','好好生活，慢慢相遇。','做一颗不慌不忙的星星。','日子像花，慢慢开。'
  ];

  // ---------- 暴露 ----------
  window.ICONS = ICONS;
  window.ICON_INDEX = ICON_INDEX;
  window.EMOJI_OPTIONS = EMOJI_OPTIONS;
  window.iconHTML = iconHTML;
  window.mountSprite = mountSprite;
  window.QUOTES = QUOTES;
})();
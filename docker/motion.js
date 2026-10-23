/* Docker diagrams: preserve the shared player's presentation and timing. */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let activePlayer = null;
  const style = document.createElement('style');
  style.textContent = `@media (prefers-reduced-motion: no-preference) {
    .watch[data-docker-motion] > .pv > .board > .el {
      transition: transform 480ms var(--e-move), opacity 260ms var(--e-out),
        background-color 160ms ease, border-color 160ms ease, color 160ms ease;
    }
  }`;
  document.head.appendChild(style);

  window.Player = function(root, o) {
    const notes = o.scenes.map(s => `<li><h4><button class="step-trigger" type="button">${s.t}</button></h4><p>${s.p}</p></li>`).join('');
    root.classList.add('watch');
    root.setAttribute('data-docker-motion', '');
    root.innerHTML = `<div class="pv" tabindex="0" aria-label="课程图解；放大后可滚动查看，按 Escape 恢复适配"><div class="board"></div></div><div class="pc"><button class="btn pri pp" type="button"></button><button class="btn rp" type="button" aria-label="从头重播图解">${IC.re}重播</button><button class="btn zoom" type="button" aria-pressed="false" aria-label="放大图解，可滚动查看">放大</button><div class="tl" aria-hidden="true">${o.scenes.map(() => '<i><b></b></i>').join('')}</div><button class="btn pr" type="button" aria-label="上一步">‹</button><button class="btn nx" type="button" aria-label="下一步">›</button></div><ol class="notes">${notes}</ol>`;
    const pv = root.querySelector('.pv'), board = root.querySelector('.board');
    const pp = root.querySelector('.pp'), prev = root.querySelector('.pr'), next = root.querySelector('.nx');
    const zoom = root.querySelector('.zoom');
    const ticks = [...root.querySelectorAll('.tl i')];
    const fills = ticks.map(t => t.querySelector('b'));
    const lis = [...root.querySelectorAll('.notes li')], E = {}, S = o.scenes;
    for (const [id, d] of Object.entries(o.els)) {
      const n = document.createElement('div'), html = d.html || '', cls = d.cls || '';
      n.className = 'el ' + cls;
      n.style.width = d.w ? d.w + 'px' : 'max-content';
      if (d.h) n.style.height = d.h + 'px';
      n.innerHTML = html;
      n.style.opacity = 0;
      n.setAttribute('aria-hidden', 'true');
      board.appendChild(n);
      E[id] = {n, d, vis: false, key: null, html, cls};
    }
    let cur = -1, playing = false, tm = null, started = false, userPaused = false;
    let ended = false, remaining = 0, beganAt = 0, resumePending = false, visibleRatio = 0;
    let zoomed = false, frame = null, resizeFrame = null;
    const dur = i => Math.round((S[i].d || 3200) * 0.65);
    const owner = {pauseForOther() { pause(false); resumePending = false; }};

    // Read all dimensions together, after the scene's content has been updated.
    function camera(i) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const id in S[i].set) {
        const v = S[i].set[id], n = E[id].n;
        x0 = Math.min(x0, v[0]);
        y0 = Math.min(y0, v[1]);
        x1 = Math.max(x1, v[0] + n.offsetWidth);
        y1 = Math.max(y1, v[1] + n.offsetHeight);
      }
      if (!Number.isFinite(x0)) { x0 = y0 = 0; x1 = y1 = 1; }
      const r = pv.getBoundingClientRect(), pad = Math.min(r.width, r.height) * .1;
      const fit = Math.min(1.5, (r.width - pad * 2) / Math.max(1, x1 - x0), (r.height - pad * 2) / Math.max(1, y1 - y0));
      return {x0, y0, x1, y1, pad: zoomed ? 16 : pad, scale: zoomed ? Math.max(1, fit * 1.5) : fit};
    }
    function position(v, f) {
      return zoomed ? `translate(${v[0] - f.x0 + f.pad / f.scale}px,${v[1] - f.y0 + f.pad / f.scale}px)` : `translate(${v[0]}px,${v[1]}px)`;
    }
    function moveCamera(f, instant) {
      const center = zoomed && frame ? {
        x: frame.x0 + (pv.scrollLeft + pv.clientWidth / 2 - frame.pad) / frame.scale,
        y: frame.y0 + (pv.scrollTop + pv.clientHeight / 2 - frame.pad) / frame.scale
      } : null;
      if (instant) board.style.transition = 'none';
      Object.assign(board.style, zoomed ? {
        left: '0px', top: '0px', width: (f.x1 - f.x0 + 2 * f.pad / f.scale) + 'px',
        height: (f.y1 - f.y0 + 2 * f.pad / f.scale) + 'px', overflow: 'hidden'
      } : {left: '', top: '', width: '', height: '', overflow: ''});
      board.style.transform = zoomed ? `scale(${f.scale})` : `scale(${f.scale}) translate(${-(f.x0 + f.x1) / 2}px,${-(f.y0 + f.y1) / 2}px)`;
      if (instant) {
        void board.offsetWidth;
        board.style.transition = '';
      }
      if (zoomed) {
        // Preserve the world position under the viewport center as scenes change.
        pv.scrollLeft = center ? f.pad + (center.x - f.x0) * f.scale - pv.clientWidth / 2 : 0;
        pv.scrollTop = center ? f.pad + (center.y - f.y0) * f.scale - pv.clientHeight / 2 : 0;
      } else { pv.scrollLeft = 0; pv.scrollTop = 0; }
      frame = f;
    }
    function recamera() {
      const f = camera(cur);
      const transitions = [];
      for (const id in S[cur].set) {
        const n = E[id].n;
        transitions.push([n, n.style.transition]);
        n.style.transition = 'none';
        n.style.transform = position(S[cur].set[id], f);
      }
      // Camera rebasing is a layout adjustment, so commit it without motion.
      moveCamera(f, true);
      for (const [n, transition] of transitions) n.style.transition = transition;
    }
    function show(i, instant) {
      clearTimeout(tm);
      cur = i;
      ended = false;
      remaining = dur(i);
      const s = S[i], entering = new Map();
      // A fading-out element can reverse in place. Only fully hidden elements
      // need the original 14px entrance; do these reads before changing styles.
      for (const id in s.set) {
        const e = E[id];
        if (instant || (!e.vis && Number(getComputedStyle(e.n).opacity) === 0)) entering.set(e, s.set[id]);
      }
      for (const id in E) {
        const e = E[id], v = s.set[id];
        if (v) {
          const opt = v[2] || {};
          const html = opt.html !== undefined ? opt.html : (e.d.html || '');
          const cls = opt.cls !== undefined ? opt.cls : (e.d.cls || '');
          // Highlight changes must not recreate unchanged text and descendants.
          if (html !== e.html) { e.n.innerHTML = html; e.html = html; }
          if (cls !== e.cls) { e.n.className = 'el ' + cls; e.cls = cls; }
          e.key = JSON.stringify(opt);
        }
      }
      lis.forEach((l, k) => {
        l.classList.toggle('on', k === i);
        const trigger = l.querySelector('.step-trigger');
        if (k === i) trigger.setAttribute('aria-current', 'step');
        else trigger.removeAttribute('aria-current');
      });
      ticks.forEach((t, k) => { t.className = k < i ? 'd' : k === i ? 'c' : ''; });
      root.style.setProperty('--dur', dur(i) + 'ms');
      fills[i].style.animation = 'none';

      const f = camera(i);
      for (const [e, v] of entering) {
        e.n.style.transition = 'none';
        e.n.style.transform = position([v[0], v[1] + (instant || motion.matches ? 0 : 14)], f);
      }
      // Commit entrances and the progress reset before enabling transitions.
      void board.offsetWidth;
      for (const id in E) {
        const e = E[id], v = s.set[id];
        e.n.setAttribute('aria-hidden', v ? 'false' : 'true');
        if (v) {
          if (entering.has(e)) e.n.style.transition = '';
          e.n.style.transform = position(v, f);
          e.n.style.opacity = 1;
          e.vis = true;
        } else if (e.vis) {
          e.n.style.opacity = 0;
          e.vis = false;
        }
      }
      moveCamera(f, instant);
      fills[i].style.animation = '';
      if (s.on) s.on(E);
      sched();
      ui();
    }
    function sched() {
      clearTimeout(tm);
      if (!playing) return;
      beganAt = performance.now();
      tm = setTimeout(() => {
        remaining = 0;
        if (cur < S.length - 1) show(cur + 1);
        else {
          playing = false;
          ended = true;
          resumePending = false;
          if (activePlayer === owner) activePlayer = null;
          ticks[cur].className = 'd';
          ui();
        }
      }, remaining);
    }
    function ui() {
      const label = playing ? '暂停' : ended ? '再看一遍' : '播放';
      pp.innerHTML = (playing ? IC.pause : ended ? IC.re : IC.play) + label;
      pp.setAttribute('aria-label', label + '图解');
      pp.setAttribute('aria-pressed', String(playing));
      root.classList.toggle('paused', !playing);
      prev.disabled = cur <= 0;
      next.disabled = cur >= S.length - 1;
    }
    function start() {
      if (playing) return;
      if (activePlayer && activePlayer !== owner) activePlayer.pauseForOther();
      activePlayer = owner;
      playing = true;
      started = true;
      resumePending = false;
      sched();
      ui();
    }
    function play() {
      userPaused = false;
      started = true;
      if (ended) show(0);
      if (!document.hidden && visibleRatio > 0) start();
      else { resumePending = true; ui(); }
    }
    function pause(u) {
      if (playing) remaining = Math.max(0, remaining - (performance.now() - beganAt));
      playing = false;
      clearTimeout(tm);
      if (activePlayer === owner) activePlayer = null;
      if (u) { userPaused = true; resumePending = false; }
      ui();
    }
    function visibility() {
      if (document.hidden || visibleRatio === 0) {
        if (playing) { pause(false); resumePending = true; }
      } else if (!userPaused && !motion.matches && ((!started && visibleRatio >= .55) || resumePending)) start();
    }
    function setZoom(value) {
      pause(true);
      zoomed = value;
      frame = null;
      pv.classList.toggle('is-zoomed', value);
      zoom.textContent = value ? '适配' : '放大';
      zoom.setAttribute('aria-pressed', String(value));
      zoom.setAttribute('aria-label', value ? '恢复图解适配大小' : '放大图解，可滚动查看');
      recamera();
    }
    pp.addEventListener('click', () => playing ? pause(true) : play());
    root.querySelector('.rp').addEventListener('click', () => { pause(false); show(0); play(); });
    zoom.addEventListener('click', () => setZoom(!zoomed));
    pv.addEventListener('keydown', e => { if (e.key === 'Escape' && zoomed) { setZoom(false); zoom.focus(); } });
    prev.addEventListener('click', () => { pause(true); show(Math.max(0, cur - 1)); });
    next.addEventListener('click', () => { pause(true); show(Math.min(S.length - 1, cur + 1)); });
    lis.forEach((l, k) => l.addEventListener('click', () => { pause(true); show(k); }));
    show(0, true);
    pause();
    new IntersectionObserver(([e]) => {
      visibleRatio = e.isIntersecting ? e.intersectionRatio : 0;
      visibility();
    }, {threshold: [0, .55]}).observe(pv);
    document.addEventListener('visibilitychange', visibility);
    motion.addEventListener('change', () => {
      if (motion.matches) { pause(false); resumePending = false; }
      else visibility();
    });
    function requestCamera() {
      if (resizeFrame !== null) return;
      resizeFrame = requestAnimationFrame(() => { resizeFrame = null; recamera(); });
    }
    addEventListener('resize', requestCamera);
    if (document.fonts) {
      document.fonts.ready.then(requestCamera);
      document.fonts.addEventListener('loadingdone', requestCamera);
    }
    return {show, play, pause, E};
  };
})();

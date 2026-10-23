/* Docker diagrams: preserve the shared player's presentation and timing. */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const style = document.createElement('style');
  style.textContent = `@media (prefers-reduced-motion: no-preference) {
    .watch[data-docker-motion] > .pv > .board > .el {
      transition: transform 480ms var(--e-move), opacity 260ms var(--e-out),
        background-color 160ms ease, border-color 160ms ease, color 160ms ease;
    }
  }`;
  document.head.appendChild(style);

  window.Player = function(root, o) {
    const notes = o.scenes.map(s => `<li><h4>${s.t}</h4><p>${s.p}</p></li>`).join('');
    root.classList.add('watch');
    root.setAttribute('data-docker-motion', '');
    root.innerHTML = `<div class="pv"><div class="board"></div></div><div class="pc"><button class="btn pri pp"></button><button class="btn rp">${IC.re}重播</button><div class="tl">${o.scenes.map(() => '<i><b></b></i>').join('')}</div><button class="btn pr" aria-label="上一步">‹</button><button class="btn nx" aria-label="下一步">›</button></div><ol class="notes">${notes}</ol>`;
    const pv = root.querySelector('.pv'), board = root.querySelector('.board');
    const pp = root.querySelector('.pp'), prev = root.querySelector('.pr'), next = root.querySelector('.nx');
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
      board.appendChild(n);
      E[id] = {n, d, vis: false, key: null, html, cls};
    }
    let cur = -1, playing = false, tm = null, started = false, userPaused = false;
    let resizeFrame = null;
    const dur = i => Math.round((S[i].d || 3200) * 0.65);

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
      const r = pv.getBoundingClientRect(), pad = Math.min(r.width, r.height) * .1;
      const k = Math.min(1.5, (r.width - pad * 2) / (x1 - x0), (r.height - pad * 2) / (y1 - y0));
      return `scale(${k}) translate(${-(x0 + x1) / 2}px,${-(y0 + y1) / 2}px)`;
    }
    function moveCamera(transform, instant) {
      if (instant) board.style.transition = 'none';
      board.style.transform = transform;
      if (instant) {
        void board.offsetWidth;
        board.style.transition = '';
      }
    }
    function show(i, instant) {
      cur = i;
      const s = S[i], entering = new Set();
      // A fading-out element can reverse in place. Only fully hidden elements
      // need the original 14px entrance; do these reads before changing styles.
      for (const id in s.set) {
        const e = E[id];
        if (instant || (!e.vis && Number(getComputedStyle(e.n).opacity) === 0)) entering.add(e);
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
          if (entering.has(e)) {
            e.n.style.transition = 'none';
            e.n.style.transform = `translate(${v[0]}px,${v[1] + (instant || motion.matches ? 0 : 14)}px)`;
          }
        }
      }
      lis.forEach((l, k) => l.classList.toggle('on', k === i));
      ticks.forEach((t, k) => { t.className = k < i ? 'd' : k === i ? 'c' : ''; });
      root.style.setProperty('--dur', dur(i) + 'ms');
      fills[i].style.animation = 'none';

      // This single measurement phase commits every entrance and progress reset.
      // There are no writes between element size reads, unlike the shared loop.
      const transform = camera(i);
      for (const id in E) {
        const e = E[id], v = s.set[id];
        if (v) {
          if (entering.has(e)) e.n.style.transition = '';
          e.n.style.transform = `translate(${v[0]}px,${v[1]}px)`;
          e.n.style.opacity = 1;
          e.vis = true;
        } else if (e.vis) {
          e.n.style.opacity = 0;
          e.vis = false;
        }
      }
      moveCamera(transform, instant);
      fills[i].style.animation = '';
      if (s.on) s.on(E);
      sched();
      ui();
    }
    function sched() {
      clearTimeout(tm);
      if (!playing) return;
      tm = setTimeout(() => {
        if (cur < S.length - 1) show(cur + 1);
        else { playing = false; ticks[cur].className = 'd'; ui(); }
      }, dur(cur));
    }
    function ui() {
      const end = !playing && cur === S.length - 1 && ticks[cur].className === 'd';
      pp.innerHTML = playing ? IC.pause + '暂停' : end ? IC.re + '再看一遍' : IC.play + '播放';
      root.classList.toggle('paused', !playing);
      prev.disabled = cur <= 0;
      next.disabled = cur >= S.length - 1;
    }
    function play() {
      if (cur === S.length - 1 && !playing) { playing = true; show(0); return; }
      playing = true;
      userPaused = false;
      show(cur < 0 ? 0 : cur);
    }
    function pause(u) {
      playing = false;
      clearTimeout(tm);
      if (u) userPaused = true;
      ui();
    }
    pp.addEventListener('click', () => playing ? pause(true) : play());
    root.querySelector('.rp').addEventListener('click', () => { playing = true; userPaused = false; show(0); });
    prev.addEventListener('click', () => { pause(true); show(Math.max(0, cur - 1)); });
    next.addEventListener('click', () => { pause(true); show(Math.min(S.length - 1, cur + 1)); });
    lis.forEach((l, k) => l.addEventListener('click', () => { pause(true); show(k); }));
    show(0, true);
    pause();
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!started) { started = true; playing = true; show(0); }
        else if (!userPaused && cur < S.length - 1 && !playing) { playing = true; show(cur); }
      } else if (playing) pause();
    }, {threshold: .55}).observe(pv);
    addEventListener('resize', () => {
      if (resizeFrame !== null) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        moveCamera(camera(cur), true);
      });
    });
    return {show, play, pause, E};
  };
})();

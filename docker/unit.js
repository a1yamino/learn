/* Docker 主线（第二版）：图解播放器与推演题。只在 docker/uNN.html 使用。 */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const STEP_MS = 3200;

  function Diagram(fig) {
    const data = JSON.parse(fig.dataset.diagram);
    const stage = fig.querySelector('.u2-stage');
    const cap = fig.querySelector('.u2-cap');
    const ticks = fig.querySelector('.u2-ticks');
    let step = -1, timer = null, playing = false, shown = false, compact = null, nodes = {}, edges = [];

    data.steps.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'u2-tick'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `第 ${i + 1} 步：${s.t}`);
      b.innerHTML = '<i></i>';
      b.addEventListener('click', () => { stop(); go(i); });
      ticks.appendChild(b);
    });

    function layout() {
      const isCompact = fig.clientWidth < 600;
      if (isCompact === compact) return;
      compact = isCompact;
      const NW = compact ? 210 : 236, NH = compact ? 104 : 80;
      const GX = compact ? 96 : 128, GY = compact ? 92 : 96;
      const pos = n => compact ? [n.r, n.c] : [n.c, n.r];
      const cols = 1 + Math.max(...data.nodes.map(n => pos(n)[0]));
      const rows = 1 + Math.max(...data.nodes.map(n => pos(n)[1]));
      const W = cols * NW + (cols - 1) * GX + 24, H = rows * NH + (rows - 1) * GY + 24;
      stage.innerHTML = '';
      const svg = el('svg', {viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': data.label, class: 'u2-svg' + (compact ? ' compact' : '')}, stage);
      const defs = el('defs', {}, svg);
      const mk = el('marker', {id: 'ah' + fig.dataset.k, viewBox: '0 0 10 10', refX: 8.5, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse'}, defs);
      el('path', {d: 'M1 1.5L8.5 5L1 8.5', class: 'u2-ah'}, mk);
      const gE = el('g', {class: 'u2-edges'}, svg), gN = el('g', {class: 'u2-nodes'}, svg), gL = el('g', {class: 'u2-labels'}, svg);
      nodes = {};
      data.nodes.forEach((n, i) => {
        const [c, r] = pos(n);
        const x = 12 + c * (NW + GX), y = 12 + r * (NH + GY);
        const g = el('g', {class: 'u2-node', style: `--i:${i}`}, gN);
        el('rect', {x, y, width: NW, height: NH, rx: 12}, g);
        const t = el('text', {x: x + 18, y: y + (compact ? 44 : 34), class: 'u2-nt'}, g); t.textContent = n.t;
        const dd = el('text', {x: x + 18, y: y + (compact ? 80 : 60), class: 'u2-nd'}, g); dd.textContent = n.d;
        nodes[n.id] = {g, x, y, w: NW, h: NH, cx: x + NW / 2, cy: y + NH / 2};
      });
      const clip = (a, b) => {
        const dx = b.cx - a.cx, dy = b.cy - a.cy;
        const s = Math.min(Math.abs((a.w / 2 + 6) / (dx || 1e-6)), Math.abs((a.h / 2 + 6) / (dy || 1e-6)));
        return [a.cx + dx * s, a.cy + dy * s];
      };
      edges = data.edges.map((ed, i) => {
        const A = nodes[ed.f], B = nodes[ed.to];
        const [x1, y1] = clip(A, B), [x2, y2] = clip(B, A);
        const d = `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
        const g = el('g', {class: 'u2-edge', style: `--i:${i}`}, gE);
        el('path', {d, pathLength: 1, class: 'u2-line', 'marker-end': `url(#ah${fig.dataset.k})`}, g);
        const dot = el('circle', {r: compact ? 6 : 5, class: 'u2-pulse'}, g);
        const am = el('animateMotion', {dur: '1.15s', repeatCount: 'indefinite', path: d, calcMode: 'spline', keyTimes: '0;1', keyPoints: '0;1', keySplines: '0.23 1 0.32 1'}, dot);
        let lab = null;
        if (ed.l) {
          lab = el('g', {class: 'u2-el'}, gL);
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          const w = [...ed.l].reduce((a, ch) => a + (ch.charCodeAt(0) > 255 ? 1 : 0.58), 0) * (compact ? 20 : 14.5) + (compact ? 22 : 18), h = compact ? 32 : 24;
          el('rect', {x: mx - w / 2, y: my - h / 2, width: w, height: h, rx: h / 2}, lab);
          const tx = el('text', {x: mx, y: my + (compact ? 7 : 5), 'text-anchor': 'middle'}, lab); tx.textContent = ed.l;
        }
        return {ed, g, lab, am};
      });
      if (shown) svg.classList.add('in');
      if (step >= 0) paint();
    }

    function paint() {
      const s = data.steps[step];
      const f = new Set(s.f);
      fig.classList.add('has-step');
      for (const id in nodes) nodes[id].g.classList.toggle('on', f.has(id));
      edges.forEach(({ed, g, lab}) => {
        const on = f.has(ed.f) && f.has(ed.to);
        g.classList.toggle('on', on);
        if (lab) lab.classList.toggle('on', on);
      });
      cap.innerHTML = `<span class="u2-n">${String(step + 1).padStart(2, '0')} / ${String(data.steps.length).padStart(2, '0')}</span><strong></strong><span class="u2-cb"></span>`;
      cap.querySelector('strong').textContent = s.t;
      cap.querySelector('.u2-cb').textContent = s.b;
      cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap');
      [...ticks.children].forEach((b, i) => {
        b.classList.toggle('done', i < step); b.classList.toggle('cur', i === step);
        b.setAttribute('aria-selected', i === step);
      });
      fig.querySelector('[data-act=prev]').disabled = step <= 0;
      fig.querySelector('[data-act=next]').disabled = step >= data.steps.length - 1;
    }
    function go(i) { step = Math.max(0, Math.min(data.steps.length - 1, i)); paint(); }
    function stop() { playing = false; clearTimeout(timer); fig.classList.remove('playing'); }
    function tick() {
      if (!playing) return;
      if (step >= data.steps.length - 1) { stop(); fig.classList.add('ended'); return; }
      go(step + 1); timer = setTimeout(tick, STEP_MS);
    }
    function play(from = 0) {
      stop(); fig.classList.remove('ended'); playing = true; fig.classList.add('playing');
      fig.style.setProperty('--step-ms', STEP_MS + 'ms');
      go(from); timer = setTimeout(tick, STEP_MS);
    }
    fig.querySelector('[data-act=prev]').addEventListener('click', () => { stop(); go(step - 1); });
    fig.querySelector('[data-act=next]').addEventListener('click', () => { stop(); go(step + 1); });
    fig.querySelector('[data-act=replay]').addEventListener('click', () => {
      const svg = stage.querySelector('svg');
      svg.classList.remove('in'); void svg.getBoundingClientRect(); svg.classList.add('in');
      play(0);
    });

    layout();
    new ResizeObserver(() => layout()).observe(fig);
    let started = false;
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) {
        if (!started) {
          started = true; shown = true;
          stage.querySelector('svg').classList.add('in');
          setTimeout(() => play(0), reduce.matches ? 0 : 420);
        } else if (fig.classList.contains('paused')) {
          fig.classList.remove('paused'); playing = true; fig.classList.add('playing'); timer = setTimeout(tick, STEP_MS);
        }
      } else if (playing) { stop(); fig.classList.add('paused'); }
    }, {threshold: 0.45}).observe(fig);
    document.addEventListener('visibilitychange', () => { if (document.hidden && playing) { stop(); fig.classList.add('paused'); } });
  }

  function Predict(box) {
    const ans = +box.dataset.answer;
    const reveal = box.nextElementSibling;
    box.querySelectorAll('.u2-opt').forEach(b => b.addEventListener('click', () => {
      if (box.classList.contains('answered')) return;
      const i = +b.dataset.i;
      box.classList.add('answered');
      box.querySelectorAll('.u2-opt').forEach(o => {
        o.setAttribute('aria-disabled', 'true');
        if (+o.dataset.i === ans) o.classList.add('right');
      });
      if (i !== ans) b.classList.add('wrong');
      reveal.querySelector('.u2-verdict').textContent = i === ans ? '猜对了。原因是这样的：' : `正确答案是 ${'ABC'[ans]}。原因是这样的：`;
      reveal.hidden = false;
      requestAnimationFrame(() => reveal.classList.add('open'));
    }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-diagram]').forEach((f, i) => { f.dataset.k = i; Diagram(f); });
    document.querySelectorAll('.u2-opts').forEach(Predict);
  });
})();

/* Principle-first Docker course: diagrams and local, self-reported study notes. */
window.DockerCourse = (() => {
  const read = n => {
    try { return JSON.parse(localStorage.getItem('learn.docker.unit.' + n)) || {}; }
    catch (_) { return {}; }
  };
  const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function initLesson() {
    const data = JSON.parse(document.getElementById('lesson-data').textContent);
    const {nodes, edges, steps, label} = data.diagram;
    const els = {};
    nodes.forEach(node => {
      els[node.id] = {w: node.w || 200, h: 72, cls: 'blk course-node',
        html: '<strong>' + escape(node.title) + '</strong><span>' + escape(node.detail) + '</span>'};
    });
    const scenes = steps.map(step => {
      const set = {};
      nodes.forEach(node => {
        set[node.id] = [node.x, node.y, {cls: 'blk course-node' + (step.focus.includes(node.id) ? ' sig' : '')}];
      });
      return {t: escape(step.title), p: escape(step.body), d: Math.max(5000, step.body.length * 120),
        set, focus: step.focus,
        activeEdges: edges.filter(edge => step.focus.includes(edge.from) && step.focus.includes(edge.to))
          .map(edge => edge.id || edge.from + '->' + edge.to)};
    });
    const root = document.getElementById('unit-player');
    Player(root, {els, edges, scenes, autoplay: false, durationScale: 1, fixedCamera: true,
      speeds: [0.5, 1, 1.5]});
    root.querySelector('.pv').setAttribute('aria-label', label + '；分步教学模型');

    const state = read(data.number);
    const notice = document.getElementById('save-state');
    const save = () => {
      try {
        localStorage.setItem('learn.docker.unit.' + data.number, JSON.stringify(state));
        const message = '已保存到本机浏览器；勾选是学习记录，不代表自动验收。';
        if (notice.textContent !== message) notice.textContent = message;
      } catch (_) {
        notice.textContent = '浏览器未允许保存；请自行复制草稿和实验结果。';
      }
    };
    document.querySelectorAll('[data-draft]').forEach(field => {
      field.value = state[field.dataset.draft] || '';
      field.addEventListener('input', () => { state[field.dataset.draft] = field.value; save(); });
    });
    document.querySelectorAll('[data-completion]').forEach(field => {
      field.checked = state[field.dataset.completion] === true;
      field.addEventListener('change', () => { state[field.dataset.completion] = field.checked; save(); });
    });
  }

  function initIndex() {
    const paint = () => document.querySelectorAll('[data-unit-status]').forEach(label => {
        const state = read(label.dataset.unitStatus);
        const done = state.lab === true && state.interview === true;
        label.textContent = done ? '已自检' : state.lab || state.interview ? '进行中' : '待学习';
        label.classList.toggle('ok', done);
      });
    addEventListener('pageshow', paint);
    paint();
  }
  return {initLesson, initIndex};
})();

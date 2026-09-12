const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero = document.querySelector('.hero');
const floaters = [...document.querySelectorAll('[data-depth]')];

if (hero && !reduceMotion) {
  hero.addEventListener('pointermove', (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    floaters.forEach((item) => {
      const depth = Number(item.dataset.depth || 1);
      item.style.translate = `${x * 16 * depth}px ${y * 12 * depth}px`;
    });
  });
  hero.addEventListener('pointerleave', () => {
    floaters.forEach((item) => { item.style.translate = '0 0'; });
  });
}

const orbitCards = [...document.querySelectorAll('.orbit-card')];
const introMessage = document.querySelector('.intro-message');
orbitCards.forEach((card) => {
  card.addEventListener('click', (event) => {
    const bounds = card.getBoundingClientRect();
    card.style.setProperty('--click-x', `${event.clientX - bounds.left}px`);
    card.style.setProperty('--click-y', `${event.clientY - bounds.top}px`);
    orbitCards.forEach((item) => item.classList.toggle('is-active', item === card));
    hero?.classList.remove('is-reacting');
    void hero?.offsetWidth;
    hero?.classList.add('is-reacting');

    if (introMessage) {
      introMessage.classList.add('is-changing');
      window.setTimeout(() => {
        introMessage.textContent = card.dataset.message || introMessage.textContent;
        introMessage.classList.remove('is-changing');
      }, 180);
    }

    window.setTimeout(() => {
      document.querySelector(card.dataset.target)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      card.classList.remove('is-active');
      hero?.classList.remove('is-reacting');
    }, 620);
  });
});

let scrollFrame = 0;
const updateScrollEffects = () => {
  scrollFrame = 0;
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(window.scrollY / maxScroll, 1);
  document.documentElement.style.setProperty('--scroll-progress', `${progress * 100}%`);
  if (hero) {
    const heroProgress = Math.min(Math.max(window.scrollY / Math.max(hero.offsetHeight, 1), 0), 1);
    hero.style.setProperty('--hero-scroll', heroProgress.toFixed(3));
  }
};
window.addEventListener('scroll', () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollEffects);
}, { passive: true });
updateScrollEffects();

const canvas = document.querySelector('#signal-field');
if (canvas && hero) {
  const context = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let points = [];
  let animationFrame = 0;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.max(24, Math.min(58, Math.floor(width / 24)));
    points = Array.from({ length: count }, (_, index) => ({
      x: (index * 137.5) % width,
      y: (index * 83.3) % height,
      vx: ((index % 5) - 2) * 0.045,
      vy: ((index % 7) - 3) * 0.028,
      r: index % 9 === 0 ? 1.6 : 1
    }));
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    points.forEach((point) => {
      point.x += point.vx;
      point.y += point.vy;
      if (point.x < 0 || point.x > width) point.vx *= -1;
      if (point.y < 0 || point.y > height) point.vy *= -1;
    });
    for (let first = 0; first < points.length; first += 1) {
      for (let second = first + 1; second < points.length; second += 1) {
        const dx = points[first].x - points[second].x;
        const dy = points[first].y - points[second].y;
        const distance = Math.hypot(dx, dy);
        if (distance < 145) {
          context.strokeStyle = `rgba(109,242,255,${(1 - distance / 145) * 0.18})`;
          context.lineWidth = 0.7;
          context.beginPath();
          context.moveTo(points[first].x, points[first].y);
          context.lineTo(points[second].x, points[second].y);
          context.stroke();
        }
      }
    }
    points.forEach((point) => {
      context.fillStyle = point.r > 1 ? 'rgba(255,106,61,.78)' : 'rgba(109,242,255,.55)';
      context.beginPath();
      context.arc(point.x, point.y, point.r, 0, Math.PI * 2);
      context.fill();
    });
    if (!reduceMotion) animationFrame = requestAnimationFrame(draw);
  };

  resize();
  draw();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame), { once: true });
}

if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.transform = `perspective(1100px) rotateX(${-y * 2.6}deg) rotateY(${x * 2.6}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

const revealTargets = document.querySelectorAll('.lab-console, .protocol-grid li, .case, .timeline article, .matrix > div');
if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach((target, index) => {
    target.classList.add('reveal');
    target.style.setProperty('--delay', `${(index % 4) * 70}ms`);
    observer.observe(target);
  });
}

const sections = document.querySelectorAll('.showcase, .protocol, .work, .experience, .toolkit, .contact');
if ('IntersectionObserver' in window && !reduceMotion) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('section-enter');
    });
  }, { threshold: 0.06 });
  sections.forEach((section) => sectionObserver.observe(section));
}

// Public projects are loaded only after a visitor chooses to run one.
const projects = [
  {
    slug: 'rdfz-xs-zhanjia-simulator', title: '3D 支架设计模拟', kind: '交互仿真 / 教学应用',
    stack: ['Three.js', 'WebGL', '参数联动'],
    summary: '把支架角度、展品与观察视线放进同一个 3D 场景，让抽象的结构设计变成可以调整和观察的模型。',
    problem: '结构设计只看平面图，不容易理解角度、视线与稳定性的关系。',
    implementation: 'Three.js 构建三维几何；界面参数驱动模型更新；共享支架参数联动展览与力学视图。',
    try: '拖动旋转模型 → 调整开合角 → 切换「3D 物理重心」观察另一视图。'
  },
  {
    slug: 'rdfx-grade3-knowledge-graph', title: '交互式知识图谱', kind: '知识可视化 / 智能体公开模块',
    stack: ['JavaScript', 'ECharts', '图谱交互', 'API 模块'],
    summary: '以三年级数学与科学为已落地内容，把知识点和连接关系呈现为可缩放、可拖动的交互图谱，作为跨学科教学方案的公开模块。',
    problem: '教师需要找到跨学科知识连接，而不仅是得到一段泛化的活动建议。',
    implementation: 'ECharts 渲染节点与关系；图谱核心逻辑共享过滤与布局计算；仓库另提供知识搜索、跨学科查询及图像快照 API。',
    try: '缩放与拖动图谱 → 查看知识节点和连接。云端快照与保存 API 需要部署环境，不视为静态页已验证能力。'
  },
  {
    slug: 'html-ppt-editor', title: 'HTML PPT 编辑器', kind: '可视化工具 / 内容生产',
    stack: ['JavaScript', 'DOM 编辑', '拖拽交互', 'HTML 导入 / 导出'],
    summary: '把 AI 生成的 HTML 演示稿变成可视化编辑对象，调整文字、位置、尺寸、样式与动画，而不必每次回到代码里修改。',
    problem: '生成好的 HTML PPT 不便直接微调，老师需要像编辑幻灯片一样修改页面。',
    implementation: '导入 HTML 内容，选中页面元素后映射到属性面板；提供位置与尺寸调整、样式与动画编辑、HTML 导出。',
    try: '点击「载入示例」→ 选择文字或形状 → 修改属性或位置。也可在本地导入自己的 HTML 演示稿。'
  },
  {
    slug: 'fengxianhua-lab', title: '凤仙花虚拟实验室', kind: '课堂实验 / 交互式 Web',
    stack: ['HTML', 'JavaScript', '拖拽操作', '实验参数'],
    summary: '把播种布局、种子、水壶和肥料等实验操作放进网页，提供可以动手操作的课堂实验界面。',
    problem: '仅靠图片讲解实验，学生难以参与播种布局与操作过程。',
    implementation: '播种行列参数联动数量、行距与株距显示；操作工具支持拖拽到种植槽；界面提供生长数据记录与重置实验。',
    try: '切换播种行列 → 拖动种子、水壶或肥料 → 观察实验区响应。'
  },
  {
    slug: 'rdfx-yuwen-board', title: '语文课堂互动板', kind: '课堂展示 / 教师需求适配',
    stack: ['HTML', 'JavaScript', '数据刷新', '课堂 UI'],
    summary: '围绕学生问题的课堂呈现搭建互动展示页面，让教学需求从口头描述变成老师可以直接打开使用的界面。',
    problem: '课堂中需要把学生的问题集中呈现，让提问与讨论有清晰的展示载体。',
    implementation: '用 HTML 与 JavaScript 按类别和小组呈现学生问题；提供数据刷新、自动刷新开关与正文字号调节，适配课堂展示。',
    try: '查看分组问题 → 调整正文字号 → 切换自动刷新开关。'
  }
];
const projectTabs = [...document.querySelectorAll('[data-project]')];
const demoDialog = document.querySelector('#demo-dialog');
let selectedProject = 0;
let launchButton = null;
const projectURL = (project) => `https://bonnybing.github.io/${project.slug}/`;

function selectProject(index) {
  selectedProject = index;
  const project = projects[index];
  projectTabs.forEach((tab, position) => {
    tab.setAttribute('aria-selected', String(position === index));
    tab.tabIndex = position === index ? 0 : -1;
  });
  document.querySelector('#project-panel').setAttribute('aria-labelledby', `project-tab-${index}`);
  ['title', 'kind', 'summary', 'problem', 'implementation', 'try'].forEach((field) => {
    document.querySelector(`#project-${field}`).textContent = project[field];
  });
  const preview = document.querySelector('#project-preview');
  preview.src = `./assets/projects/${project.slug}.webp`;
  preview.alt = `${project.title}的真实页面截图`;
  document.querySelector('#preview-path').textContent = `bonnybing / ${project.slug}`;
  document.querySelector('#project-source').href = `https://github.com/BonnyBing/${project.slug}`;
  document.querySelector('#project-stack').replaceChildren(...project.stack.map((label) => {
    const tag = document.createElement('span'); tag.textContent = label; return tag;
  }));
  const lab = document.querySelector('.lab-console');
  lab.classList.remove('is-switching');
  void lab.offsetWidth;
  lab.classList.add('is-switching');
}
projectTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectProject(index));
  tab.addEventListener('keydown', (event) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = projects.length - 1;
    else next = (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + projects.length) % projects.length;
    selectProject(next); projectTabs[next].focus();
    projectTabs[next].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});
const detailToggle = document.querySelector('#detail-toggle');
detailToggle?.addEventListener('click', () => {
  const expanded = detailToggle.getAttribute('aria-expanded') !== 'true';
  detailToggle.setAttribute('aria-expanded', String(expanded));
  detailToggle.textContent = expanded ? '收起实现 −' : '拆开看实现 +';
  document.querySelector('#project-details').hidden = !expanded;
});
document.querySelectorAll('[data-launch-demo]').forEach((button) => {
  button.addEventListener('click', () => {
    const project = projects[selectedProject];
    if (!demoDialog?.showModal) { window.open(projectURL(project), '_blank', 'noopener,noreferrer'); return; }
    launchButton = button;
    document.querySelector('#demo-title').textContent = project.title;
    document.querySelector('#demo-external').href = projectURL(project);
    const status = document.querySelector('#demo-status');
    status.textContent = '正在加载公开作品；若显示异常，可在新窗口打开。3D / 编辑器类作品建议电脑体验。';
    const frame = document.createElement('iframe');
    frame.title = `${project.title}在线体验`;
    frame.src = projectURL(project);
    frame.setAttribute('allowfullscreen', '');
    frame.addEventListener('load', () => {
      status.textContent = '已打开公开作品。若页面空白或功能受限，请在新窗口打开；服务接口可能需要单独配置。';
    }, { once: true });
    document.querySelector('#demo-frame').replaceChildren(frame);
    demoDialog.showModal();
    document.body.style.overflow = 'hidden';
  });
});
document.querySelector('#demo-close')?.addEventListener('click', () => demoDialog.close());
demoDialog?.addEventListener('close', () => {
  document.querySelector('#demo-frame').replaceChildren();
  document.body.style.overflow = '';
  launchButton?.focus();
});

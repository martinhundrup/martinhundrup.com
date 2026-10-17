import { projects } from './projects.js';
import { initPlayground } from './playground.js';
import { initCarousel } from './carousel.js';
const grid = document.querySelector('#project-grid');
const projectCarousel = initCarousel(document.querySelector('#project-carousel'));
const filters = [...document.querySelectorAll('[data-filter]')];
let activeFilter = 'all';

function projectCard(project) {
  const link = document.createElement('a');
  link.className = `project-card${project.featured ? ' featured' : ''}`;
  link.href = project.url;
  if (!project.url.startsWith('/')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  const visual = document.createElement('div');
  visual.className = 'project-visual';
  const image = document.createElement('img');
  image.src = project.image; image.alt = project.imageAlt; image.loading = 'lazy'; image.width = 800; image.height = 540;
  if (project.pixel) image.className = 'pixel-art';
  visual.append(image);
  if (project.featured) {
    const badge = document.createElement('span'); badge.className = 'project-badge mono'; badge.textContent = '✳ FRESH FROM THE WORKBENCH'; visual.append(badge);
  }
  const arrow = document.createElement('span'); arrow.className = 'project-open'; arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '↗'; visual.append(arrow);
  const body = document.createElement('div'); body.className = 'project-body';
  const type = document.createElement('p'); type.className = 'project-type mono'; type.textContent = project.type;
  const title = document.createElement('h3'); title.textContent = project.title;
  const description = document.createElement('p'); description.className = 'project-description'; description.textContent = project.description;
  const foot = document.createElement('div'); foot.className = 'project-foot';
  const host = document.createElement('span'); host.className = 'project-host mono'; host.textContent = project.host;
  const action = document.createElement('span'); action.className = 'project-action'; action.textContent = `${project.action} ↗`;
  foot.append(host, action); body.append(type, title, description, foot); link.append(visual, body);
  return link;
}
function renderProjects() {
  const matching = projects.filter(project => activeFilter === 'all' || project.category === activeFilter);
  grid.replaceChildren(...matching.map(projectCard));
  projectCarousel.refresh();
  document.querySelector('#project-status').textContent = `${matching.length} ${activeFilter === 'all' ? 'projects' : activeFilter} in the carousel.`;
}
for (const filter of filters) {
  const category = filter.dataset.filter;
  document.querySelector(`[data-count="${category}"]`).textContent = projects.filter(project => category === 'all' || project.category === category).length;
  filter.addEventListener('click', () => {
    activeFilter = category;
    for (const button of filters) { const selected = button === filter; button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected)); }
    renderProjects();
  });
}
initCarousel(document.querySelector('#appearance-carousel'), { interval: 6000 });
initPlayground(document.querySelector('.hero-art'));
document.querySelector('#year').textContent = new Date().getFullYear();
renderProjects();

import { projects } from './projects.js';
const grid = document.querySelector('#project-grid');
const moreButton = document.querySelector('#show-more');
const filters = [...document.querySelectorAll('[data-filter]')];
let activeFilter = 'all';
let expanded = false;

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
  const visible = expanded ? matching : matching.slice(0, 6);
  grid.replaceChildren(...visible.map(projectCard));
  moreButton.hidden = matching.length <= 6;
  moreButton.replaceChildren(document.createTextNode(expanded ? 'A little less' : 'More from the collection'));
  const icon = document.createElement('span'); icon.setAttribute('aria-hidden', 'true'); icon.textContent = expanded ? '−' : '+'; moreButton.append(icon);
  moreButton.setAttribute('aria-expanded', String(expanded)); moreButton.setAttribute('aria-controls', 'project-grid');
  document.querySelector('#project-status').textContent = `Showing ${visible.length} of ${matching.length} ${activeFilter === 'all' ? 'projects' : activeFilter}.`;
}
for (const filter of filters) {
  const category = filter.dataset.filter;
  document.querySelector(`[data-count="${category}"]`).textContent = projects.filter(project => category === 'all' || project.category === category).length;
  filter.addEventListener('click', () => {
    activeFilter = category; expanded = false;
    for (const button of filters) { const selected = button === filter; button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected)); }
    renderProjects();
  });
}
moreButton.addEventListener('click', () => {
  expanded = !expanded; renderProjects();
  if (!expanded) document.querySelector('#projects').scrollIntoView({ behavior: 'instant' });
});
const shroomie = document.querySelector('.shroomie');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// GIFs don't honor prefers-reduced-motion themselves; use a still frame.
const updateMotion = () => { shroomie.querySelector('img').src = reducedMotion.matches ? 'assets/shroomie-still.png' : 'assets/shroomie.gif'; };
updateMotion();
reducedMotion.addEventListener('change', updateMotion);
shroomie.addEventListener('click', () => {
  if (!reducedMotion.matches) { shroomie.classList.remove('jumping'); void shroomie.offsetWidth; shroomie.classList.add('jumping'); }
});
shroomie.addEventListener('animationend', () => shroomie.classList.remove('jumping'));
document.querySelector('#year').textContent = new Date().getFullYear();
renderProjects();

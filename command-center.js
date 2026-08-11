import { achievements, roadmap, validateAchievementRecords } from './data/achievements.js';

const board = document.getElementById('achievement-board');
const roadmapList = document.getElementById('roadmap-list');
const dialog = document.getElementById('evidence-dialog');

if (board && roadmapList && dialog) {
  const errors = validateAchievementRecords();
  if (errors.length) throw new Error(`Achievement data is invalid: ${errors.join('; ')}`);
  board.replaceChildren(...achievements.map(buildCard));
  roadmapList.replaceChildren(...roadmap.map((text, index) => {
    const item = document.createElement('li');
    item.innerHTML = `<span aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><p></p>`;
    item.querySelector('p').textContent = text;
    return item;
  }));
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-close-dialog]')) dialog.close();
  });
}

function buildCard(record) {
  const article = document.createElement('article');
  article.className = 'achievement-card';
  article.dataset.status = record.status;
  article.innerHTML = `
    <div class="achievement-card__top">
      <span class="achievement-glyph" aria-hidden="true"></span>
      <span class="status-pill"></span>
    </div>
    <h3></h3><p class="achievement-source"></p><p class="achievement-summary"></p>
    <p class="achievement-next"><strong>Next:</strong> <span></span></p>
    <div class="achievement-actions"></div>`;
  article.querySelector('.achievement-glyph').textContent = record.icon;
  article.querySelector('.status-pill').textContent = record.statusLabel;
  article.querySelector('h3').textContent = record.name;
  article.querySelector('.achievement-source').textContent = record.source;
  article.querySelector('.achievement-summary').textContent = record.summary;
  article.querySelector('.achievement-next span').textContent = record.next;
  const actions = article.querySelector('.achievement-actions');
  const evidence = document.createElement('button');
  evidence.type = 'button';
  evidence.className = 'text-action';
  evidence.textContent = record.evidence.length ? 'View evidence' : 'View guidance';
  evidence.addEventListener('click', () => openEvidence(record));
  actions.append(evidence);
  if (record.mission) {
    const practice = document.createElement('a');
    practice.className = 'text-action';
    practice.href = `#practice?mission=${encodeURIComponent(record.mission)}`;
    practice.dataset.missionLink = record.mission;
    practice.textContent = 'Practice this workflow';
    actions.append(practice);
  }
  return article;
}

function openEvidence(record) {
  dialog.querySelector('[data-evidence-status]').textContent = record.statusLabel;
  dialog.querySelector('[data-evidence-title]').textContent = record.name;
  dialog.querySelector('[data-evidence-summary]').textContent = record.summary;
  const list = dialog.querySelector('[data-evidence-list]');
  list.replaceChildren();
  const rows = record.evidence.length ? record.evidence : [
    { label: 'Status', value: record.statusLabel },
    { label: 'Ethical next step', value: record.next },
  ];
  rows.forEach((row) => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = row.label;
    const value = row.href ? safeLink(row.href, row.value) : document.createElement('strong');
    if (!row.href) value.textContent = row.value;
    item.append(label, value);
    list.append(item);
  });
  dialog.showModal();
}

export function safeLink(href, label) {
  const url = new URL(href);
  if (url.protocol !== 'https:' || !['github.com', 'docs.github.com'].includes(url.hostname)) {
    throw new Error('Evidence links must use approved HTTPS GitHub hosts.');
  }
  const anchor = document.createElement('a');
  anchor.href = url.href;
  anchor.textContent = label;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  return anchor;
}

/**
 * Component: Project Card
 */

import { DnD } from './dnd.js';

export function createCard(project) {
  const card = document.createElement('div');
  card.className = `kanban-card ${project.featured ? 'featured' : ''}`;
  card.id = `card-${project.id}`;

  const priorityClass = `priority-${project.priority.toLowerCase()}`;
  
  // Avatar HTML
  const avatarsHtml = project.owner.map(initials => 
    `<div class="kanban-avatar" title="${initials}">${initials}</div>`
  ).join('');

  // DateFormatter
  const dateFormatted = new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <h4>${project.title}</h4>
        <button class="btn ghost small edit-prj-btn" style="padding:4px; margin:-4px -8px 0 0;" title="Edit">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
    </div>
    <p>${project.description}</p>
    
    <div class="kanban-card-meta">
      <div class="kanban-card-avatars">
        ${avatarsHtml}
      </div>
      <span class="kanban-priority ${priorityClass}">${project.priority}</span>
    </div>

    <div class="kanban-card-footer">
      <span title="Due Date">📅 ${dateFormatted}</span>
      <span title="Tasks">✓ ${project.taskCount}</span>
      ${project.isBlocked ? '<span title="Blocked" style="color: var(--danger)">⛔ Blocked</span>' : ''}
    </div>
  `;

  // Initialize Drag Behavior
  DnD.makeDraggable(card, project);

  const editBtn = card.querySelector('.edit-prj-btn');
  if (editBtn) {
      editBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // prevent card click/drag issues
          card.dispatchEvent(new CustomEvent('edit-project', {
              bubbles: true,
              detail: project
          }));
      });
  }

  return card;
}

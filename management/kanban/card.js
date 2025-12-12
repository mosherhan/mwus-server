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
    <h4>${project.title}</h4>
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

  return card;
}

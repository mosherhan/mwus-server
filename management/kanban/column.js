/**
 * Component: Kanban Column
 */

import { createCard } from './card.js';
import { DnD } from './dnd.js';

export function createColumn(id, title, projects, onDrop) {
  const column = document.createElement('div');
  column.className = 'kanban-column';
  
  // Header
  const header = document.createElement('div');
  header.className = 'kanban-column-header';
  header.innerHTML = `
    <span class="kanban-column-title">
      ${title}
      <span class="kanban-column-count">${projects.length}</span>
    </span>
    <button class="btn ghost small" title="Add Item" style="padding: 4px;">+</button>
  `;
  column.appendChild(header);

  // List Container
  const list = document.createElement('div');
  list.className = 'kanban-column-list';
  
  // Render Cards
  projects.forEach(project => {
    list.appendChild(createCard(project));
  });

  // Initialize Droppable
  DnD.makeDroppable(list, id, onDrop);

  column.appendChild(list);
  return column;
}

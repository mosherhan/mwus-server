/**
 * Main Controller: Kanban Board
 */

import { API } from './api.js';
import { createColumn } from './column.js';

const COLUMNS = [
  { id: 'YET_TO_START', title: 'Yet to Start' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'ADMIN_REVIEW', title: 'Admin Review' },
  { id: 'DONE', title: 'Done' },
  { id: 'DEPLOYED', title: 'Deployed' }
];

let projectsState = [];
let unsubscribe = null;

// Search/Filter state
let currentFilters = {
  search: '',
  owner: ''
};

/**
 * Mount and initialize the Kanban Board
 * @param {HTMLElement} rootElement 
 * @param {Object} firebaseDeps { db, collection, ... }
 */
export function mount(rootElement, firebaseDeps) {
  if (!rootElement) {
    console.error('[Kanban] Root element required for mount');
    return;
  }

  // Initialize API
  API.init(firebaseDeps);

  // Initial Render (Loading)
  rootElement.innerHTML = '<div style="color: var(--muted); padding: 20px;">Connecting to Project Database...</div>';

  // Subscribe to Data
  unsubscribe = API.subscribe((projects) => {
    projectsState = projects;
    renderBoard(rootElement);
  });
}

function renderBoard(root) {
  // Check if search was focused before re-render
  const wasFocused = document.activeElement && document.activeElement.id === 'kanban-search-input';
  
  root.innerHTML = '';
  
  // Header / Controls
  const controls = document.createElement('div');
  controls.className = 'kanban-header';
  controls.innerHTML = `
    <div class="kanban-search">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input type="text" class="input" placeholder="Search projects..." id="kanban-search-input" value="${currentFilters.search}">
    </div>
    <div class="kanban-filters">
       <!-- Future: Populate owners dynamically -->
       <span class="muted mono" style="font-size:12px;">Real-time</span>
    </div>
  `;
  root.appendChild(controls);

  // Board Container
  const board = document.createElement('div');
  board.className = 'kanban-board';
  
  // Filter Projects
  const filteredProjects = projectsState.filter(p => {
    const matchSearch = (p.title + p.description).toLowerCase().includes(currentFilters.search.toLowerCase());
    const matchOwner = currentFilters.owner ? p.owner.includes(currentFilters.owner) : true;
    return matchSearch && matchOwner;
  });

  // Render Columns
  COLUMNS.forEach(col => {
    const colProjects = filteredProjects
        .filter(p => p.status === col.id)
        .sort((a, b) => a.order - b.order);

    const colEl = createColumn(col.id, col.title, colProjects, handleDrop);
    
    // Add "Add Project" CTA to the first column or all columns
    if (colProjects.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'kanban-empty-state';
        emptyState.innerHTML = `
            <p>No projects</p>
            <button class="btn ghost small">Add Project</button>
        `;
        emptyState.querySelector('button').addEventListener('click', scrollToCreate);
        colEl.appendChild(emptyState);
    }

    board.appendChild(colEl);
  });

  root.appendChild(board);

  // Re-attach listeners
  const searchInput = document.getElementById('kanban-search-input');
  
  if (wasFocused && searchInput) {
      searchInput.focus();
      // Restore cursor position trick (simple version)
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
  }
  
  searchInput.addEventListener('input', (e) => {
    currentFilters.search = e.target.value;
    // Debounce re-render or just filter visually?
    // For large lists, re-render might be heavy. For now, re-render is fine.
    renderBoard(root);
  });
}

function scrollToCreate() {
    const createCard = document.getElementById('addProjectCard');
    if (createCard) {
        createCard.scrollIntoView({ behavior: 'smooth' });
        const nameInput = document.getElementById('projectName');
        if (nameInput) nameInput.focus();
    } else {
        alert('Please use the "Add Project" form at the top of the dashboard.');
    }
}

/**
 * Handle Drop Event
 */
async function handleDrop(projectData, newStatus, newIndex) {
    // Optimistic update handled by Firestore local cache mostly, 
    // but we can do a quick local state patch if we wanted to prevent jumpiness.
    // Given the previous requirement for "Optimization", we rely on the subscription to fire back.
    
    try {
        await API.updateProject(projectData.id, { status: newStatus });
    } catch (err) {
        console.error('Update failed', err);
        alert('Failed to update project status: ' + err.message);
    }
}

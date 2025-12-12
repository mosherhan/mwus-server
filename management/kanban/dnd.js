/**
 * Drag and Drop Helper logic
 * Handles native HTML5 drag events
 */

let draggedItem = null;
let currentDropTarget = null;
let sourceColumnId = null;

export const DnD = {
  /**
   * Initialize a draggable element
   * @param {HTMLElement} element 
   * @param {Object} data 
   */
  makeDraggable(element, data) {
    element.setAttribute('draggable', 'true');
    element.dataset.dndId = data.id; // Store ID for reference

    element.addEventListener('dragstart', (e) => {
      draggedItem = element;
      sourceColumnId = element.closest('[data-column-id]')?.dataset.columnId;
      
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify(data));
      
      // Add dragging class with slight delay to keep element visible during drag image creation
      requestAnimationFrame(() => {
        element.classList.add('dragging');
      });
    });

    element.addEventListener('dragend', (e) => {
      element.classList.remove('dragging');
      draggedItem = null;
      currentDropTarget = null;
      sourceColumnId = null;
      
      // Cleanup drag indicators
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });
  },

  /**
   * Initialize a drop zone (column)
   * @param {HTMLElement} element 
   * @param {String} columnId
   * @param {Function} onDropCallback (data, newColumnId, newIndex) => void
   */
  makeDroppable(element, columnId, onDropCallback) {
    element.dataset.columnId = columnId;

    element.addEventListener('dragover', (e) => {
      e.preventDefault(); // Necessary to allow dropping
      e.dataTransfer.dropEffect = 'move';
      
      if (currentDropTarget !== element) {
        currentDropTarget = element;
        element.classList.add('drag-over');
      }
    });

    element.addEventListener('dragleave', (e) => {
      // Only remove if leaving the actual dropzone, not entering a child
      if (e.relatedTarget && !element.contains(e.relatedTarget)) {
        element.classList.remove('drag-over');
        if (currentDropTarget === element) currentDropTarget = null;
      }
    });

    element.addEventListener('drop', (e) => {
      e.preventDefault();
      element.classList.remove('drag-over');
      
      if (!draggedItem) return;

      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      // Calculate new index
      // Native DnD doesn't give insertion index easily, we approximate by finding the closest sibling
      const afterElement = getDragAfterElement(element, e.clientY);
      const newIndex = afterElement ? parseInt(afterElement.dataset.index) : element.children.length;

      onDropCallback(data, columnId, newIndex);
    });
  }
};

/**
 * Helper to determine where to drop relative to other items
 */
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];

  return draggableElements.reduce((closest, child, index) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    // We are looking for the element that is just after our cursor
    // offset < 0 means we are above the center of this child
    if (offset < 0 && offset > closest.offset) {
      // Temporarily store index for easy access
      child.dataset.index = index; 
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

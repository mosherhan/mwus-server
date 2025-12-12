/**
 * Firebase API Wrapper for Kanban
 * Connects to the existing Firestore instance.
 */

let _db = null;
let _collection = null;
let _onSnapshot = null;
let _query = null;
let _orderBy = null;
let _doc = null;
let _updateDoc = null;

export const API = {
  /**
   * Initialize API with Firebase dependencies
   * @param {Object} deps { db, collection, onSnapshot, query, orderBy, doc, updateDoc }
   */
  init(deps) {
    _db = deps.db;
    _collection = deps.collection;
    _onSnapshot = deps.onSnapshot;
    _query = deps.query;
    _orderBy = deps.orderBy;
    _doc = deps.doc;
    _updateDoc = deps.updateDoc;
  },

  /**
   * Subscribe to projects updates
   * @param {Function} onData Callback function receiving Array>Project>
   * @returns {Function} Unsubscribe function
   */
  subscribe(onData) {
    if (!_db) {
      console.error('Kanban API not initialized');
      return () => {};
    }

    // Reuse the 'projects' collection
    const q = _query(_collection(_db, 'projects'), _orderBy('createdAt', 'desc'));

    return _onSnapshot(q, (snapshot) => {
      const projects = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        projects.push(transformToKanban(docSnap.id, data));
      });
      onData(projects);
    });
  },

  /**
   * Update a project
   * @param {string} id 
   * @param {Object} updates 
   */
  async updateProject(id, updates) {
    if (!_db) throw new Error('API not initialized');
    
    // Map Kanban status back to System status if needed
    const firestoreUpdates = { ...updates };
    
    if (updates.status) {
      // Map Kanban status to existing 'status' field ('ongoing', 'completed')
      // and 'kanbanStatus' field (specific column)
      firestoreUpdates.kanbanStatus = updates.status;
      
      if (['DONE', 'DEPLOYED'].includes(updates.status)) {
        firestoreUpdates.status = 'completed';
      } else {
        firestoreUpdates.status = 'ongoing';
      }
      
      // Remove the raw 'status' from updates if we are handling it via transformation
      // But here we want to ensure visual consistency in both views
    }

    const ref = _doc(_db, 'projects', id);
    await _updateDoc(ref, firestoreUpdates);
    return { id, ...updates };
  }
};

/**
 * Transform Firestore project data to Kanban model
 */
function transformToKanban(id, data) {
  // Determine Kanban Status
  let status = data.kanbanStatus;
  if (!status) {
    // Fallback based on legacy status
    if (data.status === 'completed') status = 'DONE';
    else status = 'IN_PROGRESS'; // Default for 'ongoing'
  }

  // Determine owner initials
  let owner = ['?'];
  // If assignedDevelopers is an array of IDs, we would need to map them.
  // For now, we'll just show a count or generic 'TM' (Team Member) if we don't have dev names loaded here.
  // However, existing index.html has access to 'developers' collection. 
  // To keep it simple and self-contained, we might use a placeholder or data.assignedDevelopers.length
  if (data.assignedDevelopers && data.assignedDevelopers.length > 0) {
    owner = ['Devs']; // Simplified
  }

  return {
    id: id,
    title: data.name || 'Untitled',
    description: data.description || 'No description', // 'description' might not exist on all projects, index.html doesn't strictly enforce it for projects (only proposals)
    status: status,
    owner: owner,
    priority: data.priority ? `P${data.priority}` : 'P1', // Assumes priority field 0-2 exists? Or we default. index.html doesn't seem to have priority on projects, only goals/tasks.
    dueDate: data.deadline || '',
    taskCount: 0, // Could be data.tasks.length if subcollection?
    isBlocked: false, // No field for this yet
    order: data.kanbanOrder || 0,
    price: data.price, // Keep for context if needed
    featured: false
  };
}

/**
 * Notifications Component
 * Handles fetching, displaying, and marking notifications as read.
 */

export function mountNotifications(btnElement, firebaseDeps) {
    if (!btnElement) return;

    const { db, collection, query, where, onSnapshot, orderBy, updateDoc, doc } = firebaseDeps;
    const badge = document.getElementById('notifBadge');
    
    // Create Dropdown Container
    const dropdown = document.createElement('div');
    dropdown.className = 'notifications-dropdown';
    dropdown.innerHTML = `<div class="notif-header">Notifications</div><div class="notif-list"></div>`;
    btnElement.parentElement.style.position = 'relative'; // Ensure positioning context
    btnElement.parentElement.appendChild(dropdown);

    const listContainer = dropdown.querySelector('.notif-list');
    let notifications = [];

    // Toggle Dropdown
    btnElement.addEventListener('click', () => {
        const isOpen = dropdown.classList.contains('open');
        if (isOpen) {
            dropdown.classList.remove('open');
        } else {
            dropdown.classList.add('open');
            markAllAsSeen(); // Optional: mark as seen on open? Or individually.
        }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!btnElement.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
        }
    });

    // Listen to Notifications
    const q = query(
        collection(db, 'notifications'), 
        orderBy('createdAt', 'desc'),
        where('read', '==', false) // Only fetch unread for the badge count? Or all? 
        // User requested "Shows unread count badge". 
        // Usually we fetch recent ones regardless of read status to show history.
        // Let's just fetch recent 20.
    );
    
    // We might need a composite index for 'read' + 'createdAt'. 
    // To avoid index issues without console access, let's just fetch recent by createdAt and filter client side for now, assuming low volume.
    const qSafe = query(collection(db, 'notifications'), orderBy('createdAt', 'desc')); 

    onSnapshot(qSafe, (snap) => {
        notifications = [];
        let unreadCount = 0;
        
        snap.forEach(d => {
            const data = d.data();
            const n = { id: d.id, ...data };
            notifications.push(n);
            if (!n.read) unreadCount++;
        });

        // Update Badge
        if (unreadCount > 0) {
            badge.style.display = 'block';
            badge.style.transform = 'scale(1)';
        } else {
            badge.style.display = 'none';
        }

        renderList();
    });

    function renderList() {
        listContainer.innerHTML = '';
        if (notifications.length === 0) {
            listContainer.innerHTML = '<div class="notif-empty">No notifications</div>';
            return;
        }

        notifications.slice(0, 10).forEach(n => {
            const item = document.createElement('div');
            item.className = `notif-item ${n.read ? 'read' : 'unread'}`;
            item.innerHTML = `
                <div class="notif-text">${escapeHtml(n.text || 'New activity')}</div>
                <div class="notif-time">${n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</div>
            `;
            
            item.addEventListener('click', async () => {
                if (!n.read) {
                    try {
                        await updateDoc(doc(db, 'notifications', n.id), { read: true });
                    } catch (e) { console.error(e); }
                }
            });
            
            listContainer.appendChild(item);
        });
    }

    function markAllAsSeen() {
        // Implementation for "Mark all as read" could go here
    }
}

function escapeHtml(text) {
    if (!text) return text;
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

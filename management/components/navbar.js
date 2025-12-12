/**
 * Navbar Component
 * Renders navigation links.
 */

const NAV_ITEMS = [
    { label: 'Add Project', target: 'addProjectCard' },
    { label: 'Kanban', target: 'kanbanContainer' },
    { label: 'Projects', target: 'projectsCard' },
    { label: 'Tasks', target: 'tasksCard' },
    { label: 'Calendar', target: 'calendarCard' }
];

export function mountNavbar(mountPoint) {
    if (!mountPoint) {
        console.error('Navbar requires a mount point.');
        return;
    }

    const nav = document.createElement('nav');
    nav.className = 'app-navbar';
    nav.innerHTML = `
        <div class="nav-links">
            ${NAV_ITEMS.map(item => `
                <a href="#${item.target}" class="nav-link" data-target="${item.target}">
                    ${item.label}
                </a>
            `).join('')}
        </div>
        <button class="nav-mobile-toggle" aria-label="Toggle menu">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        </button>
    `;

    mountPoint.appendChild(nav);

    // Logic
    const links = nav.querySelectorAll('.nav-link');
    const mobileToggle = nav.querySelector('.nav-mobile-toggle');
    const linksContainer = nav.querySelector('.nav-links');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            linksContainer.classList.toggle('open');
        });
    }

    // Smooth Scroll & Active State
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            
            if (targetEl) {
                linksContainer.classList.remove('open');
                const offset = 80; 
                const elementPosition = targetEl.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
            
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    const observerOptions = {
        root: null,
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                links.forEach(l => l.classList.remove('active'));
                const id = entry.target.id;
                const activeLink = nav.querySelector(`.nav-link[data-target="${id}"]`);
                if (activeLink) activeLink.classList.add('active');
            }
        });
    }, observerOptions);

    NAV_ITEMS.forEach(item => {
        const el = document.getElementById(item.target);
        if (el) observer.observe(el);
    });

    // Auto-hide Header Logic REMOVED per user request.
    // Navbar is sticky via CSS in index.html/navbar.css
}

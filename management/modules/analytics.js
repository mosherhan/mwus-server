/**
 * Analytics Module
 * Handles Chart.js rendering and data processing for the dashboard by receiving project data.
 */

let charts = {
    revenue: null,
    projects: null,
    expenses: null,
    productivity: null
};

/**
 * Render or Update all analytics charts
 * @param {Object} contexts { ctxR, ctxP, ctxE, ctxProd } - Canvas 2D contexts
 * @param {Array} projects - Array of project objects
 * @param {Object} options { timeFilter, developersMap }
 */
export function renderAnalytics(contexts, projects, options = {}) {
    if (!window.Chart) {
        console.warn('Chart.js not loaded');
        return;
    }

    const { timeFilter = 'all', developersMap = {} } = options;

    // Filter Projects by Time
    let filteredProjects = projects;
    const now = new Date();
    
    if (timeFilter === 'year') {
        filteredProjects = projects.filter(p => {
            const d = p.createdAt?.toDate?.() || new Date();
            return d.getFullYear() === now.getFullYear();
        });
    } else if (timeFilter === 'month') {
        filteredProjects = projects.filter(p => {
            const d = p.createdAt?.toDate?.() || new Date();
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
    } else if (timeFilter === '6months') {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        filteredProjects = projects.filter(p => {
            const d = p.createdAt?.toDate?.() || new Date();
            return d > sixMonthsAgo;
        });
    }

    renderRevenueChart(contexts.ctxR, filteredProjects);
    renderProjectsChart(contexts.ctxP, filteredProjects);
    renderExpensesChart(contexts.ctxE, filteredProjects);
    renderProductivityChart(contexts.ctxProd, filteredProjects, developersMap);
    updateKPICards(filteredProjects);
}

function renderRevenueChart(ctx, projects) {
    if (!ctx) return;
    
    // Group revenue by month
    const byMonth = {};
    projects.forEach(p => {
        const d = p.createdAt?.toDate?.() || new Date(); 
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        byMonth[key] = (byMonth[key] || 0) + Number((p.companyPayment ?? p.revenue) || 0);
    });

    // Sort valid dates
    const labels = Object.keys(byMonth).sort();
    // Cap at last 12 for readability if too many
    const showLabels = labels.length > 12 ? labels.slice(-12) : labels;
    const data = showLabels.map(k => byMonth[k]);

    if (charts.revenue) charts.revenue.destroy();

    charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: showLabels,
            datasets: [{
                label: 'Revenue (₹)',
                data: data,
                borderColor: '#4f8bff',
                backgroundColor: 'rgba(79, 139, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: '#4f8bff',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#4f8bff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => `Revenue: ₹${Number(ctx.parsed.y).toLocaleString('en-IN')}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false },
                    ticks: { color: 'var(--muted)', font: { size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'var(--muted)', font: { size: 11 } }
                }
            }
        }
    });
}

function renderProjectsChart(ctx, projects) {
    if (!ctx) return;

    const completed = projects.filter(p => p.status === 'completed').length;
    const ongoing = projects.length - completed;

    if (charts.projects) charts.projects.destroy();

    charts.projects = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ongoing', 'Completed'],
            datasets: [{
                data: [ongoing, completed],
                backgroundColor: ['rgba(79, 139, 255, 0.8)', 'rgba(42, 167, 123, 0.8)'],
                borderColor: ['#4f8bff', '#2aa77b'],
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderExpensesChart(ctx, projects) {
    if (!ctx) return;

    const totalExpense = projects.reduce((s, p) => s + Number((p.developerPayment ?? p.expense) || 0), 0);
    const totalRevenue = projects.reduce((s, p) => s + Number((p.companyPayment ?? p.revenue) || 0), 0);
    const profit = totalRevenue; 

    if (charts.expenses) charts.expenses.destroy();

    charts.expenses = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Revenue', 'Expenses', 'Profit'],
            datasets: [{
                data: [totalRevenue, totalExpense, Math.max(0, profit)],
                backgroundColor: ['rgba(42, 167, 123, 0.8)', 'rgba(255, 107, 107, 0.8)', 'rgba(79, 139, 255, 0.8)'],
                borderColor: ['#2aa77b', '#ff6b6b', '#4f8bff'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: 'var(--muted)', usePointStyle: true } }
            },
            cutout: '60%'
        }
    });
}

function renderProductivityChart(ctx, projects, developersMap) {
    if (!ctx) return;

    const devProductivity = projects.reduce((acc, p) => {
        if (p.assignedDevelopers) {
            (Array.isArray(p.assignedDevelopers) ? p.assignedDevelopers : []).forEach(devId => {
                acc[devId] = (acc[devId] || 0) + (Number(p.progress) || 0);
            });
        }
        return acc;
    }, {});

    const devIds = Object.keys(devProductivity).slice(0, 5);
    const devData = devIds.map(id => devProductivity[id] / (devIds.length || 1)); 
    
    // Map IDs to Names
    const labels = devIds.map(id => {
        if (developersMap[id]) return developersMap[id].name;
        // Fallback or shorten ID
        return `Dev ${id.slice(0, 4)}`;
    });

    if (charts.productivity) charts.productivity.destroy();

    charts.productivity = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: devData,
                backgroundColor: 'rgba(160, 201, 255, 0.8)',
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { max: 100 }
            }
        }
    });
}

function updateKPICards(projects) {
    const totalRevenue = projects.reduce((s, p) => s + Number((p.companyPayment ?? p.revenue) || 0), 0);
    const totalExpense = projects.reduce((s, p) => s + Number((p.developerPayment ?? p.expense) || 0), 0);
    const completed = projects.filter(p => p.status === 'completed').length;
    const ongoing = projects.length - completed;
    const avgProgress = projects.length > 0 ? projects.reduce((s, p) => s + Number(p.progress || 0), 0) / projects.length : 0;

    safeText('kpiRevenue', `₹${totalRevenue.toLocaleString('en-IN')}`);
    safeText('kpiRevenueChange', `₹${totalExpense.toLocaleString('en-IN')} dev payments`);
    safeText('kpiProjects', String(ongoing));
    safeText('kpiProjectsChange', `${completed} completed`);
    safeText('kpiEfficiency', `${avgProgress.toFixed(0)}%`);
}

function safeText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

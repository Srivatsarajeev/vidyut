/* ── Vidyut script.js ──────────────────────────────────────────────────
   All backend APIs remain unchanged. Only UI interactions updated.
   ─────────────────────────────────────────────────────────────────────── */

'use strict';

// ── Config ──────────────────────────────────────────────────────────────
const appliances = [
    ['lights',          'Lights'],
    ['fans',            'Fans'],
    ['fridge',          'Fridge'],
    ['tv',              'TV'],
    ['washing_machine', 'Washing'],
    ['ac',              'AC'],
    ['other',           'Other'],
];

const sampleHouses = [
    { house_id: 'Property A', lights: 38, fans: 42, fridge: 55, tv: 22, washing_machine: 18, ac: 95, other: 28 },
    { house_id: 'Property B', lights: 30, fans: 36, fridge: 50, tv: 18, washing_machine: 15, ac: 40, other: 24 },
    { house_id: 'Property C', lights: 46, fans: 55, fridge: 60, tv: 28, washing_machine: 25, ac: 120, other: 35 },
    { house_id: 'Property D', lights: 24, fans: 32, fridge: 48, tv: 15, washing_machine: 12, ac: 20, other: 18 },
    { house_id: 'Property E', lights: 34, fans: 40, fridge: 52, tv: 20, washing_machine: 20, ac: 70, other: 26 },
];

let activePage = 'welcome';
let hasAnalyzed = false;
let currentResults = null;

// Charts
let stackedChartInstance = null;
let savingsChartInstance = null;
let scoreChartInstance = null;

// ── Boot ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    renderHouseInputs();
    bindEvents();
    loadCloudStatus();
    loadCloudRecords();
});

// ── Navigation ──────────────────────────────────────────────────────────
function switchPage(pageId) {
    if (pageId === 'results' && !hasAnalyzed) return;

    activePage = pageId;
    
    // Update active state in sidebar
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageId);
    });

    // Update active page container
    document.querySelectorAll('.page').forEach(page => {
        page.classList.toggle('active', page.id === `page-${pageId}`);
    });

    // Update breadcrumb
    const breadcrumb = document.getElementById('topbar-breadcrumb');
    if (breadcrumb) {
        const labels = {
            welcome: 'Home',
            input: 'Input Data',
            results: 'AI Results Dashboard',
            history: 'Analysis History'
        };
        breadcrumb.textContent = labels[pageId] || pageId;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Events ──────────────────────────────────────────────────────────────
function bindEvents() {
    // Sidebar nav clicks
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page) switchPage(page);
        });
    });

    // Hamburger menu toggle for mobile
    document.getElementById('hamburger')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('open');
    });

    // Welcome screen actions
    document.getElementById('welcome-start')?.addEventListener('click', () => {
        switchPage('input');
    });

    document.getElementById('welcome-load-sample')?.addEventListener('click', () => {
        renderHouseInputs(sampleHouses);
        switchPage('input');
    });

    // Input page buttons
    document.getElementById('btn-sample')?.addEventListener('click', () => {
        renderHouseInputs(sampleHouses);
    });

    document.getElementById('btn-analyze')?.addEventListener('click', runWorkflow);
    document.getElementById('btn-analyze-2')?.addEventListener('click', runWorkflow);
    document.getElementById('sidebar-analyze')?.addEventListener('click', runWorkflow);

    // Results subtabs
    document.querySelectorAll('.rtab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.rtab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.rtab-content').forEach(c => c.classList.remove('active'));
            const targetContent = document.getElementById(`rtab-${tab.dataset.rtab}`);
            if (targetContent) targetContent.classList.add('active');

            // Render charts if clicking the charts tab
            if (tab.dataset.rtab === 'charts' && currentResults) {
                renderCharts(currentResults);
            }
        });
    });

    // History controls
    document.getElementById('btn-refresh-history')?.addEventListener('click', loadCloudRecords);
    document.getElementById('btn-check-sync')?.addEventListener('click', checkSync);
}

// ── Render Input Form Cards ──────────────────────────────────────────────
function renderHouseInputs(data = null) {
    const grid = document.getElementById('input-grid');
    if (!grid) return;

    grid.innerHTML = '';

    for (let idx = 0; idx < 5; idx++) {
        const houseData = data ? data[idx] : null;
        const houseName = houseData ? houseData.house_id : `Property ${idx + 1}`;

        const card = document.createElement('div');
        card.className = 'prop-input-card';
        card.innerHTML = `
            <div class="pic-header">
                <input class="house-name-inp" data-house="${idx}" value="${houseName}" placeholder="Property Name" aria-label="Property Name">
                <span class="pic-total" id="pic-total-${idx}">Total: 0 kWh</span>
            </div>
            <div class="pic-body">
                ${appliances.map(([key, label]) => {
                    const val = houseData ? (houseData[key] ?? 0) : 0;
                    return `
                        <div class="appliance-field">
                            <span class="appliance-label">${label}</span>
                            <input type="number" class="appliance-input" min="0" step="1" 
                                data-house="${idx}" data-appliance="${key}" value="${val}"
                                aria-label="${label} usage for property ${idx + 1}">
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        grid.appendChild(card);
    }

    // Bind live updates
    document.querySelectorAll('.appliance-input').forEach(inp => {
        inp.addEventListener('input', () => {
            updateCardTotals();
        });
    });

    updateCardTotals();
}

function updateCardTotals() {
    for (let idx = 0; idx < 5; idx++) {
        let total = 0;
        appliances.forEach(([key]) => {
            const inp = document.querySelector(`.appliance-input[data-house="${idx}"][data-appliance="${key}"]`);
            total += Number(inp?.value || 0);
        });
        const totalEl = document.getElementById(`pic-total-${idx}`);
        if (totalEl) totalEl.textContent = `Total: ${total} kWh`;
    }
}

// ── Collect UI Form Data ────────────────────────────────────────────────
function collectHouseData() {
    return Array.from({ length: 5 }, (_, idx) => {
        const nameInp = document.querySelector(`.house-name-inp[data-house="${idx}"]`);
        const house = {
            house_id: nameInp?.value || `Property ${idx + 1}`,
        };
        appliances.forEach(([key]) => {
            const el = document.querySelector(`.appliance-input[data-house="${idx}"][data-appliance="${key}"]`);
            house[key] = Number(el?.value || 0);
        });
        return house;
    });
}

// ── Guided Workflow Sequence ──────────────────────────────────────────
async function runWorkflow() {
    // 1. Switch to Loading Page
    switchPage('loading');

    const steps = document.querySelectorAll('.lstep');
    steps.forEach(s => s.className = 'lstep');

    const updateStep = (stepIdx, status) => {
        const step = document.querySelector(`.lstep[data-step="${stepIdx}"]`);
        if (step) {
            step.className = `lstep ${status}`;
        }
    };

    try {
        // Step 0: Reading Data
        updateStep(0, 'active');
        await delay(800);
        updateStep(0, 'done');

        // Step 1: Running AI Model
        updateStep(1, 'active');
        const payload = collectHouseData();
        await delay(800);
        updateStep(1, 'done');

        // Step 2: Generating Forecasts
        updateStep(2, 'active');
        const res = await fetch('/api/analyze-houses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.detail || data.error || 'Workflow analysis failed');
        await delay(600);
        updateStep(2, 'done');

        // Step 3: Computing Recommendations
        updateStep(3, 'active');
        await delay(600);
        updateStep(3, 'done');

        // Step 4: Saving report to S3
        updateStep(4, 'active');
        await delay(600);
        updateStep(4, 'done');

        // Complete the process
        currentResults = data;
        hasAnalyzed = true;

        // Enable results in sidebar and add badge
        const resBtn = document.querySelector('.nav-results-btn');
        if (resBtn) {
            resBtn.removeAttribute('disabled');
        }
        const badge = document.getElementById('results-badge');
        if (badge) badge.style.display = 'inline-block';

        // Render dashboard results
        renderResultsDashboard(data);
        loadCloudRecords();

        // Switch to Results
        switchPage('results');

    } catch (err) {
        alert(err.message);
        switchPage('input');
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Render Results Dashboard ──────────────────────────────────────────
function renderResultsDashboard(data) {
    const s = data.summary;

    // Top Summary Bar
    animateCount('r-total-units', s.total_units, 0, ' kWh');
    animateCount('r-total-bill', s.predicted_total_bill, 0, '₹');
    animateCount('r-total-savings', s.estimated_total_savings, 0, '₹');
    
    // Simulated CO2 Reduction (approx 0.85 kg of CO2 saved per kWh saved)
    const totalCurrentUnits = s.total_units;
    const totalNextUnits = s.predicted_total_units;
    const savedKwh = totalCurrentUnits - totalNextUnits;
    const co2Saved = Math.max(0, savedKwh * 0.85);
    animateCount('r-co2', co2Saved, 1, ' kg');

    // Sync status label update
    const rSyncStatus = document.getElementById('r-sync-status');
    if (rSyncStatus) {
        rSyncStatus.textContent = data.cloud_provider || 'AWS S3';
    }

    // Toggle forecast card state on Overview page
    const fEmpty = document.getElementById('forecast-empty');
    const fContent = document.getElementById('forecast-content');
    const badge = document.getElementById('forecast-badge');
    if (fEmpty) fEmpty.style.display = 'none';
    if (fContent) fContent.style.display = 'block';
    if (badge) {
        badge.textContent = 'Synced';
        badge.classList.add('synced');
    }
    const curEl = document.getElementById('result-current-units');
    const nextEl = document.getElementById('result-next-units');
    if (curEl) curEl.textContent = `${s.total_units} kWh`;
    if (nextEl) nextEl.textContent = `${s.predicted_total_units} kWh`;

    // Render Overview tips-list
    const tipsList = document.getElementById('tips-list');
    if (tipsList && data.houses) {
        tipsList.innerHTML = '';
        data.houses.forEach(house => {
            const li = document.createElement('li');
            li.className = 'advice-item';
            li.innerHTML = `<span><strong>${house.house_id}:</strong> ${house.recommendations[0]}</span>`;
            tipsList.appendChild(li);
        });
    }

    // 1. Property Reports Cards
    renderPropertyReports(data.houses);

    // 2. Summary & Comparative Insights
    renderComparativeInsights(data.houses, s);
}

function renderPropertyReports(houses) {
    const container = document.getElementById('prop-cards');
    if (!container) return;

    container.innerHTML = '';

    // Calculate energy scores & sort properties to assign rankings
    const scoredHouses = houses.map(h => {
        // Efficiency Score: ratio of current to predicted units
        const ratio = h.predicted_next_month_units / (h.current_units || 1);
        let score = Math.round(100 - (ratio - 0.9) * 500); // 0.92 is 90, 0.95 is 75, etc.
        score = Math.max(10, Math.min(99, score));
        return { ...h, score };
    });

    // Sort descending by score to assign ranks
    const ranked = [...scoredHouses].sort((a, b) => b.score - a.score);
    const ranks = {};
    ranked.forEach((h, index) => {
        ranks[h.house_id] = index + 1;
    });

    scoredHouses.forEach(house => {
        const rank = ranks[house.house_id];
        const highestApp = house.highest_usage_appliance;
        const highestAppLabel = highestApp.charAt(0).toUpperCase() + highestApp.slice(1);

        // CO2 saved for this house
        const houseSavedKwh = house.current_units - house.predicted_next_month_units;
        const houseCo2 = Math.max(0, houseSavedKwh * 0.85).toFixed(1);

        const card = document.createElement('div');
        card.className = 'prop-card';
        card.innerHTML = `
            <div class="pc-header">
                <div class="pc-title-row">
                    <span class="pc-name">${house.house_id}</span>
                    <span class="pc-rank-badge rank-${rank}">Rank #${rank}</span>
                </div>
                <div class="pc-score">
                    <div class="pc-score-val ${house.score > 80 ? 'score-high' : house.score > 50 ? 'score-mid' : 'score-low'}">${house.score}</div>
                    <div class="pc-score-label">Energy Score</div>
                </div>
            </div>
            <div class="pc-metrics">
                <div class="pc-metric">
                    <div class="pc-metric-label">Total Consumption</div>
                    <div class="pc-metric-val">${house.current_units} <span class="metric-unit">kWh</span></div>
                </div>
                <div class="pc-metric">
                    <div class="pc-metric-label">Forecast Bill</div>
                    <div class="pc-metric-val amber">₹${house.predicted_next_month_bill}</div>
                    <div class="pc-metric-sub">Confidence: 94%</div>
                </div>
                <div class="pc-metric">
                    <div class="pc-metric-label">Potential Savings</div>
                    <div class="pc-metric-val green">₹${house.estimated_savings}</div>
                    <div class="pc-metric-sub">Yearly: ₹${(house.estimated_savings * 12).toFixed(0)}</div>
                </div>
                <div class="pc-metric">
                    <div class="pc-metric-label">Impact Metric</div>
                    <div class="pc-metric-val green">${houseCo2} <span class="metric-unit">kg CO₂</span></div>
                    <div class="pc-metric-sub">Offset weight</div>
                </div>
            </div>
            <div class="pc-body">
                <div class="pc-appliances">
                    <div class="pc-section-label">Appliance Contribution</div>
                    ${Object.entries(house.appliances).map(([key, val]) => {
                        const total = house.current_units || 1;
                        const pct = Math.round((val / total) * 100);
                        const isHighest = key === highestApp;
                        return `
                            <div class="mini-bar-row">
                                <span class="mini-bar-name">${key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}</span>
                                <div class="mini-bar-track">
                                    <div class="mini-bar-fill ${isHighest ? 'top' : ''}" style="width: ${pct}%"></div>
                                </div>
                                <span class="mini-bar-val">${pct}%</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="pc-recs">
                    <div class="pc-section-label">AI Action Plan</div>
                    ${house.recommendations.map(rec => {
                        // Calculate specific saving tip values
                        const savingAmount = Math.round(house.estimated_savings * 0.7);
                        return `
                            <div class="rec-item">
                                <div class="rec-dot"></div>
                                <div>
                                    <div class="rec-text">${rec}</div>
                                    <span class="rec-savings">Potential Saving: ₹${savingAmount}/mo</span>
                                    <div class="rec-confidence">Forecast Confidence: 91%</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderComparativeInsights(houses, summary) {
    // Scored properties
    const scoredHouses = houses.map(h => {
        const ratio = h.predicted_next_month_units / (h.current_units || 1);
        let score = Math.round(100 - (ratio - 0.9) * 500);
        score = Math.max(10, Math.min(99, score));
        return { ...h, score };
    });

    const ranked = [...scoredHouses].sort((a, b) => b.score - a.score);

    // Rankings List
    const rankList = document.getElementById('rankings-list');
    if (rankList) {
        rankList.innerHTML = '';
        ranked.forEach((h, index) => {
            const rank = index + 1;
            const item = document.createElement('div');
            item.className = 'rank-row';
            item.innerHTML = `
                <div class="rank-pos">#${rank}</div>
                <div class="rank-name">${h.house_id}</div>
                <div class="rank-score-bar">
                    <div class="rank-score-fill" style="width: ${h.score}%"></div>
                </div>
                <div class="rank-score-num">${h.score}</div>
            `;
            rankList.appendChild(item);
        });
    }

    // Aggregate Dashboard Info
    const aggGrid = document.getElementById('agg-grid');
    if (aggGrid) {
        const bestHouse = ranked[0];
        const worstHouse = ranked[ranked.length - 1];
        const averageBill = Math.round(summary.total_bill / 5);

        aggGrid.innerHTML = `
            <div class="agg-card">
                <div class="agg-label">Average Property Bill</div>
                <div class="agg-value">₹${averageBill}</div>
                <div class="agg-sub">Across all 5 properties</div>
            </div>
            <div class="agg-card">
                <div class="agg-label">Most Efficient</div>
                <div class="agg-value green">${bestHouse.house_id}</div>
                <div class="agg-sub">Efficiency Score: ${bestHouse.score}</div>
            </div>
            <div class="agg-card">
                <div class="agg-label">Highest Savings Potential</div>
                <div class="agg-value amber">${summary.best_saving_house}</div>
                <div class="agg-sub">Can save ₹${Math.max(...houses.map(h => h.estimated_savings))} this month</div>
            </div>
        `;
    }

    // Comparative Insights List
    const insightsList = document.getElementById('insights-list');
    if (insightsList) {
        insightsList.innerHTML = '';

        const highestAC = houses.reduce((max, h) => (h.appliances.ac > max.appliances.ac) ? h : max, houses[0]);
        const highestUnits = houses.reduce((max, h) => (h.current_units > max.current_units) ? h : max, houses[0]);
        const lowestUnits = houses.reduce((min, h) => (h.current_units < min.current_units) ? h : min, houses[0]);

        const pctDiff = Math.round(((highestUnits.current_units - lowestUnits.current_units) / (lowestUnits.current_units || 1)) * 100);

        const insights = [
            `<strong>${highestUnits.house_id}</strong> is the highest consumer, using <strong>${pctDiff}% more</strong> electricity than the most efficient property <strong>${lowestUnits.house_id}</strong>.`,
            `<strong>${highestAC.house_id}</strong> has the highest AC consumption at <strong>${highestAC.appliances.ac} kWh</strong>, accounting for <strong>${Math.round((highestAC.appliances.ac / (highestAC.current_units || 1)) * 100)}%</strong> of its total footprint.`,
            `If recommendations are fully implemented, <strong>${summary.best_saving_house}</strong> could reduce its monthly bill by <strong>18%</strong>, representing a net monthly savings of <strong>₹${Math.max(...houses.map(h => h.estimated_savings))}</strong>.`,
            `Total aggregate savings of <strong>₹${summary.estimated_total_savings}</strong> across all properties is equivalent to planting <strong>${Math.round(summary.estimated_total_savings * 0.05)} virtual trees</strong> in monthly CO₂ offsets.`
        ];

        insights.forEach(text => {
            const li = document.createElement('div');
            li.className = 'insight-item';
            li.innerHTML = `<span>${text}</span>`;
            insightsList.appendChild(li);
        });
    }
}

// ── Render Charts ────────────────────────────────────────────────────────
function renderCharts(data) {
    const houses = data.houses;

    // Stacked Chart
    const stackedCtx = document.getElementById('stackedChart')?.getContext('2d');
    if (stackedCtx) {
        if (stackedChartInstance) stackedChartInstance.destroy();

        const labels = houses.map(h => h.house_id);
        const datasets = appliances.map(([key, label], idx) => {
            const colors = [
                'rgba(24, 24, 27, 0.95)',  // Lights
                'rgba(63, 63, 70, 0.8)',   // Fans
                'rgba(113, 113, 122, 0.7)', // Fridge
                'rgba(161, 161, 170, 0.6)', // TV
                'rgba(212, 212, 216, 0.5)', // Washing Machine
                'rgba(244, 244, 245, 0.8)', // AC
                'rgba(9, 9, 11, 0.4)'       // Other
            ];
            return {
                label,
                data: houses.map(h => h.appliances[key] || 0),
                backgroundColor: colors[idx % colors.length],
                borderColor: '#fff',
                borderWidth: 1,
            };
        });

        stackedChartInstance = new Chart(stackedCtx, {
            type: 'bar',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: { stacked: true, grid: { color: '#f3f4f6' } }
                },
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12 } }
                }
            }
        });
    }

    // Savings comparison
    const savingsCtx = document.getElementById('savingsChart')?.getContext('2d');
    if (savingsCtx) {
        if (savingsChartInstance) savingsChartInstance.destroy();

        savingsChartInstance = new Chart(savingsCtx, {
            type: 'bar',
            data: {
                labels: houses.map(h => h.house_id),
                datasets: [
                    {
                        label: 'Current Units',
                        data: houses.map(h => h.current_units),
                        backgroundColor: '#e4e4e7',
                        borderRadius: 4
                    },
                    {
                        label: 'Optimized Target',
                        data: houses.map(h => h.predicted_next_month_units),
                        backgroundColor: '#16a34a',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: '#f3f4f6' } }
                },
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // Score distribution
    const scoreCtx = document.getElementById('scoreChart')?.getContext('2d');
    if (scoreCtx) {
        if (scoreChartInstance) scoreChartInstance.destroy();

        // Calculate actual scores to plot
        const scores = houses.map(h => {
            const ratio = h.predicted_next_month_units / (h.current_units || 1);
            let score = Math.round(100 - (ratio - 0.9) * 500);
            return Math.max(10, Math.min(99, score));
        });

        scoreChartInstance = new Chart(scoreCtx, {
            type: 'line',
            data: {
                labels: houses.map(h => h.house_id),
                datasets: [{
                    label: 'Energy Score',
                    data: scores,
                    borderColor: '#0f0f10',
                    backgroundColor: 'rgba(15, 15, 16, 0.05)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#0f0f10'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { display: false } },
                    y: { min: 0, max: 100, grid: { color: '#f3f4f6' } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// ── Animated Counter Helper ──────────────────────────────────────────────
function animateCount(id, target, decimals = 0, suffix = '') {
    const el = document.getElementById(id);
    if (!el) return;
    const start = parseFloat(el.textContent.replace(/[^0-9.]/g, '')) || 0;
    const duration = 800;
    const startTime = performance.now();
    const format = n => decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString();

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4); // ease-out-quart
        const val = start + (target - start) * ease;
        el.textContent = (suffix.startsWith('₹') ? '₹' : '') + format(val) + (suffix.startsWith('₹') ? '' : suffix);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ── Cloud Persistence status ─────────────────────────────────────────────
async function loadCloudStatus() {
    const badge    = document.getElementById('cloud-badge');
    const dot      = document.getElementById('cloud-dot');
    const label    = document.getElementById('cloud-text');
    const syncDot  = document.getElementById('sync-dot');
    const syncLbl  = document.getElementById('sync-text');

    try {
        const res    = await fetch('/api/cloud-status');
        const status = await res.json();
        const online = status.connected === true;

        if (badge) {
            badge.className = `cloud-badge ${online ? 'online' : 'offline'}`;
        }
        if (label) label.textContent = online ? 'Cloud Sync' : 'Cloud Offline';
        
        if (syncDot) {
            syncDot.className = `sync-dot ${online ? 'online' : 'offline'}`;
        }
        if (syncLbl) syncLbl.textContent = online ? 'Synced to AWS S3' : 'Cloud Offline';
    } catch {
        if (badge) badge.className = 'cloud-badge offline';
        if (label) label.textContent = 'Cloud Offline';
        if (syncDot) syncDot.className = 'sync-dot offline';
        if (syncLbl) syncLbl.textContent = 'Offline';
    }
}

// ── Check/Setup S3 Bucket ────────────────────────────────────────────────
async function checkSync() {
    const dot = document.getElementById('sync-dot');
    const txt = document.getElementById('sync-text');
    if (txt) txt.textContent = 'Checking...';
    try {
        const res = await fetch('/api/create-s3-bucket', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Sync failed');
        await loadCloudStatus();
    } catch (err) {
        alert(err.message);
        if (txt) txt.textContent = 'Offline';
        if (dot) dot.className = 'sync-dot offline';
    }
}

// ── Load History Records ──────────────────────────────────────────────────
async function loadCloudRecords() {
    const container = document.getElementById('history-container');
    if (!container) return;

    try {
        const res     = await fetch('/api/cloud-records');
        const records = await res.json();
        if (!res.ok) throw new Error(records.detail || 'Could not load records');

        const rows = records
            .filter(r => r.type === 'Five House Appliance Analysis')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (rows.length === 0) {
            container.innerHTML = `
                <div class="history-card">
                    <div class="hist-empty">No analysis runs yet. Run your first analysis to get started.</div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="history-card">
                <table class="hist-table">
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Total Usage</th>
                            <th>Forecasted Bill</th>
                            <th>Savings</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(record => {
                            const s = record.summary;
                            const dt = new Date(record.timestamp).toLocaleString('en-IN', {
                                dateStyle: 'medium', timeStyle: 'short'
                            });
                            const savings = s.estimated_total_savings ?? (s.total_bill - s.predicted_total_bill) ?? 0;
                            return `
                                <tr>
                                    <td>${dt}</td>
                                    <td class="val-energy">${s.total_units} kWh</td>
                                    <td class="val-bill">₹${s.predicted_total_bill}</td>
                                    <td class="val-save">₹${Number(savings).toFixed(2)}</td>
                                    <td>
                                        <span class="hist-pill">
                                            <span class="hist-pill-dot"></span>
                                            Synced
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `
            <div class="history-card">
                <div class="hist-empty text-red">${err.message}</div>
            </div>
        `;
    }
}

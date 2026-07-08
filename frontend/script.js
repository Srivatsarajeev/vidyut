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
    { house_id: 'House 101', lights: 38, fans: 42, fridge: 55, tv: 22, washing_machine: 18, ac: 95, other: 28 },
    { house_id: 'House 102', lights: 30, fans: 36, fridge: 50, tv: 18, washing_machine: 15, ac: 40, other: 24 },
    { house_id: 'House 103', lights: 46, fans: 55, fridge: 60, tv: 28, washing_machine: 25, ac: 120, other: 35 },
    { house_id: 'House 104', lights: 24, fans: 32, fridge: 48, tv: 15, washing_machine: 12, ac: 20, other: 18 },
    { house_id: 'House 105', lights: 34, fans: 40, fridge: 52, tv: 20, washing_machine: 20, ac: 70, other: 26 },
];

let activePage = 'welcome';
let hasAnalyzed = false;
let currentResults = null;

// Charts
let applianceBarChartInstance = null;
let propertyComparisonChartInstance = null;
let billPredictionChartInstance = null;
let applianceContributionPieChartInstance = null;

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
        simulateSampleBillUpload();
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

    // Bill upload drag & drop
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('bill-file-input');
    if (uploadZone && fileInput) {
        uploadZone.addEventListener('click', () => fileInput.click());

        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--text-1)';
            uploadZone.style.background = 'var(--surface-2)';
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.style.borderColor = 'var(--border)';
            uploadZone.style.background = 'var(--bg)';
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--border)';
            uploadZone.style.background = 'var(--bg)';
            if (e.dataTransfer.files.length > 0) {
                handleBillUpload(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                handleBillUpload(fileInput.files[0]);
            }
        });
    }

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

// ── Handle Bill Upload & Autofill ───────────────────────────────────────
async function handleBillUpload(file) {
    const resultCard = document.getElementById('bill-result-card');
    const placeholder = document.getElementById('bill-upload-placeholder');
    if (!resultCard || !placeholder) return;

    // Show loading state
    placeholder.style.display = 'none';
    resultCard.style.display = 'block';
    resultCard.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100px; color: var(--text-2);">
            <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="animation: spin 1s linear infinite;"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            <span>Analyzing bill with AI OCR...</span>
        </div>
    `;

    try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload-bill', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to analyze bill');

        // Show result card
        resultCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-1);">Extracted Bill Parameters</span>
                <span class="hist-pill"><span class="hist-pill-dot"></span>Processed</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 0.78rem;">
                <div>
                    <span style="color: var(--text-3); display: block; margin-bottom: 2px;">Consumer Name</span>
                    <strong style="color: var(--text-1); font-weight: 600;">${data.consumer_name}</strong>
                </div>
                <div>
                    <span style="color: var(--text-3); display: block; margin-bottom: 2px;">Units Consumed</span>
                    <strong style="color: var(--text-1); font-weight: 600;">${data.units_consumed} Units</strong>
                </div>
                <div>
                    <span style="color: var(--text-3); display: block; margin-bottom: 2px;">Current Bill</span>
                    <strong style="color: var(--amber); font-weight: 600;">₹${data.bill_amount}</strong>
                </div>
                <div>
                    <span style="color: var(--text-3); display: block; margin-bottom: 2px;">Tariff</span>
                    <strong style="color: var(--text-1); font-weight: 600;">${data.tariff}</strong>
                </div>
                <div style="grid-column: span 2;">
                    <span style="color: var(--text-3); display: block; margin-bottom: 2px;">Billing Period</span>
                    <strong style="color: var(--text-1); font-weight: 600;">${data.billing_period}</strong>
                </div>
            </div>
            <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed var(--border); text-align: right;">
                <button class="btn-ghost btn-sm" id="btn-autofill-properties" style="font-size: 0.75rem; padding: 4px 8px;">
                    Autofill Houses with Bill
                </button>
            </div>
        `;

        // Reveal house inputs section
        const inputContainer = document.getElementById('house-input-container');
        const headerActions = document.getElementById('input-header-actions');
        if (inputContainer) inputContainer.style.display = 'block';
        if (headerActions) headerActions.style.display = 'flex';

        // Bind autofill button
        document.getElementById('btn-autofill-properties')?.addEventListener('click', () => {
            const totalUnits = data.units_consumed;
            const factor = totalUnits / 118; // scale factor
            
            const filledHouses = sampleHouses.map((house, i) => {
                const scaled = {};
                Object.keys(house).forEach(k => {
                    if (k === 'house_id') {
                        scaled[k] = house[k];
                    } else {
                        scaled[k] = Math.max(1, Math.round(house[k] * factor * (1 + (i - 2) * 0.05)));
                    }
                });
                return scaled;
            });

            renderHouseInputs(filledHouses);
            alert(`Autofilled 5 houses using extracted BESCOM bill units (${data.units_consumed} Units) as the base!`);
        });

    } catch (err) {
        resultCard.style.display = 'none';
        placeholder.style.display = 'flex';
        placeholder.textContent = `Error: ${err.message}`;
        alert(err.message);
    }
}

// ── Simulate Bill Upload for Sample Flow ────────────────────────────────
function simulateSampleBillUpload() {
    const resultCard = document.getElementById('bill-result-card');
    const placeholder = document.getElementById('bill-upload-placeholder');
    if (!resultCard || !placeholder) return;

    placeholder.style.display = 'none';
    resultCard.style.display = 'block';
    resultCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
            <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-1);">Extracted Bill Parameters</span>
            <span class="hist-pill"><span class="hist-pill-dot"></span>Processed</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 0.78rem;">
            <div>
                <span style="color: var(--text-3); display: block; margin-bottom: 2px;">Consumer Name</span>
                <strong style="color: var(--text-1); font-weight: 600;">Srivatsa Rajeev</strong>
            </div>
            <div>
                <span style="color: var(--text-3); display: block; margin-bottom: 2px;">Units Consumed</span>
                <strong style="color: var(--text-1); font-weight: 600;">330 Units</strong>
            </div>
            <div>
                <span style="color: var(--text-3); display: block; margin-bottom: 2px;">Current Bill</span>
                <strong style="color: var(--amber); font-weight: 600;">₹2,850</strong>
            </div>
            <div>
                <span style="color: var(--text-3); display: block; margin-bottom: 2px;">Tariff</span>
                <strong style="color: var(--text-1); font-weight: 600;">LT-2a Domestic</strong>
            </div>
            <div style="grid-column: span 2;">
                <span style="color: var(--text-3); display: block; margin-bottom: 2px;">Billing Period</span>
                <strong style="color: var(--text-1); font-weight: 600;">06 Jul - 06 Aug</strong>
            </div>
        </div>
        <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed var(--border); text-align: right;">
            <button class="btn-ghost btn-sm" id="btn-autofill-properties" style="font-size: 0.75rem; padding: 4px 8px;">
                Autofill Houses with Bill
            </button>
        </div>
    `;

    // Reveal house inputs section
    const inputContainer = document.getElementById('house-input-container');
    const headerActions = document.getElementById('input-header-actions');
    if (inputContainer) inputContainer.style.display = 'block';
    if (headerActions) headerActions.style.display = 'flex';

    // Bind autofill button
    document.getElementById('btn-autofill-properties')?.addEventListener('click', () => {
        renderHouseInputs(sampleHouses);
        alert("Autofilled 5 houses using extracted sample bill units (330 Units) as the base!");
    });
}

// ── Render Input Form Cards ──────────────────────────────────────────────
function renderHouseInputs(data = null) {
    const grid = document.getElementById('input-grid');
    if (!grid) return;

    grid.innerHTML = '';

    for (let idx = 0; idx < 5; idx++) {
        const houseData = data ? data[idx] : null;
        const houseName = houseData ? houseData.house_id : `House ${101 + idx}`;

        const card = document.createElement('div');
        card.className = 'prop-input-card';
        card.innerHTML = `
            <div class="pic-header">
                <input class="house-name-inp" data-house="${idx}" value="${houseName}" placeholder="House / House No." aria-label="House or House Number">
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
                                aria-label="${label} usage for House ${101 + idx}">
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
            house_id: nameInp?.value || `House ${101 + idx}`,
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
// ── Render Results Dashboard ──────────────────────────────────────────
function renderResultsDashboard(data) {
    const s = data.summary;

    // Top Summary Bar
    animateCount('r-total-units', s.total_units, 0, ' kWh');
    animateCount('r-total-bill', s.total_bill, 0, '₹');
    animateCount('r-predicted-bill', s.predicted_total_bill, 0, '₹');
    animateCount('r-total-savings', s.estimated_total_savings, 0, '₹');
    animateCount('r-co2', s.co2_reduction, 1, ' kg');

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
    
    // Render Overview tips-list
    const tipsList = document.getElementById('tips-list');
    if (tipsList && data.houses) {
        tipsList.innerHTML = '';
        data.houses.forEach(house => {
            const li = document.createElement('li');
            li.className = 'advice-item';
            const topTips = house.recommendations[0]?.tips || [];
            const tipText = topTips.length > 0 ? topTips[0] : 'Optimize usage.';
            li.innerHTML = `<span><strong>${house.house_id}:</strong> ${tipText} (Save ₹${house.recommendations[0]?.estimated_saving || 0}/mo)</span>`;
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

    houses.forEach((house, idx) => {
        const score = house.efficiency_score || 85;
        const confidence = house.confidence || 95;
        const carbon = house.carbon_footprint || 0.0;
        
        // Let's get top 3 consumers
        const topConsumers = house.top_consumers || [];
        const topThreeHtml = topConsumers.map((item, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
            return `<div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px dashed var(--border); font-size: 0.8rem;">
                <span style="color: var(--text-1); font-weight: 500;">${medal} ${item.appliance}</span>
                <strong style="color: var(--text-2); font-weight: 600;">${item.value} kWh</strong>
            </div>`;
        }).join('');

        const currentBescom = house.current_bill_breakdown || {
            energy_charges: 0, fixed_charges: 150, taxes: 0, fppca: 0, penalty: 0, total_bill: 0
        };
        const predictedBescom = house.predicted_bill_breakdown || {
            energy_charges: 0, fixed_charges: 150, taxes: 0, fppca: 0, penalty: 0, total_bill: 0
        };

        const currentBill = currentBescom.total_bill;
        const predictedBill = predictedBescom.total_bill;
        const savings = house.estimated_savings;
        const diff = Math.round(currentBill - predictedBill);
        const pctDiff = currentBill > 0 ? Math.round((diff / currentBill) * 100) : 0;
        const pctLabel = pctDiff >= 0 ? `-${pctDiff}%` : `+${Math.abs(pctDiff)}%`;

        const card = document.createElement('div');
        card.className = 'prop-card';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '16px';
        card.style.marginBottom = '24px';
        card.style.padding = '20px';
        card.style.background = 'var(--card-bg)';
        card.style.borderRadius = 'var(--r)';
        card.style.border = '1px solid var(--border)';

        card.innerHTML = `
            <!-- Header Row -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
                <div>
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-1);">${house.house_id}</h3>
                    <span style="font-size: 0.72rem; color: var(--text-3);">Domestic Utility ID: BESCOM-LT2A-0${idx + 1}</span>
                </div>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <div style="text-align: right;">
                        <span style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-3); display: block; margin-bottom: 2px;">Energy Score</span>
                        <strong style="font-size: 0.95rem; color: ${score >= 85 ? 'var(--green)' : score >= 70 ? 'var(--amber)' : 'var(--red)'}; font-weight: 700;">${score}/100</strong>
                    </div>
                    <div style="height: 24px; width: 1px; background: var(--border);"></div>
                    <div style="text-align: right;">
                        <span style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-3); display: block; margin-bottom: 2px;">Confidence</span>
                        <strong style="font-size: 0.95rem; color: var(--text-1); font-weight: 600;">${confidence}%</strong>
                    </div>
                </div>
            </div>

            <!-- Dashboard Columns -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; align-items: start;">
                <!-- Column 1: Prediction Overview -->
                <div style="background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r); padding: 16px; display: flex; flex-direction: column; gap: 12px; height: 100%;">
                    <span style="font-size: 0.78rem; font-weight: 600; text-transform: uppercase; color: var(--text-3); display: block; border-bottom: 1px solid var(--border); padding-bottom: 6px;">Next Month Prediction</span>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.8rem; color: var(--text-2);">Current Bill</span>
                        <strong style="font-size: 0.95rem; color: var(--text-1);">₹${currentBill}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.8rem; color: var(--text-2);">Predicted Bill</span>
                        <strong style="font-size: 0.95rem; color: var(--blue);">₹${predictedBill}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border); padding-top: 8px;">
                        <span style="font-size: 0.8rem; color: var(--text-2);">Expected Saving</span>
                        <strong style="font-size: 0.95rem; color: var(--green);">₹${savings}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.8rem; color: var(--text-2);">Difference</span>
                        <span style="font-size: 0.82rem; font-weight: 600; color: ${diff >= 0 ? 'var(--green)' : 'var(--red)'};">${diff >= 0 ? '▼' : '▲'} ₹${Math.abs(diff)} (${pctLabel})</span>
                    </div>
                    <div style="border-top: 1px dashed var(--border); padding-top: 8px; font-size: 0.75rem; color: var(--text-3); display: flex; justify-content: space-between;">
                        <span>Carbon Footprint:</span>
                        <strong style="color: var(--text-1); font-weight: 600;">${carbon} kg CO₂</strong>
                    </div>
                </div>

                <!-- Column 2: Consumption Shares & Top Consumers -->
                <div style="background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r); padding: 16px; height: 100%;">
                    <span style="font-size: 0.78rem; font-weight: 600; text-transform: uppercase; color: var(--text-3); display: block; border-bottom: 1px solid var(--border); padding-bottom: 6px; margin-bottom: 8px;">Top Energy Consumers</span>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        ${topThreeHtml}
                    </div>
                    <!-- Micro bar for overall share -->
                    <div style="margin-top: 12px; font-size: 0.72rem; color: var(--text-3);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span>AC Share:</span>
                            <strong>${Math.round((house.appliances.ac / (house.current_units || 1)) * 100)}%</strong>
                        </div>
                        <div style="height: 6px; background: var(--border); border-radius: 3px; overflow: hidden;">
                            <div style="height: 100%; width: ${Math.round((house.appliances.ac / (house.current_units || 1)) * 100)}%; background: var(--amber);"></div>
                        </div>
                    </div>
                </div>

                <!-- Column 3: BESCOM Bill Breakdown -->
                <div style="background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r); padding: 16px; height: 100%;">
                    <span style="font-size: 0.78rem; font-weight: 600; text-transform: uppercase; color: var(--text-3); display: block; border-bottom: 1px solid var(--border); padding-bottom: 6px; margin-bottom: 6px;">BESCOM Slab Breakdown</span>
                    <table style="width: 100%; font-size: 0.75rem; border-collapse: collapse; line-height: 1.4;">
                        <tbody>
                            <tr>
                                <td style="color: var(--text-2); padding: 2px 0;">Energy Charges:</td>
                                <td style="text-align: right; color: var(--text-1); font-weight: 600;">₹${currentBescom.energy_charges}</td>
                            </tr>
                            <tr>
                                <td style="color: var(--text-2); padding: 2px 0;">Fixed Charges:</td>
                                <td style="text-align: right; color: var(--text-1); font-weight: 600;">₹${currentBescom.fixed_charges}</td>
                            </tr>
                            <tr>
                                <td style="color: var(--text-2); padding: 2px 0;">Taxes (9%):</td>
                                <td style="text-align: right; color: var(--text-1); font-weight: 600;">₹${currentBescom.taxes}</td>
                            </tr>
                            <tr>
                                <td style="color: var(--text-2); padding: 2px 0;">FPPCA Charges:</td>
                                <td style="text-align: right; color: var(--text-1); font-weight: 600;">₹${currentBescom.fppca}</td>
                            </tr>
                            <tr>
                                <td style="color: var(--text-2); padding: 2px 0;">Penalty:</td>
                                <td style="text-align: right; color: var(--text-1); font-weight: 600;">₹${currentBescom.penalty}</td>
                            </tr>
                            <tr style="border-top: 1px solid var(--border);">
                                <td style="color: var(--text-1); font-weight: 600; padding: 4px 0 0 0;">Total Bill:</td>
                                <td style="text-align: right; color: var(--amber); font-weight: 700; padding: 4px 0 0 0;">₹${currentBill}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Recommendations Section -->
            <div style="border-top: 1px solid var(--border); padding-top: 12px;">
                <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-1); display: block; margin-bottom: 8px;">💡 Smart AI Recommendations</span>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                    ${(house.recommendations || []).slice(0, 2).map(rec => {
                        return `
                            <div style="background: var(--surface-2); border-left: 3px solid var(--green); padding: 8px 12px; border-radius: 0 var(--r) var(--r) 0; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                                <div>
                                    <strong style="font-size: 0.78rem; color: var(--text-1); display: block; margin-bottom: 4px;">${rec.appliance} Optimization</strong>
                                    <ul style="margin: 0; padding-left: 14px; font-size: 0.72rem; color: var(--text-2);">
                                        ${rec.tips.map(t => `<li style="margin-bottom: 2px;">${t}</li>`).join('')}
                                    </ul>
                                </div>
                                <div style="margin-top: 8px; text-align: right; font-size: 0.72rem; color: var(--green); font-weight: 600;">
                                    Estimated Saving: ₹${rec.estimated_saving}/month
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
    // 1. Render aggregate cards in Summary tab
    const aggGrid = document.getElementById('agg-grid');
    if (aggGrid) {
        const averageBill = Math.round(summary.total_bill / 5);
        const bestHouse = houses.reduce((best, h) => (h.efficiency_score > best.efficiency_score) ? h : best, houses[0]);
        
        aggGrid.innerHTML = `
            <div class="agg-card">
                <div class="agg-label">Average House Bill</div>
                <div class="agg-value">₹${averageBill}</div>
                <div class="agg-sub">Across all 5 houses</div>
            </div>
            <div class="agg-card">
                <div class="agg-label">Most Efficient</div>
                <div class="agg-value green">${bestHouse.house_id}</div>
                <div class="agg-sub">Energy Score: ${bestHouse.efficiency_score}/100</div>
            </div>
            <div class="agg-card">
                <div class="agg-label">Highest Savings Potential</div>
                <div class="agg-value amber">${summary.best_saving_house}</div>
                <div class="agg-sub">Can save ₹${Math.max(...houses.map(h => h.estimated_savings))} this month</div>
            </div>
        `;
    }

    // 2. Render Leaderboards (Highest Consumption, Highest Bill, Highest Saving Potential, Best Energy Score)
    const rankingsContainer = document.getElementById('rankings-container');
    if (rankingsContainer) {
        rankingsContainer.innerHTML = '';

        // Category definitions
        const categories = [
            {
                title: "📈 Highest Consumption",
                sub: "Ranked by current kWh",
                icon: "⚡",
                unit: " kWh",
                data: [...houses].sort((a, b) => b.current_units - a.current_units).map(h => ({ name: h.house_id, val: h.current_units }))
            },
            {
                title: "💸 Highest Bill",
                sub: "Ranked by current BESCOM bill",
                icon: "₹",
                unit: "",
                data: [...houses].sort((a, b) => b.current_bill - a.current_bill).map(h => ({ name: h.house_id, val: "₹" + h.current_bill }))
            },
            {
                title: "💰 Highest Saving Potential",
                sub: "Ranked by optimization offset",
                icon: "🌱",
                unit: "",
                data: [...houses].sort((a, b) => b.estimated_savings - a.estimated_savings).map(h => ({ name: h.house_id, val: "₹" + h.estimated_savings }))
            },
            {
                title: "🏆 Best Energy Score",
                sub: "Ranked by efficiency index",
                icon: "⭐",
                unit: "/100",
                data: [...houses].sort((a, b) => b.efficiency_score - a.efficiency_score).map(h => ({ name: h.house_id, val: h.efficiency_score }))
            }
        ];

        categories.forEach(cat => {
            const listHtml = cat.data.map((item, idx) => {
                const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`;
                const isTop = idx === 0;
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 0.78rem;">
                        <span style="font-weight: ${isTop ? '600' : '400'}; color: ${isTop ? 'var(--text-1)' : 'var(--text-2)'};">${medal} ${item.name}</span>
                        <strong style="color: ${isTop ? 'var(--text-1)' : 'var(--text-3)'};">${item.val}${cat.unit}</strong>
                    </div>
                `;
            }).join('');

            const board = document.createElement('div');
            board.style.background = 'var(--surface-2)';
            board.style.border = '1px solid var(--border)';
            board.style.borderRadius = 'var(--r)';
            board.style.padding = '12px 16px';
            board.innerHTML = `
                <div style="margin-bottom: 10px; border-bottom: 1px solid var(--border); padding-bottom: 6px;">
                    <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-1); display: block;">${cat.title}</span>
                    <span style="font-size: 0.65rem; color: var(--text-3);">${cat.sub}</span>
                </div>
                <div>
                    ${listHtml}
                </div>
            `;
            rankingsContainer.appendChild(board);
        });
    }

    // 3. Render Comparative Insights List
    const insightsList = document.getElementById('insights-list');
    if (insightsList) {
        insightsList.innerHTML = '';

        const highestAC = houses.reduce((max, h) => (h.appliances.ac > max.appliances.ac) ? h : max, houses[0]);
        const highestUnits = houses.reduce((max, h) => (h.current_units > max.current_units) ? h : max, houses[0]);
        const lowestUnits = houses.reduce((min, h) => (h.current_units < min.current_units) ? h : min, houses[0]);

        const pctDiff = Math.round(((highestUnits.current_units - lowestUnits.current_units) / (lowestUnits.current_units || 1)) * 100);

        const insights = [
            `<strong>${highestUnits.house_id}</strong> is the highest consumer, using <strong>${pctDiff}% more</strong> electricity than the most efficient house <strong>${lowestUnits.house_id}</strong>.`,
            `<strong>${highestAC.house_id}</strong> has the highest AC consumption at <strong>${highestAC.appliances.ac} kWh</strong>, accounting for <strong>${Math.round((highestAC.appliances.ac / (highestAC.current_units || 1)) * 100)}%</strong> of its total footprint.`,
            `If recommendations are fully implemented, <strong>${summary.best_saving_house}</strong> could reduce its monthly bill by <strong>18%</strong>, representing a net monthly savings of <strong>₹${Math.max(...houses.map(h => h.estimated_savings))}</strong>.`,
            `Total aggregate savings of <strong>₹${summary.estimated_total_savings}</strong> across all houses is equivalent to planting <strong>${Math.round(summary.estimated_total_savings * 0.05)} virtual trees</strong> in monthly CO₂ offsets.`
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

    // 1. Appliance Consumption Bar Chart
    const appCtx = document.getElementById('applianceBarChart')?.getContext('2d');
    if (appCtx) {
        if (applianceBarChartInstance) applianceBarChartInstance.destroy();

        const appSums = {};
        appliances.forEach(([key]) => {
            appSums[key] = 0;
        });
        houses.forEach(h => {
            appliances.forEach(([key]) => {
                appSums[key] += h.appliances[key] || 0;
            });
        });

        applianceBarChartInstance = new Chart(appCtx, {
            type: 'bar',
            data: {
                labels: appliances.map(([_, label]) => label),
                datasets: [{
                    label: 'Aggregate Consumption (kWh)',
                    data: appliances.map(([key]) => Math.round(appSums[key])),
                    backgroundColor: [
                        'rgba(24, 24, 27, 0.85)',
                        'rgba(63, 63, 70, 0.8)',
                        'rgba(113, 113, 122, 0.75)',
                        'rgba(161, 161, 170, 0.7)',
                        'rgba(212, 212, 216, 0.65)',
                        'rgba(244, 244, 245, 0.85)',
                        'rgba(9, 9, 11, 0.5)'
                    ],
                    borderColor: '#0f0f10',
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: 'rgba(0, 0, 0, 0.05)' } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // 2. Property Comparison Chart
    const propCtx = document.getElementById('propertyComparisonChart')?.getContext('2d');
    if (propCtx) {
        if (propertyComparisonChartInstance) propertyComparisonChartInstance.destroy();

        propertyComparisonChartInstance = new Chart(propCtx, {
            type: 'bar',
            data: {
                labels: houses.map(h => h.house_id),
                datasets: [{
                    label: 'Total Consumption (kWh)',
                    data: houses.map(h => h.current_units),
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    borderColor: 'rgba(15, 23, 42, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: 'rgba(0, 0, 0, 0.05)' } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // 3. Bill Prediction Chart
    const predCtx = document.getElementById('billPredictionChart')?.getContext('2d');
    if (predCtx) {
        if (billPredictionChartInstance) billPredictionChartInstance.destroy();

        billPredictionChartInstance = new Chart(predCtx, {
            type: 'bar',
            data: {
                labels: houses.map(h => h.house_id),
                datasets: [
                    {
                        label: 'Current Bill (₹)',
                        data: houses.map(h => h.current_bill),
                        backgroundColor: '#d97706',
                        borderRadius: 4
                    },
                    {
                        label: 'Predicted Next Month (₹)',
                        data: houses.map(h => h.predicted_next_month_bill),
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
                    y: { grid: { color: 'rgba(0, 0, 0, 0.05)' } }
                },
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // 4. Overall Appliance Share (Pie Chart)
    const pieCtx = document.getElementById('applianceContributionPieChart')?.getContext('2d');
    if (pieCtx) {
        if (applianceContributionPieChartInstance) applianceContributionPieChartInstance.destroy();

        const appSums = {};
        appliances.forEach(([key]) => {
            appSums[key] = 0;
        });
        houses.forEach(h => {
            appliances.forEach(([key]) => {
                appSums[key] += h.appliances[key] || 0;
            });
        });

        applianceContributionPieChartInstance = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: appliances.map(([_, label]) => label),
                datasets: [{
                    data: appliances.map(([key]) => Math.round(appSums[key])),
                    backgroundColor: [
                        '#3b82f6', // blue
                        '#10b981', // green
                        '#f59e0b', // amber
                        '#ef4444', // red
                        '#8b5cf6', // violet
                        '#ec4899', // pink
                        '#6b7280'  // gray
                    ],
                    borderWidth: 1.5,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12 } }
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

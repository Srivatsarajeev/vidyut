/**
 * Vidyut - Energy Consumption Analytics
 * Frontend Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    setupEventListeners();
    loadCloudRecords();
    
    // Run initial dashboard calculations based on default input values
    updateDashboard();
});

let myChart;
const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function initChart() {
    const ctx = document.getElementById('overviewChart').getContext('2d');
    
    // Initial data from the inputs
    const initialData = months.map(m => parseFloat(document.getElementById(m).value) || 0);

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthNames,
            datasets: [{
                label: 'Units Consumed',
                data: initialData,
                backgroundColor: 'rgba(0, 97, 242, 0.1)',
                borderColor: '#0061f2',
                borderWidth: 2,
                borderRadius: 4,
                barThickness: 20,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 10
                        },
                        color: '#64748b'
                    }
                }
            }
        }
    });
}

function setupEventListeners() {
    // Listen for input changes to update the chart and stats
    const inputs = document.querySelectorAll('.monthly-grid input');
    inputs.forEach(input => {
        input.addEventListener('input', updateDashboard);
    });

    // Predict button logic
    const predictBtn = document.querySelector('.predict-btn-main');
    predictBtn.addEventListener('click', async () => {
        const values = months.map(m => parseFloat(document.getElementById(m).value) || 0);
        
        predictBtn.textContent = 'Analyzing & Syncing...';
        predictBtn.disabled = true;

        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) throw new Error('Prediction API call failed');
            const data = await response.json();
            
            displayPredictionResult(data);
            loadCloudRecords(); // Refresh sync history
        } catch (error) {
            console.error(error);
            alert('Error running prediction. Please ensure the backend is running.');
        } finally {
            predictBtn.textContent = 'Predict Next Month Usage';
            predictBtn.disabled = false;
        }
    });

    // CSV Upload handlers
    const btnUpload = document.getElementById('btn-upload');
    const csvFileInput = document.getElementById('csv-file-input');

    btnUpload.addEventListener('click', () => {
        csvFileInput.click();
    });

    csvFileInput.addEventListener('change', async (e) => {
        if (e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        const originalBtnText = btnUpload.innerHTML;
        btnUpload.innerHTML = 'Uploading...';
        btnUpload.disabled = true;

        try {
            const response = await fetch('/api/upload-csv', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'CSV Upload failed');
            }

            const data = await response.json();
            
            // Update input fields in the UI
            if (data.historical_data && data.historical_data.length === 12) {
                months.forEach((m, idx) => {
                    document.getElementById(m).value = data.historical_data[idx];
                });
            }

            // Recalculate dashboard analytics and update chart
            updateDashboard();
            
            // Show prediction result
            displayPredictionResult(data);
            
            // Refresh sync history
            loadCloudRecords();
            
            alert(`Successfully loaded data from ${file.name}!`);
        } catch (error) {
            console.error(error);
            alert(`Error uploading CSV: ${error.message}`);
        } finally {
            btnUpload.innerHTML = originalBtnText;
            btnUpload.disabled = false;
            csvFileInput.value = ''; // Reset file input
        }
    });

    // Manual Cloud Sync Button
    const btnSyncManual = document.getElementById('btn-sync-manual');
    btnSyncManual.addEventListener('click', async () => {
        const values = months.map(m => parseFloat(document.getElementById(m).value) || 0);
        
        const originalBtnText = btnSyncManual.innerHTML;
        btnSyncManual.innerHTML = 'Syncing...';
        btnSyncManual.disabled = true;

        try {
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) throw new Error('Sync API call failed');
            const data = await response.json();
            
            loadCloudRecords(); // Refresh sync history
            alert(`Dashboard successfully synced! Sync ID: ${data.sync_id}`);
        } catch (error) {
            console.error(error);
            alert('Error syncing to cloud. Please ensure the backend is running.');
        } finally {
            btnSyncManual.innerHTML = originalBtnText;
            btnSyncManual.disabled = false;
        }
    });

    // Sidebar Predict button smooth scroll
    const sidebarPredict = document.querySelector('.predict-usage-btn');
    sidebarPredict.addEventListener('click', () => {
        document.querySelector('.predict-btn-main').scrollIntoView({ behavior: 'smooth' });
    });
}

function updateDashboard() {
    const values = months.map(m => parseFloat(document.getElementById(m).value) || 0);

    // Update Chart
    if (myChart) {
        myChart.data.datasets[0].data = values;
        myChart.update();
    }

    // Update Stats
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    document.getElementById('avg-val').textContent = avg.toFixed(1);
    document.getElementById('high-val').textContent = max;
    document.getElementById('low-val').textContent = min;
    
    // Find month of high/low
    const highMonthIdx = values.indexOf(max);
    const lowMonthIdx = values.indexOf(min);
    
    document.getElementById('high-val').parentElement.querySelector('.stat-unit').textContent = `Units (${monthNames[highMonthIdx]})`;
    document.getElementById('low-val').parentElement.querySelector('.stat-unit').textContent = `Units (${monthNames[lowMonthIdx]})`;
}

function displayPredictionResult(data) {
    // Hide placeholder, show content
    document.getElementById('prediction-placeholder').style.display = 'none';
    document.getElementById('prediction-content').style.display = 'block';

    const alertEligible = document.getElementById('alert-eligible');
    const alertExceeded = document.getElementById('alert-exceeded');
    
    if (data.is_eligible) {
        alertEligible.style.display = 'flex';
        alertExceeded.style.display = 'none';
        document.getElementById('forecast-units-eligible').textContent = data.prediction;
    } else {
        alertEligible.style.display = 'none';
        alertExceeded.style.display = 'flex';
        document.getElementById('forecast-units-exceeded').textContent = data.prediction;
    }

    document.getElementById('cloud-sync-id').textContent = data.sync_id || '--';

    // Update tips list dynamically
    const tipsList = document.querySelector('.tips-list');
    if (tipsList && data.recommendations) {
        tipsList.innerHTML = '';
        data.recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.className = 'tip-item';
            li.innerHTML = `
                <span class="tip-bolt">⚡</span>
                <span class="tip-text">${rec}</span>
            `;
            tipsList.appendChild(li);
        });
    }
}

async function loadCloudRecords() {
    try {
        const response = await fetch('/api/cloud-records');
        if (!response.ok) throw new Error('Failed to fetch cloud records');
        
        const records = await response.json();
        const tbody = document.getElementById('cloud-history-tbody');
        tbody.innerHTML = '';

        if (records.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No synced records found.</td>
                </tr>
            `;
            return;
        }

        // Sort records by timestamp (latest first)
        records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        records.forEach(rec => {
            const tr = document.createElement('tr');
            
            // Format timestamp
            const date = new Date(rec.timestamp);
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            
            // Identify type
            const type = rec.type || (rec.filename ? `Upload (${rec.filename})` : 'Legacy Sync');
            
            // Forecasted value
            const forecasted = rec.consumption ? `${rec.consumption} Units` : 'N/A';
            
            // Average value
            const averageVal = rec.average ? `${rec.average} Units` : 'N/A';
            
            // Restore action button
            let actionHtml = '';
            if (rec.inputs && rec.inputs.length === 12) {
                actionHtml = `<button class="btn-restore" data-inputs='${JSON.stringify(rec.inputs)}'>Restore</button>`;
            } else {
                actionHtml = `<span style="color: var(--text-muted); font-size: 0.75rem;">Non-restorable</span>`;
            }

            tr.innerHTML = `
                <td style="padding: 10px 8px;">${formattedTime}</td>
                <td style="padding: 10px 8px; font-weight: 500;">${type}</td>
                <td style="padding: 10px 8px;">${forecasted}</td>
                <td style="padding: 10px 8px;">${averageVal}</td>
                <td style="padding: 10px 8px;">${actionHtml}</td>
            `;

            tbody.appendChild(tr);
        });

        // Set event listeners for restore buttons
        document.querySelectorAll('.btn-restore').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const inputs = JSON.parse(e.target.getAttribute('data-inputs'));
                if (inputs && inputs.length === 12) {
                    months.forEach((m, idx) => {
                        document.getElementById(m).value = inputs[idx];
                    });
                    updateDashboard();
                    
                    // Trigger prediction after restore
                    document.querySelector('.predict-btn-main').click();
                }
            });
        });

    } catch (error) {
        console.error('Error loading cloud records:', error);
    }
}

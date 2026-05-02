document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. UI Elements ---
    const statConsumption = document.getElementById('stat-consumption');
    const statCost = document.getElementById('stat-cost');
    const statEfficiency = document.getElementById('stat-efficiency');

    // --- 2. Chart Initialization ---
    const ctx = document.getElementById('usageChart').getContext('2d');
    let usageChart;

    const initChart = (data) => {
        if (usageChart) usageChart.destroy();
        
        const labels = data.map(item => item.time);
        const usageData = data.map(item => item.usage);

        let gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');   
        gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.1)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

        usageChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Consumption',
                    data: usageData,
                    borderColor: '#6366f1',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#050508',
                    pointBorderColor: '#6366f1',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { family: 'Outfit', size: 13 },
                        bodyFont: { family: 'Outfit', size: 12 },
                        padding: 12,
                        cornerRadius: 12,
                        displayColors: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.03)' },
                        ticks: { 
                            color: '#64748b', 
                            font: { family: 'Outfit', size: 11 },
                            padding: 10
                        },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { 
                            color: '#64748b', 
                            font: { family: 'Outfit', size: 11 },
                            padding: 10
                        },
                        border: { display: false }
                    }
                }
            }
        });
    };

    // --- 3. Input Range Updates ---
    const inputs = ['temperature', 'humidity', 'appliance_usage'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        const val = document.getElementById(id.substring(0,4) + '-val');
        input.addEventListener('input', (e) => val.innerText = e.target.value);
    });

    // --- 4. Prediction Logic ---
    const predictForm = document.getElementById('prediction-form');
    const resultCard = document.getElementById('prediction-result');
    const predEnergy = document.getElementById('pred-energy');
    const predLevel = document.getElementById('pred-level');
    const predictBtn = document.getElementById('predict-btn');

    predictForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const temp = document.getElementById('temperature').value;
        const hum = document.getElementById('humidity').value;
        const app = document.getElementById('appliance_usage').value;

        predictBtn.innerHTML = '<span class="loader"></span> Simulating...';
        predictBtn.disabled = true;

        try {
            const response = await fetch(`http://127.0.0.1:8001/predict?temperature=${temp}&humidity=${hum}&appliance_usage=${app}`);
            if (response.ok) {
                const data = await response.json();
                resultCard.classList.remove('hidden');
                predEnergy.innerText = data.predicted_energy_consumption;
                predLevel.innerText = data.usage_level;
                predLevel.className = 'badge'; 
                
                if (data.usage_level.includes('High')) predLevel.classList.add('badge-high');
                else if (data.usage_level.includes('Medium')) predLevel.classList.add('badge-mid');
                else predLevel.classList.add('badge-low');
            }
        } catch (error) {
            console.error(error);
        } finally {
            predictBtn.innerText = 'Run Simulation';
            predictBtn.disabled = false;
        }
    });

    // --- 5. Bill Upload & Data Sync ---
    const dropZone = document.getElementById('drop-zone');
    const billInput = document.getElementById('bill-input');
    const fileInfo = document.getElementById('file-info');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadStatus = document.getElementById('upload-status');

    dropZone.addEventListener('click', () => billInput.click());

    billInput.addEventListener('change', () => {
        if (billInput.files.length > 0) {
            fileInfo.innerText = billInput.files[0].name;
            fileInfo.style.color = 'var(--text-high)';
        }
    });

    uploadBtn.addEventListener('click', async () => {
        if (billInput.files.length === 0) return alert("Please select a bill first");

        const formData = new FormData();
        formData.append('file', billInput.files[0]);

        uploadBtn.innerText = 'Cloud Syncing...';
        uploadBtn.disabled = true;

        try {
            const response = await fetch('http://127.0.0.1:8001/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                
                // Update Stats
                statConsumption.innerText = data.extracted_data.consumption;
                statCost.innerText = data.extracted_data.cost.toLocaleString();
                
                // Simulated Efficiency update
                statEfficiency.innerText = Math.floor(Math.random() * 20) + 75;

                // Load updated history
                fetch('http://127.0.0.1:8001/history')
                    .then(r => r.json())
                    .then(historyData => initChart(historyData));

                uploadStatus.innerText = "Sync Successful ⚡";
                uploadStatus.style.color = 'var(--accent)';
                uploadStatus.classList.remove('hidden');
            }
        } catch (err) {
            uploadStatus.innerText = "Sync Error. Check API.";
            uploadStatus.style.color = 'var(--danger)';
            uploadStatus.classList.remove('hidden');
        } finally {
            uploadBtn.innerText = 'Analyze Patterns';
            uploadBtn.disabled = false;
        }
    });

    // Load initial demo data
    fetch('http://127.0.0.1:8001/history')
        .then(r => r.json())
        .then(historyData => initChart(historyData));

});

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. UI Elements ---
    const statsOverlay = document.getElementById('stats-overlay');
    const chartOverlay = document.getElementById('chart-overlay');
    const statConsumption = document.getElementById('stat-consumption');
    const statCost = document.getElementById('stat-cost');
    const statSubsidy = document.getElementById('stat-subsidy');
    const statPeriod = document.getElementById('stat-period');
    const statDue = document.getElementById('stat-due');

    // --- 2. Chart Initialization ---
    const ctx = document.getElementById('usageChart').getContext('2d');
    let usageChart;

    const initChart = (data) => {
        if (usageChart) usageChart.destroy();
        
        const labels = data.map(item => item.time);
        const usageData = data.map(item => item.usage);

        let gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');   
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        usageChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Energy Usage (Watts)',
                    data: usageData,
                    borderColor: '#3b82f6',
                    backgroundColor: gradient,
                    borderWidth: 4,
                    pointBackgroundColor: '#020617',
                    pointBorderColor: '#3b82f6',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
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
                        padding: 12,
                        cornerRadius: 12,
                        displayColors: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
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

        predictBtn.innerText = 'Analyzing Patterns...';
        predictBtn.disabled = true;

        try {
            const response = await fetch(`http://127.0.0.1:8001/predict?temperature=${temp}&humidity=${hum}&appliance_usage=${app}`);
            if (response.ok) {
                const data = await response.json();
                resultCard.classList.remove('hidden');
                predEnergy.innerText = data.predicted_energy_consumption;
                predLevel.innerText = data.usage_level;
                predLevel.className = 'result-badge'; 
                
                if (data.usage_level.includes('High')) predLevel.classList.add('badge-high');
                else if (data.usage_level.includes('Medium')) predLevel.classList.add('badge-medium');
                else predLevel.classList.add('badge-low');
            }
        } catch (error) {
            console.error(error);
        } finally {
            predictBtn.innerText = 'Predict Consumption';
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
            fileInfo.innerText = `Selected: ${billInput.files[0].name}`;
        }
    });

    uploadBtn.addEventListener('click', async () => {
        if (billInput.files.length === 0) return alert("Please select a bill first");

        const formData = new FormData();
        formData.append('file', billInput.files[0]);

        uploadBtn.innerText = 'Syncing to Cloud...';
        uploadBtn.disabled = true;

        try {
            const response = await fetch('http://127.0.0.1:8001/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                
                // Remove Overlays
                statsOverlay.classList.add('hidden');
                chartOverlay.classList.add('hidden');

                // Update Stats
                statConsumption.innerText = data.extracted_data.consumption;
                statCost.innerText = data.extracted_data.cost;
                statSubsidy.innerText = (data.extracted_data.consumption * 2.1).toFixed(2); // Simulated subsidy calculation
                statPeriod.innerText = `Period: ${data.extracted_data.period}`;
                statDue.innerText = `Due Date: 25/04/2026`;

                // Load history from cloud
                fetch('http://127.0.0.1:8001/history')
                    .then(r => r.json())
                    .then(historyData => initChart(historyData));

                uploadStatus.innerText = "Cloud Sync Successful! ⚡";
                uploadStatus.className = 'status-msg status-success';
                uploadStatus.classList.remove('hidden');
            }
        } catch (err) {
            uploadStatus.innerText = "Sync Failed. Check Connection.";
            uploadStatus.className = 'status-msg status-error';
            uploadStatus.classList.remove('hidden');
        } finally {
            uploadBtn.innerText = 'Analyze Bill';
            uploadBtn.disabled = false;
        }
    });

});

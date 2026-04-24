document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Chart Initialization ---
    const ctx = document.getElementById('usageChart').getContext('2d');
    let usageChart;

    const initChart = (data) => {
        const labels = data.map(item => item.time);
        const usageData = data.map(item => item.usage);

        // Gradient for line chart
        let gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');   
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        usageChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Energy Usage (kWh)',
                    data: usageData,
                    borderColor: '#3b82f6',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#1e293b',
                    pointBorderColor: '#3b82f6',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4 // smooth curves
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f8fafc',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    };

    // Fetch history data from API
    fetch('http://127.0.0.1:8000/history')
        .then(response => response.json())
        .then(data => initChart(data))
        .catch(err => {
            console.warn("Backend not running, using mock history data", err);
            const mockData = [
                { time: "00:00", usage: 100 },
                { time: "04:00", usage: 80 },
                { time: "08:00", usage: 130 },
                { time: "12:00", usage: 180 },
                { time: "16:00", usage: 160 },
                { time: "20:00", usage: 190 },
            ];
            initChart(mockData);
        });


    // --- 2. Input Range Updates ---
    const tempInput = document.getElementById('temperature');
    const humInput = document.getElementById('humidity');
    const appInput = document.getElementById('appliance_usage');

    const tempVal = document.getElementById('temp-val');
    const humVal = document.getElementById('hum-val');
    const appVal = document.getElementById('app-val');

    tempInput.addEventListener('input', (e) => tempVal.innerText = e.target.value);
    humInput.addEventListener('input', (e) => humVal.innerText = e.target.value);
    appInput.addEventListener('input', (e) => appVal.innerText = e.target.value);


    // --- 3. Form Submission & Prediction ---
    const predictForm = document.getElementById('prediction-form');
    const resultCard = document.getElementById('prediction-result');
    const predEnergy = document.getElementById('pred-energy');
    const predLevel = document.getElementById('pred-level');
    const predictBtn = document.getElementById('predict-btn');

    predictForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const temp = tempInput.value;
        const hum = humInput.value;
        const app = appInput.value;

        // UI Loading state
        predictBtn.innerHTML = `Predicting... <svg class="pulse" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path></svg>`;
        predictBtn.disabled = true;

        try {
            const response = await fetch(`http://127.0.0.1:8000/predict?temperature=${temp}&humidity=${hum}&appliance_usage=${app}`);
            
            if (response.ok) {
                const data = await response.json();
                
                // Show result
                resultCard.classList.remove('hidden');
                predEnergy.innerText = data.predicted_energy_consumption;
                
                // Set badge style
                predLevel.innerText = data.usage_level;
                predLevel.className = 'result-badge'; // reset
                
                if (data.usage_level.includes('High')) {
                    predLevel.classList.add('badge-high');
                } else if (data.usage_level.includes('Medium')) {
                    predLevel.classList.add('badge-medium');
                } else {
                    predLevel.classList.add('badge-low');
                }
            } else {
                alert("Error getting prediction from server");
            }
        } catch (error) {
            console.error(error);
            alert("Could not connect to backend. Make sure FastAPI is running on port 8000.");
        } finally {
            // Restore button
            predictBtn.innerHTML = `Predict Energy <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
            predictBtn.disabled = false;
        }
    });

});

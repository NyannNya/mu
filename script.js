document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const strategyMode = document.getElementById('strategy-mode');
    const historyInputContainer = document.getElementById('history-input-container');
    const resultsArea = document.getElementById('results-area');
    const numbersGrid = document.getElementById('numbers-grid');
    const totalTicketsDisplay = document.getElementById('total-tickets');
    const safeZoneDisplay = document.getElementById('safe-zone');

    // Toggle History Input
    strategyMode.addEventListener('change', (e) => {
        if (e.target.value === 'history') {
            historyInputContainer.classList.remove('hidden');
        } else {
            historyInputContainer.classList.add('hidden');
        }
    });

    calculateBtn.addEventListener('click', () => {
        const participants = parseInt(document.getElementById('participants').value) || 60000;
        const ticketsPerPerson = parseInt(document.getElementById('tickets').value) || 10;
        const mode = strategyMode.value;
        const lastWinner = parseInt(document.getElementById('last-winner').value) || null;

        calculateStrategy(participants, ticketsPerPerson, mode, lastWinner);
    });

    function calculateStrategy(participants, ticketsPerPerson, mode, lastWinner) {
        // Visual Feedback
        calculateBtn.innerHTML = '<span>計算中...</span>';
        calculateBtn.disabled = true;
        resultsArea.classList.add('hidden');

        // Use setTimeout to allow UI to update before heavy calculation
        setTimeout(() => {
            const recommendations = runSimulation(participants, ticketsPerPerson, mode, lastWinner);

            displayResults(recommendations, participants * ticketsPerPerson);

            calculateBtn.innerHTML = '<span>計算推薦號碼</span>';
            calculateBtn.disabled = false;
        }, 100);
    }

    function runSimulation(participants, ticketsPerPerson, mode, lastWinner) {
        const totalTickets = participants * ticketsPerPerson;

        let candidates = [];

        if (mode === 'history' && lastWinner) {
            // Adaptive Strategy
            const base = lastWinner;
            candidates.push(base + 1);
            candidates.push(base + 7);
            candidates.push(base + 13);

            // Add some calculated ones
            const calculated = getColdStartRecommendations(totalTickets);
            candidates = candidates.concat(calculated.slice(0, 7));

        } else {
            // Cold Start Strategy
            candidates = getColdStartRecommendations(totalTickets);
        }

        // Sort and deduplicate
        candidates = [...new Set(candidates)].sort((a, b) => a - b).slice(0, 10);
        return candidates;
    }

    function getColdStartRecommendations(totalTickets) {
        // Simulation Logic Refined
        // User Feedback: "Since winner is SMALLEST unique, concentrate at safe zone start"
        // Avoid wasting slots on unnecessarily large numbers

        const recommendations = [];

        // 1. The "Lucky Low" (High Risk, High Reward) - Small chance
        recommendations.push(randomInt(1000, 5000));
        recommendations.push(randomInt(5000, 15000));

        // 2. The "Transition" (Medium Risk)
        // Around the total ticket count / 4
        const midPoint = Math.floor(totalTickets / 4);
        recommendations.push(randomInt(midPoint, midPoint + 20000));

        // 3. The "Safe Zone Threshold" (Optimal Strategy)
        // Since winner is the SMALLEST unique number, we want to cluster
        // recommendations at the start of the safe zone, not spread to millions
        const safeStart = Math.floor(totalTickets * 0.8);

        // Concentrate 5 numbers in a tight range just above the safe threshold
        for (let i = 0; i < 5; i++) {
            const min = safeStart + (i * 3000);
            const max = min + 3000;
            recommendations.push(randomInt(min, max));
        }

        // One slightly higher backup (not millions, just moderately higher)
        recommendations.push(randomInt(safeStart + 20000, safeStart + 50000));

        return recommendations;
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function displayResults(numbers, totalTickets) {
        resultsArea.classList.remove('hidden');
        numbersGrid.innerHTML = '';

        numbers.forEach((num, index) => {
            const div = document.createElement('div');
            div.className = 'number-badge';
            div.style.animationDelay = `${index * 0.05}s`;
            div.textContent = num.toLocaleString();

            // Visual hint for "Safety" based on magnitude relative to totalTickets
            if (num > totalTickets) {
                div.style.borderColor = '#4caf50'; // Safe Green
                div.style.color = '#4caf50';
            } else if (num > totalTickets * 0.5) {
                div.style.borderColor = '#FFD23F'; // Warning Yellow
                div.style.color = '#FFD23F';
            } else {
                div.style.borderColor = '#ff4d4d'; // Danger Red
                div.style.color = '#ff4d4d';
            }

            numbersGrid.appendChild(div);
        });

        totalTicketsDisplay.textContent = totalTickets.toLocaleString();

        // Estimate Safe Zone
        const safeStart = Math.floor(totalTickets * 0.8);
        safeZoneDisplay.textContent = `${safeStart.toLocaleString()} + (Converging Tail)`;

        // Visualization
        renderDensityChart(totalTickets);
    }

    function renderDensityChart(totalTickets) {
        const chartContainer = document.getElementById('density-chart');
        chartContainer.innerHTML = '';
        chartContainer.style.display = 'flex';
        chartContainer.style.alignItems = 'flex-end';
        chartContainer.style.height = '120px';
        chartContainer.style.gap = '2px';
        chartContainer.style.marginTop = '1rem';
        chartContainer.style.paddingBottom = '20px';

        // Create bars to represent density
        const bars = 40;
        for (let i = 0; i < bars; i++) {
            const bar = document.createElement('div');

            // Logic: High density at start, rapid drop, then long flat tail
            // x is from 0 to 1
            const x = i / bars;
            // Density function: 1 / (x + small) decay
            let density = Math.pow(1 - x, 4); // Steep decay

            const height = Math.max(2, density * 100);

            bar.style.width = '100%';
            bar.style.height = `${height}%`;

            // Color gradient: Red (Danger) -> Yellow -> Green (Safe)
            if (i < bars * 0.2) {
                bar.style.backgroundColor = '#ff4d4d'; // Danger
            } else if (i < bars * 0.5) {
                bar.style.backgroundColor = '#FFD23F'; // Warning
            } else {
                bar.style.backgroundColor = '#4caf50'; // Safe
            }

            bar.style.borderRadius = '2px 2px 0 0';
            bar.style.opacity = '0.9';

            chartContainer.appendChild(bar);
        }

        // Labels
        const startLabel = document.createElement('div');
        startLabel.textContent = '0';
        startLabel.style.position = 'absolute';
        startLabel.style.bottom = '0';
        startLabel.style.left = '0';
        startLabel.style.fontSize = '0.7rem';
        startLabel.style.color = '#a0a0a0';

        const endLabel = document.createElement('div');
        endLabel.textContent = 'High (Safe)';
        endLabel.style.position = 'absolute';
        endLabel.style.bottom = '0';
        endLabel.style.right = '0';
        endLabel.style.fontSize = '0.7rem';
        endLabel.style.color = '#4caf50';

        const midLabel = document.createElement('div');
        midLabel.textContent = 'Density ↓';
        midLabel.style.position = 'absolute';
        midLabel.style.top = '0';
        midLabel.style.left = '5px';
        midLabel.style.fontSize = '0.7rem';
        midLabel.style.color = '#ff4d4d';

        chartContainer.style.position = 'relative';
        chartContainer.appendChild(startLabel);
        chartContainer.appendChild(endLabel);
        chartContainer.appendChild(midLabel);
    }
});

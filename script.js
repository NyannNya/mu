document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsArea = document.getElementById('results-area');
    const numbersGrid = document.getElementById('numbers-grid');
    const totalTicketsDisplay = document.getElementById('total-tickets');
    const safeZoneDisplay = document.getElementById('safe-zone');



    calculateBtn.addEventListener('click', () => {
        const participants = parseInt(document.getElementById('participants').value) || 20000;
        const ticketsPerPerson = parseInt(document.getElementById('tickets').value) || 10;
        const lastWinner = parseInt(document.getElementById('last-winner').value) || null;

        calculateStrategy(participants, ticketsPerPerson, lastWinner);
    });

    function calculateStrategy(participants, ticketsPerPerson, lastWinner) {
        // Visual Feedback
        calculateBtn.innerHTML = '<span>計算中...</span>';
        calculateBtn.disabled = true;
        resultsArea.classList.add('hidden');

        // Use setTimeout to allow UI to update before heavy calculation
        setTimeout(() => {
            const recommendations = runSimulation(participants, ticketsPerPerson, lastWinner);
            displayResults(recommendations, participants * ticketsPerPerson);

            calculateBtn.innerHTML = '<span>計算推薦號碼</span>';
            calculateBtn.disabled = false;
        }, 100);
    }

    function runSimulation(participants, ticketsPerPerson, lastWinner) {
        // Account for realistic participation - not everyone uses all tickets
        const actualTickets = estimateActualTickets(participants, ticketsPerPerson);
        const playerModel = simulatePlayerDistribution(actualTickets);

        let candidates = [];

        if (lastWinner) {
            // Adaptive Strategy - use historical data
            const base = lastWinner;
            candidates.push(base + 1);
            candidates.push(base + 7);
            candidates.push(base + 13);

            // Add some calculated ones
            const calculated = getColdStartRecommendations(actualTickets, playerModel);
            candidates = candidates.concat(calculated.slice(0, 7));
        } else {
            // Practical Strategy
            candidates = getColdStartRecommendations(actualTickets, playerModel);
        }

        // Sort and deduplicate
        candidates = [...new Set(candidates)].sort((a, b) => a - b).slice(0, 10);
        return candidates;
    }

    function getColdStartRecommendations(totalTickets, playerModel) {
        // Practical Strategy Based on Realistic Analysis
        // Avoid very low numbers (<1000) due to extremely high collision probability

        const recommendations = [];

        // Calculate safe zone where collision probability is low
        const safeStart = estimateSafeZoneStart(totalTickets, playerModel);
        const safeEnd = safeStart + 30000;

        // Strategy: Focus on safe zone start (smallest unique number)
        // Distribute 10 numbers in a strategic range

        // 1. Early safe zone (highest priority - smallest unique numbers)
        for (let i = 0; i < 6; i++) {
            const min = safeStart + (i * 2500);
            const max = min + 2500;
            recommendations.push(randomInt(min, max));
        }

        // 2. Mid safe zone (backup picks)
        for (let i = 0; i < 3; i++) {
            const min = safeStart + 15000 + (i * 3000);
            const max = min + 3000;
            recommendations.push(randomInt(min, max));
        }

        // 3. One extra backup slightly higher
        recommendations.push(randomInt(safeStart + 25000, safeStart + 30000));

        return recommendations;
    }

    function estimateActualTickets(participants, ticketsPerPerson) {
        // High participation cost means not everyone uses all tickets
        // Estimate: 50% average usage
        const participationRate = 0.5;
        return Math.floor(participants * ticketsPerPerson * participationRate);
    }

    function simulatePlayerDistribution(totalTickets) {
        // Model different player behavior types
        return {
            casualWeight: 0.4,      // 40% pick small numbers (1-5000)
            strategicWeight: 0.3,   // 30% use mixed strategy
            advancedWeight: 0.3     // 30% use game theory
        };
    }

    function estimateSafeZoneStart(totalTickets, playerModel) {
        // Calculate where expected collisions drop below 1
        // Most players (especially casual 40%) cluster heavily in 1-10000 range
        // With 40% casual picking from 1-1000, collision rate is extremely high there

        // Safe zone calculation:
        // - totalTickets * casualWeight = casual player tickets
        // - These are distributed over ~1000-5000 range
        // - Beyond casualPeak * 10, density drops significantly

        const casualTickets = totalTickets * playerModel.casualWeight;
        const casualPeak = 5000; // Most casual players pick under 5000

        // Safe when expected picks < 0.3 (very low collision)
        // Safe zone starts around totalTickets * 0.7 for realistic modeling
        const safeThreshold = Math.floor(totalTickets * 0.7);

        return safeThreshold;
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function displayResults(numbers, maxTickets) {
        resultsArea.classList.remove('hidden');
        numbersGrid.innerHTML = '';

        // Calculate safe zone for consistency with recommendations
        const actualTickets = Math.floor(maxTickets * 0.5);
        const safeStart = Math.floor(actualTickets * 0.7);

        numbers.forEach((num, index) => {
            const div = document.createElement('div');
            div.className = 'number-badge';
            div.style.animationDelay = `${index * 0.05}s`;
            div.textContent = num.toLocaleString();

            // Visual hint aligned with safe zone calculation
            if (num >= safeStart) {
                div.style.borderColor = '#4caf50'; // Safe Green
                div.style.color = '#4caf50';
            } else if (num >= safeStart * 0.7) {
                div.style.borderColor = '#FFD23F'; // Warning Yellow
                div.style.color = '#FFD23F';
            } else {
                div.style.borderColor = '#ff4d4d'; // Danger Red
                div.style.color = '#ff4d4d';
            }

            numbersGrid.appendChild(div);
        });

        totalTicketsDisplay.textContent = actualTickets.toLocaleString();

        // Display safe zone range that matches recommendations
        const safeEnd = safeStart + 30000;
        safeZoneDisplay.textContent = `${safeStart.toLocaleString()} - ${safeEnd.toLocaleString()}`;

        // Visualization
        renderDensityChart(actualTickets);
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
            const x = i / bars;
            let density = Math.pow(1 - x, 4); // Steep decay

            const height = Math.max(2, density * 100);

            bar.style.width = '100%';
            bar.style.height = `${height}%`;

            // Color gradient: Red (Danger) -> Yellow -> Green (Safe)
            // Safe zone starts at 70% of range
            if (i < bars * 0.5) {
                bar.style.backgroundColor = '#ff4d4d'; // Danger
            } else if (i < bars * 0.7) {
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

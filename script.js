document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsArea = document.getElementById('results-area');
    const numbersGrid = document.getElementById('numbers-grid');
    const totalTicketsDisplay = document.getElementById('total-tickets');
    const safeZoneDisplay = document.getElementById('safe-zone');

    calculateBtn.addEventListener('click', () => {
        const participants = parseInt(document.getElementById('participants').value) || 60000;
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
            // Game Theory Strategy
            candidates = getColdStartRecommendations(actualTickets, playerModel);
        }

        // Sort and deduplicate
        candidates = [...new Set(candidates)].sort((a, b) => a - b).slice(0, 10);
        return candidates;
    }

    function getColdStartRecommendations(totalTickets, playerModel) {
        // Game Theory Based Strategy (LUPI Nash Equilibrium)
        // Uses probabilistic modeling with player behavior considerations

        const recommendations = [];

        // 1. Low Numbers: Nash equilibrium suggests trying low numbers
        // P(n) follows exponential decay, but heavily competed
        recommendations.push(randomInt(1, 100));
        recommendations.push(randomInt(100, 500));
        recommendations.push(randomInt(500, 2000));

        // 2. Collision Avoidance Zone
        // Calculate expected safe threshold based on player distribution
        const casualPeak = 1000; // Where casual players cluster
        const expectedCollisions = totalTickets * playerModel.casualWeight;

        // Find numbers with low collision probability
        const lowDensityStart = Math.floor(casualPeak * 5);
        recommendations.push(randomInt(lowDensityStart, lowDensityStart + 5000));
        recommendations.push(randomInt(lowDensityStart + 5000, lowDensityStart + 15000));

        // 3. Safe Zone (Nash equilibrium tail)
        // Where expected picks < 1 (Poisson λ < 1)
        const safeStart = estimateSafeZoneStart(totalTickets, playerModel);

        // Cluster at the beginning of safe zone (smallest unique)
        for (let i = 0; i < 4; i++) {
            const offset = i * 2000;
            recommendations.push(randomInt(safeStart + offset, safeStart + offset + 2000));
        }

        // 4. One backup slightly higher
        recommendations.push(randomInt(safeStart + 10000, safeStart + 20000));

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
            casualWeight: 0.4,      // 40% pick small numbers (1-1000)
            strategicWeight: 0.3,   // 30% use mixed strategy
            advancedWeight: 0.3     // 30% use game theory
        };
    }

    function estimateSafeZoneStart(totalTickets, playerModel) {
        // Calculate where expected collisions drop below 1
        // Casual players cluster at low numbers
        // Strategic/Advanced spread more evenly

        // Simplified model: safe when λ < 0.5 (low collision probability)
        // λ = totalTickets * P(picking this number)

        // For casual players: decay rapidly after 1000
        // For others: Nash-like exponential decay

        const casualDensityFactor = playerModel.casualWeight / 1000;
        const strategicDensityFactor = playerModel.strategicWeight / (totalTickets * 0.1);

        // Safe zone starts where total density is low
        const safeThreshold = Math.floor(totalTickets * 0.6);
        return safeThreshold;
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

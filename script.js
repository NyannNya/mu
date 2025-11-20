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
            // Balanced Risk/Reward Strategy
            candidates = getColdStartRecommendations(actualTickets, playerModel);
        }

        // Sort and deduplicate
        candidates = [...new Set(candidates)].sort((a, b) => a - b).slice(0, 10);
        return candidates;
    }

    function getColdStartRecommendations(totalTickets, playerModel) {
        // Balanced Risk/Reward Strategy
        // Mix of aggressive, moderate, and safe picks to maximize win probability

        const recommendations = [];

        const safeStart = estimateSafeZoneStart(totalTickets, playerModel);

        // === TIER 1: 高風險高回報 (3 picks) ===
        // Lower numbers with collision risk but huge upside if unique
        // Range: 15%-35% of safe zone start
        const aggressiveMin = Math.floor(safeStart * 0.15);
        const aggressiveMax = Math.floor(safeStart * 0.35);

        recommendations.push(randomInt(aggressiveMin, aggressiveMin + 3000));
        recommendations.push(randomInt(aggressiveMin + 5000, aggressiveMin + 8000));
        recommendations.push(randomInt(aggressiveMax - 5000, aggressiveMax));

        // === TIER 2: 中等風險 (3 picks) ===
        // Medium range - balance between risk and safety
        // Range: 50%-65% of safe zone start
        const mediumMin = Math.floor(safeStart * 0.5);
        const mediumMax = Math.floor(safeStart * 0.65);

        recommendations.push(randomInt(mediumMin, mediumMin + 3000));
        recommendations.push(randomInt(mediumMin + 4000, mediumMin + 7000));
        recommendations.push(randomInt(mediumMax - 3000, mediumMax));

        // === TIER 3: 安全保守 (4 picks) ===
        // Safe zone - cluster at the start for "smallest unique"
        recommendations.push(randomInt(safeStart, safeStart + 2500));
        recommendations.push(randomInt(safeStart + 2500, safeStart + 5000));
        recommendations.push(randomInt(safeStart + 5000, safeStart + 10000));
        recommendations.push(randomInt(safeStart + 15000, safeStart + 25000));

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

        // Calculate zones for risk tier classification
        const actualTickets = Math.floor(maxTickets * 0.5);
        const safeStart = Math.floor(actualTickets * 0.7);

        const aggressiveMax = Math.floor(safeStart * 0.35);
        const mediumMax = Math.floor(safeStart * 0.65);

        numbers.forEach((num, index) => {
            const div = document.createElement('div');
            div.className = 'number-badge';
            div.style.animationDelay = `${index * 0.05}s`;
            div.textContent = num.toLocaleString();

            // Risk tier color coding
            if (num >= safeStart) {
                // Safe tier (green)
                div.style.borderColor = '#4caf50';
                div.style.color = '#4caf50';
            } else if (num >= mediumMax) {
                // Medium risk tier (yellow)
                div.style.borderColor = '#FFD23F';
                div.style.color = '#FFD23F';
            } else {
                // Aggressive tier (red)
                div.style.borderColor = '#ff4d4d';
                div.style.color = '#ff4d4d';
            }

            numbersGrid.appendChild(div);
        });

        totalTicketsDisplay.textContent = actualTickets.toLocaleString();

        // Display recommendation range (from aggressive to safe upper bound)
        const aggressiveMin = Math.floor(safeStart * 0.15);
        const safeEnd = safeStart + 25000;
        safeZoneDisplay.textContent = `${aggressiveMin.toLocaleString()} - ${safeEnd.toLocaleString()}`;

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

            // Color gradient: Red (Aggressive) -> Yellow (Medium) -> Green (Safe)
            if (i < bars * 0.35) {
                bar.style.backgroundColor = '#ff4d4d'; // Aggressive
            } else if (i < bars * 0.65) {
                bar.style.backgroundColor = '#FFD23F'; // Medium
            } else {
                bar.style.backgroundColor = '#4caf50'; // Safe
            }

            bar.style.borderRadius = '2px 2px 0 0';
            bar.style.opacity = '0.9';

            chartContainer.appendChild(bar);
        }

        // Labels
        const startLabel = document.createElement('div');
        startLabel.textContent = '高風險';
        startLabel.style.position = 'absolute';
        startLabel.style.bottom = '0';
        startLabel.style.left = '0';
        startLabel.style.fontSize = '0.7rem';
        startLabel.style.color = '#ff4d4d';

        const endLabel = document.createElement('div');
        endLabel.textContent = '安全區';
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
        midLabel.style.color = '#666';

        chartContainer.style.position = 'relative';
        chartContainer.appendChild(startLabel);
        chartContainer.appendChild(endLabel);
        chartContainer.appendChild(midLabel);
    }
});

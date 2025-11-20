document.addEventListener('DOMContentLoaded', () => {
    const calculate Btn = document.getElementById('calculate-btn');
    const resultsArea = document.getElementById('results-area');
    const numbersGrid = document.getElementById('numbers-grid');
    const totalTicketsDisplay = document.getElementById('total-tickets');
    const safeZoneDisplay = document.getElementById('safe-zone');

    calculateBtn.addEventListener('click', () => {
        const participants = parseInt(document.getElementById('participants').value) || 20000;
        const ticketsPerPerson = parseInt(document.getElementById('tickets').value) || 10;
        const strategyMode = document.getElementById('strategy-mode').value;
        const lastWinner = parseInt(document.getElementById('last-winner').value) || null;

        calculateStrategy(participants, ticketsPerPerson, strategyMode, lastWinner);
    });

    function calculateStrategy(participants, ticketsPerPerson, strategyMode, lastWinner) {
        calculate Btn.innerHTML = '<span>計算中...</span>';
        calculateBtn.disabled = true;
        resultsArea.classList.add('hidden');

        setTimeout(() => {
            const recommendations = runSimulation(participants, ticketsPerPerson, strategyMode, lastWinner);
            displayResults(recommendations, participants * ticketsPerPerson);

            calculateBtn.innerHTML = '<span>計算推薦號碼</span>';
            calculateBtn.disabled = false;
        }, 100);
    }

    function runSimulation(participants, ticketsPerPerson, strategyMode, lastWinner) {
        const actualTickets = estimateActualTickets(participants, ticketsPerPerson);
        const playerModel = simulatePlayerDistribution(actualTickets);

        let candidates = [];

        if (lastWinner) {
            const base = lastWinner;
            candidates.push(base + 1);
            candidates.push(base + 7);
            candidates.push(base + 13);

            const calculated = getColdStartRecommendations(actualTickets, playerModel, strategyMode);
            candidates = candidates.concat(calculated.slice(0, 7));
        } else {
            candidates = getColdStartRecommendations(actualTickets, playerModel, strategyMode);
        }

        candidates = [...new Set(candidates)].sort((a, b) => a - b).slice(0, 10);
        return candidates;
    }

    function getColdStartRecommendations(totalTickets, playerModel, strategyMode) {
        const recommendations = [];
        const safeStart = estimateSafeZoneStart(totalTickets, playerModel);

        if (strategyMode === 'conservative') {
            // 保守策略：全部集中在安全區
            for (let i = 0; i < 10; i++) {
                const min = safeStart + (i * 3000);
                const max = min + 3000;
                recommendations.push(randomInt(min, max));
            }

        } else if (strategyMode === 'aggressive') {
            // 激進策略：重押低數字
            const aggressiveMin = Math.floor(safeStart * 0.10);
            const aggressiveMax = Math.floor(safeStart * 0.40);

            for (let i = 0; i < 5; i++) {
                const min = aggressiveMin + (i * 5000);
                const max = min + 4000;
                recommendations.push(randomInt(min, max));
            }

            const mediumMin = Math.floor(safeStart * 0.45);
            const mediumMax = Math.floor(safeStart * 0.65);

            recommendations.push(randomInt(mediumMin, mediumMin + 4000));
            recommendations.push(randomInt(mediumMin + 5000, mediumMin + 9000));
            recommendations.push(randomInt(mediumMax - 4000, mediumMax));

            recommendations.push(randomInt(safeStart, safeStart + 5000));
            recommendations.push(randomInt(safeStart + 5000, safeStart + 10000));

        } else {
            // 平衡策略 (default)
            const aggressiveMin = Math.floor(safeStart * 0.15);
            const aggressiveMax = Math.floor(safeStart * 0.35);

            recommendations.push(randomInt(aggressiveMin, aggressiveMin + 3000));
            recommendations.push(randomInt(aggressiveMin + 5000, aggressiveMin + 8000));
            recommendations.push(randomInt(aggressiveMax - 5000, aggressiveMax));

            const mediumMin = Math.floor(safeStart * 0.5);
            const mediumMax = Math.floor(safeStart * 0.65);

            recommendations.push(randomInt(mediumMin, mediumMin + 3000));
            recommendations.push(randomInt(mediumMin + 4000, mediumMin + 7000));
            recommendations.push(randomInt(mediumMax - 3000, mediumMax));

            recommendations.push(randomInt(safeStart, safeStart + 2500));
            recommendations.push(randomInt(safeStart + 2500, safeStart + 5000));
            recommendations.push(randomInt(safeStart + 5000, safeStart + 10000));
            recommendations.push(randomInt(safeStart + 15000, safeStart + 25000));
        }

        return recommendations;
    }

    function estimateActualTickets(participants, ticketsPerPerson) {
        const participationRate = 0.5;
        return Math.floor(participants * ticketsPerPerson * participationRate);
    }

    function simulatePlayerDistribution(totalTickets) {
        return {
            casualWeight: 0.4,
            strategicWeight: 0.3,
            advancedWeight: 0.3
        };
    }

    function estimateSafeZoneStart(totalTickets, playerModel) {
        const safeThreshold = Math.floor(totalTickets * 0.7);
        return safeThreshold;
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function displayResults(numbers, maxTickets) {
        resultsArea.classList.remove('hidden');
        numbersGrid.innerHTML = '';

        const actualTickets = Math.floor(maxTickets * 0.5);
        const safeStart = Math.floor(actualTickets * 0.7);

        const aggressiveMax = Math.floor(safeStart * 0.35);
        const mediumMax = Math.floor(safeStart * 0.65);

        numbers.forEach((num, index) => {
            const div = document.createElement('div');
            div.className = 'number-badge';
            div.style.animationDelay = `${index * 0.05}s`;
            div.textContent = num.toLocaleString();

            if (num >= safeStart) {
                div.style.borderColor = '#4caf50';
                div.style.color = '#4caf50';
            } else if (num >= mediumMax) {
                div.style.borderColor = '#FFD23F';
                div.style.color = '#FFD23F';
            } else {
                div.style.borderColor = '#ff4d4d';
                div.style.color = '#ff4d4d';
            }

            numbersGrid.appendChild(div);
        });

        totalTicketsDisplay.textContent = actualTickets.toLocaleString();

        const aggressiveMin = Math.floor(safeStart * 0.15);
        const safeEnd = safeStart + 25000;
        safeZoneDisplay.textContent = `${aggressiveMin.toLocaleString()} - ${safeEnd.toLocaleString()}`;

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

        const bars = 40;
        for (let i = 0; i < bars; i++) {
            const bar = document.createElement('div');

            const x = i / bars;
            let density = Math.pow(1 - x, 4);

            const height = Math.max(2, density * 100);

            bar.style.width = '100%';
            bar.style.height = `${height}%`;

            if (i < bars * 0.35) {
                bar.style.backgroundColor = '#ff4d4d';
            } else if (i < bars * 0.65) {
                bar.style.backgroundColor = '#FFD23F';
            } else {
                bar.style.backgroundColor = '#4caf50';
            }

            bar.style.borderRadius = '2px 2px 0 0';
            bar.style.opacity = '0.9';

            chartContainer.appendChild(bar);
        }

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

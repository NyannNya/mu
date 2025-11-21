document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsArea = document.getElementById('results-area');
    const numbersGrid = document.getElementById('numbers-grid');
    const totalTicketsDisplay = document.getElementById('total-tickets');
    const safeZoneDisplay = document.getElementById('safe-zone');

    calculateBtn.addEventListener('click', () => {
        const participants = parseInt(document.getElementById('participants').value) || 20000;
        const ticketsPerPerson = parseInt(document.getElementById('tickets').value) || 10;
        const strategyMode = document.getElementById('strategy-mode').value;
        const winnerCount = parseInt(document.getElementById('winner-count').value) || 30;
        const lastWinner = parseInt(document.getElementById('last-winner').value) || null;

        calculateStrategy(participants, ticketsPerPerson, strategyMode, winnerCount, lastWinner);
    });

    function calculateStrategy(participants, ticketsPerPerson, strategyMode, winnerCount, lastWinner) {
        calculateBtn.innerHTML = '<span>計算中...</span>';
        calculateBtn.disabled = true;
        resultsArea.classList.add('hidden');

        setTimeout(() => {
            const recommendations = runSimulation(participants, ticketsPerPerson, strategyMode, winnerCount, lastWinner);
            displayResults(recommendations, participants * ticketsPerPerson, winnerCount);

            calculateBtn.innerHTML = '<span>計算推薦號碼</span>';
            calculateBtn.disabled = false;
        }, 100);
    }

    function runSimulation(participants, ticketsPerPerson, strategyMode, winnerCount, lastWinner) {
        const actualTickets = estimateActualTickets(participants, ticketsPerPerson);
        const playerModel = simulatePlayerDistribution(actualTickets);

        let candidates = [];

        if (lastWinner) {
            const base = lastWinner;
            candidates.push(base + 1);
            candidates.push(base + 7);
            candidates.push(base + 13);

            const calculated = getColdStartRecommendations(actualTickets, playerModel, strategyMode, winnerCount);
            candidates = candidates.concat(calculated.slice(0, 7));
        } else {
            candidates = getColdStartRecommendations(actualTickets, playerModel, strategyMode, winnerCount);
        }

        candidates = [...new Set(candidates)].sort((a, b) => a - b).slice(0, 10);
        return candidates;
    }

    function getColdStartRecommendations(totalTickets, playerModel, strategyMode, winnerCount) {
        const recommendations = [];

        // Based on real data: 30 winners = 116-328, 3 winners would be even lower
        // For 30 winners: most numbers fall in 100-350 range
        // For 3 winners: assume 50-250 range (more competitive)

        if (winnerCount === 30) {
            // 30人中獎模式：根據真實數據 116-328
            const baseMin = 100;
            const baseMax = 350;

            if (strategyMode === 'conservative') {
                // 保守策略：集中在200-350（較高安全區）
                for (let i = 0; i < 10; i++) {
                    const min = 200 + (i * 15);
                    const max = min + 20;
                    recommendations.push(randomInt(min, max));
                }

            } else if (strategyMode === 'aggressive') {
                // 激進策略：重押低數字 100-200
                for (let i = 0; i < 6; i++) {
                    const min = 100 + (i * 15);
                    const max = min + 20;
                    recommendations.push(randomInt(min, max));
                }
                recommendations.push(randomInt(220, 250));
                recommendations.push(randomInt(250, 280));
                recommendations.push(randomInt(280, 310));
                recommendations.push(randomInt(310, 340));

            } else {
                // 平衡策略：覆蓋 120-330 (符合真實數據)
                recommendations.push(randomInt(115, 135));  // 對應真實 116
                recommendations.push(randomInt(160, 180));  // 對應真實 166-180
                recommendations.push(randomInt(190, 210));  // 對應真實 195-209
                recommendations.push(randomInt(215, 230));  // 對應真實 216-226
                recommendations.push(randomInt(240, 255));  // 對應真實 240-252
                recommendations.push(randomInt(260, 275));  // 對應真實 264-275
                recommendations.push(randomInt(280, 295));  // 對應真實 284-297
                recommendations.push(randomInt(295, 310));  // 對應真實 298-302
                recommendations.push(randomInt(310, 325));  // 對應真實 318
                recommendations.push(randomInt(325, 340));  // 對應真實 328 附近
            }

        } else {
            // 3人中獎模式：競爭更激烈，號碼更小
            const baseMin = 50;
            const baseMax = 250;

            if (strategyMode === 'conservative') {
                // 保守策略：集中在150-250
                for (let i = 0; i < 10; i++) {
                    const min = 150 + (i * 10);
                    const max = min + 15;
                    recommendations.push(randomInt(min, max));
                }

            } else if (strategyMode === 'aggressive') {
                // 激進策略：重押極低數字 50-120
                for (let i = 0; i < 7; i++) {
                    const min = 50 + (i * 10);
                    const max = min + 12;
                    recommendations.push(randomInt(min, max));
                }
                recommendations.push(randomInt(130, 150));
                recommendations.push(randomInt(160, 180));
                recommendations.push(randomInt(190, 210));

            } else {
                // 平衡策略：覆蓋 80-220
                recommendations.push(randomInt(75, 90));
                recommendations.push(randomInt(95, 110));
                recommendations.push(randomInt(115, 130));
                recommendations.push(randomInt(135, 150));
                recommendations.push(randomInt(155, 170));
                recommendations.push(randomInt(175, 190));
                recommendations.push(randomInt(195, 210));
                recommendations.push(randomInt(215, 230));
                recommendations.push(randomInt(235, 250));
                recommendations.push(randomInt(255, 270));
            }
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

    function randomInt(min, max) {
        min = Math.max(1, Math.floor(min));
        max = Math.max(1, Math.floor(max));

        if (min > max) {
            [min, max] = [max, min];
        }

        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function displayResults(numbers, maxTickets, winnerCount) {
        resultsArea.classList.remove('hidden');
        numbersGrid.innerHTML = '';

        const actualTickets = Math.floor(maxTickets * 0.5);

        // Color thresholds based on winner count
        let lowThreshold, mediumThreshold;
        if (winnerCount === 30) {
            lowThreshold = 180;    // Red: < 180
            mediumThreshold = 260; // Yellow: 180-260, Green: > 260
        } else {
            lowThreshold = 120;    // Red: < 120
            mediumThreshold = 180; // Yellow: 120-180, Green: > 180
        }

        numbers.forEach((num, index) => {
            const div = document.createElement('div');
            div.className = 'number-badge';
            div.style.animationDelay = `${index * 0.05}s`;
            div.textContent = num.toLocaleString();

            if (num >= mediumThreshold) {
                div.style.borderColor = '#4caf50';
                div.style.color = '#4caf50';
            } else if (num >= lowThreshold) {
                div.style.borderColor = '#FFD23F';
                div.style.color = '#FFD23F';
            } else {
                div.style.borderColor = '#ff4d4d';
                div.style.color = '#ff4d4d';
            }

            numbersGrid.appendChild(div);
        });

        totalTicketsDisplay.textContent = actualTickets.toLocaleString();

        const minNum = Math.min(...numbers);
        const maxNum = Math.max(...numbers);
        safeZoneDisplay.textContent = `${minNum.toLocaleString()} - ${maxNum.toLocaleString()}`;

        renderDensityChart(winnerCount);
    }

    function renderDensityChart(winnerCount) {
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

        const modeLabel = document.createElement('div');
        modeLabel.textContent = winnerCount === 30 ? 'Top 30 模式' : 'Top 3 模式';
        modeLabel.style.position = 'absolute';
        modeLabel.style.top = '0';
        modeLabel.style.left = '5px';
        modeLabel.style.fontSize = '0.7rem';
        modeLabel.style.color = '#666';

        chartContainer.style.position = 'relative';
        chartContainer.appendChild(startLabel);
        chartContainer.appendChild(endLabel);
        chartContainer.appendChild(modeLabel);
    }
});

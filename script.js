document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsArea = document.getElementById('results-area');
    const numbersGrid = document.getElementById('numbers-grid');
    const totalTicketsDisplay = document.getElementById('total-tickets');
    const safeZoneDisplay = document.getElementById('safe-zone');

    calculateBtn.addEventListener('click', () => {
        const strategyMode = document.getElementById('strategy-mode').value;
        const winnerCount = parseInt(document.getElementById('winner-count').value) || 30;
        const lastWinner = parseInt(document.getElementById('last-winner').value) || null;

        calculateStrategy(strategyMode, winnerCount, lastWinner);
    });

    function calculateStrategy(strategyMode, winnerCount, lastWinner) {
        calculateBtn.innerHTML = '<span>計算中...</span>';
        calculateBtn.disabled = true;
        resultsArea.classList.add('hidden');

        setTimeout(() => {
            const recommendations = runSimulation(strategyMode, winnerCount, lastWinner);
            displayResults(recommendations, winnerCount, strategyMode, lastWinner);

            calculateBtn.innerHTML = '<span>計算推薦號碼</span>';
            calculateBtn.disabled = false;
        }, 100);
    }

    function runSimulation(strategyMode, winnerCount, lastWinner) {
        let candidates = [];

        if (lastWinner) {
            const base = lastWinner;
            candidates.push(Math.max(1, base - 3));
            candidates.push(base + 1);
            candidates.push(base + 8);
            candidates.push(base + 16);

            const calculated = getColdStartRecommendations(strategyMode, winnerCount, lastWinner);
            candidates = candidates.concat(calculated.slice(0, 6));
        } else {
            candidates = getColdStartRecommendations(strategyMode, winnerCount, null);
        }

        candidates = [...new Set(candidates)].sort((a, b) => a - b).slice(0, 10);
        return candidates;
    }

    function getColdStartRecommendations(strategyMode, winnerCount, lastWinner) {
        const recommendations = [];

        // 根據歷史數據動態調整
        let baseShift = 0;
        if (lastWinner) {
            if (lastWinner < 100) {
                baseShift = -20;
            } else if (lastWinner > 250) {
                baseShift = 20;
            }
        }

        if (winnerCount === 30) {
            if (strategyMode === 'pyramid') {
                // 第1層：超激進（2個）
                let num1 = randomInt(50 + baseShift, 70 + baseShift);
                recommendations.push(num1);
                recommendations.push(num1 + randomInt(10, 15));

                // 第2層：激進（2個）
                let num2 = randomInt(100 + baseShift, 130 + baseShift);
                recommendations.push(num2);
                recommendations.push(num2 + randomInt(8, 12));

                // 第3層：平衡（3個）
                let num3 = randomInt(160 + baseShift, 180 + baseShift);
                recommendations.push(num3);
                recommendations.push(num3 + randomInt(9, 12));
                recommendations.push(num3 + randomInt(18, 24));

                // 第4層：保守（2個）
                let num4 = randomInt(240 + baseShift, 270 + baseShift);
                recommendations.push(num4);
                recommendations.push(num4 + randomInt(10, 15));

                // 第5層：超保守（1個）
                recommendations.push(randomInt(320 + baseShift, 380 + baseShift));

            } else if (strategyMode === 'conservative') {
                let base = randomInt(220 + baseShift, 250 + baseShift);
                for (let i = 0; i < 10; i++) {
                    recommendations.push(base + (i * randomInt(10, 15)));
                }

            } else if (strategyMode === 'aggressive') {
                let base = randomInt(70 + baseShift, 100 + baseShift);
                for (let i = 0; i < 8; i++) {
                    recommendations.push(base + (i * randomInt(8, 12)));
                }
                recommendations.push(randomInt(200 + baseShift, 230 + baseShift));
                recommendations.push(randomInt(280 + baseShift, 320 + baseShift));
            }

        } else {
            // 3人中獎模式
            if (strategyMode === 'pyramid') {
                let num1 = randomInt(30 + baseShift, 45 + baseShift);
                recommendations.push(num1);
                recommendations.push(num1 + randomInt(8, 12));

                let num2 = randomInt(60 + baseShift, 80 + baseShift);
                recommendations.push(num2);
                recommendations.push(num2 + randomInt(8, 12));

                let num3 = randomInt(100 + baseShift, 120 + baseShift);
                recommendations.push(num3);
                recommendations.push(num3 + randomInt(9, 12));
                recommendations.push(num3 + randomInt(18, 24));

                let num4 = randomInt(150 + baseShift, 170 + baseShift);
                recommendations.push(num4);
                recommendations.push(num4 + randomInt(10, 15));

                recommendations.push(randomInt(210 + baseShift, 250 + baseShift));

            } else if (strategyMode === 'conservative') {
                let base = randomInt(130 + baseShift, 160 + baseShift);
                for (let i = 0; i < 10; i++) {
                    recommendations.push(base + (i * randomInt(8, 12)));
                }

            } else if (strategyMode === 'aggressive') {
                let base = randomInt(35 + baseShift, 55 + baseShift);
                for (let i = 0; i < 8; i++) {
                    recommendations.push(base + (i * randomInt(7, 10)));
                }
                recommendations.push(randomInt(120 + baseShift, 150 + baseShift));
                recommendations.push(randomInt(170 + baseShift, 200 + baseShift));
            }
        }

        return recommendations;
    }

    function randomInt(min, max) {
        min = Math.max(1, Math.floor(min));
        max = Math.max(1, Math.floor(max));

        if (min > max) {
            [min, max] = [max, min];
        }

        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function displayResults(numbers, winnerCount, strategyMode, lastWinner) {
        resultsArea.classList.remove('hidden');
        numbersGrid.innerHTML = '';

        // 策略說明
        let strategyDesc = '';
        if (strategyMode === 'pyramid') {
            strategyDesc = '金字塔5層 | 間隔8-12';
        } else if (strategyMode === 'conservative') {
            strategyDesc = '保守穩健 | 安全區集中';
        } else {
            strategyDesc = '激進冒險 | 重押低數字';
        }

        // Color thresholds
        let lowThreshold, mediumThreshold;
        if (winnerCount === 30) {
            lowThreshold = 150;
            mediumThreshold = 240;
        } else {
            lowThreshold = 80;
            mediumThreshold = 130;
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

        totalTicketsDisplay.textContent = strategyDesc;

        const minNum = Math.min(...numbers);
        const maxNum = Math.max(...numbers);
        let rangeText = `${minNum.toLocaleString()} - ${maxNum.toLocaleString()}`;
        if (lastWinner) {
            rangeText += ` | 已調整(${lastWinner})`;
        }
        safeZoneDisplay.textContent = rangeText;

        renderDensityChart(winnerCount, strategyMode);
    }

    function renderDensityChart(winnerCount, strategyMode) {
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
        startLabel.textContent = strategyMode === 'pyramid' ? '激進層' : '高風險';
        startLabel.style.position = 'absolute';
        startLabel.style.bottom = '0';
        startLabel.style.left = '0';
        startLabel.style.fontSize = '0.7rem';
        startLabel.style.color = '#ff4d4d';

        const endLabel = document.createElement('div');
        endLabel.textContent = strategyMode === 'pyramid' ? '保守層' : '安全區';
        endLabel.style.position = 'absolute';
        endLabel.style.bottom = '0';
        endLabel.style.right = '0';
        endLabel.style.fontSize = '0.7rem';
        endLabel.style.color = '#4caf50';

        const modeLabel = document.createElement('div');
        const modeText = winnerCount === 30 ? 'Top 30' : 'Top 3';
        const stratText = strategyMode === 'pyramid' ? ' | 5層' : '';
        modeLabel.textContent = modeText + stratText;
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

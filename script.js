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
        let candidates = getColdStartRecommendations(strategyMode, winnerCount, lastWinner);
        candidates = [...new Set(candidates)].sort((a, b) => a - b).slice(0, 10);
        return candidates;
    }

    function getColdStartRecommendations(strategyMode, winnerCount, lastWinner) {
        const recommendations = [];

        // 🎲 基於賽局理論的參與人數估算模型
        if (lastWinner) {
            const base = lastWinner;

            // 定義4種情境（基於人數變化和策略轉移）
            let scenarios = [];

            if (strategyMode === 'pyramid') {
                // 金字塔：分散投注4種情境
                scenarios = [
                    { count: 2, min: 0.70, max: 0.90, weight: 0.15, name: '人數減少' },     // 人數↓20-30%
                    { count: 3, min: 0.90, max: 1.05, weight: 0.30, name: '人數不變' },     // 人數持平，策略不變
                    { count: 3, min: 1.05, max: 1.30, weight: 0.35, name: '轉向小數字' },   // 人數不變，但策略轉向小數字
                    { count: 2, min: 1.30, max: 1.55, weight: 0.20, name: '人數增加' }      // 人數↑30-55%
                ];

            } else if (strategyMode === 'conservative') {
                // 保守：只押「人數不變」和「人數增加」情境
                scenarios = [
                    { count: 5, min: 1.05, max: 1.25, weight: 0.50, name: '轉向小數字' },
                    { count: 5, min: 1.25, max: 1.50, weight: 0.50, name: '人數增加' }
                ];

            } else if (strategyMode === 'aggressive') {
                // 激進：賭人數減少或策略不變
                scenarios = [
                    { count: 4, min: 0.65, max: 0.90, weight: 0.40, name: '人數大減' },
                    { count: 4, min: 0.90, max: 1.10, weight: 0.40, name: '人數微變' },
                    { count: 2, min: 1.10, max: 1.35, weight: 0.20, name: '保險' }
                ];
            }

            // 生成推薦號碼（按情境分配）
            scenarios.forEach(scenario => {
                const spacing = (scenario.max - scenario.min) / scenario.count;
                for (let i = 0; i < scenario.count; i++) {
                    const subMin = scenario.min + (spacing * i);
                    const subMax = scenario.min + (spacing * (i + 1));
                    const multiplier = randomFloat(subMin, subMax);
                    recommendations.push(Math.floor(base * multiplier));
                }
            });

        } else {
            // 沒有歷史數據，使用預設範圍（基於真實數據 116-328）
            const baselineMin = winnerCount === 30 ? 116 : 58;
            const baselineMax = winnerCount === 30 ? 328 : 164;
            const range = baselineMax - baselineMin;

            if (strategyMode === 'pyramid') {
                // 均勻分布在整個範圍
                for (let i = 0; i < 10; i++) {
                    const pos = i / 9;
                    const rangeStart = range * pos;
                    const rangeEnd = range * Math.min(pos + 0.15, 1.1);
                    recommendations.push(baselineMin + randomInt(rangeStart, rangeEnd));
                }

            } else if (strategyMode === 'conservative') {
                // 集中在後60%
                const safeStart = baselineMin + range * 0.4;
                const safeRange = range * 0.7;
                for (let i = 0; i < 10; i++) {
                    const pos = i / 10;
                    recommendations.push(safeStart + randomInt(safeRange * pos, safeRange * Math.min(pos + 0.15, 1.0)));
                }

            } else if (strategyMode === 'aggressive') {
                // 集中在前50%
                const aggroRange = range * 0.5;
                for (let i = 0; i < 8; i++) {
                    const pos = i / 8;
                    recommendations.push(baselineMin + randomInt(aggroRange * pos, aggroRange * Math.min(pos + 0.15, 1.0)));
                }
                recommendations.push(baselineMin + randomInt(aggroRange * 0.8, aggroRange * 1.2));
                recommendations.push(baselineMin + randomInt(aggroRange * 1.3, aggroRange * 1.8));
            }
        }

        // 確保所有號碼 >= 1 且去重
        return [...new Set(recommendations.map(n => Math.max(1, Math.floor(n))))];
    }

    function randomFloat(min, max) {
        return min + Math.random() * (max - min);
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
            if (lastWinner) {
                strategyDesc = `情境模型 | 4種人數變化`;
            } else {
                strategyDesc = '金字塔 | 均勻分散';
            }
        } else if (strategyMode === 'conservative') {
            strategyDesc = '保守 | 只押增加情境';
        } else {
            strategyDesc = '激進 | 賭減少情境';
        }

        // 動態顏色閾值
        let lowThreshold, mediumThreshold;
        if (lastWinner) {
            lowThreshold = lastWinner * 0.95;
            mediumThreshold = lastWinner * 1.20;
        } else {
            if (winnerCount === 30) {
                lowThreshold = 150;
                mediumThreshold = 250;
            } else {
                lowThreshold = 90;
                mediumThreshold = 140;
            }
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
            const minRatio = ((minNum / lastWinner - 1) * 100).toFixed(0);
            const maxRatio = ((maxNum / lastWinner - 1) * 100).toFixed(0);
            rangeText += ` | ${minRatio}%~${maxRatio}%`;
        }
        safeZoneDisplay.textContent = rangeText;

        renderDensityChart(winnerCount, strategyMode, lastWinner);
    }

    function renderDensityChart(winnerCount, strategyMode, lastWinner) {
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

            if (i < bars * 0.25) {
                bar.style.backgroundColor = '#ff4d4d';
            } else if (i < bars * 0.50) {
                bar.style.backgroundColor = '#FFD23F';
            } else {
                bar.style.backgroundColor = '#4caf50';
            }

            bar.style.borderRadius = '2px 2px 0 0';
            bar.style.opacity = '0.9';

            chartContainer.appendChild(bar);
        }

        const startLabel = document.createElement('div');
        startLabel.textContent = lastWinner ? '人數↓' : '激進';
        startLabel.style.position = 'absolute';
        startLabel.style.bottom = '0';
        startLabel.style.left = '0';
        startLabel.style.fontSize = '0.7rem';
        startLabel.style.color = '#ff4d4d';

        const endLabel = document.createElement('div');
        endLabel.textContent = lastWinner ? '人數↑' : '保守';
        endLabel.style.position = 'absolute';
        endLabel.style.bottom = '0';
        endLabel.style.right = '0';
        endLabel.style.fontSize = '0.7rem';
        endLabel.style.color = '#4caf50';

        const modeLabel = document.createElement('div');
        const modeText = winnerCount === 30 ? 'Top 30' : 'Top 3';
        const stratText = strategyMode === 'pyramid' ? ' | 4情境' : '';
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

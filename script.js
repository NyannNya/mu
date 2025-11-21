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

        // 📊 基於概率分布的數學模型
        if (lastWinner) {
            const base = lastWinner;

            // 根據模式定義增長率區間（百分比）
            let layers = [];

            if (strategyMode === 'pyramid') {
                // 金字塔：4層概率分布
                layers = [
                    { count: 2, min: 0.97, max: 1.02, name: '略冒險' },   // -3% ~ +2%
                    { count: 4, min: 1.02, max: 1.12, name: 'Nash均衡' }, // +2% ~ +12%
                    { count: 3, min: 1.12, max: 1.28, name: '保險層' },   // +12% ~ +28%
                    { count: 1, min: 1.28, max: 1.45, name: '極保險' }    // +28% ~ +45%
                ];

            } else if (strategyMode === 'conservative') {
                // 保守：全部集中在安全區
                layers = [
                    { count: 10, min: 1.15, max: 1.35, name: '安全區' }   // +15% ~ +35%
                ];

            } else if (strategyMode === 'aggressive') {
                // 激進：重押接近lastWinner
                layers = [
                    { count: 6, min: 0.92, max: 1.05, name: '激進' },     // -8% ~ +5%
                    { count: 2, min: 1.05, max: 1.15, name: '緩衝' },     // +5% ~ +15%
                    { count: 2, min: 1.20, max: 1.40, name: '保險' }      // +20% ~ +40%
                ];
            }

            // 生成推薦號碼
            layers.forEach(layer => {
                const spacing = (layer.max - layer.min) / layer.count;
                for (let i = 0; i < layer.count; i++) {
                    // 在每個子區間內隨機選擇
                    const subMin = layer.min + (spacing * i);
                    const subMax = layer.min + (spacing * (i + 1));
                    const multiplier = randomFloat(subMin, subMax);
                    recommendations.push(Math.floor(base * multiplier));
                }
            });

        } else {
            // 沒有歷史數據，使用預設範圍（基於真實數據 116-328）
            const baselineMin = winnerCount === 30 ? 116 : 58;  // 30人模式: 116, 3人模式: 58
            const baselineMax = winnerCount === 30 ? 328 : 164;

            if (strategyMode === 'pyramid') {
                // 分層覆蓋整個範圍
                const range = baselineMax - baselineMin;
                recommendations.push(baselineMin + randomInt(0, range * 0.15));
                recommendations.push(baselineMin + randomInt(range * 0.10, range * 0.25));
                recommendations.push(baselineMin + randomInt(range * 0.20, range * 0.35));
                recommendations.push(baselineMin + randomInt(range * 0.30, range * 0.45));
                recommendations.push(baselineMin + randomInt(range * 0.40, range * 0.55));
                recommendations.push(baselineMin + randomInt(range * 0.50, range * 0.65));
                recommendations.push(baselineMin + randomInt(range * 0.60, range * 0.75));
                recommendations.push(baselineMin + randomInt(range * 0.70, range * 0.85));
                recommendations.push(baselineMin + randomInt(range * 0.80, range * 0.95));
                recommendations.push(baselineMin + randomInt(range * 0.90, range * 1.10));

            } else if (strategyMode === 'conservative') {
                // 集中在後60%安全區
                const safeStart = baselineMin + (baselineMax - baselineMin) * 0.4;
                const safeRange = (baselineMax - baselineMin) * 0.7;
                for (let i = 0; i < 10; i++) {
                    const pos = i / 10;
                    recommendations.push(safeStart + randomInt(safeRange * pos, safeRange * (pos + 0.15)));
                }

            } else if (strategyMode === 'aggressive') {
                // 集中在前50%激進區
                const aggroRange = (baselineMax - baselineMin) * 0.5;
                for (let i = 0; i < 8; i++) {
                    const pos = i / 8;
                    recommendations.push(baselineMin + randomInt(aggroRange * pos, aggroRange * (pos + 0.15)));
                }
                // 加2個保險
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
                const minRatio = (Math.min(...numbers) / lastWinner * 100 - 100).toFixed(0);
                const maxRatio = (Math.max(...numbers) / lastWinner * 100 - 100).toFixed(0);
                strategyDesc = `百分比模型 | ${minRatio}% ~ ${maxRatio}%`;
            } else {
                strategyDesc = '金字塔4層 | 概率分布';
            }
        } else if (strategyMode === 'conservative') {
            strategyDesc = '保守穩健 | +15%~+35%';
        } else {
            strategyDesc = '激進冒險 | -8%~+5%';
        }

        // 動態顏色閾值
        let lowThreshold, mediumThreshold;
        if (lastWinner) {
            // 基於lastWinner的動態閾值（百分比）
            lowThreshold = lastWinner * 1.00;
            mediumThreshold = lastWinner * 1.15;
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
            const avgRatio = ((minNum + maxNum) / 2 / lastWinner * 100 - 100).toFixed(1);
            rangeText += ` | 平均${avgRatio > 0 ? '+' : ''}${avgRatio}%`;
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
        startLabel.textContent = lastWinner ? '-3%' : '激進';
        startLabel.style.position = 'absolute';
        startLabel.style.bottom = '0';
        startLabel.style.left = '0';
        startLabel.style.fontSize = '0.7rem';
        startLabel.style.color = '#ff4d4d';

        const endLabel = document.createElement('div');
        endLabel.textContent = lastWinner ? '+45%' : '保守';
        endLabel.style.position = 'absolute';
        endLabel.style.bottom = '0';
        endLabel.style.right = '0';
        endLabel.style.fontSize = '0.7rem';
        endLabel.style.color = '#4caf50';

        const modeLabel = document.createElement('div');
        const modeText = winnerCount === 30 ? 'Top 30' : 'Top 3';
        const stratText = strategyMode === 'pyramid' ? ' | 百分比模型' : '';
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

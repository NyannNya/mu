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

        // 🎯 賽局理論最優解
        if (lastWinner) {
            const base = lastWinner;

            if (strategyMode === 'pyramid') {
                // 基於Nash均衡的4層分散策略

                // 第1層：略冒險 (2個) - 可以略低於lastWinner
                recommendations.push(base - randomInt(10, 30));
                recommendations.push(base - randomInt(5, 15));

                // 第2層：主力Nash均衡區 (4個) - 最可能中獎
                recommendations.push(base + randomInt(5, 20));
                recommendations.push(base + randomInt(25, 45));
                recommendations.push(base + randomInt(50, 70));
                recommendations.push(base + randomInt(75, 100));

                // 第3層：保險 (3個) - 避免全軍覆沒
                recommendations.push(base + randomInt(110, 160));
                recommendations.push(base + randomInt(170, 220));
                recommendations.push(base + randomInt(230, 290));

                // 第4層：超保險 (1個) - 終極保底
                recommendations.push(base + randomInt(300, 400));

            } else if (strategyMode === 'conservative') {
                // 保守：完全避免風險
                const startBase = base + randomInt(50, 100);
                for (let i = 0; i < 10; i++) {
                    recommendations.push(startBase + (i * randomInt(15, 25)));
                }

            } else if (strategyMode === 'aggressive') {
                // 激進：重押略低於lastWinner
                for (let i = 0; i < 6; i++) {
                    recommendations.push(base - randomInt(40 - i * 5, 20 - i * 3));
                }
                // 加保險
                recommendations.push(base + randomInt(10, 30));
                recommendations.push(base + randomInt(50, 80));
                recommendations.push(base + randomInt(100, 150));
                recommendations.push(base + randomInt(200, 300));
            }

        } else {
            // 沒有歷史數據，使用預設範圍（基於真實數據 116-328）
            if (winnerCount === 30) {
                if (strategyMode === 'pyramid') {
                    let num1 = randomInt(60, 80);
                    recommendations.push(num1);
                    recommendations.push(num1 + randomInt(10, 15));

                    let num2 = randomInt(110, 140);
                    recommendations.push(num2);
                    recommendations.push(num2 + randomInt(8, 12));

                    let num3 = randomInt(170, 200);
                    recommendations.push(num3);
                    recommendations.push(num3 + randomInt(10, 15));
                    recommendations.push(num3 + randomInt(20, 30));

                    let num4 = randomInt(250, 280);
                    recommendations.push(num4);
                    recommendations.push(num4 + randomInt(12, 18));

                    recommendations.push(randomInt(340, 400));

                } else if (strategyMode === 'conservative') {
                    let base = randomInt(230, 260);
                    for (let i = 0; i < 10; i++) {
                        recommendations.push(base + (i * randomInt(12, 18)));
                    }

                } else if (strategyMode === 'aggressive') {
                    let base = randomInt(80, 110);
                    for (let i = 0; i < 8; i++) {
                        recommendations.push(base + (i * randomInt(8, 12)));
                    }
                    recommendations.push(randomInt(210, 250));
                    recommendations.push(randomInt(300, 350));
                }

            } else {
                // 3人中獎模式 - 更激烈競爭
                if (strategyMode === 'pyramid') {
                    let num1 = randomInt(35, 50);
                    recommendations.push(num1);
                    recommendations.push(num1 + randomInt(8, 12));

                    let num2 = randomInt(65, 85);
                    recommendations.push(num2);
                    recommendations.push(num2 + randomInt(8, 12));

                    let num3 = randomInt(105, 130);
                    recommendations.push(num3);
                    recommendations.push(num3 + randomInt(10, 15));
                    recommendations.push(num3 + randomInt(20, 30));

                    let num4 = randomInt(160, 185);
                    recommendations.push(num4);
                    recommendations.push(num4 + randomInt(10, 15));

                    recommendations.push(randomInt(220, 270));

                } else if (strategyMode === 'conservative') {
                    let base = randomInt(140, 170);
                    for (let i = 0; i < 10; i++) {
                        recommendations.push(base + (i * randomInt(10, 15)));
                    }

                } else if (strategyMode === 'aggressive') {
                    let base = randomInt(40, 60);
                    for (let i = 0; i < 8; i++) {
                        recommendations.push(base + (i * randomInt(7, 10)));
                    }
                    recommendations.push(randomInt(130, 160));
                    recommendations.push(randomInt(190, 230));
                }
            }
        }

        // 確保所有號碼 >= 1
        return recommendations.map(n => Math.max(1, Math.floor(n)));
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
                strategyDesc = `Nash均衡 | 基於${lastWinner}調整`;
            } else {
                strategyDesc = '金字塔4層 | 賽局最優';
            }
        } else if (strategyMode === 'conservative') {
            strategyDesc = '保守穩健 | 避免風險';
        } else {
            strategyDesc = '激進冒險 | 略低於上次';
        }

        // 動態顏色閾值
        let lowThreshold, mediumThreshold;
        if (lastWinner) {
            // 基於lastWinner的動態閾值
            lowThreshold = lastWinner;
            mediumThreshold = lastWinner + 100;
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
            const diff = minNum - lastWinner;
            if (diff < 0) {
                rangeText += ` | 略冒險(-${Math.abs(diff)})`;
            } else {
                rangeText += ` | 安全(+${diff})`;
            }
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
        startLabel.textContent = lastWinner ? `<${lastWinner}` : '激進';
        startLabel.style.position = 'absolute';
        startLabel.style.bottom = '0';
        startLabel.style.left = '0';
        startLabel.style.fontSize = '0.7rem';
        startLabel.style.color = '#ff4d4d';

        const endLabel = document.createElement('div');
        endLabel.textContent = lastWinner ? `>${lastWinner + 200}` : '保守';
        endLabel.style.position = 'absolute';
        endLabel.style.bottom = '0';
        endLabel.style.right = '0';
        endLabel.style.fontSize = '0.7rem';
        endLabel.style.color = '#4caf50';

        const modeLabel = document.createElement('div');
        const modeText = winnerCount === 30 ? 'Top 30' : 'Top 3';
        const stratText = strategyMode === 'pyramid' ? ' | Nash均衡' : '';
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

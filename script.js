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

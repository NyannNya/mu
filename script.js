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
            // 根據上一輪調整策略
            const shift = Math.floor((lastWinner - 116) / 30); // 每30偏移調整一次

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
                        // 根據上一輪調整策略
                        const shift = Math.floor((lastWinner - 116) / 30); // 每30偏移調整一次

                        const base = lastWinner;
                        candidates.push(Math.max(1, base - 3));
                        candidates.push(base + 1);
                        div.textContent = num.toLocaleString();

                        if (num >= mediumThreshold) {
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
                                const stratText = strategyMode === 'pyramid' ? ' | 5層分散' : '';
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
        }
    });

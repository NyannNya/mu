document.addEventListener('DOMContentLoaded', () => {
    // ==================== ELEMENT REFERENCES ====================
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsArea = document.getElementById('results-area');
    const numbersGrid = document.getElementById('numbers-grid');
    const safeZoneDisplay = document.getElementById('safe-zone');

    // Historical Data Elements
    const historyRoundInput = document.getElementById('history-round');
    const historyMinInput = document.getElementById('history-min');
    const historyMaxInput = document.getElementById('history-max');
    const addHistoryBtn = document.getElementById('add-history-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const historyTableBody = document.getElementById('history-table-body');

    // Evaluation Dashboard Elements
    const trendDirection = document.getElementById('trend-direction');
    const trendDescription = document.getElementById('trend-description');
    const growthRate = document.getElementById('growth-rate');
    const predictedRange = document.getElementById('predicted-range');

    // Settings Elements
    const dynamicAdjustmentToggle = document.getElementById('dynamic-adjustment-toggle');
    const trendAggressiveness = document.getElementById('trend-aggressiveness');
    const aggressivenessValue = document.getElementById('aggressiveness-value');

    // Manual Input for Dashboard Integration
    const lastWinnerInput = document.getElementById('last-winner');

    // ==================== LOCALSTORAGE MANAGER ====================
    const STORAGE_KEY = 'maple-lucky-history';

    function loadHistoricalData() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    function saveHistoricalData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function addHistoricalRound(round, minWinner, maxWinner) {
        const history = loadHistoricalData();
        const newEntry = {
            round: parseInt(round),
            minWinner: parseInt(minWinner),
            maxWinner: parseInt(maxWinner),
            range: parseInt(maxWinner) - parseInt(minWinner),
            date: new Date().toISOString()
        };

        // Check if round already exists
        const existingIndex = history.findIndex(h => h.round === newEntry.round);
        if (existingIndex >= 0) {
            history[existingIndex] = newEntry;
        } else {
            history.push(newEntry);
        }

        // Sort by round number
        history.sort((a, b) => a.round - b.round);
        saveHistoricalData(history);
        return history;
    }

    function deleteHistoricalRound(round) {
        let history = loadHistoricalData();
        history = history.filter(h => h.round !== round);
        saveHistoricalData(history);
        return history;
    }

    function clearAllHistory() {
        if (confirm('確定要清空所有歷史數據嗎？')) {
            localStorage.removeItem(STORAGE_KEY);
            window.renderHistoryTable();
            window.updateEvaluationDashboard();
        }
    }

    // ==================== TREND ANALYSIS ENGINE ====================
    function analyzeTrend(manualLastWinner = null) {
        const history = loadHistoricalData();

        // 1. Calculate Trend from Historical Data ONLY
        // We need at least 2 historical data points to determine a trend
        let direction = 'neutral';
        let avgGrowth = 0;
        let minCoef = 0.6;
        let maxCoef = 1.6;

        if (history.length >= 2) {
            const latest = history[history.length - 1];
            const previous = history[history.length - 2];

            const minGrowth = ((latest.minWinner - previous.minWinner) / previous.minWinner) * 100;
            const maxGrowth = ((latest.maxWinner - previous.maxWinner) / previous.maxWinner) * 100;
            avgGrowth = (minGrowth + maxGrowth) / 2;

            // Detect trend direction
            if (avgGrowth > 5) direction = 'up';
            else if (avgGrowth < -5) direction = 'down';

            // Set coefficients based on HISTORICAL trend
            const aggressiveness = parseInt(trendAggressiveness.value);
            if (direction === 'up') {
                switch (aggressiveness) {
                    case 1: minCoef = 0.65; maxCoef = 1.5; break;
                    case 2: minCoef = 0.7; maxCoef = 1.7; break;
                    case 3: minCoef = 0.8; maxCoef = 1.9; break;
                }
            } else if (direction === 'down') {
                switch (aggressiveness) {
                    case 1: minCoef = 0.55; maxCoef = 1.4; break;
                    case 2: minCoef = 0.5; maxCoef = 1.3; break;
                    case 3: minCoef = 0.4; maxCoef = 1.2; break;
                }
            }
        }

        // 2. Determine Prediction Base
        // If manual input is provided, use it as the base. Otherwise use the latest history min.
        const baseValue = manualLastWinner ? manualLastWinner : (history.length > 0 ? history[history.length - 1].minWinner : null);

        // 3. Calculate Predicted Range
        let predictedMin = null;
        let predictedMax = null;

        if (baseValue) {
            predictedMin = Math.floor(baseValue * minCoef);
            predictedMax = Math.floor(baseValue * maxCoef);
        }

        return {
            hasTrend: history.length >= 2,
            direction,
            growthRate: avgGrowth,
            predictedMin,
            predictedMax,
            coefficientAdjustment: { min: minCoef, max: maxCoef },
            usingManualInput: !!manualLastWinner
        };
    }

    // ==================== UI RENDERING ====================
    window.renderHistoryTable = function () {
        const history = loadHistoricalData();
        console.log('Rendering history table, count:', history.length);

        if (history.length === 0) {
            historyTableBody.innerHTML = '<tr class="empty-state"><td colspan="6">尚無歷史數據</td></tr>';
            return;
        }

        historyTableBody.innerHTML = history.map((entry, index) => {
            let trendBadge = '';
            if (index > 0) {
                const prevRange = history[index - 1].range;
                const currentRange = entry.range;
                const change = ((currentRange - prevRange) / prevRange) * 100;

                if (change > 5) {
                    trendBadge = `<span class="trend-badge trend-up">↑ ${change.toFixed(1)}%</span>`;
                } else if (change < -5) {
                    trendBadge = `<span class="trend-badge trend-down">↓ ${Math.abs(change).toFixed(1)}%</span>`;
                } else {
                    trendBadge = `<span class="trend-badge trend-neutral">≈ 持平</span>`;
                }
            } else {
                trendBadge = '<span class="trend-badge trend-neutral">基準</span>';
            }

            return `
                <tr>
                    <td>第 ${entry.round} 回</td>
                    <td>${entry.minWinner.toLocaleString()}</td>
                    <td>${entry.maxWinner.toLocaleString()}</td>
                    <td>${entry.range.toLocaleString()}</td>
                    <td>${trendBadge}</td>
                    <td><button class="delete-btn" onclick="deleteRound(${entry.round})">刪除</button></td>
                </tr>
            `;
        }).join('');
    };

    window.updateEvaluationDashboard = function () {
        // Read manual input if available
        const manualLastWinner = lastWinnerInput && lastWinnerInput.value ?
            parseInt(lastWinnerInput.value) : null;

        const trend = analyzeTrend(manualLastWinner);

        if (!trend.hasTrend) {
            trendDirection.textContent = '--';
            if (manualLastWinner) {
                trendDescription.textContent = '需要至少1筆歷史數據來計算趨勢';
            } else {
                trendDescription.textContent = '需要至少2筆數據';
            }
            growthRate.textContent = '--';
            predictedRange.textContent = '--';
            return;
        }

        // Trend Direction
        if (trend.direction === 'up') {
            trendDirection.innerHTML = '<span style="color: #4CAF50;">↗ 上升趨勢</span>';
            trendDescription.textContent = '參加人數增加中';
        } else if (trend.direction === 'down') {
            trendDirection.innerHTML = '<span style="color: #f44336;">↘ 下降趨勢</span>';
            trendDescription.textContent = '參加人數減少中';
        } else {
            trendDirection.innerHTML = '<span style="color: #FFD23F;">→ 平穩</span>';
            trendDescription.textContent = '範圍變化不大';
        }

        // Add indicator if using manual input
        if (trend.usingManualInput) {
            trendDescription.innerHTML += ' <span style="font-size: 0.75rem; color: #FFD23F;">(含手動輸入)</span>';
        }

        // Growth Rate
        const rate = trend.growthRate;
        const rateColor = rate > 0 ? '#4CAF50' : rate < 0 ? '#f44336' : '#FFD23F';
        growthRate.innerHTML = `<span style="color: ${rateColor};">${rate > 0 ? '+' : ''}${rate.toFixed(1)}%</span>`;

        // Predicted Range
        if (trend.predictedMin && trend.predictedMax) {
            predictedRange.innerHTML = `${trend.predictedMin.toLocaleString()} ~ ${trend.predictedMax.toLocaleString()}`;
        } else {
            predictedRange.textContent = '資料不足';
        }
    };

    // ==================== PANEL TOGGLE ====================
    window.togglePanel = function (panelId) {
        const panel = document.getElementById(panelId);
        const toggleIcon = document.getElementById(panelId.replace('-panel', '-toggle'));

        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            toggleIcon.classList.add('rotate');
        } else {
            panel.classList.add('hidden');
            toggleIcon.classList.remove('rotate');
        }
    };

    // ==================== EVENT HANDLERS ====================
    addHistoryBtn.addEventListener('click', () => {
        const round = historyRoundInput.value;
        const min = historyMinInput.value;
        const max = historyMaxInput.value;

        if (!round || !min || !max) {
            alert('請填寫所有欄位');
            return;
        }

        if (parseInt(min) >= parseInt(max)) {
            alert('最大號碼必須大於最小號碼');
            return;
        }

        addHistoricalRound(round, min, max);
        window.renderHistoryTable();
        window.updateEvaluationDashboard();

        // Clear inputs
        historyRoundInput.value = '';
        historyMinInput.value = '';
        historyMaxInput.value = '';
    });

    clearHistoryBtn.addEventListener('click', clearAllHistory);

    window.deleteRound = function (round) {
        if (confirm(`確定要刪除第 ${round} 回的數據嗎？`)) {
            deleteHistoricalRound(round);
            window.renderHistoryTable();
            window.updateEvaluationDashboard();
        }
    };

    trendAggressiveness.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const labels = ['保守', '中等', '激進'];
        aggressivenessValue.textContent = labels[value - 1];
        window.updateEvaluationDashboard();
    });

    // Listen for manual input changes to update dashboard in real-time
    lastWinnerInput.addEventListener('input', () => {
        window.updateEvaluationDashboard();
    });

    calculateBtn.addEventListener('click', () => {
        const strategyMode = document.getElementById('strategy-mode').value;
        const winnerCount = parseInt(document.getElementById('winner-count').value) || 30;
        const lastWinner = parseInt(document.getElementById('last-winner').value) || null;

        calculateStrategy(strategyMode, winnerCount, lastWinner);
    });

    // ==================== STRATEGY CALCULATION ====================
    function calculateStrategy(strategyMode, winnerCount, lastWinner) {
        calculateBtn.innerHTML = '<span>分析中...</span>';
        calculateBtn.disabled = true;
        resultsArea.classList.add('hidden');

        setTimeout(() => {
            const recommendations = runMonteCarloSimulation(strategyMode, winnerCount, lastWinner);
            displayResults(recommendations, winnerCount, strategyMode, lastWinner);

            calculateBtn.innerHTML = '<span>計算推薦號碼</span>';
            calculateBtn.disabled = false;
        }, 100);
    }

    function runMonteCarloSimulation(strategyMode, winnerCount, lastWinner) {
        let searchMin, searchMax;

        // Check if dynamic adjustment is enabled
        const useDynamic = dynamicAdjustmentToggle.checked;
        // Pass lastWinner to analyzeTrend to include it in the trend analysis
        const trend = analyzeTrend(lastWinner);

        if (lastWinner) {
            if (useDynamic && trend.hasTrend) {
                // Use dynamic coefficients based on trend
                // IMPORTANT: Must match analyzeTrend calculation for consistency
                searchMin = Math.max(1, Math.floor(lastWinner * trend.coefficientAdjustment.min));
                searchMax = Math.floor(lastWinner * trend.coefficientAdjustment.max);
            } else {
                // Use default coefficients
                searchMin = Math.max(1, Math.floor(lastWinner * 0.6));
                searchMax = Math.floor(lastWinner * 1.6);
            }
        } else {
            // No last winner, use defaults
            searchMin = winnerCount === 30 ? 80 : 40;
            searchMax = winnerCount === 30 ? 400 : 200;
        }

        const popularityScore = simulatePlayerBehavior(searchMin, searchMax, 5000);

        const uniquenessScores = [];
        for (let num = searchMin; num <= searchMax; num++) {
            const hotPenalty = calculateHotNumberPenalty(num);
            const randomness = calculateRandomness(num);
            const popularity = popularityScore[num] || 0;

            const score = (1 / (popularity + 1)) * 1000 + randomness - hotPenalty;

            uniquenessScores.push({ num, score, popularity, randomness, hotPenalty });
        }

        uniquenessScores.sort((a, b) => b.score - a.score);

        let recommendations = [];
        if (strategyMode === 'pyramid') {
            recommendations = selectBalancedNumbers(uniquenessScores, lastWinner, searchMin, searchMax);
        } else if (strategyMode === 'conservative') {
            const conservativePool = uniquenessScores.filter(s => s.num >= (lastWinner || searchMin * 1.5));
            recommendations = conservativePool.slice(0, 10).map(s => s.num);
        } else if (strategyMode === 'aggressive') {
            const aggressivePool = uniquenessScores.filter(s => s.num <= (lastWinner || searchMax * 0.6));
            recommendations = aggressivePool.slice(0, 10).map(s => s.num);
        }

        return recommendations.slice(0, 10);
    }

    function simulatePlayerBehavior(min, max, iterations) {
        const choices = {};

        for (let i = 0; i < iterations; i++) {
            const playerType = Math.random();

            if (playerType < 0.12) {
                const rangeSize = Math.floor(Math.random() * 15) + 5;
                const startNum = Math.floor(Math.random() * (max - min - rangeSize)) + min;
                for (let j = 0; j < rangeSize; j++) {
                    const num = startNum + j;
                    if (num >= min && num <= max) {
                        choices[num] = (choices[num] || 0) + 1;
                    }
                }
            } else if (playerType < 0.20) {
                const step = Math.floor(Math.random() * 10) + 5;
                const baseNum = Math.floor(Math.random() * (max - min) / 2) + min;
                for (let j = 0; j < 10; j++) {
                    const num = baseNum + j * step;
                    if (num >= min && num <= max) {
                        choices[num] = (choices[num] || 0) + 1;
                    }
                }
            } else if (playerType < 0.35) {
                const base = Math.floor(Math.random() * ((max - min) / 100 + 1)) * 100;
                const num = Math.min(max, min + base);
                choices[num] = (choices[num] || 0) + 1;
            } else if (playerType < 0.45) {
                const num = Math.random() < 0.5 ?
                    generateSequenceNumber(min, max) :
                    generateRepeatNumber(min, max);
                choices[num] = (choices[num] || 0) + 1;
            } else if (playerType < 0.55) {
                const num = generateLuckyNumber(min, max);
                choices[num] = (choices[num] || 0) + 1;
            } else {
                const skew = Math.pow(Math.random(), 1.3);
                const num = Math.floor(min + (max - min) * skew);
                choices[num] = (choices[num] || 0) + 1;
            }
        }

        return choices;
    }

    function calculateHotNumberPenalty(num) {
        let penalty = 0;
        const str = num.toString();

        if (num % 100 === 0) penalty += 100;
        else if (num % 50 === 0) penalty += 50;
        else if (num % 10 === 0) penalty += 20;

        if (isSequence(str)) penalty += 80;
        if (hasRepeatDigits(str)) penalty += 60;
        if (isLuckyNumber(num)) penalty += 40;

        return penalty;
    }

    function calculateRandomness(num) {
        const str = num.toString();
        let randomness = 0;

        if (str.length >= 2) {
            for (let i = 0; i < str.length - 1; i++) {
                randomness += Math.abs(parseInt(str[i]) - parseInt(str[i + 1])) * 3;
            }
        }

        if (isPrime(num)) randomness += 30;

        const uniqueDigits = new Set(str.split('')).size;
        randomness += uniqueDigits * 10;

        return randomness;
    }

    function isSequence(str) {
        if (str.length < 2) return false;
        for (let i = 0; i < str.length - 1; i++) {
            if (parseInt(str[i + 1]) !== parseInt(str[i]) + 1) return false;
        }
        return true;
    }

    function hasRepeatDigits(str) {
        const counts = {};
        for (let char of str) {
            counts[char] = (counts[char] || 0) + 1;
            if (counts[char] >= 2) return true;
        }
        return false;
    }

    function isLuckyNumber(num) {
        const luckyPatterns = [168, 188, 520, 666, 888, 1314, 1688, 6666, 8888];
        return luckyPatterns.includes(num) || num.toString().includes('888') || num.toString().includes('666');
    }

    function isPrime(num) {
        if (num < 2) return false;
        if (num === 2) return true;
        if (num % 2 === 0) return false;
        for (let i = 3; i <= Math.sqrt(num); i += 2) {
            if (num % i === 0) return false;
        }
        return true;
    }

    function generateSequenceNumber(min, max) {
        const sequences = ['123', '234', '345', '456', '567', '678', '789'];
        const seq = sequences[Math.floor(Math.random() * sequences.length)];
        return Math.min(max, Math.max(min, parseInt(seq)));
    }

    function generateRepeatNumber(min, max) {
        const digit = Math.floor(Math.random() * 9) + 1;
        const length = Math.random() < 0.5 ? 2 : 3;
        const num = parseInt(digit.toString().repeat(length));
        return Math.min(max, Math.max(min, num));
    }

    function generateLuckyNumber(min, max) {
        const lucky = [168, 188, 520, 666, 888, 1314, 1688];
        return lucky[Math.floor(Math.random() * lucky.length)] || min;
    }

    function selectBalancedNumbers(scores, lastWinner, min, max) {
        const results = [];
        const range = max - min;

        const zones = [
            { start: 0.0, end: 0.25, count: 2 },
            { start: 0.25, end: 0.50, count: 3 },
            { start: 0.50, end: 0.75, count: 3 },
            { start: 0.75, end: 1.0, count: 2 }
        ];

        zones.forEach(zone => {
            const zoneMin = min + range * zone.start;
            const zoneMax = min + range * zone.end;
            const zoneScores = scores.filter(s => s.num >= zoneMin && s.num < zoneMax);

            for (let i = 0; i < zone.count && i < zoneScores.length; i++) {
                results.push(zoneScores[i].num);
            }
        });

        return results;
    }

    function displayResults(numbers, winnerCount, strategyMode, lastWinner) {
        resultsArea.classList.remove('hidden');
        numbersGrid.innerHTML = '';

        // 確保號碼從小到大排序
        numbers.sort((a, b) => a - b);

        let lowThreshold, mediumThreshold;
        if (lastWinner) {
            lowThreshold = lastWinner * 0.95;
            mediumThreshold = lastWinner * 1.20;
        } else {
            lowThreshold = winnerCount === 30 ? 150 : 90;
            mediumThreshold = winnerCount === 30 ? 250 : 140;
        }

        numbers.forEach((num, index) => {
            const div = document.createElement('div');
            div.className = 'number-badge';
            div.textContent = num;
            div.style.animationDelay = `${index * 0.05}s`;

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

        const minNum = Math.min(...numbers);
        const maxNum = Math.max(...numbers);
        safeZoneDisplay.textContent = `${minNum.toLocaleString()} ~ ${maxNum.toLocaleString()}`;
    }

    // ==================== INITIALIZATION ====================
    window.renderHistoryTable();
    window.updateEvaluationDashboard();
});

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
        calculateBtn.innerHTML = '<span>蒙特卡羅模擬中...</span>';
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
        // 步驟1：確定搜索範圍
        let searchMin, searchMax;
        if (lastWinner) {
            searchMin = Math.max(1, Math.floor(lastWinner * 0.6));
            searchMax = Math.floor(lastWinner * 1.6);
        } else {
            searchMin = winnerCount === 30 ? 80 : 40;
            searchMax = winnerCount === 30 ? 400 : 200;
        }

        // 步驟2：蒙特卡羅模擬 - 模擬其他玩家的選擇行為
        const popularityScore = simulatePlayerBehavior(searchMin, searchMax, 5000);

        // 步驟3：計算每個數字的"唯一性分數"
        const uniquenessScores = [];
        for (let num = searchMin; num <= searchMax; num++) {
            const hotPenalty = calculateHotNumberPenalty(num);
            const randomness = calculateRandomness(num);
            const popularity = popularityScore[num] || 0;

            // 綜合評分 = 低被選率 + 高隨機性 - 熱門懲罰
            const score = (1 / (popularity + 1)) * 1000 + randomness - hotPenalty;

            uniquenessScores.push({ num, score, popularity, randomness, hotPenalty });
        }

        // 步驟4：根據策略選擇數字
        uniquenessScores.sort((a, b) => b.score - a.score);

        let recommendations = [];
        if (strategyMode === 'pyramid') {
            // 金字塔：混合高唯一性 + 分散範圍
            recommendations = selectBalancedNumbers(uniquenessScores, lastWinner, searchMin, searchMax);
        } else if (strategyMode === 'conservative') {
            // 保守：只選高唯一性的大數字
            const conservativePool = uniquenessScores.filter(s => s.num >= (lastWinner || searchMin * 1.5));
            recommendations = conservativePool.slice(0, 10).map(s => s.num);
        } else if (strategyMode === 'aggressive') {
            // 激進：選高唯一性的小數字
            const aggressivePool = uniquenessScores.filter(s => s.num <= (lastWinner || searchMax * 0.6));
            recommendations = aggressivePool.slice(0, 10).map(s => s.num);
        }

        return recommendations.slice(0, 10);
    }

    function simulatePlayerBehavior(min, max, iterations) {
        const choices = {};

        for (let i = 0; i < iterations; i++) {
            // 模擬一個玩家的選擇行為
            const playerType = Math.random();
            let num;

            if (playerType < 0.25) {
                // 25%選整百數
                const base = Math.floor(Math.random() * ((max - min) / 100 + 1)) * 100;
                num = Math.min(max, min + base);
            } else if (playerType < 0.40) {
                // 15%選順子
                num = generateSequenceNumber(min, max);
            } else if (playerType < 0.50) {
                // 10%選重複數字
                num = generateRepeatNumber(min, max);
            } else if (playerType < 0.60) {
                // 10%選吉利數
                num = generateLuckyNumber(min, max);
            } else {
                // 40%隨機選擇（但偏向小數字）
                const skew = Math.pow(Math.random(), 1.5); // 偏向0
                num = Math.floor(min + (max - min) * skew);
            }

            choices[num] = (choices[num] || 0) + 1;
        }

        return choices;
    }

    function calculateHotNumberPenalty(num) {
        let penalty = 0;
        const str = num.toString();

        // 整百、整十懲罰
        if (num % 100 === 0) penalty += 100;
        else if (num % 50 === 0) penalty += 50;
        else if (num % 10 === 0) penalty += 20;

        // 順子懲罰 (123, 234, 345...)
        if (isSequence(str)) penalty += 80;

        // 重複數字懲罰 (111, 222, 1000...)
        if (hasRepeatDigits(str)) penalty += 60;

        // 吉利數懲罰
        if (isLuckyNumber(num)) penalty += 40;

        return penalty;
    }

    function calculateRandomness(num) {
        const str = num.toString();
        let randomness = 0;

        // 數位差異度
        if (str.length >= 2) {
            for (let i = 0; i < str.length - 1; i++) {
                randomness += Math.abs(parseInt(str[i]) - parseInt(str[i + 1])) * 3;
            }
        }

        // 質數加分
        if (isPrime(num)) randomness += 30;

        // 數字複雜度（不同數位數量）
        const uniqueDigits = new Set(str.split('')).size;
        randomness += uniqueDigits * 10;

        return randomness;
    }

    function selectBalancedNumbers(scores, lastWinner, min, max) {
        const results = [];
        const range = max - min;

        // 分4檔選擇
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

    // === 輔助函數 ===

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

    function displayResults(numbers, winnerCount, strategyMode, lastWinner) {
        resultsArea.classList.remove('hidden');
        numbersGrid.innerHTML = '';

        const strategyDesc = `蒙特卡羅 | 避熱門數字`;

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
        safeZoneDisplay.textContent = `${minNum.toLocaleString()} - ${maxNum.toLocaleString()} | 高唯一性`;

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
        startLabel.textContent = '高重複';
        startLabel.style.position = 'absolute';
        startLabel.style.bottom = '0';
        startLabel.style.left = '0';
        startLabel.style.fontSize = '0.7rem';
        startLabel.style.color = '#ff4d4d';

        const endLabel = document.createElement('div');
        endLabel.textContent = '高唯一';
        endLabel.style.position = 'absolute';
        endLabel.style.bottom = '0';
        endLabel.style.right = '0';
        endLabel.style.fontSize = '0.7rem';
        endLabel.style.color = '#4caf50';

        const modeLabel = document.createElement('div');
        modeLabel.textContent = 'Monte Carlo | 5000次模擬';
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

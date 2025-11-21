document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsArea = document.getElementById('results-area');
    const numbersGrid = document.getElementById('numbers-grid');
    const safeZoneDisplay = document.getElementById('safe-zone');

    calculateBtn.addEventListener('click', () => {
        const strategyMode = document.getElementById('strategy-mode').value;
        const winnerCount = parseInt(document.getElementById('winner-count').value) || 30;
        const lastWinner = parseInt(document.getElementById('last-winner').value) || null;

        calculateStrategy(strategyMode, winnerCount, lastWinner);
    });

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
        if (lastWinner) {
            searchMin = Math.max(1, Math.floor(lastWinner * 0.6));
            searchMax = Math.floor(lastWinner * 1.6);
        } else {
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
    ```javascript
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
        if (lastWinner) {
            searchMin = Math.max(1, Math.floor(lastWinner * 0.6));
            searchMax = Math.floor(lastWinner * 1.6);
        } else {
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
});
```

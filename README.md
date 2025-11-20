# MapleStory N - Lucky Choice Strategy

A web application to help MapleStory N players determine optimal numbers for the "Lucky Choice" event.

## Features

- **Cold Start Strategy**: Simulation-based recommendations for new players
- **History-Based Strategy**: Adaptive recommendations using previous winning numbers
- **Visual Density Chart**: Shows the probability distribution of number safety
- **Smart Recommendations**: Concentrates picks at the safe zone threshold to maximize win probability

## How It Works

The winner is determined by the **smallest unique number** among all participants. This tool:

1. Estimates the "safe zone" where numbers are likely to be unique (approximately 80% of total tickets)
2. Concentrates recommendations just above this threshold
3. Includes a few "lucky low" numbers for high-risk, high-reward plays
4. Provides visual feedback with color-coded safety indicators

## Usage

1. Open `index.html` in your browser
2. Enter the number of participants and tickets per person
3. Choose your strategy mode (Cold Start or History-Based)
4. Click "計算推薦號碼" to generate recommendations

## Technology

- Pure HTML, CSS, and JavaScript
- No dependencies required
- Works offline

## License

MIT

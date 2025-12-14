<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Fiscal Insight Taiwan (Real Data Edition)

This project visualizes Taiwan's fiscal budget trends from **2008 to 2025 (Republic of China Year 97-114)** using real government data.
It replaces the previous simulated data with a comprehensive dataset aggregated from official budget sources.

Key Features:
- **Historical Analysis**: View revenue and expenditure trends over nearly two decades.
- **Detailed Breakdown**: Explore budget distributions by category (Education, Defense, Social Welfare, etc.).
- **Fund Insights**: Analyze the performance of various government funds.


**Data Sources:**
- Unified CSV data located in `data/unified/` (generated from `docs/tw-finance/`).

## Project Structure
- `src/`: React Frontend Code
- `data/`: Raw and Unified Data Files
- `docs/`: Project Documentation and Specifications

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

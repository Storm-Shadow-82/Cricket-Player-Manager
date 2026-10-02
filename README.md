CRIC-TACTIC v2.4 Pro Analytics 🏏⚡

    Elite Cricket Operations & Tactical Analytics Deck: Multi-Innings Scorecards, Playing XI Workbench, Squad Dossiers, Match Telemetry, and AI/OCR PDF Layout Processing.

![Image](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Image](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Image](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Image](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Image](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75C2?style=for-the-badge&logo=google&logoColor=white)
![Image](https://img.shields.io/badge/Tesseract.js-OCR-5C6BC0?style=for-the-badge)
📌 Overview

CRIC-TACTIC v2.4 Pro Analytics is a high-performance cricket operations management system designed for cricket coaches, team analysts, tournament directors, and tactical squads. It bridges the gap between fast ball-by-ball matchday operations, post-match PDF ingestion, and deep tactical squad intelligence.

From live wagon wheel match tracking and team squad dossiers to custom coordinate PDF scorecard layout mapping and AI document parsing, CRIC-TACTIC provides a complete, modern command center for competitive cricket.
✨ Key Features & Modules
1. 🏏 Matchday Live Scoring

    Ball-by-Ball Tracking: Record runs (0, 1, 2, 3, 4, 6), extras (Wides, No Balls, Byes, Leg Byes), and dismissals with instant strike-rotation.

    Dynamic Wagon Wheel: Interactive cricket ground canvas capturing shot placement coordinates and field trajectory.

    Fall of Wickets (FOW) Ledger: Real-time wicket progression tracking over, score, and outgoing batter.

    Run Rate & DLS Computations: Live Current Run Rate (CRR), Required Run Rate (RRR), and Duckworth-Lewis-Stern target adjustments.

2. ⚡ Scorecard Rapid Entry

    High-efficiency tabular score entry designed for rapid post-game entry.

    Automatic computation of Strike Rates (SR), Boundary Percentages, Dot Ball Percentages, Bowler Economy (Econ), and Impact Ratings.

3. 📋 Playing XI Workbench

    Interactive squad builder for selecting your 11-player lineup from the squad pool.

    Validates team composition rules (e.g., maximum overseas player quotas, minimum bowling options, designated wicket-keeper and captain).

    Pitch Condition Advisory: Tactical recommendations tailored to pitch types (Dry Spin, Green Pace, Flat Highway, Damp Seam).

4. 👤 Squad Database & Player Dossiers

    Comprehensive squad rosters with headshots, jersey numbers, tactical roles, and player status.

    Dynamic Impact Score (DIS): Proprietary algorithmic performance metric evaluating run contributions, bowling economy, strike rates, and milestone achievements.

    Detailed player breakdown across powerplay, middle overs, and death overs phases.

5. 📜 Match History Archives & Vault Recovery

    Searchable historical ledger of all completed games with expandable inning-by-inning scorecards.

    Immutable All Records Vault: Redundant backup ledger that preserves historical scorecards and allows 1-click restoration if a match is accidentally deleted.

6. 📊 Tournament Telemetry

    Interactive visual analytics powered by Recharts:

        Run rate trend progressions per over.

        Phase-by-phase scoring efficiency (Powerplay vs. Middle vs. Death).

        Bowler economy and wicket distribution heatmaps.

7. 📄 Universal PDF & Scorecard Importer (Dual OCR Engine)

    Multi-Format Ingestion: Ingest match reports from CricHeroes, KDM Cricket Scorer, Play-Cricket, or image screenshots (.pdf, .png, .jpg, .jpeg).

    Dual Visual OCR Pipeline:

        Gemini 2.5 Flash Vision: Directly ingests multi-page binary PDFs and image documents to extract teams, scores, overs, toss, batting cards, and bowling figures with 100% table layout comprehension.

        Tesseract.js Visual OCR: Local browser-based image layout analyzer that performs client-side OCR on scorecard image blobs.

    Multi-Pattern Fallback Parser: Robust line-by-line regex parser for pasting raw text from WhatsApp, websites, or summary notes.

    Smart Squad Alignment: Auto-detects whether your squad is Team 1 or Team 2 based on roster match confidence.

    1-Click Batch Registration: Add any unlinked players directly into your squad database in one click.

    Built-in Diagnostic Inspector: Real-time inspection drawer and console ledger showing exact raw text streams, model responses, and confidence scores.

8. 📐 PDF Layout Configurator (Settings)

    Interactive Visual Canvas: Mock A4 scorecard preview allowing users to define rectangular bounding boxes for:

        🟧 Match Header & Scores

        🟩 Batting Table Region

        🟦 Bowling Table Region

        🟪 Fall of Wickets Region

    Scorecard Column Index Mappings:

        Batting: Batter Name, Dismissal, Runs (R), Balls (B), 4s, 6s, Strike Rate (SR).

        Bowling: Bowler Name, Overs (O), Maidens (M), Runs Conceded (R), Wickets (W), Economy (Eco).

    Template Learning & Persistence: Save custom layout templates into local storage (e.g. CricHeroes Standard, Compact Tournament Grid) to guide AI OCR across diverse document layouts.

🛠 Tech Stack
Technology	Purpose
React 19	Modern UI framework with hooks and functional components
TypeScript	Strict type-safety across all cricket domains and models
Vite	Blazing-fast development and optimized production bundling
Tailwind CSS v4	Clean, dark tactical interface styling
@google/genai	Google Gemini 2.5 Flash SDK for multimodal PDF & document OCR
tesseract.js	Client-side visual optical character recognition for image blobs
Recharts	Interactive charts for run rates, phases, and bowler telemetry
Lucide & Material Symbols	Cohesive tactical cricket iconography
📂 Project Architecture
code Code

├── index.html                    # HTML entry point with metadata
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript compiler configuration
├── vite.config.ts                # Vite build & plugin configuration
├── src/
│   ├── main.tsx                  # React application entry point
│   ├── App.tsx                   # Master app controller, navigation & tab router
│   ├── index.css                 # Global CSS & Tailwind imports
│   ├── types/
│   │   └── cricket.ts            # Core types (Match, Player, Batting, Bowling, PDF Templates)
│   ├── data/
│   │   └── mockData.ts           # Initial squad pool, fixtures, and telemetry seeds
│   ├── utils/
│   │   ├── cricket.ts            # Similarity matching, DLS math & impact calculations
│   │   └── pdfTemplates.ts       # PDF Layout template storage & default definitions
│   └── components/
│       ├── Header.tsx            # Global tactical header & quick stats
│       ├── NewMatchModal.tsx     # Match draft creation & import launcher
│       ├── ImportScorecardModal.tsx # 4-step PDF, text & visual OCR import wizard
│       ├── PdfLayoutConfigurator.tsx# Interactive A4 coordinate & column mapping editor
│       ├── UserSettingsModal.tsx # Coach profile, All Records Vault & settings tabs
│       ├── LoginModal.tsx        # Authentication modal
│       ├── DataBackupModal.tsx   # Backup export & restore modal
│       └── views/
│           ├── MatchdayLiveScoringView.tsx # Ball-by-ball & wagon wheel deck
│           ├── ScorecardRapidEntryView.tsx # Rapid post-match figures entry
│           ├── PlayingXiWorkbenchView.tsx  # Lineup selection & pitch advisory
│           ├── SquadDatabaseDossierView.tsx# Player dossiers & performance metrics
│           ├── MatchHistoryArchivesView.tsx# Match log archives & detailed cards
│           └── TelemetryView.tsx           # Charts, analytics & wagon wheel heatmaps
└── README.md                     # Documentation & user guide

🚀 Quickstart & Setup
Prerequisites

    Node.js: v18.0.0 or higher

    npm or yarn / pnpm

Installation

    Clone the repository:
    code Bash

    git clone https://github.com/your-username/cric-tactic-analytics.git
    cd cric-tactic-analytics

    Install dependencies:
    code Bash

    npm install

    Configure Environment Variables:
    Create a .env file in the root directory (refer to .env.example):
    code Env

    # Gemini API Key for AI Scorecard OCR Extraction
    VITE_GEMINI_API_KEY=your_gemini_api_key_here

    Launch Development Server:
    code Bash

    npm run dev

    Open your browser at http://localhost:3000.

    Build for Production:
    code Bash

    npm run build

    The compiled assets will be output to the dist/ directory.

📖 How to Use the PDF Layout Configurator

    Open Settings (click your coach profile in the header).

    Select the "PDF Layout Config" tab.

    Choose an existing template or click "+ New Template".

    Tune Region Coordinates:

        Click on any region on the interactive canvas (Match Header, Batting Table, Bowling Table, Fall of Wickets).

        Adjust the X, Y, Width, and Height sliders to match your tournament report.

    Set Column Indices:

        Switch to the "Column Mappings" sub-tab.

        Define which column corresponds to Runs (R), Balls (B), Wickets (W), Overs (O), etc.

    Click "Save & Apply Template".

    Now, when importing any match report in the PDF Importer, the system will apply your defined coordinates to accurately extract figures!

🔒 Security & Data Privacy

    Local-First Architecture: Match scorecards, squad dossiers, and custom PDF templates are saved securely to your browser's persistent localStorage.

    Vault Recovery: The All Records Vault retains an immutable backup ledger of all imported and completed games, ensuring accidental deletions can be restored with a single click.

    Client-Side Processing: Document layout analysis with Tesseract.js is executed locally in your browser sandbox.

📄 License

Distributed under the MIT License. See LICENSE for more information.

Built with passion for cricket analysts, coaches, and tactical squads worldwide. 🏆

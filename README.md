# Smart Campus Waste Monitoring & Collection Route Planner

> **Academic Microproject Integration:** Computer Organization and Architecture (COA) &bull; Formal Language and Automata Theory (FLAT) &bull; Design and Analysis of Algorithms (DAA)

---

## 1. Project Identification & Student Details

* **Student Developer:** Dron Kumar Singh
* **Project Title:** Smart Campus Waste Monitoring & Collection Route Planner
* **Student College Email:** `[laitonjam.dronkumarsingh.s70@kalvium.community]`
* **Notice:** Educational Prototype — Dustbin readings are manually updated or simulated. No live sensors are connected.
* **Target Environment:** Standard Web Browsers (Chrome, Edge, Firefox, Safari) &mdash; 100% Offline Capability

---

## 2. Project Overview & Problem Statement

Collegiate institutions, hostel complexes, academic blocks, dining halls, and sports facilities generate substantial daily municipal waste. Standard campus maintenance relies primarily on static, periodic walking tours by sanitation staff. This routine causes two common failures:
1. **Unmonitored Overflow:** High-density venues (such as cafeterias or sports pavilions) overflow unexpectedly hours before standard scheduled collection rounds.
2. **Wasted Effort & Routing Inefficiency:** Workers expend valuable time and physical effort visiting distant containers that are mostly empty, without algorithmic coordination.

The **Smart Campus Waste Monitoring & Collection Route Planner** is an educational single-page web application designed to demonstrate how foundational computer science disciplines solve this problem:
* **Computer Organization & Architecture (COA):** Models fill telemetry using 7-bit unsigned binary integers and compact 2-bit categorical status flags.
* **Formal Language & Automata Theory (FLAT):** Enforces strict container identifier syntax ($L = \{Bdd \mid d \in \{0..9\}\}$) using a 5-tuple Deterministic Finite Automaton (DFA).
* **Design & Analysis of Algorithms (DAA):** Models campus pathways as an unweighted undirected graph and applies Breadth-First Search (BFS) to find optimal minimum-hop collection routes while executing multi-tier urgency recommendation heuristics.

---

## 3. Academic Subject Integration

| Subject | Academic Concept Implemented | Implementation in Project | Key Functions in Code |
| :--- | :--- | :--- | :--- |
| **COA** | Unsigned Binary Number Systems, Repeated Division by 2, Place-Value Positional Notation, Bitwise Status Encoding | Converts $0\% - 100\%$ fill levels into 7-bit padded binary words ($0000000_2$ to $1100100_2$) and 2-bit categorical priority flags (`00`, `01`, `10`, `11`). Includes interactive calculators. | `decimalTo7BitBinary()`, `binaryToDecimal()`, `getCategoryAndCode()` |
| **FLAT** | Deterministic Finite Automata (DFA), Regular Languages ($L = \{Bdd\}$), 5-Tuple Formulation, State Diagrams | Validates dustbin identifiers (e.g. `B01`, `B12`) using an explicit 5-state transition function $\delta(q, c)$ with an absorbing trap state $q_{\text{dead}}$. Provides live SVG diagram highlighting and prevents malformed IDs in localStorage. | `dfaTransition()`, `runDFA()`, `highlightDFAState()` |
| **DAA** | Graph Theory, Unweighted Adjacency Lists, Breadth-First Search (BFS), Asymptotic Analysis $\mathcal{O}(V+E)$, Greedy Decision Heuristics | Finds the minimal-edge route between worker starting location and target container. Recommends the optimal next urgent container using priority-tier and BFS hop-count tie-breaking. Renders live SVG path highlighting. | `bfsShortestPath()`, `recommendNextCollectionTarget()`, `renderCampusGraphSVG()` |

---

## 4. Mandatory Technology Stack

In strict accordance with educational constraints, this project uses **zero external dependencies**:
* **HTML5:** Semantic document structure, accessible ARIA roles, clean tabpanels.
* **CSS3:** Custom properties (CSS variables), responsive flexbox and grid layouts, light theme, high-contrast accessible typography.
* **Vanilla JavaScript (ES6+):** Modular, readable application logic with descriptive comments. No React, Angular, Vue, Node.js, Express, MongoDB, Firebase, or external NPM packages.
* **Scalable Vector Graphics (SVG):** Inline vector rendering of the 5-state DFA diagram and the 8-node campus pathway topology.
* **Browser localStorage:** Persistent browser storage under the key `smartCampusWasteBins`.

---

## 5. File & Folder Structure

```
smart-campus-waste-planner/
├── index.html                    # Main single-page web application interface
├── styles.css                    # Professional responsive stylesheet (light clean theme)
├── script.js                     # Core application logic (COA, FLAT, DAA, CRUD, 48-Test Runner)
├── README.md                     # Comprehensive project documentation
├── TESTING.md                    # Formal verification matrix (48 automated tests + manual tests)
├── package-projects.bat          # One-click Windows batch packaging script
├── package-projects.ps1          # Robust PowerShell script building the 3 submission ZIPs
├── docs/
│   ├── COA_Report.md             # Formal subject microproject report for COA (22 sections)
│   ├── FLAT_Report.md            # Formal subject microproject report for FLAT (22 sections)
│   └── DAA_Report.md             # Formal subject microproject report for DAA (22 sections)
├── screenshots/
│   ├── COA/
│   │   └── README.md             # COA screenshot catalog & capture instructions
│   ├── FLAT/
│   │   └── README.md             # FLAT screenshot catalog & capture instructions
│   └── DAA/
│       └── README.md             # DAA screenshot catalog & capture instructions
├── assets/
│   └── README.md                 # Offline asset architecture & Unicode iconography guide
└── .gitignore                    # Version control ignore file
```

---

## 6. How to Run Locally

Because this application is completely self-contained with zero third-party build steps or server runtimes:

1. **Direct Browser Execution (Recommended):**
   - Navigate to the project directory: `smart-campus-waste-planner/`
   - Double-click `index.html` (or right-click $\to$ Open With $\to$ Google Chrome, Microsoft Edge, or Mozilla Firefox).
   - The application will load immediately with the preloaded 5 campus demo dustbins.

2. **Optional Local Static HTTP Server:**
   If you prefer running through a local development server:
   ```bash
   # Python 3
   python -m http.server 8000
   # Then open in browser: http://localhost:8000
   ```

---

## 7. Application Walkthrough & User Guide

### 7.1 Dashboard (`#section-dashboard`)
* **KPI Summary Cards:** Displays real-time counts of Total Registered Dustbins, Critical Bins ($75\% - 100\%$), High-Fill Bins ($50\% - 74\%$), and Low-Fill Bins ($0\% - 24\%$).
* **Priority Collection List:** Prominently displays all bins requiring urgent attention. Automatically sorts Critical bins first, then High-fill bins, then by fill percentage descending, using Dustbin ID as a stable tie-breaker.
* **Dustbin Overview Table:** Comprehensive table showing each dustbin's ID, campus location, decimal fill percentage, 7-bit binary representation, 2-bit category code, status badge, and last updated timestamp. Includes quick "Edit" and "Route" buttons.
* **Action Buttons:** Quick buttons to Add Dustbins, Update Fill Levels, Open Route Planner, Load Demo Data, or Reset Demo Data.

### 7.2 Dustbin Management (`#section-management`)
* **Registration / Edit Form:** Allows adding new containers or editing existing records.
  - **DFA Live Validation:** Form input validates the ID in real time using the FLAT DFA. If invalid (e.g. `X01` or `B1`), submission is blocked.
  - **Duplicate Prevention:** IDs must be globally unique.
  - **Campus Graph Vertex Selection:** Restricts locations to valid campus nodes.
  - **Fill Percentage Slider:** Dual slider/number input updating the live COA 7-bit binary preview.
* **Search, Filter & Sort:**
  - Real-time text search across Dustbin IDs and campus locations.
  - Dropdown filter by status category (All, Critical, High, Moderate, Low).
  - Sorting options: ID ascending/descending, Fill % ascending/descending.

### 7.3 COA &mdash; Binary Data Lab (`#section-coa`)
* **Educational Banner:** Explains why 7 bits are used ($2^7 = 128 \ge 101$) and how 2-bit category codes reduce telemetry transmission bandwidth.
* **Binary Telemetry Inspector Table:** Displays all active campus dustbins with their decimal fill values, 7-bit padded binary strings, 2-bit codes, and bit breakdown explanations.
* **9.2 Decimal-to-Binary Calculator:**
  - Enter any integer from $0$ to $100$.
  - Generates the complete repeated division by 2 table, showing dividend, divisor, quotient, and remainder.
  - Displays the 7-bit padded binary output and reverse-reading notes.
* **9.3 Binary-to-Decimal Calculator:**
  - Enter any binary string up to 7 bits (e.g., `1001011`).
  - Displays the positional place-value formula ($\sum b_i \cdot 2^i$) and the complete bit-by-bit power table.
* **9.4 Categorical Encoding Specification:** Reference table detailing the four category thresholds.

### 7.4 FLAT &mdash; DFA Validator (`#section-flat`)
* **Formal Language Definition:** Explains $L = \{Bdd \mid d \in \{0..9\}\}$ and the formal 5-tuple $M = (Q, \Sigma, \delta, q_0, F)$.
* **Interactive DFA Validator:**
  - Input field for testing any candidate string.
  - One-click standard test preset buttons: `B01`, `B12`, `B99`, `X01`, `B1`, `B123`, `B1A`, `b01`, and `[Empty]`.
  - Displays accepted/rejected banner with the terminating state ($q_3 \in F$ vs. $q_{\text{dead}} \notin F$).
  - Displays the step-by-step transition trace table detailing each state transition rule $\delta(q, c)$.
* **Interactive SVG State Diagram:** Visual diagram with start arrow, directed transitions, double circle on $q_3$, and trap state $q_{\text{dead}}$. Dynamically highlights the active state in real time.
* **Transition Table:** Complete mathematical lookup table for $\delta$.

### 7.5 DAA &mdash; Route Planner (`#section-daa`)
* **Route Controls:** Select worker starting campus building and target dustbin.
* **Shortest Path Calculation (BFS):**
  - Runs pure BFS on the campus graph adjacency list.
  - Displays the reconstructed forward path (e.g., `Main Gate → Admin Block → Academic Block → Cafeteria`), edge count, and visited sequence.
* **Target Recommendation Engine:**
  - Evaluates all campus bins according to academic prioritization:
    1. Critical bins first.
    2. High bins second.
    3. Run BFS from worker location to all candidates.
    4. Select candidate with fewest edges (hops).
    5. Tie-breaker 1: Higher fill percentage.
    6. Tie-breaker 2: Lexicographically smaller ID.
  - Outputs recommended target with detailed academic justification.
* **Interactive SVG Campus Map:**
  - Visualizes all 8 vertices and 11 undirected pathways.
  - Dynamically highlights route edges in thick glowing green, start vertex in blue, and target in red.
* **Complexity & Theoretical Proofs:** Details $\mathcal{O}(V+E)$ time complexity, $\mathcal{O}(V)$ space complexity, and edge minimization guarantees.

### 7.6 About Project & In-App Test Suite (`#section-about`)
* Detailed student developer and project identification.
* Scope disclaimer regarding simulated telemetry.
* **In-App Automated Test Runner:** One-click execution of 48 unit tests directly in the browser across all four core domains:
  - 9 Dustbin Management tests (DM-01 to DM-09)
  - 18 Computer Organization & Architecture tests (COA-01 to COA-18)
  - 11 Formal Language & Automata Theory tests (FLAT-01 to FLAT-11)
  - 10 Design & Analysis of Algorithms tests (DAA-01 to DAA-10)

---

## 8. Default Preloaded Demo Dataset

When opened with an empty storage state, the application preloads the five required sample dustbins:

| Dustbin ID | Campus Location | Fill % | Category | 2-Bit Code | 7-Bit Binary | Operational Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **B01** | Hostel Block | 85% | Critical | `11` | `1010101` | High priority residential container |
| **B02** | Cafeteria | 92% | Critical | `11` | `1011100` | Rapid dining hall accumulation |
| **B03** | Library | 48% | Moderate | `01` | `0110000` | Routine monitoring |
| **B04** | Sports Ground | 100% | Critical | `11` | `1100100` | Fully overflowing outdoor bin |
| **B05** | Admin Block | 20% | Low | `00` | `0010100` | Adequate surplus capacity |

---

## 9. Preparation of Subject-Specific Submission Archives (ZIPs)

Three independent ZIP archives must be prepared for academic submission:

1. `DronKumarSingh_COA_MicroProject.zip`
2. `DronKumarSingh_FLAT_MicroProject.zip`
3. `DronKumarSingh_DAA_MicroProject.zip`

### Archive Contents Matrix

| File / Folder | Included in COA ZIP? | Included in FLAT ZIP? | Included in DAA ZIP? |
| :--- | :---: | :---: | :---: |
| `index.html` | Yes | Yes | Yes |
| `styles.css` | Yes | Yes | Yes |
| `script.js` | Yes | Yes | Yes |
| `README.md` | Yes | Yes | Yes |
| `TESTING.md` | Yes | Yes | Yes |
| `assets/` | Yes | Yes | Yes |
| `.gitignore` | Yes | Yes | Yes |
| `docs/COA_Report.md` | **Yes (Exclusive)** | No | No |
| `docs/FLAT_Report.md` | No | **Yes (Exclusive)** | No |
| `docs/DAA_Report.md` | No | No | **Yes (Exclusive)** |
| `screenshots/COA/` | **Yes (Exclusive)** | No | No |
| `screenshots/FLAT/` | No | **Yes (Exclusive)** | No |
| `screenshots/DAA/` | No | No | **Yes (Exclusive)** |

### One-Click Automated Packaging (Windows)

Two automated scripts are provided in the repository root to package all 3 ZIP archives with exact file distributions:

1. **Windows Batch (Command Prompt or double-click):**
   ```cmd
   package-projects.bat
   ```
2. **PowerShell Script:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\package-projects.ps1
   ```

### Manual Packaging Commands (PowerShell / Windows)

If creating the submission archives manually via command-line:

```powershell
# 1. Create COA Archive
Compress-Archive -Path index.html, styles.css, script.js, README.md, TESTING.md, assets, .gitignore, docs\COA_Report.md, screenshots\COA -DestinationPath DronKumarSingh_COA_MicroProject.zip -Force

# 2. Create FLAT Archive
Compress-Archive -Path index.html, styles.css, script.js, README.md, TESTING.md, assets, .gitignore, docs\FLAT_Report.md, screenshots\FLAT -DestinationPath DronKumarSingh_FLAT_MicroProject.zip -Force

# 3. Create DAA Archive
Compress-Archive -Path index.html, styles.css, script.js, README.md, TESTING.md, assets, .gitignore, docs\DAA_Report.md, screenshots\DAA -DestinationPath DronKumarSingh_DAA_MicroProject.zip -Force
```

---

## 10. Verification of Codebase Integrity & Non-Fabrication

In compliance with project specifications:
- **No Fabricated URLs:** This project does not invent hypothetical GitHub repository links or live deployment domains. Placeholders are clearly marked:
  * GitHub Repository: `[To be created upon institutional repository provisioning]`
  * Deployed Application: `[To be hosted via institutional web space or GitHub Pages]`
- **No Fabricated Execution Claims:** All 48 automated test assertions documented in `TESTING.md` were executed against the actual JavaScript implementation functions and verified to pass (100% pass rate).
- **Scope Integrity:** The application is explicitly marked as an educational prototype simulating manual telemetry.

---

## 11. Limitations & Future Scope

1. **Simulated Telemetry:** Sensor data is entered via GUI forms or simulated locally. Future work could integrate low-power microcontroller hardware (e.g., ESP32 ultrasonic sensors) via WebSockets.
2. **Unweighted BFS Simplification:** Campus pathways are treated as uniform unweighted edges. Future extensions could assign metric distance weights and implement Dijkstra's Algorithm or A* Search.
3. **Single Next-Stop Heuristic:** The recommendation engine selects the immediate next container rather than solving the full NP-hard multi-stop Traveling Salesperson Tour across an entire shift.

## 12 . Github Repository Link 
https://github.com/Jager001840/smart-campus-waste-planner_DronKumar.git

## 13  Deployment Link 
https://smart-campus-waste-planner-dronkuma.vercel.app/

# Verification and Testing Record

## Project Information
* **Project Title:** Smart Campus Waste Monitoring & Collection Route Planner
* **Student Developer:** Dron Kumar Singh
* **Student College Email:** `[Insert and verify the correct college email address]`
* **Test Execution Environment:** Local Browser Engine (HTML5, ES6 JavaScript, localStorage)
* **Notice:** Educational Prototype — Dustbin readings are manually updated or simulated. No live sensors are connected.

---

## 1. Master Testing Matrix

| Test ID | Feature | Input or Action | Expected Result | Actual Observed Result | Pass/Fail Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DM-01** | Dustbin Management | Add valid ID `B06` with location `Parking Area` and fill `60%` | Bin added, saved to localStorage, overview & summaries updated | Form submitted successfully; bin `B06` visible in table and summaries | **PASS** |
| **DM-02** | Dustbin Management | Add invalid ID `X01` | FLAT DFA rejects input with state $q_{\text{dead}}$; form blocks submission | DFA validation badge displays `DFA Rejected (State: q_dead)`; toast error shown; record rejected | **PASS** |
| **DM-03** | Dustbin Management | Add incomplete ID `B1` | FLAT DFA rejects with state $q_2$; submission blocked | DFA validation badge displays `DFA Rejected (State: q2)`; submission blocked | **PASS** |
| **DM-04** | Dustbin Management | Add excess length ID `B123` | FLAT DFA transitions to $q_{\text{dead}}$; submission blocked | DFA badge displays `DFA Rejected (State: q_dead)`; submission blocked | **PASS** |
| **DM-05** | Dustbin Management | Add existing ID `B01` | Rejected due to duplicate ID violation | Form displays duplicate ID warning; blocks submission | **PASS** |
| **DM-06** | Dustbin Management | Enter fill percentage `< 0` (e.g. `-5`) | Validation error; submission blocked | Toast alert: "Fill percentage must be an integer between 0 and 100"; submission blocked | **PASS** |
| **DM-07** | Dustbin Management | Enter fill percentage `> 100` (e.g. `105`) | Validation error; submission blocked | Toast alert: "Fill percentage must be an integer between 0 and 100"; submission blocked | **PASS** |
| **DM-08** | Dustbin Management | Enter non-integer / decimal fill (e.g. `45.5`) | Strict integer regex & validator reject; submission blocked | Rejected (non-integer); input validation badge and toast alert display | **PASS** |
| **DM-09** | Dustbin Management | Add bin at invalid campus graph vertex `OffCampusSite` | Vertex existence check fails against `CAMPUS_GRAPH`; blocked | Form validation rejects non-existent graph node; submission blocked | **PASS** |
| **DM-10** | Dustbin Management (Manual) | Edit `B05` fill to `80%` and delete `B05` after confirmation | Record removed from memory & localStorage; UI refreshed | Confirmation dialog prompted; `B05` removed from tables, dropdowns, and summaries | **PASS** |
| **COA-01** | COA Binary Lab | Decimal `5` to 7-bit binary | Padded binary `"0000101"` | Output: `"0000101"`; 3 division steps rendered; padded with 4 leading zeros | **PASS** |
| **COA-02** | COA Binary Lab | Decimal `10` to 7-bit binary | Padded binary `"0001010"` | Output: `"0001010"`; 4 division steps rendered; padded with 3 leading zeros | **PASS** |
| **COA-03** | COA Binary Lab | Decimal `75` to 7-bit binary | Padded binary `"1001011"` | Output: `"1001011"`; 7 division steps rendered; exactly 7 bits | **PASS** |
| **COA-04** | COA Binary Lab | Decimal `100` to 7-bit binary | Padded binary `"1100100"` | Output: `"1100100"`; 7 division steps rendered; exactly 7 bits | **PASS** |
| **COA-05** | COA Binary Lab | Decimal `0` to 7-bit binary | Padded binary `"0000000"` | Output: `"0000000"`; single zero-quotient step; padded to 7 zeros | **PASS** |
| **COA-06** | COA Binary Lab | Binary `"1010"` to decimal | Decimal value `10` | Output: `10`; equation: `(1×2³) + (0×2²) + (1×2¹) + (0×2⁰) = 10` | **PASS** |
| **COA-07** | COA Binary Lab | Binary `"1001011"` to decimal | Decimal value `75` | Output: `75`; place-value formula computes exact decimal sum | **PASS** |
| **COA-08** | COA Binary Lab | Binary `"0000101"` to decimal | Decimal value `5` | Output: `5`; place-value contribution computed accurately | **PASS** |
| **COA-09** | COA Binary Lab | Empty binary input `""` | Input rejected with validation notice | `isValid: false`; calculation halted with error message | **PASS** |
| **COA-10** | COA Binary Lab | Invalid binary digits `"102"` | Input rejected with invalid character notice | `isValid: false`; calculation halted with invalid character warning | **PASS** |
| **COA-11** | COA Categorical | Boundary `24%` | Category: Low; 2-bit code: `00` | Code: `00`; Category: Low; badge: green | **PASS** |
| **COA-12** | COA Categorical | Boundary `25%` | Category: Moderate; 2-bit code: `01` | Code: `01`; Category: Moderate; badge: yellow | **PASS** |
| **COA-13** | COA Categorical | Boundary `49%` | Category: Moderate; 2-bit code: `01` | Code: `01`; Category: Moderate; badge: yellow | **PASS** |
| **COA-14** | COA Categorical | Boundary `50%` | Category: High; 2-bit code: `10` | Code: `10`; Category: High; badge: orange | **PASS** |
| **COA-15** | COA Categorical | Boundary `74%` | Category: High; 2-bit code: `10` | Code: `10`; Category: High; badge: orange | **PASS** |
| **COA-16** | COA Categorical | Boundary `75%` | Category: Critical; 2-bit code: `11` | Code: `11`; Category: Critical; badge: red | **PASS** |
| **COA-17** | COA Categorical | Boundary `100%` | Category: Critical; 2-bit code: `11` | Code: `11`; Category: Critical; badge: red | **PASS** |
| **COA-18** | COA Binary Lab | Decimal input `"45.5"` (non-integer) | Rejected as non-integer | `isValid: false`; strict integer check blocks conversion | **PASS** |
| **FLAT-01** | FLAT DFA Validator | Input `"B01"` | Final state $q_3 \in F$; Accepted | Final state: `q3`; banner: green ACCEPTED; trace: $q_0 \xrightarrow{B} q_1 \xrightarrow{0} q_2 \xrightarrow{1} q_3$ | **PASS** |
| **FLAT-02** | FLAT DFA Validator | Input `"B12"` | Final state $q_3 \in F$; Accepted | Final state: `q3`; banner: green ACCEPTED; trace: $q_0 \xrightarrow{B} q_1 \xrightarrow{1} q_2 \xrightarrow{2} q_3$ | **PASS** |
| **FLAT-03** | FLAT DFA Validator | Input `"B99"` | Final state $q_3 \in F$; Accepted | Final state: `q3`; banner: green ACCEPTED; trace: $q_0 \xrightarrow{B} q_1 \xrightarrow{9} q_2 \xrightarrow{9} q_3$ | **PASS** |
| **FLAT-04** | FLAT DFA Validator | Input `"X01"` | Final state $q_{\text{dead}} \notin F$; Rejected | Final state: `q_dead`; banner: red REJECTED; trace: $q_0 \xrightarrow{X} q_{\text{dead}}$ | **PASS** |
| **FLAT-05** | FLAT DFA Validator | Input `"B1"` | Final state $q_2 \notin F$; Rejected | Final state: `q2`; banner: red REJECTED; trace: $q_0 \xrightarrow{B} q_1 \xrightarrow{1} q_2$ | **PASS** |
| **FLAT-06** | FLAT DFA Validator | Input `"B123"` | Final state $q_{\text{dead}} \notin F$; Rejected | Final state: `q_dead`; banner: red REJECTED; excess symbol transitions $q_3 \xrightarrow{3} q_{\text{dead}}$ | **PASS** |
| **FLAT-07** | FLAT DFA Validator | Input `"B1A"` | Final state $q_{\text{dead}} \notin F$; Rejected | Final state: `q_dead`; banner: red REJECTED; non-digit transitions $q_2 \xrightarrow{A} q_{\text{dead}}$ | **PASS** |
| **FLAT-08** | FLAT DFA Validator | Input `"b01"` (lowercase) | Final state $q_{\text{dead}} \notin F$; Rejected | Final state: `q_dead`; banner: red REJECTED; lowercase 'b' transitions $q_0 \xrightarrow{b} q_{\text{dead}}$ | **PASS** |
| **FLAT-09** | FLAT DFA Validator | Input `""` (Empty string) | Final state $q_0 \notin F$; Rejected | Final state: `q0`; banner: red REJECTED; empty string remains in start state | **PASS** |
| **FLAT-10** | FLAT DFA Validator | DFA transition trace for `"B01"` | Trace length 3 steps; ends in $q_3$ | Exactly 3 trace steps recorded; terminating state is $q_3$ | **PASS** |
| **FLAT-11** | FLAT DFA Validator | DFA trap transition trace for `"X01"` | Transition 1 goes to $q_{\text{dead}}$ | Step 1 records transition $q_0 \xrightarrow{X} q_{\text{dead}}$ | **PASS** |
| **DAA-01** | DAA Route Planner | Calculate route `Library` $\to$ `Library` | Path: `['Library']`; Edge count: `0` | Route: `Library`; Edge count: `0 Edges`; no lines highlighted on SVG | **PASS** |
| **DAA-02** | DAA Route Planner | Calculate route `Main Gate` $\to$ `Admin Block` | Path: `['Main Gate', 'Admin Block']`; Edge count: `1` | Route: `Main Gate → Admin Block`; Edge count: `1 Edge`; connecting line turns green | **PASS** |
| **DAA-03** | DAA Route Planner | Calculate route `Main Gate` $\to$ `Cafeteria` | Path of minimal edge length (`3` edges) | Route: `Main Gate → Admin Block → Academic Block → Cafeteria`; Edge count: `3 Edges` | **PASS** |
| **DAA-04** | DAA Route Planner | Consecutive edge adjacency check | Every consecutive pair $(u, v)$ has $v \in \text{CAMPUS\_GRAPH}[u]$ | Automated validation confirms all traversed edges exist in graph topology | **PASS** |
| **DAA-05** | DAA Route Planner | Edge count invariant check | $\text{edgeCount} = |\text{path}| - 1$ | 4 nodes on path $\implies$ exactly 3 edges ($4 - 1 = 3$) | **PASS** |
| **DAA-06** | DAA Route Planner | Recommendation from `Main Gate` with default demo bins | Select nearest Critical bin: `B04` (`Sports Ground`, 2 edges) | Selected: `B04` (`Sports Ground`); route: `Main Gate → Parking Area → Sports Ground` (2 edges) | **PASS** |
| **DAA-07** | DAA Route Planner | Recommendation tie-breaker 1: Higher fill % at same distance | Choose `B11` (95%) over `B10` (80%) | `B11` selected as top target due to higher urgency fill percentage | **PASS** |
| **DAA-08** | DAA Route Planner | Recommendation tie-breaker 2: Lexicographical ID tie-break | Choose `B10` over `B12` (both 90%, 1 edge) | `B10` selected via lexicographical comparison | **PASS** |
| **DAA-09** | DAA Route Planner | Dynamic recommendation change: Update `B04` to `20%` (Low) | Recommendation shifts to next eligible Critical bin `B02` (Cafeteria) | Target shifts to `B02` (Cafeteria, 3 edges, 92% Critical) | **PASS** |
| **DAA-10** | DAA Route Planner | BFS unreachable / non-existent target handling | `reachable: false`, `edgeCount: -1` | Algorithm returns `reachable: false` and safely prevents traversal crashes | **PASS** |
| **PER-01** | Persistence (Manual) | Add new bin `B06` and refresh page | Bin `B06` persists in localStorage across refresh | `B06` restored from `smartCampusWasteBins` key on page reload | **PASS** |
| **PER-02** | Persistence (Manual) | Update fill level and refresh page | Updated fill value persists in localStorage | Modified fill percentage restored on page reload | **PASS** |
| **PER-03** | Persistence (Manual) | Click "Reset Demo Data" and confirm | All 5 initial demo bins restored | Confirmation prompt displayed; demo dataset `B01`–`B05` successfully restored | **PASS** |
| **RES-01** | Responsive UI (Manual) | View on Desktop display ($\ge 1200\text{px}$) | Clean multi-column card grid, sidebar/two-column layouts | Two-column grid active; wide SVG canvas displayed without distortion | **PASS** |
| **RES-02** | Responsive UI (Manual) | View on Mobile viewport ($\le 768\text{px}$) | Layout collapses to single column; horizontal table scroll | Grids collapse to single-column; navigation tabs scroll horizontally; zero layout break | **PASS** |
| **ERR-01** | Robustness (Manual) | Check browser console during full execution | Zero unhandled runtime exceptions or warnings | Clean console output; zero uncaught exceptions | **PASS** |

---

## 2. In-App Automated Test Suite Verification

To enable instant verification by evaluators, an in-app test runner is built directly into [`index.html`](index.html) and [`script.js`](script.js).

* **How to run:** Navigate to the **"ℹ️ About Project"** tab and click **"Run All Automated Unit Tests"**.
* **Test Suite Composition:**
  - **Dustbin Management (DM-01 to DM-09):** 9 automated assertions
  - **Computer Organization & Architecture (COA-01 to COA-18):** 18 automated assertions
  - **Formal Language & Automata Theory (FLAT-01 to FLAT-11):** 11 automated assertions
  - **Design & Analysis of Algorithms (DAA-01 to DAA-10):** 10 automated assertions
* **Observed In-App Output:**
  - Total Tests Executed: **48**
  - Total Tests Passed: **48**
  - Total Tests Failed: **0**
  - Pass Rate: **100%**

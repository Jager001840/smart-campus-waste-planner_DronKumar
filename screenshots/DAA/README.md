# DAA Screenshots Directory

## Environment & Capture Status
* **Status:** Manual Capture Guide & Placeholder Specifications
* **Student Developer:** Dron Kumar Singh
* **Module:** Design & Analysis of Algorithms (DAA)
* **Application Path:** `smart-campus-waste-planner/index.html`

In the current CLI/agent sandbox environment, headless browser screenshot automation tools were restricted due to terminal command execution permissions. In strict accordance with the project integrity guidelines ("Do not fabricate screenshots... provide the exact manual capture instructions"), this document details the exact reproducible manual steps to capture and save the required DAA screenshots from the running application.

---

## Required Screenshots & Capture Procedures

### 1. `daa-01-route-planner-setup.png` (or `01_route_planner_controls.png`)
* **Target Feature:** 11.3 Route Planner Controls Panel
* **Steps to Capture:**
  1. Open `index.html` in your web browser.
  2. Click on the **"🗺️ DAA — Collection Route Planner"** navigation tab.
  3. Locate the **"11.3 Route Planner Controls"** panel.
  4. Select `Main Gate` in the "Worker Starting Campus Location" dropdown, and select `B02 — Cafeteria (92% Fill)` in the target dropdown.
  5. Capture the controls panel showing the dropdowns and action buttons ("Calculate Shortest Route (BFS)", "Recommend Next Collection Target", "Clear Route Display").
  6. Save as: `screenshots/DAA/daa-01-route-planner-setup.png` (and/or `screenshots/DAA/01_route_planner_controls.png`).

---

### 2. `daa-02-calculated-route-svg.png` (or `02_bfs_calculated_route_graph.png`)
* **Target Feature:** 11.4 & 11.6 BFS Route Calculation and Interactive SVG Canvas
* **Steps to Capture:**
  1. With `Main Gate` as source and `B02` (Cafeteria) as target, click the **"Calculate Shortest Route (BFS)"** button.
  2. Scroll to the **"11.6 Interactive Campus Graph Visualization"** panel.
  3. Verify that:
     - `Main Gate` is styled as a blue source node.
     - `Cafeteria` is styled as a red target node.
     - The path edges between `Main Gate` $\to$ `Admin Block` $\to$ `Academic Block` $\to$ `Cafeteria` are prominently highlighted in thick green glowing stroke (`.edge-route`).
  4. Also capture the **"11.4 BFS Calculated Route Output"** card displaying `3 Edges`, vertices count, and traversal order.
  5. Save as: `screenshots/DAA/daa-02-calculated-route-svg.png` (and/or `screenshots/DAA/02_bfs_calculated_route_graph.png`).

---

### 3. `daa-03-next-target-recommendation.png` (or `03_recommended_next_target.png`)
* **Target Feature:** 11.5 Next Collection Target Recommendation Engine
* **Steps to Capture:**
  1. In the **"🗺️ DAA — Collection Route Planner"** tab, set starting location to `Main Gate`.
  2. Click the **"Recommend Next Collection Target"** button.
  3. Locate the **"11.5 Target Recommendation Engine"** panel.
  4. Verify that target `B04` (Sports Ground, 100% Critical) is selected, requiring only $2$ graph edges from Main Gate (via Parking Area), with the detailed academic justification explaining why it was chosen over farther Critical bins (`B01` and `B02`).
  5. Capture this card.
  6. Save as: `screenshots/DAA/daa-03-next-target-recommendation.png` (and/or `screenshots/DAA/03_recommended_next_target.png`).

---

### 4. `daa-04-alternate-route.png` (or `04_alternative_route_test.png`)
* **Target Feature:** BFS Verification on Alternative Graph Nodes
* **Steps to Capture:**
  1. In the starting location dropdown, select `Sports Ground`.
  2. Select `B05 — Admin Block (20% Fill)` as target.
  3. Click **"Calculate Shortest Route (BFS)"**.
  4. Capture the calculated route card and SVG graph showing the path from `Sports Ground` to `Admin Block` (via `Library`, 2 edges).
  5. Save as: `screenshots/DAA/daa-04-alternate-route.png` (and/or `screenshots/DAA/04_alternative_route_test.png`).

---

### 5. `daa-05-test-results.png`
* **Target Feature:** BFS Verification & Invariant Testing Matrix
* **Steps to Capture:**
  1. Click on the **"ℹ️ About Project"** navigation tab.
  2. Scroll down to the **"In-App Automated Verification Test Suite"** section.
  3. Click **"Run All Automated Unit Tests"** (or view the automated run).
  4. Capture the test results table showing all 10 DAA assertions (`DAA-01` through `DAA-10`) passing, demonstrating zero-edge source=target, hop counts, consecutive edge existence, and tie-breaking.
  5. Save as: `screenshots/DAA/daa-05-test-results.png`.

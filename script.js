/**
 * SMART CAMPUS WASTE MONITORING & COLLECTION ROUTE PLANNER
 * Student Developer: Dron Kumar Singh
 * Project Title: Smart Campus Waste Monitoring & Collection Route Planner
 * Integration: COA (Computer Organization & Architecture),
 *              FLAT (Formal Language & Automata Theory),
 *              DAA (Design & Analysis of Algorithms)
 * Architecture: Vanilla JavaScript, LocalStorage, SVG Visualization
 */

// =============================================================================
// 1. DATA STRUCTURES & CONSTANTS
// =============================================================================

const STORAGE_KEY = 'smartCampusWasteBins';

/**
 * Campus Graph: 8 Vertices representing physical locations.
 * Undirected Graph modeled via adjacency list.
 */
const CAMPUS_GRAPH = {
  'Main Gate': ['Admin Block', 'Parking Area'],
  'Admin Block': ['Main Gate', 'Academic Block', 'Library'],
  'Academic Block': ['Admin Block', 'Library', 'Cafeteria'],
  'Library': ['Admin Block', 'Academic Block', 'Cafeteria', 'Sports Ground'],
  'Cafeteria': ['Academic Block', 'Library', 'Hostel Block'],
  'Hostel Block': ['Cafeteria', 'Sports Ground'],
  'Sports Ground': ['Library', 'Hostel Block', 'Parking Area'],
  'Parking Area': ['Main Gate', 'Sports Ground']
};

/**
 * 2D Canvas Coordinates for SVG rendering of the Campus Graph.
 * Configured for clear readability on an 850 x 500 SVG canvas.
 */
const NODE_COORDINATES = {
  'Main Gate': { x: 90, y: 250 },
  'Admin Block': { x: 260, y: 130 },
  'Parking Area': { x: 250, y: 390 },
  'Academic Block': { x: 450, y: 90 },
  'Library': { x: 470, y: 240 },
  'Cafeteria': { x: 670, y: 110 },
  'Sports Ground': { x: 500, y: 400 },
  'Hostel Block': { x: 750, y: 260 }
};

/**
 * Default Demo Dustbins dataset as specified in project requirements:
 * B01: Hostel Block, 85%
 * B02: Cafeteria, 92%
 * B03: Library, 48%
 * B04: Sports Ground, 100%
 * B05: Admin Block, 20%
 */
const DEFAULT_DEMO_BINS = [
  { id: 'B01', location: 'Hostel Block', fillPercent: 85, lastUpdated: new Date().toISOString() },
  { id: 'B02', location: 'Cafeteria', fillPercent: 92, lastUpdated: new Date().toISOString() },
  { id: 'B03', location: 'Library', fillPercent: 48, lastUpdated: new Date().toISOString() },
  { id: 'B04', location: 'Sports Ground', fillPercent: 100, lastUpdated: new Date().toISOString() },
  { id: 'B05', location: 'Admin Block', fillPercent: 20, lastUpdated: new Date().toISOString() }
];

// Active Application State in Memory
let campusDustbins = [];
let activeBFSResult = null; // Stores currently calculated route for SVG highlighting

// =============================================================================
// 2. COA MODULE — NUMBER SYSTEMS & BINARY ENCODING
// =============================================================================

/**
 * Evaluates the categorical status and 2-bit status code for a fill percentage.
 * Category boundaries:
 * 0–24%: Low (00)
 * 25–49%: Moderate (01)
 * 50–74%: High (10)
 * 75–100%: Critical (11)
 *
 * @param {number} fill - Integer fill percentage 0 to 100
 * @returns {Object} Category information
 */
function getCategoryAndCode(fill) {
  if (fill === null || fill === undefined || String(fill).trim() === '') {
    return { category: 'Invalid', code: '--', badgeClass: 'badge-pending', priority: 99, label: 'Invalid' };
  }
  const str = String(fill).trim();
  if (!/^\d+$/.test(str)) {
    return { category: 'Invalid', code: '--', badgeClass: 'badge-pending', priority: 99, label: 'Invalid' };
  }
  const percent = Number(str);
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    return { category: 'Invalid', code: '--', badgeClass: 'badge-pending', priority: 99, label: 'Invalid' };
  }
  if (percent >= 75) {
    return { category: 'Critical', code: '11', badgeClass: 'badge-critical', priority: 1, label: 'Critical (11)' };
  } else if (percent >= 50) {
    return { category: 'High', code: '10', badgeClass: 'badge-high', priority: 2, label: 'High (10)' };
  } else if (percent >= 25) {
    return { category: 'Moderate', code: '01', badgeClass: 'badge-moderate', priority: 3, label: 'Moderate (01)' };
  } else {
    return { category: 'Low', code: '00', badgeClass: 'badge-low', priority: 4, label: 'Low (00)' };
  }
}

/**
 * 9.2 Decimal-to-Binary Conversion using Repeated Division by 2.
 * Strictly verifies that input is a non-negative integer in [0, 100].
 * Pads the resulting binary string to exactly 7 bits (covers 0 to 127).
 *
 * @param {number|string} decInput - Integer value between 0 and 100
 * @returns {Object} Detailed conversion steps and 7-bit binary string
 */
function decimalTo7BitBinary(decInput) {
  if (decInput === null || decInput === undefined || String(decInput).trim() === '') {
    return { isValid: false, error: 'Input must be an integer between 0 and 100.' };
  }

  const str = String(decInput).trim();
  if (!/^\d+$/.test(str)) {
    return { isValid: false, error: 'Input must be a whole non-negative integer without decimal points or letters.' };
  }

  const n = Number(str);
  if (!Number.isInteger(n) || n < 0 || n > 100) {
    return { isValid: false, error: 'Input must be an integer between 0 and 100.' };
  }

  const steps = [];
  let temp = n;

  if (temp === 0) {
    steps.push({
      stepNumber: 1,
      dividend: 0,
      divisor: 2,
      quotient: 0,
      remainder: 0
    });
  } else {
    let stepCount = 1;
    while (temp > 0) {
      const quotient = Math.floor(temp / 2);
      const remainder = temp % 2;
      steps.push({
        stepNumber: stepCount++,
        dividend: temp,
        divisor: 2,
        quotient: quotient,
        remainder: remainder
      });
      temp = quotient;
    }
  }

  // Raw binary is remainders read in reverse (bottom to top)
  const rawBinary = steps.map(s => s.remainder).reverse().join('');
  const paddedBinary = rawBinary.padStart(7, '0');

  return {
    isValid: true,
    decimalValue: n,
    rawBinary: rawBinary,
    paddedBinary: paddedBinary,
    steps: steps
  };
}

/**
 * 9.3 Binary-to-Decimal Conversion using Place-Value Expansion.
 * Evaluates place values from 2^(len-1) down to 2^0 using textbook superscript exponents.
 *
 * @param {string} binStr - Binary string containing only '0' and '1', max 7 bits
 * @returns {Object} Decimal value, step-by-step breakdown, and formula
 */
function binaryToDecimal(binStr) {
  if (typeof binStr !== 'string' && typeof binStr !== 'number') {
    return { isValid: false, error: 'Input must be a valid binary string or number.' };
  }

  const trimmed = String(binStr).trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Binary input string cannot be empty.' };
  }
  if (trimmed.length > 7) {
    return { isValid: false, error: 'Input exceeds maximum allowed length of 7 bits.' };
  }
  if (!/^[01]+$/.test(trimmed)) {
    return { isValid: false, error: 'Input contains invalid characters. Only 0 and 1 are permitted.' };
  }

  const SUPERSCRIPTS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷'];
  let decimalSum = 0;
  const breakdown = [];
  const formulaParts = [];
  const length = trimmed.length;

  for (let i = 0; i < length; i++) {
    const bitChar = trimmed[i];
    const bitVal = parseInt(bitChar, 10);
    const power = length - 1 - i;
    const placeValue = Math.pow(2, power);
    const contribution = bitVal * placeValue;
    decimalSum += contribution;

    breakdown.push({
      bitIndex: power,
      bit: bitVal,
      placeValue: placeValue,
      contribution: contribution
    });

    const sup = SUPERSCRIPTS[power] !== undefined ? SUPERSCRIPTS[power] : `^${power}`;
    formulaParts.push(`${bitVal} × 2${sup}`);
  }

  const equationStr = `${trimmed}₂ = ${formulaParts.join(' + ')} = ${decimalSum}₁₀`;

  return {
    isValid: true,
    binaryString: trimmed,
    decimalValue: decimalSum,
    breakdown: breakdown,
    equationStr: equationStr
  };
}

// =============================================================================
// 3. FLAT MODULE — DETERMINISTIC FINITE AUTOMATON (DFA)
// =============================================================================

/**
 * Formal DFA 5-Tuple Definition:
 * M = (Q, Sigma, delta, q0, F)
 * Language: L = { Bdd | d in {0..9} }
 * States:
 *  - q0: Start state
 *  - q1: Read uppercase 'B'
 *  - q2: Read first decimal digit
 *  - q3: Read second decimal digit (ACCEPTING STATE in F)
 *  - q_dead: Trap / Dead state (NON-ACCEPTING)
 */
const DFA_STATES = {
  START: 'q0',
  SAW_B: 'q1',
  SAW_DIGIT1: 'q2',
  ACCEPTED: 'q3',
  DEAD: 'q_dead'
};

/**
 * Formal Transition Function delta: Q x Sigma -> Q
 *
 * @param {string} state - Current DFA state
 * @param {string} symbol - Current single input character
 * @returns {string} Next DFA state
 */
function dfaTransition(state, symbol) {
  switch (state) {
    case 'q0':
      if (symbol === 'B') return 'q1';
      return 'q_dead';

    case 'q1':
      if (symbol >= '0' && symbol <= '9') return 'q2';
      return 'q_dead';

    case 'q2':
      if (symbol >= '0' && symbol <= '9') return 'q3';
      return 'q_dead';

    case 'q3':
      // Excess characters beyond 3 symbols transition to trap state
      return 'q_dead';

    case 'q_dead':
    default:
      // Self-loop on dead state for any character
      return 'q_dead';
  }
}

/**
 * Explains the semantics of a DFA state for first-year CS understanding.
 *
 * @param {string} state
 * @returns {string} Friendly explanation
 */
function getDFAStateMeaning(state) {
  switch (state) {
    case 'q0': return 'Start state (Awaiting initial character)';
    case 'q1': return "Prefix 'B' successfully validated";
    case 'q2': return 'First decimal digit successfully validated';
    case 'q3': return 'Second decimal digit validated (Accepting state)';
    case 'q_dead': return 'Trap / Dead state (Syntax rule violated)';
    default: return 'Unknown state';
  }
}

/**
 * Runs the Deterministic Finite Automaton symbol-by-symbol over an input string.
 * Records the exact execution trace for transparency and educational visualization.
 *
 * @param {string} input - Dustbin ID string to validate
 * @returns {Object} Acceptance result, final state, and trace steps
 */
function runDFA(input) {
  const str = input === null || input === undefined ? '' : String(input);
  const trace = [];
  let currentState = DFA_STATES.START;

  // Empty string handling
  if (str.length === 0) {
    return {
      isValid: false,
      finalState: DFA_STATES.START,
      isAccepted: false,
      trace: [{
        step: 0,
        fromState: 'q0',
        symbol: 'ε (Empty)',
        rule: 'No symbols to consume',
        toState: 'q0',
        meaning: 'String is empty. Machine remains in start state q0 ∉ F.'
      }],
      explanation: 'Empty string is rejected because the DFA remains in start state q0 (not in F).'
    };
  }

  // Step-by-step state transition loop
  for (let i = 0; i < str.length; i++) {
    const symbol = str[i];
    const nextState = dfaTransition(currentState, symbol);
    
    let ruleDesc = `δ(${currentState}, '${symbol}') → ${nextState}`;
    trace.push({
      step: i + 1,
      fromState: currentState,
      symbol: symbol,
      rule: ruleDesc,
      toState: nextState,
      meaning: getDFAStateMeaning(nextState)
    });

    currentState = nextState;
  }

  const isAccepted = (currentState === DFA_STATES.ACCEPTED);
  let explanation = '';

  if (isAccepted) {
    explanation = `The string '${str}' matches the format 'B' followed by exactly 2 decimal digits. The DFA terminates in accepting state q3 ∈ F.`;
  } else {
    if (currentState === DFA_STATES.DEAD) {
      explanation = `The string '${str}' violated language rules and reached trap state q_dead ∉ F.`;
    } else {
      explanation = `The string '${str}' is incomplete and halted in non-accepting state ${currentState} ∉ F.`;
    }
  }

  return {
    isValid: isAccepted,
    finalState: currentState,
    isAccepted: isAccepted,
    trace: trace,
    explanation: explanation
  };
}

// =============================================================================
// 4. DAA MODULE — BREADTH-FIRST SEARCH & TARGET RECOMMENDATION
// =============================================================================

/**
 * 11.4 Breadth-First Search (BFS) implementation on an unweighted undirected graph.
 * Explores layer by layer to guarantee discovery of a path with the minimum number of edges.
 *
 * @param {Object} graph - Adjacency list
 * @param {string} startNode - Source campus vertex
 * @param {string} targetNode - Destination campus vertex
 * @returns {Object} Shortest path, edge count, visited nodes sequence, and reachability
 */
function bfsShortestPath(graph, startNode, targetNode) {
  if (!graph[startNode] || !graph[targetNode]) {
    return {
      reachable: false,
      path: [],
      edgeCount: -1,
      visitedOrder: [],
      error: 'Start or target vertex does not exist in graph.'
    };
  }

  // Edge case: Start and target are identical (0-edge path)
  if (startNode === targetNode) {
    return {
      reachable: true,
      path: [startNode],
      edgeCount: 0,
      visitedOrder: [startNode]
    };
  }

  const queue = [startNode];
  const visited = new Set([startNode]);
  const parent = new Map();
  const visitedOrder = [];
  let found = false;

  while (queue.length > 0) {
    const current = queue.shift(); // FIFO Queue Dequeue
    visitedOrder.push(current);

    if (current === targetNode) {
      found = true;
      break;
    }

    const neighbors = graph[current] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, current);
        queue.push(neighbor); // Enqueue newly discovered neighbor
      }
    }
  }

  if (!found) {
    return {
      reachable: false,
      path: [],
      edgeCount: -1,
      visitedOrder: visitedOrder
    };
  }

  // Path reconstruction by backtracking parent links
  const path = [];
  let curr = targetNode;
  while (curr !== undefined) {
    path.push(curr);
    curr = parent.get(curr);
  }
  path.reverse(); // Convert backward path into forward sequence

  return {
    reachable: true,
    path: path,
    edgeCount: path.length - 1,
    visitedOrder: visitedOrder
  };
}

/**
 * 11.5 Next Collection Target Recommendation Algorithm.
 * Implements strict multi-tier educational tie-breaking rules:
 * 1. Critical bins first (>= 75%).
 * 2. High bins second (50%–74%).
 * 3. If neither exist: notify user that no urgent collection is needed.
 * 4. Run BFS from worker location to all candidates; discard unreachable ones.
 * 5. Minimum edge count (fewest hops).
 * 6. Tie-breaker 1: Higher fill percentage.
 * 7. Tie-breaker 2: Lexicographically smallest ID.
 *
 * @param {Array} binsList - Array of registered campus dustbin records
 * @param {string} workerLocation - Current starting vertex of collection staff
 * @returns {Object} Recommendation result with selected dustbin, BFS path, and rationale
 */
function recommendNextCollectionTarget(binsList, workerLocation) {
  if (!binsList || binsList.length === 0) {
    return {
      status: 'EMPTY',
      message: 'No dustbins are currently registered on campus.'
    };
  }

  // Partition bins into Critical and High categories
  const criticalBins = binsList.filter(b => b.fillPercent >= 75);
  const highBins = binsList.filter(b => b.fillPercent >= 50 && b.fillPercent < 75);

  let candidatePool = [];
  let priorityCategory = '';

  if (criticalBins.length > 0) {
    candidatePool = criticalBins;
    priorityCategory = 'Critical';
  } else if (highBins.length > 0) {
    candidatePool = highBins;
    priorityCategory = 'High';
  } else {
    return {
      status: 'NO_URGENT',
      message: 'All registered dustbins are currently at Low or Moderate capacity (under 50%). No urgent collection target is required.'
    };
  }

  // Evaluate BFS routes to all candidates
  const evaluatedCandidates = [];

  for (const bin of candidatePool) {
    const bfsResult = bfsShortestPath(CAMPUS_GRAPH, workerLocation, bin.location);
    if (bfsResult.reachable) {
      evaluatedCandidates.push({
        bin: bin,
        bfs: bfsResult
      });
    }
  }

  if (evaluatedCandidates.length === 0) {
    return {
      status: 'UNREACHABLE',
      message: `All urgent (${priorityCategory}) dustbins are unreachable from the current starting location: '${workerLocation}'.`
    };
  }

  // Sort candidates using strict tie-breaking logic
  evaluatedCandidates.sort((a, b) => {
    // Rule 1: Fewest edges (BFS hop count)
    if (a.bfs.edgeCount !== b.bfs.edgeCount) {
      return a.bfs.edgeCount - b.bfs.edgeCount;
    }
    // Rule 2: Higher fill percentage
    if (b.bin.fillPercent !== a.bin.fillPercent) {
      return b.bin.fillPercent - a.bin.fillPercent;
    }
    // Rule 3: Lexicographically smallest dustbin ID
    return a.bin.id.localeCompare(b.bin.id);
  });

  const best = evaluatedCandidates[0];

  return {
    status: 'RECOMMENDED',
    priorityCategory: priorityCategory,
    recommendedBin: best.bin,
    bfsResult: best.bfs,
    candidateCount: candidatePool.length,
    justification: `Selected ${best.bin.id} (${best.bin.location}) because it belongs to the ${priorityCategory} priority class (${best.bin.fillPercent}%), has the fewest graph edges from '${workerLocation}' (${best.bfs.edgeCount} edge${best.bfs.edgeCount === 1 ? '' : 's'}), and satisfies all secondary tie-breaking criteria.`
  };
}

// =============================================================================
// 5. STORAGE & CRUD MANAGEMENT
// =============================================================================

/**
 * Checks if localStorage is accessible in the current browser runtime.
 * Shows a persistent warning banner if storage is blocked or in private mode.
 *
 * @returns {boolean} True if storage is functional
 */
function checkLocalStorageAvailable() {
  try {
    const probeKey = '__campus_storage_probe__';
    localStorage.setItem(probeKey, probeKey);
    localStorage.removeItem(probeKey);
    return true;
  } catch (err) {
    const banner = document.getElementById('storage-alert-banner');
    if (banner) {
      banner.style.display = 'flex';
    }
    console.warn('LocalStorage unavailable or restricted:', err);
    return false;
  }
}

/**
 * Validates a single dustbin record against all system requirements:
 * 1. FLAT DFA verification on ID
 * 2. Uniqueness check against existing campus records
 * 3. Campus graph location existence
 * 4. Whole integer fill percentage in [0, 100]
 *
 * @param {Object} bin - Candidate dustbin record { id, location, fillPercent }
 * @param {Array} existingList - Current list of registered bins
 * @param {string} mode - 'add' or 'edit'
 * @param {string} originalId - ID prior to editing
 * @returns {Object} { isValid, error, dfaResult }
 */
function validateDustbinRecord(bin, existingList = campusDustbins, mode = 'add', originalId = '') {
  if (!bin || typeof bin !== 'object') {
    return { isValid: false, error: 'Dustbin record must be a valid object.' };
  }

  // 1. FLAT DFA Validation
  const idStr = String(bin.id || '').trim();
  const dfaResult = runDFA(idStr);
  if (!dfaResult.isAccepted) {
    return {
      isValid: false,
      error: `Invalid Dustbin ID '${idStr}': Terminated in state ${dfaResult.finalState}. Must be uppercase 'B' followed by exactly 2 decimal digits (e.g. B01, B12).`,
      dfaResult: dfaResult
    };
  }

  // 2. Uniqueness Check
  const duplicate = existingList.find(b => b.id === idStr);
  if (duplicate && (mode === 'add' || idStr !== originalId)) {
    return {
      isValid: false,
      error: `Dustbin ID '${idStr}' is already registered on campus. IDs must be unique.`,
      dfaResult: dfaResult
    };
  }

  // 3. Location Validity
  const locStr = String(bin.location || '').trim();
  if (!CAMPUS_GRAPH[locStr]) {
    return {
      isValid: false,
      error: `Invalid campus location '${locStr}'. Location must match one of the 8 canonical campus graph vertices.`,
      dfaResult: dfaResult
    };
  }

  // 4. Fill Percentage Strict Integer Validation
  if (bin.fillPercent === null || bin.fillPercent === undefined || String(bin.fillPercent).trim() === '') {
    return {
      isValid: false,
      error: 'Fill percentage is required and must be an integer between 0 and 100.',
      dfaResult: dfaResult
    };
  }

  const fillStr = String(bin.fillPercent).trim();
  if (!/^\d+$/.test(fillStr)) {
    return {
      isValid: false,
      error: 'Fill percentage must be a whole non-negative integer without decimal points or non-numeric characters.',
      dfaResult: dfaResult
    };
  }

  const fillNum = Number(fillStr);
  if (!Number.isInteger(fillNum) || fillNum < 0 || fillNum > 100) {
    return {
      isValid: false,
      error: 'Fill percentage must be an integer between 0 and 100.',
      dfaResult: dfaResult
    };
  }

  return {
    isValid: true,
    error: null,
    dfaResult: dfaResult,
    sanitized: {
      id: idStr,
      location: locStr,
      fillPercent: fillNum
    }
  };
}

/**
 * Initializes campus dustbins from localStorage or default demo dataset.
 * Robustly preserves valid records even if an individual record is malformed.
 */
function initStorage() {
  checkLocalStorageAvailable();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      campusDustbins = JSON.parse(JSON.stringify(DEFAULT_DEMO_BINS));
      saveToStorage();
      return;
    }

    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Validate individual records: do not erase all valid records if one is malformed
      const validBins = [];
      const seenIds = new Set();

      parsed.forEach(b => {
        if (!b || typeof b !== 'object') return;
        const dfaCheck = runDFA(b.id);
        const validLoc = !!CAMPUS_GRAPH[b.location];
        const validFill = typeof b.fillPercent === 'number' && Number.isInteger(b.fillPercent) && b.fillPercent >= 0 && b.fillPercent <= 100;
        if (dfaCheck.isAccepted && validLoc && validFill && !seenIds.has(b.id)) {
          seenIds.add(b.id);
          validBins.push({
            id: b.id,
            location: b.location,
            fillPercent: b.fillPercent,
            lastUpdated: b.lastUpdated || new Date().toISOString()
          });
        }
      });

      if (validBins.length > 0) {
        campusDustbins = validBins;
        if (validBins.length < parsed.length) {
          console.warn(`Pruned ${parsed.length - validBins.length} malformed dustbin record(s) from persistent storage.`);
          saveToStorage();
        }
      } else {
        campusDustbins = JSON.parse(JSON.stringify(DEFAULT_DEMO_BINS));
        saveToStorage();
      }
    } else {
      campusDustbins = JSON.parse(JSON.stringify(DEFAULT_DEMO_BINS));
      saveToStorage();
    }
  } catch (err) {
    console.warn('LocalStorage read error or corrupt JSON, loading default demo records:', err);
    campusDustbins = JSON.parse(JSON.stringify(DEFAULT_DEMO_BINS));
    saveToStorage();
  }
}

/**
 * Saves current in-memory dustbin records to localStorage.
 */
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campusDustbins));
  } catch (err) {
    console.error('LocalStorage write failed:', err);
    showToast('Failed to write to browser localStorage. In-memory state preserved.', 'error');
  }
}

/**
 * Loads default demo campus dustbins, confirming if custom modifications exist.
 */
function loadDemoData() {
  const currentDemoIds = DEFAULT_DEMO_BINS.map(b => `${b.id}-${b.fillPercent}`).sort().join(',');
  const activeIds = campusDustbins.map(b => `${b.id}-${b.fillPercent}`).sort().join(',');
  if (currentDemoIds === activeIds) {
    showToast('Default campus demo dataset (B01–B05) is already loaded.', 'info');
    return;
  }

  if (confirm('Load the 5 standard campus demo dustbins? Current dustbin records will be replaced.')) {
    campusDustbins = JSON.parse(JSON.stringify(DEFAULT_DEMO_BINS));
    saveToStorage();
    renderAllViews();
    showToast('Standard demo campus dustbins loaded successfully.', 'info');
  }
}

/**
 * Resets all campus dustbins back to factory demo defaults after explicit confirmation.
 */
function resetDemoData() {
  if (confirm('Are you sure you want to reset all campus dustbin data back to factory demo defaults? All custom changes will be permanently discarded.')) {
    campusDustbins = JSON.parse(JSON.stringify(DEFAULT_DEMO_BINS));
    saveToStorage();
    renderAllViews();
    showToast('Dustbin telemetry reset to default demo records.', 'info');
  }
}

// =============================================================================
// 6. UI RENDERING & COMPONENT SYNCHRONIZATION
// =============================================================================

/**
 * Renders all views, overview tables, KPI summary cards, and inspector panels.
 */
function renderAllViews() {
  renderSummaryCards();
  renderPriorityList();
  renderDashboardTable();
  renderManagementTable();
  renderCOATelemetryTable();
  populateRoutePlannerDropdowns();
  renderCampusGraphSVG();
}

/**
 * 7.1 Updates the 4 Summary KPI Cards dynamically.
 */
function renderSummaryCards() {
  const total = campusDustbins.length;
  let critical = 0;
  let high = 0;
  let low = 0;

  campusDustbins.forEach(bin => {
    if (bin.fillPercent >= 75) critical++;
    else if (bin.fillPercent >= 50) high++;
    else if (bin.fillPercent <= 24) low++;
  });

  const elTotal = document.getElementById('stat-total-bins');
  const elCrit = document.getElementById('stat-critical-bins');
  const elHigh = document.getElementById('stat-high-bins');
  const elLow = document.getElementById('stat-low-bins');

  if (elTotal) elTotal.textContent = total;
  if (elCrit) elCrit.textContent = critical;
  if (elHigh) elHigh.textContent = high;
  if (elLow) elLow.textContent = low;
}

/**
 * 7.3 Priority Attention List.
 * Sorts bins: Critical first -> High second -> Fill % desc -> ID tie breaker.
 */
function renderPriorityList() {
  const container = document.getElementById('priority-list-container');
  const badge = document.getElementById('priority-count-badge');
  if (!container) return;

  const urgentBins = campusDustbins.filter(b => b.fillPercent >= 50);

  // Sorting logic
  urgentBins.sort((a, b) => {
    const aCrit = a.fillPercent >= 75;
    const bCrit = b.fillPercent >= 75;
    if (aCrit && !bCrit) return -1;
    if (!aCrit && bCrit) return 1;
    if (b.fillPercent !== a.fillPercent) return b.fillPercent - a.fillPercent;
    return a.id.localeCompare(b.id);
  });

  if (badge) {
    badge.textContent = `${urgentBins.length} urgent bin${urgentBins.length === 1 ? '' : 's'}`;
  }

  if (urgentBins.length === 0) {
    container.innerHTML = `
      <div class="empty-priority-card">
        <div class="empty-icon">✅</div>
        <h4>All Dustbins Within Safe Capacity</h4>
        <p>No Critical (75–100%) or High-fill (50–74%) dustbins currently require urgent collection attention.</p>
      </div>
    `;
    return;
  }

  let html = '<div class="priority-grid">';
  urgentBins.forEach(bin => {
    const cat = getCategoryAndCode(bin.fillPercent);
    const coaBin = decimalTo7BitBinary(bin.fillPercent);
    const isCrit = bin.fillPercent >= 75;

    html += `
      <div class="priority-card ${isCrit ? 'critical' : 'high'}">
        <div class="priority-card-header">
          <span class="priority-bin-id">${escapeHTML(bin.id)}</span>
          <span class="badge ${cat.badgeClass}">${cat.label}</span>
        </div>
        <div class="priority-location">📍 ${escapeHTML(bin.location)}</div>
        <div class="priority-progress-bar">
          <div class="priority-progress-fill ${isCrit ? 'fill-critical' : 'fill-high'}" style="width: ${bin.fillPercent}%;"></div>
        </div>
        <div class="priority-card-footer">
          <span>7-Bit: <code>${coaBin.paddedBinary}</code></span>
          <span>Fill: <strong>${bin.fillPercent}%</strong></span>
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

/**
 * 7.2 Dashboard Overview Table.
 */
function renderDashboardTable() {
  const tbody = document.getElementById('dashboard-table-body');
  if (!tbody) return;

  if (campusDustbins.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No dustbins registered yet. Use the "Add Dustbin" button to create one.</td></tr>`;
    return;
  }

  let html = '';
  campusDustbins.forEach(bin => {
    const cat = getCategoryAndCode(bin.fillPercent);
    const coaBin = decimalTo7BitBinary(bin.fillPercent);
    const formattedDate = new Date(bin.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    html += `
      <tr>
        <td><strong>${escapeHTML(bin.id)}</strong></td>
        <td>${escapeHTML(bin.location)}</td>
        <td><strong>${bin.fillPercent}%</strong></td>
        <td><code>${coaBin.paddedBinary}</code></td>
        <td><code>${cat.code}</code></td>
        <td><span class="badge ${cat.badgeClass}">${cat.category}</span></td>
        <td>${formattedDate}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline btn-edit-bin" data-id="${escapeHTML(bin.id)}">Edit</button>
            <button class="btn btn-sm btn-outline btn-route-to-bin" data-id="${escapeHTML(bin.id)}" data-loc="${escapeHTML(bin.location)}">Route</button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * 8. Dustbin Management Table with Search, Filter & Sort.
 */
function renderManagementTable() {
  const tbody = document.getElementById('management-table-body');
  if (!tbody) return;

  const searchInput = document.getElementById('management-search');
  const filterSelect = document.getElementById('filter-status');
  const sortSelect = document.getElementById('sort-by');

  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const filterStatus = filterSelect ? filterSelect.value : 'ALL';
  const sortBy = sortSelect ? sortSelect.value : 'id-asc';

  let filtered = campusDustbins.filter(bin => {
    const matchesSearch = bin.id.toLowerCase().includes(searchTerm) || bin.location.toLowerCase().includes(searchTerm);
    if (!matchesSearch) return false;

    if (filterStatus === 'ALL') return true;
    const cat = getCategoryAndCode(bin.fillPercent);
    return cat.category === filterStatus;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === 'id-asc') return a.id.localeCompare(b.id);
    if (sortBy === 'id-desc') return b.id.localeCompare(a.id);
    if (sortBy === 'fill-asc') return a.fillPercent - b.fillPercent;
    if (sortBy === 'fill-desc') return b.fillPercent - a.fillPercent;
    return 0;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No dustbins match the current search or filter criteria.</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach(bin => {
    const cat = getCategoryAndCode(bin.fillPercent);
    const coaBin = decimalTo7BitBinary(bin.fillPercent);
    const formattedDate = new Date(bin.lastUpdated).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    html += `
      <tr>
        <td><strong>${escapeHTML(bin.id)}</strong></td>
        <td>${escapeHTML(bin.location)}</td>
        <td>${bin.fillPercent}%</td>
        <td><span class="badge ${cat.badgeClass}">${cat.category}</span></td>
        <td><code>${cat.code}</code></td>
        <td><code>${coaBin.paddedBinary}</code></td>
        <td>${formattedDate}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline btn-edit-bin" data-id="${escapeHTML(bin.id)}">Edit</button>
            <button class="btn btn-sm btn-danger-sm btn-delete-bin" data-id="${escapeHTML(bin.id)}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * 9.1 COA Telemetry Inspector Table.
 */
function renderCOATelemetryTable() {
  const tbody = document.getElementById('coa-telemetry-table-body');
  if (!tbody) return;

  if (campusDustbins.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No active dustbin records.</td></tr>`;
    return;
  }

  let html = '';
  campusDustbins.forEach(bin => {
    const cat = getCategoryAndCode(bin.fillPercent);
    const coaBin = decimalTo7BitBinary(bin.fillPercent);

    html += `
      <tr>
        <td><strong>${escapeHTML(bin.id)}</strong></td>
        <td>${escapeHTML(bin.location)}</td>
        <td><strong>${bin.fillPercent}₁₀</strong></td>
        <td><code>${coaBin.paddedBinary}₂</code></td>
        <td><code>${cat.code}</code></td>
        <td><span class="badge ${cat.badgeClass}">${cat.label}</span></td>
        <td>Numerical Fill: <strong>${coaBin.paddedBinary}</strong> (7-bit unsigned) &bull; Status: <strong>${cat.code}</strong> (${cat.category})</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Populates Route Planner target dropdown with current dustbins.
 * Preserves the user's previously selected target ID across re-renders.
 */
function populateRoutePlannerDropdowns() {
  const selectTarget = document.getElementById('select-route-target');
  const modalSelectBin = document.getElementById('modal-select-bin');

  if (selectTarget) {
    const prevTarget = selectTarget.value;
    selectTarget.innerHTML = '';
    campusDustbins.forEach(bin => {
      const opt = document.createElement('option');
      opt.value = bin.id;
      opt.textContent = `${bin.id} — ${bin.location} (${bin.fillPercent}% Fill)`;
      selectTarget.appendChild(opt);
    });
    if (prevTarget && campusDustbins.some(b => b.id === prevTarget)) {
      selectTarget.value = prevTarget;
    }
  }

  if (modalSelectBin) {
    const prevModal = modalSelectBin.value;
    modalSelectBin.innerHTML = '';
    campusDustbins.forEach(bin => {
      const opt = document.createElement('option');
      opt.value = bin.id;
      opt.textContent = `${bin.id} (${bin.location}) - Current: ${bin.fillPercent}%`;
      modalSelectBin.appendChild(opt);
    });
    if (prevModal && campusDustbins.some(b => b.id === prevModal)) {
      modalSelectBin.value = prevModal;
    }
  }
}

// =============================================================================
// 7. SVG GRAPH VISUALIZATION & HIGHLIGHTING
// =============================================================================

/**
 * 11.6 Renders the Campus Graph and active BFS route paths onto the SVG canvas.
 * Draws non-route edges first, then route edges on top for crisp visual contrast.
 */
function renderCampusGraphSVG() {
  const edgesGroup = document.getElementById('campus-edges-group');
  const nodesGroup = document.getElementById('campus-nodes-group');
  if (!edgesGroup || !nodesGroup) return;

  // Clear existing elements
  edgesGroup.innerHTML = '';
  nodesGroup.innerHTML = '';

  const activePath = activeBFSResult ? activeBFSResult.path : [];
  const startNode = activePath.length > 0 ? activePath[0] : null;
  const targetNode = activePath.length > 0 ? activePath[activePath.length - 1] : null;

  // Helper set to identify edges in the active path
  const pathEdgeSet = new Set();
  for (let i = 0; i < activePath.length - 1; i++) {
    const u = activePath[i];
    const v = activePath[i + 1];
    pathEdgeSet.add(`${u}---${v}`);
    pathEdgeSet.add(`${v}---${u}`);
  }

  // Draw Edges: Non-route edges first, route edges on top
  const nonRouteLines = [];
  const routeLines = [];
  const drawnEdges = new Set();

  for (const [u, neighbors] of Object.entries(CAMPUS_GRAPH)) {
    const posU = NODE_COORDINATES[u];
    for (const v of neighbors) {
      const edgeKey = u < v ? `${u}---${v}` : `${v}---${u}`;
      if (!drawnEdges.has(edgeKey)) {
        drawnEdges.add(edgeKey);
        const posV = NODE_COORDINATES[v];
        const isRouteEdge = pathEdgeSet.has(`${u}---${v}`);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', posU.x);
        line.setAttribute('y1', posU.y);
        line.setAttribute('x2', posV.x);
        line.setAttribute('y2', posV.y);
        line.setAttribute('class', `graph-edge ${isRouteEdge ? 'edge-route' : ''}`);

        if (isRouteEdge) {
          routeLines.push(line);
        } else {
          nonRouteLines.push(line);
        }
      }
    }
  }

  nonRouteLines.forEach(l => edgesGroup.appendChild(l));
  routeLines.forEach(l => edgesGroup.appendChild(l));

  // Draw Nodes
  for (const [nodeName, pos] of Object.entries(NODE_COORDINATES)) {
    const isStart = (nodeName === startNode);
    const isTarget = (nodeName === targetNode);
    const isOnRoute = activePath.includes(nodeName);
    const isIdentical = isStart && isTarget;

    // Count dustbins at this node
    const binsAtNode = campusDustbins.filter(b => b.location === nodeName);

    let nodeClass = 'graph-node node-default';
    if (isIdentical) nodeClass = 'graph-node node-source node-target node-identical';
    else if (isStart) nodeClass = 'graph-node node-source';
    else if (isTarget) nodeClass = 'graph-node node-target';
    else if (isOnRoute) nodeClass = 'graph-node node-route';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', nodeClass);
    g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);

    // Circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', isIdentical ? '26' : (isStart || isTarget ? '24' : '20'));
    g.appendChild(circle);

    // Label
    const textLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textLabel.setAttribute('class', 'node-label');
    textLabel.setAttribute('y', isStart || isTarget ? '38' : '34');
    textLabel.textContent = nodeName;
    g.appendChild(textLabel);

    // Dustbin ID or count badge inside node
    const binBadge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    binBadge.setAttribute('class', 'node-bin-badge');
    binBadge.setAttribute('y', '4');
    if (binsAtNode.length === 1) {
      binBadge.textContent = binsAtNode[0].id;
    } else if (binsAtNode.length > 1) {
      binBadge.textContent = `${binsAtNode.length} bins`;
    } else {
      binBadge.textContent = '•';
    }
    g.appendChild(binBadge);

    // Click handler to select node as route start
    g.addEventListener('click', () => {
      const selectStart = document.getElementById('select-route-start');
      if (selectStart) {
        selectStart.value = nodeName;
        showToast(`Selected '${nodeName}' as worker starting location.`, 'info');
      }
    });

    nodesGroup.appendChild(g);
  }
}

// =============================================================================
// 8. INTERACTIVE CALCULATORS & VALIDATORS HANDLERS
// =============================================================================

/**
 * Handles Decimal-to-Binary Calculator execution.
 */
function handleDecToBinCalc() {
  const input = document.getElementById('calc-dec-input');
  const outputSpan = document.getElementById('dec-to-bin-output');
  const tbody = document.getElementById('dec-steps-table-body');
  const statusBox = document.getElementById('dec-status-match-box');
  const noteP = document.getElementById('dec-steps-note');
  if (!input || !outputSpan || !tbody) return;

  const val = input.value;
  const result = decimalTo7BitBinary(val);

  if (!result.isValid) {
    showToast(result.error, 'error');
    return;
  }

  outputSpan.textContent = result.paddedBinary;

  // Render division table
  let html = '';
  result.steps.forEach(s => {
    html += `
      <tr>
        <td>Step ${s.stepNumber}</td>
        <td><strong>${s.dividend}</strong></td>
        <td>÷ 2</td>
        <td>${s.quotient}</td>
        <td><strong style="color: var(--primary);">${s.remainder}</strong></td>
      </tr>
    `;
  });
  tbody.innerHTML = html;

  // Category status preview
  const cat = getCategoryAndCode(result.decimalValue);
  if (statusBox) {
    statusBox.innerHTML = `Category Classification: <strong>${cat.category}</strong> &bull; 2-Bit Encoded Code: <code>${cat.code}</code>`;
  }

  if (noteP) {
    noteP.innerHTML = `Reading remainders from bottom to top yields raw binary: <strong>${result.rawBinary}</strong>. Padded to 7 bits: <strong>${result.paddedBinary}</strong>.`;
  }
}

/**
 * Handles Binary-to-Decimal Calculator execution.
 */
function handleBinToDecCalc() {
  const input = document.getElementById('calc-bin-input');
  const outputSpan = document.getElementById('bin-to-dec-output');
  const tbody = document.getElementById('bin-steps-table-body');
  const equationBox = document.getElementById('bin-equation-box');
  const errorMsg = document.getElementById('bin-to-dec-error');
  if (!input || !outputSpan || !tbody) return;

  if (errorMsg) errorMsg.textContent = '';

  const val = input.value;
  const result = binaryToDecimal(val);

  if (!result.isValid) {
    if (errorMsg) errorMsg.textContent = result.error;
    showToast(result.error, 'error');
    return;
  }

  outputSpan.textContent = result.decimalValue;

  if (equationBox) {
    equationBox.textContent = result.equationStr;
  }

  let html = '';
  result.breakdown.forEach(b => {
    html += `
      <tr>
        <td>Bit ${b.bitIndex}</td>
        <td><strong>${b.bit}</strong></td>
        <td>2^${b.bitIndex} = ${b.placeValue}</td>
        <td>${b.bit} × ${b.placeValue}</td>
        <td><strong>${b.contribution}</strong></td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

/**
 * Handles FLAT DFA Validator tab execution.
 */
function handleRunDFA(customInput) {
  const inputEl = document.getElementById('flat-test-input');
  const banner = document.getElementById('dfa-result-banner');
  const badgeStatus = document.getElementById('dfa-badge-status');
  const pillState = document.getElementById('dfa-pill-state');
  const explanation = document.getElementById('dfa-explanation-text');
  const tbody = document.getElementById('dfa-trace-table-body');
  const activeStateBadge = document.getElementById('diagram-active-state-badge');

  const testString = (customInput !== undefined) ? customInput : (inputEl ? inputEl.value : '');
  if (inputEl && customInput !== undefined) {
    inputEl.value = customInput;
  }

  const dfaResult = runDFA(testString);

  // Update Result Banner
  if (banner && badgeStatus && pillState && explanation) {
    if (dfaResult.isAccepted) {
      banner.className = 'dfa-result-card accepted';
      badgeStatus.textContent = 'ACCEPTED (Valid ID)';
    } else {
      banner.className = 'dfa-result-card rejected';
      badgeStatus.textContent = 'REJECTED (Invalid ID)';
    }

    pillState.textContent = `Final State: ${dfaResult.finalState} ${dfaResult.isAccepted ? '∈ F' : '∉ F'}`;
    explanation.textContent = dfaResult.explanation;
  }

  // Update Step Trace Table
  if (tbody) {
    let html = '';
    dfaResult.trace.forEach(t => {
      html += `
        <tr>
          <td>${t.step}</td>
          <td><code>${t.fromState}</code></td>
          <td><code>'${t.symbol}'</code></td>
          <td><code>${t.rule}</code></td>
          <td><strong>${t.toState}</strong></td>
          <td>${t.meaning}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  }

  // Update SVG State Diagram Highlighting
  highlightDFAState(dfaResult.finalState);
  if (activeStateBadge) {
    activeStateBadge.textContent = `Active: ${dfaResult.finalState}`;
  }
}

/**
 * Highlights the active state circle in the SVG DFA Diagram.
 *
 * @param {string} state - Active state ('q0', 'q1', 'q2', 'q3', 'q_dead')
 */
function highlightDFAState(state) {
  const stateNodes = ['q0', 'q1', 'q2', 'q3', 'q_dead'];
  stateNodes.forEach(s => {
    const el = document.getElementById(`svg-node-${s}`);
    if (el) {
      if (s === state) {
        el.classList.add('active-state');
      } else {
        el.classList.remove('active-state');
      }
    }
  });
}

/**
 * Handles Route Planner "Calculate Route" button.
 */
function handleCalculateRoute() {
  const selectStart = document.getElementById('select-route-start');
  const selectTarget = document.getElementById('select-route-target');
  const routeCardContent = document.getElementById('route-output-content');
  const edgeBadge = document.getElementById('route-edge-badge');

  if (!selectStart || !selectTarget) return;

  const startLocation = selectStart.value;
  const targetBinId = selectTarget.value;
  const targetBin = campusDustbins.find(b => b.id === targetBinId);

  if (!targetBin) {
    showToast('Please select a valid dustbin target.', 'error');
    return;
  }

  const bfs = bfsShortestPath(CAMPUS_GRAPH, startLocation, targetBin.location);
  activeBFSResult = bfs;

  // Render SVG with highlighted path
  renderCampusGraphSVG();

  if (edgeBadge) {
    edgeBadge.textContent = `${bfs.edgeCount} Edge${bfs.edgeCount === 1 ? '' : 's'}`;
  }

  if (routeCardContent) {
    if (!bfs.reachable) {
      routeCardContent.innerHTML = `
        <div class="empty-priority-card">
          <h4>No Path Found</h4>
          <p>No traversable path exists between '${startLocation}' and '${targetBin.location}'.</p>
        </div>
      `;
      return;
    }

    let pathHtml = '<div class="route-step-path">';
    bfs.path.forEach((node, idx) => {
      pathHtml += `<span class="route-node-pill">${escapeHTML(node)}</span>`;
      if (idx < bfs.path.length - 1) {
        pathHtml += `<span class="route-arrow">&rarr;</span>`;
      }
    });
    pathHtml += '</div>';

    routeCardContent.innerHTML = `
      <div class="rec-target-header">
        <strong>Optimal Campus Route (BFS)</strong>
        <span class="badge badge-success">${bfs.edgeCount} Edge${bfs.edgeCount === 1 ? '' : 's'} (${bfs.path.length} Vertices)</span>
      </div>
      ${pathHtml}
      <div class="rec-details-grid">
        <div class="rec-detail-item"><strong>Start:</strong> ${escapeHTML(startLocation)}</div>
        <div class="rec-detail-item"><strong>Target:</strong> ${escapeHTML(targetBin.id)} (${escapeHTML(targetBin.location)})</div>
        <div class="rec-detail-item"><strong>Fill Level:</strong> ${targetBin.fillPercent}%</div>
        <div class="rec-detail-item"><strong>Visited Nodes:</strong> ${bfs.visitedOrder.length}</div>
      </div>
      <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.4rem;">
        BFS traversal order: ${bfs.visitedOrder.join(' &rarr; ')}
      </p>
    `;
  }

  showToast(`BFS calculated route: ${bfs.path.join(' → ')} (${bfs.edgeCount} edges)`, 'info');
}

/**
 * Handles Route Planner "Recommend Next Collection Target" button.
 */
function handleRecommendTarget() {
  const selectStart = document.getElementById('select-route-start');
  const contentBox = document.getElementById('rec-content-box');
  const statusBadge = document.getElementById('rec-status-badge');
  if (!selectStart || !contentBox) return;

  const startLoc = selectStart.value;
  const result = recommendNextCollectionTarget(campusDustbins, startLoc);

  if (result.status === 'NO_URGENT') {
    if (statusBadge) statusBadge.textContent = 'Safe / No Urgency';
    contentBox.innerHTML = `
      <div class="empty-priority-card">
        <div class="empty-icon">✅</div>
        <h4>No Urgent Collection Target</h4>
        <p>${result.message}</p>
      </div>
    `;
    activeBFSResult = null;
    renderCampusGraphSVG();
    showToast(result.message, 'info');
    return;
  }

  if (result.status === 'UNREACHABLE' || result.status === 'EMPTY') {
    if (statusBadge) statusBadge.textContent = 'No Route';
    contentBox.innerHTML = `
      <div class="empty-priority-card">
        <div class="empty-icon">⚠️</div>
        <h4>Route Notice</h4>
        <p>${result.message}</p>
      </div>
    `;
    activeBFSResult = null;
    renderCampusGraphSVG();
    showToast(result.message, 'error');
    return;
  }

  // Recommended Target
  const bin = result.recommendedBin;
  const bfs = result.bfsResult;
  const cat = getCategoryAndCode(bin.fillPercent);
  const coaBin = decimalTo7BitBinary(bin.fillPercent);

  if (statusBadge) {
    statusBadge.textContent = `Target: ${bin.id} (${result.priorityCategory})`;
  }

  let pathHtml = '<div class="route-step-path">';
  bfs.path.forEach((node, idx) => {
    pathHtml += `<span class="route-node-pill">${escapeHTML(node)}</span>`;
    if (idx < bfs.path.length - 1) {
      pathHtml += `<span class="route-arrow">&rarr;</span>`;
    }
  });
  pathHtml += '</div>';

  contentBox.innerHTML = `
    <div class="rec-target-banner">
      <div class="rec-target-header">
        <span class="rec-bin-id">Recommended Target: ${escapeHTML(bin.id)}</span>
        <span class="badge ${cat.badgeClass}">${cat.label}</span>
      </div>
      <div class="rec-details-grid">
        <div class="rec-detail-item"><strong>Dustbin ID:</strong> ${escapeHTML(bin.id)}</div>
        <div class="rec-detail-item"><strong>Campus Location:</strong> ${escapeHTML(bin.location)}</div>
        <div class="rec-detail-item"><strong>Fill Level:</strong> ${bin.fillPercent}% (${cat.category})</div>
        <div class="rec-detail-item"><strong>2-Bit Status Code (COA):</strong> <code>${cat.code}</code></div>
        <div class="rec-detail-item"><strong>7-Bit Binary (COA):</strong> <code>${coaBin.paddedBinary}</code></div>
        <div class="rec-detail-item"><strong>BFS Route Distance:</strong> ${bfs.edgeCount} Edge${bfs.edgeCount === 1 ? '' : 's'}</div>
      </div>
      <div style="margin-top: 0.5rem;">
        <strong>Optimal Path from '${escapeHTML(startLoc)}':</strong>
        ${pathHtml}
      </div>
      <p style="font-size: 0.85rem; color: #166534; margin-top: 0.5rem;">
        <strong>Justification:</strong> ${escapeHTML(result.justification)}
      </p>
    </div>
  `;

  // Synchronize route display and SVG
  activeBFSResult = bfs;
  renderCampusGraphSVG();

  const selectTarget = document.getElementById('select-route-target');
  if (selectTarget) selectTarget.value = bin.id;

  const edgeBadge = document.getElementById('route-edge-badge');
  if (edgeBadge) edgeBadge.textContent = `${bfs.edgeCount} Edge${bfs.edgeCount === 1 ? '' : 's'}`;

  showToast(`Recommended next target: ${bin.id} at ${bin.location}`, 'info');
}

/**
 * Clears active route highlight and output displays.
 */
function handleClearRoute() {
  activeBFSResult = null;
  renderCampusGraphSVG();

  const edgeBadge = document.getElementById('route-edge-badge');
  if (edgeBadge) edgeBadge.textContent = '0 Edges';

  const routeContent = document.getElementById('route-output-content');
  if (routeContent) {
    routeContent.innerHTML = `<p class="text-muted">Route display cleared. Select starting location and target to plan a new route.</p>`;
  }

  showToast('Route display cleared.', 'info');
}

// =============================================================================
// 9. DUSTBIN CRUD FORM & VALIDATION INTEGRATION
// =============================================================================

/**
 * Validates the Dustbin ID input field live using the FLAT DFA.
 */
function handleFormLiveDFAValidation() {
  const idInput = document.getElementById('input-bin-id');
  const feedbackBadge = document.getElementById('form-dfa-feedback');
  const errorMsg = document.getElementById('bin-id-error');
  const formMode = document.getElementById('dustbin-form-mode').value;
  const originalId = document.getElementById('dustbin-original-id').value;

  if (!idInput || !feedbackBadge) return;

  const rawVal = idInput.value.trim();

  if (rawVal.length === 0) {
    feedbackBadge.innerHTML = `<span class="dfa-indicator-badge badge-pending">Awaiting input</span>`;
    if (errorMsg) errorMsg.textContent = '';
    return;
  }

  const dfaResult = runDFA(rawVal);

  if (!dfaResult.isAccepted) {
    feedbackBadge.innerHTML = `<span class="dfa-indicator-badge badge-critical">DFA Rejected (State: ${dfaResult.finalState})</span>`;
    if (errorMsg) errorMsg.textContent = "ID must be uppercase 'B' followed by exactly 2 digits (e.g. B01, B12).";
    return;
  }

  // Check uniqueness
  const duplicate = campusDustbins.find(b => b.id === rawVal);
  if (duplicate && (formMode === 'add' || rawVal !== originalId)) {
    feedbackBadge.innerHTML = `<span class="dfa-indicator-badge badge-critical">Duplicate ID</span>`;
    if (errorMsg) errorMsg.textContent = `Dustbin ID '${rawVal}' is already registered on campus.`;
    return;
  }

  // Successfully validated
  feedbackBadge.innerHTML = `<span class="dfa-indicator-badge badge-success">DFA Valid (q3 ∈ F)</span>`;
  if (errorMsg) errorMsg.textContent = '';
}

/**
 * Updates fill percentage preview and live COA binary calculations in the form.
 */
function handleFormFillUpdate(val) {
  const percent = parseInt(val, 10);
  const fillInput = document.getElementById('input-bin-fill');
  const slider = document.getElementById('slider-bin-fill');
  const previewBar = document.getElementById('form-fill-preview');
  const coaPreview = document.getElementById('form-coa-preview');

  if (isNaN(percent) || percent < 0 || percent > 100) return;

  if (fillInput && fillInput.value != percent) fillInput.value = percent;
  if (slider && slider.value != percent) slider.value = percent;

  if (previewBar) {
    previewBar.style.width = `${percent}%`;
    if (percent >= 75) previewBar.style.backgroundColor = 'var(--status-critical)';
    else if (percent >= 50) previewBar.style.backgroundColor = 'var(--status-high)';
    else if (percent >= 25) previewBar.style.backgroundColor = 'var(--status-moderate)';
    else previewBar.style.backgroundColor = 'var(--status-low)';
  }

  if (coaPreview) {
    const coaBin = decimalTo7BitBinary(percent);
    const cat = getCategoryAndCode(percent);
    coaPreview.innerHTML = `7-Bit Binary: <code>${coaBin.paddedBinary}</code> &bull; Status: <span class="badge ${cat.badgeClass}">${cat.label}</span>`;
  }
}

/**
 * Handles Dustbin Form submission (Create or Update).
 */
function handleDustbinFormSubmit(e) {
  e.preventDefault();

  const idInput = document.getElementById('input-bin-id');
  const locSelect = document.getElementById('select-bin-location');
  const fillInput = document.getElementById('input-bin-fill');
  const formMode = document.getElementById('dustbin-form-mode').value;
  const originalId = document.getElementById('dustbin-original-id').value;

  const candidateRecord = {
    id: idInput.value,
    location: locSelect.value,
    fillPercent: fillInput.value
  };

  const validation = validateDustbinRecord(candidateRecord, campusDustbins, formMode, originalId);
  if (!validation.isValid) {
    showToast(validation.error, 'error');
    return;
  }

  const { id, location, fillPercent } = validation.sanitized;
  const nowTimestamp = new Date().toISOString();

  if (formMode === 'add') {
    campusDustbins.push({
      id: id,
      location: location,
      fillPercent: fillPercent,
      lastUpdated: nowTimestamp
    });
    showToast(`Dustbin ${id} created successfully at ${location}.`, 'info');
  } else {
    // Edit mode
    const idx = campusDustbins.findIndex(b => b.id === originalId);
    if (idx !== -1) {
      campusDustbins[idx] = {
        id: id,
        location: location,
        fillPercent: fillPercent,
        lastUpdated: nowTimestamp
      };
      showToast(`Dustbin ${id} updated successfully.`, 'info');
    }
  }

  saveToStorage();
  resetDustbinForm();
  renderAllViews();
}

/**
 * Populates form to edit an existing dustbin.
 */
function handleEditDustbin(binId) {
  const bin = campusDustbins.find(b => b.id === binId);
  if (!bin) return;

  // Switch to Management tab
  switchTab('management');

  document.getElementById('form-title').textContent = `✏️ Edit Dustbin ${bin.id}`;
  document.getElementById('dustbin-form-mode').value = 'edit';
  document.getElementById('dustbin-original-id').value = bin.id;

  const idInput = document.getElementById('input-bin-id');
  const locSelect = document.getElementById('select-bin-location');
  const cancelBtn = document.getElementById('btn-cancel-edit');

  idInput.value = bin.id;
  locSelect.value = bin.location;
  handleFormFillUpdate(bin.fillPercent);
  handleFormLiveDFAValidation();

  if (cancelBtn) cancelBtn.style.display = 'inline-block';
}

/**
 * Resets dustbin form back to clean "Add" state.
 */
function resetDustbinForm() {
  document.getElementById('form-title').textContent = '➕ Register New Dustbin';
  document.getElementById('dustbin-form-mode').value = 'add';
  document.getElementById('dustbin-original-id').value = '';
  document.getElementById('dustbin-form').reset();
  document.getElementById('form-dfa-feedback').innerHTML = `<span class="dfa-indicator-badge badge-pending">Awaiting input</span>`;
  document.getElementById('btn-cancel-edit').style.display = 'none';
  handleFormFillUpdate(50);
}

/**
 * Deletes a dustbin with confirmation dialog.
 */
function handleDeleteDustbin(binId) {
  if (confirm(`Are you sure you want to delete dustbin '${binId}'? This action cannot be undone.`)) {
    campusDustbins = campusDustbins.filter(b => b.id !== binId);
    saveToStorage();
    renderAllViews();
    showToast(`Dustbin ${binId} deleted successfully.`, 'info');
  }
}

// =============================================================================
// 10. QUICK FILL UPDATE MODAL
// =============================================================================

function openQuickUpdateModal(presetBinId) {
  const modal = document.getElementById('modal-backdrop');
  const selectBin = document.getElementById('modal-select-bin');
  if (!modal) return;

  populateRoutePlannerDropdowns();

  if (presetBinId && selectBin) {
    selectBin.value = presetBinId;
  }

  // Synchronize modal inputs with chosen bin
  syncModalFromSelectedBin();

  modal.style.display = 'flex';
}

function closeQuickUpdateModal() {
  const modal = document.getElementById('modal-backdrop');
  if (modal) modal.style.display = 'none';
}

/**
 * Initializes modal slider, input, and preview from the currently selected dustbin.
 */
function syncModalFromSelectedBin() {
  const selectBin = document.getElementById('modal-select-bin');
  const slider = document.getElementById('modal-slider-fill');
  const input = document.getElementById('modal-input-fill');

  if (!selectBin) return;
  const bin = campusDustbins.find(b => b.id === selectBin.value);
  const fill = bin ? bin.fillPercent : 50;

  if (slider) slider.value = fill;
  if (input) input.value = fill;
  updateModalFillPreview(fill);
}

/**
 * Updates fill progress bar and dynamic COA binary preview within the modal.
 *
 * @param {number|string} val - Fill percentage
 */
function updateModalFillPreview(val) {
  const preview = document.getElementById('modal-fill-preview');
  const coaPreview = document.getElementById('modal-coa-preview');
  const fill = Number(val);

  if (isNaN(fill) || fill < 0 || fill > 100) return;

  if (preview) {
    preview.style.width = `${fill}%`;
    if (fill >= 75) preview.style.backgroundColor = 'var(--status-critical)';
    else if (fill >= 50) preview.style.backgroundColor = 'var(--status-high)';
    else if (fill >= 25) preview.style.backgroundColor = 'var(--status-moderate)';
    else preview.style.backgroundColor = 'var(--status-low)';
  }

  if (coaPreview) {
    const coaBin = decimalTo7BitBinary(fill);
    const cat = getCategoryAndCode(fill);
    coaPreview.innerHTML = `7-Bit Binary: <code>${coaBin.paddedBinary}</code> &bull; Status: <span class="badge ${cat.badgeClass}">${cat.label}</span>`;
  }
}

function handleModalSubmit() {
  const selectBin = document.getElementById('modal-select-bin');
  const input = document.getElementById('modal-input-fill');
  if (!selectBin || !input) return;

  const binId = selectBin.value;
  const rawFill = input.value.trim();

  if (!/^\d+$/.test(rawFill)) {
    showToast('Fill percentage must be a whole non-negative integer without decimal points or letters.', 'error');
    return;
  }

  const newFill = Number(rawFill);
  if (!Number.isInteger(newFill) || newFill < 0 || newFill > 100) {
    showToast('Fill percentage must be an integer between 0 and 100.', 'error');
    return;
  }

  const bin = campusDustbins.find(b => b.id === binId);
  if (bin) {
    bin.fillPercent = newFill;
    bin.lastUpdated = new Date().toISOString();
    saveToStorage();
    renderAllViews();
    showToast(`Updated ${binId} fill level to ${newFill}%.`, 'info');
    closeQuickUpdateModal();
  }
}

// =============================================================================
// 11. IN-APP AUTOMATED VERIFICATION TEST SUITE
// =============================================================================

/**
 * Runs 40+ automated unit tests directly in the browser across all 3 subjects.
 */
function runAutomatedTestSuite() {
  const testResults = [];

  function assertTest(testId, module, scenario, input, expected, actual, isPass) {
    testResults.push({
      testId,
      module,
      scenario,
      input: String(input),
      expected: String(expected),
      actual: String(actual),
      isPass: Boolean(isPass)
    });
  }

  // --- Dustbin Management (DM) Tests ---
  const dummyList = [
    { id: 'B01', location: 'Hostel Block', fillPercent: 85 },
    { id: 'B02', location: 'Cafeteria', fillPercent: 92 }
  ];

  const t_dm01 = validateDustbinRecord({ id: 'B06', location: 'Parking Area', fillPercent: 60 }, dummyList, 'add');
  assertTest('DM-01', 'DM', 'Add valid ID B06 with location & fill 60%', 'B06 (Parking Area, 60%)', 'Valid record', t_dm01.isValid ? 'Valid record' : t_dm01.error, t_dm01.isValid);

  const t_dm02 = validateDustbinRecord({ id: 'X01', location: 'Parking Area', fillPercent: 60 }, dummyList, 'add');
  assertTest('DM-02', 'DM', 'Reject invalid prefix X01 (DFA q_dead)', 'X01', 'Rejected (q_dead)', t_dm02.dfaResult.finalState, !t_dm02.isValid && t_dm02.dfaResult.finalState === 'q_dead');

  const t_dm03 = validateDustbinRecord({ id: 'B1', location: 'Parking Area', fillPercent: 60 }, dummyList, 'add');
  assertTest('DM-03', 'DM', 'Reject incomplete single-digit ID B1 (DFA q2)', 'B1', 'Rejected (q2)', t_dm03.dfaResult.finalState, !t_dm03.isValid && t_dm03.dfaResult.finalState === 'q2');

  const t_dm04 = validateDustbinRecord({ id: 'B123', location: 'Parking Area', fillPercent: 60 }, dummyList, 'add');
  assertTest('DM-04', 'DM', 'Reject excess digit ID B123 (DFA q_dead)', 'B123', 'Rejected (q_dead)', t_dm04.dfaResult.finalState, !t_dm04.isValid && t_dm04.dfaResult.finalState === 'q_dead');

  const t_dm05 = validateDustbinRecord({ id: 'B01', location: 'Library', fillPercent: 40 }, dummyList, 'add');
  assertTest('DM-05', 'DM', 'Reject duplicate ID B01', 'B01 (Duplicate)', 'Rejected (Duplicate ID)', t_dm05.isValid ? 'Accepted' : 'Rejected (Duplicate ID)', !t_dm05.isValid);

  const t_dm06 = validateDustbinRecord({ id: 'B07', location: 'Library', fillPercent: -5 }, dummyList, 'add');
  assertTest('DM-06', 'DM', 'Reject fill percentage < 0 (-5)', 'Fill: -5', 'Rejected (< 0)', t_dm06.isValid ? 'Accepted' : 'Rejected (< 0)', !t_dm06.isValid);

  const t_dm07 = validateDustbinRecord({ id: 'B07', location: 'Library', fillPercent: 105 }, dummyList, 'add');
  assertTest('DM-07', 'DM', 'Reject fill percentage > 100 (105)', 'Fill: 105', 'Rejected (> 100)', t_dm07.isValid ? 'Accepted' : 'Rejected (> 100)', !t_dm07.isValid);

  const t_dm08 = validateDustbinRecord({ id: 'B07', location: 'Library', fillPercent: '45.5' }, dummyList, 'add');
  assertTest('DM-08', 'DM', 'Reject non-integer / decimal fill (45.5)', 'Fill: 45.5', 'Rejected (non-integer)', t_dm08.isValid ? 'Accepted' : 'Rejected (non-integer)', !t_dm08.isValid);

  const t_dm09 = validateDustbinRecord({ id: 'B07', location: 'OffCampusSite', fillPercent: 50 }, dummyList, 'add');
  assertTest('DM-09', 'DM', 'Reject invalid campus graph vertex', 'Location: OffCampusSite', 'Rejected (invalid vertex)', t_dm09.isValid ? 'Accepted' : 'Rejected (invalid vertex)', !t_dm09.isValid);

  // --- COA Tests ---
  const t_dec5 = decimalTo7BitBinary(5);
  assertTest('COA-01', 'COA', 'Decimal 5 to 7-bit binary', '5', '0000101', t_dec5.paddedBinary, t_dec5.paddedBinary === '0000101');

  const t_dec10 = decimalTo7BitBinary(10);
  assertTest('COA-02', 'COA', 'Decimal 10 to 7-bit binary', '10', '0001010', t_dec10.paddedBinary, t_dec10.paddedBinary === '0001010');

  const t_dec75 = decimalTo7BitBinary(75);
  assertTest('COA-03', 'COA', 'Decimal 75 to 7-bit binary', '75', '1001011', t_dec75.paddedBinary, t_dec75.paddedBinary === '1001011');

  const t_dec100 = decimalTo7BitBinary(100);
  assertTest('COA-04', 'COA', 'Decimal 100 to 7-bit binary', '100', '1100100', t_dec100.paddedBinary, t_dec100.paddedBinary === '1100100');

  const t_dec0 = decimalTo7BitBinary(0);
  assertTest('COA-05', 'COA', 'Decimal 0 to 7-bit binary', '0', '0000000', t_dec0.paddedBinary, t_dec0.paddedBinary === '0000000');

  const t_bin1010 = binaryToDecimal('1010');
  assertTest('COA-06', 'COA', 'Binary "1010" to decimal', '1010', '10', t_bin1010.decimalValue, t_bin1010.decimalValue === 10);

  const t_bin75 = binaryToDecimal('1001011');
  assertTest('COA-07', 'COA', 'Binary "1001011" to decimal', '1001011', '75', t_bin75.decimalValue, t_bin75.decimalValue === 75);

  const t_bin0000101 = binaryToDecimal('0000101');
  assertTest('COA-08', 'COA', 'Binary "0000101" to decimal', '0000101', '5', t_bin0000101.decimalValue, t_bin0000101.decimalValue === 5);

  const t_binEmpty = binaryToDecimal('');
  assertTest('COA-09', 'COA', 'Reject empty binary string', '""', 'false', t_binEmpty.isValid, !t_binEmpty.isValid);

  const t_binInvalid = binaryToDecimal('102');
  assertTest('COA-10', 'COA', 'Reject invalid binary digit "2"', '102', 'false', t_binInvalid.isValid, !t_binInvalid.isValid);

  const t_cat24 = getCategoryAndCode(24);
  assertTest('COA-11', 'COA', 'Boundary 24% -> Low (00)', '24', '00', t_cat24.code, t_cat24.code === '00');

  const t_cat25 = getCategoryAndCode(25);
  assertTest('COA-12', 'COA', 'Boundary 25% -> Moderate (01)', '25', '01', t_cat25.code, t_cat25.code === '01');

  const t_cat49 = getCategoryAndCode(49);
  assertTest('COA-13', 'COA', 'Boundary 49% -> Moderate (01)', '49', '01', t_cat49.code, t_cat49.code === '01');

  const t_cat50 = getCategoryAndCode(50);
  assertTest('COA-14', 'COA', 'Boundary 50% -> High (10)', '50', '10', t_cat50.code, t_cat50.code === '10');

  const t_cat74 = getCategoryAndCode(74);
  assertTest('COA-15', 'COA', 'Boundary 74% -> High (10)', '74', '10', t_cat74.code, t_cat74.code === '10');

  const t_cat75 = getCategoryAndCode(75);
  assertTest('COA-16', 'COA', 'Boundary 75% -> Critical (11)', '75', '11', t_cat75.code, t_cat75.code === '11');

  const t_cat100 = getCategoryAndCode(100);
  assertTest('COA-17', 'COA', 'Boundary 100% -> Critical (11)', '100', '11', t_cat100.code, t_cat100.code === '11');

  const t_coaNonInt = decimalTo7BitBinary('45.5');
  assertTest('COA-18', 'COA', 'Reject non-integer decimal "45.5"', '45.5', 'false', t_coaNonInt.isValid, !t_coaNonInt.isValid);

  // --- FLAT Tests ---
  const t_dfaB01 = runDFA('B01');
  assertTest('FLAT-01', 'FLAT', 'Accept valid format B01', 'B01', 'q3 (Accepted)', `${t_dfaB01.finalState} (${t_dfaB01.isAccepted ? 'Accepted' : 'Rejected'})`, t_dfaB01.isAccepted && t_dfaB01.finalState === 'q3');

  const t_dfaB12 = runDFA('B12');
  assertTest('FLAT-02', 'FLAT', 'Accept valid format B12', 'B12', 'q3 (Accepted)', `${t_dfaB12.finalState} (${t_dfaB12.isAccepted ? 'Accepted' : 'Rejected'})`, t_dfaB12.isAccepted && t_dfaB12.finalState === 'q3');

  const t_dfaB99 = runDFA('B99');
  assertTest('FLAT-03', 'FLAT', 'Accept valid format B99', 'B99', 'q3 (Accepted)', `${t_dfaB99.finalState} (${t_dfaB99.isAccepted ? 'Accepted' : 'Rejected'})`, t_dfaB99.isAccepted && t_dfaB99.finalState === 'q3');

  const t_dfaX01 = runDFA('X01');
  assertTest('FLAT-04', 'FLAT', 'Reject invalid prefix X01', 'X01', 'q_dead (Rejected)', `${t_dfaX01.finalState} (${t_dfaX01.isAccepted ? 'Accepted' : 'Rejected'})`, !t_dfaX01.isAccepted && t_dfaX01.finalState === 'q_dead');

  const t_dfaB1 = runDFA('B1');
  assertTest('FLAT-05', 'FLAT', 'Reject single digit B1', 'B1', 'q2 (Rejected)', `${t_dfaB1.finalState} (${t_dfaB1.isAccepted ? 'Accepted' : 'Rejected'})`, !t_dfaB1.isAccepted && t_dfaB1.finalState === 'q2');

  const t_dfaB123 = runDFA('B123');
  assertTest('FLAT-06', 'FLAT', 'Reject excess digit B123', 'B123', 'q_dead (Rejected)', `${t_dfaB123.finalState} (${t_dfaB123.isAccepted ? 'Accepted' : 'Rejected'})`, !t_dfaB123.isAccepted && t_dfaB123.finalState === 'q_dead');

  const t_dfaB1A = runDFA('B1A');
  assertTest('FLAT-07', 'FLAT', 'Reject alphanumeric character B1A', 'B1A', 'q_dead (Rejected)', `${t_dfaB1A.finalState} (${t_dfaB1A.isAccepted ? 'Accepted' : 'Rejected'})`, !t_dfaB1A.isAccepted && t_dfaB1A.finalState === 'q_dead');

  const t_dfab01 = runDFA('b01');
  assertTest('FLAT-08', 'FLAT', 'Reject lowercase prefix b01', 'b01', 'q_dead (Rejected)', `${t_dfab01.finalState} (${t_dfab01.isAccepted ? 'Accepted' : 'Rejected'})`, !t_dfab01.isAccepted && t_dfab01.finalState === 'q_dead');

  const t_dfaEmpty = runDFA('');
  assertTest('FLAT-09', 'FLAT', 'Reject empty string', '""', 'q0 (Rejected)', `${t_dfaEmpty.finalState} (${t_dfaEmpty.isAccepted ? 'Accepted' : 'Rejected'})`, !t_dfaEmpty.isAccepted && t_dfaEmpty.finalState === 'q0');

  const t_dfaTraceB01 = runDFA('B01');
  assertTest('FLAT-10', 'FLAT', 'DFA transition trace length & accepting rule for B01', 'B01 trace length', '3 steps, ends in q3', `${t_dfaTraceB01.trace.length} steps, ends in ${t_dfaTraceB01.finalState}`, t_dfaTraceB01.trace.length === 3 && t_dfaTraceB01.finalState === 'q3');

  const t_dfaTraceX01 = runDFA('X01');
  assertTest('FLAT-11', 'FLAT', 'DFA trap transition trace for X01', 'X01 step 1', 'q_dead', t_dfaTraceX01.trace[0].toState, t_dfaTraceX01.trace[0].toState === 'q_dead');

  // --- DAA Tests ---
  const t_bfsSame = bfsShortestPath(CAMPUS_GRAPH, 'Library', 'Library');
  assertTest('DAA-01', 'DAA', 'BFS source equals target (0 edges)', 'Library -> Library', '0 edges', `${t_bfsSame.edgeCount} edges`, t_bfsSame.reachable && t_bfsSame.edgeCount === 0);

  const t_bfsDirect = bfsShortestPath(CAMPUS_GRAPH, 'Main Gate', 'Admin Block');
  assertTest('DAA-02', 'DAA', 'BFS direct adjacent edge (1 edge)', 'Main Gate -> Admin Block', '1 edge', `${t_bfsDirect.edgeCount} edges`, t_bfsDirect.reachable && t_bfsDirect.edgeCount === 1);

  const t_bfsMulti = bfsShortestPath(CAMPUS_GRAPH, 'Main Gate', 'Cafeteria');
  assertTest('DAA-03', 'DAA', 'BFS multi-hop path edge count', 'Main Gate -> Cafeteria', '3 edges', `${t_bfsMulti.edgeCount} edges`, t_bfsMulti.reachable && t_bfsMulti.edgeCount === 3);

  // Consecutive node connectivity check
  let allEdgesValid = true;
  for (let i = 0; i < t_bfsMulti.path.length - 1; i++) {
    const u = t_bfsMulti.path[i];
    const v = t_bfsMulti.path[i + 1];
    if (!CAMPUS_GRAPH[u].includes(v)) {
      allEdgesValid = false;
      break;
    }
  }
  assertTest('DAA-04', 'DAA', 'BFS consecutive path connectivity check', t_bfsMulti.path.join('->'), 'All edges exist in graph', allEdgesValid ? 'All edges exist in graph' : 'Invalid edge detected', allEdgesValid);

  // Edge count formula: edgeCount = path.length - 1
  const formulaCheck = (t_bfsMulti.edgeCount === t_bfsMulti.path.length - 1);
  assertTest('DAA-05', 'DAA', 'BFS edge count equals vertices - 1', `${t_bfsMulti.path.length} vertices`, `${t_bfsMulti.path.length - 1} edges`, `${t_bfsMulti.edgeCount} edges`, formulaCheck);

  // Recommendation engine priority check
  const testBins = [
    { id: 'B01', location: 'Hostel Block', fillPercent: 85 },   // Critical
    { id: 'B02', location: 'Cafeteria', fillPercent: 92 },      // Critical
    { id: 'B03', location: 'Library', fillPercent: 48 },        // Moderate
    { id: 'B04', location: 'Sports Ground', fillPercent: 100 }, // Critical
    { id: 'B05', location: 'Admin Block', fillPercent: 20 }     // Low
  ];
  const t_rec = recommendNextCollectionTarget(testBins, 'Main Gate');
  assertTest('DAA-06', 'DAA', 'Recommendation selects nearest Critical bin', 'Start: Main Gate', 'B04 (Sports Ground, 2 edges)', `${t_rec.recommendedBin.id} (${t_rec.recommendedBin.location}, ${t_rec.bfsResult.edgeCount} edges)`, t_rec.recommendedBin.id === 'B04');

  // Recommendation tie-breaking test: same distance, higher fill
  const tieBinsFill = [
    { id: 'B10', location: 'Admin Block', fillPercent: 80 },
    { id: 'B11', location: 'Parking Area', fillPercent: 95 }
  ];
  const t_recTieFill = recommendNextCollectionTarget(tieBinsFill, 'Main Gate');
  assertTest('DAA-07', 'DAA', 'Recommendation tie-breaker 1: higher fill %', 'B10 (80%) vs B11 (95%)', 'B11', t_recTieFill.recommendedBin.id, t_recTieFill.recommendedBin.id === 'B11');

  // Recommendation tie-breaking test: same distance, same fill, lexicographical ID
  const tieBinsId = [
    { id: 'B12', location: 'Admin Block', fillPercent: 90 },
    { id: 'B10', location: 'Parking Area', fillPercent: 90 }
  ];
  const t_recTieId = recommendNextCollectionTarget(tieBinsId, 'Main Gate');
  assertTest('DAA-08', 'DAA', 'Recommendation tie-breaker 2: lexicographical ID', 'B12 vs B10 (both 90%, 1 edge)', 'B10', t_recTieId.recommendedBin.id, t_recTieId.recommendedBin.id === 'B10');

  // Dynamic recommendation update: Changing Critical B04 to Low shifts target to next Critical bin B02
  const updatedTestBins = [
    { id: 'B01', location: 'Hostel Block', fillPercent: 85 },   // Critical (3 edges)
    { id: 'B02', location: 'Cafeteria', fillPercent: 92 },      // Critical (3 edges, 92% > 85%)
    { id: 'B03', location: 'Library', fillPercent: 48 },
    { id: 'B04', location: 'Sports Ground', fillPercent: 20 },  // Updated to Low!
    { id: 'B05', location: 'Admin Block', fillPercent: 20 }
  ];
  const t_recDynamic = recommendNextCollectionTarget(updatedTestBins, 'Main Gate');
  assertTest('DAA-09', 'DAA', 'Dynamic update: Decreasing B04 to 20% shifts recommendation', 'B04 fill lowered to 20%', 'B02 (Cafeteria, 92%)', `${t_recDynamic.recommendedBin.id} (${t_recDynamic.recommendedBin.location})`, t_recDynamic.recommendedBin.id === 'B02');

  // Unreachable / Non-existent node handling in BFS
  const t_bfsUnreachable = bfsShortestPath(CAMPUS_GRAPH, 'Main Gate', 'OffCampusVertex');
  assertTest('DAA-10', 'DAA', 'BFS unreachable / non-existent target handling', 'Main Gate -> OffCampusVertex', 'reachable: false, edgeCount: -1', `reachable: ${t_bfsUnreachable.reachable}, edgeCount: ${t_bfsUnreachable.edgeCount}`, !t_bfsUnreachable.reachable && t_bfsUnreachable.edgeCount === -1);

  // Render Test Suite Table in About Tab
  const summaryBar = document.getElementById('test-suite-summary-bar');
  const totalEl = document.getElementById('tests-total');
  const passEl = document.getElementById('tests-passed');
  const failEl = document.getElementById('tests-failed');
  const tbody = document.getElementById('automated-tests-body');

  let passCount = 0;
  let failCount = 0;
  let html = '';

  testResults.forEach(t => {
    if (t.isPass) passCount++;
    else failCount++;

    let badgeClass = 'badge-primary';
    if (t.module === 'FLAT') badgeClass = 'badge-success';
    else if (t.module === 'DAA') badgeClass = 'badge-info';
    else if (t.module === 'DM') badgeClass = 'badge-moderate';

    html += `
      <tr>
        <td><strong>${t.testId}</strong></td>
        <td><span class="badge ${badgeClass}">${t.module}</span></td>
        <td>${escapeHTML(t.scenario)}</td>
        <td><code>${escapeHTML(t.input)}</code></td>
        <td>${escapeHTML(t.expected)}</td>
        <td>${escapeHTML(t.actual)}</td>
        <td>
          <span class="${t.isPass ? 'status-pass-badge' : 'status-fail-badge'}">
            ${t.isPass ? '✓ PASS' : '✗ FAIL'}
          </span>
        </td>
      </tr>
    `;
  });

  if (tbody) tbody.innerHTML = html;
  if (totalEl) totalEl.textContent = testResults.length;
  if (passEl) passEl.textContent = passCount;
  if (failEl) failEl.textContent = failCount;
  if (summaryBar) summaryBar.style.display = 'flex';

  showToast(`Test suite complete: ${passCount}/${testResults.length} tests passed.`, passCount === testResults.length ? 'info' : 'error');
}

// =============================================================================
// 12. UTILITY & EVENT WIRING
// =============================================================================

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-notification ${type === 'error' ? 'toast-error' : (type === 'info' ? 'toast-info' : '')}`;
  toast.innerHTML = `
    <span>${escapeHTML(message)}</span>
    <button style="background:none;border:none;cursor:pointer;font-weight:bold;color:#64748b;" onclick="this.parentElement.remove();">&times;</button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4000);
}

function switchTab(tabId) {
  // Navigation buttons
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    }
  });

  // Sections
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(sec => {
    if (sec.id === `section-${tabId}`) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  // Contextual refreshes
  if (tabId === 'daa') {
    renderCampusGraphSVG();
  }
}

// Attach Event Listeners on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  renderAllViews();

  // Navigation Tab Switching
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Dashboard Shortcuts
  document.getElementById('btn-quick-add')?.addEventListener('click', () => switchTab('management'));
  document.getElementById('btn-quick-update')?.addEventListener('click', () => openQuickUpdateModal());
  document.getElementById('btn-quick-route')?.addEventListener('click', () => switchTab('daa'));
  document.getElementById('btn-load-demo')?.addEventListener('click', loadDemoData);
  document.getElementById('btn-reset-data')?.addEventListener('click', resetDemoData);

  // Management Form Events
  const idInput = document.getElementById('input-bin-id');
  if (idInput) {
    idInput.addEventListener('input', handleFormLiveDFAValidation);
  }

  const fillSlider = document.getElementById('slider-bin-fill');
  const fillInput = document.getElementById('input-bin-fill');
  if (fillSlider) {
    fillSlider.addEventListener('input', (e) => handleFormFillUpdate(e.target.value));
  }
  if (fillInput) {
    fillInput.addEventListener('input', (e) => handleFormFillUpdate(e.target.value));
  }

  const dustbinForm = document.getElementById('dustbin-form');
  if (dustbinForm) {
    dustbinForm.addEventListener('submit', handleDustbinFormSubmit);
  }

  document.getElementById('btn-cancel-edit')?.addEventListener('click', resetDustbinForm);

  // Management Filter & Search
  document.getElementById('management-search')?.addEventListener('input', renderManagementTable);
  document.getElementById('filter-status')?.addEventListener('change', renderManagementTable);
  document.getElementById('sort-by')?.addEventListener('change', renderManagementTable);

  // Table Action Delegation
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit-bin');
    if (editBtn) {
      const binId = editBtn.getAttribute('data-id');
      handleEditDustbin(binId);
      return;
    }

    const deleteBtn = e.target.closest('.btn-delete-bin');
    if (deleteBtn) {
      const binId = deleteBtn.getAttribute('data-id');
      handleDeleteDustbin(binId);
      return;
    }

    const routeBtn = e.target.closest('.btn-route-to-bin');
    if (routeBtn) {
      const binId = routeBtn.getAttribute('data-id');
      switchTab('daa');
      const selectTarget = document.getElementById('select-route-target');
      if (selectTarget) selectTarget.value = binId;
      handleCalculateRoute();
      return;
    }
  });

  // COA Calculators
  document.getElementById('btn-calc-dec-to-bin')?.addEventListener('click', handleDecToBinCalc);
  document.getElementById('btn-calc-bin-to-dec')?.addEventListener('click', handleBinToDecCalc);

  // FLAT DFA Validator & Preset Buttons
  document.getElementById('btn-run-dfa')?.addEventListener('click', () => handleRunDFA());
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-val');
      handleRunDFA(val);
    });
  });

  // DAA Route Controls
  document.getElementById('btn-calc-route')?.addEventListener('click', handleCalculateRoute);
  document.getElementById('btn-recommend-target')?.addEventListener('click', handleRecommendTarget);
  document.getElementById('btn-clear-route')?.addEventListener('click', handleClearRoute);

  // Automated Test Suite Runner
  document.getElementById('btn-run-all-tests')?.addEventListener('click', runAutomatedTestSuite);

  // Modal Controls
  document.getElementById('btn-close-modal')?.addEventListener('click', closeQuickUpdateModal);
  document.getElementById('btn-modal-cancel')?.addEventListener('click', closeQuickUpdateModal);
  document.getElementById('btn-modal-submit')?.addEventListener('click', handleModalSubmit);
  document.getElementById('modal-select-bin')?.addEventListener('change', syncModalFromSelectedBin);
  document.getElementById('modal-slider-fill')?.addEventListener('input', (e) => {
    const val = e.target.value;
    const input = document.getElementById('modal-input-fill');
    if (input) input.value = val;
    updateModalFillPreview(val);
  });
  document.getElementById('modal-input-fill')?.addEventListener('input', (e) => {
    const val = e.target.value;
    const slider = document.getElementById('modal-slider-fill');
    if (slider) slider.value = val;
    updateModalFillPreview(val);
  });

  // Initial runs
  handleDecToBinCalc();
  handleBinToDecCalc();
  handleRunDFA('B01');
});

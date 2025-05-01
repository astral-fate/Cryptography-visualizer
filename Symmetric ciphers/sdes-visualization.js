// S-DES Constants
const P10 = [3, 5, 2, 7, 4, 10, 1, 9, 8, 6];
const P8 = [6, 3, 7, 4, 8, 5, 10, 9];
const IP = [2, 6, 3, 1, 4, 8, 5, 7];
const IP_inv = [4, 1, 3, 5, 7, 2, 8, 6];
const EP = [4, 1, 2, 3, 2, 3, 4, 1];
const P4 = [2, 4, 3, 1];

const S0 = [
    [1, 0, 3, 2],
    [3, 2, 1, 0],
    [0, 2, 1, 3],
    [3, 1, 3, 2]
];

const S1 = [
    [0, 1, 2, 3],
    [2, 0, 1, 3],
    [3, 0, 1, 0],
    [2, 1, 0, 3]
];

// Helper Functions
function permute(input, table) {
    let output = '';
    for (let i = 0; i < table.length; i++) {
        output += input[table[i] - 1];
    }
    return output;
}

function leftShift(input, n) {
    const len = input.length;
    n = n % len; // Handle shifts greater than length
    return input.substring(n) + input.substring(0, n);
}

function xor(a, b) {
    let result = '';
    for (let i = 0; i < a.length; i++) {
        result += (parseInt(a[i]) ^ parseInt(b[i])).toString();
    }
    return result;
}

function sBoxLookup(input, sBox) {
    const row = parseInt(input[0] + input[3], 2);
    const col = parseInt(input[1] + input[2], 2);
    const val = sBox[row][col];
    return val.toString(2).padStart(2, '0'); // Return 2-bit binary string
}

// Core S-DES Functions
function generateKeys(key) {
    // P10
    const p10Key = permute(key, P10);
    const left5 = p10Key.substring(0, 5);
    const right5 = p10Key.substring(5, 10);

    // LS-1
    const ls1Left = leftShift(left5, 1);
    const ls1Right = leftShift(right5, 1);
    const combinedLS1 = ls1Left + ls1Right;

    // K1 (P8)
    const k1 = permute(combinedLS1, P8);

    // LS-2
    const ls2Left = leftShift(ls1Left, 2);
    const ls2Right = leftShift(ls1Right, 2);
    const combinedLS2 = ls2Left + ls2Right;

    // K2 (P8)
    const k2 = permute(combinedLS2, P8);

    return { k1, k2, p10Key, ls1Left, ls1Right, combinedLS1, ls2Left, ls2Right, combinedLS2 };
}

function fk(inputBits, subkey) {
    const left4 = inputBits.substring(0, 4);
    const right4 = inputBits.substring(4, 8);

    // E/P on right half
    const epResult = permute(right4, EP);

    // XOR with subkey
    const xorResult = xor(epResult, subkey);
    const xorLeft = xorResult.substring(0, 4);
    const xorRight = xorResult.substring(4, 8);

    // S-Boxes
    const s0Result = sBoxLookup(xorLeft, S0);
    const s1Result = sBoxLookup(xorRight, S1);
    const sboxCombined = s0Result + s1Result;

    // P4
    const p4Result = permute(sboxCombined, P4);

    // XOR with left half
    const finalXorResult = xor(p4Result, left4);

    return {
        output: finalXorResult + right4, // Output of round before swap
        fkResult: finalXorResult, // Result of the f_k part only (XORed with left half)
        p4Result: p4Result, // Output of P4 permutation
        sboxCombined: sboxCombined,
        s0Result: s0Result,
        s1Result: s1Result,
        xorResult: xorResult, // Output of XOR with subkey
        epResult: epResult, // Output of E/P
        rightHalfInput: right4,
        leftHalfInput: left4
    };
}

// --- NEW Visualization Helper ---
/**
 * Renders a binary string as a series of styled boxes within a target element.
 * @param {string} elementId - The ID of the container element.
 * @param {string} binaryString - The binary string to render.
 * @param {number} [groupSize=0] - Size of bit groups (0 for no grouping).
 */
function renderBinary(elementId, binaryString, groupSize = 0) {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = ''; // Clear previous content

    if (!binaryString) return; // Handle empty strings

    if (groupSize > 0) {
        for (let i = 0; i < binaryString.length; i += groupSize) {
            const group = document.createElement('span');
            group.className = 'bit-group';
            const chunk = binaryString.substring(i, i + groupSize);
            for (let bit of chunk) {
                const bitBox = document.createElement('span');
                bitBox.className = 'bit-box';
                bitBox.textContent = bit;
                group.appendChild(bitBox);
            }
            container.appendChild(group);
        }
    } else {
        for (let bit of binaryString) {
            const bitBox = document.createElement('span');
            bitBox.className = 'bit-box';
            bitBox.textContent = bit;
            container.appendChild(bitBox);
        }
    }
}

// --- NEW Highlight Helper ---
/**
 * Applies a temporary highlight class to an element.
 * @param {string} elementId - The ID of the element to highlight.
 * @param {number} duration - How long the highlight should last in milliseconds.
 */
function applyHighlight(elementId, duration) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('highlight');
        setTimeout(() => {
            element.classList.remove('highlight');
        }, duration);
    }
}

// Visualization Control Functions
function resetVisualization() {
    document.getElementById('sdes-form').reset();
    const steps = document.querySelectorAll('.step-container, #result');
    steps.forEach(step => step.style.display = 'none');
    // Clear previous results
    const codes = document.querySelectorAll('code, span[id$="-input"], span[id$="-xor"], strong');
    codes.forEach(code => code.textContent = '');
    // Clear previous results and highlights from visualization containers
    const vizContainers = document.querySelectorAll('.binary-visualization');
    vizContainers.forEach(container => {
        container.innerHTML = '';
        container.classList.remove('highlight'); // Remove highlight on reset
    });
}

function displayStep(stepId, delay) {
    return new Promise(resolve => {
        setTimeout(() => {
            document.getElementById(stepId).style.display = 'block';
            // Optional: Scroll into view
            // document.getElementById(stepId).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            resolve();
        }, delay);
    });
}

async function startSdesVisualization() {
    resetVisualization(); // Clear previous run

    const plaintext = document.getElementById('plaintext').value;
    const key = document.getElementById('key').value;

    // Basic validation
    if (!/^[01]{8}$/.test(plaintext)) {
        alert("Plaintext must be 8 binary digits.");
        return;
    }
    if (!/^[01]{10}$/.test(key)) {
        alert("Key must be 10 binary digits.");
        return;
    }

    const delay = 500; // Delay in ms between steps
    const highlightDuration = delay * 0.8; // Make highlight slightly shorter than step delay

    // --- Step 1: Initial Permutation ---
    renderBinary('ip-input', plaintext, 4); // Group by 4
    applyHighlight('ip-input', highlightDuration); // Highlight input
    await displayStep('step-initial-permutation', delay / 2); // Show card sooner
    const ipResult = permute(plaintext, IP);
    renderBinary('ip-output', ipResult, 4); // Group by 4
    applyHighlight('ip-output', highlightDuration); // Highlight output
    await new Promise(resolve => setTimeout(resolve, delay / 2)); // Wait remaining time

    // --- Step 2: Key Generation ---
    renderBinary('kgen-input-key', key, 5); // Group by 5
    applyHighlight('kgen-input-key', highlightDuration);
    await displayStep('step-key-generation', delay / 2);
    const keys = generateKeys(key);
    renderBinary('kgen-p10-output', keys.p10Key, 5); // Group by 5
    applyHighlight('kgen-p10-output', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('kgen-ls1-left', keys.ls1Left);
    renderBinary('kgen-ls1-right', keys.ls1Right);
    applyHighlight('kgen-ls1-left', highlightDuration);
    applyHighlight('kgen-ls1-right', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('kgen-ls1-combined', keys.combinedLS1, 5); // Group by 5
    applyHighlight('kgen-ls1-combined', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('kgen-k1', keys.k1, 4); // Group by 4
    applyHighlight('kgen-k1', highlightDuration * 1.5); // Highlight K1 longer
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('kgen-ls2-left', keys.ls2Left);
    renderBinary('kgen-ls2-right', keys.ls2Right);
    applyHighlight('kgen-ls2-left', highlightDuration);
    applyHighlight('kgen-ls2-right', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('kgen-ls2-combined', keys.combinedLS2, 5); // Group by 5
    applyHighlight('kgen-ls2-combined', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('kgen-k2', keys.k2, 4); // Group by 4
    applyHighlight('kgen-k2', highlightDuration * 1.5); // Highlight K2 longer
    await new Promise(resolve => setTimeout(resolve, delay));

    // --- Step 3: Round 1 ---
    renderBinary('r1-input', ipResult, 4); // Group by 4
    applyHighlight('r1-input', highlightDuration);
    renderBinary('r1-k1', keys.k1, 4); // Group by 4
    applyHighlight('r1-k1', highlightDuration);
    await displayStep('step-round-1', delay / 2);
    const round1 = fk(ipResult, keys.k1);
    renderBinary('r1-right-half-input', round1.rightHalfInput);
    applyHighlight('r1-right-half-input', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r1-ep-output', round1.epResult, 4); // Group by 4
    applyHighlight('r1-ep-output', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r1-ep-output-xor', round1.epResult, 4); // Group by 4
    renderBinary('r1-k1-xor', keys.k1, 4); // Group by 4
    applyHighlight('r1-ep-output-xor', highlightDuration);
    applyHighlight('r1-k1-xor', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r1-xor-k1-output', round1.xorResult, 4); // Group by 4
    applyHighlight('r1-xor-k1-output', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r1-sbox-input', round1.xorResult, 4); // Group by 4
    applyHighlight('r1-sbox-input', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r1-s0-output', round1.s0Result);
    renderBinary('r1-s1-output', round1.s1Result);
    applyHighlight('r1-s0-output', highlightDuration);
    applyHighlight('r1-s1-output', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r1-sbox-combined', round1.sboxCombined);
    applyHighlight('r1-sbox-combined', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r1-p4-output', round1.p4Result);
    applyHighlight('r1-p4-output', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r1-left-half-input', round1.leftHalfInput);
    renderBinary('r1-p4-output-xor', round1.p4Result);
    applyHighlight('r1-left-half-input', highlightDuration);
    applyHighlight('r1-p4-output-xor', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r1-xor-p4-output', round1.fkResult); // This is Left XOR P4 output
    applyHighlight('r1-xor-p4-output', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r1-output-noswap', round1.fkResult + round1.rightHalfInput, 4); // Combine Left XOR P4 with original Right, group 4
    applyHighlight('r1-output-noswap', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    // --- Step 4: Swap ---
    const beforeSwap = round1.fkResult + round1.rightHalfInput;
    const afterSwap = round1.rightHalfInput + round1.fkResult; // Swap the halves
    renderBinary('swap-input', beforeSwap, 4); // Group by 4
    applyHighlight('swap-input', highlightDuration);
    await displayStep('step-swap', delay / 2);
    renderBinary('swap-output', afterSwap, 4); // Group by 4
    applyHighlight('swap-output', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay / 2));

    // --- Step 5: Round 2 ---
    renderBinary('r2-input', afterSwap, 4); // Group by 4
    applyHighlight('r2-input', highlightDuration);
    renderBinary('r2-k2', keys.k2, 4); // Group by 4
    applyHighlight('r2-k2', highlightDuration);
    await displayStep('step-round-2', delay / 2);
    const round2 = fk(afterSwap, keys.k2);
    renderBinary('r2-right-half-input', round2.rightHalfInput);
    applyHighlight('r2-right-half-input', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r2-ep-output', round2.epResult, 4); // Group by 4
    applyHighlight('r2-ep-output', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r2-ep-output-xor', round2.epResult, 4); // Group by 4
    renderBinary('r2-k2-xor', keys.k2, 4); // Group by 4
    applyHighlight('r2-ep-output-xor', highlightDuration);
    applyHighlight('r2-k2-xor', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r2-xor-k2-output', round2.xorResult, 4); // Group by 4
    applyHighlight('r2-xor-k2-output', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r2-sbox-input', round2.xorResult, 4); // Group by 4
    applyHighlight('r2-sbox-input', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r2-s0-output', round2.s0Result);
    renderBinary('r2-s1-output', round2.s1Result);
    applyHighlight('r2-s0-output', highlightDuration);
    applyHighlight('r2-s1-output', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r2-sbox-combined', round2.sboxCombined);
    applyHighlight('r2-sbox-combined', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r2-p4-output', round2.p4Result);
    applyHighlight('r2-p4-output', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r2-left-half-input', round2.leftHalfInput);
    renderBinary('r2-p4-output-xor', round2.p4Result);
    applyHighlight('r2-left-half-input', highlightDuration);
    applyHighlight('r2-p4-output-xor', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r2-xor-p4-output', round2.fkResult); // This is Left XOR P4 output
    applyHighlight('r2-xor-p4-output', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    renderBinary('r2-output', round2.fkResult + round2.rightHalfInput, 4); // Combine Left XOR P4 with original Right, group 4
    applyHighlight('r2-output', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay));

    // --- Step 6: Final Permutation (IP^-1) ---
    const beforeFinalPerm = round2.fkResult + round2.rightHalfInput; // Output of Round 2 (no swap after last round)
    renderBinary('fp-input', beforeFinalPerm, 4); // Group by 4
    applyHighlight('fp-input', highlightDuration);
    await displayStep('step-final-permutation', delay / 2);
    const ciphertext = permute(beforeFinalPerm, IP_inv);
    renderBinary('fp-output', ciphertext, 4); // Group by 4
    applyHighlight('fp-output', highlightDuration);
    await new Promise(resolve => setTimeout(resolve, delay / 2));

    // --- Show Result ---
    renderBinary('result-plaintext', plaintext, 4); // Group by 4
    renderBinary('result-key', key, 5); // Group by 5
    renderBinary('result-ciphertext', ciphertext, 4); // Group by 4
    applyHighlight('result-ciphertext', highlightDuration * 2); // Highlight final result longer
    await displayStep('result', 0); // Show result immediately
}

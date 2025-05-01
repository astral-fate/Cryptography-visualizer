// --- Visualization Helper Functions (Copy/Adapt from sdes-visualization.js) ---

/**
 * Renders a binary string as styled boxes.
 * @param {string} elementId - The ID of the container element.
 * @param {string} binaryString - The binary string to render.
 * @param {number} [groupSize=8] - Size of bit groups (default 8 for 64-bit blocks).
 */
function renderBinary(elementId, binaryString, groupSize = 8) {
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

// --- Visualization Control Functions ---

function resetVisualization() {
    document.getElementById('triple-des-form').reset();
    // Hide all step cards and result
    const steps = document.querySelectorAll('.card[id^="step-"], #result');
    steps.forEach(step => step.style.display = 'none');
    // Clear previous results from visualization containers
    const vizContainers = document.querySelectorAll('.binary-visualization');
    vizContainers.forEach(container => {
        container.innerHTML = '';
        container.classList.remove('highlight'); // Remove highlight on reset
    });
     // Restore default values (optional)
     document.getElementById('plaintext').value = "0000000100100011010001010110011110001001101010111100110111101111";
     document.getElementById('key1').value = "0001001100110100010101110111100110011011101111001101111111110001";
     document.getElementById('key2').value = "0101011101111001100110111011110011011111111100010001001100110100";
     document.getElementById('key3').value = "0001001100110100010101110111100110011011101111001101111111110001";
}

function displayStep(stepId, delay) {
    return new Promise(resolve => {
        setTimeout(() => {
            const stepElement = document.getElementById(stepId);
            if (stepElement) {
                stepElement.style.display = 'block';
                // Optional: Scroll into view
                // stepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            resolve();
        }, delay);
    });
}

async function start3desVisualization() {
    resetVisualization(); // Clear previous run

    const plaintext = document.getElementById('plaintext').value;
    const key1 = document.getElementById('key1').value;
    const key2 = document.getElementById('key2').value;
    const key3 = document.getElementById('key3').value;

    // Basic validation
    if (!/^[01]{64}$/.test(plaintext)) {
        alert("Plaintext must be 64 binary digits.");
        return;
    }
    if (!/^[01]{64}$/.test(key1) || !/^[01]{64}$/.test(key2) || !/^[01]{64}$/.test(key3)) {
        alert("All three keys must be 64 binary digits.");
        return;
    }
     // Check if DES base logic is available
     if (typeof encrypt3DES_EDE !== 'function' || typeof permute !== 'function' || typeof IP === 'undefined' || typeof IP_inv === 'undefined') {
        alert("Error: Core DES/3DES logic functions are missing. Ensure des-logic-base.js is loaded and provides IP, IP_inv, permute, generateSubKeys, and runDesRounds.");
        return;
    }


    const delay = 700; // Delay in ms between steps
    const highlightDuration = delay * 0.8; // Highlight duration

    try {
        // Perform the entire 3DES calculation at once (simplified visualization)
        const results = encrypt3DES_EDE(plaintext, key1, key2, key3);

        // --- Step 1: Initial Permutation ---
        renderBinary('ip-input', results.plaintext);
        applyHighlight('ip-input', highlightDuration);
        await displayStep('step-initial-permutation', delay / 2);
        renderBinary('ip-output', results.ipOutput);
        applyHighlight('ip-output', highlightDuration);
        await new Promise(resolve => setTimeout(resolve, delay));

        // --- Step 2: DES Encrypt with K1 ---
        renderBinary('des1-input', results.ipOutput);
        renderBinary('des1-key', results.key1);
        applyHighlight('des1-input', highlightDuration);
        applyHighlight('des1-key', highlightDuration);
        await displayStep('step-des-encrypt-k1', delay / 2);
        renderBinary('des1-output', results.des1Output);
        applyHighlight('des1-output', highlightDuration);
        await new Promise(resolve => setTimeout(resolve, delay));

        // --- Step 3: DES Decrypt with K2 ---
        renderBinary('des2-input', results.des1Output);
        renderBinary('des2-key', results.key2);
        applyHighlight('des2-input', highlightDuration);
        applyHighlight('des2-key', highlightDuration);
        await displayStep('step-des-decrypt-k2', delay / 2);
        renderBinary('des2-output', results.des2Output);
        applyHighlight('des2-output', highlightDuration);
        await new Promise(resolve => setTimeout(resolve, delay));

        // --- Step 4: DES Encrypt with K3 ---
        renderBinary('des3-input', results.des2Output);
        renderBinary('des3-key', results.key3);
        applyHighlight('des3-input', highlightDuration);
        applyHighlight('des3-key', highlightDuration);
        await displayStep('step-des-encrypt-k3', delay / 2);
        renderBinary('des3-output', results.des3Output);
        applyHighlight('des3-output', highlightDuration);
        await new Promise(resolve => setTimeout(resolve, delay));

        // --- Step 5: Final Permutation (IP^-1) ---
        renderBinary('fp-input', results.des3Output);
        applyHighlight('fp-input', highlightDuration);
        await displayStep('step-final-permutation', delay / 2);
        renderBinary('fp-output', results.ciphertext);
        applyHighlight('fp-output', highlightDuration);
        await new Promise(resolve => setTimeout(resolve, delay));

        // --- Show Result ---
        renderBinary('result-plaintext', results.plaintext);
        renderBinary('result-key1', results.key1);
        renderBinary('result-key2', results.key2);
        renderBinary('result-key3', results.key3);
        renderBinary('result-ciphertext', results.ciphertext);
        applyHighlight('result-ciphertext', highlightDuration * 2);
        await displayStep('result', 0);

    } catch (error) {
        alert("Encryption Error: " + error.message);
        console.error(error);
    }
}

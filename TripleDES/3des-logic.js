// --- Helper Functions for BitArray Conversion ---

/**
 * Converts a binary string to a BitArray object using the factory method.
 * @param {string} binaryString - The binary string.
 * @returns {BitArray} The corresponding BitArray object.
 */
function binaryToBitArray(binaryString) {
    // Use the factory method directly if available
    if (typeof BitArray.fromBinary === 'function') {
        return BitArray.fromBinary(binaryString);
    } else {
        // Fallback or error if fromBinary is not defined (should not happen if script loaded)
        throw new Error("BitArray.fromBinary is not defined. Check script loading order.");
        // Original hex conversion logic (kept as potential fallback, but less ideal)
        /*
        if (binaryString.length % 4 !== 0) {
            throw new Error("Binary string length must be a multiple of 4 for hex conversion.");
        }
        let hexString = '';
        for (let i = 0; i < binaryString.length; i += 4) {
            const nibble = binaryString.substr(i, 4);
            hexString += parseInt(nibble, 2).toString(16);
        }
        return new BitArray(binaryString.length, hexString);
        */
    }
}

/**
 * Converts a BitArray object to a binary string using its method.
 * @param {BitArray} bitArray - The BitArray object.
 * @returns {string} The corresponding binary string.
 */
function bitArrayToBinary(bitArray) {
    // Use the instance method if available
    if (typeof bitArray.toBinaryString === 'function') {
        // Remove spaces potentially added by toBinaryString(spaceFrequency)
        return bitArray.toBinaryString().replace(/\s/g, '');
    } else {
        // Fallback or error
        throw new Error("BitArray.prototype.toBinaryString is not defined.");
        // Original manual conversion (kept as potential fallback)
        /*
        let binaryString = '';
        for (let i = 0; i < bitArray.length; i++) {
            binaryString += bitArray.get(i) ? '1' : '0'; // Assuming .get() returns boolean
        }
        return binaryString;
        */
    }
}

// --- Define DES constants locally using values from DES.js ---
const IP = DES.PERMUTATION_MAPPINGS.INITIAL_PERMUTATION;
const IP_inv = DES.PERMUTATION_MAPPINGS.FINAL_PERMUTATION;

// --- Wrapper functions for DES operations using DES.js ---

/**
 * Permutes a binary string using a DES permutation table.
 * @param {string} inputBinary - The input binary string.
 * @param {number[]} table - The permutation table (e.g., IP, IP_inv).
 * @returns {string} The permuted binary string.
 */
function permute(inputBinary, table) {
    const inputBitArray = binaryToBitArray(inputBinary);
    const outputBitArray = DES.permute(inputBitArray, table);
    return bitArrayToBinary(outputBitArray);
}

/**
 * Generates DES subkeys from a 64-bit binary key string.
 * @param {string} keyBinary - The 64-bit binary key string.
 * @returns {Array<BitArray>} An array of 16 BitArray subkeys.
 */
function generateSubKeys(keyBinary) {
    const keyBitArray = binaryToBitArray(keyBinary);
    const keyGenerationResult = DES._generateKeys(keyBitArray);
    // Extract the actual BitArray keys from the result structure
    return keyGenerationResult.roundKeyParts.map(part => part.key);
}

/**
 * Runs the 16 DES rounds (Feistel structure).
 * @param {BitArray} inputBitArray - The 64-bit input BitArray (output of IP).
 * @param {Array<BitArray>} subkeysArray - The array of 16 BitArray subkeys.
 * @param {boolean} isDecryptMode - True for decryption, false for encryption.
 * @returns {BitArray} The 64-bit BitArray output *before* the final permutation (IP_inv).
 */
function runDesRounds(inputBitArray, subkeysArray, isDecryptMode) {
    // --- Input Validation ---
    if (!inputBitArray || typeof inputBitArray.slice !== 'function' || inputBitArray.length !== 64) {
        console.error("Invalid inputBitArray passed to runDesRounds:", inputBitArray);
        throw new Error("Invalid inputBitArray for DES rounds. Must be a 64-bit BitArray.");
    }
    if (!Array.isArray(subkeysArray) || subkeysArray.length !== 16 || !subkeysArray[0] || typeof subkeysArray[0].xor !== 'function') {
         console.error("Invalid subkeysArray passed to runDesRounds:", subkeysArray);
         throw new Error("Invalid subkeysArray for DES rounds. Must be an array of 16 BitArrays.");
    }
    // --- End Input Validation ---

    const mode = isDecryptMode ? DES.MODE.DECRYPTION : DES.MODE.ENCRYPTION;
    // DES._doRounds now returns an array of round objects
    const roundsResult = DES._doRounds(subkeysArray, inputBitArray, mode);

    // Check if roundsResult is an array and has the last round
    if (!Array.isArray(roundsResult) || roundsResult.length !== DES.NUM_ROUNDS) {
        console.error("Unexpected structure returned from DES._doRounds:", roundsResult);
        throw new Error("DES._doRounds did not return the expected array of round results.");
    }

    const lastRoundOutput = roundsResult[DES.NUM_ROUNDS - 1];

    // The output of the 16th round is L16 R16.
    // The final swap (before FP) makes it R16 L16.
    if (lastRoundOutput && lastRoundOutput.leftFinal && lastRoundOutput.rightFinal) {
        // Reconstruct R16 L16
        return lastRoundOutput.rightFinal.concat(lastRoundOutput.leftFinal);
    } else {
        // If the structure is completely different, throw an error.
        console.error("Unexpected structure for last DES round result:", lastRoundOutput);
        throw new Error("Cannot determine final output before FP from DES rounds.");
    }
}

/**
 * Performs the Triple DES encryption (Encrypt-Decrypt-Encrypt variant).
 * Assumes plaintext and keys are 64-bit binary strings.
 * Relies on functions from des.js via local wrappers.
 *
 * @param {string} plaintextBinary - 64-bit binary string.
 * @param {string} key1Binary - 64-bit binary string for K1.
 * @param {string} key2Binary - 64-bit binary string for K2.
 * @param {string} key3Binary - 64-bit binary string for K3.
 * @returns {object} An object containing intermediate results and the final ciphertext.
 */
function encrypt3DES_EDE(plaintextBinary, key1Binary, key2Binary, key3Binary) {
    // Input validation (keep as is)
    if (!plaintextBinary || plaintextBinary.length !== 64 || !/^[01]+$/.test(plaintextBinary)) {
        throw new Error("Plaintext must be a 64-bit binary string.");
    }
    if (!key1Binary || key1Binary.length !== 64 || !/^[01]+$/.test(key1Binary) ||
        !key2Binary || key2Binary.length !== 64 || !/^[01]+$/.test(key2Binary) ||
        !key3Binary || key3Binary.length !== 64 || !/^[01]+$/.test(key3Binary)) {
        throw new Error("Keys must be 64-bit binary strings.");
    }

    // --- Stage 0: Initial Permutation ---
    const ipOutputBinary = permute(plaintextBinary, IP);
    const ipOutputBitArray = binaryToBitArray(ipOutputBinary);

    // --- Stage 1: DES Encrypt with K1 ---
    const subKeys1 = generateSubKeys(key1Binary);
    const des1OutputBitArray = runDesRounds(ipOutputBitArray, subKeys1, false); // false = encrypt mode

    // --- Stage 2: DES Decrypt with K2 ---
    // --- Add Validation before Stage 2 ---
    if (!des1OutputBitArray || typeof des1OutputBitArray.slice !== 'function' || des1OutputBitArray.length !== 64) {
         console.error("Invalid intermediate result (des1OutputBitArray) before DES2:", des1OutputBitArray);
         throw new Error("Invalid intermediate BitArray result before DES2 decryption.");
    }
    const subKeys2 = generateSubKeys(key2Binary);
     if (!Array.isArray(subKeys2) || subKeys2.length !== 16 || !subKeys2[0] || typeof subKeys2[0].xor !== 'function') {
         console.error("Invalid subKeys2 generated for DES2:", subKeys2);
         throw new Error("Invalid subkeys generated for DES2 decryption.");
    }
    // --- End Validation ---
    const des2OutputBitArray = runDesRounds(des1OutputBitArray, subKeys2, true); // true = decrypt mode

    // --- Stage 3: DES Encrypt with K3 ---
     // --- Add Validation before Stage 3 ---
    if (!des2OutputBitArray || typeof des2OutputBitArray.slice !== 'function' || des2OutputBitArray.length !== 64) {
         console.error("Invalid intermediate result (des2OutputBitArray) before DES3:", des2OutputBitArray);
         throw new Error("Invalid intermediate BitArray result before DES3 encryption.");
    }
    const subKeys3 = generateSubKeys(key3Binary);
     if (!Array.isArray(subKeys3) || subKeys3.length !== 16 || !subKeys3[0] || typeof subKeys3[0].xor !== 'function') {
         console.error("Invalid subKeys3 generated for DES3:", subKeys3);
         throw new Error("Invalid subkeys generated for DES3 encryption.");
    }
    // --- End Validation ---
    const des3OutputBitArray = runDesRounds(des2OutputBitArray, subKeys3, false); // false = encrypt mode

    // --- Stage 4: Final Permutation ---
    // Input to FP is the output of the last DES operation (des3OutputBitArray)
    const des3OutputBinary = bitArrayToBinary(des3OutputBitArray);
    const ciphertextBinary = permute(des3OutputBinary, IP_inv);

    return {
        plaintext: plaintextBinary,
        key1: key1Binary,
        key2: key2Binary,
        key3: key3Binary,
        ipOutput: ipOutputBinary, // Binary string after IP
        des1Output: bitArrayToBinary(des1OutputBitArray), // Binary string after DES1 (before FP of DES1)
        des2Output: bitArrayToBinary(des2OutputBitArray), // Binary string after DES2 (before FP of DES2)
        des3Output: des3OutputBinary, // Binary string after DES3 (before final FP)
        ciphertext: ciphertextBinary // Final binary string ciphertext
    };
}

// Note: This implementation assumes the structure and behavior of functions
// in your specific DES/js/des.js and DES/js/bit_array.js files.
// Adjustments might be needed based on the exact implementation details therein,
// particularly around BitArray creation and how DES._doRounds handles decryption keys.

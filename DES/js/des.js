let DES = {};

DES.generateRandomKey = function () {
	let result = BitArray.generateRandom(64);

	DES.setParityBits(result);

	return result;
};

DES.generateRandomMessage = function() {
	return BitArray.generateRandom(64);
};

DES.setParityBits = function(bitArray) {
	for (let bitIndex = 0; bitIndex < bitArray.length; bitIndex += 8) {
		let num1Bits = 0;

		for (let subBitIndex = bitIndex; subBitIndex < bitIndex + 7; subBitIndex++) {
			num1Bits += bitArray.get(subBitIndex);
		}

		let parityBit = (num1Bits % 2 === 0)? 1 : 0;

		bitArray.set(bitIndex + 7, parityBit);
	}
};

/**
 * Sizes an input to 64 bits exactly. Will add padding with zeros to the end if necessary.
 */
DES._sizeInput = function(input) {
    let result = new BitArray(64);
    let loopTimes = Math.min(result.length, input.length);

    for (let i = 0; i < loopTimes; i++) {
    	result.set(i, input.get(i));
	}

	return result;
};

/**
 * Encrypts the given input with the given key. Will return a result containing data from each step of the encryption.
 */
DES.encrypt = function(key, input) {
	return DES._encryptOrDecrypt(key, input, DES.MODE.ENCRYPTION);
};

DES.decrypt = function(key, input) {
	return DES._encryptOrDecrypt(key, input, DES.MODE.DECRYPTION);
};

DES._encryptOrDecrypt = function(key, input, mode) {
    let result = {};

    result.key = DES._sizeInput(key);
    result.input = DES._sizeInput(input);

    result.initialPermutation = DES.permute(result.input, DES.PERMUTATION_MAPPINGS.INITIAL_PERMUTATION);

    result.roundKeys = DES._generateKeys(result.key);

    if (mode === DES.MODE.DECRYPTION) {
        // For decryption, the subkeys are used in reverse order within _doRounds
        // No need to reverse the array here if _doRounds handles it based on mode.
        // Let's keep the original key generation order but pass the DECRYPTION mode.
    }

    // Pass the correct mode to _doRounds
    result.rounds = DES._doRounds(result.roundKeys.roundKeyParts, result.initialPermutation, mode);

    // Access the last round's data from the returned array
    const lastRound = result.rounds[DES.NUM_ROUNDS - 1];
    if (!lastRound || !lastRound.left || !lastRound.right) {
         console.error("Error: Last round data is missing or incomplete in _encryptOrDecrypt.", lastRound);
         throw new Error("Failed to retrieve final round data.");
    }
    // The output *before* the final permutation is R16 L16 (due to the swap in the last round)
    result.finalRoundSwitch = lastRound.right.concat(lastRound.left);

    result.final = DES.permute(result.finalRoundSwitch, DES.PERMUTATION_MAPPINGS.FINAL_PERMUTATION);

    return result;
};

DES._doRounds = function(subkeys, input, mode) {
    let result = []; // Array to store details of each round
    let currentLeft, currentRight;

    // --- Added Validation ---
    if (!input || typeof input.slice !== 'function' || input.length !== 64) {
        console.error("DES._doRounds error: Invalid 64-bit input provided.", input);
        throw new Error("Invalid input type for DES._doRounds. Expected 64-bit BitArray.");
    }
    if (!Array.isArray(subkeys) || subkeys.length !== 16 || !subkeys[0] || typeof subkeys[0].xor !== 'function') {
        console.error("DES._doRounds error: Invalid subkeys provided.", subkeys);
        throw new Error("Invalid subkeys for DES._doRounds. Expected Array of 16 48-bit BitArrays.");
    }
    // --- End Added Validation ---


    currentLeft = input.slice(0, 32);
    currentRight = input.slice(32, 64);

    let numRounds = subkeys.length;

    for (let roundIndex = 0; roundIndex < numRounds; roundIndex++) {
        let roundData = {}; // Object to store data for this specific round
        roundData.inputLeft = currentLeft.copy(); // Input to the round
        roundData.inputRight = currentRight.copy(); // Input to the round

        roundData.roundIndex = roundIndex;
        // Select subkey based on mode (encryption uses K1..K16, decryption uses K16..K1)
        roundData.roundKey = (mode === DES.MODE.ENCRYPTION)? subkeys[roundIndex] : subkeys[numRounds - 1 - roundIndex];

        // --- Added Validation ---
        if (!roundData.roundKey || typeof roundData.roundKey.slice !== 'function' || roundData.roundKey.length !== 48) {
             console.error(`DES._doRounds error: Invalid roundKey for round ${roundIndex} (mode: ${mode}).`, roundData.roundKey);
             throw new Error(`Invalid roundKey generated/selected for round ${roundIndex}. Expected 48-bit BitArray.`);
        }
        // --- End Added Validation ---


        let previousLeft = currentLeft;
        let previousRight = currentRight;

        // --- Added Validation ---
         if (!previousRight || typeof previousRight.slice !== 'function' || previousRight.length !== 32) {
             console.error(`DES._doRounds error: Invalid previousRight before mangle for round ${roundIndex}.`, previousRight);
             throw new Error(`Invalid right half data before mangle in round ${roundIndex}. Expected 32-bit BitArray.`);
         }
        // --- End Added Validation ---


        // L_i = R_{i-1}
        currentLeft = previousRight;

        let manglerData = this._mangle(roundData.roundKey, previousRight);
        roundData.manglerData = manglerData;

        // --- Added Validation ---
         if (!previousLeft || typeof previousLeft.copy !== 'function' || previousLeft.length !== 32) {
             console.error(`DES._doRounds error: Invalid previousLeft before xor for round ${roundIndex}.`, previousLeft);
             throw new Error(`Invalid left half data before xor in round ${roundIndex}. Expected 32-bit BitArray.`);
         }
         if (!manglerData || !manglerData.finalOutput || typeof manglerData.finalOutput.xor !== 'function' || manglerData.finalOutput.length !== 32) {
             console.error(`DES._doRounds error: Invalid manglerData.finalOutput before xor for round ${roundIndex}.`, manglerData);
             throw new Error(`Invalid mangler output before xor in round ${roundIndex}. Expected 32-bit BitArray.`);
         }
        // --- End Added Validation ---


        // R_i = L_{i-1} XOR f(R_{i-1}, K_i)
        currentRight = previousLeft.copy(); // Create a copy before modifying
        currentRight.xor(manglerData.finalOutput);

        // Store results for this round
        roundData.leftFinal = currentLeft.copy(); // L_i
        roundData.rightFinal = currentRight.copy(); // R_i

        result[roundIndex] = roundData; // Store the detailed round data

        // Note: The swap for the *next* round happens implicitly by how currentLeft/currentRight are used in the next iteration.
        // The final swap *after* round 16 is handled outside the loop or by how the final result is constructed.
    }

    // The loop finishes with L16 and R16 in currentLeft and currentRight.
    // The standard DES output before final permutation is R16 L16.
    // However, the visualization/structure seems to expect the array of round objects.

    // Return the array containing data for all rounds.
    return result;
};

/**
 * Performs a data permutation. Permutes data according to a permutation mapping, which maps input bit indexes to output bit indexes.
 */
DES.permute = function(input, mapping) {
    // --- Added Validation ---
    if (!input || typeof input.get !== 'function' || typeof input.length !== 'number') {
        console.error("Permutation error: Invalid input provided. Expected BitArray.", input);
        throw new Error("Invalid input type for DES.permute. Expected BitArray.");
    }
    if (!Array.isArray(mapping)) {
        console.error("Permutation error: Invalid mapping provided. Expected Array.", mapping);
        throw new Error("Invalid mapping type for DES.permute. Expected Array.");
    }
    // --- End Added Validation ---

    // --- Modified Length Check ---
    // The result length is determined by the mapping length.
    let result = new BitArray(mapping.length);

    for (let i = 0; i < mapping.length; i++) {
        let inputIndex = mapping[i] - 1; // Mapping indices are 1-based

        // Check if the index from the mapping is valid for the input array
        if (inputIndex < 0 || inputIndex >= input.length) {
            console.error(`Permutation error: Mapping index ${mapping[i]} (0-based: ${inputIndex}) is out of bounds for input of length ${input.length}.`);
            throw new Error(`Permutation mapping index ${mapping[i]} is invalid for input length ${input.length}.`);
        }
    	result.set(i, input.get(inputIndex));
	}
    // --- End Modified Length Check & Loop ---

	return result;
};

DES._generateKeys = function(inputKey) {
	let result = {};

	result.roundKeyParts = [];

	result.initialKeyPermutations = {'c': DES.permute(inputKey, DES.PERMUTATION_MAPPINGS.PC1_C), 'd': DES.permute(inputKey, DES.PERMUTATION_MAPPINGS.PC1_D)};

	let lastC = result.initialKeyPermutations.c;
	let lastD = result.initialKeyPermutations.d;

	for (let roundIndex = 0; roundIndex < DES.NUM_ROUNDS; roundIndex++) {
		let keyParts = {};

		keyParts.preShiftC = lastC.copy();
		keyParts.preShiftD = lastD.copy();

		keyParts.shiftedC = keyParts.preShiftC.copy();
		keyParts.shiftedC.shiftLeft(DES.PER_ROUND_KEY_SHIFTS[roundIndex], true);

		keyParts.shiftedD = keyParts.preShiftD.copy();
		keyParts.shiftedD.shiftLeft(DES.PER_ROUND_KEY_SHIFTS[roundIndex], true);

		keyParts.combinedCD = keyParts.shiftedC.concat(keyParts.shiftedD);

		keyParts.pc2C = DES.permute(keyParts.combinedCD, DES.PERMUTATION_MAPPINGS.PC2_C);
		keyParts.pc2D = DES.permute(keyParts.combinedCD, DES.PERMUTATION_MAPPINGS.PC2_D);

		keyParts.key = keyParts.pc2C.concat(keyParts.pc2D);

		lastC = keyParts.shiftedC;
		lastD = keyParts.shiftedD;

		result.roundKeyParts[roundIndex] = keyParts;
	}

	return result;
};

DES._mangle = function(roundKey, input) {
    // --- Added Validation ---
    if (!input || typeof input.slice !== 'function' || input.length !== 32) {
        console.error("DES._mangle error: Invalid 32-bit input provided.", input);
        throw new Error("Invalid input type for DES._mangle. Expected 32-bit BitArray.");
    }
    if (!roundKey || typeof roundKey.slice !== 'function' || roundKey.length !== 48) {
        console.error("DES._mangle error: Invalid 48-bit roundKey provided.", roundKey);
        throw new Error("Invalid roundKey type for DES._mangle. Expected 48-bit BitArray.");
    }
    // console.log("_mangle input:", input.toBinaryString()); // Optional: Log input
    // console.log("_mangle roundKey:", roundKey.toBinaryString()); // Optional: Log key
    // --- End Added Validation ---

	let manglerData = {};

    manglerData.expandedData = DES.permute(input, DES.PERMUTATION_MAPPINGS.MANGLER_EXPAND_PERMUTATION);

    // --- Added Validation ---
    if (!manglerData.expandedData || typeof manglerData.expandedData.slice !== 'function' || manglerData.expandedData.length !== 48) {
         console.error("DES._mangle error: Invalid expandedData after permutation.", manglerData.expandedData);
         throw new Error("Invalid expandedData after permutation in DES._mangle. Expected 48-bit BitArray.");
    }
    // console.log("_mangle expandedData:", manglerData.expandedData.toBinaryString()); // Optional: Log expanded data
    // --- End Added Validation ---


	manglerData.sBoxDataInputs = DES._getSBoxInputs(manglerData.expandedData);
	manglerData.sBoxKeyInputs = DES._getSBoxInputs(roundKey);

	manglerData.sBoxFinalInputs = [];
	for (let i = 0; i < 8; i++) {
        // --- Added Validation ---
        if (!manglerData.sBoxDataInputs[i] || !manglerData.sBoxKeyInputs[i] || typeof manglerData.sBoxDataInputs[i].copy !== 'function') {
             console.error(`DES._mangle error: Invalid SBox input for index ${i}.`, manglerData.sBoxDataInputs[i], manglerData.sBoxKeyInputs[i]);
             throw new Error(`Invalid SBox input BitArray for index ${i} in DES._mangle.`);
        }
        // --- End Added Validation ---
		let thisFinalInput = manglerData.sBoxDataInputs[i].copy();
		thisFinalInput.xor(manglerData.sBoxKeyInputs[i]);

		manglerData.sBoxFinalInputs[i] = thisFinalInput;
	}

	DES._processSBoxChunks(manglerData);

	manglerData.combinedOutputs = DES._combineSBoxOutputs(manglerData);
	manglerData.finalOutput = DES.permute(manglerData.combinedOutputs, DES.PERMUTATION_MAPPINGS.SBOX_PERMUTATION);

	return manglerData;
};

DES._getSBoxInputs = function(data) { // Renamed parameter for clarity
    // --- Added Validation ---
    if (!data || typeof data.slice !== 'function' || data.length !== 48) {
        console.error("DES._getSBoxInputs error: Invalid 48-bit data provided.", data);
        // If data is undefined here, this is the root cause seen in the stack trace
        throw new Error("Invalid data type for DES._getSBoxInputs. Expected 48-bit BitArray.");
    }
    // --- End Added Validation ---

	let result = [];

	for (let i = 0; i < 8; i++) {
		let startBitIndex = i * 6;
		let endBitIndex = startBitIndex + 6;

		result[i] = data.slice(startBitIndex, endBitIndex); // Error was occurring here
	}

	return result;
};

DES._processSBoxChunks = function(manglerData) {
    manglerData.rowColumnData = [];
    manglerData.sBoxOutputs = [];

    for (let sBoxIndex = 0; sBoxIndex < 8; sBoxIndex++) {
        // --- Added Validation ---
        if (!manglerData.sBoxFinalInputs[sBoxIndex] || typeof manglerData.sBoxFinalInputs[sBoxIndex].get !== 'function' || manglerData.sBoxFinalInputs[sBoxIndex].length !== 6) {
             console.error(`DES._processSBoxChunks error: Invalid sBoxFinalInput for index ${sBoxIndex}.`, manglerData.sBoxFinalInputs[sBoxIndex]);
             throw new Error(`Invalid sBoxFinalInput BitArray for index ${sBoxIndex} in DES._processSBoxChunks.`);
        }
        // --- End Added Validation ---
    	let rowColumn = DES._getSBoxRowAndColumn(manglerData.sBoxFinalInputs[sBoxIndex]);

        let sBoxDataIndex = rowColumn.row * 16 + rowColumn.column;
        manglerData.sBoxOutputs[sBoxIndex] = BitArray.fromNumber(DES.SBOXES[sBoxIndex][sBoxDataIndex], 4);
        manglerData.rowColumnData[sBoxIndex] = rowColumn;
	}
};

DES._combineSBoxOutputs = function(manglerData) {
    // --- Added Validation ---
     if (!manglerData || !Array.isArray(manglerData.sBoxOutputs) || manglerData.sBoxOutputs.length !== 8 || !manglerData.sBoxOutputs[0] || typeof manglerData.sBoxOutputs[0].copy !== 'function') {
         console.error("DES._combineSBoxOutputs error: Invalid manglerData.sBoxOutputs.", manglerData);
         throw new Error("Invalid sBoxOutputs array in DES._combineSBoxOutputs.");
     }
    // --- End Added Validation ---
	let result = manglerData.sBoxOutputs[0].copy();

	for (let i = 1; i < manglerData.sBoxOutputs.length; i++) {
        // --- Added Validation ---
         if (!manglerData.sBoxOutputs[i] || typeof manglerData.sBoxOutputs[i].concat !== 'function' || manglerData.sBoxOutputs[i].length !== 4) {
             console.error(`DES._combineSBoxOutputs error: Invalid sBoxOutput at index ${i}.`, manglerData.sBoxOutputs[i]);
             throw new Error(`Invalid sBoxOutput BitArray at index ${i} in DES._combineSBoxOutputs.`);
         }
        // --- End Added Validation ---
		result = result.concat(manglerData.sBoxOutputs[i]);
	}
    // --- Added Validation ---
     if (!result || result.length !== 32) {
         console.error("DES._combineSBoxOutputs error: Final combined output is not 32 bits.", result);
         throw new Error("Combined S-Box output is not 32 bits.");
     }
    // --- End Added Validation ---

	return result;
};

DES._getSBoxRowAndColumn = function(input) {
	let result = {};

	let rowBit1 = (input.get(0))? 1 : 0;
	let rowBit2 = (input.get(5))? 1 : 0;

	result.row = (rowBit1 << 1) | rowBit2;

    let columnBit1 = (input.get(1))? 1 : 0;
    let columnBit2 = (input.get(2))? 1 : 0;
    let columnBit3 = (input.get(3))? 1 : 0;
    let columnBit4 = (input.get(4))? 1 : 0;

	result.column = (columnBit1 << 3) | (columnBit2 << 2) | (columnBit3 << 1) | columnBit4;

	return result;
};


//Permutation mappings map input bit indices to output bit indices
//Each value in a mapping corresponds to the input bit index (plus 1), and each value's index in the array corresponds with
//the appropriate bit index in the resulting permutation.
//These mappings are structured the same way as in the book and in online sources.
DES.PERMUTATION_MAPPINGS = {};

DES.PERMUTATION_MAPPINGS.PC1_C = [
	57, 49, 41, 33, 25, 17,  9,
	 1, 58, 50, 42, 34, 26, 18,
	10,  2, 59, 51, 43, 35, 27,
	19, 11,  3, 60, 52, 44, 36
	
];

DES.PERMUTATION_MAPPINGS.PC1_D = [
	63, 55, 47, 39, 31, 23, 15,
	 7, 62, 54, 46, 38, 30, 22,
	14,  6, 61, 53, 45, 37, 29,
	21, 13,  5, 28, 20, 12,  4
];

DES.PERMUTATION_MAPPINGS.PC2_C = [
	14, 17, 11, 24,  1,  5,
	 3, 28, 15,  6, 21, 10,
	23, 19, 12,  4, 26,  8,
	16,  7, 27, 20, 13,  2
];

DES.PERMUTATION_MAPPINGS.PC2_D = [
	41, 52, 31, 37, 47, 55,
	30, 40, 51, 45, 33, 48,
	44, 49, 39, 56, 34, 53,
	46, 42, 50, 36, 29, 32
];

DES.PERMUTATION_MAPPINGS.INITIAL_PERMUTATION = [
	58, 50, 42, 34, 26, 18, 10,  2,
	60, 52, 44, 36, 28, 20, 12,  4,
	62, 54, 46, 38, 30, 22, 14,  6,
	64, 56, 48, 40, 32, 24, 16,  8,
	57, 49, 41, 33, 25, 17,  9,  1,
	59, 51, 43, 35, 27, 19, 11,  3,
	61, 53, 45, 37, 29, 21, 13,  5,
	63, 55, 47, 39, 31, 23, 15,  7
];

DES.PERMUTATION_MAPPINGS.FINAL_PERMUTATION = [
	40,  8, 48, 16, 56, 24, 64, 32,
	39,  7, 47, 15, 55, 23, 63, 31,
	38,  6, 46, 14, 54, 22, 62, 30,
	37,  5, 45, 13, 53, 21, 61, 29,
	36,  4, 44, 12, 52, 20, 60, 28,
	35,  3, 43, 11, 51, 19, 59, 27,
	34,  2, 42, 10, 50, 18, 58, 26,
	33,  1, 41,  9, 49, 17, 57, 25
];

DES.PERMUTATION_MAPPINGS.MANGLER_EXPAND_PERMUTATION = [
    32,  1,  2,  3,  4,  5,
     4,  5,  6,  7,  8,  9,
     8,  9, 10, 11, 12, 13,
    12, 13, 14, 15, 16, 17,
    16, 17, 18, 19, 20, 21,
    20, 21, 22, 23, 24, 25,
    24, 25, 26, 27, 28, 29,
    28, 29, 30, 31, 32,  1
];

DES.PERMUTATION_MAPPINGS.SBOX_PERMUTATION = [16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26, 5, 18, 31, 10, 2, 8, 24, 14, 32, 27, 3, 9, 19, 13, 30, 6, 22, 11, 4, 25];

DES.SBOXES = [];

DES.SBOXES[0] = [
	14,  4, 13,  1,  2, 15, 11,  8,  3, 10,  6, 12,  5,  9,  0,  7,
	 0, 15,  7,  4, 14,  2, 13,  1, 10,  6, 12, 11,  9,  5,  3,  8,
	 4,  1, 14,  8, 13,  6,  2, 11, 15, 12,  9,  7,  3, 10,  5,  0,
	15, 12,  8,  2,  4,  9,  1,  7,  5, 11,  3, 14, 10,  0,  6, 13
];

DES.SBOXES[1] = [
    15,	 1,  8, 14,  6, 11,  3,  4,  9,	 7,	 2, 13,	12,  0,  5, 10,
     3,	13,	 4,  7, 15,  2,  8, 14, 12,  0,  1, 10,  6,  9, 11,  5,
	 0, 14,  7, 11, 10,  4, 13,  1,  5,  8, 12,  6,  9,  3,  2, 15,
   	13,  8, 10,  1,  3, 15,  4,  2, 11,  6,  7, 12,  0,  5, 14,  9
];

DES.SBOXES[2] = [
    10,  0,  9, 14,  6,  3, 15,  5,  1, 13, 12,  7, 11,  4,  2,  8,
    13,  7,  0,  9,  3,  4,  6, 10,  2,  8,  5, 14, 12, 11, 15,  1,
    13,  6,  4,  9,  8, 15,  3,  0, 11,  1,  2, 12,  5, 10, 14,  7,
     1, 10, 13,  0,  6,  9,  8,  7,  4, 15, 14,  3, 11,  5,  2, 12
];

DES.SBOXES[3] = [
     7, 13, 14,  3,  0,  6,  9, 10,  1,  2,  8,  5, 11, 12,  4, 15,
    13,  8, 11,  5,  6, 15,  0,  3,  4,  7,  2, 12,  1, 10, 14,  9,
    10,  6,  9,  0, 12, 11,  7, 13, 15,  1,  3, 14,  5,  2,  8,  4,
     3, 15,  0,  6, 10,  1, 13,  8,  9,  4,  5, 11, 12,  7,  2, 14
];

DES.SBOXES[4] = [
     2, 12,  4,  1,  7, 10, 11,  6,  8,  5,  3, 15, 13,  0, 14,  9,
    14, 11,  2, 12,  4,  7, 13,  1,  5,  0, 15, 10,  3,  9,  8,  6,
     4,  2,  1, 11, 10, 13,  7,  8, 15,  9, 12,  5,  6,  3,  0, 14,
    11,  8, 12,  7,  1, 14,  2, 13,  6, 15,  0,  9, 10,  4,  5,  3
];

DES.SBOXES[5] = [
    12,  1, 10, 15,  9,  2,  6,  8,  0, 13,  3,  4, 14,  7,  5, 11,
    10, 15,  4,  2,  7, 12,  9,  5,  6,  1, 13, 14,  0, 11,  3,  8,
     9, 14, 15,  5,  2,  8, 12,  3,  7,  0,  4, 10,  1, 13, 11,  6,
     4,  3,  2, 12,  9,  5, 15, 10, 11, 14,  1,  7,  6,  0,  8, 13
];

DES.SBOXES[6] = [
     4, 11,  2, 14, 15,  0,  8, 13,  3, 12,  9,  7,  5, 10,  6,  1,
    13,  0, 11,  7,  4,  9,  1, 10, 14,  3,  5, 12,  2, 15,  8,  6,
     1,  4, 11, 13, 12,  3,  7, 14, 10, 15,  6,  8,  0,  5,  9,  2,
     6, 11, 13,  8,  1,  4, 10,  7,  9,  5,  0, 15, 14,  2,  3, 12
];

DES.SBOXES[7] = [
    13,  2,  8,  4,  6, 15, 11,  1, 10,  9,  3, 14,  5,  0, 12,  7,
     1, 15, 13,  8, 10,  3,  7,  4, 12,  5,  6, 11,  0, 14,  9,  2,
     7, 11,  4,  1,  9, 12, 14,  2,  0,  6, 10, 13, 15,  3,  5,  8,
     2,  1, 14,  7,  4, 10,  8, 13, 15, 12,  9,  0,  3,  5,  6, 11
];

DES.PER_ROUND_KEY_SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];
DES.NUM_ROUNDS = DES.PER_ROUND_KEY_SHIFTS.length;

DES.MODE = {};
DES.MODE.ENCRYPTION = 1;
DES.MODE.DECRYPTION = 2;
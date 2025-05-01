let matrix = [];
generateEmptyMatrix();

function generateMatrix(key) {
  key = key.toUpperCase().replace(/[^A-Z]/g, '');
  key = key.replace(/J/g, 'I'); // Replace 'J' with 'I' in the key

  let filteredAlphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'.split('').filter(char => !key.includes(char));

  let keyWithoutIJ = Array.from(new Set(key)).join(''); // Treat 'I' and 'J' as a single character
  let keyAlphabet = keyWithoutIJ + filteredAlphabet.join('');

  matrix = [];
  let index = 0;

  for (let i = 0; i < 5; i++) {
    let row = [];
    for (let j = 0; j < 5; j++) {
      if (index < keyAlphabet.length) {
        row.push(keyAlphabet[index]);
        index++;
      }
    }
    
    matrix.push(row);
  }

  // Add 'Z' to the matrix if needed
  addZToMatrix();

  displayGrid();
}

function encryptPair(char1, char2) {
  char1 = char1 === 'J' ? 'I' : char1;
  char2 = char2 === 'J' ? 'I' : char2;

  let char1Pos = findPosition(char1);
  let char2Pos = findPosition(char2);

  let encryptedPair = '';

  if (char1Pos.row === char2Pos.row) {
    encryptedPair += matrix[char1Pos.row][(char1Pos.col + 1) % 5];
    encryptedPair += matrix[char2Pos.row][(char2Pos.col + 1) % 5];
  } else if (char1Pos.col === char2Pos.col) {
    encryptedPair += matrix[(char1Pos.row + 1) % 5][char1Pos.col];
    encryptedPair += matrix[(char2Pos.row + 1) % 5][char2Pos.col];
  } else {
    encryptedPair += matrix[char1Pos.row][char2Pos.col];
    encryptedPair += matrix[char2Pos.row][char1Pos.col];
  }
  
  displayGrid([matrix[char1Pos.row][(char1Pos.col + 1) % 5], matrix[char2Pos.row][(char2Pos.col + 1) % 5]]);

  return encryptedPair;
}

function decryptPair(char1, char2) {
  char1 = char1 === 'J' ? 'I' : char1;
  char2 = char2 === 'J' ? 'I' : char2;

  let char1Pos = findPosition(char1);
  let char2Pos = findPosition(char2);

  let decryptedPair = '';

  if (char1Pos.row === char2Pos.row) {
    decryptedPair += matrix[char1Pos.row][(char1Pos.col + 4) % 5];
    decryptedPair += matrix[char2Pos.row][(char2Pos.col + 4) % 5];
  } else if (char1Pos.col === char2Pos.col) {
    decryptedPair += matrix[(char1Pos.row + 4) % 5][char1Pos.col];
    decryptedPair += matrix[(char2Pos.row + 4) % 5][char2Pos.col];
  } else {
    decryptedPair += matrix[char1Pos.row][char2Pos.col];
    decryptedPair += matrix[char2Pos.row][char1Pos.col];
  }

  return decryptedPair;
}




function addZToMatrix() {
  if (matrix.flat().length < 25) {
    let remainingChars = 25 - matrix.flat().length;
    for (let i = 0; i < remainingChars; i++) {
      matrix[Math.floor(matrix.flat().length / 5)].push('Z');
    }
  }
}


function generateEmptyMatrix() {
  matrix = [];
  let playfairGrid = document.getElementById("playfairGrid");
  playfairGrid.innerHTML = '';

  let table = document.createElement('table');

  let alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
  let letterIndex = 0;

  for (let i = 0; i < 5; i++) {
    let row = document.createElement('tr');
    for (let j = 0; j < 5; j++) {
      let cell = document.createElement('td');

      if (letterIndex < alphabet.length) {
        matrix.push([alphabet[letterIndex]]);
        cell.textContent = alphabet[letterIndex++];
      } else {
        matrix.push(['Z']);
        cell.textContent = 'Z';
      }

      row.appendChild(cell);
    }
    table.appendChild(row);
  }

  playfairGrid.appendChild(table);
}


function displayGrid() {
  let playfairGrid = document.getElementById("playfairGrid");
  playfairGrid.innerHTML = '';

  let table = document.createElement('table');

  for (let i = 0; i < matrix.length; i++) {
    let row = document.createElement('tr');
    for (let j = 0; j < matrix[i].length; j++) {
      let cell = document.createElement('td');
      cell.textContent = matrix[i][j];

     
      row.appendChild(cell);
    }

    
    table.appendChild(row);
  }

  
  playfairGrid.appendChild(table);
}
function displayTextWithMatrix() {
  let text = document.getElementById("plaintext").value.toUpperCase().replace(/[^A-Z]/g, '');
  let textWithMatrix = '';

  for (let i = 0; i < text.length; i++) {
    textWithMatrix += text.charAt(i);
    if (i < text.length - 1) textWithMatrix += ' ';
  }

  document.getElementById("textWithMatrix").textContent = textWithMatrix;
}


function encrypt() {
  let text = document.getElementById("plaintext").value.toUpperCase().replace(/[^A-Z]/g, '');
  let key = document.getElementById("key").value.toUpperCase().replace(/[^A-Z]/g, '');

  if (key === '') {
    alert('Please enter a valid encryption/decryption key.');
    return;
  }

  generateMatrix(key);
  document.getElementById("ciphertext").value = processText(text, 'encrypt');
}

function decrypt() {
  let text = document.getElementById("ciphertext").value.toUpperCase().replace(/[^A-Z]/g, '');
  let key = document.getElementById("key").value.toUpperCase().replace(/[^A-Z]/g, '');

  if (key === '') {
    alert('Please enter a valid encryption/decryption key.');
    return;
  }

  generateMatrix(key);
  document.getElementById("plaintext").value = processText(text, 'decrypt');
}

function decryptText(text) {
  let decryptedText = '';
  for (let i = 0; i < text.length; i += 2) {
    let pair1 = text.charAt(i);
    let pair2 = i + 1 < text.length ? text.charAt(i + 1) : 'X';

    // Replace 'J' with a placeholder character
    pair1 = pair1 === 'J' ? 'I' : pair1;
    pair2 = pair2 === 'J' ? 'I' : pair2;

    if (pair1 === pair2) {
      pair2 = 'X';
      i--;
    }

    let decryptedPair = decryptPair(pair1, pair2);
    decryptedText += decryptedPair;
  }

  return decryptedText;
}

function processText(text, mode) {
  let processedText = '';
  let i = 0;

  while (i < text.length) {
    let pair1 = text.charAt(i);
    let pair2 = '';

    if (i + 1 < text.length) {
      pair2 = text.charAt(i + 1);
    } else {
      pair2 = 'Z';
    }

    // Replace 'J' with a placeholder character
    pair1 = pair1 === 'J' ? 'I' : pair1;
    pair2 = pair2 === 'J' ? 'I' : pair2;

    if (pair1 === pair2) {
      pair2 = 'X';
    } else {
      i++;
    }

    let processedPair = mode === 'encrypt' ? encryptPair(pair1, pair2) : decryptPair(pair1, pair2);
    processedText += processedPair;
    i++;
  }
  

  return processedText;
}



function findPosition(char) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] === char) {
        return { row: i, col: j };
      }
    }
  }
}

function resetKey() {
  document.getElementById("key").value = '';
}

function copyKey() {
  let keyText = document.getElementById("key");
  keyText.select();
  document.execCommand("copy");
  alert("Copied the key: " + keyText.value);
}

function resetPlaintext() {
  document.getElementById("plaintext").value = '';
}

function copyPlaintext() {
  let plaintext = document.getElementById("plaintext");
  plaintext.select();
  document.execCommand("copy");
  alert("Copied the plaintext: " + plaintext.value);
}

function resetCiphertext() {
  document.getElementById("ciphertext").value = '';
}

function copyCiphertext() {
  let ciphertext = document.getElementById("ciphertext");
  ciphertext.select();
  document.execCommand("copy");
  alert("Copied the ciphertext: " + ciphertext.value);
}

function myFunction() {
  var element = document.body;
  element.classList.toggle("dark-mode");
}

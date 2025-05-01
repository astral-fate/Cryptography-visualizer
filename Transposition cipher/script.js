let highlightIndex = 0;

function highlightColumn(index) {
  let table = document.getElementById("matrix").getElementsByTagName('table')[0];
  let rows = table.getElementsByTagName('tr');

  for (let i = 0; i < rows.length; i++) {
    let cells = rows[i].getElementsByTagName('td');
    cells[index].style.backgroundColor = 'yellow';
  }

  setTimeout(() => {
    for (let i = 0; i < rows.length; i++) {
      let cells = rows[i].getElementsByTagName('td');
      cells[index].style.backgroundColor = ''; // Remove highlighting
    }

    highlightNextColumn();
  }, 2000); // Wait for 2 seconds before moving to the next column
}

function highlightNextColumn() {
  let key = document.getElementById("key").value.toUpperCase();
  let keyLength = key.length;
  let orderedKey = [...new Set(key.split(''))].sort().join('');
  let orderMap = {};
  for (let i = 0; i < orderedKey.length; i++) {
    orderMap[orderedKey[i]] = i;
  }

  let columnsToHighlight = Array.from(Array(keyLength).keys()).sort((a, b) => {
    return orderMap[key.charAt(a)] - orderMap[key.charAt(b)];
  });

  if (highlightIndex < keyLength) {
    highlightColumn(columnsToHighlight[highlightIndex]);
    highlightIndex++;
  }
}

function updateMatrix() {
  let key = document.getElementById("key").value.toUpperCase();
  let keyInfo = document.getElementById("keyInfo");
  let keyLength = key.length;

  if (keyLength > 0) {
    let keyDisplay = 'Key: ';
    for (let i = 0; i < keyLength; i++) {
      keyDisplay += key.charAt(i) + "[" + (i + 1) + "]";
    }
    keyInfo.textContent = keyDisplay;
    document.getElementById("plaintext").removeAttribute("disabled");
  } else {
    keyInfo.textContent = '';
    document.getElementById("plaintext").setAttribute("disabled", "true");
  }

  let plaintext = document.getElementById("plaintext").value;
  let numOfRows = Math.ceil(plaintext.length / keyLength);

  let matrix = [];
  let index = 0;

  // Create matrix with key characters and numbers row
  matrix[0] = [];
  matrix[1] = [];
  for (let i = 0; i < keyLength; i++) {
    matrix[0][i] = key.charAt(i);
    matrix[1][i] = i + 1;
  }

  // Fill the matrix with the plaintext characters
  for (let i = 0; i < plaintext.length; i++) {
    if (index % keyLength === 0) {
      matrix.push([]);
    }
    matrix[Math.floor(index / keyLength) + 2][index % keyLength] = plaintext.charAt(i);
    index++;
  }

  // Display the matrix
  let matrixDisplay = '<table>';
  for (let i = 0; i < matrix.length; i++) {
    matrixDisplay += '<tr>';
    for (let j = 0; j < keyLength; j++) {
      matrixDisplay += '<td>' + (matrix[i][j] ? matrix[i][j] : '&nbsp;') + '</td>';
    }
    matrixDisplay += '</tr>';
  }
  matrixDisplay += '</table>';

  document.getElementById("matrix").innerHTML = matrixDisplay;
}

function encrypt() {
  let plaintext = document.getElementById("plaintext").value;
  let key = document.getElementById("key").value.toUpperCase(); // Convert key to uppercase

  if (plaintext.length === 0 || key.length === 0) {
    alert('Please enter both plaintext and key.');
    return;
  }

    let keyChars = key.split('');

    let orderedKey = [...new Set(keyChars)].sort().join('');

    let orderMap = {};
    for (let i = 0; i < orderedKey.length; i++) {
      orderMap[orderedKey[i]] = i + 1;
    }

    let keyLength = key.length;
    let plaintextLength = plaintext.length;
    let numOfRows = Math.ceil(plaintextLength / keyLength);

    let paddedPlaintext = plaintext.padEnd(numOfRows * keyLength, '_');

    let matrix = [];
    let index = 0;
    for (let i = 0; i < numOfRows; i++) {
      matrix[i] = [];
      for (let j = 0; j < keyLength; j++) {
        matrix[i][j] = paddedPlaintext.charAt(index);
        index++;
      }
    }

    let matrixDisplay = '<table>';
    matrixDisplay += '<tr>';
    for (let i = 0; i < keyLength; i++) {
      matrixDisplay += '<td>' + key[i].toUpperCase() + '</td>';
    }
    matrixDisplay += '</tr>';

    matrixDisplay += '<tr>';
    for (let i = 0; i < keyLength; i++) {
      matrixDisplay += '<td>' + orderMap[key[i]] + '</td>';
    }
    matrixDisplay += '</tr>';

    for (let i = 0; i < numOfRows; i++) {
      matrixDisplay += '<tr>';
      for (let j = 0; j < keyLength; j++) {
        matrixDisplay += '<td>' + matrix[i][j] + '</td>';
      }
      matrixDisplay += '</tr>';
    }
    matrixDisplay += '</table>';

    document.getElementById("matrix").innerHTML = matrixDisplay;

    let ciphertext = '';
    let combinedKeys = {};

    for (let i = 0; i < keyChars.length; i++) {
      if (!combinedKeys[keyChars[i]]) {
        combinedKeys[keyChars[i]] = '';
      }
      combinedKeys[keyChars[i]] += matrix.map(row => row[i]).join('');
    }

    Object.keys(combinedKeys).sort().forEach((char) => {
      ciphertext += combinedKeys[char];
    });

    document.getElementById("ciphertext").value = ciphertext;
    highlightIndex = 0; // Reset the highlight index
  highlightNextColumn();
  }

  function copyText(elementId) {
    const textarea = document.getElementById(elementId);
    textarea.select();
    document.execCommand('copy');
  }
  
  function resetField(elementId) {
    document.getElementById(elementId).value = '';
  }
  
  function decrypt() {
    let ciphertext = document.getElementById("ciphertext").value;
    let key = document.getElementById("key").value.toUpperCase(); // Convert key to uppercase
  
    if (ciphertext.length === 0 || key.length === 0) {
      alert('Please enter both ciphertext and key.');
      return;
    }
  
    let keyChars = key.split('');
  
    let orderedKey = [...new Set(keyChars)].sort().reverse().join('');
  
    let orderMap = {};
    for (let i = orderedKey.length; i >= orderedKey.length; i--) {
      orderMap[orderedKey[i]] = i - 1;
    }
  
    let keyLength = key.length;
    let ciphertextLength = ciphertext.length;
    let numOfRows = Math.ceil(ciphertextLength / keyLength);
  
    let matrix = [];
    let index = 0;
    for (let i = 0; i < numOfRows; i++) {
      matrix[i] = [];
      for (let j = 0; j < keyLength; j++) {
        matrix[i][j] = ciphertext.charAt(index);
        index++;
      }
    }
  
    let matrixDisplay = '<table>';
    matrixDisplay += '<tr>';
    for (let i = 0; i < keyLength; i++) {
      matrixDisplay += '<td>' + key[i].toUpperCase() + '</td>';
    }
    matrixDisplay += '</tr>';
  
    matrixDisplay += '<tr>';
    for (let i = 0; i < keyLength; i++) {
      matrixDisplay += '<td>' + orderMap[key[i]] + '</td>';
    }
    matrixDisplay += '</tr>';
  
    for (let i = 0; i < numOfRows; i++) {
      matrixDisplay += '<tr>';
      for (let j = 0; j < keyLength; j++) {
        matrixDisplay += '<td>' + matrix[i][j] + '</td>';
      }
      matrixDisplay += '</tr>';
    }
    matrixDisplay += '</table>';
  
    document.getElementById("matrix").innerHTML = matrixDisplay;
  
    let plaintext = '';
    let combinedKeys = {};
  
    for (let i = 0; i < keyChars.length; i++) {
      if (!combinedKeys[keyChars[i]]) {
        combinedKeys[keyChars[i]] = '';
      }
      combinedKeys[keyChars[i]] += matrix.map(row => row[i]).join('');
    }
  
    Object.keys(combinedKeys).sort().forEach((char) => {
      ciphertext += combinedKeys[char];
    });
  
    document.getElementById("plaintext").value = plaintext.replace(/_/g, ''); // Remove padding
    highlightIndex = 0; // Reset the highlight index
    highlightNextColumn();
  }
  
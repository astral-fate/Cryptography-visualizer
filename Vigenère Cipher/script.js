
function stringToIntList(string) {
    var s = [];
    for (var i = 0; i < string.length; i++) {
        s[i] = string.charCodeAt(i);
    }
    return s;
}

function intsToCharList(integers) {
    var ints = [];
    for (var i = 0; i < integers.length; i++) {
        ints[i] = String.fromCharCode(integers[i]);
    }
    return ints;
}

function encrypt() {
    const plaintext = document.getElementById('plaintext').value.toUpperCase().replace(/[^A-Z]/g, '');
    const key = document.getElementById('key').value.toUpperCase().replace(/[^A-Z]/g, '');

    const encryptedText = vigenere(plaintext, key, 'encrypt');
    document.getElementById('result').value = encryptedText;
}

function decrypt() {
    const ciphertext = document.getElementById('result').value.toUpperCase().replace(/[^A-Z]/g, '');
    const key = document.getElementById('key').value.toUpperCase().replace(/[^A-Z]/g, '');

    const decryptedText = vigenere(ciphertext, key, 'decrypt');
    document.getElementById('plaintext').value = decryptedText;
}

function vigenere(text, key, mode) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    let keyIndex = 0;

    for (let i = 0; i < text.length; i++) {
        const textChar = text.charAt(i);
        if (alphabet.indexOf(textChar) === -1) {
            result += textChar;
            continue;
        }

        const keyChar = key.charAt(keyIndex % key.length);
        const keyIndexInAlphabet = alphabet.indexOf(keyChar);
        const textIndexInAlphabet = alphabet.indexOf(textChar);

        if (mode === 'encrypt') {
            const encryptedIndex= (textIndexInAlphabet + keyIndexInAlphabet) % 26;
            result += alphabet.charAt(encryptedIndex);
        } else if (mode === 'decrypt') {
            let decryptedIndex = (textIndexInAlphabet - keyIndexInAlphabet) % 26;
            if (decryptedIndex < 0) {
                decryptedIndex += 26;
            }
            result += alphabet.charAt(decryptedIndex);
        }

        keyIndex++;
    }

    return result;
}

function makeTable() {
    var table = [];
    var minASCII = 65; // Change this value as needed for minimum ASCII
    var maxASCII = 91; // Change this value as needed for maximum ASCII
    var i = 0;
    while (i + minASCII < maxASCII) {
        var line = [];
        for (var j = 0; j < maxASCII - minASCII; j++) {
            if (j + i + minASCII >= maxASCII) {
                line[line.length] = (j + i) - (maxASCII - minASCII) + minASCII;
            } else {
                line[line.length] = j + i + minASCII;
            }
        }
        table[table.length] = line;
        i++;
    }
    return table;
}

function printTable() {
    var t = makeTable();
    var tableContent = '';

    for (var i = 0; i < t.length; i++) {
        var rowContent = '<td class="key-char">' + (i + 1) + '</td>'; // Adding class to the header row

        for (var j = 0; j < t[i].length; j++) {
            var char = String.fromCharCode(t[i][j]);
            rowContent += '<td>' + char + '</td>';
        }

        tableContent += '<tr>' + rowContent + '</tr>';
    }

    var columnHeader = '<tr><td></td>';

    for (var k = 0; k < t.length; k++) {
        columnHeader += '<td class="key-char">' + (k + 1) + '</td>'; // Adding class to the header columns
    }

    columnHeader += '</tr>';
    tableContent = columnHeader + tableContent;
    document.getElementById('ascii').innerHTML = tableContent;
}

function highlightKey() {
    var userKey = document.getElementById('key').value.toUpperCase().replace(/[^A-Z]/g, '');
    var table = document.getElementById('ascii');
    var startIndex = 'A'.charCodeAt(0); // ASCII code for 'A'
    var keyIndex = 0;

    for (var i = 0; i < table.rows[1].cells.length; i++) {
        table.rows[1].cells[i+1].style.backgroundColor = '';
        var cellChar = String.fromCharCode(startIndex + i);
        if (userKey.indexOf(cellChar) !== -1) {
            table.rows[1].cells[i+1].style.backgroundColor = 'yellow';
            keyIndex++;
            if (keyIndex === userKey.length) {
                break;
            }
        }
    }
}
function highlightPlaintext() {
    var userText = document.getElementById('plaintext').value.toUpperCase().replace(/[^A-Z]/g, '');
    var table = document.getElementById('ascii');
    var startIndex = 'A'.charCodeAt(0); // ASCII code for 'A'

    // Reset all cell background colors in the second column
    for (var i = 1; i < table.rows.length; i++) {
        table.rows[i].cells[1].style.backgroundColor = '';
    }

    // Highlight cells based on user's plaintext
    for (var i = 0; i < userText.length; i++) {
        var cellChar = userText.charAt(i);
        var rowIndex = cellChar.charCodeAt(0) - startIndex + 1; // Adjusted for starting from the second row
        if (rowIndex >= 1 && rowIndex < table.rows.length) {
            table.rows[rowIndex].cells[1].style.backgroundColor = 'yellow';
        }
    }
    highlightInteraction();
}
function clearInteraction() {
    var table = document.getElementById('ascii');

    for (var i = 0; i < table.rows.length; i++) {
        for (var j = 0; j < table.rows[i].cells.length; j++) {
            table.rows[i].cells[j].classList.remove('interaction');
        }
    }
}

function highlightInteraction() {
    var userText = document.getElementById('key').value.toUpperCase().replace(/[^A-Z]/g, '');
    var userKey = document.getElementById('plaintext').value.toUpperCase().replace(/[^A-Z]/g, '');
    var table = document.getElementById('ascii');
    var startIndex = 'A'.charCodeAt(0); // ASCII code for 'A'

    for (var i = 0; i < userKey.length || i < userText.length; i++) {
        var keyChar = userKey.charAt(i % userKey.length);
        var textChar = userText.charAt(i % userText.length);

        var keyIndex = keyChar.charCodeAt(0) - startIndex + 1;
        var textIndex = textChar.charCodeAt(0) - startIndex + 1;

        if (keyIndex >= 1 && keyIndex < table.rows.length && textIndex >= 1 && textIndex < table.rows[0].cells.length) {
            table.rows[keyIndex].cells[textIndex].classList.add('interaction');
        }
    }
}

printTable();
highlightInteraction();



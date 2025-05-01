function visualizeRailFenceCipher(rails, plaintext) {
  let railFenceGrid = document.getElementById("railFenceGrid");
  railFenceGrid.innerHTML = '';

  let table = document.createElement('table');
  table.classList.add('railFenceVisualization');
  
  for (let i = 0; i < rails; i++) {
    let row = document.createElement('tr');
  
    // Create row number cell
    let rowNumberCell = document.createElement('td');
    rowNumberCell.textContent = i + 1;
    row.appendChild(rowNumberCell);
  
    let direction = 1;
    let currentRail = 0;
  
    for (let j = 0; j < plaintext.length; j++) {
      let cell = document.createElement('td');
      cell.textContent = '';
  
      if (currentRail === i) {
        cell.textContent = plaintext[j] || ''; // Handle empty characters
      }
  
      if (currentRail === 0) {
        direction = 1;
      } else if (currentRail === rails - 1) {
        direction = -1;
      }
  
      currentRail += direction;
      row.appendChild(cell);
    }
  
    table.appendChild(row);
  }
  
  railFenceGrid.appendChild(table);
  
}

function updateVisualization() {
  let plaintext = document.getElementById("plaintext").value;
  let railSize = parseInt(document.getElementById("railSize").value);

  visualizeRailFenceCipher(railSize, plaintext);

  // Encrypt the plaintext based on the rail size
  let ciphertext = '';
  for (let i = 0; i < railSize; i++) {
    let direction = 1;
    let currentRail = 0;

    for (let j = 0; j < plaintext.length; j++) {
      if (currentRail === 0) {
        direction = 1;
      } else if (currentRail === railSize - 1) {
        direction = -1;
      }

      if (currentRail === i) {
        ciphertext += plaintext[j] || ''; // Handle empty characters
      }

      currentRail += direction;
    }
  }

  document.getElementById("ciphertext").value = ciphertext;
}

function myFunction() {
  var selectElement = document.getElementById("primitiveRoot");
  var popup = document.getElementById("myPopup");

  if (selectElement.options.length === 0) {
      // Show the popup only when the select list is empty
      popup.classList.add("show");

      // Set a timer to remove the "show" class after 5 seconds (5000 milliseconds)
      setTimeout(function () {
          popup.classList.remove("show");
      }, 5000);
  }
}
function isPrime(num) {
  if (num < 2) return false;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) {
      return false;
    }
  }
  return true;
}

function validateInput(fieldId) {
  const inputField = document.getElementById(fieldId);
  const inputValue = parseInt(inputField.value);

  if (!isNaN(inputValue) && !isPrime(inputValue)) {
    alert(`Please enter a valid prime number for ${fieldId.toUpperCase()}.`);
    inputField.value = "";
  }
}
function isPrimitiveRoot(g, p) {
    let set = new Set();
    for (let i = 1; i < p; i++) {
      set.add(BigInt(Math.pow(g, i) % p));
    }
    return set.size === p - 1;
  }
  
  function generatePrimitiveRoots(q) {
    let primitiveRoots = [];
    for (let a = 3; a < q; a++) {
      if (isPrimitiveRoot(a, q)) {
        primitiveRoots.push(a);
      }
    }
    return primitiveRoots;
  }
  
  function encrypt() {
    const qInput = document.getElementById('primeInput');
    const aInput = document.getElementById('primitiveRoot');
    const privateKeyInput = document.getElementById('privateKey');
    const plaintextInput = document.getElementById('plaintext');

    // Check if any of the required fields are empty
    if (!qInput.value || !aInput.value || !privateKeyInput.value) {
        alert('Please generate keys before encrypting.');
        return;
    }

    const q = BigInt(qInput.value);
    const a = BigInt(aInput.value);
    const privateKey = BigInt(privateKeyInput.value);
    const plaintext = BigInt(plaintextInput.value);

    const YA = modPow(a, privateKey, q);
    const k = BigInt(Math.floor(Math.random() * (Number(q) - 2)) + 2);
    const K = modPow(YA, k, q);
    const C1 = modPow(a, k, q);
    const C2 = (plaintext * K) % q;

    document.getElementById('encryptionResult').innerHTML = `
      <p>Ciphertext: (${C1}, ${C2})</p>
    `;
}


  
  function modPow(base, exponent, modulus) {
    if (modulus === 1n) return 0n;
    let result = 1n;
    base = base % modulus;
    while (exponent > 0n) {
      if (exponent % 2n === 1n) {
        result = (result * base) % modulus;
      }
      exponent = exponent >> 1n;
      base = (base * base) % modulus;
    }
    return result;
  }
  
  document.addEventListener('DOMContentLoaded', function() {
    const primeInput = document.getElementById('primeInput');
    const primitiveRootSelect = document.getElementById('primitiveRoot');
  
    primeInput.addEventListener('change', function() {
      const q = parseInt(primeInput.value);
      const primitiveRoots = generatePrimitiveRoots(q);
      primitiveRootSelect.innerHTML = '';
      primitiveRoots.forEach(root => {
        const option = document.createElement('option');
        option.value = root;
        option.textContent = root;
        primitiveRootSelect.appendChild(option);
      });
    });
    
  });
  
  // ... (previous code for isPrimitiveRoot, generatePrimitiveRoots, modPow, etc.)
  
  let alicePublicKey = {};
  
  function generateKeys() {
    const q = BigInt(document.getElementById('primeInput').value);
    const a = BigInt(document.getElementById('primitiveRoot').value);
    const privateKey = BigInt(document.getElementById('privateKey').value);
  
    const YA = modPow(a, privateKey, q);
  
    alicePublicKey = { q, a, YA };
  
    const keyGenerationResultAlice = document.getElementById('keyGenerationResultAlice');
    keyGenerationResultAlice.innerHTML = `
      
      <p>Y<sub>A</sub>: (${a}<sup>${privateKey}</sup>) mod ${q}<br> Y<sub>A</sub>= ${YA} </p>
      <p style="color:#228B22;">Public key: { q: ${q}, a: ${a}, Y<sub>A</sub>: ${YA} }</p>
      <p style="color:#DC143C;">Private key: X<sub>A</sub>: ${privateKey}</p>
    `;
  }
  
  function encryptMessage() {
    const k = BigInt(document.getElementById('kValue').value);
    const plaintextBob = BigInt(document.getElementById('plaintextBob').value);
    
    
    const { q, a, YA } = alicePublicKey;
  
  
    const K = modPow(YA, k, q);
    const C1 = modPow(a, k, q);
    const C2 = (plaintextBob * K) % q;
  
    const publicKeyDisplay = document.getElementById('publicKeyDisplay');
    publicKeyDisplay.innerHTML = `
      <p style="color:#228B22;">Public key: { q: ${q}, a: ${a}, Y<sub>A</sub>: ${YA} }</p>
    `;
  
    const encryptionResultBob = document.getElementById('encryptionResultBob');
    encryptionResultBob.innerHTML = `
    
    <p>C1: (${a}<sup>${k}</sup>) mod ${q}<br> C1= ${C1} </p>
    <p>C2: (${K} * ${plaintextBob}) mod ${q} <br> C2= ${C2} </p>
    
    <p>Ciphertext: (${C1}, ${C2})</p>
  
    `;
  }
  
  
  function recoverK() {
    const privateKey = BigInt(document.getElementById('privateKey1').value);
    const C1 = BigInt(document.getElementById('recoveredC1').value);
  
    const q = BigInt(document.getElementById('primeInput1').value);
  
    const K = modPow(C1, privateKey, q);
  
    const recoveredK = document.getElementById('recoveredK');
    recoveredK.innerHTML = `<p>Recovered K: ${K}</p>`;
  }
  
  
  
  document.addEventListener('DOMContentLoaded', function() {
  
    const buttonRecoverK = document.getElementById('recoverKButton');
    buttonRecoverK.addEventListener('click', recoverK);
  
    const buttonRecoverPlaintext = document.getElementById('recoverPlaintextButton');
    buttonRecoverPlaintext.addEventListener('click', recoverPlaintext);
  });
  
  
  function recoverK() {
    const privateKey = BigInt(document.getElementById('privateKey1').value);
    const C1 = BigInt(document.getElementById('recoveredC1').value);
  
    const q = BigInt(document.getElementById('primeInput1').value);
  
    const K = modPow(C1, privateKey, q);
  
    const recoveredK = document.getElementById('recoveredK');
    recoveredK.innerHTML = `<p>Recovered K: ${K}</p>`;
  }
  
  function recoverPlaintext() {
    const recoveredKValue = BigInt(document.getElementById('recoveredKValue').value);
    const C2 = BigInt(document.getElementById('recoveredC2').value);
    const q = BigInt(document.getElementById('primeInput1').value);
  
    const inverseK = modInverse(recoveredKValue, q);
    const plaintext = (C2 * inverseK) % q;
  
    const recoveredPlaintext = document.getElementById('recoveredPlaintext');
    recoveredPlaintext.innerHTML = `<p>Recovered Plaintext: ${plaintext}</p>`;
  }
  
  // Function for modular inverse
  function modInverse(a, m) {
    let m0 = m;
    let [x0, x1] = [0n, 1n];
  
    if (m === 1n) return 0n;
  
    while (a > 1n) {
      let q = a / m;
      [a, m] = [m, a % m];
      [x0, x1] = [x1 - q * x0, x0];
    }
  
    if (x1 < 0n) x1 += m0;
  
    return x1;
  }
  
  function selectMode(mode) {
    if (mode === 'encrypt') {
      window.location.href = 'index.html'; // Redirect to encryption page
    } else if (mode === 'decrypt') {
      window.location.href = 'decrypt.html'; // Redirect to decryption page
    }
  }
  

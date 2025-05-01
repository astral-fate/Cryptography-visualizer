function myFunction() {
    var selectElement = document.getElementById("primitiveRootSelect");
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
  
  function isPrimitiveRoot(g, p) {
    let set = new Set();
    for (let i = 1; i < p; i++) {
      set.add(BigInt(g) ** BigInt(i) % BigInt(p));
    }
    return set.size === p - 1;
  }
  
  function generatePrimitiveRoots(q) {
    let primitiveRoots = [];
    for (let a = 2; a < q; a++) {
      if (isPrimitiveRoot(a, q)) {
        primitiveRoots.push(a);
      }
    }
    return primitiveRoots;
  }
  
  function populatePrimitiveRootsSelect() {
    const q = parseInt(document.getElementById('primeNumber').value);
    const selectElement = document.getElementById('primitiveRootSelect');
    const primitiveRoots = generatePrimitiveRoots(q);
  
    // Clear previous options
    selectElement.innerHTML = '';
  
    primitiveRoots.forEach(root => {
      const option = document.createElement('option');
      option.value = root;
      option.text = root;
      selectElement.add(option);
    });
  }
  
  function performDiffieHellman() {
  
    const q = BigInt(document.getElementById('primeNumber').value);
    const alpha = BigInt(parseInt(document.getElementById('primitiveRootSelect').value));
  
    const alicePrivateKey = BigInt(parseInt(document.getElementById('alicePrivateKey').value));
    const bobPrivateKey = BigInt(parseInt(document.getElementById('bobPrivateKey').value));
  
    if (alicePrivateKey >= q || bobPrivateKey >= q) {
      alert('Private keys must be less than q.');
      return;
    }
  
    
  
  
    
    const alicePublicKey = calculatePublicKey(alpha, alicePrivateKey, q);
    const bobPublicKey = calculatePublicKey(alpha, bobPrivateKey, q);
  
    const sharedKeyAlice = calculateSharedKey(bobPublicKey, alicePrivateKey, q);
    const sharedKeyBob = calculateSharedKey(alicePublicKey, bobPrivateKey, q);
  
    // Pass alpha and q to displayResults function
  displayResults(alicePrivateKey, alicePublicKey, bobPrivateKey, bobPublicKey, sharedKeyAlice, sharedKeyBob, alpha, q);
  }
  
  function calculatePublicKey(alpha, privateKey, q) {
    return BigInt(alpha) ** BigInt(privateKey) % BigInt(q);
  }
  
  function calculateSharedKey(publicKey, privateKey, q) {
    return BigInt(publicKey) ** BigInt(privateKey) % BigInt(q);
  }
  
  function displayResults(alicePrivateKey, alicePublicKey, bobPrivateKey, bobPublicKey, sharedKeyAlice, sharedKeyBob, alpha, q) {
    const output = document.getElementById('output');
    const output0 = document.getElementById('output0');
    const output1 = document.getElementById('output1');
    const output2 = document.getElementById('output2');
    const output3 = document.getElementById('output3');
    const output4 = document.getElementById('output4');
    output.innerHTML = '';
  
    setTimeout(() => {
      output1.innerHTML += 'Alice\'s private key (X<sub>A</sub>): ' + alicePrivateKey + '<br>';
    }, 500);
  
    setTimeout(() => {
      output1.innerHTML += `Alice's public key (Y<sub>A</sub>):<br> ${alpha}<sup>${alicePrivateKey}</sup> mod ${q} = ${alicePublicKey} <br>`;
    }, 1000);
  
    setTimeout(() => {
      output2.innerHTML += 'Bob\'s private key (X<sub>B</sub>): ' + bobPrivateKey + '<br>';
    }, 500);
  
    setTimeout(() => {
      output2.innerHTML += `Bob's public key (Y<sub>B</sub>):<br> ${alpha}<sup>${bobPrivateKey}</sup> mod ${q} = ${bobPublicKey} <br>`;
    }, 1000);
  
    setTimeout(() => {
      output3.innerHTML += `Alice's public key (Y<sub>A</sub>):<br> ${alpha}<sup>${alicePrivateKey}</sup> mod ${q} = ${alicePublicKey} <br>`;
    }, 1500);
    setTimeout(() => {
      output4.innerHTML += `Bob's public key (Y<sub>B</sub>):<br> ${alpha}<sup>${bobPrivateKey}</sup> mod ${q} = ${bobPublicKey} <br>`;
    }, 1500);
  
    setTimeout(() => {
      output0.innerHTML += `Shared secret key for Alice<br>(${bobPublicKey})<sup>${alicePrivateKey}</sup> mod ${q} =  ${sharedKeyAlice}<br>`;
    }, 2500);
  
    setTimeout(() => {
      output.innerHTML += `Shared secret key for Bob<br> (${alicePublicKey})<sup>${bobPrivateKey}</sup> mod ${q} = ${sharedKeyBob}<br>`;
    }, 2500);
  }
  
  
  
  // Call this function to populate the primitive root select dropdown on page load
  populatePrimitiveRootsSelect();
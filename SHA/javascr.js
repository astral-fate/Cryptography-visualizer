async function visualizeSHA256() {
    // Clear previous visualization
    document.getElementById("visualizationContainer").innerHTML = "";

    // Get the input text
    const inputText = document.getElementById("inputText").value;

    // Convert the input text to binary data
    const encoder = new TextEncoder();
    const binaryData = encoder.encode(inputText);

    // Perform SHA-256 hashing using Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', binaryData);

    // Convert the hash result to a hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    // Initialize visualization container
    let visualizationContainer = document.getElementById("visualizationContainer");

    // Create a table for visualization
    let tableElement = document.createElement("table");
    tableElement.className = "stepBox";

    // Add table headers
    let headersRow = tableElement.insertRow();
    headersRow.innerHTML = "<th>Byte</th><th>Binary</th><th>Hex</th>";

    // Iterate through each byte in the hash result
    for (let i = 0; i < hashArray.length; i++) {
        let byte = hashArray[i];

        // Convert byte to binary and hexadecimal representation
        let byteBinary = byte.toString(2).padStart(8, '0');
        let byteHex = byte.toString(16).padStart(2, '0');

        // Add a row to the table
        let row = tableElement.insertRow();
        row.innerHTML = `<td>${i + 1}</td><td>${byteBinary}</td><td>${byteHex}</td>`;

        // Animate the row for visualization
        let timeline = gsap.timeline();
        timeline.from(row, { opacity: 0, y: 20, duration: 0.5, delay: i * 0.1 });
    }

    // Display the final hashed value in hexadecimal
    let resultElement = document.createElement("div");
    resultElement.className = "stepBox";
    resultElement.textContent = `SHA-256 Hash Result: ${hashHex}`;
    visualizationContainer.appendChild(resultElement);

    // Append the table to the visualization container
    visualizationContainer.appendChild(tableElement);

    // Add the result to the timeline for animation with a delay
    let timeline = gsap.timeline();
    timeline.from(resultElement, { opacity: 0, y: 20, duration: 0.5 }, "+=0.5");
}
function visualizeHash() {
    // Clear previous visualization
    document.getElementById("visualizationContainer").innerHTML = "";

    // Get the input string
    const inputString = document.getElementById("inputString").value;

    // Get the animation speed value
    const animationSpeed = parseFloat(document.getElementById("animationSpeed").value);

    // Initialize hash to 0
    let initialHash = 0;
    let hashValue = 0;

    // Create visualization container
    let visualizationContainer = document.getElementById("visualizationContainer");

    // Timeline for animation
    let timeline = gsap.timeline();

    // Set the duration for animations based on the animation speed
    const animationDuration = 0.5 / animationSpeed;

    // Create a table for visualization
    let tableElement = document.createElement("table");
    tableElement.className = "stepBox";

    // Add table headers
    let headersRow = tableElement.insertRow();
    headersRow.innerHTML = "<th>Char</th><th>ASCII</th><th>XOR Operation</th><th>Hash Updated</th>";

    // Iterate through each character in the input string
    for (let i = 0; i < inputString.length; i++) {
        let char = inputString[i];
        let charCode = char.charCodeAt(0);

        // Save the current initial hash value
        let currentInitialHash = initialHash;

        // Perform XOR operation with the current hash value
        hashValue = initialHash ^ charCode;

        // Update the initial hash for the next iteration
        initialHash = hashValue;

        // Convert numbers to decimal and binary representation
        let charCodeDecimal = charCode;
        let charCodeBinary = charCode.toString(2).padStart(8, '0');
        let xorResultDecimal = initialHash ^ charCode;
        let xorResultBinary = (initialHash ^ charCode).toString(2).padStart(8, '0');
        let hashValueDecimal = initialHash;
        let hashValueBinary = initialHash.toString(2).padStart(8, '0');

        // Add a row to the table
        //let row = tableElement.insertRow();
        //row.innerHTML = `<td>${char}</td><td>${charCodeDecimal}</td><td>${xorResultDecimal} (${xorResultBinary})</td><td>${hashValueDecimal} (${hashValueBinary})</td>`;

        // Add a row to the table
        let row = tableElement.insertRow();
        row.innerHTML = `<td>${char}</td><td>${charCodeDecimal} (${charCodeBinary})</td><td><span class="xor-icon">⊕ </span>${xorResultDecimal} (${xorResultBinary})</td><td>${hashValueDecimal} (${hashValueBinary})</td>`;

    // Animate the movement of "Hash Updated" to "XOR Operation" for the next row
    if (i > 0) {
        let previousHashUpdated = tableElement.rows[i].cells[3]; // "Hash Updated" of the previous row
        let currentXOROperation = row.cells[2]; // "XOR Operation" of the current row

        let delay = i * 0; // تحديد التأخير بناءً على رقم الصف
        timeline.from(currentXOROperation, { opacity: 0, x: 100, duration: animationDuration, delay });
        timeline.to(previousHashUpdated, { x: -170, duration: animationDuration, delay });
        timeline.to(previousHashUpdated, { y: 44, duration: animationDuration, delay });

        // Add fade-out effect after the movement
        timeline.to(previousHashUpdated, { opacity: 0, duration: animationDuration, delay: i * 0 });

        // Add the row to the timeline for animation
        timeline.from(row, { opacity: 0, y: 20, duration: animationDuration });

    }

}


    // Display the final hashed value
    let resultElement = document.createElement("div");
    resultElement.className = "stepBox";
    resultElement.textContent = `If we hash the string "${inputString}" using the algorithm, the resulting hashed value would be "${hashValue}".`;
    visualizationContainer.appendChild(resultElement);

    // Append the table to the visualization container
    visualizationContainer.appendChild(tableElement);

    // Add the result to the timeline for animation with a delay
    timeline.from(resultElement, { opacity: 0, y: 20, duration: animationDuration }, "+=0.5");
}



$(document).ready(function() {
    let $mainForm = $("#jsMainForm");
    
    let $messageInput = $("#jsMessageInput");
    let $keyInput = $("#jsKeyInput");
    
    let $messageRadioButtons = $mainForm.find('input[name="messageType"]');
    let $keyRadioButtons = $mainForm.find('input[name="keyType"]');
    
    $mainForm.submit(function(event) {
        let messageTypeSelection = getSelectedValue($messageRadioButtons);
        let keyTypeSelection = getSelectedValue($keyRadioButtons);
        
        let message = $messageInput.val();
        let key = $keyInput.val();
        
        // Perform AES encryption
        let encryptedMessage = CryptoJS.AES.encrypt(message, key).toString();
        
        // Perform AES decryption
        let decryptedMessage = CryptoJS.AES.decrypt(encryptedMessage, key).toString(CryptoJS.enc.Utf8);
        
        // Visualize encryption and decryption
        document.initializeVisualization(encryptedMessage, decryptedMessage);
        
        event.preventDefault(); 
    });
    
    let messageTypeSelection = getSelectedValue($messageRadioButtons);
    let keyTypeSelection = getSelectedValue($keyRadioButtons);
    
    // Adjust input length based on selected type
    if (messageTypeSelection === "hex") {
        $messageInput.attr("maxlength", 16);
    }
    
    if (keyTypeSelection === "hex") {
        $keyInput.attr("maxlength", 16);
    }
    
    // Connect input components for conversion and generation
    connectInputComponents($messageInput, $messageRadioButtons, $("#jsRandomMessage"), generateRandomValue);
    connectInputComponents($keyInput, $keyRadioButtons, $("#jsRandomKey"), generateRandomValue);
});

function connectInputComponents($textInput, $radioButtons, $randomButton, randomFunction) {
    let $hexButton = $radioButtons.filter('input[value="hex"]');
    
    $radioButtons.change(function() {
        let $this = $(this);
        
        if ($this.is(":checked")) {
            if ($this.val() === "hex") {
                // Convert input to hex if needed
                if ($textInput.val().length > 0) {
                    let value = convertToHex($textInput.val());
                    $textInput.val(value);
                }
                
                $textInput.attr("maxlength", 16);
            } else if ($this.val() === "ascii") {
                // Convert input to ASCII if needed
                if ($textInput.val().length > 0) {
                    let value = convertToAscii($textInput.val());
                    $textInput.val(value);
                }
                
                $textInput.attr("maxlength", 8);
            }
        }
    });
    
    $randomButton.click(function(event) {
        // Generate random value and set as hex
        let randomValue = randomFunction();
        
        $hexButton.prop("checked", true);
        $textInput.val(randomValue);
        
        event.preventDefault();
    });
};

function getSelectedValue($radioButtons) {
    return $radioButtons.filter(":checked").val();
};

function convertToHex(input) {
    // Convert input to hexadecimal string
    return CryptoJS.enc.Utf8.parse(input).toString(CryptoJS.enc.Hex);
}

function convertToAscii(input) {
    // Convert input from hexadecimal to ASCII string
    return CryptoJS.enc.Hex.parse(input).toString(CryptoJS.enc.Utf8);
}

function generateRandomValue() {
    // Generate a random value
    return CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
}

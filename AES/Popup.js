// Get DOM elements
const openPopupBtn = document.getElementById('openPopupIcon');
const popupContainer = document.getElementById('popupContainer');

// Function to open the pop-up
function openPopup() {
  popupContainer.style.display = 'block';
}

// Function to close the pop-up
function closePopup() {
  popupContainer.style.display = 'none';
}

// Event listener to open the pop-up on button click
openPopupBtn.addEventListener('click', openPopup);

// Close the pop-up if the user clicks outside the pop-up content
window.addEventListener('click', function(event) {
  if (event.target === popupContainer) {
    closePopup();
  }
});

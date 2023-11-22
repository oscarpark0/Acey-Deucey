const findBugButton = document.getElementById('findBugButton');
const feedbackFormContainer = document.getElementById('feedbackFormContainer');
const closeFormButton = document.getElementById('closeFormButton');

findBugButton.addEventListener('click', () => {
  feedbackFormContainer.style.display = 'block'; // Show the form when the button is clicked
});

closeFormButton.addEventListener('click', () => {
  feedbackFormContainer.style.display = 'none'; // Hide the form when the close button is clicked
});
const findBugButton = document.getElementById('findBugButton');
const feedbackFormContainer = document.getElementById('feedbackFormContainer');
const closeFormButton = document.getElementById('closeFeedbackForm');

if (findBugButton && feedbackFormContainer) {
  findBugButton.addEventListener('click', () => {
    feedbackFormContainer.style.display = 'block';
  });
}

if (closeFormButton && feedbackFormContainer) {
  closeFormButton.addEventListener('click', () => {
    feedbackFormContainer.style.display = 'none';
  });
}
document.getElementById('save').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value;
  const copyToClipboard = document.getElementById('copyToClipboard').checked;
  if (apiKey.trim() === '') {
    showMessage('Please enter a valid API key', 'error');
    return;
  }
  chrome.storage.sync.set({ apiKey, copyToClipboard }, () => {
    showMessage('Settings saved successfully', 'success');
  });
});

// Load saved settings
chrome.storage.sync.get(['apiKey', 'copyToClipboard'], (data) => {
  if (data.apiKey) {
    document.getElementById('apiKey').value = data.apiKey;
  }
  if (data.copyToClipboard !== undefined) {
    document.getElementById('copyToClipboard').checked = data.copyToClipboard;
  }
});

function showMessage(message, type) {
  const messageElement = document.getElementById('message');
  messageElement.textContent = message;
  messageElement.className = type;
  messageElement.style.display = 'block';
  setTimeout(() => {
    messageElement.style.display = 'none';
  }, 3000);
}
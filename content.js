if (window.location.hostname.includes('anthropic.com') || window.location.hostname.includes('claude.ai')) {
  
let mediaRecorder;
let audioChunks = [];
const maxRecordingTime = 600000; // 6000 Sekunden

function createRecordButton() {
    const button = document.createElement('button');
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V6z"/>
        <path fill="currentColor" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    `;
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '9999';
    button.style.width = '48px';
    button.style.height = '48px';
    button.style.borderRadius = '50%';
    button.style.backgroundColor = '#4CAF50';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    button.style.transition = 'all 0.3s ease';
    button.addEventListener('click', toggleRecording);
    document.body.appendChild(button);
    return button;
  }

const recordButton = createRecordButton();

async function toggleRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    stopRecording();
  } else {
    startRecording();
  }
}

async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
      mediaRecorder.onstop = processAudio;
  
      mediaRecorder.start();
      updateUI('Recording...', true);
      setTimeout(() => stopRecording(stream), maxRecordingTime);
    } catch (err) {
      handleError('Error accessing microphone', err);
    }
  }
  
  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      updateUI('Processing...', false);
    }
  }

function stopMediaTracks(stream) {
    stream.getTracks().forEach(track => track.stop());
  }
async function processAudio() {
  const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
  const audioFile = new File([audioBlob], 'audio.wav');
  await transcribeAudio(audioFile);
  audioChunks = [];
}

async function transcribeAudio(audioFile) {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) throw new Error('API key not set');
  
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
  
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData
      });
  
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  
      const { text: transcription } = await response.json();
      insertTranscription(transcription);
      
      const { copyToClipboard } = await chrome.storage.sync.get('copyToClipboard');
      if (copyToClipboard) {
        await navigator.clipboard.writeText(transcription);
      }
      
      updateUI('Transcription sent to Claude AI', false);
    } catch (err) {
      handleError('Error in audio transcription', err);
    }
  }

function insertTranscription(transcription) {
    console.log('Versuche Transkription einzufügen:', transcription);
  
    const selectors = [
      'div[aria-label="Write your prompt to Claude"] div.ProseMirror',
      'textarea[placeholder="Reply to Claude..."]',
      'div[contenteditable="true"]',
      'div.claude-input-area'
    ];
  
    let inputElement;
  
    for (const selector of selectors) {
        inputElement = document.querySelector(selector);
        if (inputElement) {
          console.log(`Input element found with selector: ${selector}`);
          break;
        }
      }

    if (!inputElement) {
      console.error('Could not find Claude input field');
      alert('Error: Could not find the input field. Please make sure you are on the Claude website.');
      return;
    }
  
    try {
      if (inputElement.tagName.toLowerCase() === 'textarea') {
        inputElement.value = transcription;
        inputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      } else {
        inputElement.innerHTML = '';
        const paragraph = document.createElement('p');
        paragraph.textContent = transcription;
        inputElement.appendChild(paragraph);
  
        if (inputElement.classList.contains('ProseMirror')) {
          inputElement.querySelector('p').classList.remove('is-empty', 'is-editor-empty');
        }
  
        inputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      }
  
      inputElement.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(inputElement);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
  
      console.log('Transcription successfully inserted');
    } catch (error) {
      console.error('Error inserting transcription:', error);
      alert('Error inserting transcription. Please try again or paste the text manually.');
    }
  }

  function updateUI(status, isRecording) {
    // Keep the SVG icon
    recordButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V6z"/>
        <path fill="currentColor" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    `;
  
    // Only change the background color
    recordButton.style.backgroundColor = isRecording ? '#f44336' : '#4CAF50';
  }
  

function handleError(message, err) {
  console.error(message, err);
  alert(`Error: ${message}`);
}

async function getApiKey() {
  return new Promise(resolve => {
    chrome.storage.sync.get('apiKey', data => resolve(data.apiKey));
  });
}

// Bestehender Listener für Nachrichten vom Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "insertTranscription") {
    insertTranscription(request.transcription);
    sendResponse({ success: true });
  }
});

}
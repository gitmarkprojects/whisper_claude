let mediaRecorder;
let audioChunks = [];
const maxRecordingTime = 600000; // 600 seconds

const recordButton = document.getElementById('record');
const optionsButton = document.getElementById('options');
const statusDiv = document.getElementById('status');

recordButton.addEventListener('click', toggleRecording);
optionsButton.addEventListener('click', openOptions);

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
    setTimeout(stopRecording, maxRecordingTime);
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

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const { text: transcription } = await response.json();
    sendTranscriptionToContentScript(transcription);
    
    const { copyToClipboard } = await chrome.storage.sync.get('copyToClipboard');
    if (copyToClipboard) {
      await navigator.clipboard.writeText(transcription);
    }
    
    updateUI('Transcription sent to Claude AI', false);
  } catch (err) {
    handleError('Error transcribing audio', err);
  }
}

function sendTranscriptionToContentScript(transcription) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tabId = tabs[0].id;
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: ['content.js']
      },
      () => {
        chrome.tabs.sendMessage(tabId, { action: "insertTranscription", transcription });
      }
    );
  });
}


function updateUI(status, isRecording) {
  statusDiv.textContent = status;
  recordButton.textContent = isRecording ? 'Stop Recording' : 'Start Recording';
  recordButton.style.backgroundColor = isRecording ? '#f44336' : '#4CAF50';
}

function handleError(message, err) {
  console.error(message, err);
  statusDiv.textContent = `Error: ${message}`;
}

async function getApiKey() {
  return new Promise(resolve => {
    chrome.storage.sync.get('apiKey', data => resolve(data.apiKey));
  });
}

function openOptions() {
  chrome.runtime.openOptionsPage ? chrome.runtime.openOptionsPage() : window.open(chrome.runtime.getURL('options.html'));
}
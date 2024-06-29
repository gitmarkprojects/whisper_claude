# Whisper to Claude AI

A Chrome extension that allows users to record audio, transcribe it using OpenAI's Whisper API, and automatically insert the transcription into Claude AI's chat interface.

## Features

- Record audio directly from the browser
- Transcribe audio using OpenAI's Whisper API
- Automatically insert transcriptions into Claude AI's chat interface
- Customizable recording duration (default: 60 seconds)

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Setup

1. Get an API key from OpenAI (https://platform.openai.com/account/api-keys)
2. Click the extension icon and select "Open Options"
3. Enter your OpenAI API key and save

## Usage

1. Navigate to Claude AI's website
2. Click the microphone icon in the bottom right corner to start recording
3. Speak your message
4. Recording will automatically stop after 60 seconds, or click the icon again to stop early
5. The transcription will be automatically inserted into Claude AI's chat interface

## Permissions

This extension requires the following permissions:

- `activeTab`: To interact with the current tab
- `storage`: To store the OpenAI API key
- `clipboardWrite`: To copy the transcription to the clipboard
- `scripting`: To inject scripts into web pages
- `https://api.openai.com/`: To access the OpenAI API for transcription

## Privacy

This extension processes audio locally and only sends it to OpenAI for transcription. No audio data is stored. Please review OpenAI's privacy policy for information on how they handle data.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
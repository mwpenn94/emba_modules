# Edge TTS Integration Notes — Updated

## Key Finding: Browser Limitation
As of v1.4.0, edge-tts-universal only works in Microsoft Edge browser.
Chrome/Firefox/Safari are BLOCKED due to custom WebSocket header requirement.
Server-side (Node.js) works perfectly.

## Strategy: Need backend upgrade
- Must use `webdev_add_feature` to get `web-db-user` (backend server)
- Create a `/api/tts` endpoint that uses edge-tts-universal server-side
- Stream or return audio buffer to the frontend
- Frontend plays the audio via HTML5 Audio API

## Package: edge-tts-universal
- Node.js optimized: `import { EdgeTTS, Communicate, VoicesManager } from 'edge-tts-universal'`
- Has VoicesManager for listing all available voices
- listVoicesUniversal() for getting voice list
- Supports SSML prosody (pitch, rate, volume)
- Output: MP3 audio

## Voice List API:
```js
import { VoicesManager } from 'edge-tts-universal';
const voices = await VoicesManager.create();
// voices.find() to search by locale, gender, etc.
```

## Available voices include 400+ options across 40+ languages
- en-US-EmmaMultilingualNeural
- en-US-GuyNeural
- en-US-JennyNeural
- en-US-AriaNeural
- en-GB-SoniaNeural
- etc.

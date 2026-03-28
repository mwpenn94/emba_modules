/**
 * Edge TTS Server Module
 * Provides text-to-speech synthesis using Microsoft Edge's neural voices.
 * All 400+ voices available, streamed as MP3 audio.
 */

import { Router, Request, Response } from 'express';
import { Communicate, VoicesManager } from 'edge-tts-universal';

const ttsRouter = Router();

// Cache voices list (refreshed every hour)
let cachedVoices: any[] = [];
let voicesCacheTime = 0;
const VOICE_CACHE_TTL = 3600_000; // 1 hour

async function getVoices() {
  const now = Date.now();
  if (cachedVoices.length > 0 && now - voicesCacheTime < VOICE_CACHE_TTL) {
    return cachedVoices;
  }
  try {
    const manager = await VoicesManager.create();
    const allVoices = manager.find({});
    cachedVoices = allVoices.map((v: any) => ({
      name: v.Name || v.ShortName,
      shortName: v.ShortName,
      locale: v.Locale,
      gender: v.Gender,
      language: v.Language,
      friendlyName: v.FriendlyName || v.ShortName,
    }));
    voicesCacheTime = now;
  } catch (err) {
    console.error('[TTS] Failed to fetch voices:', err);
    // Return hardcoded fallback if API fails
    if (cachedVoices.length === 0) {
      cachedVoices = getDefaultVoices();
      voicesCacheTime = now;
    }
  }
  return cachedVoices;
}

function getDefaultVoices() {
  return [
    { name: 'Microsoft Server Speech Text to Speech Voice (en-US, EmmaMultilingualNeural)', shortName: 'en-US-EmmaMultilingualNeural', locale: 'en-US', gender: 'Female', friendlyName: 'Emma (US)' },
    { name: 'Microsoft Server Speech Text to Speech Voice (en-US, AndrewMultilingualNeural)', shortName: 'en-US-AndrewMultilingualNeural', locale: 'en-US', gender: 'Male', friendlyName: 'Andrew (US)' },
    { name: 'Microsoft Server Speech Text to Speech Voice (en-US, AriaNeural)', shortName: 'en-US-AriaNeural', locale: 'en-US', gender: 'Female', friendlyName: 'Aria (US)' },
    { name: 'Microsoft Server Speech Text to Speech Voice (en-US, GuyNeural)', shortName: 'en-US-GuyNeural', locale: 'en-US', gender: 'Male', friendlyName: 'Guy (US)' },
    { name: 'Microsoft Server Speech Text to Speech Voice (en-US, JennyNeural)', shortName: 'en-US-JennyNeural', locale: 'en-US', gender: 'Female', friendlyName: 'Jenny (US)' },
    { name: 'Microsoft Server Speech Text to Speech Voice (en-US, AvaMultilingualNeural)', shortName: 'en-US-AvaMultilingualNeural', locale: 'en-US', gender: 'Female', friendlyName: 'Ava (US)' },
    { name: 'Microsoft Server Speech Text to Speech Voice (en-US, BrianMultilingualNeural)', shortName: 'en-US-BrianMultilingualNeural', locale: 'en-US', gender: 'Male', friendlyName: 'Brian (US)' },
    { name: 'Microsoft Server Speech Text to Speech Voice (en-GB, SoniaNeural)', shortName: 'en-GB-SoniaNeural', locale: 'en-GB', gender: 'Female', friendlyName: 'Sonia (UK)' },
    { name: 'Microsoft Server Speech Text to Speech Voice (en-GB, RyanNeural)', shortName: 'en-GB-RyanNeural', locale: 'en-GB', gender: 'Male', friendlyName: 'Ryan (UK)' },
    { name: 'Microsoft Server Speech Text to Speech Voice (en-AU, NatashaNeural)', shortName: 'en-AU-NatashaNeural', locale: 'en-AU', gender: 'Female', friendlyName: 'Natasha (AU)' },
    { name: 'Microsoft Server Speech Text to Speech Voice (en-AU, WilliamNeural)', shortName: 'en-AU-WilliamNeural', locale: 'en-AU', gender: 'Male', friendlyName: 'William (AU)' },
    { name: 'Microsoft Server Speech Text to Speech Voice (en-IN, NeerjaNeural)', shortName: 'en-IN-NeerjaNeural', locale: 'en-IN', gender: 'Female', friendlyName: 'Neerja (IN)' },
    { name: 'Microsoft Server Speech Text to Speech Voice (en-CA, ClaraNeural)', shortName: 'en-CA-ClaraNeural', locale: 'en-CA', gender: 'Female', friendlyName: 'Clara (CA)' },
  ];
}

/**
 * GET /api/tts/voices
 * Returns all available Edge TTS voices, optionally filtered by locale
 */
ttsRouter.get('/voices', async (req: Request, res: Response) => {
  try {
    const voices = await getVoices();
    const locale = req.query.locale as string | undefined;

    const filtered = locale
      ? voices.filter((v: any) => v.locale.startsWith(locale))
      : voices;

    res.json({
      voices: filtered,
      total: filtered.length,
    });
  } catch (err) {
    console.error('[TTS] Voice list error:', err);
    res.status(500).json({ error: 'Failed to fetch voices' });
  }
});

/**
 * POST /api/tts/synthesize
 * Synthesizes text to speech and returns MP3 audio
 * Body: { text: string, voice?: string, rate?: string, pitch?: string, volume?: string }
 */
ttsRouter.post('/synthesize', async (req: Request, res: Response) => {
  try {
    const { text, voice, rate, pitch, volume } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    // Limit text length to prevent abuse
    const trimmedText = text.slice(0, 5000);

    const voiceName = voice || 'en-US-EmmaMultilingualNeural';

    const communicate = new Communicate(trimmedText, {
      voice: voiceName,
      rate: rate || '+0%',
      pitch: pitch || '+0Hz',
      volume: volume || '+0%',
    });

    const buffers: Buffer[] = [];

    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        buffers.push(chunk.data);
      }
    }

    if (buffers.length === 0) {
      res.status(500).json({ error: 'No audio generated' });
      return;
    }

    const audioBuffer = Buffer.concat(buffers);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audioBuffer.length),
      'Cache-Control': 'public, max-age=86400', // Cache for 24h
    });

    res.send(audioBuffer);
  } catch (err) {
    console.error('[TTS] Synthesis error:', err);
    res.status(500).json({ error: 'Speech synthesis failed' });
  }
});

/**
 * POST /api/tts/synthesize-batch
 * Synthesizes multiple texts and returns JSON with base64 audio for each
 * Body: { items: Array<{ id: string, text: string }>, voice?: string, rate?: string, pitch?: string }
 * Returns: { results: Array<{ id: string, audio: string (base64), error?: string }> }
 */
ttsRouter.post('/synthesize-batch', async (req: Request, res: Response) => {
  try {
    const { items, voice, rate, pitch, volume } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Items array is required' });
      return;
    }

    // Limit batch size
    const batch = items.slice(0, 20);
    const voiceName = voice || 'en-US-EmmaMultilingualNeural';

    const results = [];

    for (const item of batch) {
      try {
        const text = (item.text || '').slice(0, 3000);
        const communicate = new Communicate(text, {
          voice: voiceName,
          rate: rate || '+0%',
          pitch: pitch || '+0Hz',
          volume: volume || '+0%',
        });

        const buffers: Buffer[] = [];
        for await (const chunk of communicate.stream()) {
          if (chunk.type === 'audio' && chunk.data) {
            buffers.push(chunk.data);
          }
        }

        const audioBuffer = Buffer.concat(buffers);
        results.push({
          id: item.id,
          audio: audioBuffer.toString('base64'),
        });
      } catch (itemErr) {
        results.push({
          id: item.id,
          audio: '',
          error: 'Synthesis failed for this item',
        });
      }
    }

    res.json({ results });
  } catch (err) {
    console.error('[TTS] Batch synthesis error:', err);
    res.status(500).json({ error: 'Batch synthesis failed' });
  }
});

export { ttsRouter };

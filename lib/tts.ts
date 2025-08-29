// Simple ElevenLabs REST API client for browser use
const callElevenLabsAPI = async (text: string, voiceId: string): Promise<ArrayBuffer> => {
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('No ElevenLabs API key');
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  return await response.arrayBuffer();
};

// Voice IDs for different types of announcements
const VOICE_IDS = {
  expense: 'pNInz6obpgDQGcFmaJgB', // Adam - professional male voice
  settlement: 'EXAVITQu4vr4xnSDxMaL', // Bella - friendly female voice
  welcome: '21m00Tcm4TlvDq8ikWAM', // Rachel - clear female voice
  notification: 'onwK4e9ZLuTAKqWW03F9', // Daniel - calm male voice
};

// Fallback to browser TTS if ElevenLabs fails
export const fallbackTTS = async (text: string, forcePlay: boolean = false): Promise<void> => {
  try {
    console.log('🔊 fallbackTTS called with:', text);
    
    // Check if user has TTS enabled (unless forced for toggle messages)
    if (!forcePlay) {
      const ttsEnabled = localStorage.getItem('tts-enabled');
      if (ttsEnabled === 'false') {
        console.log('🔊 Fallback TTS is disabled by user');
        return;
      }
    }
    
    if (!('speechSynthesis' in window)) {
      console.log('🔊 Speech Synthesis not supported');
      return;
    }
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    const voices = window.speechSynthesis.getVoices();
    console.log('🔊 Available voices:', voices.length);
    
    // If no voices loaded yet, try to load them
    if (voices.length === 0) {
      console.log('🔊 No voices loaded, waiting for voices...');
      // Try to trigger voice loading
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
      await new Promise(resolve => setTimeout(resolve, 200));
      const newVoices = window.speechSynthesis.getVoices();
      console.log('🔊 Voices after reload:', newVoices.length);
    }
    
    const availableVoices = window.speechSynthesis.getVoices();
    const preferredVoice = availableVoices.find(voice => 
      voice.name.includes('Google') || voice.lang.startsWith('en')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log('🔊 Using voice:', preferredVoice.name);
    } else if (availableVoices.length > 0) {
      utterance.voice = availableVoices[0];
      console.log('🔊 Using default voice:', availableVoices[0].name);
    }
    
    console.log('🔊 About to speak:', text);
    
    // Add event listeners to track speech status
    utterance.onstart = () => console.log('🔊 Speech started successfully');
    utterance.onend = () => console.log('🔊 Speech ended');
    utterance.onerror = (e) => console.error('🔊 Speech error:', e);
    
    window.speechSynthesis.speak(utterance);
    console.log('🔊 Speech queued');
  } catch (error) {
    console.error('Fallback TTS Error:', error);
  }
};

// Main ElevenLabs TTS function with fallback
export const speakText = async (
  text: string, 
  voiceId: string = VOICE_IDS.notification
): Promise<void> => {
  try {
    console.log('🔊 speakText called with:', { text, voiceId });
    
    // Check if user has TTS enabled
    const ttsEnabled = localStorage.getItem('tts-enabled');
    console.log('🔊 TTS enabled status:', ttsEnabled);
    if (ttsEnabled === 'false') {
      console.log('🔊 TTS is disabled by user');
      return;
    }

    // Check if we have API key for ElevenLabs
    const hasApiKey = !!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    console.log('🔊 API Key present:', hasApiKey);
    
    // If no API key, use fallback
    if (!hasApiKey) {
      console.log('🔊 Using browser TTS (no ElevenLabs key):', text);
      await fallbackTTS(text);
      return;
    }

    console.log('🔊 ElevenLabs TTS:', text);

    try {
      // Generate audio using ElevenLabs REST API
      const audioBuffer = await callElevenLabsAPI(text, voiceId);

      // Convert to blob for playback
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Set volume from user preferences
      const volume = localStorage.getItem('tts-volume');
      audio.volume = volume ? parseFloat(volume) : 0.8;
      
      await audio.play();
      
      // Cleanup after playing
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });
    } catch (elevenLabsError) {
      console.error('ElevenLabs API Error:', elevenLabsError);
      // Fallback to browser TTS if ElevenLabs fails
      await fallbackTTS(text);
    }

  } catch (error) {
    console.error('TTS Error:', error);
    // Fallback to browser TTS if everything fails
    await fallbackTTS(text);
  }
};

// Debouncing to prevent multiple announcements
let lastAnnouncementTime: Record<string, number> = {};
const ANNOUNCEMENT_COOLDOWN = 3000; // 3 seconds

// Global flag to suppress settlement announcements during trip completion
let suppressSettlementAnnouncements = false;

export const setSuppressSettlementAnnouncements = (suppress: boolean) => {
  suppressSettlementAnnouncements = suppress;
  console.log('🔊 Settlement announcements suppressed:', suppress);
};

const canAnnounce = (type: string): boolean => {
  // Special case: suppress settlement announcements when trip is being completed
  if (type === 'settlement' && suppressSettlementAnnouncements) {
    console.log('🔊 Skipping settlement announcement - suppressed during trip completion');
    return false;
  }
  
  const now = Date.now();
  const lastTime = lastAnnouncementTime[type] || 0;
  
  if (now - lastTime < ANNOUNCEMENT_COOLDOWN) {
    console.log(`🔊 Skipping ${type} announcement - too recent (${now - lastTime}ms ago)`);
    return false;
  }
  
  lastAnnouncementTime[type] = now;
  return true;
};

// Predefined announcement functions with specific voices
export const announceExpense = (amount: number, description: string, paidBy: string) => {
  if (!canAnnounce('expense')) return;
  
  console.log('🔊 announceExpense called with:', { amount, description, paidBy });
  const message = `New expense added: ${description} for Rupees ${amount.toFixed(0)}, paid by ${paidBy}`;
  console.log('🔊 Message to speak:', message);
  
  // Only call speakText once to avoid duplicate voices
  setTimeout(() => {
    speakText(message, VOICE_IDS.expense);
  }, 100);
};

export const announceSettlement = (settlements: Array<{from: string, to: string, amount: number}>) => {
  if (!canAnnounce('settlement')) return;
  
  if (settlements.length === 0) {
    speakText("Congratulations! All expenses are perfectly settled. No payments needed.", VOICE_IDS.settlement);
    return;
  }
  
  const message = `Settlement summary: ${settlements.length} payment${settlements.length > 1 ? 's' : ''} needed. ${settlements[0].from} owes ${settlements[0].to} $${settlements[0].amount.toFixed(2)}`;
  speakText(message, VOICE_IDS.settlement);
};

export const announceWelcome = (tripName: string) => {
  if (!canAnnounce('welcome')) return;
  
  const message = `Welcome to ${tripName}! Your smart expense tracker is ready with voice announcements.`;
  speakText(message, VOICE_IDS.welcome);
};

export const announceTripComplete = (tripName: string, totalExpenses: number, emailsSent: number) => {
  if (!canAnnounce('tripComplete')) return;
  
  const message = `Trip ${tripName} has been completed! ${totalExpenses} expenses finalized. Detailed summary emails will be delivered shortly to all members.`;
  speakText(message, VOICE_IDS.notification);
};

// Toggle TTS on/off
export const toggleTTS = () => {
  const current = localStorage.getItem('tts-enabled') !== 'false';
  const newState = !current;
  localStorage.setItem('tts-enabled', newState.toString());
  
  // Only announce the toggle if we're enabling TTS, or use fallback for disable message
  if (newState) {
    speakText('Voice announcements enabled');
  } else {
    // Use fallback TTS for disable message with forcePlay to ensure it plays
    fallbackTTS('Voice announcements disabled', true);
  }
  return newState;
};

export const isTTSEnabled = () => {
  if (typeof window === 'undefined') return false;
  const enabled = localStorage.getItem('tts-enabled') !== 'false';
  console.log('🔊 isTTSEnabled check:', enabled, 'localStorage value:', localStorage.getItem('tts-enabled'));
  return enabled;
};

// Test voice function for debugging
export const testVoice = async () => {
  console.log('🔊 Testing voice functionality...');
  await speakText('This is a test of the voice system. If you can hear this, TTS is working!', VOICE_IDS.notification);
};

// Simple immediate test
export const testImmediateSpeech = () => {
  console.log('🔊 Testing immediate speech...');
  try {
    const msg = 'Hello, this is an immediate test';
    const utterance = new SpeechSynthesisUtterance(msg);
    utterance.volume = 1.0;
    utterance.rate = 1.0;
    
    utterance.onstart = () => console.log('🔊 Immediate speech started!');
    utterance.onend = () => console.log('🔊 Immediate speech ended!');
    utterance.onerror = (e) => console.error('🔊 Immediate speech error:', e);
    
    window.speechSynthesis.speak(utterance);
    console.log('🔊 Immediate speech queued');
  } catch (error) {
    console.error('🔊 Immediate test error:', error);
  }
};

// Test expense announcement
export const testExpenseAnnouncement = () => {
  console.log('🔊 Testing expense announcement...');
  announceExpense(25.50, 'Test Dinner', 'John Doe');
};

// Load voices when available (some browsers load them asynchronously)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    console.log('🔊 Voices loaded:', window.speechSynthesis.getVoices().length);
  });

  // Make test functions available globally for debugging
  (window as any).testTTS = {
    testVoice,
    testImmediateSpeech,
    testExpenseAnnouncement,
    speakText,
    announceExpense,
    announceSettlement,
    announceWelcome,
    announceTripComplete,
    setSuppressSettlementAnnouncements,
    isTTSEnabled,
    fallbackTTS
  };
  
  console.log('🔊 TTS debugging functions available as window.testTTS');
}

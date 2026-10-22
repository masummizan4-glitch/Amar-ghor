/**
 * Web Audio API synthesized tactile sound effects.
 * Instantaneous, crisp, and requires zero external audio asset requests.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays a pleasant, subtle tactile 'ping' sound when interacting with WhatsApp buttons.
 * Harmonious two-tone chime (F#5 to C#6) with gentle decay for crisp feedback.
 */
export function playWhatsAppPingSound(): void {
  // Mobile tactile haptic pulse if supported
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(25);
    } catch {
      // Ignore vibration errors
    }
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Master gain for subtle, gentle presence without startling the user
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.18, now + 0.015);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    masterGain.connect(ctx.destination);

    // Primary Tone: 740Hz (F#5) stepping up to 1108Hz (C#6) - signature friendly ping
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(740, now);
    osc1.frequency.exponentialRampToValueAtTime(1108, now + 0.06);

    // Secondary Harmonics: subtle bell shimmer at 1480Hz
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1480, now);
    osc2.frequency.exponentialRampToValueAtTime(2216, now + 0.08);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.08, now);
    osc2Gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc1.connect(masterGain);
    osc2.connect(osc2Gain);
    osc2Gain.connect(masterGain);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 0.25);
    osc2.stop(now + 0.25);
  } catch (err) {
    console.debug('Tactile audio playback skipped:', err);
  }
}

/**
 * Plays a soft, rewarding tactile sound when an item is added to the cart.
 */
export function playAddToCartSound(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(20);
    } catch {}
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    masterGain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);
    osc.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (err) {
    console.debug('Add to cart audio skipped:', err);
  }
}


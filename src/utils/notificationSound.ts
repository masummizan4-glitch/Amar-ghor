/**
 * Helper to play pleasant store bell chime and dispatch native browser notifications
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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

// Auto-unlock audio context on first user touch/click
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {}
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

export function playOrderSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Pleasant high-clarity store bell chime (E5 -> A5 -> E6 -> A6)
    const notes = [
      { freq: 659.25, time: 0, dur: 0.35, gain: 0.25 },
      { freq: 880.00, time: 0.12, dur: 0.45, gain: 0.3 },
      { freq: 1318.51, time: 0.24, dur: 0.55, gain: 0.35 },
      { freq: 1760.00, time: 0.36, dur: 0.7, gain: 0.4 }
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);
      gain.gain.setValueAtTime(0, ctx.currentTime + note.time);
      gain.gain.linearRampToValueAtTime(note.gain, ctx.currentTime + note.time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.time + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + note.time);
      osc.stop(ctx.currentTime + note.time + note.dur);
    });
  } catch (err) {
    console.warn('Audio chime note:', err);
  }
}

export function triggerHapticFeedback() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 300]);
    }
  } catch {}
}

export async function showNativeAdminNotification(
  title: string,
  body: string,
  url = '/?admin=true&tab=orders'
) {
  if (typeof window === 'undefined') return;

  // Sound and vibration
  playOrderSound();
  triggerHapticFeedback();

  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const iconUrl = '/pwa-192x192.png';
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: iconUrl,
          badge: iconUrl,
          tag: 'amarghor-order-' + Date.now(),
          vibrate: [200, 100, 200, 100, 300],
          data: { url }
        } as any);
        return;
      }
    }

    new Notification(title, {
      body,
      icon: iconUrl
    });
  } catch (err) {
    console.warn('Notification display note:', err);
  }
}

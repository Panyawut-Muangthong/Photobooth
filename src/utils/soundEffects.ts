// Web Audio API Sound Synthesizer for Photobooth experience

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playCountdownBeep(highPitch = false) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(highPitch ? 880 : 440, ctx.currentTime); // A5 or A4

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.debug('Audio not allowed yet', e);
  }
}

export function playCameraShutterSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // First click sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);

    // Mechanical snap sound
    setTimeout(() => {
      if (!ctx) return;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(300, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.09);

      gain2.gain.setValueAtTime(0.25, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start();
      osc2.stop(ctx.currentTime + 0.12);
    }, 70);
  } catch (e) {
    console.debug('Audio error', e);
  }
}

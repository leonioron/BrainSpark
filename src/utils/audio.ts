/**
 * Lightweight Web Audio API chime synthesizer for tactile game feedback.
 * Zero external audio assets required; works 100% offline in Web and Android WebView.
 */

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedCtx) {
    sharedCtx = new AudioCtx();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {
      // Ignore autoplay blocks until user gesture
    });
  }
  return sharedCtx;
}

function playTone(
  freq: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.09,
  delaySec = 0,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const start = ctx.currentTime + delaySec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + durationSec + 0.02);
}

export const soundFx = {
  tick(enabled: boolean) {
    if (!enabled) return;
    playTone(520, 0.07, 'sine', 0.06);
  },
  go(enabled: boolean) {
    if (!enabled) return;
    playTone(740, 0.1, 'triangle', 0.09);
  },
  correct(enabled: boolean) {
    if (!enabled) return;
    playTone(620, 0.08, 'sine', 0.08, 0);
    playTone(880, 0.12, 'sine', 0.09, 0.055);
  },
  wrong(enabled: boolean) {
    if (!enabled) return;
    playTone(240, 0.14, 'triangle', 0.09, 0);
    playTone(190, 0.16, 'triangle', 0.08, 0.07);
  },
  tile(enabled: boolean, index: number) {
    if (!enabled) return;
    const scale = [392, 440, 493.88, 523.25, 587.33, 659.25, 739.99, 783.99, 880];
    const freq = scale[index % scale.length];
    playTone(freq, 0.14, 'sine', 0.08);
  },
  complete(enabled: boolean) {
    if (!enabled) return;
    playTone(523.25, 0.1, 'sine', 0.08, 0);
    playTone(659.25, 0.1, 'sine', 0.08, 0.08);
    playTone(783.99, 0.12, 'sine', 0.09, 0.16);
    playTone(1046.5, 0.24, 'sine', 0.1, 0.24);
  },
};

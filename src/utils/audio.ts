/**
 * Sintetizador chiptune 16-bit leve via Web Audio API.
 * Zero arquivos externos; funciona 100% offline na Web e no Android WebView.
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
      // Ignora bloqueio até interação do usuário
    });
  }
  return sharedCtx;
}

function playTone(
  freq: number,
  durationSec: number,
  type: OscillatorType = 'square',
  gainPeak = 0.055,
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
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + durationSec + 0.02);
}

export const soundFx = {
  tick(enabled: boolean) {
    if (!enabled) return;
    playTone(587.33, 0.055, 'square', 0.035);
  },
  go(enabled: boolean) {
    if (!enabled) return;
    playTone(880, 0.09, 'square', 0.05);
  },
  correct(enabled: boolean) {
    if (!enabled) return;
    playTone(659.25, 0.065, 'square', 0.045, 0);
    playTone(987.77, 0.11, 'square', 0.05, 0.05);
  },
  wrong(enabled: boolean) {
    if (!enabled) return;
    playTone(220, 0.11, 'sawtooth', 0.045, 0);
    playTone(164.81, 0.15, 'sawtooth', 0.045, 0.075);
  },
  tile(enabled: boolean, index: number) {
    if (!enabled) return;
    const scale = [392, 440, 493.88, 523.25, 587.33, 659.25, 739.99, 783.99, 880];
    const freq = scale[index % scale.length];
    playTone(freq, 0.12, 'triangle', 0.075);
  },
  complete(enabled: boolean) {
    if (!enabled) return;
    playTone(523.25, 0.08, 'square', 0.045, 0);
    playTone(659.25, 0.08, 'square', 0.045, 0.075);
    playTone(783.99, 0.09, 'square', 0.048, 0.15);
    playTone(1046.5, 0.22, 'square', 0.055, 0.225);
  },
};

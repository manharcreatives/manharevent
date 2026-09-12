// Audio feedback for scan results — gate staff learn tones quickly (design-system §6)

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function beep(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.4) {
  if (typeof window === "undefined") return;
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g);
    g.connect(c.destination);
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch {
    // AudioContext not available
  }
}

export function playAllowed() {
  // Rising beep — "all good"
  beep(880, 0.12);
  setTimeout(() => beep(1320, 0.15), 100);
}

export function playAlreadyIn() {
  // Double flat beep — "stop, look again"
  beep(600, 0.12, "square", 0.3);
  setTimeout(() => beep(600, 0.12, "square", 0.3), 200);
}

export function playError() {
  // Long error tone
  beep(220, 0.45, "sawtooth", 0.3);
}

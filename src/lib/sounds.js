// Game-style sound engine using Web Audio API — zero dependencies
// All sounds are synthesized procedurally for instant playback

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (mobile requires user gesture)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// --- Primitive builders ---

function playTone(freq, duration, type = 'sine', volume = 0.15, delay = 0) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function playNoise(duration, volume = 0.08, delay = 0) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3000;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(ctx.currentTime + delay);
}

// --- Sound effects ---

// Soft click for tab switches, nav taps
export function soundTap() {
  playTone(1200, 0.06, 'sine', 0.08);
}

// Satisfying "pop" for opening modals, cards
export function soundPop() {
  playTone(600, 0.08, 'sine', 0.12);
  playTone(900, 0.06, 'sine', 0.08, 0.03);
}

// Upward sweep for positive actions (rank up, money zone)
export function soundSweepUp() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
}

// Birdie — cheerful two-note chirp
export function soundBirdie() {
  playTone(880, 0.12, 'sine', 0.15);
  playTone(1108, 0.15, 'sine', 0.12, 0.1);
}

// Eagle — triumphant three-note fanfare
export function soundEagle() {
  playTone(660, 0.12, 'triangle', 0.18);
  playTone(880, 0.12, 'triangle', 0.15, 0.1);
  playTone(1320, 0.25, 'triangle', 0.18, 0.2);
}

// Jackpot / Victory fanfare — 5-note ascending major chord
export function soundJackpot() {
  playTone(523, 0.15, 'triangle', 0.15);       // C5
  playTone(659, 0.15, 'triangle', 0.13, 0.1);  // E5
  playTone(784, 0.15, 'triangle', 0.13, 0.2);  // G5
  playTone(1047, 0.15, 'triangle', 0.15, 0.3); // C6
  playTone(1319, 0.3, 'triangle', 0.18, 0.4);  // E6
  // Sparkle noise
  playNoise(0.15, 0.04, 0.5);
}

// Gold rain — gentle shimmer
export function soundShimmer() {
  playTone(2000, 0.3, 'sine', 0.04);
  playTone(2500, 0.25, 'sine', 0.03, 0.05);
  playTone(3000, 0.2, 'sine', 0.02, 0.1);
}

// Draw ratchet tick — slot machine click
export function soundTick() {
  playNoise(0.03, 0.12);
  playTone(800 + Math.random() * 400, 0.03, 'square', 0.04);
}

// Draw reveal — dramatic whoosh + ding
export function soundReveal() {
  playNoise(0.12, 0.06);
  playTone(1000, 0.15, 'sine', 0.12, 0.05);
  playTone(1500, 0.12, 'sine', 0.08, 0.1);
}

// Lock-in / confirm — solid "chunk" + bright tone
export function soundLock() {
  playNoise(0.04, 0.1);
  playTone(700, 0.08, 'triangle', 0.12, 0.02);
  playTone(1050, 0.12, 'triangle', 0.1, 0.06);
}

// Champions wall — majestic low brass hit
export function soundChampion() {
  playTone(262, 0.2, 'sawtooth', 0.08);
  playTone(330, 0.2, 'sawtooth', 0.06, 0.05);
  playTone(392, 0.25, 'triangle', 0.1, 0.15);
  playTone(523, 0.3, 'triangle', 0.12, 0.3);
}

// Money zone — cash register "cha-ching"
export function soundCashRegister() {
  playNoise(0.04, 0.08);
  playTone(1500, 0.08, 'sine', 0.12, 0.03);
  playTone(2000, 0.12, 'sine', 0.1, 0.08);
}

// Error / cut — descending buzz
export function soundError() {
  playTone(400, 0.1, 'sawtooth', 0.08);
  playTone(300, 0.15, 'sawtooth', 0.06, 0.08);
}

// Score update whoosh
export function soundWhoosh() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
}

// Drumroll for draw animation
export function soundDrumroll() {
  for (let i = 0; i < 20; i++) {
    const delay = i * 0.04;
    const volume = 0.03 + (i / 20) * 0.06;
    playNoise(0.04, volume, delay);
  }
}
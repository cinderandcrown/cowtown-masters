import confetti from 'canvas-confetti';

const MASTERS_COLORS = ['#E8A838', '#006633', '#ffffff', '#FFD700'];

// Classic two-cannon celebration
export function fireConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.7 },
      colors: MASTERS_COLORS,
      ticks: 200,
      gravity: 0.8,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.7 },
      colors: MASTERS_COLORS,
      ticks: 200,
      gravity: 0.8,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// Big jackpot burst — for draw reveals and wins
export function fireJackpot() {
  // Center burst
  confetti({
    particleCount: 100,
    spread: 100,
    origin: { x: 0.5, y: 0.4 },
    colors: MASTERS_COLORS,
    ticks: 300,
    gravity: 0.6,
    scalar: 1.2,
  });
  // Delayed side cannons
  setTimeout(() => {
    confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.65 }, colors: MASTERS_COLORS, ticks: 250 });
    confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors: MASTERS_COLORS, ticks: 250 });
  }, 200);
  // Stars rain
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 160,
      origin: { x: 0.5, y: 0 },
      colors: ['#FFD700', '#E8A838'],
      shapes: ['star'],
      ticks: 400,
      gravity: 0.4,
      scalar: 1.5,
    });
  }, 500);
}

// Quick pop for small wins (birdie, rank up)
export function firePop() {
  confetti({
    particleCount: 25,
    spread: 60,
    origin: { x: 0.5, y: 0.6 },
    colors: MASTERS_COLORS,
    ticks: 150,
    gravity: 1,
    scalar: 0.8,
  });
}

// Gold rain for money zone (top 3)
export function fireGoldRain() {
  const end = Date.now() + 1500;
  (function frame() {
    confetti({
      particleCount: 2,
      angle: 90,
      spread: 120,
      origin: { x: Math.random(), y: -0.1 },
      colors: ['#FFD700', '#E8A838', '#DAA520'],
      shapes: ['star'],
      ticks: 300,
      gravity: 0.3,
      scalar: 1.8,
      drift: 0,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
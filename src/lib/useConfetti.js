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
  confetti({
    particleCount: 120,
    spread: 100,
    origin: { x: 0.5, y: 0.4 },
    colors: MASTERS_COLORS,
    ticks: 300,
    gravity: 0.6,
    scalar: 1.2,
  });
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.65 }, colors: MASTERS_COLORS, ticks: 250 });
    confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors: MASTERS_COLORS, ticks: 250 });
  }, 200);
  setTimeout(() => {
    confetti({
      particleCount: 40,
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
    particleCount: 35,
    spread: 70,
    origin: { x: 0.5, y: 0.6 },
    colors: MASTERS_COLORS,
    ticks: 180,
    gravity: 1,
    scalar: 0.9,
  });
}

// Gold rain for money zone (top 3)
export function fireGoldRain() {
  const end = Date.now() + 2000;
  (function frame() {
    confetti({
      particleCount: 3,
      angle: 90,
      spread: 140,
      origin: { x: Math.random(), y: -0.1 },
      colors: ['#FFD700', '#E8A838', '#DAA520'],
      shapes: ['star'],
      ticks: 350,
      gravity: 0.25,
      scalar: 2,
      drift: 0,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// Birdie burst — green-themed mini celebration
export function fireBirdie() {
  confetti({
    particleCount: 40,
    spread: 80,
    origin: { x: 0.5, y: 0.5 },
    colors: ['#006633', '#00a86b', '#E8A838', '#ffffff'],
    ticks: 200,
    gravity: 1.2,
    scalar: 0.8,
  });
}

// Eagle explosion — big dramatic burst
export function fireEagle() {
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { x: 0.5, y: 0.45 },
    colors: ['#FFD700', '#E8A838', '#006633'],
    ticks: 300,
    gravity: 0.5,
    scalar: 1.3,
  });
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 160,
      origin: { x: 0.5, y: 0 },
      colors: ['#FFD700'],
      shapes: ['star'],
      ticks: 400,
      gravity: 0.3,
      scalar: 2,
    });
  }, 300);
}

// Top 3 money zone — side cannons with gold
export function fireMoneyZone() {
  confetti({ particleCount: 30, angle: 60, spread: 50, origin: { x: 0, y: 0.7 }, colors: ['#FFD700', '#E8A838'], ticks: 200 });
  confetti({ particleCount: 30, angle: 120, spread: 50, origin: { x: 1, y: 0.7 }, colors: ['#FFD700', '#E8A838'], ticks: 200 });
}
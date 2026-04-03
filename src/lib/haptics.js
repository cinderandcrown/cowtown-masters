const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export function hapticTap() {
  if (isMobile && navigator.vibrate) navigator.vibrate(10);
}

export function hapticDoubleTap() {
  if (isMobile && navigator.vibrate) navigator.vibrate([10, 50, 10]);
}

export function hapticPulse() {
  if (isMobile && navigator.vibrate) navigator.vibrate(30);
}

// Slot machine ratchet feel
export function hapticRatchet() {
  if (isMobile && navigator.vibrate) navigator.vibrate([5, 30, 5, 30, 5, 30, 10]);
}

// Heavy success hit
export function hapticSuccess() {
  if (isMobile && navigator.vibrate) navigator.vibrate([15, 40, 30]);
}

// Exciting buildup
export function hapticDrumroll() {
  if (isMobile && navigator.vibrate) {
    const pattern = [];
    for (let i = 0; i < 15; i++) {
      pattern.push(5, Math.max(10, 60 - i * 4));
    }
    pattern.push(50);
    navigator.vibrate(pattern);
  }
}
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
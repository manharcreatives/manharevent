// Haptic feedback — gate staff learn patterns by feel (design-system §6)

export function hapticAllowed() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(80);
  }
}

export function hapticAlreadyIn() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([80, 50, 80]);
  }
}

export function hapticError() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(400);
  }
}

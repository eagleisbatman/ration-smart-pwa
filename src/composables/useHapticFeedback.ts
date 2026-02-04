/**
 * Haptic Feedback Composable
 * Provides vibration feedback for native-like interactions
 * Uses the Vibration API where supported
 */

interface HapticOptions {
  duration?: number;
  pattern?: number[];
}

export function useHapticFeedback() {
  // Check if vibration is supported
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  /**
   * Light tap feedback (selection, minor interactions)
   */
  function light(): void {
    if (isSupported) {
      navigator.vibrate(10);
    }
  }

  /**
   * Medium tap feedback (button press, selection confirmation)
   */
  function medium(): void {
    if (isSupported) {
      navigator.vibrate(20);
    }
  }

  /**
   * Heavy feedback (significant action, error)
   */
  function heavy(): void {
    if (isSupported) {
      navigator.vibrate(40);
    }
  }

  /**
   * Success feedback (action completed successfully)
   */
  function success(): void {
    if (isSupported) {
      navigator.vibrate([10, 50, 10]);
    }
  }

  /**
   * Error feedback (action failed, invalid input)
   */
  function error(): void {
    if (isSupported) {
      navigator.vibrate([30, 50, 30, 50, 30]);
    }
  }

  /**
   * Warning feedback (caution, confirmation needed)
   */
  function warning(): void {
    if (isSupported) {
      navigator.vibrate([20, 30, 20]);
    }
  }

  /**
   * Notification feedback (incoming message, update)
   */
  function notification(): void {
    if (isSupported) {
      navigator.vibrate([10, 30, 10, 30, 10]);
    }
  }

  /**
   * Custom vibration pattern
   */
  function custom(options: HapticOptions): void {
    if (!isSupported) return;

    if (options.pattern) {
      navigator.vibrate(options.pattern);
    } else if (options.duration) {
      navigator.vibrate(options.duration);
    }
  }

  /**
   * Stop any ongoing vibration
   */
  function cancel(): void {
    if (isSupported) {
      navigator.vibrate(0);
    }
  }

  return {
    isSupported,
    light,
    medium,
    heavy,
    success,
    error,
    warning,
    notification,
    custom,
    cancel,
  };
}

import { useEffect } from 'react';

/**
 * useKeyboardShortcut Hook
 *
 * A React hook to listen for specific keyboard combinations (e.g., Ctrl+S or Ctrl+P)
 * and execute a custom action when the combination is pressed.
 *
 * @param {string} key - The key to listen for (e.g., 'S', 'P').
 * @param {Function} action - The function to execute when the combination is pressed.
 * @param {boolean} [ctrl=true] - Whether to include the Ctrl key in the combination.
 * @param {boolean} [alt=false] - Whether to include the Alt key in the combination.
 * @param {boolean} [shift=false] - Whether to include the Shift key in the combination.
 */
function useKeyboardShortcut(
  key: string,
  action: () => any,
  ctrl = true,
  alt = false,
  shift = false
) {
  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrl &&
        event.altKey === alt &&
        event.shiftKey === shift
      ) {
        event.preventDefault(); // Prevent default browser action (e.g., saving for Ctrl+S)
        action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, action, ctrl, alt, shift]);
}

export default useKeyboardShortcut;

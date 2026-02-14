import { boot } from 'quasar/wrappers';
import { Dark } from 'quasar';

export default boot(() => {
  const saved = localStorage.getItem('darkMode');

  if (saved === '1') {
    Dark.set(true);
  } else if (saved === '0') {
    Dark.set(false);
  } else {
    // No preference saved — follow system preference
    Dark.set('auto');
  }
});

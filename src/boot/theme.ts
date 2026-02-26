import { boot } from 'quasar/wrappers';
import { Dark } from 'quasar';
import { applyTheme, currentThemeId } from 'src/lib/themes';

export default boot(() => {
  // Restore dark mode preference
  const savedDark = localStorage.getItem('darkMode');
  if (savedDark === '1') {
    Dark.set(true);
  } else if (savedDark === '0') {
    Dark.set(false);
  } else {
    Dark.set('auto');
  }

  // Restore and apply saved theme (default: zinc)
  const savedTheme = localStorage.getItem('rs_theme') || 'zinc';
  applyTheme(savedTheme, Dark.isActive);

  // When dark mode is 'auto', system preference changes won't re-apply theme
  // colors unless we listen for the change and re-apply.
  if (savedDark === null) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      applyTheme(currentThemeId.value, Dark.isActive);
    });
  }
});

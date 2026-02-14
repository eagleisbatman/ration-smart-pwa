import { boot } from 'quasar/wrappers';

export default boot(({ app }) => {
  const { $q } = app.config.globalProperties;
  const saved = localStorage.getItem('darkMode');

  if (saved === '1') {
    $q.dark.set(true);
  } else if (saved === '0') {
    $q.dark.set(false);
  } else {
    // No preference saved — follow system preference
    $q.dark.set('auto');
  }
});

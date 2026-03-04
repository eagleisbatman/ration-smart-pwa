import { boot } from 'quasar/wrappers';

/**
 * Custom icon boot file for RationSmart.
 *
 * Sets up iconMapFn so plain icon names (e.g. "home", "people")
 * automatically render with Material Symbols Outlined instead of
 * the removed Material Icons font.
 *
 * For the custom cow icon, use `useCowIcon()` composable or import
 * `COW_ICON` from `src/composables/useCowIcon`.
 */

// Prefixes that Quasar already handles — do NOT remap these
const knownPrefixRE = /^(sym_[ors]_|[ors]_|mdi-|icon-|bt-|eva-|ion-|iconfont |ti-|bi-|fa[srlbdk]? |fa-(classic|sharp|solid|regular|light|brands|duotone|thin) |img:|svguse:|[Mm]\s?[-+]?\.?\d)/;

function iconMapFn(name: string) {
  if (knownPrefixRE.test(name)) return undefined; // already qualified
  return { icon: `sym_o_${name}` };
}

export default boot(({ app }) => {
  // Set iconMapFn on the $q reactive instance (what QIcon actually reads)
  const $q = app.config.globalProperties.$q;
  if ($q) {
    $q.iconMapFn = iconMapFn;
  }
});

import { boot } from 'quasar/wrappers';
import { Quasar } from 'quasar';
import CowIcon from 'src/components/icons/CowIcon.vue';

/**
 * Custom icon boot file for RationSmart.
 *
 * Registers custom icons and sets up iconMapFn so plain icon names
 * (e.g. "home", "people") automatically render with Material Symbols
 * Outlined instead of the removed Material Icons font.
 */

// Icon paths for use with Quasar's icon system
export const COW_ICON = 'img:/icons/cow.svg';

// Prefixes that Quasar already handles — do NOT remap these
const knownPrefixRE = /^(sym_[ors]_|[ors]_|mdi-|icon-|bt-|eva-|ion-|iconfont |ti-|bi-|fa[srlbdk]? |fa-(classic|sharp|solid|regular|light|brands|duotone|thin) |img:|svguse:|[Mm]\s?[-+]?\.?\d)/;

export default boot(({ app }) => {
  app.component('CowIcon', CowIcon);

  // Remap plain icon names → sym_o_ so Quasar uses Material Symbols Outlined
  Quasar.iconMapFn = (name: string) => {
    if (knownPrefixRE.test(name)) return undefined; // already qualified
    return { icon: `sym_o_${name}` };
  };
});

/* eslint-disable */
// Vue I18n type augmentation for ComponentCustomProperties
// This adds $t, $tc, etc. to all Vue components

import type { DefineComponent } from 'vue';
import type { Composer } from 'vue-i18n';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $t: Composer['t'];
    $tc: (key: string, choice: number, ...args: unknown[]) => string;
    $te: Composer['te'];
    $d: Composer['d'];
    $n: Composer['n'];
    $tm: Composer['tm'];
  }
}

export {};

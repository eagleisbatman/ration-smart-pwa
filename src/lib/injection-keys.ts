import type { InjectionKey, Ref } from 'vue';

/** Provided by MainLayout, incremented to trigger simulation history dialog. */
export const openHistoryKey: InjectionKey<Ref<number>> = Symbol('openHistory');

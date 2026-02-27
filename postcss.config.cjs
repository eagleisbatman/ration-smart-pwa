/* eslint-env node */
// https://quasar.dev/options/rtl-support

module.exports = {
  plugins: [
    // https://github.com/elchininet/postcss-rtlcss
    // 'override' mode: keeps original LTR rules at their natural specificity,
    // adds [dir="rtl"] overrides only for RTL. The default 'combined' mode
    // wraps everything with [dir="ltr"]/[dir="rtl"] which boosts specificity
    // and breaks centering rules (.q-page > * margin-inline: auto) because
    // Quasar's q-gutter-* margin-left gets a higher specificity prefix.
    require('postcss-rtlcss')({ mode: 'override' }),
  ],
};

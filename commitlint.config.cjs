/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      ['core', 'shared', 'home', 'catalog', 'product', 'cart', 'checkout', 'auth', 'ci', 'deps'],
    ],
  },
};

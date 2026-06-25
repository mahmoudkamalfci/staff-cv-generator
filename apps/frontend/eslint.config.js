import { eslintConfig } from '@cv-generator/config';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  ...eslintConfig,
  {
    files: ['**/*.tsx', '**/*.ts'],
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

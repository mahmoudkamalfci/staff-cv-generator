import { eslintConfig } from '@cv-generator/config';
import reactHooks from 'eslint-plugin-react-hooks';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  ...eslintConfig,
  {
    files: ['**/*.tsx', '**/*.ts'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

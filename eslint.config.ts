import { sxzz } from '@sxzz/eslint-config'

export default sxzz().removeRules(
  'unicorn/prefer-array-find',
  'array-callback-return',
  '@typescript-eslint/no-require-imports',
)

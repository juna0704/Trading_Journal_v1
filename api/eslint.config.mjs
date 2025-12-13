import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
  // 1️⃣ Ignore generated & build files
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'src/generated/**',
      '*.config.js',
      '*.config.mjs',
    ],
  },

  // 2️⃣ Base JS rules
  js.configs.recommended,

  // 3️⃣ TypeScript rules
  ...tseslint.configs.recommended,

  // 4️⃣ Prettier config (disables conflicting rules)
  prettierConfig,

  // 5️⃣ Project-specific config
  {
    files: ['**/*.ts'],
    plugins: {
      prettier,
    },
    rules: {
      // Prettier handles formatting
      'prettier/prettier': 'error',

      // Your preferences
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]
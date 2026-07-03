module.exports = {
  root: true,
  extends: ['expo'],
  plugins: ['import'],
  overrides: [
    {
      files: ['src/features/**/*.{ts,tsx}'],
      excludedFiles: ['src/features/*/index.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['./index', '../index', '../../index'],
                message:
                  "Import sibling files inside this feature directly, not through this feature's own index.ts barrel. Barrels are for other features/screens to consume, not internal use.",
              },
            ],
          },
        ],
      },
    },
  ],
  rules: {
    'import/no-cycle': 'error',
  },
};

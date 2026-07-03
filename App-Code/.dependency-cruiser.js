module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies are not allowed in the codebase.',
      from: { path: '^src/' },
      to: { circular: true }
    },
    {
      name: 'app-imports-from-src-forbidden',
      severity: 'error',
      comment: 'Route leaf screens under app/ cannot be imported by files inside src/.',
      from: { path: '^src/' },
      to: { path: '^app/' }
    },
    {
      name: 'no-direct-cross-feature-imports',
      severity: 'error',
      comment: 'Imports between different features must go through the destination feature\'s index.ts barrel.',
      from: { path: '^src/features/([^/]+)/' },
      to: {
        path: '^src/features/([^/]+)/',
        pathNot: [
          '^src/features/$1/', // Siblings within the same feature can import each other directly
          '^src/features/[^/]+/index\\.(ts|tsx)$' // Cross-feature imports must use index.ts
        ]
      }
    },
    {
      name: 'ui-components-cannot-import-features',
      severity: 'error',
      comment: 'Dumb UI components under src/components/ui/ cannot import feature-specific code.',
      from: { path: '^src/components/ui/' },
      to: { path: '^src/features/' }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true
  }
};

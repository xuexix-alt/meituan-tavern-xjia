// Existing code above
  cache: {
    type: 'filesystem',
    cacheDirectory: 'node_modules/.webpack_cache',
    buildDependencies: {
      config: [ __filename ],
      packageJson: [ path.resolve(__dirname, 'package.json') ],
      pnpmLockfile: [ path.resolve(__dirname, 'pnpm-lock.yaml') ],
    },
  },
// Existing code below

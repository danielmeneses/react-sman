module.exports = {
  comments: false,
  presets: [
    [
      '@babel/preset-env',
      {
        shippedProposals: true,
        modules: 'commonjs',
        useBuiltIns: 'usage',
        targets: [">1%", "last 2 versions", "not ie <= 8"]
      }
    ]
  ],
  plugins: [
    'add-module-exports',
    [
      '@babel/transform-runtime',
      {
        polyfill: false,
        regenerator: false
      }
    ]
  ]
};

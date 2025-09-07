/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  appDirectory: 'app',
  ignoredRouteFiles: ['**/.*'],
  watchPaths: ['./public', './.env'],
  server:
    process.env.NODE_ENV === 'development' ? './server-dev.js' : './server.js',
  /**
   * The following settings are required to deploy Hydrogen apps to Oxygen:
   */
  publicPath: (process.env.HYDROGEN_ASSET_BASE_URL ?? '/') + 'build/',
  assetsBuildDirectory: 'dist/client/build',
  serverBuildPath: 'dist/worker/index.js',
  serverMainFields: ['browser', 'module', 'main'],
  serverConditions: ['worker', process.env.NODE_ENV],
  serverDependenciesToBundle: 'all',
  serverModuleFormat: 'esm',
  serverPlatform: 'neutral',
  serverMinify: process.env.NODE_ENV === 'production',
  postcss: true,
  tailwind: true,
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatpath: true,
    v3_throwAbortReason: true,
  },
  serverNodeBuiltinsPolyfill: {
    modules: {
      buffer: true, // Provide a JSPM polyfill
      fs: "empty", // Provide an empty polyfill
      crypto: true,
      zlib: true,
      stream: true,
      events: true,
      https: true,
      http: true,
      net: true,
      tls: true,
      url: true
    },
    globals: {
      Buffer: true,
    },
  }
};

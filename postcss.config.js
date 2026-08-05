/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [require('autoprefixer')({ remove: false }), require('@tailwindcss/postcss'), require('postcss-minify')],
};

module.exports = config;

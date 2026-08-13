/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [
    require('autoprefixer')({ remove: false }),
    require('@tailwindcss/postcss'),
    require('postcss-minify'),
    // sass 压缩输出遇非 ASCII 字符（如 ¥、Font Awesome 图标码点）时，会在 CSS 块开头输出 BOM。
    // 这些块被内联进同一个 <style> 后，BOM 会贴在首条规则选择器前使其失效（例如 .app-view 丢失
    // display:flex，导致套餐详情页不滚动、底部下单按钮被推出可视区），这里在 postcss 阶段剥离 BOM。
    {
      postcssPlugin: 'strip-bom',
      Once(root) {
        const input = root.source && root.source.input;
        if (input && input.hasBOM) {
          input.hasBOM = false;
        }
      },
    },
  ],
};

module.exports = config;

// PostCSS plugin to convert :root to :host for Shadow DOM compatibility
module.exports = () => {
  return {
    postcssPlugin: 'postcss-root-to-host',
    Rule(rule) {
      if (rule.selector === ':root') {
        rule.selector = ':host';
      }
    }
  };
};

module.exports.postcss = true;

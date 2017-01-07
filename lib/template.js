'use strict';

const regTplScript = /seajs\.use\(([^)]+)\)/;
const regTplStyle = /\{\{\s?StyleLink ([^}]+)\}\}/g;
const regTplComponent = /\{\{Component\s+(['"])([\w\-]+)\1/g;

module.exports = {
  parse: content => {
    const result = {
      scripts: [],
      styles: [],
      components: [],
    };

    // parse entry script
    const scripts = content.match(regTplScript);
    if (scripts) {
      result.scripts = scripts[1]
        .split(',')
        .map(s => s.trim().slice(1, -1))
        .map(s => (s.endsWith('.js') ? s : `${s}.js`));
    }

    // parse styles
    let styles = [];
    while (true) {
      const style = regTplStyle.exec(content);
      if (style) {
        const list = style[1].split(' ').map(item => item.slice(1, -1));
        styles = styles.concat(list);
      } else {
        break;
      }
    }
    result.styles = styles;

    // parse components
    const components = [];
    while (true) {
      const component = regTplComponent.exec(content);
      if (component) {
        components.push(component[2]);
      } else {
        break;
      }
    }
    result.components = components;

    return result;
  },
};

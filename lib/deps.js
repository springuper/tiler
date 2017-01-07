'use strict';

const fs = require('fs');
const path = require('path');
const VinylFile = require('vinyl');
const Transform = require('stream').Transform;
const debug = require('debug')('Tiler');
const cmdUtil = require('cmd-util');
const template = require('./template');
const util = require('./util');

const TYPE_SCRIPT = 'js';
const TYPE_STYLE = 'css';

class Deps extends Transform {
  constructor(opts) {
    super({ objectMode: true });

    this.opts = opts;
    this.visited = {};
    this.entries = [];
  }

  _transform(row, enc, next) {
    // process page resources
    const meta = this.parseTemplate(row.contents);

    let componentScripts = [];
    let componentStyles = [];
    if (meta.components.length) {
      componentScripts = this.findComponentScripts(meta.components);
      componentStyles = this.findComponentStyles(meta.components);
    }

    let scripts = meta.scripts;
    let styles = meta.styles;
    if (scripts.length) {
      scripts = scripts.map(script => this.resolveScript(script));
    }
    if (styles.length) {
      styles = styles.map(style => this.resolveStyle(style));
    }

    if (scripts.length || componentScripts.length) {
      // create a fake root script entry
      const scriptEntry = new VinylFile({
        cwd: row.cwd,
        base: row.base,
        path: this.createFakeEntry(row.path, TYPE_SCRIPT),
        contents: null,
      });
      scriptEntry.deps = [].concat(scripts, componentScripts);
      scriptEntry.entry = true;
      scriptEntry.view = row.path;
      debug('deps scriptEntry', scriptEntry);
      this.entries.push(scriptEntry);
    }
    if (styles.length || componentStyles.length) {
      // create a fake root style entry
      const styleEntry = new VinylFile({
        cwd: row.cwd,
        base: row.base,
        path: this.createFakeEntry(row.path, TYPE_STYLE),
        contents: null,
      });
      styleEntry.deps = [].concat(componentStyles, styles);
      styleEntry.entry = true;
      styleEntry.view = row.path;
      debug('deps style entry', styleEntry);
      this.entries.push(styleEntry);
    }

    next();
  }

  _flush() {
    const commonEntries = this.processCommon();
    this.entries = commonEntries.concat(this.entries);

    let pending = this.entries.length;
    this.entries.forEach(entry => {
      this.walk(entry, () => {
        if (--pending === 0) {
          this.push(null);
        }
      });
    });
  }

  processCommon() {
    const cwd = this.opts.cwd;
    const base = this.opts.base;
    const process = commons => commons.map(common => {
      let commonEntry;
      if (typeof common === 'string') {
        commonEntry = new VinylFile({
          cwd,
          base,
          path: common,
          contents: null,
        });
      } else {
        // virtual file
        commonEntry = new VinylFile({
          cwd,
          base,
          path: common.path,
          contents: util.concatContents(
            common.includes.map(file => new VinylFile({
              cwd,
              base,
              path: file,
              contents: fs.readFileSync(file),
            })),
            common.path
          ),
        });
        commonEntry.virtual = true;
        commonEntry.includes = common.includes;
      }
      return commonEntry;
    });

    const commonEntries = [];
    // first process commons
    if (this.opts.commons) {
      if (this.opts.commons.script) {
        process(this.opts.commons.script)
          .forEach(scriptEntry => commonEntries.push(scriptEntry));
      }
      if (this.opts.commons.style) {
        process(this.opts.commons.style)
          .forEach(styleEntry => commonEntries.push(styleEntry));
      }
    }

    return commonEntries;
  }

  walk(row, callback) {
    const self = this;
    if (self.visited[row.path]) {
      if (callback) {
        callback(null);
      }
      return;
    }
    self.visited[row.path] = row;

    const done = () => {
      self.push(row);
      if (callback) {
        callback(null);
      }
    };

    // FIXME find a better way to determine whether to read file content
    if (!row.contents && fs.existsSync(row.path)) {
      row.contents = fs.readFileSync(row.path);
    }
    if (util.isScript(row.path) && !row.deps) {
      row.deps = self.parseDeps(row);
    }

    debug('deps walk', { path: row.path, deps: row.deps });
    if (row.deps && row.deps.length) {
      let depsPending = row.deps.length;
      row.deps.forEach(dep => {
        if (self.visited[dep]) {
          if (--depsPending === 0) {
            done();
          }
          return;
        }

        const depFile = new VinylFile({
          cwd: row.cwd,
          base: row.base,
          path: dep,
          contents: undefined,
        });
        self.walk(depFile, () => {
          if (--depsPending === 0) {
            done();
          }
        });
      });
    } else {
      done();
    }
  }

  parseTemplate(contents) {
    return template.parse(contents.toString('utf8'));
  }

  findComponentScripts(components) {
    return components.map(component => {
      const scriptPath = `${this.opts.paths.componentsDir}/${component}/${component}.js`;
      if (fs.existsSync(scriptPath)) {
        return scriptPath;
      }
      return null;
    }).filter(Boolean);
  }

  findComponentStyles(components) {
    return components.map(component => {
      const stylePath = `${this.opts.paths.componentsDir}/${component}/${component}.css`;
      if (fs.existsSync(stylePath)) {
        return stylePath;
      }
      return null;
    }).filter(Boolean);
  }

  createFakeEntry(tpl, type) {
    if (type === TYPE_SCRIPT) {
      return tpl.replace(this.opts.paths.viewsDir, this.opts.paths.scriptsDir)
        .replace(/\.hbs$/, '-entry.js');
    }
    return tpl.replace(this.opts.paths.viewsDir, this.opts.paths.stylesDir)
      .replace(/\.hbs$/, '-entry.css');
  }

  resolveScript(script) {
    if (!util.isScript(script)) {
      script = `${script}.js`;
    }
    return script.replace(/^jsBasePath/, this.opts.paths.scriptsDir);
  }

  resolveStyle(style) {
    if (!util.isStyle(style)) {
      style = `${style}.css`;
    }
    return path.resolve(this.opts.paths.stylesDir, style);
  }

  parseDeps(row) {
    if (!util.isScript(row.path) || !row.contents) return [];

    const moduleInfos = cmdUtil.ast.parse(row.contents.toString('utf8'));
    if (!moduleInfos || moduleInfos.length === 0) {
      return [];
    }

    const deps = moduleInfos.reduce((result, moduleInfo) => {
      const moduleDeps = moduleInfo.dependencies.map(dep => this.resolveScript(dep));
      moduleDeps.forEach(dep => {
        if (result.indexOf(dep) === -1) {
          result.push(dep);
        }
      });
      return result;
    }, []);
    // convert virtual include module to virtual file
    this.entries.forEach(entry => {
      if (!util.isScript(entry.path) || !entry.virtual) return;

      entry.includes.forEach(include => {
        const index = deps.indexOf(include);
        if (index !== -1) {
          deps.splice(index, 1);
          if (deps.indexOf(entry.path) === -1) {
            deps.push(entry.path);
          }
        }
      });
    });

    return deps;
  }
}

module.exports = Deps;

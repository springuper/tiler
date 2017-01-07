'use strict';

const readonly = require('read-only-stream');
const splicer = require('labeled-stream-splicer');
const vfs = require('vinyl-fs');
const Transform = require('stream').Transform;
const EventEmitter = require('events');
const Deps = require('./lib/deps');
const topoSort = require('./lib/sort');
const cut = require('./lib/cut');
const pack = require('./lib/pack');
const append = require('./lib/append');
const debug = require('debug')('Tiler');

/**
 * Tiler, static reources bundler
 * @class
 */
class Tiler extends EventEmitter {
  /**
   * constructor
   * @method
   * @param opts
   * @param {String|[String]} opts.entries Entry view page list
   * @param {String} [cwd] Current workding directory, default is process.cwd()
   * @param {String} [base] base directory, used for output, same with vinyl-fs dest
   * @param {String} [opts.dest] Destination of bundled files, same with vinyl-fs dest
   * @param {Object} opts.paths Views/Components/Scripts directories
   */
  constructor(opts) {
    super();

    opts = opts || {};
    this.opts = opts;
    opts.cwd = opts.cwd || process.cwd();
    opts.entries = [].concat(opts.entries).filter(Boolean);

    this.pipeline = this._createPipeline(opts);
  }

  _createPipeline(opts) {
    this._deps = this._createDeps(opts);

    const pipeline = splicer.obj([
      'record', [this._recorder()],
      'deps', [this._deps],
      'sort', [this._sort()],
      'cut', [this._cut()],
      'emit', [this._emitDeps()],
      'pack', [this._pack()],
      'append', [this._append()],
      'write', [this._write()],
    ]);

    return pipeline;
  }

  _createDeps(opts) {
    return new Deps(Object.assign(
      {}, opts
    ));
  }

  _emitDeps() {
    const self = this;
    return new Transform({
      objectMode: true,
      transform(row, enc, next) {
        self.emit('dep', row);
        this.push(row);
        next();
      },
    });
  }

  _recorder() {
    const recorded = this._recorded = [];
    return new Transform({
      objectMode: true,
      transform(row, enc, next) {
        debug('recorder row', { path: row.path, base: row.base, cwd: row.cwd });
        recorded.push(row);
        next(null, row);
      },
    });
  }

  _sort() {
    const rows = [];
    return [
      new Transform({
        objectMode: true,
        transform(row, enc, next) {
          debug('sort row', { path: row.path, deps: row.deps });
          rows.push(row);
          next();
        },
        flush(next) {
          rows.sort((a, b) => (
            a.path < b.path ? -1 : 1
          )).forEach(row => {
            this.push(row);
          });
          next();
        },
      }),
      topoSort(),
    ];
  }

  _cut() {
    return cut({
      commons: this.opts.commons,
    });
  }

  _pack() {
    return pack();
  }

  _append() {
    return append();
  }


  _write() {
    if (this.opts.dest) {
      return vfs.dest(this.opts.dest);
    }
    return [];
  }

  /**
   * reset pipeline to start a new bundle process
   * @method
   */
  reset() {
    this.pipeline = this._createPipeline(this.opts);
    this._bundled = false;
    this.emit('reset');
  }

  /**
   * start to bundle static resources
   * @method
   */
  bundle() {
    if (this._bundled) {
      const recorded = this._recorded;
      this.reset();
      recorded.forEach(x => this.pipeline.write(x));
    }

    vfs.src(this.opts.entries, {
      cwd: this.opts.cwd,
      base: this.opts.base,
    }).pipe(this.pipeline);

    const output = readonly(this.pipeline);
    this.emit('bundle', output);
    this._bundled = true;

    return output;
  }
}

module.exports = Tiler;

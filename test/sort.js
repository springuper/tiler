'use strict';

const path = require('path');
const assert = require('assert');
const splicer = require('labeled-stream-splicer');
const sink = require('sink-transform');
const VinylFile = require('vinyl');
const topoSort = require('../lib/sort');
const FIXTURES_DIR = path.resolve(__dirname, './fixtures');

function getPath(file) {
  return path.resolve(FIXTURES_DIR, file);
}

describe('sort', () => {
  it('should topo sort all items', (done) => {
    const pipeline = splicer.obj(['sort', [topoSort()]]);
    pipeline.pipe(sink.obj((rows, next) => {
      const paths = rows.map(row => row.path);
      assert.deepEqual(paths, [
        getPath('js/lib/jsrender.js'),
        getPath('js/base/core.js'),
        getPath('js/base/component-hub.js'),
        getPath('js/order/immediate.js'),
        getPath('components/address-selector/address-selector.js'),
        getPath('js/order/immediate-entry.js'),
      ]);

      next();
      done();
    }));

    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('js/order/immediate-entry.js'),
      contents: null,
    }), {
      deps: [
        getPath('js/order/immediate.js'),
        getPath('components/address-selector/address-selector.js'),
      ],
    }));
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('js/order/immediate.js'),
      contents: null,
    }), {
      deps: [
        getPath('js/base/core.js'),
        getPath('js/base/component-hub.js'),
      ],
    }));
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('components/address-selector/address-selector.js'),
      contents: null,
    }), {
      deps: [],
    }));
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('js/base/component-hub.js'),
      contents: null,
    }), {
      deps: [
        getPath('js/base/core.js'),
        getPath('js/lib/jsrender.js'),
      ],
    }));
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('js/base/core.js'),
      contents: null,
    }), {
      deps: [
        getPath('js/lib/jsrender.js'),
      ],
    }));
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('js/lib/jsrender.js'),
      contents: null,
    }), {
      deps: [],
    }));
    pipeline.end();
  });
});

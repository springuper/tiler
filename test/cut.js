'use strict';

const path = require('path');
const assert = require('assert');
const splicer = require('labeled-stream-splicer');
const sink = require('sink-transform');
const VinylFile = require('vinyl');
const cut = require('../lib/cut');
const FIXTURES_DIR = path.resolve(__dirname, './fixtures');

function getPath(file) {
  return path.resolve(FIXTURES_DIR, file);
}

describe('cut', () => {
  it('should cut items to groups', (done) => {
    const pipeline = splicer.obj(['cut', [cut({
      commons: {
        script: [
          getPath('js/lib/jsrender.js'),
          getPath('js/base/core.js'),
        ],
        style: [
          getPath('css/base.css'),
        ],
      },
    })]]);
    pipeline.pipe(sink.obj((rows, next) => {
      const rowsMap = rows.reduce((map, row) => {
        map[row.path] = row;
        return map;
      }, {});

      assert.deepEqual(rowsMap[getPath('js/order/immediate-entry.js')].groups, [
        getPath('js/order/immediate-entry.js'),
      ]);
      assert.deepEqual(rowsMap[getPath('js/base/core.js')].groups, [
        getPath('js/base/core.js'),
      ]);
      assert.deepEqual(rowsMap[getPath('js/lib/jsrender.js')].groups, [
        getPath('js/lib/jsrender.js'),
      ]);
      assert.deepEqual(rowsMap[getPath('components/address-selector/address-selector.js')].groups, [
        getPath('js/order/immediate-entry.js'),
        getPath('js/order/booking-entry.js'),
      ]);

      assert.deepEqual(rowsMap[getPath('css/base.css')].groups, [
        getPath('css/base.css'),
      ]);
      assert.deepEqual(rowsMap[getPath('css/order.css')].groups, [
        getPath('css/order/immediate-entry.css'),
        getPath('css/order/booking-entry.css'),
      ]);
      assert.deepEqual(
        rowsMap[getPath('components/address-selector/address-selector.css')].groups,
        [
          getPath('css/order/immediate-entry.css'),
          getPath('css/order/booking-entry.css'),
        ]
      );

      next();
      done();
    }));

    // NOTE need to be topo sorted order
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('js/lib/jsrender.js'),
      contents: null,
    }), {
      deps: [],
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
      path: getPath('components/address-selector/address-selector.js'),
      contents: null,
    }), {
      deps: [],
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
      path: getPath('js/order/immediate-entry.js'),
      contents: null,
    }), {
      entry: true,
      view: getPath('views/order/immediate.hbs'),
      deps: [
        getPath('js/order/immediate.js'),
        getPath('components/address-selector/address-selector.js'),
      ],
    }));
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('js/order/booking-entry.js'),
      contents: null,
    }), {
      entry: true,
      view: getPath('views/order/booking.hbs'),
      deps: [
        getPath('components/address-selector/address-selector.js'),
      ],
    }));
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('css/base.css'),
      contents: null,
    }), {
      deps: [],
    }));
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('css/order.css'),
      contents: null,
    }), {
      deps: [],
    }));
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('components/address-selector/address-selector.css'),
      contents: null,
    }), {
      deps: [],
    }));
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('css/order/immediate-entry.css'),
      contents: null,
    }), {
      entry: true,
      view: getPath('views/order/immediate.hbs'),
      deps: [
        getPath('components/address-selector/address-selector.css'),
        getPath('css/order.css'),
      ],
    }));
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('css/order/booking-entry.css'),
      contents: null,
    }), {
      entry: true,
      view: getPath('views/order/booking.hbs'),
      deps: [
        getPath('components/address-selector/address-selector.css'),
        getPath('css/order.css'),
      ],
    }));
    pipeline.end();
  });
});

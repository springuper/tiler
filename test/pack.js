'use strict';

const path = require('path');
const assert = require('assert');
const splicer = require('labeled-stream-splicer');
const sink = require('sink-transform');
const VinylFile = require('vinyl');
const pack = require('../lib/pack');
const FIXTURES_DIR = path.resolve(__dirname, './fixtures');

function getPath(file) {
  return path.resolve(FIXTURES_DIR, file);
}

describe('pack', () => {
  it('should cut items to groups', (done) => {
    const pipeline = splicer.obj(['pack', [pack()]]);
    pipeline.pipe(sink.obj((rows, next) => {
      const rowsMap = rows.reduce((map, row) => {
        map[row.path] = row;
        return map;
      }, {});

      assert.equal(
        rowsMap[getPath('js/order/immediate-entry.js')].contents.toString('utf8'),
        Buffer.concat([
          new Buffer('js/base/component-hub.js'),
          new Buffer('\n'),
          new Buffer('js/order/immediate-entry.js'),
        ]).toString('utf8')
      );
      assert.equal(
        rowsMap[getPath('js/order/booking-entry.js')].contents.toString('utf8'),
        Buffer.concat([
          new Buffer('js/base/component-hub.js'),
          new Buffer('\n'),
          new Buffer('js/order/booking-entry.js'),
        ]).toString('utf8')
      );
      assert.equal(
        rowsMap[getPath('js/base/core.js')].contents.toString('utf8'),
        Buffer.concat([
          new Buffer('js/base/core.js'),
        ]).toString('utf8')
      );

      next();
      done();
    }));

    // NOTE need to be topo sorted order
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('js/lib/jsrender.js'),
      contents: new Buffer('js/lib/jsrender.js'),
    }), {
      groups: [
        getPath('js/lib/jsrender.js'),
      ],
    }));
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('js/base/core.js'),
      contents: new Buffer('js/base/core.js'),
    }), {
      groups: [
        getPath('js/base/core.js'),
      ],
    }));
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('js/base/component-hub.js'),
      contents: new Buffer('js/base/component-hub.js'),
    }), {
      groups: [
        getPath('js/order/booking-entry.js'),
        getPath('js/order/immediate-entry.js'),
      ],
    }));
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('js/order/immediate-entry.js'),
      contents: new Buffer('js/order/immediate-entry.js'),
    }), {
      groups: [
        getPath('js/order/immediate-entry.js'),
      ],
    }));
    pipeline.write(Object.assign(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: getPath('js/order/booking-entry.js'),
      contents: new Buffer('js/order/booking-entry.js'),
    }), {
      groups: [
        getPath('js/order/booking-entry.js'),
      ],
    }));
    pipeline.end();
  });
});

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const splicer = require('labeled-stream-splicer');
const sink = require('sink-transform');
const VinylFile = require('vinyl');
const Deps = require('../lib/deps');
const FIXTURES_DIR = path.resolve(__dirname, './fixtures');

function getFixturePath(file) {
  return path.resolve(FIXTURES_DIR, file);
}

describe('deps', () => {
  it('should find out all dependent resources from entry view', done => {
    const deps = new Deps({
      paths: {
        componentsDir: getFixturePath('components'),
        viewsDir: getFixturePath('views'),
        scriptsDir: getFixturePath('js'),
        stylesDir: getFixturePath('css'),
        imagesDir: getFixturePath('img'),
      },
    });
    const pipeline = splicer.obj(['deps', [deps]]);
    pipeline.pipe(sink.obj((rows, next) => {
      let fakeEntryRow = rows.filter(row => row.path.endsWith('js/order/immediate-entry.js'));
      assert(fakeEntryRow.length);

      fakeEntryRow = fakeEntryRow[0];
      assert.deepEqual(fakeEntryRow.deps, [
        getFixturePath('js/order/immediate.js'),
        getFixturePath('components/address-selector/address-selector.js'),
      ]);

      const paths = rows.map(row => row.path);
      assert.deepEqual(paths, [
        getFixturePath('js/lib/jsrender.js'),
        getFixturePath('js/base/core.js'),
        getFixturePath('js/base/down-reload.js'),
        getFixturePath('js/base/component-hub.js'),
        getFixturePath('js/order/immediate.js'),
        getFixturePath('components/address-selector/address-selector.js'),
        getFixturePath('js/order/immediate-entry.js'),
        getFixturePath('components/address-selector/address-selector.css'),
        getFixturePath('css/order.css'),
        getFixturePath('css/util/dialog.css'),
        getFixturePath('css/order/immediate-entry.css'),
      ]);

      next();
      done();
    }));

    const file = path.resolve(FIXTURES_DIR, 'views/order/immediate.hbs');
    pipeline.write(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: file,
      contents: fs.readFileSync(file),
    }));
    pipeline.end();
  });

  it('should process simple concat virtual file', done => {
    const deps = new Deps({
      commons: {
        script: [
          getFixturePath('js/base/core.js'),
          {
            path: getFixturePath('js/lib/seajs-all.js'),
            includes: [
              getFixturePath('js/lib/seajs.js'),
              getFixturePath('js/lib/seajs-css.js'),
            ],
          },
        ],
      },
      paths: {
        componentsDir: getFixturePath('components'),
        viewsDir: getFixturePath('views'),
        scriptsDir: getFixturePath('js'),
        stylesDir: getFixturePath('css'),
        imagesDir: getFixturePath('img'),
      },
    });
    const pipeline = splicer.obj(['deps', [deps]]);
    pipeline.pipe(sink.obj((rows, next) => {
      const virtualRows = rows.filter(row => row.virtual);
      assert.equal(virtualRows.length, 1);
      assert.equal(virtualRows[0].path, getFixturePath('js/lib/seajs-all.js'));
      assert.equal(
        virtualRows[0].contents.toString('utf8'),
        'window.seajs = {};\n\nseajs.css = {};\n'
      );
      assert.deepEqual(virtualRows[0].deps, []);

      next();
      done();
    }));

    const file = path.resolve(FIXTURES_DIR, 'views/order/immediate.hbs');
    pipeline.write(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: file,
      contents: fs.readFileSync(file),
    }));
    pipeline.end();
  });

  it('should process virtual file with deps', done => {
    const deps = new Deps({
      commons: {
        script: [
          {
            path: getFixturePath('js/base/seed.js'),
            includes: [
              getFixturePath('js/lib/seajs.js'),
              getFixturePath('js/lib/seajs-css.js'),
              getFixturePath('js/base/core.js'),
            ],
          },
        ],
      },
      paths: {
        componentsDir: getFixturePath('components'),
        viewsDir: getFixturePath('views'),
        scriptsDir: getFixturePath('js'),
        stylesDir: getFixturePath('css'),
        imagesDir: getFixturePath('img'),
      },
    });
    const pipeline = splicer.obj(['deps', [deps]]);
    pipeline.pipe(sink.obj((rows, next) => {
      const virtualRows = rows.filter(row => row.virtual);
      assert.equal(virtualRows.length, 1);
      assert.equal(virtualRows[0].path, getFixturePath('js/base/seed.js'));
      assert.deepEqual(virtualRows[0].deps, [
        getFixturePath('js/lib/jsrender.js'),
      ]);

      next();
      done();
    }));

    const file = path.resolve(FIXTURES_DIR, 'views/order/immediate.hbs');
    pipeline.write(new VinylFile({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      path: file,
      contents: fs.readFileSync(file),
    }));
    pipeline.end();
  });
});

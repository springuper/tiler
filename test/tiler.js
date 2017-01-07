'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const exec = require('child_process').exec;
const vfs = require('vinyl-fs');
const Tiler = require('..');
const FIXTURES_DIR = path.resolve(__dirname, './fixtures');
const BUILD_DIR = path.resolve(__dirname, '../build');
const EXPECTIONS_DIR = path.resolve(__dirname, './expections');

function clearBuild(done) {
  exec(`rm -rf ${BUILD_DIR}`, done);
}
function getFixturePath(file) {
  return path.resolve(FIXTURES_DIR, file);
}
function getBuildPath(file) {
  return path.resolve(BUILD_DIR, file);
}
function getExpectionPath(file) {
  return path.resolve(EXPECTIONS_DIR, file);
}

describe('Tiler', () => {
  afterEach(done => {
    clearBuild(done);
  });

  it('should bundle files properly', done => {
    const commons = {
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
      style: [
        getFixturePath('css/base.css'),
      ],
    };
    const tiler = new Tiler({
      cwd: FIXTURES_DIR,
      base: FIXTURES_DIR,
      entries: ['views/**/*.hbs'],
      commons,
      paths: {
        componentsDir: getFixturePath('components'),
        viewsDir: getFixturePath('views'),
        scriptsDir: getFixturePath('js'),
        stylesDir: getFixturePath('css'),
        imagesDir: getFixturePath('img'),
      },
    });
    const viewMap = {};
    tiler.on('dep', row => {
      if (row.view) {
        viewMap[row.view] = {
          scripts: commons.script.map(script => script.path || script).concat(row.path),
        };
      }
    });
    tiler.pipeline.on('end', () => {
      assert.deepEqual(viewMap[getFixturePath('views/order/immediate.hbs')], {
        scripts: [
          getFixturePath('js/base/seed.js'),
          getFixturePath('js/order/immediate-entry.js'),
        ],
      });
      assert.deepEqual(viewMap[getFixturePath('views/order/booking.hbs')], {
        scripts: [
          getFixturePath('js/base/seed.js'),
          getFixturePath('js/order/booking-entry.js'),
        ],
      });

      // NOTE wait a little period to ensure all contents writed in files
      setTimeout(() => {
        assert.equal(
          fs.readFileSync(getExpectionPath('js/base/seed.js'), { encoding: 'utf8' }),
          fs.readFileSync(getBuildPath('js/base/seed.js'), { encoding: 'utf8' })
        );
        assert.equal(
          fs.readFileSync(getExpectionPath('js/order/immediate-entry.js'), { encoding: 'utf8' }),
          fs.readFileSync(getBuildPath('js/order/immediate-entry.js'), { encoding: 'utf8' })
        );
        assert.equal(
          fs.readFileSync(getExpectionPath('js/order/booking-entry.js'), { encoding: 'utf8' }),
          fs.readFileSync(getBuildPath('js/order/booking-entry.js'), { encoding: 'utf8' })
        );

        assert.equal(
          fs.readFileSync(getExpectionPath('css/order/booking-entry.css'), { encoding: 'utf8' }),
          fs.readFileSync(getBuildPath('css/order/booking-entry.css'), { encoding: 'utf8' })
        );
        assert.equal(
          fs.readFileSync(getExpectionPath('css/order/immediate-entry.css'), { encoding: 'utf8' }),
          fs.readFileSync(getBuildPath('css/order/immediate-entry.css'), { encoding: 'utf8' })
        );

        assert(fs.existsSync(getExpectionPath('img/fav_star.png')));
        assert(fs.existsSync(getExpectionPath('img/index_ucar_logo.png')));

        done();
      }, 500);
    });
    tiler.bundle().pipe(vfs.dest(BUILD_DIR));
  });
});

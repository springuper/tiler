# Tiler

[![Build Status](https://travis-ci.org/springuper/tiler.svg?branch=master)](https://travis-ci.org/springuper/tiler)

![tiler](./logo.jpg)

Pack up static resources.

## Install

```
npm install u-tiler
```

## Usage

```js
const path = require('path');
const Tiler = require('tiler');
const CLIENT_DIR = path.resolve(__dirname, 'client');
const BUILD_DIR = path.resolve(__dirname, 'static');

// create instance
const tiler = new Tiler({
  cwd: CLIENT_DIR,
  base: CLIENT_DIR,
  entries: ['views/**/*.hbs'],
  commons: {
    script: [
      // virtual file
      {
        path: path.resolve(CLIENT_DIR, 'js/base/seed.js'),
        includes: [
          path.resolve(CLIENT_DIR, 'js/lib/seajs.js'),
          path.resolve(CLIENT_DIR, 'js/lib/seajs-css.js'),
          path.resolve(CLIENT_DIR, 'js/lib/zepto.js'),
        ],
      },
      path.resolve(CLIENT_DIR, 'js/base/core.js'),
    ],
    style: [
      path.resolve(CLIENT_DIR, 'css/base.css'),
    ],
  },
  dest: BUILD_DIR,
  paths: {
    componentsDir: path.resolve(CLIENT_DIR, 'components'),
    viewsDir: path.resolve(CLIENT_DIR, 'views'),
    scriptsDir: path.resolve(CLIENT_DIR, 'js'),
    stylesDir: path.resolve(CLIENT_DIR, 'css'),
    imagesDir: path.resolve(CLIENT_DIR, 'img'),
  },
});

// listen `dep` event to update view resource map
const viewMap = {};
tiler.on('dep', row => {
  if (row.view) {
    viewMap[row.view] = {
      scripts: commons.concat(row.path),
    };
  }
});

// start to bundle
tiler.bundle();
```

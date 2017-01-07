'use strict';

const fs = require('fs');
const path = require('path');
const Transform = require('stream').Transform;
const VinylFile = require('vinyl');
const debug = require('debug')('Tiler');
const util = require('./util');
const stripBomBuf = require('strip-bom-buf');
const URLRewriter = require('cssurl').URLRewriter;

module.exports = () => {
  const stream = new Transform({ objectMode: true });

  stream._transform = function (row, enc, next) {
    if (!util.isStyle(row.path) || !row.contents) {
      next(null, row);
      return;
    }

    const self = this;
    const rewriter = new URLRewriter(url => {
      if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0 || url.indexOf('data:') === 0) return url;

      const filepath = path.resolve(path.dirname(row.path), url);
      debug('append assets', { path: filepath, sourcefile: row.path });
      self.push(new VinylFile({
        cwd: row.cwd,
        base: row.base,
        path: filepath,
        contents: stripBomBuf(fs.readFileSync(filepath)),
      }));

      return url;
    });
    row.contents = new Buffer(rewriter.rewrite(row.contents.toString('utf8')));

    next(null, row);
  };

  return stream;
};

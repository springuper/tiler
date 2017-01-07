'use strict';

const path = require('path');
const URLRewriter = require('cssurl').URLRewriter;

module.exports = {
  isScript(file) {
    return file.endsWith('.js');
  },
  isStyle(file) {
    return file.endsWith('.css');
  },
  concatContents(files, destfile) {
    const contents = [];

    const buffers = files.map(file => {
      if (!file.contents) return null;
      if (!module.exports.isStyle(file.path)) return file.contents;

      // rewrite css url
      const rewriter = new URLRewriter(url => {
        if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) return url;
        return path.relative(
          path.dirname(destfile),
          path.resolve(path.dirname(file.path), url)
        );
      });
      return new Buffer(rewriter.rewrite(file.contents.toString('utf8')));
    });

    buffers.filter(Boolean).forEach(buf => {
      contents.push(buf);
      contents.push(new Buffer('\n'));
    });
    contents.pop();

    return Buffer.concat(contents);
  },
};

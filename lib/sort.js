'use strict';

const Transform = require('stream').Transform;

module.exports = () => {
  const rowMap = Object.create(null);
  const stream = new Transform({ objectMode: true });

  function visit(path) {
    const row = rowMap[path];
    if (!row) return;

    delete rowMap[path];

    Object.keys(row.deps || {})
      .map(index => row.deps[index])
      .forEach(visit);
    stream.push(row);
  }

  stream._transform = (row, enc, next) => {
    rowMap[row.path] = row;
    next();
  };
  stream._flush = next => {
    Object.keys(rowMap).forEach(visit);
    next();
  };

  return stream;
};

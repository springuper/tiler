'use strict';

const Transform = require('stream').Transform;
const VinylFile = require('vinyl');
const debug = require('debug')('Tiler');
const util = require('./util');

module.exports = () => {
  const rowMap = Object.create(null);
  const stream = new Transform({ objectMode: true });

  stream._transform = (row, enc, next) => {
    debug('pack row', { path: row.path, groups: row.groups });
    (row.groups || []).forEach(group => {
      rowMap[group] = rowMap[group] || [];
      rowMap[group].push(row);
    });
    next();
  };
  stream._flush = next => {
    Object.keys(rowMap).forEach(group => {
      const rows = rowMap[group];
      if (rows.length <= 0) return;

      const entryRow = rows.filter(row => row.path === group)[0];
      stream.push(new VinylFile({
        cwd: entryRow.cwd,
        base: entryRow.base,
        path: group,
        contents: util.concatContents(rows, group),
      }));
    });
    next();
  };

  return stream;
};

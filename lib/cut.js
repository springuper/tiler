'use strict';

const Transform = require('stream').Transform;
const debug = require('debug')('Tiler');

module.exports = (opts) => {
  const rowMap = Object.create(null);
  const stream = new Transform({ objectMode: true });
  const commons = opts.commons || {};

  function mark(row, group) {
    debug('cut mark', { path: row.path, group });
    row.groups = row.groups || [];
    if (row.groups.indexOf(group) !== -1) return;

    let coms = row.path.endsWith('.js') ? commons.script : commons.style;
    coms = coms.map(com => com.path || com);
    let baseCommons;
    if (coms.indexOf(group) === -1) {
      baseCommons = coms;
    } else {
      baseCommons = coms.slice(0, coms.indexOf(group));
    }
    const hasBaseCommon = row.groups.some(g => baseCommons.indexOf(g) !== -1);
    // item has been marked by base common group, so skip
    if (hasBaseCommon) return;

    // mark current item
    row.groups.push(group);
    // mark deps
    Object.keys(row.deps || {})
      .map(dep => rowMap[row.deps[dep]])
      .forEach(depRow => mark(depRow, group));
  }

  function visit(path) {
    const row = rowMap[path];
    let coms = row.path.endsWith('.js') ? commons.script : commons.style;
    coms = coms.map(com => com.path || com);
    if (row.entry || coms.indexOf(path) !== -1) {
      mark(row, path);
    }
  }

  stream._transform = (row, enc, next) => {
    rowMap[row.path] = row;
    next();
  };
  stream._flush = next => {
    Object.keys(rowMap).forEach(visit);
    Object.keys(rowMap)
      .map(path => rowMap[path])
      .forEach(stream.push.bind(stream));
    next();
  };

  return stream;
};

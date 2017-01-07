'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const template = require('../lib/template');
const FIXTURES_DIR = path.resolve(__dirname, './fixtures');

describe('template', () => {
  describe('#parse', () => {
    it('should parse entry script and components', () => {
      const content = fs.readFileSync(
        `${FIXTURES_DIR}/views/order/immediate.hbs`,
        { encoding: 'utf8' }
      );
      assert.deepEqual(template.parse(content), {
        scripts: [
          'jsBasePath/order/immediate.js',
        ],
        styles: [
          'order.css',
          'util/dialog.css',
        ],
        components: [
          'address-selector',
        ],
      });
    });
  });
});

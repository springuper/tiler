define('componentsBasePath/address-selector/address-selector', function () {
  module.exports = function () {};
});

define('jsBasePath/base/component-hub', function (require, exports) {
  require('jsBasePath/base/core');
  exports.init = function () {};
});

define('jsBasePath/base/downReload', function (require, exports) {
  exports.init = function () {};
});

define('jsBasePath/order/immediate', function (require) {
  require('jsBasePath/base/core');
  var downReload = require('jsBasePath/base/down-reload');
  var ComponentHub = require('jsBasePath/base/component-hub');
  var addressSelectorComponent = ComponentHub.getComponentsByName('address-selector');

  downReload.init();
  addressSelectorComponent.init();
});

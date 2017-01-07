define('componentsBasePath/address-selector/address-selector', function () {
  module.exports = function () {};
});

define('jsBasePath/base/component-hub', function (require, exports) {
  require('jsBasePath/base/core');
  exports.init = function () {};
});

define('jsBasePath/base/slider', function (require, exports) {
  require('jsBasePath/base/core');
  exports.init = function () {};
});

define('jsBasePath/order/booking', function (require) {
  require('jsBasePath/base/core');
  var slider = require('jsBasePath/base/slider');
  var ComponentHub = require('jsBasePath/base/component-hub');
  var addressSelectorComponent = ComponentHub.getComponentsByName('address-selector');

  slider.init();
  addressSelectorComponent.init();
});

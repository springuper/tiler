define('jsBasePath/order/booking', function (require) {
  require('jsBasePath/base/core');
  var slider = require('jsBasePath/base/slider');
  var ComponentHub = require('jsBasePath/base/component-hub');
  var addressSelectorComponent = ComponentHub.getComponentsByName('address-selector');

  slider.init();
  addressSelectorComponent.init();
});

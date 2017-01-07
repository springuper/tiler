define('jsBasePath/order/immediate', function (require) {
  require('jsBasePath/base/core');
  var downReload = require('jsBasePath/base/down-reload');
  var ComponentHub = require('jsBasePath/base/component-hub');
  var addressSelectorComponent = ComponentHub.getComponentsByName('address-selector');

  downReload.init();
  addressSelectorComponent.init();
});

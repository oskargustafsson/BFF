(function () {
  'use strict';

  var items = listConstructorFactory({
    completedItems: {
      type: 'number',
      getter: function () {
        this.reduce(function (count, item) {
          return count + (item.completed ? 1 : 0);
        }, 0);
      },
      dependencies: [ 'length' ],
      itemDependencies: [ 'completed' ],
    },
  });

})();

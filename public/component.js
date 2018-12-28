(function(angular) {
  'use strict';
  angular.module('betApp').component('hockeyLeaguePredictions', {
    templateUrl: 'hockeyPredictions.html',
    bindings: {
      country: '='
    }
  });
})(window.angular);

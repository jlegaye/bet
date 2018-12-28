(function(angular) {
  'use strict';

  function BasketBallLeagueDetailController($scope, $http, $parse) {
    var ctrl = this;
    ctrl.isLoading = false
    ctrl.getBasketBallPredictions = function(variable, url, under_check, iteration_check) {
      ctrl.isLoading = true
      $http.get('/api/basketBallPredictions', {
          timeout: 1000000,
          params: {
            url: url,
            under_check: under_check,
            iteration_check: iteration_check
          }
        })
        .then(function(response) {
          let currentBetsEventNames = $scope.$parent.$parent.$parent.ctrl.currentSimpleBetsEventNames
          let res = response.data;
          res.events = res.events.map(event => {
            if (currentBetsEventNames.some(couple => {
                let home = event.nextEvent.home.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '').toLowerCase()
                let away = event.nextEvent.away.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '').toLowerCase()
                let homeTest = home.includes(couple[0]) || couple[0].includes(home) || home.includes(couple[1]) || couple[1].includes(home)
                let awayTest = away.includes(couple[0]) || couple[0].includes(away) || away.includes(couple[1]) || couple[1].includes(away)
                let finalTest = homeTest && awayTest
                return finalTest
              })) {
              event.alreadyBet = true
            } else {
              event.alreadyBet = false
            }
            return event
          })
          ctrl.predictions = res;
          ctrl.isLoading = false
        })
        .catch(function(data) {
          console.log('Error: ' + data);
          ctrl.isLoading = false
        });
    };
  }

  angular.module('betApp').component('basketBallLeagueDetail', {
    templateUrl: 'basketball/basketballLeagueDetail.html',
    controller: BasketBallLeagueDetailController,
    bindings: {
      league: '<'
    }
  });
})(window.angular);

(function(angular) {
  'use strict';

  function BasketBallList($scope, $element, $attrs) {
    var ctrl = this;

    // This would be loaded by $http etc.
    ctrl.list = [{
        countryName: 'FRANCE LNB',
        under_check: '161',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/basketball/france/lnb/'
      },
	  {
        countryName: 'ESPAGNE ACB',
        under_check: '168',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/basketball/spain/acb/'
      },
	  {
        countryName: 'ITALIE Lega A',
        under_check: '165',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/basketball/italy/lega-a/'
      },
	  {
        countryName: 'USA NBA',
        under_check: '165',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/basketball/usa/nba/'
      }

    ];
  }

  angular.module('betApp').component('basketBallLeagueList', {
    templateUrl: 'basketball/basketballLeagueList.html',
    controller: BasketBallList
  });
})(window.angular);

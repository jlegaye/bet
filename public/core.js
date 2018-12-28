(function(angular) {
  'use strict';
  angular.module('betApp', ['nvd3', 'ngTable', 'jsonFormatter', 'angular.filter','ngMaterial', 'ngMessages'])

  angular.module("betApp").filter("filterEventName", filterEventName)
  angular.module("betApp").filter("filterBetDesc", filterBetDesc)
  angular.module("betApp").filter("filterBetTechnique", filterBetTechnique)
  angular.module("betApp").filter("filterBetSport", filterBetSport)
  angular.module("betApp").filter("filterBetType", filterBetType)
  angular.module("betApp").filter("filterBetStatus", filterBetStatus)

  function filterEventName() {
    return function(bets, substring) {
      if ((typeof substring === "undefined") || (substring == ""))
        return bets;
      else if (typeof substring !== "undefined") {
        return bets.filter(bet => bet.events.some(e => e.eventName.toLowerCase().includes(substring.toLowerCase())))
      }
    }
  }

  function filterBetDesc() {
    return (bets, betDescCheckboxes) => {
      let trueCheckboxLabels = betDescCheckboxes.filter(checkbox => checkbox.model === true).map(checkbox => checkbox.label)
      if (trueCheckboxLabels.length > 0) {
        return bets.filter(bet => bet.events.some(e => trueCheckboxLabels.includes(e.betDesc)))
      } else {
        return bets;
      }
    }
  }

  function filterBetTechnique() {
    return (bets, betTechniqueCheckboxes) => {
      let trueCheckboxLabels = betTechniqueCheckboxes.filter(checkbox => checkbox.model === true).map(checkbox => checkbox.label)
      if (trueCheckboxLabels.length > 0) {
        return bets.filter(bet => bet.events.some(e => trueCheckboxLabels.includes(e.betTechnique)))
      } else {
        return bets;
      }
    }
  }

  function filterBetSport() {
    return (bets, betSportCheckboxes) => {
      let trueCheckboxLabels = betSportCheckboxes.filter(checkbox => checkbox.model === true).map(checkbox => checkbox.label)
      if (trueCheckboxLabels.length > 0) {
        return bets.filter(bet => bet.events.some(e => trueCheckboxLabels.includes(e.sport)))
      } else {
        return bets;
      }
    }
  }

  function filterBetType() {
    return (bets, betTypeCheckboxes) => {
      let trueCheckboxLabels = betTypeCheckboxes.filter(checkbox => checkbox.model === true).map(checkbox => checkbox.label)
      if (trueCheckboxLabels.length > 0) {
        return bets.filter(bet => trueCheckboxLabels.includes(bet.type))
      } else {
        return bets;
      }
    }
  }

  function filterBetStatus() {
    return (bets, betStatusCheckboxes) => {
      let trueCheckboxLabels = betStatusCheckboxes.filter(checkbox => checkbox.model === true).map(checkbox => checkbox.label)
      if (trueCheckboxLabels.length > 0) {
        return bets.filter(bet => trueCheckboxLabels.includes(bet.status))
      } else {
        return bets;
      }
    }
  }

  angular.module("betApp").config(setConfigPhaseSettings);

  setConfigPhaseSettings.$inject = ["ngTableFilterConfigProvider"];

  function setConfigPhaseSettings(ngTableFilterConfigProvider) {
    var filterAliasUrls = {
      "top-countries": "path/to/your/filters/top-countries.html",
      // note: ngTable also registers a 'number' filter
      // we're overriding this alias to point to our custom template
      "number": "path/to/your/filters/number.html"
    };
    ngTableFilterConfigProvider.setConfig({
      aliasUrls: filterAliasUrls
    });

    // optionally set a default url to resolve alias names that have not been explicitly registered
    // if you don't set one, then 'ng-table/filters/' will be used by default
    ngTableFilterConfigProvider.setConfig({
      defaultBaseUrl: "ng-table/filters/"
    });

  }


  angular.module("betApp").controller("MainCtrl", MainCtrl);

  MainCtrl.$inject = ["$scope", "$filter", "$parse", "$http", "NgTableParams"];

  function MainCtrl($scope, $filter, $parse, $http, NgTableParams) {

    var ctrl = this;

    ctrl.nextTechniqueBetsToDoDateFilter = new Date('10 01 2018')
    ctrl.nextTechniqueBetsToDoMinDateFilter = new Date('09 01 2018')
    ctrl.nextTechniqueBetsToDoMaxDateFilter = new Date()

    $scope.formData = {};

    $scope.loading = false;


    var self = this;

    ctrl.tableParams = undefined;
    $scope.$watch("ctrl.eventNameFilter", function(newvalue, oldvalue) {
      ctrl.refreshAll()
    });

    $scope.$watch("ctrl.betDescs", function(newvalue, oldvalue) {
      ctrl.refreshAll()
    }, true);

    $scope.$watch("ctrl.betTechniques", function(newvalue, oldvalue) {
      ctrl.refreshAll()
    }, true);

    $scope.$watch("ctrl.betSports", function(newvalue, oldvalue) {
      ctrl.refreshAll()
    }, true);

    $scope.$watch("ctrl.betTypes", function(newvalue, oldvalue) {
      ctrl.refreshAll()
    }, true);

    $scope.$watch("ctrl.betStatus", function(newvalue, oldvalue) {
      ctrl.refreshAll()
    }, true);

    ctrl.refreshAll = function() {
      if (typeof ctrl.tableParams !== "undefined") {
        ctrl.tableParams.page(1)
        ctrl.tableParams.reload()
        ctrl.refreshChartData()
        ctrl.refreshStats()
      }
    }

    ctrl.refreshStats = function() {
      let data = ctrl.winamaxBetsBeforeCum;
      data = $filter('filterEventName')(data, ctrl.eventNameFilter);
      data = $filter('filterBetDesc')(data, ctrl.betDescs);
      data = $filter('filterBetTechnique')(data, ctrl.betTechniques);
      data = $filter('filterBetSport')(data, ctrl.betSports);
      data = $filter('filterBetType')(data, ctrl.betTypes);
      data = $filter('filterBetStatus')(data, ctrl.betStatus);
      data.sort(olderFirst);
      data = data.map(cumulator(data))
      ctrl.nbTotalBets = data.length
      ctrl.nbCurrentBets = data.filter((bet) => bet.status.includes('EN COURS')).length
      ctrl.nbWonBets = data.filter((bet) => bet.status.includes('GAGN')).length
      ctrl.nbLostBets = data.filter((bet) => bet.status.includes('PERDU')).length
      ctrl.finishedBets = ctrl.nbWonBets + ctrl.nbLostBets
      ctrl.benefit = data[data.length - 1].cumRes
      ctrl.totalStake = ctrl.around(data.reduce((a, b) => +a + +b.mise, 0))
      ctrl.totalFinishedStake = ctrl.around(data.filter((bet) => bet.status.includes('GAGN') || bet.status.includes('PERDU')).reduce((a, b) => +a + +b.mise, 0))
      ctrl.averageStake = ctrl.around(ctrl.totalStake / ctrl.nbTotalBets)
      ctrl.averageOdds = ctrl.around((data.reduce((a, b) => +a + +b.odds, 0)) / ctrl.nbTotalBets)
      ctrl.roi = ctrl.around(ctrl.benefit / ctrl.totalFinishedStake * 100)
      ctrl.currentStake = ctrl.around(data.filter((bet) => bet.status.includes('EN COURS')).reduce((a, b) => +a + +b.mise, 0))
      ctrl.successPercentage = ctrl.around((ctrl.nbWonBets / ctrl.finishedBets) * 100)
    }

    ctrl.around = function(value) {
      return Math.round(value * 100) / 100
    }

    ctrl.currentSimpleBetsEventNames = []
    ctrl.winamaxBets = []
    ctrl.winamaxBetsBeforeCum = []
    /*
        ctrl.getBets = function() {
          let jsonData = require('./cache.json');

          console.log(jsonData);
        }*/

    ctrl.getBets = function() {
      ctrl.loading = true;
      $http.get('/api/winamaxBets')
        .then(function(response) {
          let res = response.data;
          let dedupRes = Array.from(res.reduce((m, t) => m.set(t.id, t), new Map()).values());
          ctrl.winamaxBetsBeforeCum = dedupRes
          let currentBets = ctrl.winamaxBetsBeforeCum.filter(bet => bet.status.includes('EN COURS') && bet.type.includes('SIMPLE'))
          ctrl.currentSimpleBetsEventNames = currentBets.map(bet => {
            let homeStr = bet.events[0].eventHome.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '').toLowerCase()
            let awayStr = bet.events[0].eventAway.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '').toLowerCase()
            return [homeStr, awayStr]
          })
          let uniqueBetDescs = [].concat.apply([], dedupRes.map(bet => bet.events.map(event => event.betDesc))).filter(onlyUnique)
          ctrl.betDescs = uniqueBetDescs.filter(betDesc => betDesc.includes('Match nul') || (betDesc.includes('Nombre de buts') && betDesc.includes('Moins de')) || (betDesc.includes('Nombre de points') && betDesc.includes('Moins de')) || betDesc.includes('2-3 buts')).map(betDesc => {
            return {
              model: false,
              label: betDesc
            }
          });
          let uniqueBetTechniques = [].concat.apply([], dedupRes.map(bet => bet.events.map(event => event.betTechnique))).filter(onlyUnique)
          ctrl.betTechniques = uniqueBetTechniques.filter(betTechnique => betTechnique !== '').map(betTechnique => {
            return {
              model: false,
              label: betTechnique
            }
          });
          let uniqueBetSports = [].concat.apply([], dedupRes.map(bet => bet.events.map(event => event.sport))).filter(onlyUnique)
          ctrl.betSports = uniqueBetSports.map(betSport => {
            return {
              model: false,
              label: betSport
            }
          });
          ctrl.betTypes = dedupRes.map(bet => bet.type).filter(onlyUnique).map(betType => {
            return {
              model: false,
              label: betType
            }
          });
          ctrl.betStatus = dedupRes.map(bet => bet.status).filter(onlyUnique).map(betStatus => {
            return {
              model: false,
              label: betStatus
            }
          });

          // ctrl.betStatus.push({model : false, label : 'TERMINE'})
          ctrl.calculateNextTechniquesBetsToDo()

          ctrl.tableParams = new NgTableParams({
            page: 1,
            count: 5
          }, {
            getData: getData
          });

          function getData(params) {
            var orderedData = params.sorting() ?
              $filter('orderBy')(ctrl.winamaxBetsBeforeCum, params.orderBy()) :
              data;
            // orderedData = $filter('filterFailed')(orderedData, $scope.showOnlyFailed);
            orderedData = $filter('filterEventName')(orderedData, ctrl.eventNameFilter);
            orderedData = $filter('filterBetDesc')(orderedData, ctrl.betDescs);
            orderedData = $filter('filterBetTechnique')(orderedData, ctrl.betTechniques);
            orderedData = $filter('filterBetSport')(orderedData, ctrl.betSports);
            orderedData = $filter('filterBetType')(orderedData, ctrl.betTypes);
            orderedData = $filter('filterBetStatus')(orderedData, ctrl.betStatus);
            orderedData.sort(olderFirst);
            orderedData = orderedData.map(cumulator(orderedData))
            orderedData.sort(newerFirst);
            params.total(orderedData.length);

            return orderedData.slice((params.page() - 1) * params.count(),
              params.page() * params.count());
          }

          ctrl.refreshChartData()

          ctrl.loading = false;
        })
        .catch(function(data) {
          console.log('Error: ' + data);
        });
    }

    ctrl.finishedBetStatusToggle = function(bool) {
      for (var status of ctrl.betStatus) {
        if (status.label.includes('GAGN') || status.label.includes('PERDU') || status.label.includes('CASH')) {
          status.model = bool
        }
      }
      // ctrl.betStatus.filter(status => status.label.includes('GAGN') || status.label.includes('PERDU') || status.label.includes('CASH'))
    }

    ctrl.calculateNextTechniquesBetsToDo = function() {
      let simpleTechniqueBets = ctrl.winamaxBetsBeforeCum.filter(bet => bet.type.includes('SIMPLE') && (bet.events[0].betTechnique == 'under buts' || bet.events[0].betTechnique == 'under points' || bet.events[0].betTechnique == 'over points' || bet.events[0].betTechnique == '2-3 buts'))
      let lostSimpleTechniqueBets = simpleTechniqueBets.filter(bet => bet.status.includes('PERDU'))
      let filteredLostSimpleTechniqueBets = lostSimpleTechniqueBets.filter(bet => {
        let betTime = bet.betTime
        let eventHome = bet.events[0].eventHome.substring(0, 7)
        let eventAway = bet.events[0].eventAway.substring(0, 7)
        let technique = bet.events[0].betTechnique

        return !simpleTechniqueBets.some(bet => bet.events[0].betTechnique == technique && bet.betTime > betTime && !bet.status.includes('PERDU') && !bet.status.includes('CASHOUT') && (bet.events[0].eventName.includes(eventHome) || bet.events[0].eventName.includes(eventAway)))

      })
      ctrl.nextTechniqueBetsToDoBeforeGroup = filteredLostSimpleTechniqueBets.map(event => {
        let eventHome = event.events[0].eventHome
        let eventAway = event.events[0].eventAway
        let eventHomeCount = filteredLostSimpleTechniqueBets.filter((event) => (event.events[0].eventHome === eventHome || event.events[0].eventAway === eventHome)).length
        let eventAwayCount = filteredLostSimpleTechniqueBets.filter((event) => (event.events[0].eventHome === eventAway || event.events[0].eventAway === eventAway)).length
        if (eventHomeCount == eventAwayCount) {
          event.techniqueEvent = eventHome + ' OR ' + eventAway
        } else if (eventHomeCount > eventAwayCount) {
          event.techniqueEvent = eventHome
        } else if (eventAwayCount > eventHomeCount) {
          event.techniqueEvent = eventAway
        }
        return event

      })
      // const ignoredTechniqueBets = ['La Gantoise OR Racing Genk', 'Chalon-sur-Saône OR Dijon', 'Utah Jazz OR Dallas Mavericks']
      // ctrl.nextTechniqueBetsToDoBeforeGroup = ctrl.nextTechniqueBetsToDoBeforeGroup.filter(event => !ignoredTechniqueBets.includes(event.techniqueEvent))

      ctrl.nextTechniqueBetsToDoBeforeGroup = ctrl.nextTechniqueBetsToDoBeforeGroup.filter(event => event.betResultTime > new Date(ctrl.nextTechniqueBetsToDoDateFilter).getTime())
      let sportEventsGroup = {}

      for (var techniqueEvent of ctrl.nextTechniqueBetsToDoBeforeGroup) {
        if (!sportEventsGroup[techniqueEvent.events[0].sport + 'Events']) {
          sportEventsGroup[techniqueEvent.events[0].sport + 'Events'] = []
        }
        sportEventsGroup[techniqueEvent.events[0].sport + 'Events'].push(techniqueEvent)
      }

      Object.keys(sportEventsGroup).forEach(key => sportEventsGroup[key] = sportEventsGroup[key].reduce((h, a) => Object.assign(h, {
        [a.techniqueEvent]: (h[a.techniqueEvent] || []).concat(a)
      }), {}));

      Object.keys(sportEventsGroup).forEach(key => sportEventsGroup[key] = Object.assign(...Object.entries(sportEventsGroup[key]).map(([k, v]) => ({
        [k]: {
          level: v.length,
          lostStakes: ctrl.around(v.reduce((a, b) => +a + +b.result, 0)),
          sport: v[0].events[0].sport,
          betTechnique: v[0].events[0].betTechnique,
          lostBets: v
        }
      }))));

      ctrl.nextTechniqueBetsToDo = sportEventsGroup

    }


    ctrl.refreshChartData = function() {
      let chartData = ctrl.winamaxBetsBeforeCum;
      chartData = $filter('filterEventName')(chartData, ctrl.eventNameFilter);
      chartData = $filter('filterBetDesc')(chartData, ctrl.betDescs);
      chartData = $filter('filterBetTechnique')(chartData, ctrl.betTechniques);
      chartData = $filter('filterBetSport')(chartData, ctrl.betSports);
      chartData = $filter('filterBetType')(chartData, ctrl.betTypes);
      chartData = $filter('filterBetStatus')(chartData, ctrl.betStatus);
      chartData.sort(olderFirst);
      chartData = chartData.map(cumulator(chartData))
      chartData = chartData.map(mapChartValues)
      $scope.data = [{
        key: "TOTAL",
        values: chartData
      }]
      $scope.api.refresh();
    }
    /* Chart options */
    $scope.options = {
      chart: {
        type: 'stackedAreaChart',
        height: 450,
        margin: {
          top: 20,
          right: 20,
          bottom: 30,
          left: 40
        },
        x: function(d) {
          return d[0];
        },
        y: function(d) {
          return d[1];
        },
        useVoronoi: false,
        clipEdge: true,
        duration: 100,
        useInteractiveGuideline: true,
        xAxis: {
          showMaxMin: false,
          tickFormat: function(d) {
            return d3.time.format('%x')(new Date(d))
            // return d
          }
        },
        yAxis: {
          tickFormat: function(d) {
            return d3.format(',.2f')(d);
          }
        },
        zoom: {
          enabled: true,
          scaleExtent: [1, 10],
          useFixedDomain: false,
          useNiceScale: false,
          horizontalOff: false,
          verticalOff: true,
          unzoomEventType: 'dblclick.zoom'
        }
      }
    };
    $scope.data = []

    // when submitting the add form, send the text to the node API


  };

  let cumulator = (originArray) => {
    return (bet, index) => {
      let cumRes = bet.result
      if (index > 0) {
        cumRes = cumRes + originArray[index - 1].cumRes
      }
      bet.cumRes = Math.round(cumRes * 100) / 100
      return bet

    }
  }

  let mapChartValues = (bet) => {
    let res = []
    res.push(bet.betResultTime)
    res.push(bet.cumRes)
    return res
  }

  let olderFirst = (a, b) => (a.betResultTime > b.betResultTime) ? 1 : ((b.betResultTime > a.betResultTime) ? -1 : 0)
  let newerFirst = (a, b) => (a.betResultTime < b.betResultTime) ? 1 : ((b.betResultTime < a.betResultTime) ? -1 : 0)

  let onlyUnique = (value, index, self) => {
    return self.indexOf(value) === index
  };

  /*
    let cumulator = (bet, index) => {
      let cumRes = bet.result
      if (index > 0) {
        cumRes = cumRes + ctrl.winamaxBetsBeforeCum[index - 1].cumRes
      }
      bet.cumRes = Math.round(cumRes * 100) / 100
      return bet

    }*/

})(window.angular);

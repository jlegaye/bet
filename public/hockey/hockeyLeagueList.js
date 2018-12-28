(function(angular) {
  'use strict';

  function HockeyList($scope, $element, $attrs, $http) {
    var ctrl = this;

    ctrl.list = [{
        countryName: 'AUTRICHE',
        under_check: '6',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/hockey/austria/ebel/'
      },
      {
        countryName: 'RUSSIE',
        under_check: '5',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/hockey/russia/khl/'
      },
      {
        countryName: 'FRANCE',
        under_check: '6',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/hockey/france/ligue-magnus/'
      },
      {
        countryName: 'ALLEMAGNE',
        under_check: '6',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/hockey/germany/del/'
      },
      {
        countryName: 'FINLANDE',
        under_check: '5',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/hockey/finland/liiga/'
      },
      {
        countryName: 'USA',
        under_check: '6',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/hockey/usa/nhl/'
      },
      {
        countryName: 'REPUBLIQUE TCHEQUE',
        under_check: '5',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/hockey/czech-republic/extraliga/'
      },
      {
        countryName: 'SUEDE',
        under_check: '6',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/hockey/sweden/shl/'
      },
      {
        countryName: 'NORVEGE',
        under_check: '6',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/hockey/norway/get-ligaen/'
      },
      {
        countryName: 'SLOVAQUIE',
        under_check: '6',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/hockey/slovakia/tipsport-liga/'
      },
      {
        countryName: 'SUISSE',
        under_check: '5',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/hockey/switzerland/national-league/'
      }

    ];

    ctrl.isLoading = false
    ctrl.hockeyPredictionsIteration = 4
    ctrl.allHockeyPredictions = []
    ctrl.allHockeyPredictions2 = []

    ctrl.getAllHockeyPredictions = function(iteration_check) {
      ctrl.allHockeyPredictions = []
      ctrl.allHockeyPredictions2 = []
      ctrl.isLoading = true
      return ctrl.list.reduce((promise, item) => {
        return promise
          .then((result) => {
            return getHockeyPrediction(item.url, iteration_check).then(res => {
              $scope.$apply(function() {
                ctrl.allHockeyPredictions.push(res)
                refreshFlaten()
              });

            });
          })
          .catch(console.error);
      }, Promise.resolve()).then(r => {
        $scope.$apply(function() {
          ctrl.isLoading = false
        });
      })
    }

    function refreshFlaten() {
      let allHockeyPredictionsCopy = angular.copy(ctrl.allHockeyPredictions)
      let modifiedAllHockeyPredictions = allHockeyPredictionsCopy.map(pred => {
        let events = pred.events.map(event => {
          event.league = pred.league
          let parts = event.nextEvent.date.split('.');
          let mydate = new Date(parts[2], parts[1] - 1, parts[0]);
          event.nextEvent.date = mydate.toDateString()
          event.nextEvent.dateTime = mydate.getTime()
          return event
        })
        return events
      })
      let flatenAllHockeyPredictions = [].concat.apply([], modifiedAllHockeyPredictions);
      ctrl.allHockeyPredictions2 = flatenAllHockeyPredictions.sort(olderFirst)
    }

    let olderFirst = (a, b) => (a.nextEvent.dateTime > b.nextEvent.dateTime) ? 1 : ((b.nextEvent.dateTime > a.nextEvent.dateTime) ? -1 : 0)

    ctrl.getAllHockeyPredictionsCount = function() {
      return ctrl.allHockeyPredictions.reduce((pv, cv) => pv + cv.events.length, 0);
    }

    ctrl.getAllAlreadyBetHockeyPredictionsCount = function() {

      return ctrl.allHockeyPredictions.reduce((pv, cv) => {
        return pv + cv.events.filter(event => event.alreadyBet).length
      }, 0);
    }

    function getHockeyPrediction(url, iteration_check) {
      return new Promise((resolve, reject) => {
        $http.get('/api/hockeyPredictions', {
            timeout: 1000000,
            params: {
              url: url,
              under_check: 0,
              iteration_check: iteration_check
            }
          })
          .then(function(response) {
            let currentBetsEventNames = $scope.$parent.ctrl.currentSimpleBetsEventNames
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
            res.events = res.events.map(event => {
              let eventTeam = event.team
              let nextTechniqueBetsToDo = $scope.$parent.ctrl.nextTechniqueBetsToDo.hockeyEvents
              let matchingTechKey = Object.keys(nextTechniqueBetsToDo).find(nextTech => nextTech.includes(eventTeam))
              if(matchingTechKey !== undefined){
                event.lostStakes = nextTechniqueBetsToDo[matchingTechKey].lostStakes
              }
              return event

            })

            console.log('res.events: ', res.events)
            console.log(res)
            resolve(res)
          })
          .catch(function(data) {
            console.log('Error: ' + data);
            reject(data)
          });
      })
    }

  }

  angular.module('betApp').component('hockeyLeagueList', {
    templateUrl: 'hockey/hockeyLeagueList.html',
    controller: HockeyList
  });
})(window.angular);

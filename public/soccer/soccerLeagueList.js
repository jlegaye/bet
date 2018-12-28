(function(angular) {
  'use strict';

  function SoccerList($scope, $element, $attrs, $http) {
    var ctrl = this;

    ctrl.list = [{
        countryName: 'FRANCE LIGUE 1',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/soccer/france/ligue-1/'
      },
      {
        countryName: 'FRANCE LIGUE 2',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/soccer/france/ligue-2/'
      },
      {
        countryName: 'ANGLETERRE Premier League',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/soccer/england/premier-league/'
      },
      {
        countryName: 'ANGLETERRE Championship',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/soccer/england/championship/'
      },
      {
        countryName: 'ALLEMAGNE Bundesliga',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/soccer/germany/bundesliga/'
      },
      {
        countryName: 'ALLEMAGNE 2. Bundesliga',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/soccer/germany/2-bundesliga/'
      },
      {
        countryName: 'ITALIE Serie A',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/soccer/italy/serie-a/'
      },
      {
        countryName: 'ITALIE Serie B',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/soccer/italy/serie-b/'
      },
      {
        countryName: 'ESPAGNE LaLiga',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/soccer/spain/laliga/'
      },
      {
        countryName: 'ESPAGNE LaLiga2',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/soccer/spain/laliga2/'
      },
      {
        countryName: 'PORTUGAL Primeira Liga',
        iteration_check: '4',
        url: 'https://www.betexplorer.com/soccer/portugal/primeira-liga/'
      }
    ]

    ctrl.isLoading = false
    ctrl.soccerPredictionsIteration = 5
    ctrl.allSoccerPredictions = []
    ctrl.allSoccerPredictions2 = []

    ctrl.getAllSoccerPredictions = function(iteration_check) {
      ctrl.allSoccerPredictions = []
      ctrl.allSoccerPredictions2 = []
      ctrl.isLoading = true
      return ctrl.list.reduce((promise, item) => {
        return promise
          .then((result) => {
            return getSoccerPrediction(item.url, iteration_check).then(res => {
              $scope.$apply(function() {
                ctrl.allSoccerPredictions.push(res)
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
      let allSoccerPredictionsCopy = angular.copy(ctrl.allSoccerPredictions)
      let modifiedAllSoccerPredictions = allSoccerPredictionsCopy.map(pred => {
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
      let flatenAllSoccerPredictions = [].concat.apply([], modifiedAllSoccerPredictions);
      ctrl.allSoccerPredictions2 = flatenAllSoccerPredictions.sort(olderFirst)
    }

    let olderFirst = (a, b) => (a.nextEvent.dateTime > b.nextEvent.dateTime) ? 1 : ((b.nextEvent.dateTime > a.nextEvent.dateTime) ? -1 : 0)

    ctrl.getAllSoccerPredictionsCount = function() {
      return ctrl.allSoccerPredictions.reduce((pv, cv) => pv + cv.events.length, 0);
    }

    ctrl.getAllAlreadyBetSoccerPredictionsCount = function() {

      return ctrl.allSoccerPredictions.reduce((pv, cv) => {
        return pv + cv.events.filter(event => event.alreadyBet).length
      }, 0);
    }

    function getSoccerPrediction(url, iteration_check) {
      return new Promise((resolve, reject) => {
        $http.get('/api/soccerPredictions', {
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
              let nextTechniqueBetsToDo = $scope.$parent.ctrl.nextTechniqueBetsToDo.soccerEvents
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

  angular.module('betApp').component('soccerLeagueList', {
    templateUrl: 'soccer/soccerLeagueList.html',
    controller: SoccerList
  });
})(window.angular);

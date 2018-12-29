const util = require('util')
// const getAllResults = require('./bet');
const getAllWinamaxBets = require('./winamax');
// require('./bet');
const bet = require('./bet');
const fs = require('fs');
// const getSoccerEventsPredictions = require('./bet');

module.exports = function(app) {

  // api ---------------------------------------------------------------------
  // get all todos
  app.get('/api/hockeyPredictions', function(req, res) {
    bet.getHockeyEventsPredictions(req.query.url, req.query.under_check, req.query.iteration_check)
      .then((result) => res.json(result))
      .catch((err) => console.log(err))
  });

  app.get('/api/basketBallPredictions', function(req, res) {
    bet.getBasketBallEventsPredictions(req.query.url, req.query.under_check, req.query.iteration_check)
      .then((result) => res.json(result))
      .catch((err) => console.log(err))
  });

  app.get('/api/soccerPredictions', function(req, res) {
    bet.getSoccerEventsPredictions(req.query.url, req.query.iteration_check)
      .then((result) => res.json(result))
      .catch((err) => console.log(err))
  });

  /*
  app.get('/api/todos', function(req, res) {

    getAllResults()
		.then((result) => res.json(result))
		.catch((err) => console.log(err))
  });
*/
  app.get('/api/winamaxBets', function(req, res) {

    getAllWinamaxBets()
      .then((result) => {
        // console.log('result: ', result)
        console.log(util.inspect(result, false, null, true))
        let uniqueNewPages = Array.from(result.reduce((m, t) => m.set(t.id, t), new Map()).values());
        // console.log('uniqueNewPages: ', uniqueNewPages)
        let cacheString = fs.readFileSync('./app/cache.json');
        let cacheJson = JSON.parse(cacheString);
        let concatWithCache = uniqueNewPages.concat(cacheJson)
        let unique = []
        for (var bet of concatWithCache) {
          let id = bet.id
          let alreadyTreatedIds = unique.map(bet => bet.id)
          if (!alreadyTreatedIds.includes(id)) {

            let sameIdsArray = concatWithCache.filter(bet => bet.id === id)
            if (sameIdsArray.length == 1) {
              unique.push(bet)
            } else {
              let status = bet.status
              if (!status.includes('EN COURS')) {
                unique.push(bet)
              } else {
                if (!(sameIdsArray.some(bet => !bet.status.includes('EN COURS')))) {
                  unique.push(bet)
                }
              }
            }
          }
        }
        // let uniqueConcatWithCache = Array.from(concatWithCache.reduce((m, t) => m.set(t.id, t), new Map()).values());
        // console.log('unique: ', unique)
        let data = JSON.stringify(unique);
        fs.writeFileSync('./app/cache.json', data);
        res.json(unique)
        // res.json(uniqueConcatWithCache)
        // res.json(uniqueNewPages)
      })
      .catch(e => console.error('Error during getAllWinamaxBets: ', e))

  });

  // application -------------------------------------------------------------
  app.get('*', function(req, res) {
    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
  });
};

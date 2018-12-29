const puppeteer = require('puppeteer')
const util = require('util')
require('events').EventEmitter.defaultMaxListeners = 50;
const config = require('./config')
// const fs = require('fs');

const ext = config.uBlockPath
const datadir = config.uBlockDataDir
const launchOptions = {
  headless: true,
  userDataDir: datadir,
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`]
}

const getHockeyTeamInfos = async (browser, teamUrl, sport) => {
  const page = await browser.newPage()
  await page.goto(teamUrl, {
    timeout: 300000,
    waitUntil: 'networkidle0'
  })
  await page.waitFor(3000)

  await page.addScriptTag({
    path: './app/nameMapping/' + sport + 'Mapping.js'
    // path: './' + sport + 'Mapping.js'
  });
  const result = await page.evaluate(() =>

    {
      const getWinamaxTeamName = (teamName) => {
        console.log(mappingJson.length)
        return mappingJson.filter(team => team.teamName == teamName)[0].winamaxTeamName
      }

      let breadcrumb = document.querySelector('.list-breadcrumb').innerText.trim().replace('Home ', '');
      let leagueName = document.querySelector('h1 div').textContent.trim();
      let teamName = document.querySelector('h1').textContent.trim().replace(leagueName, '');
      console.log('teamName: ', teamName)
      teamName = getWinamaxTeamName(teamName)
      let data = {
        lastEvents: []
      };
      let elements = document.querySelectorAll('table.teaminfo tbody tr');
      let nextEvents = [];
      for (var element of elements) {

        let nbChildren = element.childNodes.length
        if (nbChildren == 12 || nbChildren == 7) {

          let home = element.childNodes[2].innerText.trim();
          console.log('home: ', home)
          home = getWinamaxTeamName(home)
          let away = element.childNodes[3].innerText.trim();
          console.log('away: ', away)
          away = getWinamaxTeamName(away)
          if (nbChildren == 12) {
            let date = element.childNodes[11].innerText.trim();
            nextEvents.push({
              home,
              away,
              date
            })
          } else if (nbChildren == 7) {
            let date = element.childNodes[6].innerText.trim();
            let score = element.childNodes[4].innerText.trim();

            // if (sport == 'soccer') {
            //   let scoreRegex = score.match(/\d+/ig);
            //   if (scoreRegex) {
            //     let homeGoals = parseInt(scoreRegex[0])
            //     let awayGoals = parseInt(scoreRegex[1])
            //     let ownGoals
            //     if (teamName == home) {
            //       ownGoals = homeGoals
            //     } else if (teamName == away) {
            //       ownGoals = awayGoals
            //     }
            //
            //     let totalGoals = homeGoals + awayGoals
            //     data.lastEvents.push({
            //       home,
            //       away,
            //       score,
            //       homeGoals,
            //       awayGoals,
            //       totalGoals,
            //       ownGoals,
            //       date
            //     })
            //   }
            // } else if (sport == 'hockey') {
            let scoreRegex = score.match(/\d+:\d+/ig);
            if (scoreRegex) {

              let firstPeriodScore = '0:0'
              let secondPeriodScore = '0:0'
              let thirdPeriodScore = '0:0'

              let otScore = scoreRegex[0]
              if (scoreRegex[1] !== undefined) {
                firstPeriodScore = scoreRegex[1]
              }
              let firstPeriodGoalsRegex = firstPeriodScore.match(/\d+/ig);

              let firstPeriodHomeGoals = parseInt(firstPeriodGoalsRegex[0])
              let firstPeriodAwayGoals = parseInt(firstPeriodGoalsRegex[1])

              if (scoreRegex[2] !== undefined) {
                secondPeriodScore = scoreRegex[2]
              }
              let secondPeriodGoalsRegex = secondPeriodScore.match(/\d+/ig);
              let secondPeriodHomeGoals = parseInt(secondPeriodGoalsRegex[0])
              let secondPeriodAwayGoals = parseInt(secondPeriodGoalsRegex[1])

              if (scoreRegex[3] !== undefined) {
                thirdPeriodScore = scoreRegex[3]
              }
              let thirdPeriodGoalsRegex = thirdPeriodScore.match(/\d+/ig);
              let thirdPeriodHomeGoals = parseInt(thirdPeriodGoalsRegex[0])
              let thirdPeriodAwayGoals = parseInt(thirdPeriodGoalsRegex[1])

              let etScore = ''
              let withET = false
              let penScore = ''
              let withPen = false

              if (scoreRegex.length > 4) {
                etScore = scoreRegex[4]
                withET = true
              }
              if (scoreRegex.length > 5) {
                penScore = scoreRegex[5]
                withPen = true
              }
              // let homeGoals = parseInt(scoreRegex[0])
              let homeGoals = firstPeriodHomeGoals + secondPeriodHomeGoals + thirdPeriodHomeGoals
              // let awayGoals = parseInt(scoreRegex[1])
              let awayGoals = firstPeriodAwayGoals + secondPeriodAwayGoals + thirdPeriodAwayGoals
              let ownGoals
              if (teamName == home) {
                ownGoals = homeGoals
              } else if (teamName == away) {
                ownGoals = awayGoals
              }

              let totalGoals = homeGoals + awayGoals
              data.lastEvents.push({
                home,
                away,
                score,
                otScore,
                firstPeriodScore,
                secondPeriodScore,
                thirdPeriodScore,
                etScore,
                penScore,
                homeGoals,
                awayGoals,
                totalGoals,
                ownGoals,
                withET,
                withPen,
                date
              })
            }
            // }
          }
        }
      }
      data.nextEvent = nextEvents.pop()
      data.breadcrumb = breadcrumb
      data.teamName = teamName
      data.leagueName = leagueName
      return data;
    }
  )
  await page.waitFor(100)
  await page.close();
  //await browser.close();

  return result;
}


const getSoccerTeamInfos = async (browser, teamUrl, sport) => {
  const page = await browser.newPage()
  await page.goto(teamUrl, {
    timeout: 300000,
    waitUntil: 'networkidle0'
  })
  await page.waitFor(2000)

  await page.addScriptTag({
    path: './app/nameMapping/' + sport + 'Mapping.js'
    // path: './' + sport + 'Mapping.js'
  });
  const result = await page.evaluate(() =>

    {
      const getWinamaxTeamName = (teamName) => {
        console.log(mappingJson.length)
        return mappingJson.filter(team => team.teamName == teamName)[0].winamaxTeamName
      }

      let breadcrumb = document.querySelector('.list-breadcrumb').innerText.trim().replace('Home ', '');
      let leagueName = document.querySelector('h1 div').textContent.trim();
      let teamName = document.querySelector('h1').textContent.trim().replace(leagueName, '');
      console.log('teamName: ', teamName)
      teamName = getWinamaxTeamName(teamName)
      let data = {
        lastEvents: []
      };
      let elements = document.querySelectorAll('table.teaminfo tbody tr');
      let nextEvents = [];
      for (var element of elements) {

        let nbChildren = element.childNodes.length
        if (nbChildren == 12 || nbChildren == 7) {

          let home = element.childNodes[2].innerText.trim();
          console.log('home: ', home)
          home = getWinamaxTeamName(home)
          let away = element.childNodes[3].innerText.trim();
          console.log('away: ', away)
          away = getWinamaxTeamName(away)
          if (nbChildren == 12) {
            let date = element.childNodes[11].innerText.trim();
            nextEvents.push({
              home,
              away,
              date
            })
          } else if (nbChildren == 7) {
            let date = element.childNodes[6].innerText.trim();
            let score = element.childNodes[4].innerText.trim();

            let scoreRegex = score.match(/\d+/ig);
            if (scoreRegex) {
              let homeGoals = parseInt(scoreRegex[0])
              let awayGoals = parseInt(scoreRegex[1])
              let ownGoals
              if (teamName == home) {
                ownGoals = homeGoals
              } else if (teamName == away) {
                ownGoals = awayGoals
              }

              let totalGoals = homeGoals + awayGoals
              data.lastEvents.push({
                home,
                away,
                score,
                homeGoals,
                awayGoals,
                totalGoals,
                ownGoals,
                date
              })
            }

            // }
          }
        }
      }
      data.nextEvent = nextEvents.pop()
      data.breadcrumb = breadcrumb
      data.teamName = teamName
      data.leagueName = leagueName
      return data;
    }
  )
  await page.waitFor(100)
  await page.close();
  //await browser.close();

  return result;
}

const getBasketBallTeamInfos = async (browser, teamUrl) => {
  const page = await browser.newPage()
  await page.goto(teamUrl, {
    timeout: 300000,
    waitUntil: 'networkidle0'
  })
  await page.waitFor(2000)
  await page.addScriptTag({
    path: './app/nameMapping/basketballMapping.js'
  });
  const result = await page.evaluate(() =>

    {
      const getWinamaxTeamName = (teamName) => {
        console.log(mappingJson.length)
        return mappingJson.filter(team => team.teamName == teamName)[0].winamaxTeamName
      }

      let breadcrumb = document.querySelector('.list-breadcrumb').innerText.trim().replace('Home ', '');
      let leagueName = document.querySelector('h1 div').textContent.trim();
      let teamName = document.querySelector('h1').textContent.trim().replace(leagueName, '');
      let data = {
        lastEvents: []
      };
      let elements = document.querySelectorAll('table.teaminfo tbody tr');
      let nextEvents = [];
      for (var element of elements) {

        let nbChildren = element.childNodes.length

        if (nbChildren == 10 || nbChildren == 7) {

          let home = element.childNodes[2].innerText.trim();
          let away = element.childNodes[3].innerText.trim();
          if (nbChildren == 10) {
            let date = element.childNodes[9].innerText.trim();
            nextEvents.push({
              home,
              away,
              date
            })
          } else if (nbChildren == 7) {
            let date = element.childNodes[6].innerText.trim();
            let score = element.childNodes[4].innerText.trim();
            let scoreRegex = score.match(/\d+/ig);
            if (scoreRegex) {
              let homeGoals = parseInt(scoreRegex[0])
              let awayGoals = parseInt(scoreRegex[1])
              let ownGoals
              if (teamName == home) {
                ownGoals = homeGoals
              } else if (teamName == away) {
                ownGoals = awayGoals
              }

              let totalGoals = homeGoals + awayGoals
              data.lastEvents.push({
                home,
                away,
                score,
                homeGoals,
                awayGoals,
                totalGoals,
                ownGoals,
                date
              })
            }
          }
        }
      }
      data.nextEvent = nextEvents.pop()
      data.breadcrumb = breadcrumb
      data.teamName = teamName
      data.leagueName = leagueName
      return data;
    }
  )
  await page.waitFor(100)
  await page.close();
  //await browser.close();

  return result;
}

const getAllTeamsUrl = async (browser, leagueUrl) => {
  //const browser = await puppeteer.launch({headless: false})
  const page = await browser.newPage()
  await page.goto(leagueUrl, {
    timeout: 500000,
    waitUntil: 'networkidle0'
  })
  await page.waitFor(3000)

  let breadcrumb = await page.evaluate(() => {
    return document.querySelector('.list-breadcrumb').innerText.trim().replace('Home ', '');
  });
  console.log('breadcrumb: ', breadcrumb)
  let leagueName = await page.evaluate(() => {
    return document.querySelector("h1 span.tablet-desktop-only").innerText.trim();
  });
  console.log('leagueName: ', leagueName)
  await page.waitFor(1000)
  const teams = await page.evaluate(() => [...document.querySelectorAll('table.stats-table td.participant_name a')].map(link => link.href), )
  await page.waitFor(500)
  // await page.waitFor(100)
  await page.close();
  //await browser.close();

  return {
    breadcrumb,
    teams
  }
}

var uniqEs6 = (arrArg) => {
  return arrArg.filter((elem, pos, arr) => {
    return arr.indexOf(elem) == pos;
  });
}

const getHockeyResult = (browser, leagueUrl, under_check, iteration_check) => {
  return new Promise((resolve, reject) => {
    getAllTeamsUrl(browser, leagueUrl)
      .then(function(results) {

        //console.log('getAllTeamsUrl')
        //console.log(results)
        let promises = uniqEs6(results.teams).map(url => getHockeyTeamInfos(browser, url, 'hockey'))

        Promise.all(promises)
          .then(function(teamsEvents) {

            let filtered = teamsEvents.filter(teamEvents => {
              if (teamEvents.lastEvents)
                var over = true
              let i = 0;
              while (i < iteration_check && over) {
                if (teamEvents.lastEvents[i].totalGoals < under_check) {
                  over = false;
                }
                i++;
              }
              return over
            }).map(teamEvents => {
              return {
                team: teamEvents.teamName,
                nextEvent: teamEvents.nextEvent
              }
            })

            console.log('filtered: ', filtered)
            console.log('results.breadcrumb: ', results.breadcrumb)
            resolve({
              league: results.breadcrumb,
              events: filtered
            })
          })
          .catch(function(err) {
            console.log('Promise all error Hockey : ' + err)
          });

      })
      .catch(function(err) {
        console.log('getAllTeamsUrl error : ' + err)
        throw err
      });
  })
}

const getHockeyResultV2 = (browser, leagueUrl, under_check, iteration_check) => {
  return new Promise((resolve, reject) => {
    getAllTeamsUrl(browser, leagueUrl)
      .then(function(results) {

        console.log('getAllTeamsUrl: ', leagueUrl)
        console.log('URL count: ', results.teams.length)
        let promises = uniqEs6(results.teams).map(url => getHockeyTeamInfos(browser, url, 'hockey'))

        Promise.all(promises)
          .then(function(teamsEvents) {
            // console.log(util.inspect(teamsEvents, false, null, true))
            let filtered = teamsEvents.filter(teamEvents => {
              let totalGoalsArr = teamEvents.lastEvents.map(event => event.totalGoals)
              totalGoalsArr = totalGoalsArr.slice(iteration_check, iteration_check + 10)
              totalGoalsArr = removeSmallest(removeBiggest(totalGoalsArr))
              // console.log('totalGoalsArr before splice: ', totalGoalsArr)
              // console.log('totalGoalsArr after splice: ', totalGoalsArr)
              let totalGoalsAverage = totalGoalsArr.reduce((a, b) => +a + +b, 0) / totalGoalsArr.length
              // console.log('team: ', teamEvents.teamName)
              // console.log('totalGoalsAverage: ', totalGoalsAverage)
              var over = true
              let i = 0;
              while (i < iteration_check && over) {
                if (teamEvents.lastEvents[i].totalGoals < (totalGoalsAverage + 0.5)) {
                  over = false;
                }
                i++;
              }
              return over

              if (teamEvents.lastEvents)
                var over = true
              return over
            }).map(teamEvents => {
              let lastEvents = teamEvents.lastEvents.slice(0, parseInt(iteration_check) + 2)
              let totalGoalsArr = teamEvents.lastEvents.map(event => event.totalGoals)
              totalGoalsArr = totalGoalsArr.slice(parseInt(iteration_check), parseInt(iteration_check) + 10)
              totalGoalsArr = removeSmallest(removeBiggest(totalGoalsArr))
              // totalGoalsArr.splice(0, parseInt(iteration_check))
              // totalGoalsArr = removeSmallest(removeBiggest(totalGoalsArr))

              let totalGoalsAverage = totalGoalsArr.reduce((a, b) => +a + +b, 0) / totalGoalsArr.length
              return {
                team: teamEvents.teamName,
                totalGoalsAverage: totalGoalsAverage,
                nextEvent: teamEvents.nextEvent,
                lastEvents: lastEvents
              }
            })

            console.log('filtered: ', filtered)
            console.log('results.breadcrumb: ', results.breadcrumb)
            resolve({
              league: results.breadcrumb,
              events: filtered
            })
          })
          .catch(function(err) {
            console.log('Promise all error Hockey : ' + err)
          });

      })
      .catch(function(err) {
        console.log('getAllTeamsUrl error : ' + err)
        throw err
      });
  })
}

const getBasketBallResult = (browser, leagueUrl, under_check, iteration_check) => {
  return new Promise((resolve, reject) => {
    getAllTeamsUrl(browser, leagueUrl)
      .then(function(results) {

        // console.log('getAllTeamsUrl')
        // console.log(results)
        let promises = uniqEs6(results.teams).map(url => getBasketBallTeamInfos(browser, url))

        Promise.all(promises)
          .then(function(teamsEvents) {
            // console.log('teamsEvents: ');
            // console.log(util.inspect(teamsEvents, false, null, true))


            let filtered = teamsEvents.filter(teamEvents => {
              let ownGoalsArr = teamEvents.lastEvents.map(event => event.ownGoals)
              ownGoalsArr = removeSmallest(removeBiggest(ownGoalsArr))
              ownGoalsArr.splice(0, iteration_check)
              let ownGoalsAverage = ownGoalsArr.reduce((a, b) => +a + +b, 0) / ownGoalsArr.length
              console.log('team: ', teamEvents.teamName)
              console.log('ownGoalsAverage: ', ownGoalsAverage)
              var over = true
              let i = 0;
              // while (i < iteration_check && over) {
              //   if (teamEvents.lastEvents[i].totalGoals < under_check) {
              //     over = false;
              //   }
              //   i++;
              // }
              while (i < iteration_check && over) {
                // if (teamEvents.lastEvents[i].ownGoals < ownGoalsAverage) {
                if (teamEvents.lastEvents[i].ownGoals > (ownGoalsAverage - 6)) {
                  over = false;
                }
                i++;
              }
              return over
            }).map(teamEvents => {
              let ownGoalsArr = teamEvents.lastEvents.map(event => event.ownGoals)
              ownGoalsArr = removeSmallest(removeBiggest(ownGoalsArr))
              let ownGoalsAverage = ownGoalsArr.reduce((a, b) => +a + +b, 0) / ownGoalsArr.length
              return {
                team: teamEvents.teamName,
                ownGoalsAverage: ownGoalsAverage,
                nextEvent: teamEvents.nextEvent
              }
            })
            console.log('filtered: ');
            console.log(util.inspect(filtered, false, null, true))
            resolve({
              league: results.breadcrumb,
              events: filtered
            })
          })
          .catch(function(err) {
            console.log('Promise all error BB: ' + err)
          });

      })
      .catch(function(err) {
        console.log('getAllTeamsUrl error : ' + err)
        throw err
      });
  })
}

const removeSmallest = (arr) => {
  var min = Math.min.apply(null, arr);
  return arr.filter((e) => {
    return e != min
  });
}

const removeBiggest = (arr) => {
  var max = Math.max.apply(null, arr);
  return arr.filter((e) => {
    return e != max
  });
}

const getSoccerResult = (browser, leagueUrl, iteration_check) => {
  return new Promise((resolve, reject) => {
    getAllTeamsUrl(browser, leagueUrl)
      .then(function(results) {

        //console.log('getAllTeamsUrl')
        //console.log(results)
        let promises = uniqEs6(results.teams).map(url => getSoccerTeamInfos(browser, url, 'soccer'))

        Promise.all(promises)
          .then(function(teamsEvents) {

            let filtered = teamsEvents.filter(teamEvents => {
              if (teamEvents.lastEvents)
                var not_2_3 = true
              let i = 0;
              while (i < iteration_check && not_2_3) {
                if (teamEvents.lastEvents[i].totalGoals == 2 || teamEvents.lastEvents[i].totalGoals == 3) {
                  // if (teamEvents.lastEvents[i].totalGoals > 3) {
                  not_2_3 = false;
                }
                i++;
              }
              return not_2_3
            }).map(teamEvents => {
              let lastEvents = teamEvents.lastEvents.slice(0, parseInt(iteration_check) + 2)
              return {
                team: teamEvents.teamName,
                nextEvent: teamEvents.nextEvent,
                lastEvents: lastEvents
              }
            })
            resolve({
              league: results.breadcrumb,
              events: filtered
            })
          })
          .catch(function(err) {
            console.log('Promise all error soccer : ' + err)
          });

      })
      .catch(function(err) {
        console.log('getAllTeamsUrl error : ' + err)
        throw err
      });
  })
}


/*
getHockeyResult('https://www.betexplorer.com/hockey/switzerland/national-league/', 5, 4)
.then(function(result) {
console.log(util.inspect(result, false, null, true))

})
*/

const getAllResults_ = () =>

  new Promise((resolve, reject) => {
    let totalResult = []
    puppeteer.launch(launchOptions).then(function(browser) {
      getSoccerResult(browser, 'https://www.betexplorer.com/soccer/france/ligue-1/', 4)
        /*.then(function(result) {
          totalResult.push(result)
          //console.log(util.inspect(result, false, null, true))
          return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/russia/khl/', 5, 4)
        })
        .catch(function(err) {
          console.log('ERR1 ' + err)
        })
        .then(function(result) {
          totalResult.push(result)
          //console.log(util.inspect(result, false, null, true))
          return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/france/ligue-magnus/', 6, 4)
        })
        .catch(function(err) {
          console.log('ERR2 ' + err)
        })
        .then(function(result) {
          totalResult.push(result)
          //console.log(util.inspect(result, false, null, true))
          return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/germany/del/', 6, 4)
        })
        .catch(function(err) {
          console.log('ERR3 ' + err)
        })
        .then(function(result) {
          totalResult.push(result)
          //console.log(util.inspect(result, false, null, true))
          return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/finland/liiga/', 5, 4)
        })
        .catch(function(err) {
          console.log('ERR4 ' + err)
        })
        .then(function(result) {
          totalResult.push(result)
          //console.log(util.inspect(result, false, null, true))
          return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/usa/nhl/', 6, 4)
        })
        .catch(function(err) {
          console.log('ERR5 ' + err)
        })
        .then(function(result) {
          totalResult.push(result)
          //console.log(util.inspect(result, false, null, true))
          return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/czech-republic/extraliga/', 5, 4)
        })
        .catch(function(err) {
          console.log('ERR6 ' + err)
        })
        .then(function(result) {
          totalResult.push(result)
          //console.log(util.inspect(result, false, null, true))
          return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/sweden/shl/', 6, 4)
        })
        .catch(function(err) {
          console.log('ERR7 ' + err)
        })
        .then(function(result) {
          totalResult.push(result)
          //console.log(util.inspect(result, false, null, true))
          return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/norway/get-ligaen/', 6, 4)
        })
        .catch(function(err) {
          console.log('ERR8 ' + err)
        })
        .then(function(result) {
          totalResult.push(result)
          //console.log(util.inspect(result, false, null, true))
          return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/slovakia/tipsport-liga/', 6, 4)
        })
        .catch(function(err) {
          console.log('ERR9 ' + err)
        })
        .then(function(result) {
          totalResult.push(result)
          //console.log(util.inspect(result, false, null, true))
          return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/switzerland/national-league/', 5, 4)
        })
        .catch(function(err) {
          console.log('ERR10 ' + err)
        })*/
        .then(function(result) {
          totalResult.push(result)
          //console.log(util.inspect(result, false, null, true))
          //browser.close()
          resolve(totalResult)
          // await browser.close()
        })
        .catch(function(err) {
          console.log('ERR11 ' + err)
        })
    })
  })

// getAllResults_().then(result => console.log(util.inspect(result, false, null, true)))
/*
getAllResults().then(finalResult => {
  console.log('\n')
  console.log('TOTAL RESULTS')
  console.log('\n')
  console.log(util.inspect(finalResult, false, null, true))
})
*/

function resolveAllBasketBall(browser) {
  return new Promise(resolve => {
    let totalResult = []
    getBasketBallResult(browser, 'https://www.betexplorer.com/basketball/usa/nba/', 215, 4)

  });
}

function resolveAllHockey(browser) {
  return new Promise(resolve => {
    let totalResult = []
    getHockeyResultV2(browser, 'https://www.betexplorer.com/hockey/russia/khl/', 6, 5)
      /*
            .then(function(result) {
              totalResult.push(result)
              return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/russia/khl/', 5, 4)
            })
            .then(function(result) {
              totalResult.push(result)
              return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/france/ligue-magnus/', 6, 4)
            })
            // getHockeyResult(browser, 'https://www.betexplorer.com/hockey/russia/khl/', 6, 4)

            .then(function(result) {
              totalResult.push(result)
              return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/germany/del/', 6, 4)
            })*/
      /*    .then(function(result) {
            totalResult.push(result)
            return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/finland/liiga/', 5, 4)
          })
          .then(function(result) {
            totalResult.push(result)
            return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/usa/nhl/', 6, 4)
          })
          .then(function(result) {
            totalResult.push(result)
            return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/czech-republic/extraliga/', 5, 4)
          })
          .then(function(result) {
            totalResult.push(result)
            return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/sweden/shl/', 6, 4)
          })*/
      /*
            .then(function(result) {
              totalResult.push(result)
              return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/norway/get-ligaen/', 6, 4)
            })
            .then(function(result) {
              totalResult.push(result)
              return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/slovakia/tipsport-liga/', 6, 4)
            })
            .then(function(result) {
              totalResult.push(result)
              return getHockeyResult(browser, 'https://www.betexplorer.com/hockey/switzerland/national-league/', 5, 4)
            })*/
      .then(function(result) {
        totalResult.push(result)
        resolve(totalResult)
      })
  });
}

function getBasketBallEventsPredictionsByUrl(browser, url, under_check, iteration_check) {
  return new Promise(resolve => {
    getBasketBallResult(browser, url, under_check, iteration_check)
      .then(function(result) {
        resolve(result)
      })
  });
}

function getHockeyEventsPredictionsByUrl(browser, url, under_check, iteration_check) {
  return new Promise(resolve => {
    getHockeyResultV2(browser, url, under_check, iteration_check)
      .then(function(result) {
        resolve(result)
      })
  });
}

function getSoccerEventsPredictionsByUrl(browser, url, iteration_check) {
  return new Promise(resolve => {
    getSoccerResult(browser, url, iteration_check)
      .then(function(result) {
        resolve(result)
      })
  });
}

async function getAllHockeyResults() {
  console.log('calling getAllHockeyResults');
  const browser = await puppeteer.launch(launchOptions);
  var result = await resolveAllHockey(browser);
  await browser.close()
  return result
}

async function getAllBasketBallResults() {
  console.log('calling getAllBasketBallResults');
  const browser = await puppeteer.launch(launchOptions);
  var result = await resolveAllBasketBall(browser);
  await browser.close()
  return result
}

async function getBasketBallEventsPredictions(url, under_check, iteration_check) {
  console.log('calling getBasketBallEventsPredictions: ', url);
  const browser = await puppeteer.launch(launchOptions);
  var result = await getBasketBallEventsPredictionsByUrl(browser, url, under_check, iteration_check);
  await browser.close()
  return result
}

async function getHockeyEventsPredictions(url, under_check, iteration_check) {
  console.log('calling getHockeyEventsPredictions: ', url);

  const browser = await puppeteer.launch(launchOptions);
  var result = await getHockeyEventsPredictionsByUrl(browser, url, under_check, iteration_check);
  await browser.close()
  return result
}

async function getSoccerEventsPredictions(url, iteration_check) {
  console.log('calling getSoccerEventsPredictions: ', url);
  const browser = await puppeteer.launch(launchOptions);
  var result = await getSoccerEventsPredictionsByUrl(browser, url, iteration_check);
  await browser.close()
  return result
}

// getAllHockeyResults().then((res) => console.log(util.inspect(res, false, null, true)));
// getAllBasketBallResults().then((res) => console.log(util.inspect(res, false, null, true)));



// module.exports = getAllResults;
module.exports = {
  getHockeyEventsPredictions,
  getSoccerEventsPredictions,
  getBasketBallEventsPredictions
};
// module.exports = getSoccerEventsPredictions;

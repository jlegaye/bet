const puppeteer = require('puppeteer')
const util = require('util')
const Base64 = require('js-base64').Base64;
// const CREDS = require('./creds');
const winamaxCreds = require('./winamaxCredentials')
require('events').EventEmitter.defaultMaxListeners = 50;


const getWinamaxBets = async (browser) => {
  const page = await browser.newPage()
  await page.goto('https://www.winamax.fr/paris-sportifs/history', {
    timeout: 500000,
    waitUntil: 'networkidle0'
  })
  await page.waitFor(2000)
  // await page.waitForNavigation();
  await page.click('#login-toggle')
  await page.waitFor(1000)
  await page.click('#loginbox_email');
  await page.keyboard.type(Base64.decode(winamaxCreds.login));

  await page.click('#loginbox_password');
  await page.keyboard.type(Base64.decode(winamaxCreds.password));

  await page.click('#loginbox_birthday');
  await page.keyboard.type(winamaxCreds.day);
  await page.click('#loginbox_birthmonth');
  await page.keyboard.type(winamaxCreds.month);
  await page.click('#loginbox_birthyear');
  await page.keyboard.type(winamaxCreds.year);
  await page.click('#login-button');


  await page.waitFor(5000)
  let pageNumber = 1
/*  for (pageNumber; pageNumber < 50; pageNumber++) {
    await page.click('.sc-jMMfwr .sc-fkyLDJ:nth-child(1) .sc-cHSUfg *:nth-child(3)');
    await page.waitFor(200)
  }*/

  let betsInPage = await getBetsInPage(page)
  console.log('page: ' + pageNumber)
  await page.waitFor(200)
  // let isLastPage = await getIsLastPage(page)
  // let pageNumber = 2
  pageNumber++
  while (pageNumber !== 20) {

  // while (!isLastPage) {

    await page.click('.sc-jMMfwr .sc-fkyLDJ:nth-child(1) .sc-cHSUfg *:nth-child(3)');
    // await page.click('.sc-RcBXQ .sc-ekkqgF:nth-child(1) .sc-fkyLDJ *:nth-child(3)');
    // await page.click('.sc-kLIISr .sc-bmyXtO:nth-child(1) .sc-cbkKFq *:nth-child(3)');
    await page.waitFor(1600)
    betsInPage = betsInPage.concat(await getBetsInPage(page))
    await page.waitFor(150)
    console.log('page: ' + pageNumber)
    pageNumber++

    // isLastPage = await getIsLastPage(page)
  }

  // if(!nextButton.hasAttribute("disabled")){

  // }

  await page.close();
  //await browser.close();
  console.log('betsInPage: ', betsInPage)
  return betsInPage;
}

const getIsLastPage = async (page) => {
  let isLastPage = await page.evaluate(() => {
    // await page.click('.sc-jMMfwr .sc-fkyLDJ:nth-child(1) .sc-cHSUfg *:nth-child(3)');
    let elements = Array.from(document.querySelectorAll('.sc-jMMfwr .sc-fkyLDJ:nth-child(1) .sc-cHSUfg button'));
    // let elements = Array.from(document.querySelectorAll('.sc-kLIISr .sc-bmyXtO:nth-child(1) .sc-cbkKFq button'));
    return elements[1].hasAttribute('disabled')
  });
  return isLastPage
}


const getBetsInPage = async (page) => {
  const result = await page.evaluate(() =>

    {

      // let elements = document.querySelectorAll('.sc-dTdPqK');
      let elements = document.querySelectorAll('.sc-cBrjTV');
      let lastBets = [];
      for (var element of elements) {
        let idStr = ''
        let type = ''
        if (element.querySelector('.sc-elNKlv')) {
          idStr = element.querySelector('.sc-elNKlv').innerText.trim();
        }

        let id = idStr.substr(idStr.indexOf('/') + 1, idStr.length).trim()
        if (element.querySelector('.sc-cZBZkQ')) {
          type = element.querySelector('.sc-cZBZkQ').innerText.trim();
        }

        let eventElmts = element.querySelectorAll('.sc-cJOK');
        let events = [];
        for (var eventElmt of eventElmts) {

          let eventName = ''
          let eventTime = new Date().getTime()
          let betDesc = ''
          if (eventElmt.querySelector('.sc-ejGVNB')) {
            eventName = eventElmt.querySelector('.sc-ejGVNB').innerText.trim()
          }
          if (eventElmt.querySelector('.time')) {
            eventTime = new Date(eventElmt.querySelector('.time').innerText.trim().replace('à ', '').replace('déc.', 'decembre')).getTime();
          }
          if (eventElmt.querySelector('.sc-dHmInP:nth-child(1)')) {

            betDesc = eventElmt.querySelector('.sc-dHmInP:nth-child(1)').innerText.trim();
          }
          let betTechnique = ""
          if (betDesc.includes('Nombre de buts') && betDesc.includes('Moins de')) {
            betTechnique = "under buts"
          } else if (betDesc.includes('Nombre de points') && betDesc.includes('Moins de')) {
            betTechnique = "under points"
          } else if (betDesc.includes('Nombre de points') && betDesc.includes('Plus de')) {
            betTechnique = "over points"
          } else if (betDesc.includes('2-3 buts')) {
            betTechnique = "2-3 buts"
          } else if (betDesc.includes('Match nul')) {
            betTechnique = "match nul"
          }
          let eventHome = ""
          let eventAway = ""
          if (eventName.includes(' - ')) {
            eventHome = eventName.substring(0, eventName.indexOf(' - '));
            eventAway = eventName.substr(eventName.indexOf(' - ') + 3);
          }
          // let betOdds = eventElmt.querySelector('.sc-CtfFt:nth-child(2)').innerText.trim();
          let betOdds = '';
          if (eventElmt.querySelector('.sc-dHmInP b')) {
            betOdds = eventElmt.querySelector('.sc-dHmInP b').innerText.trim();
          }
          let eventResult = '';
          if (eventElmt.querySelector('.sc-iIHSe')) {
            eventResult = eventElmt.querySelector('.sc-iIHSe').innerText.trim();
          }

          let svgClass = element.querySelector('svg').getAttribute('class');
          let sport = '';
          if (svgClass.includes('sport-icon-12')) {
            sport = 'rugby'
          } else if (svgClass.includes('sport-icon-19')) {
            sport = 'snooker'
          } else if (svgClass.includes('sport-icon-31')) {
            sport = 'badminton'
          } else if (svgClass.includes('sport-icon-1')) {
            sport = 'soccer'
          } else if (svgClass.includes('sport-icon-2')) {
            sport = 'basketball'
          } else if (svgClass.includes('sport-icon-4')) {
            sport = 'hockey'
          } else if (svgClass.includes('sport-icon-5')) {
            sport = 'tennis'
          } else if (svgClass.includes('sport-icon-100000')) {
            sport = 'other'
          }
          events.push({
            sport,
            eventName,
            eventResult,
            eventTime,
            eventHome,
            eventAway,
            betDesc,
            betTechnique,
            betOdds

          })
        }
        let betResultTime = Math.max(...events.map(event => event.eventTime))
        let miseString = element.querySelector('.sc-bYwvMP').innerText.trim();
        let oddsStr = ''
        if (type.includes('SIMPLE')) {
          oddsStr = events[0].betOdds
        } else if (type.includes('COMBIN')) {
          let index = miseString.indexOf('ote')
          let oddsString = miseString.substr(index + 5, miseString.length).trim()
          oddsStr = oddsString.substr(0, 4)
          // oddsStr = element.querySelector('.sc-bYwvMP .sc-jKmXuR').innerText.trim();
          // oddsStr = '';
        }
        oddsStr = oddsStr.replace(',', '.').trim()
        // let odds = Math.round(parseFloat(oddsStr) * 100) / 100
        let odds = oddsStr
        let status = element.querySelector('.sc-hRmvpr').innerText.trim();
        // let status = '';
        // let mise = parseFloat(element.querySelector('.sc-jVODtj .sc-fzsDOv span:nth-child(1) b').innerText.trim().replace(' €', ''));
        let betTime = new Date(element.querySelector('.sc-kkbgRg .time').innerText.trim().replace('à ', '').replace('déc.', 'decembre')).getTime();
        // let betTime = 12155;

        let miseString2 = miseString.substr(miseString.indexOf('Mise') + 4, miseString.indexOf('€')).trim()
        let miseString3 = miseString2.substr(0, miseString.indexOf('€')).trim()
        let miseString4 = miseString3.substr(miseString3.indexOf(':') + 1, miseString3.indexOf('€')).trim()
        let miseString5 = miseString4.substr(0, miseString4.indexOf('€')).replace(',', '.').trim()
        // let miseString = 'test';
        // let miseStr = miseString.substr(0, miseString.indexOf('€')).replace(',', '.').trim();
        // let mise = miseString.substr(miseString.indexOf('Mise'), miseString.indexOf('Cote')).trim()
        let mise = Math.round(parseFloat(miseString5) * 100) / 100
        // let mise = miseString5
        let result = 0
        if (status.includes('GAGN') || status.includes('CASHOUT')) {
          // let resultString = element.querySelector('.sc-bYwvMP div:nth-child(2) b').innerText.trim()
          let resultString = miseString.substr(miseString.indexOf('ains') + 6, miseString.length).trim()
          let resultString2 = resultString.substr(0, resultString.indexOf('€')).replace(',', '.').trim();
          result = Math.round((parseFloat(resultString2) - mise) * 100) / 100;
          // let resultString = ''
          /*  let resultRegex = resultString.substr(0, miseString.indexOf('€')).replace(',', '.').trim();

            if (resultRegex) {
              let resultStr = resultRegex[0]
              let resultStr2 = resultStr.substr(resultStr.indexOf(':') + 1, resultStr.length).trim();
              let resultStr3 = resultStr2.substr(0, resultStr2.indexOf('€')).replace(',', '.').trim();
              result = Math.round((parseFloat(resultStr3) - mise) * 100) / 100;
              // result = parseFloat(resultRegex[0].replace(',', '.'))
            }*/
          // let resultStr = resultString.substr(0, resultString.indexOf('€')).replace(',', '.').trim();
          // result = parseFloat(resultStr)
        } else if (status.includes('PERDU')) {
          result = -mise
        }

        lastBets.push({
          id,
          type,
          status,
          betTime,
          betResultTime,
          mise,
          odds,
          events,
          result
        })
      }
      console.log('lastBets')
      console.log(lastBets)
      return lastBets;
    }
  )
  return result;
};

async function getAllWinamaxBets() {
  // return new Promise(resolve => {
  console.log('calling');
  const browser = await puppeteer.launch({
    headless: true
  })
  var result = await getWinamaxBets(browser);
  console.log(result)
  await browser.close()
  return result
  // })
}
/*
getAllWinamaxBets().then((res) => {
  console.log(util.inspect(res, false, null, true))
  console.log(res.length)
});*/

module.exports = getAllWinamaxBets;

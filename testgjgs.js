'use strict';

const puppeteer = require('puppeteer');
const Browser = require('./browser');
const Pages = require('./pages');

function byte2string(arrays_) {
    let tmp = arrays_.map(function (item) {
        return String.fromCharCode(item);
    })
    tmp = tmp.join("");
    return tmp;
}

const hasValid = async (pages_) => {
    let _tmpPage = await pages_.open('http://www.gsxt.gov.cn/corp-query-geetest-validate-input.html?token=91957721');
    await _tmpPage.waitForSelector('pre');
    await _tmpPage.addScriptTag({
        path: "./jquery.js"
    });
    let _bytes = await _tmpPage.evaluate(() => {
        return jQuery("pre").text();
    });
    // console.info(_bytes);
    console.info(byte2string(eval(_bytes)));
}

async function submitQuery(page_, keyword_) {
    await page_.waitForSelector('#keyword');
    let tag_position = await getPosition(page_, '#keyword');
    page_.mouse.move(tag_position.btn_left + 10, tag_position.btn_top, {
        steps: 30
    });
    await page_.click('#keyword', {
        delay: 1000
    });
    await page_.type('#keyword', keyword_, {
        delay: 500
    });
    await page_.waitForSelector('#btn_query');
    tag_position = await getPosition(page_, '#btn_query');
    page_.mouse.move(tag_position.btn_left + 10, tag_position.btn_top, {
        steps: 30
    })
    await page_.click('#btn_query', {
        delay: 200
    });

    await page_.waitForNavigation();

}
async function getPosition(page_, selector_) {
    await page_.waitForSelector(selector_);
    const btn_position = await page_.evaluate((sel_) => {
        const {
            clientWidth,
            clientHeight
        } = document.querySelector(sel_);
        return {
            btn_left: clientWidth / 2 - 104,
            btn_top: clientHeight / 2 + 59
        }
    }, selector_)
    return btn_position;
}

async function grabList(pages_, page_) {
    // await page_.addScriptTag({
    //     path: "./jquery.js"
    // });
    let _resultsTmp = await page_.evaluate(() => {
        const _tmpResults = [];
        const contents = $("#content>section");
        for (let i = 0; i < contents.length; i++) {
            if (i >= 5) {
                break;
            }
            let _tmpContent = {};
            _tmpContent['author'] = jQuery(contents[i]).find('.info>.userinfo>a')[1].text;
            let _tmp = jQuery(contents[i]).find('.info>h2>a')[0];
            _tmpContent['href'] = _tmp.href;
            _tmpResults[_tmpResults.length] = _tmpContent;

        }
        return _tmpResults;
    });

    const _results = await grabContent(pages_, _resultsTmp);
    console.info(_results);
    return _results;

}

(async () => {
    let browser = await Browser.launch();
    let pages = new Pages(browser);
    let homePage = await pages.open('http://www.gsxt.gov.cn');
    await homePage.waitForNavigation();
    await hasValid(pages);
    await submitQuery(homePage, '深圳市长亮科技股份有限公司');
})();
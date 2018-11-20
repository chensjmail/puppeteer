'use strict';

const Browser = require('./browser');
const Pages = require('./pages');
const Verification = require('./verification');
//测试
async function login(page_, user_name_, pass_ward_) {
    let tmp = await page_.waitForSelector('a[data-type=login]');
    // 1.打开登录页面
    await page_.click('a[data-type=login]');
    // 2.输入账号密码
    await page_.type('input[data-type=email]', user_name_, {
        delay: 100
    });
    await page_.type('input[placeholder=密码]', pass_ward_, {
        delay: 100
    });
    // 3.点击验证
    await page_.waitForSelector('.geetest_radar_tip');
    await page_.click('.geetest_radar_tip', {
        delay: 100
    });
    return await Verification.verification(page_);
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
async function grabContent(pages_, resultsTmp_) {
    const _results = [];
    for (let i = 0; i < resultsTmp_.length; i++) {
        let _tmp = resultsTmp_[i];
        let _tmpPage = await pages_.open(_tmp['href']);
        let _article = await _tmpPage.evaluate(() => {
            return {
                'title': $("#content>h1").text(),
                'content': $("#content>article.lazy_content").text()
            };
        });
        console.info(_tmp);
        _tmp['title'] = _article.title;
        _tmp['content'] = _article.content;
        _results[_results.length] = _tmp;
        await _tmpPage.close();
    }
    return _results;
}

module.exports = {
    async crawler(url_, user_name_, pass_ward_) {
        const device = 'iPhone 6 Plus';
        const browser = await Browser.launch();
        const pages = new Pages(browser);
        const homePage = await pages.open(url_, {
            device: device
        });
        const verification = await login(homePage, user_name_, pass_ward_);
        let result = {};
        if (verification.isSuccess) {
            result = await grabList(pages, homePage);
        }
        await homePage.close();
        await browser.close();
        return result;
    }
};

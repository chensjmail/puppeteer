'use strict';

const devices = require('puppeteer/DeviceDescriptors');
const phone = devices['iPhone 6 Plus'];

module.exports = function (browser_) {
    this.open = async function (url_, options_) {
        options_ = options_ || {};
        let page = await browser_.newPage();
        await page.on('console', msg => {
            if (typeof msg === 'object') {
                console.dir(msg)
            } else {
                console.log(msg)
            }
        });
        if (options_.device) {
            await page.emulate(devices[options_.device]);
        }
        await page.goto(url_, {
            timeout: options_.timeout || 300000
        });
        return page;
    }
};
"use strict";

const puppeteer = require("puppeteer");

module.exports = {
    async launch(options_) {
        let browser = await puppeteer.launch({
            //executablePath: '/app/chrome/Chromium',//chrome安装位置
            // timeout: 50000,
            devtools: false,
            // slowMo: 200,
            headless: false //这里我设置成false主要是为了让大家看到效果，设置为true就不会打开浏览器
        });
        return browser;
    }
};

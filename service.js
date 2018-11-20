'use strict';
const express = require('express');
const app = express();
const Crawler = require('./crawler');
const router = express.Router();

//http://localhost:5000/crawler?loginName=chenshijie&loginPwd=9556886&url=https://www.qdfuns.com
router.get('/crawler', (req, res, next) => {
    (async () => {
        console.info(req.query.url)
        console.info(req.query.loginName)
        console.info(req.query.loginPwd)
        let result = await Crawler.crawler(req.query.url, req.query.loginName, req.query.loginPwd);
        if (result == null) {
            res.send({
                status: 'failure'
            });
        } else {
            res.send({
                result: result,
                status: 'success'
            });
        }
    })();
});

console.info('ip:5000/*');
app.use('/', router);
app.listen(5000, function () {});

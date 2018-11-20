'use strict';

let timeout = function (delay) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(1)
            } catch (e) {
                reject(0)
            }
        }, delay);
    })
}

module.exports = (() => {
    let times = 0 // 执行重新滑动的次数
    let MAX_TRY_TIMES = 3; //重试最大次数
    let _this = this;
    this.verification = async (page_) => {
        await timeout(1000);
        let btn_position = await getBtnPosition(page_);
        // 滑动
        return await drag(page_, btn_position);
    };

    /**
     * 计算按钮需要滑动的距离 
     * */
    async function calculateDistance(page_) {
        await page_.waitForSelector('canvas.geetest_canvas_fullbg[style*=\'display: none;\']');
        const _distance = await page_.evaluate(() => {
            // 比较像素,找到缺口的大概位置
            function compare(document) {
                const ctx1 = document.querySelector('.geetest_canvas_fullbg'); // 完成图片
                const ctx2 = document.querySelector('.geetest_canvas_bg'); // 带缺口图片
                const pixelDifference = 30; // 像素差
                let res = []; // 保存像素差较大的x坐标
                // 对比像素
                for (let i = 57; i < 260; i++) {
                    for (let j = 1; j < 160; j++) {
                        const imgData1 = ctx1.getContext("2d").getImageData(1 * i, 1 * j, 1, 1)
                        const imgData2 = ctx2.getContext("2d").getImageData(1 * i, 1 * j, 1, 1)
                        const data1 = imgData1.data;
                        const data2 = imgData2.data;
                        const res1 = Math.abs(data1[0] - data2[0]);
                        const res2 = Math.abs(data1[1] - data2[1]);
                        const res3 = Math.abs(data1[2] - data2[2]);
                        if (!(res1 < pixelDifference && res2 < pixelDifference && res3 < pixelDifference)) {
                            if (!res.includes(i)) {
                                res.push(i);
                            }
                        }
                    }
                }
                // 返回像素差最大值跟最小值，经过调试最小值往左小7像素，最大值往左54像素
                return {
                    min: res[0] - 7,
                    max: res[res.length - 1] - 54
                }
            }
            return compare(document)
        });
        return _distance;
    }
    /**
     * 计算滑块位置
     */
    async function getBtnPosition(page_) {
        await page_.waitForSelector('.geetest_popup_ghost');
        const btn_position = await page_.evaluate(() => {
            const {
                clientWidth,
                clientHeight
            } = document.querySelector('.geetest_popup_ghost')
            return {
                btn_left: clientWidth / 2 - 104,
                btn_top: clientHeight / 2 + 59
            }
        })
        return btn_position;
    }
    /**
     * 尝试滑动按钮
     * @param distances_ 滑动距离
     * */
    async function tryValidation(page_, btn_position_) {
        times++;
        await page_.click('.geetest_small>.geetest_refresh_1', {
            delay: 100
        });
        let distances_ = await calculateDistance(page_);
        console.info('distance=' + JSON.stringify(distances_));
        //将距离拆分成两段，模拟正常人的行为
        const distance1 = distances_.min * 0.6666;
        const distance2 = distances_.min + Math.floor(Math.random() * 10 + 1);
        console.info('random=' + (distance2 - distances_.min));
        page_.mouse.click(btn_position_.btn_left, btn_position_.btn_top, {
            delay: 2000
        });
        page_.mouse.down(btn_position_.btn_left, btn_position_.btn_top);
        page_.mouse.move(btn_position_.btn_left + distance1, btn_position_.btn_top, {
            steps: 30
        });
        await timeout(800);
        page_.mouse.move(btn_position_.btn_left + distance2, btn_position_.btn_top, {
            steps: 30
        });
        await timeout(800);
        page_.mouse.move(btn_position_.btn_left + distances_.min, btn_position_.btn_top, {
            steps: 20
        })
        await timeout(800);
        page_.mouse.up();
        await timeout(2000);
        // 判断是否验证成功
        let resulet = await page_.evaluate(() => {
            return document.querySelector('.geetest_success_radar_tip_content') && document.querySelector('.geetest_success_radar_tip_content').innerHTML;
        })
        await timeout(1000);
        // 判断是否需要重新计算距离
        const reDistance = await page_.evaluate(() => {
            return document.querySelector('.geetest_result_content') && document.querySelector('.geetest_result_content').innerHTML
        })
        let isSuccess = resulet === '验证成功';
        if (!isSuccess) {
            if (times <= MAX_TRY_TIMES) {
                console.info('已重试次数:' + times);
                if (reDistance.includes('怪物吃了拼图')) {
                    await timeout(3000);
                    console.log('怪物吃了拼图，重新滑动');
                    await tryValidation(page_, btn_position_);
                } else {
                    console.log('重新滑动');
                    await tryValidation(page_, btn_position_);
                }
            } else {
                console.info('已重试次数已超过最大重试试次:' + MAX_TRY_TIMES);
                resulet = '验证失败';
            }
        }
        return {
            isSuccess: isSuccess,
            reDistance: reDistance.includes('怪物吃了拼图'),
            resulet: resulet
        }
    }
    /**
     * 拖动滑块
     * */
    async function drag(page_, btn_position_) {
        const result = await tryValidation(page_, btn_position_);
        if (result.isSuccess) {
            console.log('验证成功');
            page_.click('#modal-member-login button');
        } else {
            console.log('验证失败');
        }
        return result;
    }
    return this;
})();
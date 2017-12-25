import * as crypto from 'crypto';
import * as fetch from 'node-fetch';
import * as utils from './utils';

console.log("=== The ultimate money machine 0.9 ===\n");

const hmac = crypto.createHmac('sha256', process.env.API_SECRET);

let prices = {};
let coinNum = 0;
let coins = [];
let totalBtc = 0;

let url = "https://api.binance.com/api/v1/ticker/allPrices";
console.log("Reading prices:");
console.log("GET " + url);
fetch(url)
.then(res => res.json())
.then(allPrices => utils.asyncLoop(allPrices, (i,next) => {
    prices[i.symbol] = parseFloat(i.price);
    next();
}))
.then(() => {
    let params = "timestamp=" + Date.now();
    hmac.update(params);
    url = "https://api.binance.com/api/v3/account?" + params + "&signature=" + hmac.digest('hex');
    console.log("Reading account assets:");
    console.log("GET " + url);
    return fetch(url, {headers: {"X-MBX-APIKEY": process.env.API_KEY}});
})
.then(res => res.json())
.then(res => utils.asyncLoop(res.balances, (i,next) => {
    let val = parseFloat(i.free);
    if (val > 0 && i.asset !=='BTC'/* && i.asset !=='BNB'*/) {
        i.btc = val * prices[i.asset + 'BTC'];
        console.log(val + " " + i.asset + " * " + prices[i.asset + 'BTC'] + " " + i.asset + "BTC = " + i.btc + " BTC");
        totalBtc += i.btc;
        coins.push(i);
        coinNum++;
    }
    next();
}))
.then(() => {
    console.log("Found " + coinNum + " assets with total value " + totalBtc + " BTC.");
})
.catch(err => {
    console.log(err);
});

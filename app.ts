import * as crypto from 'crypto';
import * as fetch from 'node-fetch';
import * as utils from './utils';

console.log("=== The ultimate money machine 0.9 ===\n");

const hmac = crypto.createHmac('sha256', process.env.API_SECRET);

let params = "timestamp=" + Date.now();
hmac.update(params);

let signature = hmac.digest('hex');

let url = "https://api.binance.com/api/v3/account?" + params + "&signature=" + signature;
console.log("Reading account assets:");
console.log("GET " + url);

let coinNum = 0;

fetch(url, {headers: {"X-MBX-APIKEY": process.env.API_KEY}})
.then(res => res.json())
.then(res => utils.asyncLoop(res.balances, (i,next) => {
    let asset = parseFloat(i.free);
    if (asset > 0 && i.asset !=='BTC') coinNum++;
    next();
}))
.then(() => {
    console.log("Found " + coinNum + " assets.");
})
.catch(err => {
    console.log(err);
});

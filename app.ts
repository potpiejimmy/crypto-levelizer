import * as crypto from 'crypto';
import * as fetch from 'node-fetch';

console.log("Hello world " + Date.now());

const hmac = crypto.createHmac('sha256', process.env.API_SECRET);

let params = "timestamp=" + Date.now();
hmac.update(params);

let signature = hmac.digest('hex');

let url = "https://api.binance.com/api/v3/account?" + params + "&signature=" + signature;
console.log("GET " + url);

fetch(url, {headers: {"X-MBX-APIKEY": process.env.API_KEY}})
.then(res => res.json())
.then(res => {
    console.log(res);
})
.catch(err => {
    console.log(err);
});

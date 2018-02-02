import * as crypto from 'crypto';
import * as fetch from 'node-fetch';
import * as utils from './utils';

const REF_CUR = 'BNB'; // reference currency for trading
const IGNORE_LIST = []; // currencies to ignore

console.log("=== The ultimate money machine is running: " + new Date() + " ===\n");

if (!process.env.API_KEY || !process.env.API_SECRET) {
    console.log("Please set API_KEY and API_SECRET environment variables.");
    process.exit(1);
}

let prices = {};  // maps symbols to current prices (float)
let coins = [];   // current coins to handle
let totalValBefore = 0; // total REF_CUR value before trading
let totalAverage = 0; // average REF_CUR value (before trading)
let totalValAfter = 0; // total REF_CUR value after trading
let totalTradeVolume = 0; // total theoretical trade volume (sum of all diff absolutes)
let totalTradeVolumeActual = 0; // total actual trade volume after trading
let totalCommission = 0; // total commission

// first, get all current prices from the public API
let url = "https://api.binance.com/api/v1/ticker/allPrices";
console.log("Reading prices: GET " + url);
fetch(url)
.then(res => res.json())
.then(allPrices => {
    // add all prices to our map
    allPrices.forEach(i => prices[i.symbol] = parseFloat(i.price));
    prices[REF_CUR+REF_CUR] = 1.0;

    // now, read all account assets
    return readAssets();
})
.then(res => res.json())
.then(res => {
    res.balances.forEach(i => {
        if (IGNORE_LIST.indexOf(i.asset) == -1 && prices[i.asset + REF_CUR]) {
            let val = parseFloat(i.free);
            i.refVal = val * prices[i.asset + REF_CUR];
            console.log(val + " " + i.asset + " * " + prices[i.asset + REF_CUR] + " " + i.asset + REF_CUR + " = " + i.refVal + " " + REF_CUR);
            totalValBefore += i.refVal;
            coins.push(i);
        }
    });
    console.log("Found " + coins.length + " assets with total value " + totalValBefore + " " + REF_CUR + ".\n");
    totalAverage = totalValBefore / coins.length;
    console.log("Now trading all coins to match the average of " + totalAverage + " " + REF_CUR + ".");
    // store diff member (difference to average)
    coins.forEach(i => i.diff = i.refVal - totalAverage);
    // sort by diff, descending, so that we are selling before buying with REF_CUR
    coins = coins.sort((a,b) => b.diff - a.diff);
    // now loop, wait 500ms between trades
    return utils.asyncLoop(coins, i => {
        return retrade(i).then(() => new Promise<void>((resolve) => setTimeout(resolve, 500)))
    });
})
.then(()=> {
    // now, read all account assets again (after trading)
    return readAssets();
})
.then(res => res.json())
.then(res => {
    res.balances.forEach(i => {
        if (IGNORE_LIST.indexOf(i.asset) == -1 && prices[i.asset + REF_CUR]) totalValAfter += parseFloat(i.free) * prices[i.asset + REF_CUR];
    });
    dumpInfoToStdErr();
    console.log("Done.");
})
.catch(err => {
    console.log(err);
});

function readAssets(): Promise<any> {
    let params = "timestamp=" + Date.now();
    url = "https://api.binance.com/api/v3/account?" + params + "&signature=" + sign(params);
    console.log("Reading account assets: GET " + url);
    return fetch(url, {headers: {"X-MBX-APIKEY": process.env.API_KEY}});
}

function retrade(coin) : Promise<any> {
    if (coin.asset === REF_CUR) return Promise.resolve();
    let diff = coin.refVal - totalAverage;
    let absDiff = Math.abs(diff);
    totalTradeVolume += absDiff;
    let quantity: number = absDiff/prices[coin.asset + REF_CUR];
    quantity = parseFloat(quantity.toPrecision(2));
    let side = (diff > 0 ? 'SELL' : 'BUY');
    process.stdout.write(side + " " + absDiff + " " + REF_CUR + " of " + coin.asset + " = " + quantity + "...");

    let params = "symbol=" + coin.asset + REF_CUR + "&side=" + side + "&type=MARKET&quantity=" + quantity + "&newOrderRespType=FULL&timestamp=" + Date.now();
    url = "https://api.binance.com/api/v3/order?" + params + "&signature=" + sign(params);
    return fetch(url, {method:'POST', headers: {"X-MBX-APIKEY": process.env.API_KEY}})
           .then(res => res.json())
           .then(res => {
               if (res.code && res.code!=0) console.log(res.msg);
               else {
                   console.log("OK");
                   if (res.fills) {
                        res.fills.forEach(i => {
                            totalTradeVolumeActual += parseFloat(i.qty) * parseFloat(i.price);
                            totalCommission += parseFloat(i.commission);
                        });
                   }
               }
            });
}

function sign(params : string) : string {
    return crypto.createHmac('sha256', process.env.API_SECRET).update(params).digest('hex');
}

function refCurToUsd(val) : string {
    return "$" + (val * prices[REF_CUR + 'USDT']).toFixed(2)
}

function dumpInfoToStdErr() {
    let dinfo = {
        date: "" + new Date(),
        valueBefore: refCurToUsd(totalValBefore),
        tradeVolume: refCurToUsd(totalTradeVolume),
        tradeVolumeActual: refCurToUsd(totalTradeVolumeActual),
        commission: refCurToUsd(totalCommission),
        valueAfter: refCurToUsd(totalValAfter)
    }
    process.stderr.write(JSON.stringify(dinfo) + "\n");
}
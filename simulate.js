const readline = require('readline');
const COIN_NUM = 30;
var coinVals = [];
var coinAssets = [];
var i = 0;
var day = 0;
while (i < COIN_NUM) {
    coinVals[i] = 1.5;
    coinAssets[i++] = 1.0;
}

console.log("Your initial balance: $" + getBalance());

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        process.exit();
    } else {
        i = 0;
        while (i < COIN_NUM) {
            var factor = Math.random() + 1;
            coinVals[i] = Math.random() < 0.5 ? coinVals[i] * factor : coinVals[i] / factor;
            i++;
        }
        var newBalance = getBalance();
        console.log("Your new balance after " + (++day) + " days: $" + newBalance);
        console.log("Now rebalancing all coins. Press key to continue...");
        var newLevel = newBalance / COIN_NUM;
        i = 0;
        while (i < COIN_NUM) {coinAssets[i] = newLevel / coinVals[i]; i++;}
    }
});
console.log('Press any key...');    

function getBalance() {
    var balance = 0;
    i = 0;
    while (i < COIN_NUM) {
        console.log(coinVals[i] + " * " + coinAssets[i] + " = " + coinVals[i] * coinAssets[i]);
        balance += coinVals[i] * coinAssets[i]; i++;
    }

    return balance;
}

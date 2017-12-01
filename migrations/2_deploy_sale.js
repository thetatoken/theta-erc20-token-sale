var ThetaToken = artifacts.require('ThetaToken');
var ThetaTokenSale = artifacts.require('ThetaTokenSale');

module.exports = function (deployer, network, accounts) {
    // Use the accounts within your migrations.
    var initialBlock = 2000;
    var finalBlock   = 2500;
    var rootAddr     = accounts[0];
    var adminAddr    = accounts[1];
    var whiteListControllerAddr    = accounts[2];
    var exchangeRateControllerAddr = accounts[3];
    var thetaLabReserveAddr = accounts[4];
    var fundDepositAddr     = accounts[5];
    var exchangeRate = 100;
    var thetaToken;
    var tokenSale;

    deployer.deploy(ThetaToken)
        .then(function(){
            console.log('----deploy start----');
            console.log('---------1----------');
            return ThetaToken.deployed();
        })
        .then(function(token) {
            thetaToken = token;
            console.log('---------2----------');
            return deployer.deploy(ThetaTokenSale, rootAddr, adminAddr, 
                whiteListControllerAddr, exchangeRateControllerAddr, thetaLabReserveAddr, fundDepositAddr,
                initialBlock, finalBlock, exchangeRate);
        })
        .then(function () {
            console.log('---------3----------');
            return ThetaTokenSale.deployed();
        })
        .then(function (sale) {
            tokenSale = sale;
            console.log('---------4----------');
            console.log("ThetaTokenSale:     ", tokenSale.address);
            console.log("ThetaToken:         ", thetaToken.address);
            console.log('-----deploy end-----');
        })
        .then(function() {
            console.log('---------5----------');
            return thetaToken.changeController(tokenSale.address, {from: adminAddr, gas: 4700000});
        })
        .then(function() {
            console.log('---------6----------');
            return tokenSale.setThetaToken(thetaToken.address, {from: adminAddr, gas: 4700000});
        })
        .then(function() {
            console.log('---DEPLOY FINISHED---');
        });
};


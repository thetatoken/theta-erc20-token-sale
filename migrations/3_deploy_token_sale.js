var ThetaTokenSale = artifacts.require('ThetaTokenSale');

module.exports = function (deployer, network, accounts) {
    var rootAddr     = '';
    var adminAddr    = '';
    var whiteListControllerAddr    = '';
    var exchangeRateControllerAddr = '';
    var thetaLabReserveAddr = '';
    var fundDepositAddr     = '';
    var initialBlock = 223583611111;
    var finalBlock   = 223583699999;
    var exchangeRate = 30000;

    console.log('---------3----------');
    deployer.deploy(ThetaTokenSale, rootAddr, adminAddr, 
        whiteListControllerAddr, exchangeRateControllerAddr, thetaLabReserveAddr, fundDepositAddr,
        initialBlock, finalBlock, exchangeRate);
};


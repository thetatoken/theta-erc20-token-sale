var ThetaTokenSale = artifacts.require('ThetaTokenSale');

module.exports = function (deployer, network, accounts) {
    var rootAddr     = '';
    var deployerAddr = '';
    var whiteListControllerAddr    = '';
    var exchangeRateControllerAddr = '';
    var thetaLabReserveAddr = '';
    var fundDepositAddr     = '';

    var initialBlock = 223583611111;
    var finalBlock   = 223583699999;
    var exchangeRate = 30000;

    console.log('---------3----------');
    deployer.deploy(ThetaTokenSale, rootAddr, deployerAddr, 
        whiteListControllerAddr, exchangeRateControllerAddr, thetaLabReserveAddr, fundDepositAddr,
        initialBlock, finalBlock, exchangeRate);
};


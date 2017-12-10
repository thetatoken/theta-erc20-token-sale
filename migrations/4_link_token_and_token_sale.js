var ThetaToken = artifacts.require('ThetaToken');
var ThetaTokenSale = artifacts.require('ThetaTokenSale');

module.exports = function (deployer, network, accounts) {
    var adminAddr    = '';
    var thetaToken;
    var thetaTokenSale;

    console.log('---------4----------');
    ThetaToken.deployed()
        .then(function(token) {
            thetaToken = token;
            return ThetaTokenSale.deployed();
        })
        .then(function (token_sale) {
            thetaTokenSale = token_sale;
            console.log('Changing thetaToken controller...');
            return thetaToken.changeController(thetaTokenSale.address, {from: adminAddr});
        })
        .then(function() {
            console.log('Setting thetaToken in thetaTokenSale...');
            return thetaTokenSale.setThetaToken(thetaToken.address, {from: adminAddr});
        })
        .then(function() {
            console.log('---DEPLOY FINISHED---');
        });
};


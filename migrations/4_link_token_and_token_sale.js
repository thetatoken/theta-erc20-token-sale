var ThetaToken = artifacts.require('ThetaToken');
var ThetaTokenSale = artifacts.require('ThetaTokenSale');

module.exports = function (deployer, network, accounts) {
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
            return thetaToken.changeController(thetaTokenSale.address);
        })
        .then(function() {
            console.log('Setting thetaToken in thetaTokenSale...');
            return thetaTokenSale.setThetaToken(thetaToken.address);
        })
        .then(function() {
            console.log('---DEPLOY FINISHED---');
        });
};


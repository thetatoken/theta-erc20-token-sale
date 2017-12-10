var ThetaToken = artifacts.require('ThetaToken');

module.exports = function (deployer, network, accounts) {
    console.log('---------2----------');
    deployer.deploy(ThetaToken);
};


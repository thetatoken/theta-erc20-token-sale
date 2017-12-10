var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer) {
    console.log('---------1----------');
    deployer.deploy(Migrations);
};

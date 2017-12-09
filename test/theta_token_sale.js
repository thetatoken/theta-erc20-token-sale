var ThetaToken = artifacts.require('ThetaToken');
var ThetaTokenSale = artifacts.require('ThetaTokenSale');
contract('ThetaTokenSale', function(accounts) {
    var thetaToken;
    var thetaTokenSale;
    var wallet;

    var precirculationAccount;
    console.log("Imported node Accounts: \n", accounts);

    it ("ThetaTokenSale: deploy", function() {
        console.log('----------------');
        return ThetaToken.deployed()
            .then(function(tt) {
                thetaToken = tt;
                console.log('ThetaToken Address: ' + thetaToken.address);
                return ThetaTokenSale.deployed();
                //return thetaToken.getController();
            })
            .then(function(tts) {
                thetaTokenSale = tts;
                console.log('ThetaTokenSale Address: ' + thetaTokenSale.address);
                return thetaTokenSale.token.call();
            })
            .then(function(token_reference_in_token_sale) {
                console.log('thetaTokenSale.token is ' + token_reference_in_token_sale);
                assert.equal(thetaToken.address, token_reference_in_token_sale, 'thetaTokenSale\'s token is not thetaToken');
                return thetaToken.controller.call();
            })
            .then(function(tt_controller) {
                console.log('thetaToken.controller is: ' + tt_controller);
                assert.equal(thetaTokenSale.address, tt_controller, 'thetaToken\'s controller is not thetaTokenSale');
            });
    });

    it ("ThetaTokenSale: activate sale", function() {
        console.log('----------------');
        console.log('Activating sale..');
        return thetaTokenSale.activated.call()
            .then(function(res) {
                console.log('Sale activation status: ' + res.toString());
                assert.equal(res, false, 'sale activation to be false at the beginning');
            })
            .then(function() {
                console.log('Calling activate sale..');
                return thetaTokenSale.activateSale({from: accounts[1], gas: 4700000}); 
            })
            .then(function() {
                return thetaTokenSale.activated.call();
            })
            .then(function(res) {
                console.log('Sale activation status: ' + res.toString());
                assert.equal(res, true, 'sale should have been activated');
            })
            .then(function() {
                console.log('Calling deactivate sale..');
                return thetaTokenSale.deactivateSale({from: accounts[1], gas: 4700000}); 
            })
            .then(function() {
                return thetaTokenSale.activated.call();
            })
            .then(function(res) {
                console.log('Sale activation status: ' + res.toString());
                assert.equal(res, false, 'sale should have been deactivated');
            });
    });
    
    it("ThetaTokenSale: modify precirculation", function() {
        console.log('----------------');
        precirculationAccount = accounts[9];
        console.log('Add address ' + precirculationAccount + ' to precirculation:');
        return thetaTokenSale.allowPrecirculation(precirculationAccount, {from: accounts[1], gas: 4700000})
            .then(function() {
                console.log('Check if address is added into precirculation..');
                return thetaTokenSale.isPrecirculationAllowed(precirculationAccount, {from: accounts[1], gas: 4700000});
            })
            .then(function(rest) {
                console.log('Result from isPrecirculationAllowed(): ' + rest.valueOf());
                assert.equal(rest.valueOf(), true, "isPrecirculationAllowed should return True");
            })
            .then(function() {
                console.log('Remove  ' + precirculationAccount + ' from precirculation:');
                return thetaTokenSale.disallowPrecirculation(precirculationAccount, {from: accounts[1], gas: 4700000});
            })
            .then(function() {
                console.log('Check if address is removed from precirculation..');
                return thetaTokenSale.isPrecirculationAllowed(precirculationAccount, {from: accounts[1], gas: 4700000});
            })
            .then(function(rest) {
                console.log('Result from isPrecirculationAllowed(): ' + rest.valueOf());
                assert.equal(rest.valueOf(), false, 'isPrecirculationAllowed should return False');
            });
    });

    it ("ThetaTokenSale: allocate presale tokens", function() {
        console.log('----------------');
        presale_receiver = accounts[6];
        presale_amount = new web3.BigNumber(543210);
        theta_reserve_amount = presale_amount.times(60).div(40);
        return thetaTokenSale.getThetaLabsReserve()
            .then(function(res) {
                theta_reserve_address = res;
                console.log('Theta reserve address : ' + theta_reserve_address);
                return thetaToken.balanceOf(theta_reserve_address);
            })
            .then(function(balance) {
                theta_reserve_previous_balance = balance;
                console.log('Theta reserve previous balance : ' + theta_reserve_previous_balance.toString(10));
                console.log('Presale receiver address : ' + presale_receiver);
                return thetaToken.balanceOf(presale_receiver);
            })
            .then(function(balance) {
                presale_receiver_previous_balance = balance;
                console.log('Presale receiver previous balance : ' + presale_receiver_previous_balance.toString(10));
                return thetaTokenSale.allocatePresaleTokens(presale_receiver, presale_amount, {from: accounts[1], gas: 4700000});
            })
            .then(function() {
                return thetaToken.balanceOf(theta_reserve_address);
            })
            .then(function(balance) {
                theta_reserve_current_balance = balance;
                console.log('Theta reserve current balance : ' + theta_reserve_current_balance.toString(10));
                return thetaToken.balanceOf(presale_receiver);
            })
            .then(function(balance) {
                presale_receiver_current_balance = balance;
                console.log('Presale receiver current balance : ' + presale_receiver_current_balance);
                assert.equal(theta_reserve_current_balance.minus(theta_reserve_previous_balance).equals(theta_reserve_amount), true, 'theta reserver balance should increase by the expected amount');
                assert.equal(presale_receiver_current_balance.minus(presale_receiver_previous_balance).equals(presale_amount), true, 'presale receiver balance should increase by pre-sale amount');
            });
    });

    it ("ThetaTokenSale: change hard caps", function() {
        console.log('----------------');
        return thetaTokenSale.tokenSaleHardCap.call()
            .then(function(token_sale_hard_cap) {
                console.log('Current token sale hard cap: ' + token_sale_hard_cap.toString());
                new_token_sale_hard_cap = 31 * Math.pow(10, 6) * Math.pow(10, 18);
                return thetaTokenSale.changeTokenSaleHardCap(new_token_sale_hard_cap, {from: accounts[1], gas: 4700000});
            })
            .then(function() {
                return thetaTokenSale.tokenSaleHardCap.call();
            })
            .then(function(token_sale_hard_cap) {
                console.log('Updated token sale hard cap: ' + token_sale_hard_cap.toString());
                assert.equal(token_sale_hard_cap, new_token_sale_hard_cap, 'token sale hard cap should have changed!');
            })
            .then(function() {
                return thetaTokenSale.fundCollectedHardCap.call();
            })
            .then(function(fund_collected_hard_cap) {
                console.log('Current fund collected hard cap: ' + fund_collected_hard_cap.toString());
                new_fund_collected_hard_cap = 26000 * Math.pow(10, 18);
                return thetaTokenSale.changeFundCollectedHardCap(new_fund_collected_hard_cap, {from: accounts[1], gas: 4700000});
            })
            .then(function() {
                return thetaTokenSale.fundCollectedHardCap.call();
            })
            .then(function(fund_collected_hard_cap) {
                console.log('Updated fund collected hard cap: ' + fund_collected_hard_cap.toString());
                assert.equal(fund_collected_hard_cap, new_fund_collected_hard_cap, 'fund collected hard cap should have changed!')
            });
    })

    it ("ThetaTokenSale: modify whitelist controller", function() {
        console.log('----------------');
        return thetaTokenSale.getWhitelistController()
            .then(function(res) {
                old_whitelist_controller = res;
                console.log('Old whitelist controller: ' + old_whitelist_controller);
            })
            .then(function() {
                console.log('Changing whitelist controller to : ' + accounts[8]);
                return thetaTokenSale.changeWhitelistController(accounts[8], {from: accounts[1], gas: 4700000});
            })
            .then(function() {
                return thetaTokenSale.getWhitelistController({from: accounts[1], gas: 4700000});
            })
            .then(function(res) {
                new_whitelist_controller = res;
                console.log('New whitelist controller: ' + new_whitelist_controller);
                assert.equal(new_whitelist_controller == old_whitelist_controller, false, 'new whitelist controller should be different from old whitelist controller');
                assert.equal(new_whitelist_controller == accounts[8], true, 'new whitelist controller should be updated');
            });
    });

    it ("ThetaTokenSale: modify exchangeRateController controller", function() {
        console.log('----------------');
        return thetaTokenSale.getExchangeRateController()
            .then(function(res) {
                old_exchange_rate_controller = res;
                console.log('Old exchange rate controller: ' + old_exchange_rate_controller);
            })
            .then(function() {
                console.log('Changing exchange rate controller to : ' + accounts[7]);
                return thetaTokenSale.changeExchangeRateController(accounts[7], {from: accounts[1], gas: 4700000});
            })
            .then(function() {
                return thetaTokenSale.getExchangeRateController();
            })
            .then(function(res) {
                new_exchange_rate_controller = res;
                console.log('New exchange rate controller: ' + new_exchange_rate_controller);
                assert.equal(new_exchange_rate_controller == old_exchange_rate_controller, false, 'new exchange rate controller should be different from old exchange rate controller');
                assert.equal(new_exchange_rate_controller == accounts[7], true, 'new exchange rate controller should be updated');
            });
    });

    it ("ThetaTokenSale: use whitelist controller", function() {
        console.log('----------------');
        return thetaTokenSale.getWhitelistController()
            .then(function(res) {
                whitelist_controller = res;
                console.log('Current whitelist controller: ' + whitelist_controller);
                console.log('Adding these accounts to whitelist: ' + accounts[6] + ' ' + accounts[7]);
                return thetaTokenSale.addAccountsToWhitelist([accounts[6], accounts[7]], {from: whitelist_controller, gas:4700000});
            })
            .then(function() {
                return thetaTokenSale.isWhitelisted(accounts[6]);
            })
            .then(function(res) {
                console.log('is ' + accounts[6] + ' whitelisted? ' + res);
                assert.equal(res, true, 'Account should have been whitelisted');
                return thetaTokenSale.isWhitelisted(accounts[7]);
            })
            .then(function(res) {
                console.log('is ' + accounts[7] + ' whitelisted?' + res);
                assert.equal(res, true, 'Account should have been whitelisted');
                console.log('Removing account from whitelist:' + accounts[6] + ' ' + accounts[7]);
                return thetaTokenSale.deleteAccountsFromWhitelist([accounts[6], accounts[7]], {from: whitelist_controller, gas:4700000});
            })
           .then(function() {
                return thetaTokenSale.isWhitelisted(accounts[6]);
            })
            .then(function(res) {
                console.log('is ' + accounts[6] + ' whitelisted? ' + res);
                assert.equal(res, false, 'Account should have been dewhitelisted');
                return thetaTokenSale.isWhitelisted(accounts[7]);
            })
            .then(function(res) {
                console.log('is ' + accounts[7] + ' whitelisted? ' + res);
                assert.equal(res, false, 'Account should have been dewhitelisted');
                return thetaTokenSale.isWhitelisted(accounts[7]);
            })
            ;
    });

    it ("ThetaTokenSale: use exchange rate controller", function() {
        console.log('----------------');
        return thetaTokenSale.exchangeRate.call()
            .then(function(res) {
                console.log('Exisitng exchange rate: ' + res);
                return thetaTokenSale.getExchangeRateController();
            })
            .then(function(res) {
                exchange_rate_controller = res;
                console.log('Existing exchange rate controller: ' + res);
                new_exchange_rate = 12345;
                console.log('Changing exchange rate to ' + new_exchange_rate.toString());
                return thetaTokenSale.setExchangeRate(new_exchange_rate, {from: exchange_rate_controller, gas:4700000});
            })
            .then(function() {
                return thetaTokenSale.exchangeRate.call();
            })
            .then(function(res) {
                console.log('New exchange rate: ' + res);
                assert.equal(res, new_exchange_rate, 'Excahnge rate should have been changed');
            })
            ;
    });

    it ("ThetaTokenSale: activate sell, emergency stop, restart sale", function() {
        console.log('----------------');
        return thetaTokenSale.getAdmin()
            .then(function(res) {
                admin = res;
                console.log('Current admin: ' + admin);
                return thetaTokenSale.activated.call();
            })
            .then(function(res) {
                console.log('Sale activation status: ' + res);
                assert.equal(res, false, 'Sale should be deactivated at first');
                return thetaTokenSale.saleStopped.call();
            })
            .then(function(res) {
                console.log('Sale stop status: ' + res);
                assert.equal(res, false, 'Sale stop should be false at first');
                console.log('Activating sale..');
                return thetaTokenSale.activateSale({from: admin, gas: 4700000});
            })
            .then(function(res) {
                return thetaTokenSale.activated.call();
            })
            .then(function(res) {
                console.log('Sale activation status: ' + res);
                assert.equal(res, true, 'Sale should be activated after calling activate sale');
                console.log('Calling emergency stop..')
                return thetaTokenSale.emergencyStopSale({from: admin, gas: 4700000});
            })
            .then(function() {
                return thetaTokenSale.saleStopped.call();
            })
            .then(function(res) {
                console.log('Sale stop status: ' + res);
                assert.equal(res, true, 'Sale stop should be true after calling emergency stop');
                console.log('Calling restart sale..')
                return thetaTokenSale.restartSale({from: admin, gas: 4700000});
            })
            .then(function() {
                return thetaTokenSale.saleStopped.call();
            })
            .then(function(res) {
                console.log('Sale stop status: ' + res);
                assert.equal(res, false, 'Sale stop should be false after restarting sale');
            })
            ;
    });

    it ("ThetaTokenSale: transfer fund deposit address", function() {
        console.log('----------------');
        return thetaTokenSale.getAdmin()
            .then(function(res) {
                existing_admin = res;
                console.log('Existing admin: ' + existing_admin);
                return thetaTokenSale.getFundDeposit({from: existing_admin, gas: 4700000});
            })
            .then(function(res) {
                existing_fund_deposit = res;
                console.log('Existing fund deposit: ' + existing_fund_deposit);
                new_fund_deposit_candidate = accounts[0];
                return thetaTokenSale.changeFundDeposit(new_fund_deposit_candidate, {from: existing_admin, gas: 4700000});
            })
            .then(function() {
                return thetaTokenSale.getFundDeposit({from: existing_admin, gas: 4700000});
            })
            .then(function(res) {
                new_fund_deposit = res;
                console.log('New fund deposit: ' + new_fund_deposit);
                assert.equal(new_fund_deposit, new_fund_deposit_candidate, 'Fund deposit should have been changed');
            })
            ;
    });

    it ("ThetaTokenSale: transfer thetaLab reserve address", function() {
        console.log('----------------');
        return thetaTokenSale.getAdmin()
            .then(function(res) {
                existing_admin = res;
                console.log('Existing admin: ' + existing_admin);
                return thetaTokenSale.getThetaLabsReserve({from: existing_admin, gas: 4700000});
            })
            .then(function(res) {
                existing_thetalab_reserve = res;
                console.log('Existing thetaLab reserver address: ' + existing_thetalab_reserve);
                new_thetalab_reserve_candidate = accounts[0];
                return thetaTokenSale.changeThetaLabsReserve(new_thetalab_reserve_candidate, {from: existing_admin, gas: 4700000});
            })
            .then(function() {
                return thetaTokenSale.getThetaLabsReserve({from: existing_admin, gas: 4700000});
            })
            .then(function(res) {
                new_thetalab_reserve = res;
                console.log('New thetaLab reserve address: ' + new_thetalab_reserve);
                assert.equal(new_thetalab_reserve, new_thetalab_reserve_candidate, 'ThetaLab reserve should have been changed');
            })
            ;
    });

    it ("ThetaTokenSale: transfer root", function() {
        console.log('----------------');
        return thetaTokenSale.getAdmin()
            .then(function(res) {
                existing_admin = res;
                console.log('Existing admin: ' + existing_admin);
                return thetaTokenSale.getRoot({from: existing_admin, gas: 4700000});
            })
            .then(function(res) {
                existing_root = res;
                console.log('Existing root: ' + existing_root);
                new_root_candidate = accounts[6];
                return thetaTokenSale.changeRoot(new_root_candidate, {from: existing_root, gas: 4700000});
            })
            .then(function() {
                return thetaTokenSale.getRoot({from: existing_admin, gas: 4700000});
            })
            .then(function(res) {
                new_root = res;
                console.log('New root: ' + new_root);
                assert.equal(new_root, new_root_candidate, 'Root should have changed');
            })
            ;
    });

    it ("ThetaTokenSale: transfer admin with new root", function() {
        console.log('----------------');
        return thetaTokenSale.getAdmin()
            .then(function(res) {
                existing_admin = res;
                console.log('Existing admin: ' + existing_admin);
                return thetaTokenSale.getRoot({from: existing_admin, gas: 4700000});
            })
            .then(function(res) {
                existing_root = res;
                console.log('Existing root: ' + existing_root);
                new_admin_candidate = accounts[9];
                return thetaTokenSale.changeAdmin(new_admin_candidate, {from: existing_root, gas: 4700000});
            })
            .then(function() {
                return thetaTokenSale.getAdmin({from: new_admin_candidate, gas: 4700000});
            })
            .then(function(res) {
                new_admin = res;
                console.log('New admin: ' + new_admin);
                assert.equal(new_admin, new_admin_candidate, 'Admin should have been changed');
            })
            ;
    });

    it ("ThetaTokenSale: test new admin", function() {
        console.log('----------------');
        console.log('Use new admin to change fund deposit..');
        new_admin = accounts[9];
        return thetaTokenSale.changeFundDeposit(accounts[4], {from: new_admin, gas: 4700000})
            .then(function() {
                return thetaTokenSale.getFundDeposit({from: new_admin, gas: 4700000});
            })
            .then(function(res) {
                new_fund_deposit = res;
                console.log('New fund deposit: ' + new_fund_deposit);
                assert.equal(new_fund_deposit, accounts[4], 'Fund deposit should have been changed');

                console.log('Use new admin to change whitelistController..');
                return thetaTokenSale.changeWhitelistController(accounts[2], {from: new_admin, gas: 4700000});
            })
            .then(function() {
                return thetaTokenSale.getWhitelistController({from: new_admin, gas: 4700000});
            })
            .then(function(res) {
                new_whitelist_controller = res;
                console.log('New whitelist controller: ' + new_whitelist_controller);
                assert.equal(new_whitelist_controller == accounts[2], true, 'new whitelist controller should be updated');

                console.log('Use new admin to change exchangeRateController..');
                return thetaTokenSale.changeExchangeRateController(accounts[2], {from: new_admin, gas: 4700000});
            })
            .then(function() {
                return thetaTokenSale.getExchangeRateController({from: new_admin, gas: 4700000});
            })
            .then(function(res) {
                new_exchange_rate_controller = res;
                console.log('New exchange rate controller: ' + new_exchange_rate_controller);
                assert.equal(new_exchange_rate_controller == accounts[2], true, 'new exchange rate controller should be updated');
            })
            ;
    });

    it ("ThetaTokenSale: test new whitelist controller", function() {
        console.log('----------------');
        console.log('Use new whitelistController to whitelist');
        console.log('Adding these accounts to whitelist: ' + accounts[8] + ' ' + accounts[9]);
        new_whitelist_controller = accounts[2];
        return thetaTokenSale.addAccountsToWhitelist([accounts[8], accounts[9]], {from: accounts[2], gas:4700000})
            .then(function() {
                return thetaTokenSale.isWhitelisted(accounts[8]);
            })
            .then(function(res) {
                console.log('is ' + accounts[8] + ' whitelisted? ' + res);
                assert.equal(res, true, 'Account should have been whitelisted');
                return thetaTokenSale.isWhitelisted(accounts[9]);
            })
            .then(function(res) {
                console.log('is ' + accounts[9] + ' whitelisted? ' + res);
                assert.equal(res, true, 'Account should have been whitelisted');
            })
            ;
    });

    it ("ThetaTokenSale: test exchange rate with new controller", function() {
        console.log('----------------');
        console.log('Use new exchange rate to set exchange rate');
        return thetaTokenSale.exchangeRate.call()
            .then(function(res) {
                console.log('Exisitng exchange rate: ' + res);
                new_exchange_rate_controller = accounts[2];
                new_exchange_rate = 54321;
                console.log('Changing exchange rate to ' + new_exchange_rate.toString());
                return thetaTokenSale.setExchangeRate(new_exchange_rate, {from: new_exchange_rate_controller, gas:4700000});
            })
            .then(function() {
                return thetaTokenSale.exchangeRate.call();
            })
            .then(function(res) {
                console.log('New exchange rate: ' + res);
                assert.equal(res, new_exchange_rate, 'Excahnge rate should have been changed');
            })
            ;
    });


});


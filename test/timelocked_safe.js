var ThetaToken = artifacts.require('ThetaToken');
var ThetaTokenSale = artifacts.require('ThetaTokenSale');
var TimelockedSafe = artifacts.require('TimelockedSafe');

contract('TimelockedSafeTest', function(accounts) {
    var decimals = 18;

    var root_addr     = accounts[0];
    var admin_addr    = accounts[1];
    var whitelist_controller    = accounts[2];
    var exchange_rate_controller = accounts[3];
    var thetalab_reserve_addr = accounts[4];
    var fund_deposit_addr = accounts[5];
    var presale_addr = accounts[6];
    var sliver_integration_addr = accounts[7];
    var streamer_addr = accounts[8];
    var public_sale_addr = accounts[9];

    var widthdraw_addr = thetalab_reserve_addr;
    var attacker_addr = public_sale_addr;

    var theta_token;
    var theta_token_sale;
    var timelocked_safe;
    var unlock_time = 0; // simulate the case where the token is unlocked
    var presale_amount = new web3.BigNumber(250000000 * Math.pow(10, 18)); // 250 million tokens

    it ("TimelockedSafe test: deploy", function() {
        console.log('----------------');
        return ThetaToken.deployed()
            .then(function(tt) {
                theta_token = tt;
                console.log('ThetaToken Address: ' + theta_token.address);
                return ThetaTokenSale.deployed();
            })
            .then(function(tts) {
                theta_token_sale = tts;
                console.log('ThetaTokenSale Address: ' + theta_token_sale.address);
                return TimelockedSafe.deployed();
            })
            .then(function(tls) {
                timelocked_safe = tls;
                timelocked_safe.changeTokenAddress(theta_token.address, {from: admin_addr, gas:4700000});
                console.log('TimelockedSafe Address: ' + timelocked_safe.address);
            })
    });

    it ("TimelockedSafe test: set unlock time", function() {
        console.log('----------------');
        return theta_token_sale.changeUnlockTime(unlock_time, {from: admin_addr, gas:4700000})
            .then(function() {
                return theta_token.getUnlockTime();
            })
            .then(function(res) {
                console.log('Unlock time: ' + res);
            })
    });

    it ("TimelockedSafe test: presale to generate tokens", function() {
        console.log('----------------');
        return theta_token_sale.allocatePresaleTokens(presale_addr, presale_amount, {from: admin_addr, gas:4700000})
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(res) {
                console.log('Balance of presale account ' + presale_addr + ' is ' + res)
                return theta_token.balanceOf(thetalab_reserve_addr);
            })
            .then(function(res) {
                console.log('Balance of thetaLab reserve account ' + thetalab_reserve_addr + ' is ' + res)
            })
    });

    it ("TimelockedSafe test: Attacker attempt to change parameters of the timelocked safe", function() {
        console.log('----------------');

        var locking_period_in_months = 10;
        var vesting_period_in_months = 8;
        var monthly_widthraw_limit_in_wei = new web3.BigNumber(10 ** decimals).times(100).times(10 ** 6);
        return timelocked_safe.changeLockingPeriod(locking_period_in_months, {from: attacker_addr, gas:4700000})
            .catch(function() {
                console.log('Changing locking period failed since the message was not from the admin, expected.');
            })
            .then(function() {
                return timelocked_safe.changeVestingPeriod(vesting_period_in_months, {from: attacker_addr, gas:4700000});
            })
            .catch(function() {
                console.log('Changing vesting period failed since the message was not from the admin, expected.');
            })
            .then(function() {
                return timelocked_safe.changeMonthlyWithdrawLimit(monthly_widthraw_limit_in_wei, {from: attacker_addr, gas:4700000});
            })
            .catch(function() {
                console.log('Changing monthly withdraw limit failed since the message was not from the admin, expected.');
            })
    });

    it ("TimelockedSafe test: send tokens to the timelocked safe", function() {
        console.log('----------------');

        var locking_period_in_months = 0;
        var vesting_period_in_months = 6;
        var monthly_widthraw_limit_in_wei = new web3.BigNumber(10 ** decimals).times(5).times(10 ** 6); // 5 million tokens monthly limit
        var safe_initial_balance = new web3.BigNumber(10 ** decimals).times(30).times(10 ** 6); // 30 million tokens initially
        return theta_token.balanceOf(timelocked_safe.address)
            .then(function(bal) {
                bal0 = bal;
                console.log('Initial Theta token balance of timelocked safe ' + timelocked_safe + ' is ' + bal0);
                return theta_token.transfer(timelocked_safe.address, safe_initial_balance, {from: thetalab_reserve_addr, gas:4700000});
            })
            .then(function() {
                return theta_token.balanceOf(timelocked_safe.address);
            })
            .then(function(bal) {
                bal1 = bal;
                console.log('Theta token balance of timelocked safe after the first transfer is ' + bal1);
                return timelocked_safe.changeLockingPeriod(locking_period_in_months, {from: admin_addr, gas:4700000});
            })
            .then(function() {
                return timelocked_safe.changeVestingPeriod(vesting_period_in_months, {from: admin_addr, gas:4700000});
            })
            .then(function() {
                return timelocked_safe.changeMonthlyWithdrawLimit(monthly_widthraw_limit_in_wei, {from: admin_addr, gas:4700000});
            })
    });

    it ("TimelockedSafe test: Withdraw tokens in the first vesting month", function() {
        console.log('----------------');

        var withdraw_amount_in_wei_1 = new web3.BigNumber(10 ** decimals).times(3000); 
        var withdraw_amount_in_wei_2 = new web3.BigNumber(10 ** decimals).times(4).times(10 ** 6); 
        var withdraw_amount_in_wei_3 = new web3.BigNumber(10 ** decimals).times(1.2).times(10 ** 6); 

        return theta_token.balanceOf(timelocked_safe.address)
            .then(function(bal) {
                safe_bal0 = new web3.BigNumber(bal);
                console.log('Theta token balance of timelocked safe  ' + timelocked_safe.address + ' is ' + safe_bal0);
                return theta_token.balanceOf(widthdraw_addr);
            })
            .then(function(bal) {
                withdraw_bal0 = new web3.BigNumber(bal);
                console.log('Theta token balance of withdraw address ' + widthdraw_addr + ' is ' + withdraw_bal0);
                console.log('>>>>> Withdraw ' + withdraw_amount_in_wei_1 + ' wei Theta tokens...')
                return timelocked_safe.withdraw(withdraw_amount_in_wei_1);
            })
           .then(function() {
                console.log('>>>>> Withdraw succeeded')
                return theta_token.balanceOf(timelocked_safe.address);
            })
            .then(function(bal) {
                safe_bal1 = new web3.BigNumber(bal);
                console.log('Theta token balance of timelocked safe  ' + timelocked_safe.address + ' is ' + safe_bal1);
                return theta_token.balanceOf(widthdraw_addr);
            })
            .then(function(bal) {
                withdraw_bal1 = new web3.BigNumber(bal);
                console.log('Theta token balance of withdraw address ' + widthdraw_addr + ' is ' + withdraw_bal1);

                assert(safe_bal0.minus(withdraw_amount_in_wei_1).equals(safe_bal1));
                assert(withdraw_bal1.minus(withdraw_amount_in_wei_1).equals(withdraw_bal0));
            })
            .then(function() {
                console.log('>>>>> Withdraw ' + withdraw_amount_in_wei_2 + ' wei Theta tokens...')
                return timelocked_safe.withdraw(withdraw_amount_in_wei_2);
            })
           .then(function() {
                console.log('>>>>> Withdraw succeeded')
                return theta_token.balanceOf(timelocked_safe.address);
            })
            .then(function(bal) {
                safe_bal2 = new web3.BigNumber(bal);
                console.log('Theta token balance of timelocked safe  ' + timelocked_safe.address + ' is ' + safe_bal2);
                return theta_token.balanceOf(widthdraw_addr);
            })
            .then(function(bal) {
                withdraw_bal2 = new web3.BigNumber(bal);
                console.log('Theta token balance of withdraw address ' + widthdraw_addr + ' is ' + withdraw_bal2);

                assert(safe_bal1.minus(withdraw_amount_in_wei_2).equals(safe_bal2));
                assert(withdraw_bal2.minus(withdraw_amount_in_wei_2).equals(withdraw_bal1));
            })
            .then(function() {
                console.log('>>>>> Attempt to withdraw ' + withdraw_amount_in_wei_3 + ' wei Theta tokens...')
                return timelocked_safe.withdraw(withdraw_amount_in_wei_3);
            })
            .catch(function() {
                console.log('Withdraw failed since it exceeded the monthly withdraw limit, expected.');
            })
    });

    it ("TimelockedSafe test: Withdraw tokens in the second vesting month", function() {
        console.log('----------------');

        var second_month_withdraw_amount_in_wei = new web3.BigNumber(10 ** decimals).times(5).times(10 ** 6);
        var seconds_per_month = new web3.BigNumber(31).times(24).times(3600);

        return timelocked_safe.startTime.call()
            .then(function(res) {
                current_start_time = new web3.BigNumber(res);
                console.log('Current start time: ' + current_start_time);
                start_time_one_month_earlier = current_start_time.minus(seconds_per_month);
                return timelocked_safe.changeStartTime(start_time_one_month_earlier);
            })
            .then(function(res) {
                return theta_token.balanceOf(timelocked_safe.address);
            })
            .then(function(bal) {
                safe_bal0 = new web3.BigNumber(bal);
                console.log('Theta token balance of timelocked safe  ' + timelocked_safe.address + ' is ' + safe_bal0);
                return theta_token.balanceOf(widthdraw_addr);
            })
            .then(function(bal) {
                withdraw_bal0 = new web3.BigNumber(bal);
                console.log('Theta token balance of withdraw address ' + widthdraw_addr + ' is ' + withdraw_bal0);
                console.log('>>>>> Withdraw ' + second_month_withdraw_amount_in_wei + ' wei Theta tokens...')
                return timelocked_safe.withdraw(second_month_withdraw_amount_in_wei);
            })
           .then(function() {
                console.log('>>>>> Withdraw succeeded')
                return theta_token.balanceOf(timelocked_safe.address);
            })
            .then(function(bal) {
                safe_bal1 = new web3.BigNumber(bal);
                console.log('Theta token balance of timelocked safe  ' + timelocked_safe.address + ' is ' + safe_bal1);
                return theta_token.balanceOf(widthdraw_addr);
            })
            .then(function(bal) {
                withdraw_bal1 = new web3.BigNumber(bal);
                console.log('Theta token balance of withdraw address ' + widthdraw_addr + ' is ' + withdraw_bal1);

                assert(safe_bal0.minus(second_month_withdraw_amount_in_wei).equals(safe_bal1));
                assert(withdraw_bal1.minus(second_month_withdraw_amount_in_wei).equals(withdraw_bal0));
            })
    });

});


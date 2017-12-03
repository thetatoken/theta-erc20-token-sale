var ThetaToken = artifacts.require('ThetaToken');
var ThetaTokenSale = artifacts.require('ThetaTokenSale');

contract('ThetaToken', function(accounts) {
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

    var theta_token;
    var theta_token_sale;
    var exchange_rate = 3000;
    var sale_start_block = web3.eth.blockNumber + 25;
    var sale_end_block = sale_start_block + 50;
    var unlock_time = sale_end_block + 25;
    var presale_amount = 20000000;
    var precirculation_amount = 3000;
    var donation_amount = 100;
    var cashout_amount = 50;

    console.log("Imported node Accounts: \n", accounts);

    it ("Integration test: deploy", function() {
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
            })
    });

    it ("Integration test: set exchange rate", function() {
        console.log('----------------');
        return theta_token_sale.setExchangeRate(exchange_rate, {from: exchange_rate_controller, gas: 4700000})
            .then(function() {
                return theta_token_sale.exchangeRate.call()
            })
            .then(function(rate) {
                console.log('Exchange rate set: ' + rate);
            })
    });

    it ("Integration test: set start and end time of sale", function() {
        console.log('----------------');
        return theta_token_sale.setStartTimeOfSale(sale_start_block, {from: admin_addr, gas:4700000})
            .then(function() {
                return theta_token_sale.setEndTimeOfSale(sale_end_block, {from: admin_addr, gas:4700000})
            })
            .then(function() {
                return theta_token_sale.initialBlock.call()
            })
            .then(function(res) {
                console.log('Sale starts at: ' + res);
                return theta_token_sale.finalBlock.call()
            })
            .then(function(res) {
                console.log('Sale ends at: ' + res);
            })
    });

    it ("Integration test: set unlock time", function() {
        console.log('----------------');
        return theta_token_sale.changeUnlockTime(unlock_time, {from: admin_addr, gas:4700000})
            .then(function() {
                return theta_token.getUnlockTime();
            })
            .then(function(res) {
                console.log('Unlock time: ' + res);
            })
    });

    it ("Integration test: presale", function() {
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

    it ("Integration test: allow precirculation on thetalab_reserve_addr, sliver_integration_addr and streamer_addr", function() {
        console.log('----------------');
        console.log('allowing precirculation for thetalab_reserve_addr: ' + thetalab_reserve_addr);
        return theta_token_sale.allowPrecirculation(thetalab_reserve_addr, {from: admin_addr, gas:4700000})
            .then(function() {
                console.log('allowing precirculation for sliver_integration_addr: ' + sliver_integration_addr)
                return theta_token_sale.allowPrecirculation(sliver_integration_addr, {from: admin_addr, gas:4700000})
            })
            .then(function() {
                console.log('allowing precirculation for streamer_addr: ' + streamer_addr)
                return theta_token_sale.allowPrecirculation(streamer_addr, {from: admin_addr, gas: 4700000})
            })
            .then(function() {
                console.log('done.')          
            })
    });

    it ("Integration test: transfer from thetalab_reserve_addr to sliver_integration_addr", function() {
        console.log('----------------');
        console.log('Before transfer:');
        return theta_token.balanceOf(thetalab_reserve_addr)
            .then(function(res) {
                console.log('Theta reserve balance: ' + res);
                return theta_token.balanceOf(sliver_integration_addr);
            })
            .then(function(res) {
                console.log('Sliver integration account balance: ' + res)
                console.log('Transfering ' + precirculation_amount + ' from thetalab_reserve_addr ' + thetalab_reserve_addr + ' to sliver_integration_addr ' + sliver_integration_addr);
                return theta_token.transfer(sliver_integration_addr, precirculation_amount, {from: thetalab_reserve_addr, gas: 4700000});
            })
            .then(function(res) {
                console.log('After transfer:');
                return theta_token.balanceOf(thetalab_reserve_addr);
            })
            .then(function(res) {
                console.log('Theta reserve balance: ' + res);
                return theta_token.balanceOf(sliver_integration_addr);
            })
            .then(function(res) {
                console.log('Sliver integration account balance: ' + res);
            })
    });

    it ("Integration test: remove thetalab_reserve_addr from precirculation", function() {
        console.log('----------------');
        return theta_token_sale.disallowPrecirculation(thetalab_reserve_addr, {from: admin_addr, gas: 4700000})
            .then(function() {
                return theta_token_sale.isPrecirculationAllowed(thetalab_reserve_addr, {from: admin_addr, gas: 4700000});
            })
            .then(function(res) {
                console.log('is precirculation allowed for thetalab_reserve_addr ' + thetalab_reserve_addr + ' ? ' + res);
            })
    });

    it ("Integration test: add whitelist public_sale_addr and presale_addr", function() {
        console.log('----------------');
        return theta_token_sale.addAccountsToWhitelist([public_sale_addr, presale_addr], {from: whitelist_controller, gas:4700000})
            .then(function() {
                return theta_token_sale.isWhitelisted(public_sale_addr);
            })
            .then(function(res) {
                console.log('Is public_sale_addr ' + public_sale_addr + ' whitelisted? ' + res);
                return theta_token_sale.isWhitelisted(presale_addr);
            })
            .then(function(res) {
                console.log('Is presale_addr ' + presale_addr + ' whitelisted?' + res);
                return theta_token_sale.getWhitelist();
            })
            .then(function(res) {
                console.log('All whitelisted accounts: ' + res);
            })
    });

    it ("Integration test: token purchase before sale starts", function() {
    	console.log('');
        console.log('-------- Integration test: token purchase before sale starts --------');
        console.log('');

        current_block_number = web3.eth.blockNumber;
        console.log('current block number: ' + web3.eth.blockNumber);
        console.log('sale_start_block: ' + sale_start_block);
        assert(current_block_number < sale_start_block);

       	purchase_eth = 0.1 * (10**18);
        return theta_token_sale.addAccountsToWhitelist([public_sale_addr], {from: whitelist_controller, gas: 4700000})
        	.then(function() {
        		return theta_token.balanceOf(public_sale_addr);
        	})
        	.then(function(theta_balance) {
        		public_sale_addr_init_theta_balance = theta_balance;
        		public_sale_addr_init_eth_balance = web3.eth.getBalance(public_sale_addr);
        		console.log('public sale purchaser Theta balance: ' + public_sale_addr_init_theta_balance.toString());
        		console.log('public sale purchaser ETH balance: ' + public_sale_addr_init_eth_balance.toString());
        		console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
        		web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
            })
        	.catch(function() {
        		console.log('>>> sending ETH did not succeed since sale not started yet, expected');
        	})
        	.then(function() {
        		return theta_token.balanceOf(public_sale_addr);
        	})
        	.then(function(theta_balance) {
        		public_sale_addr_final_theta_balance = theta_balance;
        		public_sale_addr_final_eth_balance = web3.eth.getBalance(public_sale_addr);
        		console.log('public sale purchaser Theta balance: ' + public_sale_addr_final_theta_balance.toString());
        		console.log('public sale purchaser ETH balance: ' + public_sale_addr_final_eth_balance.toString());
        		assert.equal(public_sale_addr_final_theta_balance - public_sale_addr_init_theta_balance, 0, 'should not change!');
            })
    });

    it ("Integration test: special account balance checks #1", function() {
        console.log('');
        console.log('-------- Integration test: special account balance checks #1 --------');
        console.log('');

        return theta_token.totalSupply()
            .then(function(supply) {
                current_supply = Number(supply);
                return theta_token.balanceOf(thetalab_reserve_addr);
            })
            .then(function(thetalab_balance) {
                thetalab_reserve_balance = Number(thetalab_balance);
                EPSILON = precirculation_amount + 1;
                console.log('current total token supply: ' + current_supply);
                console.log('Theta Labs reserve balance: ' + thetalab_reserve_balance);
                console.log('reserve ratio: ' + thetalab_reserve_balance / current_supply);

                assert(current_supply * 0.6 - thetalab_reserve_balance < EPSILON,  'invalid thetalab_reserve_balance ratio');
                assert(current_supply * 0.6 - thetalab_reserve_balance > -EPSILON, 'invalid thetalab_reserve_balance ratio');                
            })
    });

    it ("Integration test: token purchase after sale starts", function() {
    	console.log('');
        console.log('-------- Integration test: token purchase before sale starts --------');
        console.log('');

    	// fast forward to sale time
    	for (var i = web3.eth.blockNumber; i <= sale_start_block + 1; i ++) {
        	console.log('fast-forwarding block :' + web3.eth.blockNumber)
        	force_block = {
            	jsonrpc: "2.0",
            	method: "evm_mine",
            	id: i
        	}
        	web3.currentProvider.send(force_block);
    	};
        assert(web3.eth.blockNumber > sale_start_block);

       	purchase_eth = 0.1 * (10**18);
        return theta_token_sale.activateSale({from: admin_addr, gas: 4700000})
        	.then(function() {
        		return theta_token_sale.addAccountsToWhitelist([public_sale_addr], {from: whitelist_controller, gas: 4700000});	
        	})
        	.then(function() {
        		return theta_token.balanceOf(public_sale_addr);
        	})
        	.then(function(theta_balance) {
        		public_sale_addr_init_theta_balance = theta_balance;
        		public_sale_addr_init_eth_balance = web3.eth.getBalance(public_sale_addr);
        		console.log('public sale purchaser Theta balance: ' + public_sale_addr_init_theta_balance.toString());
        		console.log('public sale purchaser ETH balance: ' + public_sale_addr_init_eth_balance.toString());
        		console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
        		tx_hash = web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
        	    tx_gas_used = web3.eth.getTransactionReceipt(tx_hash).gasUsed * web3.eth.getTransaction(tx_hash).gasPrice;
            })
        	.then(function() {
        		return theta_token.balanceOf(public_sale_addr);
        	})
        	.then(function(theta_balance) {
        		public_sale_addr_final_theta_balance = theta_balance;
        		public_sale_addr_final_eth_balance = web3.eth.getBalance(public_sale_addr);
        		console.log('public sale purchaser Theta balance: ' + public_sale_addr_final_theta_balance.toString());
        		console.log('public sale purchaser ETH balance: ' + public_sale_addr_final_eth_balance.toString());
        		assert.equal(public_sale_addr_final_theta_balance - public_sale_addr_init_theta_balance, purchase_eth * exchange_rate, 'should decrease!');
        	    assert.equal(Number(public_sale_addr_init_eth_balance),
                             Number(public_sale_addr_final_eth_balance) + Number(purchase_eth) + Number(tx_gas_used), 'ETH balance should decrease by the expected amount!');
        	})
    });

    it ("Integration test: token purchase from non-whitelisted addresses after sale starts", function() {
        console.log('');
        console.log('-------- Integration test: token purchase from non-whitelisted addresses after sale starts --------');
        console.log('');

        assert(web3.eth.blockNumber > sale_start_block);

        purchase_eth = 0.1 * (10**18);
        return theta_token_sale.deleteAccountsFromWhitelist([public_sale_addr], {from: whitelist_controller, gas: 4700000})
            .then(function() {
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_init_theta_balance = theta_balance;
                public_sale_addr_init_eth_balance = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_init_theta_balance.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_init_eth_balance.toString());
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                return web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> sending ETH did not succeed since the sender address is not whitelisted, expected');
            })
            .then(function() {
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_final_theta_balance = theta_balance;
                public_sale_addr_final_eth_balance = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_final_theta_balance.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_final_eth_balance.toString());
                assert.equal(public_sale_addr_final_theta_balance - public_sale_addr_init_theta_balance, 0, 'should decrease!');
                assert(Number(public_sale_addr_init_eth_balance) > Number(public_sale_addr_final_eth_balance), 'Should cost some gas!');
            })
    });

    it ("Integration test: token purchase with less than minially required ETH", function() {
        console.log('');
        console.log('-------- Integration test: token purchase with less than minially required ETH --------');
        console.log('');

        assert(web3.eth.blockNumber > sale_start_block);

        purchase_eth = 100; // 100 wei, less than 1 szabo 
        return theta_token_sale.addAccountsToWhitelist([public_sale_addr], {from: whitelist_controller, gas: 4700000})
            .then(function() {
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_init_theta_balance = theta_balance;
                public_sale_addr_init_eth_balance = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_init_theta_balance.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_init_eth_balance.toString());
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                return web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> sending ETH did not succeed since less than minially required ETH was sent, expected');
            })
            .then(function() {
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_final_theta_balance = theta_balance;
                public_sale_addr_final_eth_balance = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_final_theta_balance.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_final_eth_balance.toString());
                assert.equal(public_sale_addr_final_theta_balance - public_sale_addr_init_theta_balance, 0, 'should not change!');
                assert(Number(public_sale_addr_init_eth_balance) > Number(public_sale_addr_final_eth_balance), 'Should cost some gas!');
            })
    });

    it ("Integration test: token purchase when sold token count approaches the hard cap", function() {
        console.log('');
        console.log('-------- Integration test: token purchase when sold token count approaches the hard cap --------');
        console.log('');
        
        assert(web3.eth.blockNumber > sale_start_block);

        purchase_eth = 0.1 * (10**18); // 1 ether
        return theta_token_sale.addAccountsToWhitelist([public_sale_addr], {from: whitelist_controller, gas: 4700000})
            .then(function() {
                return theta_token.totalSupply();
            })
            .then(function(supply) {
                current_supply = Number(supply);
                current_sold_tokens = current_supply * 40 / 100;
                new_token_sale_hard_cap = current_sold_tokens + exchange_rate * purchase_eth / 2;
                return theta_token_sale.changeTokenSaleHardCap(new_token_sale_hard_cap);
            })
            .then(function() {
                return theta_token_sale.tokenSaleHardCap.call();
            })
            .then(function(token_hard_cap) {
                new_token_sale_hard_cap = token_hard_cap;
                console.log('new token sale hard cap: ' + Number(new_token_sale_hard_cap).toString());

                // make sure token sale hard cap is reached first
                new_fund_collected_hard_cap = (Number(new_token_sale_hard_cap) * 100) / exchange_rate;
                return theta_token_sale.changeFundCollectedHardCap(new_fund_collected_hard_cap);
            })
            .then(function() {
                return theta_token_sale.fundCollectedHardCap.call();
            })
            .then(function(fund_hard_cap) {
                console.log('new fund collected hard cap: ' + fund_hard_cap);
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_init_theta_balance = theta_balance;
                public_sale_addr_init_eth_balance = web3.eth.getBalance(public_sale_addr);
                console.log('');
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_init_theta_balance.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_init_eth_balance.toString());
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                tx_hash = web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
                tx_gas_used = web3.eth.getTransactionReceipt(tx_hash).gasUsed * web3.eth.getTransaction(tx_hash).gasPrice;
            })
            .then(function() {
                console.log('>>> the first transaction succeeded, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_1 = theta_balance;
                public_sale_addr_eth_balance_1 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_1.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_1.toString());
                assert.equal(public_sale_addr_theta_balance_1 - public_sale_addr_init_theta_balance, purchase_eth * exchange_rate, 'should increase!');
                assert(Number(public_sale_addr_init_eth_balance) > Number(public_sale_addr_eth_balance_1) + Number(purchase_eth), 'should decrease!');
                //assert.equal(Number(public_sale_addr_init_eth_balance),
                //             Number(public_sale_addr_eth_balance_1) + Number(purchase_eth) + Number(tx_gas_used), 'ETH balance should decrease by the expected amount!');                return theta_token.totalSupply();
                return theta_token.totalSupply();
            })
            .then(function(supply) {
                current_supply = Number(supply);
                current_sold_tokens = current_supply * 40 / 100;
                console.log('');
                console.log('number of tokens sold: ' + current_sold_tokens.toString());
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                console.log('fund collected: ' + fund_collected.toString());
                console.log('');
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                return web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> the second transaction failed since the number of tokens sold reached the hard cap, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_2 = theta_balance;
                public_sale_addr_eth_balance_2 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_2.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_2.toString());
                assert.equal(public_sale_addr_theta_balance_2 - public_sale_addr_theta_balance_1, 0, 'should not change!');
                assert(Number(public_sale_addr_eth_balance_1) > Number(public_sale_addr_eth_balance_2), 'Should cost some gas!');
                return theta_token.totalSupply();
            })
            .then(function(supply) {
                current_supply = Number(supply);
                current_sold_tokens = current_supply * 40 / 100;
                console.log('')
                console.log('total number of token sold: ' + current_sold_tokens.toString());
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                console.log('total fund collected: ' + fund_collected.toString());
            })
    });

    it ("Integration test: token purchase when total fund collected approaches the hard cap", function() {
        console.log('');
        console.log('-------- Integration test: token purchase when total fund collected approaches the hard cap --------');
        console.log('');
        
        assert(web3.eth.blockNumber > sale_start_block);

        purchase_eth = 0.1 * (10**18); // 1 ether
        return theta_token_sale.addAccountsToWhitelist([public_sale_addr], {from: whitelist_controller, gas: 4700000})
            .then(function() {
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                new_fund_collected_hard_cap = Number(fund_collected) + purchase_eth / 2;
                return theta_token_sale.changeFundCollectedHardCap(new_fund_collected_hard_cap, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token_sale.fundCollectedHardCap.call();
            })
            .then(function(fund_hard_cap) {
                new_fund_collected_hard_cap = fund_hard_cap;
                console.log('new fund collected hard cap: ' + new_fund_collected_hard_cap);
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function() {
                // make sure fund hard cap reached first
                new_token_sale_hard_cap = Number(new_fund_collected_hard_cap) + purchase_eth * exchange_rate * 1000;
                return theta_token_sale.changeTokenSaleHardCap(new_token_sale_hard_cap, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token_sale.tokenSaleHardCap.call();
            })
            .then(function(token_hard_cap) {
                console.log('new token sale hard cap: ' + token_hard_cap);
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_init_theta_balance = theta_balance;
                public_sale_addr_init_eth_balance = web3.eth.getBalance(public_sale_addr);
                console.log('');
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_init_theta_balance.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_init_eth_balance.toString());
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                tx_hash = web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
                tx_gas_used = web3.eth.getTransactionReceipt(tx_hash).gasUsed * web3.eth.getTransaction(tx_hash).gasPrice;
            })
            .then(function() {
                console.log('>>> the first transaction succeeded, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_1 = theta_balance;
                public_sale_addr_eth_balance_1 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_1.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_1.toString());
                assert.equal(public_sale_addr_theta_balance_1 - public_sale_addr_init_theta_balance, purchase_eth * exchange_rate, 'should increase!');
                assert(Number(public_sale_addr_init_eth_balance) > Number(public_sale_addr_eth_balance_1) + Number(purchase_eth), 'should decrease!');
                //assert.equal(Number(public_sale_addr_init_eth_balance),
                //             Number(public_sale_addr_eth_balance_1) + Number(purchase_eth) + Number(tx_gas_used), 'ETH balance should decrease by the expected amount!');                return theta_token.totalSupply();
                return theta_token.totalSupply();
            })
            .then(function(supply) {
                current_supply = Number(supply);
                current_sold_tokens = current_supply * 40 / 100;
                console.log('');
                console.log('number of tokens sold: ' + current_sold_tokens.toString());
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                console.log('fund collected: ' + fund_collected.toString());
                console.log('');
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                return web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> the second transaction failed since the number of tokens sold reached the hard cap, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_2 = theta_balance;
                public_sale_addr_eth_balance_2 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_2.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_2.toString());
                assert.equal(public_sale_addr_theta_balance_2 - public_sale_addr_theta_balance_1, 0, 'should not change!');
                assert(Number(public_sale_addr_eth_balance_1) > Number(public_sale_addr_eth_balance_2), 'Should cost some gas!');
                return theta_token.totalSupply();
            })
            .then(function(supply) {
                current_supply = Number(supply);
                current_sold_tokens = current_supply * 40 / 100;
                console.log('')
                console.log('total number of token sold: ' + current_sold_tokens.toString());
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                console.log('total fund collected: ' + fund_collected.toString());
            })
    });

    it ("Integration test: special account balance checks #2", function() {
        console.log('');
        console.log('-------- Integration test: special account balance checks #2 --------');
        console.log('');

        return theta_token.totalSupply()
            .then(function(supply) {
                current_supply = Number(supply);
                return theta_token.balanceOf(thetalab_reserve_addr);
            })
            .then(function(thetalab_balance) {
                thetalab_reserve_balance = Number(thetalab_balance);
                EPSILON = 1000;
                console.log('current total token supply: ' + current_supply);
                console.log('Theta Labs reserve balance: ' + thetalab_reserve_balance);
                console.log('reserve ratio: ' + thetalab_reserve_balance / current_supply);

                assert(current_supply * 0.6 - thetalab_reserve_balance < EPSILON,  'invalid thetalab_reserve_balance ratio');
                assert(current_supply * 0.6 - thetalab_reserve_balance > -EPSILON, 'invalid thetalab_reserve_balance ratio');                
            })
    });

    it ("Integration test: emergency sale stop/restart", function() {
        console.log('');
        console.log('-------- Integration test: emergency sale stop/restart --------');
        console.log('');

        purchase_eth = 0.1 * (10**18); // 1 ether
        return theta_token_sale.addAccountsToWhitelist([public_sale_addr], {from: whitelist_controller, gas: 4700000})
            .then(function() {
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                // make sure we don't hit the fund hard cap
                new_fund_collected_hard_cap = Number(fund_collected) + purchase_eth * 1000;
                return theta_token_sale.changeFundCollectedHardCap(new_fund_collected_hard_cap, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token_sale.fundCollectedHardCap.call();
            })
            .then(function(fund_hard_cap) {
                new_fund_collected_hard_cap = fund_hard_cap;
                console.log('new fund collected hard cap: ' + new_fund_collected_hard_cap);
                return theta_token.totalSupply();
            })
            .then(function(supply) {
                // make sure we don't hit the token sale hard cap
                new_token_sale_hard_cap = Number(supply) * 0.4 + purchase_eth * exchange_rate * 1000;
                return theta_token_sale.changeTokenSaleHardCap(new_token_sale_hard_cap, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token_sale.tokenSaleHardCap.call();
            })
            .then(function(token_hard_cap) {
                console.log('new token sale hard cap: ' + token_hard_cap);
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_init_theta_balance = theta_balance;
                public_sale_addr_init_eth_balance = web3.eth.getBalance(public_sale_addr);
                console.log('');
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_init_theta_balance.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_init_eth_balance.toString());
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                tx_hash = web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
                tx_gas_used = web3.eth.getTransactionReceipt(tx_hash).gasUsed * web3.eth.getTransaction(tx_hash).gasPrice;
            })
            .then(function() {
                console.log('>>> the first transaction succeeded, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_1 = theta_balance;
                public_sale_addr_eth_balance_1 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_1.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_1.toString());
                assert.equal(public_sale_addr_theta_balance_1 - public_sale_addr_init_theta_balance, purchase_eth * exchange_rate, 'should increase!');
                assert(Number(public_sale_addr_init_eth_balance) > Number(public_sale_addr_eth_balance_1) + Number(purchase_eth), 'should decrease!');
                //assert.equal(Number(public_sale_addr_init_eth_balance),
                //             Number(public_sale_addr_eth_balance_1) + Number(purchase_eth) + Number(tx_gas_used), 'ETH balance should decrease by the expected amount!');                return theta_token.totalSupply();
                return theta_token_sale.emergencyStopSale({from: admin_addr, gas: 4700000});
            })
            .then(function() {
                console.log('');
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                return web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> the second transaction did not succeed due to emergency stop, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_2 = theta_balance;
                public_sale_addr_eth_balance_2 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_2.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_2.toString());
                assert.equal(public_sale_addr_theta_balance_2 - public_sale_addr_theta_balance_1, 0, 'should not change!');
                assert(Number(public_sale_addr_eth_balance_1) > Number(public_sale_addr_eth_balance_2), 'Should cost some gas!');
                return theta_token_sale.restartSale({from: admin_addr, gas: 4700000});
            })
            .then(function() {
                console.log('');
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                return web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
            })
            .then(function() {
                console.log('>>> the third transaction succeeded since sale restarted, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_3 = theta_balance;
                public_sale_addr_eth_balance_3 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_3.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_3.toString());
                assert.equal(public_sale_addr_theta_balance_3 - public_sale_addr_theta_balance_2, purchase_eth * exchange_rate, 'should increase!');
                assert(Number(public_sale_addr_eth_balance_2) > Number(public_sale_addr_eth_balance_3) + Number(purchase_eth), 'should decrease!');
                //assert.equal(Number(public_sale_addr_init_eth_balance),
                //             Number(public_sale_addr_eth_balance_1) + Number(purchase_eth) + Number(tx_gas_used), 'ETH balance should decrease by the expected amount!');                return theta_token.totalSupply();
            })
    });

    it ("Integration test: token transfer() before unlockTime", function() {
        console.log('');
        console.log('-------- Integration test: token transfer() before unlockTime --------');
        console.log('');

        assert(web3.eth.blockNumber < unlock_time);

        precirculation_allowed_addr = streamer_addr;
        precirculation_disallowed_addr = public_sale_addr;
        transfer_amount_1 = 1234;
        return theta_token_sale.allowPrecirculation(presale_addr, {from: admin_addr, gas: 4700000})
            .then(function() {
                return theta_token_sale.allowPrecirculation(precirculation_allowed_addr, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_init_balance = balance;
                console.log('presale purchase balance: ' + presale_purchaser_init_balance.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_init_balance = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_init_balance.toString());
                console.log('>>> transferring ' + transfer_amount_1.toString() + ' tokens ...')
                return theta_token.transfer(precirculation_allowed_addr, transfer_amount_1, {from: presale_addr, gas: 4700000})
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_first_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_first_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                assert.equal(presale_purchaser_after_first_transfer - presale_purchaser_init_balance, -transfer_amount_1, 'should decrease by the transfer amount!');
                assert.equal(precirculation_allowed_addr_balance_after_first_transfer - precirculation_allowed_addr_init_balance, transfer_amount_1, 'should increase by the transfer amount!');
            })
            .then(function() {
                // transferring more amount than the balance, should fail
                transfer_amount_2 = parseInt(precirculation_allowed_addr_balance_after_first_transfer) + 3537;
                console.log('');
                console.log('>>> transferring ' + transfer_amount_2.toString() + ' tokens back to presale purchaser...')
                return theta_token.transfer(presale_addr, transfer_amount_2, {from: precirculation_allowed_addr, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> transfer did not succeed since the amount is higher than the blance, expected');
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_second_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_second_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                assert.equal(presale_purchaser_after_second_transfer - presale_purchaser_after_first_transfer, 0, 'should not change!');
                assert.equal(precirculation_allowed_addr_balance_after_second_transfer - precirculation_allowed_addr_balance_after_first_transfer, 0, 'should not change!');
            })
            .then(function() {
                console.log('');
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_third_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_init_balance = balance;
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_init_balance.toString());
                console.log('>>> transferring ' + transfer_amount_1.toString() + ' tokens to precirculation disallowed address...')
                return theta_token.transfer(precirculation_disallowed_addr, transfer_amount_1, {from: presale_addr, gas: 4700000})
            })
            .catch(function() {
                console.log('>>> transfer did not succeed since the target address is disallowed from precirculation, expected');
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_third_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_balance_after_third_transfer = balance;
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_balance_after_third_transfer.toString());
                assert.equal(presale_purchaser_after_third_transfer - presale_purchaser_after_second_transfer, 0 , 'should not change!');
                assert.equal(precirculation_disallowed_addr_balance_after_third_transfer - precirculation_disallowed_addr_init_balance, 0, 'should not change!');
            })
    });

    it ("Integration test: token transferFrom() before unlockTime", function() {
        console.log('');
        console.log('-------- Integration test: token transferFrom() before unlockTime --------');
        console.log('');

        assert(web3.eth.blockNumber < unlock_time);

        transfer_amount_1 = 1234;
        transfer_amount_2 = 355;
        transfer_amount_3 = 100;        
        allowance_amount = 1000;
        precirculation_allowed_addr = streamer_addr;
        transfer_operator = streamer_addr;
        return theta_token_sale.allowPrecirculation(presale_addr, {from: admin_addr, gas: 4700000})
            .then(function() {
                return theta_token_sale.allowPrecirculation(precirculation_allowed_addr, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                console.log('approving allowance: ' + allowance_amount.toString());
                return theta_token.approve(transfer_operator, allowance_amount, {from: presale_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('');
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_init_balance = balance;
                console.log('presale purchase balance: ' + presale_purchaser_init_balance.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_init_balance = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_init_balance.toString());
                console.log('>>> using transferFrom() to transfer ' + transfer_amount_1.toString() + ' tokens...');
                return theta_token.transferFrom(presale_addr, precirculation_allowed_addr, transfer_amount_1, 
                    {from: transfer_operator, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> transferFrom() did not succeed since the amount is higher than the blance, expected');
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_first_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_first_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                assert.equal(presale_purchaser_after_first_transfer - presale_purchaser_init_balance, 0, 'should not change!');
                assert.equal(precirculation_allowed_addr_balance_after_first_transfer - precirculation_allowed_addr_init_balance, 0, 'should not change!');
            })
            .then(function() {
                console.log('');
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_first_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_first_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                console.log('>>> using transferFrom() to transfer ' + transfer_amount_2.toString() + ' tokens...');
                return theta_token.transferFrom(presale_addr, precirculation_allowed_addr, transfer_amount_2, 
                    {from: transfer_operator, gas: 4700000});
            })
            .then(function() {
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_second_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_second_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_second_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_second_transfer.toString());
                assert.equal(allowance_amount - allowance_remaining, transfer_amount_2, 'should decrease by transfer amount!');
                assert.equal(presale_purchaser_after_second_transfer - presale_purchaser_after_first_transfer, -transfer_amount_2, 'should decrease by transfer amount!');
                assert.equal(precirculation_allowed_addr_balance_after_second_transfer - precirculation_allowed_addr_balance_after_first_transfer, transfer_amount_2, 'should increase by transfer amount!');
            })
            .then(function() {
                console.log('');
                return theta_token_sale.allowPrecirculation(transfer_operator, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_second_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_second_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_init_balance = balance;
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_init_balance.toString());
                console.log('>>> using transferFrom() to transfer ' + transfer_amount_3.toString() + ' tokens...');
                return theta_token.transferFrom(presale_addr, precirculation_disallowed_addr, transfer_amount_3, 
                    {from: transfer_operator, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> transferFrom() did not succeed since the target address is not allowed for precirculation, expected');
            })
            .then(function() {
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_third_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_balance_after_third_transfer = balance;
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_balance_after_third_transfer.toString());
                assert.equal(allowance_amount - allowance_remaining, transfer_amount_2, 'should decrease by transfer amount!');
                assert.equal(presale_purchaser_after_third_transfer - presale_purchaser_after_second_transfer, 0, 'should not change!');
                assert.equal(precirculation_disallowed_addr_balance_after_third_transfer - precirculation_disallowed_addr_init_balance, 0, 'should not change!');
            })
    });

    it ("Integration test: attempt to purchase tokens after token sale ends", function() {
        console.log('');
        console.log('-------- Integration test: attempt to purchase tokens after token sale ends --------');
        console.log('');

        // fast forward to sale end time
        for (var i = web3.eth.blockNumber; i <= sale_end_block + 1; i ++) {
            console.log('fast-forwarding block :' + web3.eth.blockNumber)
            force_block = {
                jsonrpc: "2.0",
                method: "evm_mine",
                id: i
            }
            web3.currentProvider.send(force_block);
        };
        assert(web3.eth.blockNumber > sale_end_block);

        return theta_token.totalSupply()
            .then(function(supply) {
                current_supply = Number(supply);
                current_sold_tokens = current_supply * 40 / 100;
                console.log('');
                console.log('number of tokens sold: ' + current_sold_tokens.toString());
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                current_fund_collected = fund_collected;
                console.log('fund collected: ' + current_fund_collected.toString());
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_init_theta_balance = theta_balance;
                public_sale_addr_init_eth_balance = web3.eth.getBalance(public_sale_addr);
                console.log('');
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_init_theta_balance.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_init_eth_balance.toString());
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                return web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> the transaction did not succeeded since the token sale aleady ended, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_1 = theta_balance;
                public_sale_addr_eth_balance_1 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_1.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_1.toString());
                assert.equal(public_sale_addr_theta_balance_1 - public_sale_addr_init_theta_balance, 0, 'should not change!');
                assert(Number(public_sale_addr_init_eth_balance) >= Number(public_sale_addr_eth_balance_1), 'should cost some gas!');
                //assert.equal(Number(public_sale_addr_init_eth_balance),
                //             Number(public_sale_addr_eth_balance_1) + Number(purchase_eth) + Number(tx_gas_used), 'ETH balance should decrease by the expected amount!');                return theta_token.totalSupply();
                return theta_token.totalSupply();
            })
            .then(function(supply) {
                current_supply = Number(supply);
                current_sold_tokens_1 = current_supply * 40 / 100;
                console.log('');
                console.log('number of tokens sold: ' + current_sold_tokens.toString());
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                current_fund_collected_1 = fund_collected;
                console.log('fund collected: ' + current_fund_collected_1.toString());
                assert.equal(current_sold_tokens, current_sold_tokens_1, 'should not have sold more tokens');
                assert.equal(Number(current_fund_collected), Number(current_fund_collected_1), 'should not have collected more fund');
            })
    });

    it ("Integration test: token transfer() after unlockTime", function() {
        console.log('');
        console.log('-------- Integration test: token transfer() after unlockTime --------');
        console.log('');

        // fast forward to unlock time
        for (var i = web3.eth.blockNumber; i <= unlock_time + 1; i ++) {
            console.log('fast-forwarding block :' + web3.eth.blockNumber)
            force_block = {
                jsonrpc: "2.0",
                method: "evm_mine",
                id: i
            }
            web3.currentProvider.send(force_block);
        };
        assert(web3.eth.blockNumber > unlock_time);

        past_unlock_time = 0;
        transfer_amount_1 = 1234;
        return theta_token_sale.allowPrecirculation(presale_addr, {from: admin_addr, gas: 4700000})
            .then(function() {
                return theta_token_sale.allowPrecirculation(precirculation_allowed_addr, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_init_balance = balance;
                console.log('presale purchase balance: ' + presale_purchaser_init_balance.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_init_balance = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_init_balance.toString());
                console.log('>>> transferring ' + transfer_amount_1.toString() + ' tokens ...')
                return theta_token.transfer(precirculation_allowed_addr, transfer_amount_1, {from: presale_addr, gas: 4700000})
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_first_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_first_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                assert.equal(presale_purchaser_after_first_transfer - presale_purchaser_init_balance, -transfer_amount_1, 'should decrease by the transfer amount!');
                assert.equal(precirculation_allowed_addr_balance_after_first_transfer - precirculation_allowed_addr_init_balance, transfer_amount_1, 'should increase by the transfer amount!');
            })
            .then(function() {
                // transferring more amount than the balance, should fail
                transfer_amount_2 = parseInt(precirculation_allowed_addr_balance_after_first_transfer) + 3537;
                console.log('');
                console.log('>>> transferring ' + transfer_amount_2.toString() + ' tokens back to presale purchaser...')
                return theta_token.transfer(presale_addr, transfer_amount_2, {from: precirculation_allowed_addr, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> transfer did not succeed since the amount is higher than the blance, expected');
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_second_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_second_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                assert.equal(presale_purchaser_after_second_transfer - presale_purchaser_after_first_transfer, 0, 'should not change!');
                assert.equal(precirculation_allowed_addr_balance_after_second_transfer - precirculation_allowed_addr_balance_after_first_transfer, 0, 'should not change!');
            })
            .then(function() {
                console.log('');
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_third_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_init_balance = balance;
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_init_balance.toString());
                console.log('>>> transferring ' + transfer_amount_1.toString() + ' tokens to precirculation disallowed address...')
                return theta_token.transfer(precirculation_disallowed_addr, transfer_amount_1, {from: presale_addr, gas: 4700000})
            })
            .then(function() {
                console.log('>>> transfer succeeded since unlockTime is already passed, expected');
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_third_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_balance_after_third_transfer = balance;
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_balance_after_third_transfer.toString());
                assert.equal(presale_purchaser_after_third_transfer - presale_purchaser_after_second_transfer, -transfer_amount_1 , 'should decrease by the transfer amount!');
                assert.equal(Number(precirculation_disallowed_addr_balance_after_third_transfer), Number(precirculation_disallowed_addr_init_balance) + Number(transfer_amount_1), 'should increase by the transfer amount!');
            })
    });

    it ("Integration test: token transferFrom() after unlockTime", function() {
        console.log('');
        console.log('-------- Integration test: token transferFrom() after unlockTime --------');
        console.log('');

        assert(web3.eth.blockNumber > unlock_time);

        past_unlock_time = 0;
        transfer_amount_1 = 1234;
        transfer_amount_2 = 355;
        transfer_amount_3 = 100;
        attacker_transfer_amount = 10;        
        allowance_amount = 1000;
        return theta_token_sale.allowPrecirculation(presale_addr, {from: admin_addr, gas: 4700000})
            .then(function() {
                return theta_token_sale.allowPrecirculation(precirculation_allowed_addr, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token.approve(transfer_operator, 0, {from: presale_addr, gas: 4700000});
            })
            .then(function() {
                console.log('approving allowance: ' + allowance_amount.toString());
                return theta_token.approve(transfer_operator, allowance_amount, {from: presale_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('');
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_init_balance = balance;
                console.log('presale purchase balance: ' + presale_purchaser_init_balance.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_init_balance = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_init_balance.toString());
                console.log('>>> using transferFrom() to transfer ' + transfer_amount_1.toString() + ' tokens...');
                return theta_token.transferFrom(presale_addr, precirculation_allowed_addr, transfer_amount_1, 
                    {from: transfer_operator, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> transferFrom() did not succeed since the amount is higher than the blance, expected');
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_first_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_first_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                assert.equal(presale_purchaser_after_first_transfer - presale_purchaser_init_balance, 0, 'should not change!');
                assert.equal(precirculation_allowed_addr_balance_after_first_transfer - precirculation_allowed_addr_init_balance, 0, 'should not change!');
            })
            .then(function() {
                console.log('');
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_first_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_first_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                console.log('>>> using transferFrom() to transfer ' + transfer_amount_2.toString() + ' tokens...');
                return theta_token.transferFrom(presale_addr, precirculation_allowed_addr, transfer_amount_2, 
                    {from: transfer_operator, gas: 4700000});
            })
            .then(function() {
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_second_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_second_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_second_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_second_transfer.toString());
                assert.equal(allowance_amount - allowance_remaining, transfer_amount_2, 'should decrease by transfer amount!');
                assert.equal(presale_purchaser_after_second_transfer - presale_purchaser_after_first_transfer, -transfer_amount_2, 'should decrease by transfer amount!');
                assert.equal(precirculation_allowed_addr_balance_after_second_transfer - precirculation_allowed_addr_balance_after_first_transfer, transfer_amount_2, 'should increase by transfer amount!');
            })
            .then(function() {
                console.log('');
                return theta_token_sale.allowPrecirculation(transfer_operator, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_second_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_second_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_init_balance = balance;
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_init_balance.toString());
                console.log('>>> using transferFrom() to transfer ' + transfer_amount_3.toString() + ' tokens...');
                return theta_token.transferFrom(presale_addr, precirculation_disallowed_addr, transfer_amount_3, 
                    {from: transfer_operator, gas: 4700000});
            })
            .then(function() {
                console.log('>>> transfer succeeded since unlockTime is already passed, expected');
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_third_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_balance_after_third_transfer = balance;
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_balance_after_third_transfer.toString());
                assert.equal(allowance_amount - allowance_remaining, transfer_amount_2 + transfer_amount_3, 'should decrease by the total transfer amount!');
                assert.equal(presale_purchaser_after_third_transfer - presale_purchaser_after_second_transfer, -transfer_amount_3, 'should decrease by transfer amount!');
                assert.equal(Number(precirculation_disallowed_addr_balance_after_third_transfer), Number(precirculation_disallowed_addr_init_balance) + Number(transfer_amount_3), 'should decrease by transfer amount!');
            })
    });

    it ("Integration test: special account balance checks #3", function() {
        console.log('');
        console.log('-------- Integration test: special account balance checks #3 --------');
        console.log('');

        return theta_token.totalSupply()
            .then(function(supply) {
                current_supply = Number(supply);
                return theta_token.balanceOf(thetalab_reserve_addr);
            })
            .then(function(thetalab_balance) {
                thetalab_reserve_balance = Number(thetalab_balance);
                EPSILON = 1000;
                console.log('current total token supply: ' + current_supply);
                console.log('Theta Labs reserve balance: ' + thetalab_reserve_balance);
                console.log('reserve ratio: ' + thetalab_reserve_balance / current_supply);

                assert(current_supply * 0.6 - thetalab_reserve_balance < EPSILON,  'invalid thetalab_reserve_balance ratio');
                assert(current_supply * 0.6 - thetalab_reserve_balance > -EPSILON, 'invalid thetalab_reserve_balance ratio');                
            })
    });

});



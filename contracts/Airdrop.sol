pragma solidity ^0.4.18;

import "./ThetaToken.sol";


//
//    Copyright 2017, Theta Labs, Inc.
//


contract Airdrop {

	uint8 public constant decimals = 18;

	ThetaToken token;

	function Airdrop(address _token) public {
		require(_token != 0x0);
		token = ThetaToken(_token);
	}

    function dropInBatch(address _source, address[] _recipients, uint _amountInWei) public {
    	for (uint i = 0; i < _recipients.length; i ++) {
            address recipient = _recipients[i];
            token.transferFrom(_source, recipient, _amountInWei);
        }
    }

}


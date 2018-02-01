pragma solidity ^0.4.18;

//
//    Copyright 2017, Theta Labs, Inc.
//

contract Token {
    
    function balanceOf(address _owner) public constant returns (uint balance);
    
    function transfer(address _to, uint _value) public returns (bool success);
}


contract Airdrop {

	Token token;

	address public admin = 0x0;

	function Airdrop(address _token, address _admin) public {
		require(_token != 0x0);
		require(_admin != 0x0);
		token = Token(_token);
		admin = _admin;
	}

    function dropInBatch(address[] _recipients, uint _tokenAmountInWei) only(admin) public {
    	for (uint i = 0; i < _recipients.length; i ++) {
            address recipient = _recipients[i];
            token.transfer(recipient, _tokenAmountInWei);
        }
    }

    function withdrawEther(address _withdrawAddress, uint _etherAmountInWei) only(admin) public {
    	_withdrawAddress.transfer(_etherAmountInWei);
    }

    function changeAdmin(address _newAdmin) only(admin) public {
    	admin = _newAdmin;
    }

    modifier only(address x) {
        require(msg.sender == x);
        _;
    }

}


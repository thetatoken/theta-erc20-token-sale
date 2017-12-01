pragma solidity ^0.4.18;

import "./SafeMath.sol";
import "./StandardToken.sol";

//
//    Copyright 2017, Theta Labs, Inc.
//

contract Controlled {

    address public controller;

    function Controlled() public {
        controller = msg.sender;
    }

    function changeController(address _newController) public only_controller {
        controller = _newController;
    }
    
    function getController() constant public returns (address) {
        return controller;
    }

    modifier only_controller { 
        require(msg.sender == controller);
        _; 
    }

}


contract ThetaToken is StandardToken, Controlled {
    
    using SafeMath for uint;

    string public constant name = "Theta Token";

    string public constant symbol = "THETA";

    uint8 public constant decimals = 18;

    // tokens can be transferred amoung holders only after unlockTime
    uint unlockTime;
    
    // for token circulation on platforms that integrate Theta before unlockTime
    mapping (address => bool) internal precirculated;

    function ThetaToken(uint _unlockTime) public {
        unlockTime = _unlockTime;
    }

    function transfer(address _to, uint _amount) can_transfer(msg.sender, _to) public returns (bool success) {
        return super.transfer(_to, _amount);
    }

    function transferFrom(address _from, address _to, uint _amount) can_transfer(_from, _to) public returns (bool success) {
        return super.transferFrom(_from, _to, _amount);
    }

    function mint(address _owner, uint _amount) external only_controller returns (bool) {
        require(totalSupply + _amount >= totalSupply);
        
        uint previousBalance = balances[_owner];
        require(previousBalance + _amount >= previousBalance);

        totalSupply = totalSupply.add(_amount);
        balances[_owner] = balances[_owner].add(_amount);

        Transfer(0, _owner, _amount);
        return true;
    }

    function allowPrecirculation(address _addr) only_controller public {
        precirculated[_addr] = true;
    }

    function disallowPrecirculation(address _addr) only_controller public {
        precirculated[_addr] = false;
    }

    function isPrecirculationAllowed(address _addr) constant public returns(bool) {
        return precirculated[_addr];
    }
    
    function changeUnlockTime(uint _unlockTime) only_controller public {
        unlockTime = _unlockTime;
    }

    function getUnlockTime() constant public returns (uint) {
        return unlockTime;
    }

    modifier can_transfer(address _from, address _to) {
        require((block.number >= unlockTime) || (isPrecirculationAllowed(_from) && isPrecirculationAllowed(_to)));
        _;
    }

}

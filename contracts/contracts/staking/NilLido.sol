// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IStETH {
    function mint(address to, uint256 amount) external;
}

contract NilLido {
    IStETH public stETH;
    uint256 public totalStaked;

    event Submitted(address indexed sender, uint256 amount);

    constructor(address _stETH) {
        stETH = IStETH(_stETH);
    }

    function submit(address /*_referral*/) external payable returns (uint256) {
        require(msg.value > 0, "Must send ETH");

        uint256 sharesAmount = msg.value;
        totalStaked += msg.value;
        stETH.mint(msg.sender, sharesAmount);

        emit Submitted(msg.sender, msg.value);
        return sharesAmount;
    }

    function getTotalStaked() external view returns (uint256) {
        return totalStaked;
    }

    receive() external payable {
        totalStaked += msg.value;
    }
}

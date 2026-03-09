// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NilToken.sol";

interface ILido {
    function submit(address referral) external payable returns (uint256);
}

interface IStETH {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function getExchangeRate() external view returns (uint256);
}

contract NilVault is ReentrancyGuard, Ownable {
    NilToken public nilToken;
    ILido public lido;
    IStETH public stETH;
    uint256 public constant COLLATERAL_RATIO = 150;

    mapping(address => uint256) public collateral;
    mapping(address => uint256) public debt;
    mapping(address => uint256) public depositedETH;

    uint256 public totalETHLocked;
    uint256 public totalNILMinted;
    uint256 public totalUsers;
    uint256 public totalStETHHeld;

    event Deposited(address indexed user, uint256 ethAmount, uint256 stEthReceived, uint256 nilAmount);
    event Redeemed(address indexed user, uint256 nilAmount, uint256 stEthReturned);

    constructor(address _nilToken, address _lido, address _stETH) Ownable(msg.sender) {
        nilToken = NilToken(_nilToken);
        lido = ILido(_lido);
        stETH = IStETH(_stETH);
    }

    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");

        uint256 stEthReceived = lido.submit{value: msg.value}(address(0));
        uint256 nilAmount = (stEthReceived * 100) / COLLATERAL_RATIO;

        if (collateral[msg.sender] == 0) {
            totalUsers++;
        }

        depositedETH[msg.sender] += msg.value;
        collateral[msg.sender] += stEthReceived;
        debt[msg.sender] += nilAmount;
        totalETHLocked += msg.value;
        totalStETHHeld += stEthReceived;
        totalNILMinted += nilAmount;

        nilToken.mint(msg.sender, nilAmount);

        emit Deposited(msg.sender, msg.value, stEthReceived, nilAmount);
    }

    function redeem(uint256 nilAmount) external nonReentrant {
        require(nilAmount > 0, "Amount must be greater than 0");
        require(debt[msg.sender] >= nilAmount, "Insufficient NIL debt");

        uint256 stEthToReturn = (nilAmount * COLLATERAL_RATIO) / 100;
        require(collateral[msg.sender] >= stEthToReturn, "Insufficient collateral");

        collateral[msg.sender] -= stEthToReturn;
        debt[msg.sender] -= nilAmount;
        totalStETHHeld -= stEthToReturn;
        totalNILMinted -= nilAmount;

        if (collateral[msg.sender] == 0) {
            totalUsers--;
        }

        nilToken.burn(msg.sender, nilAmount);

        require(stETH.transfer(msg.sender, stEthToReturn), "stETH transfer failed");

        emit Redeemed(msg.sender, nilAmount, stEthToReturn);
    }

    function getPosition(
        address user
    ) external view returns (uint256, uint256, uint256) {
        return (collateral[user], debt[user], depositedETH[user]);
    }

    function getStETHValue(address user) external view returns (uint256) {
        uint256 rate = stETH.getExchangeRate();
        return (collateral[user] * rate) / 1e18;
    }

    function getStats() external view returns (uint256, uint256, uint256, uint256) {
        return (totalETHLocked, totalNILMinted, totalUsers, totalStETHHeld);
    }
}

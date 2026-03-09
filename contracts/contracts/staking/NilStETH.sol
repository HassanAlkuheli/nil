// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NilStETH is ERC20, Ownable {
    address public minter;
    uint256 public lastRebaseTime;
    uint256 public deployTime;
    uint256 public constant DAILY_YIELD = 11;
    uint256 public constant YIELD_PRECISION = 100000;

    event MinterSet(address indexed minter);
    event Rebase(uint256 newTotalSupply);

    modifier onlyMinter() {
        require(msg.sender == minter, "Only minter can call");
        _;
    }

    constructor() ERC20("Staked ETH", "stETH") Ownable(msg.sender) {
        lastRebaseTime = block.timestamp;
        deployTime = block.timestamp;
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
        emit MinterSet(_minter);
    }

    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyMinter {
        _burn(from, amount);
    }

    function rebase() external {
        uint256 daysElapsed = (block.timestamp - lastRebaseTime) / 1 days;
        if (daysElapsed > 0) {
            uint256 currentSupply = totalSupply();
            uint256 newSupply = currentSupply
                * (YIELD_PRECISION + DAILY_YIELD * daysElapsed)
                / YIELD_PRECISION;
            uint256 mintAmount = newSupply - currentSupply;
            if (mintAmount > 0) {
                _mint(address(this), mintAmount);
            }
            lastRebaseTime = block.timestamp;
            emit Rebase(newSupply);
        }
    }

    function getExchangeRate() external view returns (uint256) {
        uint256 daysSinceDeployment = (block.timestamp - deployTime) / 1 days;
        return 1e18 + (daysSinceDeployment * DAILY_YIELD * 1e18 / YIELD_PRECISION);
    }
}

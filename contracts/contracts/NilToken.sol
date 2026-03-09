// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NilToken is ERC20, Ownable {
    address public vault;

    event VaultSet(address indexed vault);

    modifier onlyVault() {
        require(msg.sender == vault, "Only vault can call");
        _;
    }

    constructor() ERC20("Nil Token", "NIL") Ownable(msg.sender) {}

    function setVault(address _vault) external onlyOwner {
        require(vault == address(0), "Vault already set");
        require(_vault != address(0), "Invalid vault address");
        vault = _vault;
        emit VaultSet(_vault);
    }

    function mint(address to, uint256 amount) external onlyVault {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyVault {
        _burn(from, amount);
    }
}

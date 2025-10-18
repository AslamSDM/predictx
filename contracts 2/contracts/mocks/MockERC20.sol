// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockERC20 - Simple mintable ERC20 for testing
contract MockERC20 is ERC20, Ownable {
    constructor(string memory name_, string memory symbol_, uint256 initialSupply)
        Ownable(msg.sender)
        ERC20(name_, symbol_)
    {
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
        }
    }

    /// @notice Mint new tokens to an address (owner only)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}




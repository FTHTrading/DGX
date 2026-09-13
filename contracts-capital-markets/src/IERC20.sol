// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

/// @title IERC20
/// @notice Minimal ERC-20 interface for the waterfall's payToken interaction.
///         Uses bool returns (SafeERC20 concerns are out of scope here — the
///         waterfall checks each return and reverts on false, and USDC on
///         Base returns true on success).
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

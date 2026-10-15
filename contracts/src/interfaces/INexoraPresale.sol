// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface INexoraPresale {
    function purchased(address buyer) external view returns (uint256);
    function tgeTime() external view returns (uint256);
    function successful() external view returns (bool);
    function finalized() external view returns (bool);
    function totalSold() external view returns (uint256);
}

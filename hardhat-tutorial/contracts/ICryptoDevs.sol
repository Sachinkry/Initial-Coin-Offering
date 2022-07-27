// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ICryptoDevs {
    // a function to get token Id of the token owned by the owner
    // @dev returns the tokeId of the token in the owner's account
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId); 


    // @dev returns the no of tokens in the owner's account
    function balanceOf(address owner) external view returns (uint256 balance);

}
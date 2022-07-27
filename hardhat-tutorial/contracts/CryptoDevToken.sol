// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {

    // price of each cryptodevs token
    uint256 public constant tokenPrice = 0.001 ether;
    // no of tokens per nft
    uint256 public constant tokensPerNFT = 10 * 10**18;
    // max token supply
    uint256 public constant maxTotalSupply = 10000 * 10**18; 
    // create an instance of Cryptodevs nft contract
    ICryptoDevs cryptoDevsNFT;
    
    // mapping to keep track of which tokenIds has been claimed
    mapping(uint256 => bool) public tokenIdsClaimed;

    constructor(address _nftContractAddress) ERC20("Crypto Dev Token", "CD") {
        cryptoDevsNFT = ICryptoDevs(_nftContractAddress);
    }
    
    // 1. mint function: anyone can mint if they have got eth
    function mint(uint256 amount) public payable {
        uint256 _requiredAmount = amount * tokenPrice;
        require(msg.value >= _requiredAmount, "sending not enough ether");
        uint256 amountWithDecimals = amount * 10**18;
        require(
            (amountWithDecimals + totalSupply()) <= maxTotalSupply,
            "exceeded the max token supply"
        );

        _mint(msg.sender, amountWithDecimals);
    }
    // 2. claim function: those who have cryptodev NFTs can get 10 tokens/NFT
    function claim() public {
        address sender = msg.sender;
        // get the no of nfts(balance) owned by the caller
        uint256 balance = cryptoDevsNFT.balanceOf(sender);
        // check if balance is greater than 0, if not revert the transaction
        require(balance > 0, "You don't own any CryptoDevs NFT");
        // keep track of the tokens claimed for each NFT
        uint256 amount = 0;
        for(uint256 i; i < balance; i++) {
            uint256 tokenId = cryptoDevsNFT.tokenOfOwnerByIndex(sender, i);

            if(!tokenIdsClaimed[tokenId]) {
                amount += 1;
                tokenIdsClaimed[tokenId] = true;
            }
        }

        // revert the transaction if all tokens has been claimed
        require(amount > 0, "You have already claimed your tokens!");

        // call the internal function to mint the tokens 
        _mint(msg.sender, amount * tokensPerNFT);
    }

    // 3. withdraw function for owner of the contract 
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send ether!!");
    }

    // receive function is called when msg.data is empty
    receive() external payable {}
    // fallback function is called when msg.data is not empty
    fallback() external payable {}
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChainGardenNFT
 * @dev ERC-721 NFT contract for Chain Garden botanical specimens
 * Each NFT represents a unique plant generated from audio/visual data
 */
contract ChainGardenNFT is ERC721, ERC721URIStorage, Ownable {
    // Token ID counter - using native uint256 instead of Counters (OpenZeppelin v5+ removed Counters)
    uint256 private _tokenIdCounter;
    
    // Base URI for token metadata
    string private _baseTokenURI;
    
    // Minting price (in wei)
    uint256 public mintPrice;
    
    // Maximum supply (0 = unlimited)
    uint256 public maxSupply;
    
    // Mapping to track minted specimens
    mapping(uint256 => string) private _tokenMetadata;
    
    // Events
    event PlantMinted(address indexed to, uint256 indexed tokenId, string metadataURI);
    
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        uint256 _mintPrice,
        uint256 _maxSupply
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
        mintPrice = _mintPrice;
        maxSupply = _maxSupply;
    }
    
    /**
     * @dev Mint a new plant NFT
     * @param to Address to mint the NFT to
     * @param metadataURI URI pointing to the plant's metadata (JSON)
     */
    function safeMint(address to, string memory metadataURI) public payable {
        require(msg.value >= mintPrice, "Insufficient payment");
        
        if (maxSupply > 0) {
            require(_tokenIdCounter < maxSupply, "Max supply reached");
        }
        
        // Get current token ID and increment counter
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _tokenMetadata[tokenId] = metadataURI;
        
        emit PlantMinted(to, tokenId, metadataURI);
        
        // Refund excess payment
        if (msg.value > mintPrice) {
            payable(msg.sender).transfer(msg.value - mintPrice);
        }
    }
    
    /**
     * @dev Mint with custom metadata (for direct minting)
     */
    function mint(string memory metadataURI) public payable {
        safeMint(msg.sender, metadataURI);
    }
    
    /**
     * @dev Get the current token count
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Get metadata URI for a token
     */
    function getTokenMetadata(uint256 tokenId) public view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _tokenMetadata[tokenId];
    }
    
    /**
     * @dev Update mint price (owner only)
     */
    function setMintPrice(uint256 _newPrice) public onlyOwner {
        mintPrice = _newPrice;
    }
    
    /**
     * @dev Update base token URI (owner only)
     */
    function setBaseTokenURI(string memory newBaseURI) public onlyOwner {
        _baseTokenURI = newBaseURI;
    }
    
    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {ERC721PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

// Import UniversalNFTCore for universal NFT functionality
import "@zetachain/standard-contracts/contracts/nft/contracts/evm/UniversalNFTCore.sol";

/**
 * @title EVMUniversalNFT(deploy on connected chains)
 * @dev ERC-721 NFT contract for Chain Garden botanical specimens
 * Each NFT represents a unique plant generated from audio/visual data
 */
contract EVMUniversalNFT is
    Initializable, // Allows upgradeable contract initialization
    ERC721Upgradeable, // Base ERC721 implementation
    ERC721URIStorageUpgradeable, // Enables metadata URI storage
    ERC721EnumerableUpgradeable, // Provides enumerable token support
    ERC721PausableUpgradeable, // Allows pausing token operations
    OwnableUpgradeable, // Restricts access to owner-only functions
    ERC721BurnableUpgradeable, // Adds burnable functionality
    UUPSUpgradeable, // Supports upgradeable proxy pattern
    UniversalNFTCore // Add UniversalNFTCore for universal features
{
    // Track next token ID for minting
    uint256 private _nextTokenId;

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
    

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner,
        string memory name,
        string memory symbol,
        uint256 gas, // Set gas limit for universal NFT transfers
        address payable gatewayAddress // Include EVM gateway address
    ) public initializer {
        __ERC721_init(name, symbol);
        __ERC721Enumerable_init();
        __ERC721URIStorage_init();
        __ERC721Pausable_init();
        __Ownable_init(initialOwner);
        __ERC721Burnable_init();
        __UUPSUpgradeable_init();
        __UniversalNFTCore_init(gatewayAddress, address(this), gas); // Initialize universal NFT core
        mintPrice = 0;
        maxSupply = 0;
    }

    /**
     * @dev Mint a new plant NFT
     * @param to Address to mint the NFT to
     * @param metadataURI URI pointing to the plant's metadata (JSON)
     */
    function safeMint(
        address to,
        string memory metadataURI
    ) public payable onlyOwner whenNotPaused {
        require(msg.value >= mintPrice, "Insufficient payment");
        
        if (maxSupply > 0) {
            require(_nextTokenId < maxSupply, "Max supply reached");
        }

        // Generate globally unique token ID
        uint256 hash = uint256(
            keccak256(
                abi.encodePacked(address(this), block.number, _nextTokenId++)
            )
        );

        uint256 tokenId = hash & 0x00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

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

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // The following functions are overrides required by Solidity.

    /**
     * @dev Get the current token count
     */
    function totalSupply() public view override returns (uint256) {
        return _nextTokenId;
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    )
        internal
        override(
            ERC721Upgradeable,
            ERC721EnumerableUpgradeable,
            ERC721PausableUpgradeable
        )
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        override(
            ERC721Upgradeable,
            ERC721URIStorageUpgradeable,
            UniversalNFTCore // Include UniversalNFTCore for URI overrides
        )
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(
            ERC721Upgradeable,
            ERC721EnumerableUpgradeable,
            ERC721URIStorageUpgradeable,
            UniversalNFTCore // Include UniversalNFTCore for interface overrides
        )
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
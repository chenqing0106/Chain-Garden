// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {RevertContext} from "@zetachain/toolkit/contracts/Revert.sol";
import {UniversalContract, zContext} from "@zetachain/toolkit/contracts/UniversalContract.sol";
import {IGatewayZEVM, CallOptions, RevertOptions} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";

/**
 * @title ZetaChainUniversalNFT
 * @dev Simplified ERC-721 NFT contract with basic cross-chain functionality
 * Each NFT represents a unique plant generated from audio/visual data
 * This version implements a simplified cross-chain transfer without UniversalNFTCore
 */
contract ZetaChainUniversalNFT is
    ERC721,
    ERC721URIStorage,
    Ownable,
    UniversalContract
{
    // Gateway contract for cross-chain transfers
    IGatewayZEVM public gateway;
    
    // Mapping from ZRC20 address to connected contract address on other chains
    mapping(address => bytes) public connectedContracts;
    
    // Gas limit for cross-chain operations
    uint256 public gasLimit;
    // Track next token ID for minting (simple increment)
    uint256 private _nextTokenId;
    
    // Minting price (in wei)
    uint256 public mintPrice;
    
    // Maximum supply (0 = unlimited)
    uint256 public maxSupply;
    
    // Events
    event PlantMinted(address indexed to, uint256 indexed tokenId, string metadataURI);
    event CrossChainTransferInitiated(
        uint256 indexed tokenId,
        address indexed receiver,
        address indexed destination
    );
    event CrossChainTransferReceived(
        address indexed receiver,
        uint256 indexed tokenId,
        string metadataURI
    );
    
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner,
        address gatewayAddress,
        uint256 _gasLimit
    ) ERC721(name, symbol) Ownable(initialOwner) {
        // If gateway address is provided, set it; otherwise can be set later
        if (gatewayAddress != address(0)) {
            gateway = IGatewayZEVM(gatewayAddress);
        }
        // If gas limit is provided, use it; otherwise use default
        gasLimit = _gasLimit > 0 ? _gasLimit : 1000000;
        mintPrice = 0;
        maxSupply = 0;
    }

    /**
     * @dev Set gateway address (owner only, can be called after deployment if not set in constructor)
     */
    function setGateway(address gatewayAddress) public onlyOwner {
        require(gatewayAddress != address(0), "Invalid gateway address");
        gateway = IGatewayZEVM(gatewayAddress);
    }

    /**
     * @dev Mint a new plant NFT
     * @param to Address to mint the NFT to
     * @param metadataURI URI pointing to the plant's metadata (JSON)
     */
    function safeMint(
        address to,
        string memory metadataURI
    ) public payable {
        require(msg.value >= mintPrice, "Insufficient payment");
        
        if (maxSupply > 0) {
            require(_nextTokenId < maxSupply, "Max supply reached");
        }

        // Use simple incrementing token ID (much cheaper than hash)
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        emit PlantMinted(to, tokenId, metadataURI);
        
        // Refund excess payment
        if (msg.value > mintPrice) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - mintPrice}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @dev Mint with custom metadata (for direct minting)
     */
    function mint(string memory metadataURI) public payable {
        safeMint(msg.sender, metadataURI);
    }

    /**
     * @dev Update mint price (owner only)
     */
    function setMintPrice(uint256 _newPrice) public onlyOwner {
        mintPrice = _newPrice;
    }

    /**
     * @dev Update maximum supply (owner only)
     */
    function setMaxSupply(uint256 _maxSupply) public onlyOwner {
        maxSupply = _maxSupply;
    }

    /**
     * @dev Set connected contract address for a ZRC20 token (owner only)
     */
    function setConnectedContract(address zrc20, bytes calldata contractAddress) public onlyOwner {
        require(zrc20 != address(0), "Invalid ZRC20 address");
        require(contractAddress.length > 0, "Invalid contract address");
        connectedContracts[zrc20] = contractAddress;
    }

    /**
     * @dev Set gas limit for cross-chain operations (owner only)
     */
    function setGasLimit(uint256 _gasLimit) public onlyOwner {
        require(_gasLimit > 0, "Gas limit must be greater than 0");
        gasLimit = _gasLimit;
    }

    /**
     * @dev Transfer NFT cross-chain using ZRC20 for gas payment
     * @param tokenId The token ID to transfer
     * @param receiver Address of the receiver on the destination chain
     * @param destinationZRC20 ZRC20 address of the destination chain (for gas payment)
     * @notice User must approve this contract to spend the ZRC20 token before calling
     */
    function transferCrossChain(
        uint256 tokenId,
        address receiver,
        address destinationZRC20
    ) public {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(_isAuthorized(_ownerOf(tokenId), msg.sender, tokenId), "Not authorized");
        
        bytes memory connectedContract = connectedContracts[destinationZRC20];
        require(connectedContract.length > 0, "Destination not connected");

        // Get token URI
        string memory uri = tokenURI(tokenId);
        
        // Encode the message: receiver, tokenId, uri, sender
        bytes memory message = abi.encode(receiver, tokenId, uri, msg.sender);
        
        // Burn the NFT on this chain
        _burn(tokenId);
        
        emit CrossChainTransferInitiated(tokenId, receiver, destinationZRC20);
        
        // Prepare call and revert options
        CallOptions memory callOptions = CallOptions(gasLimit, false);
        RevertOptions memory revertOptions = RevertOptions(
            address(this),
            true,
            address(this),
            abi.encode(receiver, tokenId, uri, msg.sender),
            gasLimit
        );
        
        // Use gateway.call with ZRC20 for gas payment
        // Note: User must approve this contract to spend ZRC20 tokens first
        gateway.call(
            connectedContract,
            destinationZRC20,
            message,
            callOptions,
            revertOptions
        );
    }

    /**
     * @dev Receive cross-chain NFT transfer (called by Gateway)
     */
    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        // Verify caller is the gateway
        require(msg.sender == address(gateway), "Only gateway can call");
        
        // Verify the sender is a connected contract
        require(
            keccak256(context.origin) == keccak256(connectedContracts[zrc20]),
            "Unauthorized sender"
        );
        
        // Decode the message: receiver, tokenId, uri, sender
        (address receiver, uint256 tokenId, string memory uri, address sender) = 
            abi.decode(message, (address, uint256, string, address));
        
        // Mint the NFT to the receiver
        _safeMint(receiver, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit CrossChainTransferReceived(receiver, tokenId, uri);
    }

    /**
     * @dev Handle revert from cross-chain transfer (called by Gateway)
     */
    function onRevert(RevertContext calldata context) external override {
        // Verify caller is the gateway
        require(msg.sender == address(gateway), "Only gateway can call");
        
        // Decode revert message: receiver, tokenId, uri, sender
        (address receiver, uint256 tokenId, string memory uri, address sender) = 
            abi.decode(context.revertMessage, (address, uint256, string, address));
        
        // Re-mint the NFT to the original sender
        _safeMint(sender, tokenId);
        _setTokenURI(tokenId, uri);
    }

    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdraw failed");
    }

    /**
     * @dev Get the current token count
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
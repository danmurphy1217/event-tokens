pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

// SPDX-License-Identifier: MIT
contract DoubleTrouble is ERC721URIStorage {
  // nested mapping that keeps track of who owns the NFTs
  mapping (uint256 => uint256) public _forSalePrices;
  mapping (uint256 => uint256) public _lastPurchasePrices;
  address _originalCollection;

  constructor(string memory name, string memory symbol, address nftCollection) ERC721(name, symbol) {
    require(nftCollection != address(0), "collection address cannot be zero");
    require(IERC721Metadata(nftCollection).supportsInterface(0x80ac58cd),  "collection must refer to an ERC721 address");
    _originalCollection = nftCollection;
  }

  function makeDTable(uint256 tokenId) external {
    require(IERC721Metadata(_originalCollection).getApproved(tokenId) == address(this), "DoubleTrouble contract must be approved to operate this token");

    // In the original collection, the owner forever becomes the DoubleTrouble contract
    address owner = IERC721Metadata(_originalCollection).ownerOf(tokenId);
    IERC721Metadata(_originalCollection).transferFrom(owner, address(this), tokenId);

    // Mint an NFT in the DT contract so we start recording the true owner here
    _mint(owner, tokenId);
  }

  function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory data) public override {
    revert("Please use the function buy");
  }

  function safeTransferFrom(address _from, address _to, uint256 _tokenId) public override {
    revert("Please use the function buy");
  }

  function transferFrom(address _from, address _to, uint256 _tokenId) public override { 
    revert("Please use the function buy");
  }

  function forSalePrice(uint256 tokenId) external view returns (uint256) {
    require(ownerOf(tokenId) != address(0), "collection and tokenId combination is not present in DT");
    return _forSalePrices[tokenId];
  }

  function lastPurchasePrice(uint256 tokenId) external view returns (uint256) {
    require(ownerOf(tokenId) != address(0), "collection and tokenId combination is not present in DT");
    return _lastPurchasePrices[tokenId];
  }

  // sets currentForSalePrice to price
  function putUpForSale(uint256 tokenId, uint256 price) external {
    require(msg.sender == ownerOf(tokenId), "msg.sender should be current owner of NFT");
    _forSalePrices[tokenId] = price;
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    return IERC721Metadata(_originalCollection).tokenURI(tokenId);
  }
}

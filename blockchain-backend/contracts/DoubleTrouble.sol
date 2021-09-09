pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "./DoubleTroubleOrchestrator.sol";
import "./Libraries.sol";

// SPDX-License-Identifier: MIT
contract DoubleTrouble is ERC721URIStorage {
  // nested mapping that keeps track of who owns the NFTs
  mapping (uint256 => uint256) public _forSalePrices;
  mapping (uint256 => uint256) public _lastPurchasePrices;
  DoubleTroubleOrchestrator _dto;
  address _originalCollection;
  address _feeWallet;
  uint256 _feeRate = 130;
  uint256[] _registeredTokens;

  constructor(string memory name, string memory symbol, address nftCollection, address feeWallet, address dto) ERC721(name, symbol) {
    require(nftCollection != address(0), "collection address cannot be zero");
    require(dto != address(0), "dto address cannot be zero");
    _originalCollection = nftCollection;
    _feeWallet = feeWallet;
    _dto = DoubleTroubleOrchestrator(dto);
  }

  function originalCollection() external view returns (address) {
    return _originalCollection;
  }

  function safeTransferFrom(address, address, uint256, bytes memory) public override pure {
    revert("Please use buy or forceBuy");
  }

  function safeTransferFrom(address, address, uint256) public override pure {
    revert("Please use buy or forceBuy");
  }

  function transferFrom(address, address, uint256) public override pure {
    revert("Please use buy or forceBuy");
  }

  function forSalePrice(uint256 tokenId) external view returns (uint256) {
    return _forSalePrices[tokenId];
  }

  function lastPurchasePrice(uint256 tokenId) external view returns (uint256) {
    return _lastPurchasePrices[tokenId];
  }

  function troublesomeTokenURI(uint256 tokenId) external view returns (string memory) {
    return IERC721Metadata(_originalCollection).tokenURI(tokenId);
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    string memory output = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><style>.base { fill: white; font-family: serif; font-size: 16px; }</style><rect width="100%" height="100%" fill="black" /><text x="10" y="20" class="base">You are in trouble</text></svg>';

    string memory originalAddr = Stringify.toString(_originalCollection);
    string memory troublesomeAddr = Stringify.toString(address(this));
    string memory strTokenId = Stringify.toString(tokenId);
    string memory externalLink = string(abi.encodePacked('https://double-trouble.io/collections/', troublesomeAddr, '/', strTokenId));
    string memory json = Base64.encode(bytes(string(abi.encodePacked('{"name": "DEADBEEF", "external_link": "',
                                                                      externalLink, '", "originalCollection": "',
                                                                      originalAddr, '", "troublesomeCollection": "',
                                                                      troublesomeAddr, '", "description": "This NFT is only for sale in Double Trouble. Visit double-trouble.io to learn more.", "image": "data:image/svg+xml;base64,',
                                                                      Base64.encode(bytes(output)), '"}'))));
    return string(abi.encodePacked('data:application/json;base64,', json));
  }

  function setPrice(uint256 tokenId, uint256 price) external {
    // Putting up for sale for the first time
    if (_lastPurchasePrices[tokenId] == 0) {
      require(IERC721Metadata(_originalCollection).getApproved(tokenId) == address(this), "DoubleTrouble contract must be approved to operate this token");
    // All times after
    } else {
      require(_isApprovedOrOwner(msg.sender, tokenId), "msg.sender should be approved or owner of NFT");
    }
    _forSalePrices[tokenId] = price;
  }

  function buy(uint256 tokenId) payable external {
    require(_forSalePrices[tokenId] > 0, "NFT is not for sale");
    require(msg.value >= _forSalePrices[tokenId], "Value sent must be at least the for sale price");

    // Make NFT troublesome if this is the first time it's being purchased
    if (_lastPurchasePrices[tokenId] == 0) {
      require(IERC721Metadata(_originalCollection).getApproved(tokenId) == address(this), "DoubleTrouble contract must be approved to operate this token");

      // In the original collection, the owner forever becomes the DoubleTrouble contract
      address owner = IERC721Metadata(_originalCollection).ownerOf(tokenId);
      IERC721Metadata(_originalCollection).transferFrom(owner, address(this), tokenId);

      // Mint an NFT in the DT contract so we start recording the true owner here
      _mint(owner, tokenId);
      _registeredTokens.push(tokenId);
    }

    _completeBuy(msg.sender, tokenId, msg.value);
  }

  function forceBuy(uint256 tokenId) payable external {
    require(_lastPurchasePrices[tokenId] > 0, "NFT was not yet purchased within DoubleTrouble");
    require(msg.value >= (2 * _lastPurchasePrices[tokenId]), "Value sent must be at least twice the last purchase price");
    _completeBuy(msg.sender, tokenId, msg.value);
  }

  function _completeBuy(address newOwner, uint256 tokenId, uint256 amountPaid) internal virtual {
    // Change owner, set last purchase price, and remove from sale
    address oldOwner = ownerOf(tokenId);
    _transfer(oldOwner, newOwner, tokenId);
    _lastPurchasePrices[tokenId] = amountPaid;
    _forSalePrices[tokenId] = 0;
    uint256 feeToCharge = amountPaid / _feeRate;

    // Send ether to the old owner. Must be at the very end of the buy function to prevent reentrancy attacks
    // https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/
    (bool oldOwnersuccess, ) = oldOwner.call{value: amountPaid - 2 * feeToCharge}("");
    require(oldOwnersuccess, "Transfer to owner failed.");

    // Send fee to patron of this troublesome Collection
    address patron = _dto.patronOf(address(this));
    (bool patronSuccess, ) = patron.call{value: feeToCharge}("");

    // Send rest of the fee to the DT wallet
    uint256 rest = patronSuccess ? feeToCharge : 2 * feeToCharge;
    (bool feeWalletSuccess, ) = _feeWallet.call{value: rest}("");
    require(feeWalletSuccess, "Transfer to DT wallet failed.");
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == 0xdeadbeef || super.supportsInterface(interfaceId);
  }

  function registeredTokens() external view returns (uint256[] memory) {
    return _registeredTokens;
  }
}

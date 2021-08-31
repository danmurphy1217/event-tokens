import React, { Component } from "react";
import DoubleTroubleContract from "./contracts/DoubleTrouble.json";
import DoubleTroubleOrchestratorContract from "./contracts/DoubleTroubleOrchestrator.json";
import GenericNFTContract from './contracts/IERC721Metadata.json';

import "./App.css";

// TODO: is dtable?

// 1) Inputs (Props)
// 2) local state (only exists in client)
// 3) Cache of external state

const DTO_CONTRACT_ADDR = "0x2b97782265b7DEF837165409aD245A3f3Da8d8BB";
const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

class CollectionInspector extends Component {
  constructor() {
    super();
    this.localState = {error: undefined};
    this.externalCache = {
      dto: undefined, troublesomeCollection: undefined,
    };
  };

  componentDidUpdate() {
    if (this.props.web3) {
      this.deriveAndRender();
    }
  };

  deriveAndRender = () => {
    this.deriveExternalCache().then((ret) => {
      this.externalCache = ret;
      this.forceUpdate();
    }).catch((err) => {
      console.error(err);
      this.localState.error = err.message;
      this.forceUpdate();
    });
  };

  deriveExternalCache = async () => {

  render() {

  };
}

class ERC721Inspector extends Component {
  constructor() {
    super();
    this.localState = {error: undefined};
    this.externalCache = {
      dto: undefined, troublesomeCollection: undefined,
    };
  };

  componentDidUpdate() {
    if (this.props.web3) {
      this.deriveAndRender();
    }
  };

  deriveAndRender = () => {
    this.deriveExternalCache().then((ret) => {
      this.externalCache = ret;
      this.forceUpdate();
    }).catch((err) => {
      console.error(err);
      this.localState.error = err.message;
      this.forceUpdate();
    });
  };

  deriveExternalCache = async () => {
    const dto = new this.props.web3.eth.Contract(
      DoubleTroubleOrchestratorContract.abi,
      DTO_CONTRACT_ADDR,
    );

    const nftCollection = new this.props.web3.eth.Contract(
      GenericNFTContract.abi,
      this.props.collection,
    );

    var troublesomeCollection, nftOwner, collectionName, collectionSymbol;
    try {
      troublesomeCollection = await dto.methods.troublesomeCollection(this.props.collection).call();
      collectionName = await nftCollection.methods.name().call();
      collectionSymbol = await nftCollection.methods.symbol().call();
    } catch(_err) {
      throw new Error('Invalid ERC721 Address ' + this.props.collection)
    }

    const tokenURI = await nftCollection.methods.tokenURI(this.props.tokenId).call();

    try {
      nftOwner = await nftCollection.methods.ownerOf(this.props.tokenId).call();
    } catch(_err) {
      throw new Error(`NFT ${this.props.tokenId} not found in collection ${this.props.collection}`)
    }
    const isOwner = nftOwner && nftOwner == this.props.web3.defaultAccount;

    return {
      dto, nftCollection, troublesomeCollection, nftOwner, isOwner,
      collectionName, collectionSymbol, tokenURI,
    };
  }

  render() {
    var loadedNft = undefined;
    if (this.externalCache.collectionName) {
      loadedNft = <div>
        Name: {this.externalCache.collectionName} Symbol: {this.externalCache.collectionSymbol} tokenURI: {this.externalCache.tokenURI}
        </div>;
    }

    if (this.localState.error != undefined) {
      return <div>
          {loadedNft != undefined ? loadedNft : null}
          <div className="error-box">Error: {this.localState.error}</div>
        </div>;
    }

    if (this.props.web3 == undefined) {
      return <div>Loading web3...</div>;
    }

    if (this.externalCache.troublesomeCollection == ZERO_ADDR) {
      return (<div>
        {loadedNft}
        <div>This NFT collection is not in DoubleTrouble yet</div>
        <button onClick={this.makeTroublesomeCollection}>
          Create a troublesome collection for it
        </button>
      </div>);
    }

    if (this.externalCache.troublesomeCollection == undefined) {
      return <div className="error-box">Something went wrong</div>
    }
    return (<div>
      <div>Name: {this.externalCache.collectionName} Symbol: {this.externalCache.collectionSymbol}</div>
      This NFT already has a troublesome Collection.
      <a href={`/collections/${this.externalCache.troublesomeCollection}/${this.props.tokenId}`}>View it</a>
    </div>);
  }

  makeTroublesomeCollection = async () => {
    try {
      const {dto, collectionName, collectionSymbol} = this.externalCache;
      const response = await dto.methods
        .makeTroublesomeCollection(this.props.collection, collectionName, collectionSymbol)
        .send({from: this.props.web3.defaultAccount});
      this.deriveAndRender();
    } catch(err) {
      console.warn("Error when making Troublesome collection");
      console.warn(err);
    }
  };
};

class TroublesomeCollectionInspector extends Component {
  constructor() {
    super();
    this.localState = {
      inputSalePrice: "",
      error: undefined,
    };
    this.externalCache = {
      tokenURI: "",
      isOwner: false,
      isDTable: true,
    };

    this.deriveExternalCache().then((ret) => {
      this.externalCache = ret;
      this.forceUpdate();
    }).catch((err) => {
      console.error(err);
      this.localState.error = err.message;
      this.forceUpdate();
    });
  };

  deriveExternalCache = async () => {
    const dtCollection = new this.props.web3.eth.Contract(
      DoubleTroubleContract.abi,
      this.props.collection,
    );

    const tokenURI = await dtCollection.methods.tokenURI(this.props.tokenId).call() || "not found";

    const nftOwner = await instance.methods.ownerOf(this.props.tokenId).call() || "no owner found";
    const forSalePrice = await instance.methods.forSalePrice(this.props.tokenId).call() || "no for sale price found";
    const lastPurchasePrice = await instance.methods.lastPurchasePrice(this.props.tokenId).call() || "no last purchase price found";
    const isOwner = nftOwner && nftOwner == this.props.web3.defaultAccount;
    const isDTable = true; // TODO

    return {tokenURI, isOwner, isDTable}
  };

  render() {
    if (this.localState.error != undefined) {
      return <div className="error-box">Error: {this.localState.error}</div>
    }

    if (!this.externalCache.web3) {
      return <div>Loading...</div>;
    }

    const { isOwner, isDTable, forSalePrice, lastPurchasePrice } = this.externalCache;
    const isForSale = forSalePrice > 0;

    const showMakeDTableButton = isOwner && !isDTable;
    // TODO: consider creating unmakeDTable function in contract?
    const showUnMakeDTableButton = isOwner && isDTable;
    const showPutUpForSaleButton = isOwner && isDTable && !isForSale;
    const showUnPutUpForSaleButton = isOwner && isDTable && isForSale;
    const showBuyButton = !isOwner && isDTable && isForSale;
    const showForceBuyButton = !isOwner && isDTable && lastPurchasePrice > 0;

    const makeDTableButton =
      <button onClick={() => this.makeDTable(true)}>
        Make DTable
      </button>;

    const unMakeDTableButton =
      <button onClick={() => this.makeDTable(false)}>
        Unmake DTable
      </button>;

    const putUpForSaleButton =
      <>
        <label>
          New price:
          <input onChange={(e) => this.handlePriceInputChange(e)} value={this.localState.inputSalePrice} />
        </label>
        <button onClick={() => this.putUpForSale(true)}>
          Put up for sale
        </button>
      </>;

    const unPutUpForSaleButton =
      <button onClick={() => this.putUpForSale(false)}>
        Unput up for sale
      </button>;

    const buyButton =
      <>
        <label>
          Buy for:
          <input onChange={(e) => this.handleBuyInputChange(e)} value={this.localState.inputBuyPrice} />
        </label>
        <button onClick={() => this.buy()}>Buy</button>
      </>;

    const forceBuyButton =
      <>
        <label>
          Force buy for:
          <input onChange={(e) => this.handleForceBuyInputChange(e)} value={this.localState.inputForceBuyPrice} />
        </label>
        <button onClick={() => this.forceBuy()}>Force buy</button>
      </>;

    return (
      <div className="CollectionInspector">
        <h1>DoubleTrouble</h1>
        <p>Token URI: {this.externalCache.tokenURI}</p>
        <p>Is DTable: {this.externalCache.isDTable.toString()}</p>
        <p>Is owner: {this.externalCache.isOwner.toString()}</p>
        <p>For sale price: {this.externalCache.forSalePrice}</p>
        <p>Last purchase price: {this.externalCache.lastPurchasePrice}</p>
        { showMakeDTableButton && makeDTableButton }
        { showUnMakeDTableButton && unMakeDTableButton }
        { showPutUpForSaleButton && putUpForSaleButton }
        { showUnPutUpForSaleButton && unPutUpForSaleButton }
        { showBuyButton && buyButton }
        { showForceBuyButton && forceBuyButton }
      </div>
    );
  }

  makeDTable = async (isDTable) => {
    if (!isDTable) {
      this.setState({ isDTable });
      return;
    }
    try {
      const { contract, tokenId, defaultUser } = this.state;
      const response = await contract.methods.makeDTable(tokenId).send({from: defaultUser});
      this.setState({ isDTable });
    } catch(err) {
      console.log("Unable to make DTable");
    }
  };

  putUpForSale = async (isForSale) => {
    if (!isForSale) {
      this.setState({ isForSale });
      return;
    }
    try {
      const { contract, inputSalePrice, tokenId, defaultUser } = this.state;
      const intInputSalePrice = parseInt(inputSalePrice);
      if (intInputSalePrice <= 0) {
        alert("Please input a price greater than or equal to zero.");
        return;
      }
      const response = await contract.methods.putUpForSale(tokenId, intInputSalePrice).send({from: defaultUser});
      this.setState({ isForSale });
    } catch(err) {
      console.log("Unable to put up for sale");
    }
  };

  buy = async () => {
    try {
      const { contract, tokenId, defaultUser, inputBuyPrice } = this.state;
      const intInputBuyPrice = parseInt(inputBuyPrice);
      if (intInputBuyPrice <= 0) {
        alert("Please input a price greater than or equal to zero.");
        return;
      }
      const response = await contract.methods.buy(tokenId).send({from: defaultUser, value: intInputBuyPrice});
    } catch (err) {
      console.log("Unable to buy NFT");
    }
  };

  forceBuy = async () => {
    try {
      const { contract, tokenId, defaultUser, inputForceBuyPrice } = this.state;
      const intInputForceBuyPrice = parseInt(inputForceBuyPrice);
      if (intInputForceBuyPrice <= 0) {
        alert("Please input a price greater than or equal to zero.");
        return;
      }
      const response = await contract.methods.forceBuy(tokenId).send({from: defaultUser, intInputForceBuyPrice});
    } catch(err) {
      console.log("Unable to force buy");
    }
  };

  handlePriceInputChange = (e) => {
    e.persist();
    this.setState({inputSalePrice: e.target.value});
  };

  handleBuyInputChange = (e) => {
    e.persist();
    this.setState({inputBuyPrice: e.target.value});
  };

  handleForceBuyInputChange = (e) => {
    e.persist();
    this.setState({inputForceBuyPrice: e.target.value});
  };

}

export default ERC721Inspector;

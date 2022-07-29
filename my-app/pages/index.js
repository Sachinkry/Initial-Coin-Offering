import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Web3Modal from "web3modal";
import React, { useState, useEffect, useRef } from 'react'
import { BigNumber, Contract, providers, utils } from "ethers";
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

export default function Home() {
  // converts 0 into a bignumber i.e {BigNumber: "000000000000000000"}
  const zero = BigNumber.from(0);
  const [walletConnected, setWalletConnected] = useState(false);
  // useRef returns a mutable ref. object with a single property 'current' whose value is undefined for now
  // web3ModalRef = {current: }
  const web3ModalRef = useRef();
  // amount of CD tokens owned by an address
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero);
  // overall no of minted tokens
  const [tokensMinted, setTokensMinted] = useState(zero);
  // amount of tokens you want to mint
  const [tokenAmount, setTokenAmount] = useState(zero);
  // tokens to be claimed by the CD NFTs holder
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  const [loading, setLoading] = useState(false);

  // useEffect takes two arguments(a function & an array)
  // useEffect(arrow function, [state variable])
  // the array represents what changes will trigger this effect
  // in this case, whenever the value of "walletconnected" changes - this effect will be called
  useEffect(() => {
    if (!walletConnected) {
      // creates a new instance of Web3Modal class and assign it to reference object's current property
      // this 'current' persists as long as page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getBalanceOfCryptoDevTokens();
      getTotalTokensMinted();
      getTokensToBeClaimed();
    }
  }, [walletConnected]);


  // connectWallet : 
  const connectWallet = async () => {
    try {
      await getSignerOrProvider();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  // get signer or provider
  const getSignerOrProvider = async (needSigner = false) => {
    // connect to metamask wallet
    // since we stored 'web3modal' as a reference, we need to access 'current' value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();

    // if not connected to rinkeby, alert the user to change the network and throw an error in console 
    if (chainId !== 4) {
      window.alert("Change network to rinkeby");
      throw new Error("not on rinekby network");
    }

    // returns signer when needSigner is true
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  // claim function for nft holders
  const claimCryptoDevTokens = async () => {
    try {
      const signer = await getSignerOrProvider(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const txn = await tokenContract.claim();
      setLoading(true);
      await txn.wait();
      setLoading(false);

      window.alert("Succesfully claimed CryptoDev tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  }

  // mint function for anyone to mint tokens
  const mintCryptoDevTokens = async (amount) => {
    try {
      const signer = await getSignerOrProvider(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      // total eth need to mint 'amount' no of CD tokens
      const value = 0.001 * amount;
      const txn = await tokenContract.mint(amount, {
        // value.toString() converts value into string as parseEther takes string only
        // utils.parseEther converts the string value into a bignumber
        // {BigNumber: "value * 10**18"}
        value: utils.parseEther(value.toString())
      });
      setLoading(true);
      await txn.wait();
      setLoading(false);

      window.alert("Succesfully minted CryptoDev tokens")
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  }

  // get no of tokens minted by a particular address
  const getBalanceOfCryptoDevTokens = async () => {
    try {
      const provider = await getSignerOrProvider();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // get signer to get access to the address of the currently connected metamask account
      const signer = await getSignerOrProvider(true);
      // get the address 
      const address = await signer.getAddress();
      // get the no of CD tokens owned by this address
      // balance is a BigNumber 
      const balance = await tokenContract.balanceOf(address);
      setBalanceOfCryptoDevTokens(balance);
    } catch (err) {
      console.error(err);
      setBalanceOfCryptoDevTokens(zero);
    }
  }

  // get overall no of tokens minted
  const getTotalTokensMinted = async () => {
    try {
      // get provider from web3modal(in this case: metamask)
      const provider = await getSignerOrProvider();
      // create an instance of "CryptoDevToken.sol" contract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      const _totalTokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_totalTokensMinted);
    } catch (err) {
      console.error(err);
    }
  }

  // get tokens to claimed by the nft holder
  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getSignerOrProvider();
      // create an instance of CD's nft contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      // create an instance of CD's token contract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // we need to get signer to get address of the current connected metamask account
      const signer = await getSignerOrProvider(true);
      // get address
      const address = await signer.getAddress();
      // get the no of CD NFTs owned by this address
      const balance = await nftContract.balanceOf(address);

      if (balance === zero) {
        setTokensToBeClaimed(zero);
        console.log('nincompoop!');
      } else {
        // amount variable to keep track of no of unclaimed CD tokens by the CD nft holder
        var amount = 0;

        for (var i; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);

          if (!claimed) {
            amount++;
          }
          console.log("tokens claimed:", balance)
        }
        // tokensToBeClaimed is initialized to BigNumber, so we need to conver 'amount' to BigNumber
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (err) {
      console.error(err);
      setTokensToBeClaimed(zero);
    }
  }

  const renderButton = () => {
    if (loading) {
      return (
        <div>
          <button className={styles.button}>loading...</button>
        </div>
      );
    }

    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} CryptoDev tokens to be claimed
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>Claim Tokens</button>
        </div>
      );
    }

    return (
      <div style={{ display: "flex-col" }}>
        <input
          type="number"
          placeholder="Amount of tokens"
          onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))} />
        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintCryptoDevTokens(tokenAmount)}>Mint tokens</button>
      </div>
    )

  }

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>

          <div>
            {walletConnected ?
              (
                <div>
                  <div className={styles.description}>
                    {/* Format Ether helps us in converting a BigNumber to string */}
                    You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Crypto
                    Dev Tokens
                  </div>
                  <div className={styles.description}>
                    {/* Format Ether helps us in converting a BigNumber to string */}
                    Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
                  </div>
                  {renderButton()}
                </div>
              )
              :
              (
                <button className={styles.button} onClick={connectWallet}>
                  Connect your wallet
                </button>

              )
            }
          </div>

        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  )
}


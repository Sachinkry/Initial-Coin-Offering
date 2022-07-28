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
  const zero = BigNumber.from(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const web3ModalRef = useRef();
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero);
  // overall no of minted tokens
  const [tokensMinted, setTokensMinted] = useState(zero);
  // amount of tokens you want to mint
  const [tokenAmount, setTokenAmount] = useState(zero);
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false
      });
      connectWallet();
      getBalanceOfCryptoDevTokens();
      getTotalTokensMinted();
      getTokensToBeClaimed();
    }
    getTokensToBeClaimed();
  }, [walletConnected]);


  // connectWallet function 
  const connectWallet = async () => {
    try {
      await getSignerOrProvider();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  }

  // get signer or provider
  const getSignerOrProvider = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();

    if (chainId !== 4) {
      window.alert("Change network to rinkeby");
      throw new Error("not on rinekby network");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  // withdraw function for owner to withdraw funds
  const withdrawCoins = async () => {
    try {
      const signer = await getSignerOrProvider(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const txn = await tokenContract.withdraw();
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await getOwner();
    } catch (err) {
      console.error(err);
    }
  }
  //getowner
  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider);
      // call the owner function from the contract
      const _owner = await tokenContract.owner();
      // we get signer to extract address of currently connected Metamask account
      const signer = await getProviderOrSigner(true);
      // Get the address associated to signer which is connected to Metamask
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

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
      const value = 0.001 * amount;
      const txn = await tokenContract.mint(amount, {
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
      const signer = await getSignerOrProvider(true);
      const address = await signer.getAddress();
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
      const provider = await getSignerOrProvider();
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
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      const signer = await getSignerOrProvider(true);
      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);

      if (balance === zero) {
        setTokensToBeClaimed(zero);
        console.log('nincompoop!');
      } else {
        var amount = 0;

        for (var i; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);

          if (!claimed) {
            amount++;
          }
          console.log("tokens claimed:", balance)
        }
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
      )
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


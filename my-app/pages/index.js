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
  const [walletConnected, setWalletConnected] = useState(false);
  const web3ModalRef = useRef();

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false
      });
      connectWallet();
    }
  }, []);

  // 

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
            <div className={styles.description}>
              {/* Format Ether helps us in converting a BigNumber to string */}
              You have minted 0 Crypto
              Dev Tokens
            </div>
            <div className={styles.description}>
              {/* Format Ether helps us in converting a BigNumber to string */}
              Overall 0/10000 have been minted!!!
            </div>
          </div>
          <button className={styles.button} onClick={connectWallet}>
            Connect your wallet
          </button>

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


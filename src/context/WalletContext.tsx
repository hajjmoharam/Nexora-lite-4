import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from './ToastContext';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const RITUAL_CHAIN_ID = '0x7BB';
const RITUAL_NETWORK = {
  chainId: '0x7BB',
  chainName: 'Ritual',
  nativeCurrency: {
    name: 'RITUAL',
    symbol: 'RITUAL',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.ritualfoundation.org'],
  blockExplorerUrls: ['https://explorer.ritualfoundation.org'],
};

const FEE_RECIPIENT = '0xd06bC18129a8be9af885E7E63B1B95FB19c261b3';

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string;
  isCorrectNetwork: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToRitual: () => Promise<void>;
  purchaseItem: (
    price: string,
    itemType: 'xp_booster' | 'premium_pass'
  ) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const { showToast } = useToast();

  const connectWallet = async () => {
    if (!window.ethereum) {
      showToast('error', 'Please install MetaMask to continue');
      return;
    }
    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      if (!accounts || accounts.length === 0) return;
      const address = accounts[0];
      setWalletAddress(address);
      setIsConnected(true);
      localStorage.setItem('nexora_wallet', address.toLowerCase());
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setIsCorrectNetwork(chainId === RITUAL_CHAIN_ID);
    } catch (err: any) {
      if (err.code === 4001) {
        showToast('error', 'Connection rejected by user.');
      } else {
        showToast('error', 'Failed to connect. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress('');
    setIsCorrectNetwork(false);
    localStorage.removeItem('nexora_wallet');
  };

  const switchToRitual = async () => {
    if (!window.ethereum) {
      showToast('error', 'Please install MetaMask to continue');
      return;
    }
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: RITUAL_CHAIN_ID }],
      });
      setIsCorrectNetwork(true);
    } catch (err: any) {
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [RITUAL_NETWORK],
          });
          setIsCorrectNetwork(true);
        } catch {
          showToast('error', 'Failed to add Ritual network.');
        }
      } else if (err.code !== 4001) {
        showToast('error', 'Failed to switch network.');
      }
    }
  };

  const purchaseItem = async (
    price: string,
    _itemType: 'xp_booster' | 'premium_pass'
  ): Promise<string> => {
    if (!window.ethereum) {
      throw new Error('NO_WALLET');
    }
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== RITUAL_CHAIN_ID) {
      throw new Error('WRONG_NETWORK');
    }

    const { ethers } = await import('ethers');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const tx = await signer.sendTransaction({
      to: FEE_RECIPIENT,
      value: ethers.parseEther(price),
    });

    await tx.wait();
    return tx.hash;
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const savedWallet = localStorage.getItem('nexora_wallet');
    if (savedWallet) {
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (
            accounts.length > 0 &&
            accounts[0].toLowerCase() === savedWallet.toLowerCase()
          ) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            window.ethereum
              .request({ method: 'eth_chainId' })
              .then((chainId: string) => {
                setIsCorrectNetwork(chainId === RITUAL_CHAIN_ID);
              });
          }
        });
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setWalletAddress(accounts[0]);
        localStorage.setItem('nexora_wallet', accounts[0].toLowerCase());
      }
    };

    const handleChainChanged = (chainId: string) => {
      setIsCorrectNetwork(chainId === RITUAL_CHAIN_ID);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        walletAddress,
        isCorrectNetwork,
        connectWallet,
        disconnectWallet,
        switchToRitual,
        purchaseItem,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

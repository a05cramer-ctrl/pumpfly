import { useState, useEffect, useCallback } from 'react';

interface PhantomWallet {
  isPhantom?: boolean;
  publicKey?: {
    toString(): string;
  };
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  on(event: string, callback: () => void): void;
  removeListener(event: string, callback: () => void): void;
}

declare global {
  interface Window {
    solana?: PhantomWallet;
  }
}

export function useWallet() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);

  useEffect(() => {
    // Check if Phantom is installed
    if (window.solana && window.solana.isPhantom) {
      setIsPhantomInstalled(true);
      
      // Check if already connected
      if (window.solana.publicKey) {
        setWalletAddress(window.solana.publicKey.toString());
      }

      // Listen for account changes
      const handleAccountChange = () => {
        if (window.solana?.publicKey) {
          setWalletAddress(window.solana.publicKey.toString());
        } else {
          setWalletAddress(null);
        }
      };

      window.solana.on('accountChanged', handleAccountChange);

      return () => {
        if (window.solana) {
          window.solana.removeListener('accountChanged', handleAccountChange);
        }
      };
    } else {
      setIsPhantomInstalled(false);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.solana || !window.solana.isPhantom) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    try {
      setIsConnecting(true);
      const response = await window.solana.connect();
      setWalletAddress(response.publicKey.toString());
    } catch (error) {
      console.error('Error connecting wallet:', error);
      // User rejected the connection
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    if (window.solana) {
      try {
        await window.solana.disconnect();
        setWalletAddress(null);
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      }
    }
  }, []);

  const getShortAddress = useCallback((address: string | null) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, []);

  return {
    walletAddress,
    isConnecting,
    isPhantomInstalled,
    connectWallet,
    disconnectWallet,
    getShortAddress,
  };
}

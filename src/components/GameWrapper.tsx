'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePrivy, useLogin, useWallets } from '@privy-io/react-auth';
import dynamic from 'next/dynamic';

const Game = dynamic(() => import('./Game'), { ssr: false });

const BURN_ADDRESS = '0x0000000000000000000000000000000000000000';
const MEGAETH_CHAIN_ID = '0x10e6'; // 4326

export default function GameWrapper() {
  const { ready, authenticated, logout, user } = usePrivy();
  const { login } = useLogin({
    onError: (err) => {
      console.error('Login error:', err);
    },
  });
  const { wallets, ready: walletsReady } = useWallets();
  const [isPending, setIsPending] = useState(false);
  const [txCount, setTxCount] = useState(0);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameReady, setGameReady] = useState(false);
  const txQueue = useRef<Promise<void>>(Promise.resolve());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const providerRef = useRef<any>(null);
  const addressRef = useRef<string | null>(null);

  // Initialize provider and switch chain once wallet is ready
  useEffect(() => {
    if (!authenticated || !walletsReady || wallets.length === 0) {
      setGameReady(false);
      return;
    }

    const init = async () => {
      try {
        const wallet = wallets[0];
        const provider = await wallet.getEthereumProvider();

        // Switch to MegaETH chain
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: MEGAETH_CHAIN_ID }],
          });
        } catch {
          // Chain not added, add it
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: MEGAETH_CHAIN_ID,
              chainName: 'MegaETH',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://mainnet.megaeth.com/rpc'],
              blockExplorerUrls: ['https://megaeth.blockscout.com'],
            }],
          });
        }

        const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
        providerRef.current = provider;
        addressRef.current = accounts[0];
        setGameReady(true);
      } catch (err) {
        console.error('Wallet init error:', err);
        setError('Failed to initialize wallet');
      }
    };

    init();
  }, [authenticated, walletsReady, wallets]);

  const sendShotTx = useCallback(async () => {
    const provider = await providerRef.current;
    const from = addressRef.current;
    if (!provider || !from) return;

    try {
      // Send raw tx via provider - bypasses Privy confirmation UI
      const hash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: BURN_ADDRESS,
          value: '0x0',
          data: '0x',
        }],
      });

      setLastTxHash(hash as string);
      setTxCount((c) => c + 1);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setError(message);
      console.error('Shot TX failed:', err);
    }
  }, []);

  const handleShoot = useCallback(
    (_hit: boolean) => {
      if (!gameReady) return;
      setIsPending(true);
      txQueue.current = txQueue.current
        .then(() => sendShotTx())
        .finally(() => setIsPending(false));
    },
    [gameReady, sendShotTx]
  );

  if (!ready) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="text-green-400 font-mono text-xl animate-pulse">
          LOADING OMEGAIM...
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black gap-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-green-400 font-mono tracking-wider mb-2">
            OMEGAIM
          </h1>
          <p className="text-green-600 font-mono text-sm">
            3D AIM TRAINER ON MEGAETH
          </p>
          <p className="text-gray-500 font-mono text-xs mt-1">
            Every shot is a transaction on-chain
          </p>
        </div>

        <button
          onClick={() => login({ loginMethods: ['twitter'] })}
          className="group relative overflow-hidden rounded border border-green-500 bg-black px-8 py-3 font-mono text-green-400 transition-all hover:bg-green-500 hover:text-black"
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            LOGIN WITH X
          </span>
        </button>

        <div className="flex items-center gap-4 text-gray-600 font-mono text-xs">
          <span>POWERED BY</span>
          <span className="text-green-600">MEGAETH</span>
          <span>+</span>
          <span className="text-purple-500">PRIVY</span>
        </div>
      </div>
    );
  }

  if (!gameReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-green-400 font-mono text-xl animate-pulse mb-4">
            SETTING UP WALLET...
          </div>
          <p className="text-gray-500 font-mono text-xs">
            Creating your embedded wallet on MegaETH
          </p>
        </div>
      </div>
    );
  }

  const twitterHandle = user?.twitter?.username;

  return (
    <div className="relative">
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-black/60 backdrop-blur px-4 py-2 border-b border-green-900/50">
        <div className="flex items-center gap-3">
          <span className="text-green-400 font-mono text-sm font-bold">
            OMEGAIM
          </span>
          {twitterHandle && (
            <span className="text-gray-400 font-mono text-xs">
              @{twitterHandle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-green-400 font-mono text-xs">
            ON-CHAIN SHOTS: {txCount}
          </span>
          <button
            onClick={logout}
            className="rounded border border-red-800 px-3 py-1 font-mono text-xs text-red-400 hover:bg-red-900/30"
          >
            LOGOUT
          </button>
        </div>
      </div>

      {lastTxHash && (
        <div className="fixed bottom-4 left-4 z-40 font-mono text-xs">
          <a
            href={`https://megaeth.blockscout.com/tx/${lastTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-400 underline"
          >
            LAST TX: {lastTxHash.slice(0, 10)}...{lastTxHash.slice(-6)}
          </a>
        </div>
      )}

      {error && (
        <div className="fixed bottom-12 left-4 z-40 rounded bg-red-900/80 px-3 py-1 font-mono text-xs text-red-300 max-w-md truncate">
          {error}
        </div>
      )}

      <Game onShoot={handleShoot} isPending={isPending} />
    </div>
  );
}

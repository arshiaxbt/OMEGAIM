'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePrivy, useLogin, useWallets, useSendTransaction } from '@privy-io/react-auth';
import { createPublicClient, http, formatEther } from 'viem';
import { megaeth } from '@/lib/megaeth';
import dynamic from 'next/dynamic';

const Game = dynamic(() => import('./Game'), { ssr: false });

const BURN_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

const publicClient = createPublicClient({
  chain: megaeth,
  transport: http(),
});

export default function GameWrapper() {
  const { ready, authenticated, logout, user } = usePrivy();
  const { login } = useLogin({
    onError: (err) => {
      console.error('Login error:', err);
    },
  });
  const { wallets, ready: walletsReady } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const [isPending, setIsPending] = useState(false);
  const [txCount, setTxCount] = useState(0);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameReady, setGameReady] = useState(false);
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [needsFunding, setNeedsFunding] = useState(false);
  const txQueue = useRef<Promise<void>>(Promise.resolve());

  // Wait for wallets to be ready, then check balance
  useEffect(() => {
    if (!authenticated || !walletsReady || wallets.length === 0) {
      setGameReady(false);
      return;
    }

    const checkBalance = async () => {
      try {
        const bal = await publicClient.getBalance({
          address: wallets[0].address as `0x${string}`,
        });
        setBalance(bal);
        if (bal === BigInt(0)) {
          setNeedsFunding(true);
        } else {
          setNeedsFunding(false);
        }
        setGameReady(true);
      } catch (err) {
        console.error('Balance check error:', err);
        setGameReady(true);
      }
    };

    checkBalance();
    // Refresh balance every 10 seconds
    const interval = setInterval(checkBalance, 10000);
    return () => clearInterval(interval);
  }, [authenticated, walletsReady, wallets]);

  const sendShotTx = useCallback(async () => {
    const wallet = wallets[0];
    if (!wallet) return;

    // Check balance before sending
    try {
      const bal = await publicClient.getBalance({
        address: wallet.address as `0x${string}`,
      });
      setBalance(bal);

      if (bal === BigInt(0)) {
        setNeedsFunding(true);
        setError('No ETH for gas. Fund your wallet to play.');
        return;
      }
    } catch {
      // If balance check fails, try sending anyway
    }

    try {
      const receipt = await sendTransaction(
        {
          to: BURN_ADDRESS,
          value: 0,
          chainId: 4326,
        },
        {
          address: wallet.address,
          uiOptions: { showWalletUIs: false },
        }
      );

      setLastTxHash(receipt.hash);
      setTxCount((c) => c + 1);
      setError(null);
      setNeedsFunding(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      if (message.toLowerCase().includes('insufficient') || message.toLowerCase().includes('fund')) {
        setNeedsFunding(true);
        setError('Not enough ETH for gas. Fund your wallet.');
      } else {
        setError(message);
      }
      console.error('Shot TX failed:', err);
    }
  }, [wallets, sendTransaction]);

  const handleShoot = useCallback(
    (_hit: boolean) => {
      if (!gameReady || needsFunding) return;
      setIsPending(true);
      txQueue.current = txQueue.current
        .then(() => sendShotTx())
        .finally(() => setIsPending(false));
    },
    [gameReady, needsFunding, sendShotTx]
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
  const walletAddress = wallets[0]?.address;

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
          <span className="text-gray-500 font-mono text-xs">
            {formatEther(balance).slice(0, 8)} ETH
          </span>
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

      {/* Needs funding overlay */}
      {needsFunding && walletAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="max-w-md text-center space-y-4 p-8">
            <div className="text-red-400 font-mono text-xl">NO GAS</div>
            <p className="text-gray-400 font-mono text-sm">
              You need ETH on MegaETH to play. Send ETH to your wallet:
            </p>
            <div className="bg-gray-900 border border-gray-700 rounded p-3 break-all">
              <p className="text-green-400 font-mono text-xs">{walletAddress}</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(walletAddress)}
              className="rounded border border-green-500 px-4 py-2 font-mono text-xs text-green-400 hover:bg-green-500 hover:text-black"
            >
              COPY ADDRESS
            </button>
            <p className="text-gray-600 font-mono text-xs">
              Bridge ETH from Ethereum mainnet to MegaETH via{' '}
              <a
                href="https://megaeth.blockscout.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 underline"
              >
                bridge
              </a>
              {' '}or send from another MegaETH wallet.
            </p>
            <button
              onClick={() => setNeedsFunding(false)}
              className="text-gray-600 font-mono text-xs underline hover:text-gray-400"
            >
              DISMISS & PLAY ANYWAY
            </button>
          </div>
        </div>
      )}

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

      {error && !needsFunding && (
        <div className="fixed bottom-12 left-4 z-40 rounded bg-red-900/80 px-3 py-1 font-mono text-xs text-red-300 max-w-md truncate">
          {error}
        </div>
      )}

      {/* TX Pending */}
      {isPending && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded bg-yellow-900/80 px-3 py-2 font-mono text-xs text-yellow-300">
          <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
          TX PENDING ON MEGAETH...
        </div>
      )}

      <Game onShoot={handleShoot} isPending={isPending} />
    </div>
  );
}

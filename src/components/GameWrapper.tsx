'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePrivy, useLogin, useWallets, useSendTransaction } from '@privy-io/react-auth';
import { createPublicClient, http, formatEther, encodeFunctionData } from 'viem';
import { megaeth } from '@/lib/megaeth';
import { OMEGAAIM_ABI } from '@/lib/contract';
import dynamic from 'next/dynamic';

const Game = dynamic(() => import('./Game'), { ssr: false });

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

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
  const [pendingCount, setPendingCount] = useState(0);
  const [txCount, setTxCount] = useState(0);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameReady, setGameReady] = useState(false);
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [needsFunding, setNeedsFunding] = useState(false);
  const [onChainStats, setOnChainStats] = useState({ totalShots: 0, hits: 0, bestStreak: 0 });

  // Check balance and load on-chain stats
  useEffect(() => {
    if (!authenticated || !walletsReady || wallets.length === 0) {
      setGameReady(false);
      return;
    }

    const addr = wallets[0].address as `0x${string}`;

    const refresh = async () => {
      try {
        const bal = await publicClient.getBalance({ address: addr });
        setBalance(bal);
        setNeedsFunding(bal === BigInt(0));
      } catch (err) {
        console.error('Balance check error:', err);
      }

      // Load on-chain stats
      if (CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
        try {
          const result = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: OMEGAAIM_ABI,
            functionName: 'getPlayerStats',
            args: [addr],
          });
          const [totalShots, hits, bestStreak] = result as [bigint, bigint, bigint, bigint, bigint];
          setOnChainStats({
            totalShots: Number(totalShots),
            hits: Number(hits),
            bestStreak: Number(bestStreak),
          });
        } catch {
          // Contract not deployed yet or read error
        }
      }

      setGameReady(true);
    };

    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [authenticated, walletsReady, wallets]);

  const sendShotTx = useCallback(async (hit: boolean) => {
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
      // Continue anyway
    }

    try {
      const data = encodeFunctionData({
        abi: OMEGAAIM_ABI,
        functionName: 'shoot',
        args: [hit],
      });

      const receipt = await sendTransaction(
        {
          to: CONTRACT_ADDRESS,
          data,
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
    (hit: boolean) => {
      if (!gameReady || needsFunding) return;
      // Fire-and-forget: each shot sends independently
      setPendingCount((c) => c + 1);
      sendShotTx(hit).finally(() => setPendingCount((c) => c - 1));
    },
    [gameReady, needsFunding, sendShotTx]
  );

  if (!ready) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#090b0f]">
        <div className="text-[#3c82ff] font-mono text-xl animate-pulse">
          LOADING OMEGAIM...
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#090b0f] gap-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white font-mono tracking-widest mb-3">
            OMEGAIM
          </h1>
          <p className="text-[#3c82ff] font-mono text-sm tracking-wide">
            AIM TRAINER ON MEGAETH
          </p>
          <p className="text-[#4a5070] font-mono text-xs mt-2">
            Every shot is a transaction on-chain
          </p>
        </div>

        <button
          onClick={() => login({ loginMethods: ['twitter'] })}
          className="group relative overflow-hidden rounded border border-[#3c82ff]/50 bg-transparent px-8 py-3 font-mono text-[#3c82ff] transition-all hover:bg-[#3c82ff] hover:text-[#090b0f] hover:border-[#3c82ff]"
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            LOGIN WITH X
          </span>
        </button>

        <div className="flex items-center gap-4 text-[#3a3e50] font-mono text-xs">
          <span>POWERED BY</span>
          <span className="text-[#3c82ff]">MEGAETH</span>
          <span className="text-[#2a2e40]">|</span>
          <span className="text-[#6a5aaa]">PRIVY</span>
        </div>
      </div>
    );
  }

  if (!gameReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#090b0f]">
        <div className="text-center">
          <div className="text-[#3c82ff] font-mono text-xl animate-pulse mb-4">
            SETTING UP WALLET...
          </div>
          <p className="text-[#4a5070] font-mono text-xs">
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
      {/* Top bar - minimal */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-[#090b0f]/70 backdrop-blur-sm px-4 py-2 border-b border-[#1a1e2a]">
        <div className="flex items-center gap-3">
          <span className="text-white font-mono text-sm font-bold tracking-wider">
            OMEGAIM
          </span>
          {twitterHandle && (
            <span className="text-[#4a5070] font-mono text-xs">
              @{twitterHandle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#3c82ff] font-mono text-xs">
            {formatEther(balance).slice(0, 8)} ETH
          </span>
          {onChainStats.totalShots > 0 && (
            <span className="text-[#6a5aaa] font-mono text-xs">
              {onChainStats.totalShots} / {onChainStats.hits} / {onChainStats.bestStreak}
            </span>
          )}
          <span className="text-[#4a5070] font-mono text-xs">
            TXs: {txCount}
          </span>
          <button
            onClick={logout}
            className="rounded border border-[#2a1a1a] px-3 py-1 font-mono text-xs text-[#aa4444] hover:bg-[#1a0a0a]"
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* Needs funding overlay */}
      {needsFunding && walletAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090b0f]/95">
          <div className="max-w-md text-center space-y-4 p-8 border border-[#1a1e2a] rounded bg-[#0d1017]">
            <div className="text-[#ff6040] font-mono text-xl">NO GAS</div>
            <p className="text-[#6a7090] font-mono text-sm">
              You need ETH on MegaETH to play. Send ETH to your wallet:
            </p>
            <div className="bg-[#090b0f] border border-[#1a1e2a] rounded p-3 break-all">
              <p className="text-[#3c82ff] font-mono text-xs">{walletAddress}</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(walletAddress)}
              className="rounded border border-[#3c82ff]/50 px-4 py-2 font-mono text-xs text-[#3c82ff] hover:bg-[#3c82ff] hover:text-[#090b0f] transition-all"
            >
              COPY ADDRESS
            </button>
            <p className="text-[#3a3e50] font-mono text-xs">
              Bridge ETH from Ethereum mainnet to MegaETH or send from another wallet.
            </p>
            <button
              onClick={() => setNeedsFunding(false)}
              className="text-[#4a5070] font-mono text-xs underline hover:text-[#6a7090]"
            >
              DISMISS & PLAY ANYWAY
            </button>
          </div>
        </div>
      )}

      {/* Contract link */}
      {CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' && (
        <div className="fixed bottom-4 left-4 z-40 font-mono text-xs space-y-1">
          <div>
            <a
              href={`https://megaeth.blockscout.com/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2a3050] hover:text-[#3c82ff] transition-colors"
            >
              {CONTRACT_ADDRESS.slice(0, 8)}...{CONTRACT_ADDRESS.slice(-4)}
            </a>
          </div>
          {lastTxHash && (
            <div>
              <a
                href={`https://megaeth.blockscout.com/tx/${lastTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2a3050] hover:text-[#ff8020] transition-colors"
              >
                tx: {lastTxHash.slice(0, 8)}...{lastTxHash.slice(-4)}
              </a>
            </div>
          )}
        </div>
      )}

      {error && !needsFunding && (
        <div className="fixed bottom-12 left-4 z-40 rounded bg-[#1a0a0a]/80 border border-[#aa4444]/20 px-3 py-1 font-mono text-xs text-[#aa4444] max-w-md truncate">
          {error}
        </div>
      )}

      {pendingCount > 0 && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded bg-[#0d1020]/80 border border-[#ff8020]/20 px-3 py-1.5 font-mono text-xs text-[#ff8020]">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff8020]" />
          {pendingCount} TX{pendingCount > 1 ? 's' : ''}
        </div>
      )}

      <Game onShoot={handleShoot} isPending={pendingCount > 0} />
    </div>
  );
}

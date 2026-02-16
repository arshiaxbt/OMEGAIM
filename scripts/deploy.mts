/**
 * Deploy OmegaAim contract to MegaETH mainnet
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... npx tsx scripts/deploy.ts
 *
 * Requirements:
 *   - npm install tsx (dev dependency)
 *   - The deployer account needs ETH on MegaETH for gas
 */
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { OMEGAAIM_BYTECODE } from '../src/lib/contract';

const MEGAETH_RPC = 'https://mainnet.megaeth.com/rpc';

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error('Set DEPLOYER_PRIVATE_KEY env var');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  console.log(`Deployer: ${account.address}`);

  const publicClient = createPublicClient({
    transport: http(MEGAETH_RPC),
  });

  const walletClient = createWalletClient({
    account,
    transport: http(MEGAETH_RPC),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Balance: ${balance} wei`);

  if (balance === BigInt(0)) {
    console.error('No ETH for gas. Fund the deployer address first.');
    process.exit(1);
  }

  console.log('Deploying OmegaAim...');
  const hash = await walletClient.deployContract({
    abi: [],
    bytecode: OMEGAAIM_BYTECODE as `0x${string}`,
  });

  console.log(`TX hash: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`\nOmegaAim deployed to: ${receipt.contractAddress}`);
  console.log(`\nAdd to .env.local:`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${receipt.contractAddress}`);
}

main();

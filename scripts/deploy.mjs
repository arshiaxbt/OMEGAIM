import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contractFile = readFileSync(resolve(__dirname, '../src/lib/contract.ts'), 'utf8');
const bytecodeMatch = contractFile.match(/OMEGAAIM_BYTECODE = "(0x[a-f0-9]+)"/);
const BYTECODE = bytecodeMatch[1];

const abiMatch = contractFile.match(/OMEGAAIM_ABI = (\[[\s\S]*?\]) as const/);
const ABI = JSON.parse(abiMatch[1]);

const MEGAETH_RPC = 'https://mainnet.megaeth.com/rpc';

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error('Set DEPLOYER_PRIVATE_KEY env var');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  console.log(`Deployer: ${account.address}`);

  const publicClient = createPublicClient({
    transport: http(MEGAETH_RPC),
  });

  const walletClient = createWalletClient({
    account,
    chain: { id: 4326, name: 'MegaETH', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [MEGAETH_RPC] } } },
    transport: http(MEGAETH_RPC),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Balance: ${balance} wei`);

  if (balance === 0n) {
    console.error('No ETH for gas. Fund the deployer address first.');
    process.exit(1);
  }

  console.log('Deploying OmegaAim...');
  const hash = await walletClient.deployContract({
    abi: ABI,
    bytecode: BYTECODE,
  });

  console.log(`TX hash: ${hash}`);
  console.log('Waiting for confirmation...');
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`\nOmegaAim deployed to: ${receipt.contractAddress}`);
  console.log(`\nAdd to .env.local and Vercel env vars:`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${receipt.contractAddress}`);
}

main();

import { defineChain } from 'viem';

export const megaeth = defineChain({
  id: 4326,
  name: 'MegaETH',
  network: 'megaeth',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://mainnet.megaeth.com/rpc'] },
    public: { http: ['https://mainnet.megaeth.com/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://megaeth.blockscout.com' },
  },
});

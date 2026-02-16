'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { megaeth } from '@/lib/megaeth';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId="cmlozllug002k0cky8wxtfmc8"
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#00ff88',
          logo: undefined,
        },
        loginMethods: ['twitter'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: megaeth,
        supportedChains: [megaeth],
      }}
    >
      {children}
    </PrivyProvider>
  );
}

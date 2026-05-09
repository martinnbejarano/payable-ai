import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/components/providers/wallet-provider'
import { QueryProvider } from '@/components/providers/query-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Payable.ai',
  description: 'Autonomous AI agents that discover, evaluate and pay for APIs via Solana micropayments',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <WalletProvider>{children}</WalletProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

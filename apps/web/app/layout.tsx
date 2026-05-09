import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/components/providers/wallet-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { PayableSessionProvider } from '@/components/payable/session'

const geist = Geist({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Payable.ai — Economic infrastructure for autonomous agents',
  description:
    'AI agents discover, evaluate cost vs. value, and pay for APIs in Solana USDC — autonomously, on-chain.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased min-h-screen">
        <QueryProvider>
          <WalletProvider>
            <PayableSessionProvider>{children}</PayableSessionProvider>
          </WalletProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

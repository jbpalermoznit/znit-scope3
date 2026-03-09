import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Image from 'next/image'
import './globals.css'
import { ChatPanel } from '@/components/ChatPanel'
import { Sidebar } from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ZNIT — Carbon Accounting Platform',
  description: 'Plataforma de inventário e gestão de emissões GHG Protocol',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <header className="border-b bg-white sticky top-0 z-10">
          <div className="px-6 h-14 flex items-center gap-3">
            <Image
              src="/logo.avif"
              alt="ZNIT"
              width={80}
              height={28}
              className="object-contain"
              priority
            />
            <span className="text-sm text-muted-foreground">Carbon Accounting Platform</span>
          </div>
        </header>
        <div className="flex h-[calc(100vh-3.5rem)]">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-auto px-6 py-8">
            {children}
          </main>
        </div>
        <ChatPanel />
      </body>
    </html>
  )
}

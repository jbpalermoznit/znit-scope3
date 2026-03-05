import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Image from 'next/image'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ZNIT — Scope 3 Processor',
  description: 'Processamento de notas fiscais para relatório de emissões Scope 3',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <header className="border-b bg-white sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-3">
            <Image
              src="/logo.avif"
              alt="ZNIT"
              width={80}
              height={28}
              className="object-contain"
              priority
            />
            <span className="text-sm text-muted-foreground">Scope 3 · Bens e Serviços Comprados</span>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}

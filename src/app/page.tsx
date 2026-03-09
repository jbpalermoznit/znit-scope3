'use client'

import Link from 'next/link'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Carbon Accounting Platform</h1>
          <p className="text-sm text-muted-foreground">
            Inventário GHG Protocol · Bens e Serviços Comprados
          </p>
        </div>

        <Link href="/escopo3" className="block">
          <Button size="lg" className="gap-3 w-full max-w-xs mx-auto">
            <ShoppingBag className="h-5 w-5" />
            Escopo 3 — Processamento de PDFs
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

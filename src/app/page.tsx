'use client'

import Link from 'next/link'
import { ShoppingBag, Droplets, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const MODULES = [
  {
    href: '/escopo3',
    icon: ShoppingBag,
    title: 'Escopo 3 — Bens e Serviços',
    description: 'Processa notas fiscais de materiais e serviços comprados (concreto, aço, mão de obra, etc.) com extração via IA.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    href: '/agua',
    icon: Droplets,
    title: 'Água — Contas de Água',
    description: 'Processa contas de água e saneamento, extraindo consumo em m³ e custo por unidade automaticamente.',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem-4rem)] px-4">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Carbon Accounting Platform</h1>
          <p className="text-sm text-muted-foreground">Inventário GHG Protocol · Selecione o módulo</p>
        </div>

        <div className="grid gap-3">
          {MODULES.map((mod) => (
            <Link key={mod.href} href={mod.href} className="block group">
              <Card className="border transition-all hover:border-primary/40 hover:shadow-sm cursor-pointer">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`inline-flex items-center justify-center h-9 w-9 rounded-lg ${mod.bg}`}>
                      <mod.icon className={`h-5 w-5 ${mod.color}`} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors mt-2.5" />
                  </div>
                  <CardTitle className="text-sm mt-2">{mod.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <CardDescription className="text-xs leading-relaxed">{mod.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

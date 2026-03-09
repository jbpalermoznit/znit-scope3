'use client'

import Link from 'next/link'
import {
  Factory,
  Zap,
  ShoppingBag,
  TrendingDown,
  Sliders,
  Leaf,
  FileBarChart,
  Lock,
  ChevronRight,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useInvoiceStore } from '@/store/invoiceStore'

interface ModuleCard {
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  status: 'available' | 'locked' | 'inprogress'
  category: string
}

const MODULES: ModuleCard[] = [
  {
    label: 'Escopo 1',
    description: 'Emissões diretas de fontes próprias ou controladas',
    icon: Factory,
    status: 'locked',
    category: 'Inventário GHG',
  },
  {
    label: 'Escopo 2',
    description: 'Emissões indiretas de energia elétrica comprada',
    icon: Zap,
    status: 'locked',
    category: 'Inventário GHG',
  },
  {
    label: 'Escopo 3',
    description: 'Bens e serviços comprados — extração via IA de notas fiscais',
    icon: ShoppingBag,
    href: '/escopo3',
    status: 'available',
    category: 'Inventário GHG',
  },
  {
    label: 'Jornada de Redução',
    description: 'Plano de metas e ações para reduzir emissões ao longo dos anos',
    icon: TrendingDown,
    status: 'locked',
    category: 'Próximos Passos',
  },
  {
    label: 'Simulação de Cenários',
    description: 'Compare estratégias de descarbonização e seus impactos',
    icon: Sliders,
    status: 'locked',
    category: 'Próximos Passos',
  },
  {
    label: 'Compensação de Carbono',
    description: 'Cálculo e gestão de créditos de carbono para neutralização',
    icon: Leaf,
    status: 'locked',
    category: 'Próximos Passos',
  },
]

const JOURNEY = [
  { step: 1, label: 'Inventário de Emissões', sub: 'Escopos 1, 2 e 3', active: true },
  { step: 2, label: 'Diagnóstico e Metas', sub: 'Baseline e alvos de redução', active: false },
  { step: 3, label: 'Jornada de Redução', sub: 'Plano de ação plurianual', active: false },
  { step: 4, label: 'Simulação de Cenários', sub: 'Análise de impacto e custo', active: false },
  { step: 5, label: 'Compensação', sub: 'Neutralização de emissões residuais', active: false },
  { step: 6, label: 'Relatório Final', sub: 'GHG Protocol · CDP · ESG', active: false },
]

export default function DashboardPage() {
  const rows = useInvoiceStore((s) => s.rows)
  const pdfs = useInvoiceStore((s) => s.pdfs)
  const processingStates = useInvoiceStore((s) => s.processingStates)

  const doneCount = Object.values(processingStates).filter((s) => s.status === 'done').length
  const hasScope3Data = rows.length > 0

  const kpis = [
    {
      label: 'PDFs Processados',
      value: doneCount > 0 ? `${doneCount} / ${pdfs.length}` : pdfs.length > 0 ? `0 / ${pdfs.length}` : '—',
      sub: 'Escopo 3 · Bens e Serviços',
      icon: FileText,
      color: 'text-primary',
      bg: 'bg-primary/8',
    },
    {
      label: 'Linhas Extraídas',
      value: rows.length > 0 ? rows.length.toLocaleString('pt-BR') : '—',
      sub: 'Itens de notas fiscais',
      icon: BarChart3,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Módulos Ativos',
      value: '1 / 6',
      sub: 'Escopo 3 disponível',
      icon: CheckCircle2,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Relatórios',
      value: hasScope3Data ? 'Pronto' : 'Aguardando',
      sub: 'Exportação Excel disponível',
      icon: FileBarChart,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plataforma de Carbon Accounting</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Inventário GHG Protocol · Ano de referência 2025 · Bens e Serviços Comprados
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border shadow-none">
            <CardContent className="pt-5 pb-4 px-5">
              <div className={cn('inline-flex items-center justify-center h-8 w-8 rounded-lg mb-3', kpi.bg)}>
                <kpi.icon className={cn('h-4 w-4', kpi.color)} />
              </div>
              <p className="text-2xl font-semibold tracking-tight leading-none mb-1">{kpi.value}</p>
              <p className="text-xs font-medium text-foreground">{kpi.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Módulos da Plataforma
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map((mod) => {
            const isAvailable = mod.status === 'available'
            const inner = (
              <Card
                className={cn(
                  'border transition-all',
                  isAvailable
                    ? 'hover:border-primary/40 hover:shadow-sm cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                )}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={cn(
                        'inline-flex items-center justify-center h-8 w-8 rounded-lg',
                        isAvailable ? 'bg-primary/10' : 'bg-muted'
                      )}
                    >
                      <mod.icon
                        className={cn('h-4 w-4', isAvailable ? 'text-primary' : 'text-muted-foreground')}
                      />
                    </div>
                    {!isAvailable && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        <Lock className="h-2.5 w-2.5" />
                        Em breve
                      </span>
                    )}
                    {isAvailable && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Disponível
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-sm mt-2">{mod.label}</CardTitle>
                  <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                    {mod.category}
                  </p>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <CardDescription className="text-xs leading-relaxed">{mod.description}</CardDescription>
                  {isAvailable && (
                    <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary">
                      Acessar módulo
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )

            return isAvailable && mod.href ? (
              <Link key={mod.label} href={mod.href} className="block">
                {inner}
              </Link>
            ) : (
              <div key={mod.label}>{inner}</div>
            )
          })}
        </div>
      </div>

      {/* Journey timeline */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Jornada de Carbon Accounting
        </h2>
        <div className="relative">
          {/* Line */}
          <div className="absolute left-[15px] top-5 bottom-5 w-px bg-border" />
          <div className="space-y-4">
            {JOURNEY.map((j, i) => (
              <div key={j.step} className="flex items-start gap-4 relative">
                <div
                  className={cn(
                    'h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold z-10',
                    j.active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30 bg-background text-muted-foreground/50'
                  )}
                >
                  {i === 0 && hasScope3Data ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : j.active ? (
                    <Clock className="h-3.5 w-3.5" />
                  ) : (
                    <span>{j.step}</span>
                  )}
                </div>
                <div className="pt-1">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      j.active ? 'text-foreground' : 'text-muted-foreground/60'
                    )}
                  >
                    {j.label}
                  </p>
                  <p className="text-xs text-muted-foreground/50">{j.sub}</p>
                </div>
                {j.active && (
                  <Link href="/escopo3" className="ml-auto pt-1 shrink-0">
                    <Button size="sm" className="h-7 text-xs gap-1">
                      Acessar
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

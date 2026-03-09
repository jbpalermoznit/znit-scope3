'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Factory,
  Zap,
  ShoppingBag,
  TrendingDown,
  Sliders,
  Leaf,
  FileBarChart,
  Lock,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface NavItem {
  label: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  locked?: boolean
  badge?: string
  children?: NavItem[]
}

const NAV: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Inventário GHG',
    icon: FileBarChart,
    children: [
      { label: 'Escopo 1 — Emissões Diretas', icon: Factory, locked: true },
      { label: 'Escopo 2 — Energia Elétrica', icon: Zap, locked: true },
      { label: 'Escopo 3 — Bens e Serviços', href: '/escopo3', icon: ShoppingBag },
    ],
  },
  {
    label: 'Jornada de Redução',
    icon: TrendingDown,
    locked: true,
  },
  {
    label: 'Simulação de Cenários',
    icon: Sliders,
    locked: true,
  },
  {
    label: 'Compensação de Carbono',
    icon: Leaf,
    locked: true,
  },
  {
    label: 'Relatórios',
    icon: FileBarChart,
    locked: true,
  },
]

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(true)

  const isActive = item.href ? pathname === item.href : false
  const hasChildren = item.children && item.children.length > 0

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            depth > 0 && 'pl-7'
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left truncate">{item.label}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform shrink-0', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="mt-0.5 space-y-0.5">
            {item.children!.map((child) => (
              <NavLink key={child.label} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (item.locked || !item.href) {
    return (
      <div
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors cursor-not-allowed',
          'text-muted-foreground/50',
          depth > 0 && 'pl-9'
        )}
        title="Em breve"
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        <Lock className="h-3 w-3 shrink-0 opacity-60" />
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        depth > 0 && 'pl-9',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="w-52 shrink-0 border-r bg-background flex flex-col overflow-y-auto">
      <div className="px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 pb-1">
          Plataforma
        </p>
        {NAV.map((item) => (
          <NavLink key={item.label} item={item} />
        ))}
      </div>

      <div className="mt-auto px-4 py-4 border-t">
        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
          Ano de referência: <strong className="text-muted-foreground">2025</strong>
        </p>
        <p className="text-[10px] text-muted-foreground/50 mt-0.5">
          GHG Protocol · Escopo 3
        </p>
      </div>
    </aside>
  )
}

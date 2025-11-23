"use client"

import { FileUp, BarChart3, CheckCircle2, FileText } from "lucide-react"

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
  currentPage: string
  setCurrentPage: (page: string) => void
}

export default function Sidebar({ open, setOpen, currentPage, setCurrentPage }: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "upload", label: "Upload", icon: FileUp },
    { id: "progress", label: "Progress", icon: CheckCircle2 },
    { id: "results", label: "Results", icon: CheckCircle2 },
    { id: "reports", label: "Reports", icon: FileText },
  ]

  return (
    <>
      {/* Sidebar */}
      <div
        className={`${open ? "w-64" : "w-0"} bg-sidebar border-r border-sidebar-border transition-all duration-300 overflow-hidden fixed md:relative h-full z-40`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-primary">Valid8</h1>
            <p className="text-xs text-muted-foreground mt-1">Care Provider Validation</p>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                    currentPage === item.id
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-border/50"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="pt-4 border-t border-sidebar-border">
            <div className="bg-card rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-sidebar-foreground">System Active</span>
              </div>
              <p className="text-xs text-muted-foreground">v1.0.0 Enterprise</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setOpen(false)} />}
    </>
  )
}

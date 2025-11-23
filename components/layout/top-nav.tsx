"use client"

import { Menu, Bell, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TopNavProps {
  pageTitle: string
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export default function TopNav({ pageTitle, sidebarOpen, setSidebarOpen }: TopNavProps) {
  return (
    <div className="h-16 bg-card/50 border-b border-border flex items-center justify-between px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-muted-foreground hover:text-foreground md:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">VALID8 CARE /</p>
          <h2 className="text-lg font-semibold text-foreground">{pageTitle}</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Last sync: Just now</span>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

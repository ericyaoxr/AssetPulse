import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, Package, PlusCircle, TrendingUp, Settings } from "lucide-react"

const tabs = [
  { to: "/", label: "总览", icon: LayoutDashboard },
  { to: "/assets", label: "资产", icon: Package },
  { to: "/assets/new", label: "添加", icon: PlusCircle },
  { to: "/review", label: "复盘", icon: TrendingUp },
  { to: "/settings/account", label: "我的", icon: Settings },
]

export default function MobileNav() {
  const location = useLocation()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-[#0D1B1E]/95 backdrop-blur-sm md:hidden">
      <div className="flex items-center justify-around pb-[env(safe-area-inset-bottom)] pt-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to ||
            (tab.to === "/settings/account" && location.pathname.startsWith("/settings"))
          const Icon = tab.icon
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive ? "text-emerald" : "text-gray-500"
              }`}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

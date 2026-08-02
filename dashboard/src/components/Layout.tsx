import { NavLink, Outlet } from 'react-router-dom'

const navItem =
  'px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-[#0f1115]/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl sm:text-2xl shrink-0">🏎️</span>
            <span className="font-bold text-sm sm:text-lg tracking-tight whitespace-nowrap truncate">
              F1 <span className="text-red-500">Content</span> <span className="hidden sm:inline">Studio</span>
            </span>
          </div>
          <nav className="flex items-center gap-1 shrink-0">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${navItem} ${isActive ? 'bg-red-600 text-white' : 'text-neutral-300 hover:bg-white/5'}`
              }
            >
              Idee Post
            </NavLink>
            <NavLink
              to="/races"
              className={({ isActive }) =>
                `${navItem} ${isActive ? 'bg-red-600 text-white' : 'text-neutral-300 hover:bg-white/5'}`
              }
            >
              Gare
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-neutral-500 py-6">
        Dati F1 sincronizzati automaticamente via n8n · Powered by Supabase
      </footer>
    </div>
  )
}

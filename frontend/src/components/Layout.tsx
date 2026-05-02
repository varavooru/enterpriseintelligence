import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, MessageSquare, Database, GitBranch,
  FileText, Zap, LogOut, Menu, X, ChevronDown,
} from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Intelligence Q&A', href: '/qa', icon: MessageSquare },
  { name: 'Data sources', href: '/data-sources', icon: Database },
  { name: 'Knowledge graph', href: '/knowledge-graph', icon: GitBranch },
  { name: 'Impact analysis', href: '/impact-analysis', icon: Zap },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, tenant, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-stripe-slate-100">
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-stripe-slate-200 flex flex-col">
            <Sidebar location={location} user={user} tenant={tenant} logout={logout} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:border-r lg:border-stripe-slate-200 lg:bg-white lg:flex lg:flex-col">
        <Sidebar location={location} user={user} tenant={tenant} logout={logout} />
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center h-14 bg-white border-b border-stripe-slate-200 px-6 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 -ml-1.5 text-stripe-slate-600 hover:text-stripe-slate-900">
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 text-sm font-semibold text-stripe-slate-900">Prime EI</span>
        </header>
        <main className="p-6 lg:p-8 max-w-[1200px]">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ location, user, tenant, logout, onClose }: any) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <div className="flex items-center h-14 px-5 border-b border-stripe-slate-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-stripe-purple flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <div className="leading-none">
            <p className="text-sm font-semibold text-stripe-slate-900">Prime EI</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1 text-stripe-slate-400 hover:text-stripe-slate-600 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {tenant && (
        <div className="px-4 py-3 border-b border-stripe-slate-200">
          <p className="text-xs font-medium text-stripe-slate-500 uppercase tracking-wider">Workspace</p>
          <p className="text-sm font-medium text-stripe-slate-900 mt-0.5 truncate">{tenant.name}</p>
        </div>
      )}

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-stripe-slate-100 text-stripe-purple'
                  : 'text-stripe-slate-600 hover:text-stripe-slate-900 hover:bg-stripe-slate-50'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-stripe-slate-200">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md hover:bg-stripe-slate-50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-stripe-purple/10 flex items-center justify-center text-stripe-purple text-xs font-semibold">
            {user?.full_name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[13px] font-medium text-stripe-slate-900 truncate">{user?.full_name}</p>
            <p className="text-[11px] text-stripe-slate-500 truncate">{user?.email}</p>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-stripe-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
        </button>
        {profileOpen && (
          <div className="mt-1 ml-1 space-y-0.5">
            <div className="px-2.5 py-1.5">
              <span className="badge bg-stripe-purple/10 text-stripe-purple capitalize">{user?.role}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-[13px] text-stripe-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  LayoutTemplate,
  LogOut,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/staff', label: 'Staff', icon: Users },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/cv', label: 'CV Generator', icon: FileText },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
];

export function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar:collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [confirmLogout, setConfirmLogout] = useState(false);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('sidebar:collapsed', String(collapsed));
    } catch {
      // localStorage is disabled
    }
  }, [collapsed]);

  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, []);

  const handleLogout = async () => {
    if (confirmLogout) {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      await logout();
      navigate('/login');
    } else {
      setConfirmLogout(true);
      logoutTimerRef.current = setTimeout(() => {
        setConfirmLogout(false);
      }, 3000);
    }
  };

  return (
    <aside
      className={cn(
        'min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200 ease-in-out select-none',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo / Header */}
      {!collapsed ? (
        <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <BriefcaseBusiness className="w-4 h-4 text-accent-foreground" />
            </div>
            <div className="animate-fade-in">
              <p className="text-sm font-bold text-sidebar-foreground leading-none">GISCON</p>
              <p className="text-xs text-sidebar-muted leading-none mt-0.5">CV Generator</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/10 select-none cursor-pointer rounded-md"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="h-16 flex items-center justify-center border-b border-sidebar-border w-full">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/10 select-none cursor-pointer rounded-md"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Nav */}
      <nav aria-label="Sidebar Navigation" className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 outline-none',
                'focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-foreground hover:bg-white/10',
                collapsed && 'justify-center px-0 w-10 h-10 mx-auto',
              )
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="animate-fade-in">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2 mb-1',
            collapsed && 'justify-center px-0',
          )}
        >
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.email}</p>
              <p className="text-xs text-sidebar-muted capitalize">{user?.role}</p>
            </div>
          )}
        </div>
        <Button
          id="sign-out-button"
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-start text-sidebar-muted transition-colors duration-150',
            confirmLogout
              ? 'text-destructive bg-destructive/10 hover:bg-destructive/20 hover:text-destructive font-semibold'
              : 'hover:text-sidebar-foreground hover:bg-white/10',
            collapsed && 'justify-center px-0',
          )}
          onClick={handleLogout}
          title={confirmLogout ? 'Click again to confirm sign out' : 'Sign out'}
        >
          {confirmLogout ? (
            <LogOut className="w-4 h-4 shrink-0 text-destructive animate-pulse" />
          ) : (
            <LogOut className="w-4 h-4 shrink-0" />
          )}
          {!collapsed && (
            <span className="ml-2 truncate animate-fade-in font-medium">
              {confirmLogout ? 'Confirm sign out?' : 'Sign out'}
            </span>
          )}
        </Button>
      </div>
    </aside>
  );
}

import { useEffect, useState } from 'react';
import { Flame, Heart, LogOut, User, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/use-auth';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/discover', label: 'Discover', icon: Flame },
  { to: '/requests', label: 'Requests', icon: Heart },
  { to: '/matches', label: 'Matches', icon: Users },
  { to: '/profile', label: 'Profile', icon: User },
];

const DEFAULT_AVATAR_URL =
  'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&w=300&q=80';

export function AppShell() {
  const { user, logout } = useAuth();
  const [headerAvatarSrc, setHeaderAvatarSrc] = useState(DEFAULT_AVATAR_URL);

  useEffect(() => {
    setHeaderAvatarSrc(user?.photoUrl || DEFAULT_AVATAR_URL);
  }, [user?.photoUrl]);

  const initials =
    `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen app-bg">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/50 bg-white/80 px-4 py-3 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-gradient-to-r from-rose-500 to-orange-400 p-2 text-white">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">Dev Tinder</p>
              <p className="text-xs text-slate-500">
                Swipe devs, build together
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={headerAvatarSrc}
                alt={user?.firstName}
                onError={() => setHeaderAvatarSrc(DEFAULT_AVATAR_URL)}
              />
              <AvatarFallback>{initials || 'DT'}</AvatarFallback>
            </Avatar>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        <nav className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/50 bg-white/70 p-2 shadow sm:grid-cols-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition',
                  isActive &&
                    'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-md'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

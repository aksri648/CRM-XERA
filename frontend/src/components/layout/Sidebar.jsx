import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/react';

import { LayoutDashboard, Sparkles, Lightbulb, Bot, Users, FolderKanban, Megaphone, BarChart3, Activity, Cog } from 'lucide-react';
import api from '../../lib/api';

const navGroups = [
  {
    label: 'MAIN',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'AI Campaign Studio', icon: Sparkles, path: '/ai-studio', badge: 'New', badgeTeal: true },
      { label: 'Opportunities', icon: Lightbulb, path: '/opportunities', badgeKey: 'opportunities' },
      { label: 'Agent Proposals', icon: Bot, path: '/proposals', badgeKey: 'proposals' },
    ],
  },
  {
    label: 'AUDIENCE',
    items: [
      { label: 'Customers', icon: Users, path: '/customers' },
      { label: 'Segments', icon: FolderKanban, path: '/segments' },
    ],
  },
  {
    label: 'ENGAGE',
    items: [
      { label: 'Campaigns', icon: Megaphone, path: '/campaigns' },
    ],
  },
  {
    label: 'ANALYZE',
    items: [
      { label: 'Analytics', icon: BarChart3, path: '/analytics' },
      { label: 'Pipeline Monitor', icon: Activity, path: '/pipeline' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { label: 'AI Command Centre', icon: Bot, path: '#', isCommandCentre: true },
      { label: 'Settings', icon: Cog, path: '/settings' },
    ],
  },
];

export default function Sidebar({ onOpenCommandCentre }) {
  const { user } = useUser();
  const [badges, setBadges] = useState({ opportunities: 0, proposals: 0 });

  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Account';

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [oppRes, propRes] = await Promise.all([
          api.get('/api/opportunities/count'),
          api.get('/api/proposals/count'),
        ]);
        setBadges({ opportunities: oppRes.data.count, proposals: propRes.data.count });
      } catch (e) {}
    };
    fetchBadges();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchBadges();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#0f1923] z-40 flex flex-col">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded bg-[#0fd4b4] flex items-center justify-center">
          <span className="text-white font-bold text-sm">X</span>
        </div>
        <span className="text-white font-bold text-lg">Xeno AI</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-5 text-[10px] uppercase tracking-widest text-slate-500 mb-2">{group.label}</p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const badgeCount = item.badgeKey ? badges[item.badgeKey] : null;

              if (item.isCommandCentre) {
                return (
                  <button
                    key={item.label}
                    onClick={onOpenCommandCentre}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-slate-300 hover:bg-white/5 transition-colors text-sm"
                  >
                    <Icon size={18} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="animate-pulse">●</span> Live
                    </span>
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-[#1a2d3d] text-white border-l-2 border-[#0fd4b4]'
                        : 'text-slate-300 hover:bg-white/5'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-[#0fd4b4] text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">{item.badge}</span>
                  )}
                  {badgeCount > 0 && (
                    <span className="bg-slate-600 text-slate-200 text-xs px-2 py-0.5 rounded-full">{badgeCount}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4 flex items-center gap-3">
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-300 break-all leading-snug">{displayName}</p>
        </div>
      </div>
    </aside>
  );
}

'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { id: 'profile', label: 'Profile', path: '/profile' },
    { id: 'menu', label: 'Menu', path: '/' },
    { id: 'saved', label: 'Saved', path: '/saved' },
  ];

  const getActiveTab = () => {
    if (pathname === '/profile') return 'profile';
    if (pathname === '/saved') return 'saved';
    return 'menu';
  };

  const activeTab = getActiveTab();

  return (
    <nav className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="relative flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-2.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] backdrop-blur-2xl border border-white/50">
        {/* Glass effect overlay - subtle gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/60 via-white/40 to-white/60 pointer-events-none" />
        
        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-[1px] rounded-full bg-gradient-to-b from-transparent via-white/20 to-transparent pointer-events-none" />
        
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.path)}
              className={`relative rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 ease-out ${
                isActive
                  ? 'text-[#6366f1]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {isActive && (
                <>
                  {/* Circular frame background with glass effect */}
                  <div className="absolute inset-0 rounded-full bg-white/95 shadow-[0_2px_8px_rgba(99,102,241,0.15)] border border-[#6366f1]/10 animate-fade-in" />
                  {/* Inner highlight for glass effect */}
                  <div className="absolute inset-[1px] rounded-full bg-gradient-to-b from-white via-white/90 to-white/80" />
                  {/* Subtle outer glow */}
                  <div className="absolute -inset-0.5 rounded-full bg-[#6366f1]/5 blur-sm" />
                </>
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}


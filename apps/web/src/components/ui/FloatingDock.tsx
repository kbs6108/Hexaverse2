import { useState, useEffect } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2, HelpCircle, Search, Globe } from 'lucide-react';
import { LogoMark } from '@/app/Shell';
import { useAuth, roleAtLeast } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Kbd } from '@/components/Kbd';
import { useUI } from '@/lib/store';
import { SearchBox } from '@/features/map/SearchBox';
import { CinematicLetterbox, useCinematicTransition } from './CinematicLetterbox';

export interface NavItem {
  id: string;
  label: string;
  to: string;
  match?: (pathname: string) => boolean;
}

export interface FloatingDockProps {
  onOpenAccount?: () => void;
  className?: string;
}

export function FloatingDock({ onOpenAccount, className }: FloatingDockProps = {}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, role } = useAuth();
  const { t, locale, languages } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { phase, trigger: triggerCinematic } = useCinematicTransition();

  // Navigation items restored to original user app routes & names (with multi-language support)
  const navItems: NavItem[] = [
    { id: 'home', label: t('nav.home'), to: '/', match: (p) => p === '/' },
    { id: 'map', label: t('nav.map'), to: '/map', match: (p) => p.startsWith('/map') },
    { id: 'citizen', label: t('nav.citizen'), to: '/citizen', match: (p) => p.startsWith('/citizen') },
  ];

  if (roleAtLeast(role, 'officer')) {
    navItems.push({ id: 'officer', label: t('nav.officer'), to: '/officer', match: (p) => p.startsWith('/officer') });
  }
  if (roleAtLeast(role, 'admin')) {
    navItems.push({ id: 'admin', label: t('nav.admin'), to: '/admin', match: (p) => p.startsWith('/admin') });
  }

  // Global keyboard shortcut to open search (/ or Cmd+K)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if ((e.key === '/' && !isInput) || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const handleFS = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFS);
    return () => document.removeEventListener('fullscreenchange', handleFS);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        triggerCinematic();
      }).catch((err) => console.warn('Fullscreen failed:', err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch((err) => console.warn(err));
      }
    }
  };

  // Determine active item
  const currentActiveId =
    navItems.find((item) => (item.match ? item.match(pathname) : pathname === item.to))?.id ??
    (pathname.startsWith('/map') ? 'map' : pathname.startsWith('/citizen') ? 'citizen' : pathname.startsWith('/officer') ? 'officer' : pathname.startsWith('/admin') ? 'admin' : 'home');

  const userDisplayName = user?.name ?? 'Guest Citizen';
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'GC';

  return (
    <>
      {/* 15vh Cinematic Retraction Wipe Letterboxes */}
      <CinematicLetterbox phase={phase} />

      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed top-4 left-4 right-4 z-50 mx-auto max-w-5xl grid grid-cols-[1fr_auto_1fr] items-center px-5 py-2 rounded-full bg-panel/90 backdrop-blur-2xl border border-line shadow-elevated text-ink',
          className,
        )}
      >
        {/* Left Branding */}
        <div className="relative z-10 flex items-center gap-2.5 justify-start min-w-0">
          <Link
            to="/"
            search={() => ({})}
            onClick={() => useUI.getState().select(null)}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity select-none shrink-0"
            aria-label="Land Stack home"
          >
            <LogoMark size={24} />
            <span className="font-display text-sm font-bold tracking-tight text-ink">
              Land Stack
            </span>
          </Link>
        </div>

        {/* Dynamic Dead-Center Navigation Dock with 3-Tier Volumetric Limelight Spotlight */}
        <div className="flex items-center justify-center">
          <nav
            aria-label="Main navigation"
            className="flex items-center gap-1 py-1 z-20 pointer-events-auto"
          >
            {navItems.map((item) => {
              const isActive = currentActiveId === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.to as any}
                  onClick={item.to === '/' ? () => useUI.getState().select(null) : undefined}
                  className={cn(
                    'relative z-20 px-3.5 py-1.5 text-xs font-bold select-none transition-colors duration-200 outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-md',
                    isActive ? 'text-ink' : 'text-ink-3 hover:text-ink',
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-streetlight"
                      className="absolute inset-0 pointer-events-none -my-2"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    >
                      {/* 1. Top Lamp Fixture: Sharp Glowing Edge */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-[3px] bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)] rounded-full z-20" />

                      {/* 2. Spreading Streetlight Light Cone (Trapezoidal clip-path polygon) */}
                      <div
                        className="absolute inset-0 z-10"
                        style={{
                          background:
                            'radial-gradient(ellipse 90% 100% at 50% 0%, rgba(245,158,11,0.35) 0%, rgba(15,118,110,0.18) 60%, transparent 100%)',
                          clipPath: 'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)',
                        }}
                      />

                      {/* 3. Soft Bottom Floor & Text Glow */}
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-amber-500/35 to-transparent blur-[2px] z-10" />
                    </motion.div>
                  )}
                  <span className="relative z-30">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Controls */}
        <div className="relative z-10 flex items-center gap-2 justify-end shrink-0">
          {/* Search Popdown Toggle Button with Kbd shortcut */}
          <button
            type="button"
            onClick={() => setIsSearchOpen((v) => !v)}
            title={isSearchOpen ? 'Close search (Esc)' : 'Search parcels (/ or ⌘K)'}
            aria-label={isSearchOpen ? 'Close search' : 'Search parcels'}
            className={cn(
              'flex items-center gap-1.5 h-7 px-2.5 rounded-full transition-all cursor-pointer select-none text-xs font-semibold',
              isSearchOpen
                ? 'bg-primary text-white border border-primary shadow-xs'
                : 'bg-ground-2 hover:bg-ground-3 text-ink border border-line',
            )}
          >
            <Search size={12} className={isSearchOpen ? 'text-white' : 'text-primary'} />
            <span className={cn('hidden md:inline text-[11px]', isSearchOpen ? 'text-white' : 'text-ink-2')}>Search</span>
            <Kbd className="hidden md:inline-flex text-[8.5px] px-1 py-0 leading-none">⌘K</Kbd>
          </button>

          {/* Guide minimalist text button */}
          <Link
            to="/help"
            className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-ink-3 hover:text-ink hover:bg-ground-2 rounded-full transition-colors cursor-pointer"
            title={t('nav.guide')}
            aria-label={t('nav.guide')}
          >
            <HelpCircle size={13} />
            <span className="hidden xl:inline">{t('nav.guide')}</span>
          </Link>

          {/* Cinematic Fullscreen Toggle with Expand SVG */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? t('nav.exitFullscreen') : t('nav.fullscreen')}
            aria-label={isFullscreen ? t('nav.exitFullscreen') : t('nav.fullscreen')}
            className="flex size-7 items-center justify-center rounded-full bg-ground-2 hover:bg-ground-3 text-ink border border-line transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {/* Profile Pill: Opens Profile & Account menu (where language switching is located) */}
          <button
            type="button"
            onClick={onOpenAccount}
            className="flex items-center gap-2 bg-primary text-white pl-2 pr-2.5 py-1 rounded-full text-xs font-semibold shadow-xs hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={t('nav.account')}
            title={`${t('nav.account')} • ${languages.find((l) => l.code === locale)?.native || 'Language'}`}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
              {userInitials}
            </span>
            <span className="hidden sm:inline font-semibold text-white tracking-tight truncate max-w-[80px] lg:max-w-[120px]">
              {userDisplayName}
            </span>
            <span className="flex items-center gap-1 text-[10.5px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white border border-white/25">
              <Globe size={10} className="text-amber-300" />
              <span className="text-white">{languages.find((l) => l.code === locale)?.short || 'EN'}</span>
            </span>
          </button>
        </div>

        {/* Pop-down Search Box smoothly attached beneath the Header Dock */}
        <SearchBox isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </motion.header>
    </>
  );
}

export default FloatingDock;

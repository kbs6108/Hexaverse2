import { useState, useEffect } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2, HelpCircle, Search } from 'lucide-react';
import { LogoMark } from '@/app/Shell';
import { useAuth, roleAtLeast } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
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
  const { t, locale, setLocale, languages } = useTranslation();
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

      <header
        className={cn(
          'fixed top-4 left-4 right-4 z-50 mx-auto max-w-5xl flex items-center justify-between px-5 py-2 rounded-full bg-[#F4F1E7]/85 backdrop-blur-2xl border border-[#D5D2C7] shadow-[0_8px_32px_rgba(24,35,31,0.08)] text-[#18231F]',
          className,
        )}
      >
        {/* Left Branding */}
        <div className="relative z-10 flex items-center gap-2.5 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity select-none"
            aria-label="Land Stack home"
          >
            <LogoMark size={24} />
            <span className="font-display text-sm font-bold tracking-tight text-[#18231F]">
              Land Stack
            </span>
          </Link>
        </div>

        {/* Dynamic Dead-Center Navigation Dock with 3-Tier Volumetric Limelight Spotlight */}
        <nav
          aria-label="Main navigation"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 py-1 z-20 pointer-events-auto"
        >
          {navItems.map((item) => {
            const isActive = currentActiveId === item.id;
            return (
              <Link
                key={item.id}
                to={item.to as any}
                className={cn(
                  'relative z-20 px-3.5 py-1.5 text-xs font-bold select-none transition-colors duration-200 outline-none focus-visible:ring-1 focus-visible:ring-[#176B52] rounded-md',
                  isActive ? 'text-[#18231F]' : 'text-[#6F7768] hover:text-[#18231F]',
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-streetlight"
                    className="absolute inset-0 pointer-events-none -my-2"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  >
                    {/* 1. Top Lamp Fixture: Sharp Glowing Edge */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-[3px] bg-[#B38A4C] shadow-[0_0_12px_#B38A4C] rounded-full z-20" />

                    {/* 2. Spreading Streetlight Light Cone (Trapezoidal clip-path polygon) */}
                    <div
                      className="absolute inset-0 z-10"
                      style={{
                        background:
                          'radial-gradient(ellipse 90% 100% at 50% 0%, rgba(179,138,76,0.42) 0%, rgba(23,107,82,0.18) 60%, transparent 100%)',
                        clipPath: 'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)',
                      }}
                    />

                    {/* 3. Soft Bottom Floor & Text Glow */}
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-[#B38A4C]/35 to-transparent blur-[2px] z-10" />
                  </motion.div>
                )}
                <span className="relative z-30">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="relative z-10 flex items-center gap-2 shrink-0 ml-auto">
          {/* Language Switcher 1-Click Pill (EN | తె | हि) */}
          <div
            role="radiogroup"
            aria-label="Language selector"
            className="flex items-center rounded-full bg-[#E9E5D8]/70 border border-[#D5D2C7] p-0.5 shadow-2xs"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                role="radio"
                aria-checked={locale === lang.code}
                onClick={() => setLocale(lang.code)}
                title={`Switch language to ${lang.native} (${lang.label})`}
                aria-label={lang.label}
                className={cn(
                  'px-2 py-0.5 text-[10.5px] font-bold rounded-full transition-all cursor-pointer select-none',
                  locale === lang.code
                    ? 'bg-[#23483A] text-[#F4F1E7] shadow-xs'
                    : 'text-[#6F7768] hover:text-[#18231F]',
                )}
              >
                {lang.short}
              </button>
            ))}
          </div>

          {/* Search Popdown Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen((v) => !v)}
            title={isSearchOpen ? 'Close search (Esc)' : 'Search parcels (/ or ⌘K)'}
            aria-label={isSearchOpen ? 'Close search' : 'Search parcels'}
            className={cn(
              'flex size-7 items-center justify-center rounded-full transition-all cursor-pointer select-none',
              isSearchOpen
                ? 'bg-[#23483A] text-[#F4F1E7] border border-[#23483A] shadow-xs'
                : 'bg-[#E9E5D8]/70 hover:bg-[#E1E6DE] text-[#18231F] border border-[#D5D2C7]',
            )}
          >
            <Search size={13} />
          </button>

          {/* Guide minimalist text button */}
          <Link
            to="/help"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#6F7768] hover:text-[#18231F] hover:bg-[#E9E5D8]/70 rounded-full transition-colors cursor-pointer"
            title={t('nav.guide')}
          >
            <HelpCircle size={13} />
            <span>{t('nav.guide')}</span>
          </Link>

          {/* Cinematic Fullscreen Toggle with Expand SVG */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? t('nav.exitFullscreen') : t('nav.fullscreen')}
            aria-label={isFullscreen ? t('nav.exitFullscreen') : t('nav.fullscreen')}
            className="flex size-7 items-center justify-center rounded-full bg-[#E9E5D8]/70 hover:bg-[#E1E6DE] text-[#18231F] border border-[#D5D2C7] transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {/* Profile Pill: High-contrast Forest Green (#23483A) with slight vertical lift on hover */}
          <button
            type="button"
            onClick={onOpenAccount}
            className="flex items-center gap-2 bg-[#23483A] text-[#F4F1E7] pl-2 pr-3 py-1 rounded-full text-xs font-semibold shadow-xs hover:bg-[#23483A]/90 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176B52]"
            aria-label={t('nav.account')}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-[#176B52] text-[10px] font-bold text-[#F4F1E7]">
              {userInitials}
            </span>
            <span className="hidden sm:inline font-medium tracking-tight truncate max-w-[120px]">
              {userDisplayName}
            </span>
          </button>
        </div>

        {/* Pop-down Search Box smoothly attached beneath the Header Dock */}
        <SearchBox isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </header>
    </>
  );
}

export default FloatingDock;

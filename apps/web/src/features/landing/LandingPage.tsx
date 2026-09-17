import { useState } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { HeroSection } from './HeroSection';
import { StorySections } from './StorySections';
import { SpatialAuthPanel } from '@/features/auth/SpatialAuthPanel';

/** Cinematic landing (light) with floating spatial authentication layer. */
export function CinematicLanding() {
  const search = useSearch({ from: '/' });
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(search.auth ?? 'signin');

  const isOpen = authOpen || !!search.auth;

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleCloseAuth = () => {
    setAuthOpen(false);
    if (search.auth) {
      void navigate({
        to: '/',
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          auth: undefined,
        }),
        replace: true,
      });
    }
  };

  return (
    <div className="landing-scope min-h-full bg-ground relative">
      <HeroSection onOpenAuth={handleOpenAuth} />
      <StorySections onOpenAuth={handleOpenAuth} />
      <SpatialAuthPanel
        isOpen={isOpen}
        initialMode={authMode}
        next={search.next}
        onClose={handleCloseAuth}
      />
    </div>
  );
}

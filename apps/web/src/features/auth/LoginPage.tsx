import { useNavigate, useSearch } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import { AuthComponent } from '@/components/ui/sign-up';
import { LogoMark } from '@/app/Shell';
import { Maximize2 } from 'lucide-react';
import { triggerCitizenCinematic } from '@/lib/cinematic';

export function LoginPage() {
  const { setDevUser } = useAuth();
  const { next } = useSearch({ from: '/login' });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const completeSignIn = () => {
    // Underneath, use the existing development identity to keep the backend happy
    setDevUser('citizen::Ravi Kumar');
    qc.clear();

    // Navigate to next or platform gateway
    const to = next && next.startsWith('/') ? next : '/citizen';
    navigate({ to });
  };

  const handleFullscreenSignIn = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request failed or was denied:", err);
    }
    triggerCitizenCinematic();
    completeSignIn();
  };

  return (
    <div className="relative w-full min-h-screen">
      <AuthComponent
        brandName="TENREC"
        logo={
          <div className="bg-panel border border-line/40 rounded-lg p-1.5 shadow-sm">
            <LogoMark size={20} />
          </div>
        }
        onSuccess={completeSignIn}
      />

      {/* Optional Fullscreen CTA */}
      <div className="absolute bottom-8 sm:bottom-12 left-0 right-0 flex justify-center z-50 pointer-events-auto px-4">
        <button
          type="button"
          onClick={handleFullscreenSignIn}
          className="py-2.5 px-4 text-xs font-semibold text-[#4B5345] hover:text-[#18231F] bg-[#F4F1E7]/80 backdrop-blur-md border border-[#D5D2C7] rounded-full flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer hover:bg-[#E1E6DE]"
        >
          <Maximize2 className="w-3.5 h-3.5 text-[#176B52]" />
          <span>Continue in fullscreen</span>
        </button>
      </div>
    </div>
  );
}

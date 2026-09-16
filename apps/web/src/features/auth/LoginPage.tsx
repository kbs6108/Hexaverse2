import { useNavigate, useSearch } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import { AuthComponent } from '@/components/ui/sign-up';
import { LogoMark } from '@/app/Shell';
import { Maximize } from 'lucide-react';

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
    // Instantly navigate. The cinematic animation now belongs to the Citizen Workspace.
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
      <div className="absolute bottom-8 sm:bottom-12 left-0 right-0 flex justify-center z-50 pointer-events-auto">
        <button
          onClick={handleFullscreenSignIn}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md border border-white/10 text-white/90 text-[13px] font-medium rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
        >
          <Maximize size={15} className="opacity-80" />
          Continue in fullscreen
        </button>
      </div>
    </div>
  );
}

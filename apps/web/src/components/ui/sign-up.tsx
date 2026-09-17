"use client";

import React from "react";
import { Mail } from "lucide-react";
import { GradientButton } from "@/components/ui/shader-button";

// --- ICONS ---
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-5 h-5"> <g fillRule="evenodd" fill="none"> <g fillRule="nonzero" transform="translate(3, 2)"> <path fill="#4285F4" d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267"></path> <path fill="#34A853" d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L12.3700541,35.3591501 L3.26524241,42.4054492 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667"></path> <path fill="#FBBC05" d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L12.6667095,23.2715173 L3.44779955,16.1120237 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782"></path> <path fill="#EB4335" d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769"></path> </g> </g></svg> );
const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-5 h-5"> <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/> </svg> );

export interface AuthComponentProps {
  onSuccess?: () => void;
  logo?: React.ReactNode; 
  brandName?: string;
}

export const AuthComponent = ({ onSuccess }: AuthComponentProps) => {

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-48px)] w-full flex items-center justify-center bg-transparent p-4 overflow-hidden">
      
      {/* Main Minimalist Card */}
      <div className="relative z-10 w-full max-w-md mx-auto p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/90 shadow-2xl flex flex-col">
        
        {/* Header (Super Minimal) */}
        <div className="text-center mb-8 flex flex-col items-center">
            <h1 className="uppercase font-extrabold text-3xl text-slate-900 tracking-widest">TENREC</h1>
        </div>

        {/* Content */}
        <div className="flex-1 w-full flex flex-col">
            
            {/* Social Buttons */}
            <div className="flex gap-4 w-full mb-6">
                 <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/80 rounded-xl shadow-sm border border-slate-200/80 hover:bg-white transition-colors text-slate-700 font-medium text-sm backdrop-blur-md">
                     <GoogleIcon /> Google
                 </button>
                 <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/80 rounded-xl shadow-sm border border-slate-200/80 hover:bg-white transition-colors text-slate-700 font-medium text-sm backdrop-blur-md">
                     <GitHubIcon /> GitHub
                 </button>
            </div>

            {/* Divider */}
            <div className="flex items-center w-full gap-3 mb-6">
                <hr className="flex-1 border-slate-200" />
                <span className="text-xs font-semibold text-slate-400">OR</span>
                <hr className="flex-1 border-slate-200" />
            </div>

            {/* Email Input & Continue */}
            <form onSubmit={handleContinue} className="w-full space-y-4">
                <div className="relative flex items-center w-full group">
                    <Mail className="absolute left-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                        type="email" 
                        placeholder="Email" 
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/80 border border-slate-200/80 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-900 placeholder:text-slate-400 shadow-sm" 
                    />
                </div>
                <GradientButton 
                    type="submit" 
                    onClick={handleContinue} 
                    className="w-full py-3 text-sm font-bold shadow-md"
                >
                    Continue to Portal
                </GradientButton>
            </form>
        </div>
      </div>
    </div>
  );
};


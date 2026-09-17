import * as React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FolderMetric {
  value: string | number;
  label: string;
}

export interface FolderDocument {
  id: string;
  name: string;
  category?: string;
  docNumber?: string;
  date?: string;
  size?: string;
  verified?: boolean;
  type?: 'pdf' | 'cad' | 'image' | 'data';
}

export interface FolderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  categoryTitle?: string;
  subtitle?: string;
  description?: string;
  count?: React.ReactNode;
  countLabel?: string;
  meta?: string;
  metrics?: FolderMetric[];
  documents?: FolderDocument[];
  icon?: React.ReactNode;
  badge?: string;
  isActive?: boolean;
  defaultExpanded?: boolean;
  onDownloadAll?: () => void;
}

/**
 * FolderCard - Crisp frosted glass folder silhouette with physical tab notch and Earth/Terrain tokens.
 */
export const FolderCard = React.forwardRef<HTMLDivElement, FolderCardProps>(
  function FolderCard(
    {
      title,
      categoryTitle,
      subtitle,
      description,
      count,
      countLabel,
      meta,
      metrics,
      icon,
      badge,
      isActive = false,
      className,
      onClick,
      ...props
    },
    ref,
  ) {
    const finalTitle = title ?? categoryTitle ?? 'Title Deeds';
    const finalSubtitle = subtitle ?? description ?? 'Authoritative Records';

    const primaryMetric = metrics?.[0];
    const secondaryMetric = metrics?.[1];

    let computedCount = count;
    let computedCountLabel = countLabel;
    let computedMeta = meta ?? badge;

    if (!computedCount && primaryMetric) {
      const parts = String(primaryMetric.value).split(' ');
      computedCount = parts[0];
      computedCountLabel = computedCountLabel ?? (parts.slice(1).join(' ') || primaryMetric.label);
    }

    if (!computedMeta && secondaryMetric) {
      computedMeta = String(secondaryMetric.value);
    }

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          'group relative flex flex-col w-full text-left transition-all duration-200 cursor-pointer select-none',
          className
        )}
        {...props}
      >
        {/* Top Folder Notch Tab Silhouette */}
        <div className="flex items-end pl-4 -mb-[1px]">
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-t-xl text-xs font-semibold border-t border-x transition-all duration-200',
              isActive
                ? 'bg-[#F4F1E7]/65 border-[#176B52]/30 text-[#176B52]'
                : 'bg-[#E9E5D8]/40 border-[#176B52]/15 text-[#4B5345] group-hover:bg-[#F4F1E7]/65 group-hover:text-[#18231F]'
            )}
          >
            {icon}
            <span className="text-[11px] font-bold uppercase tracking-wider">{finalTitle}</span>
            {badge && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-[#176B52]/15 text-[#176B52]">
                {badge}
              </span>
            )}
          </div>
          <div className="flex-1 h-[1px] bg-[#176B52]/15" />
        </div>

        {/* Main Card Container */}
        <div
          className={cn(
            'relative flex flex-col justify-between p-5 rounded-2xl rounded-tl-none border backdrop-blur-xl transition-all duration-200',
            isActive
              ? 'ring-2 ring-[#176B52]/40 bg-[#F4F1E7]/65 shadow-[0_12px_40px_rgba(24,35,31,0.08)] border-[#176B52]/30'
              : 'bg-[#F4F1E7]/45 border-[#176B52]/15 shadow-[0_8px_32px_rgba(24,35,31,0.04)] hover:bg-[#F4F1E7]/65 hover:border-[#176B52]/30 hover:shadow-[0_12px_40px_rgba(24,35,31,0.08)]'
          )}
        >
          <div>
            <h3 className="text-[#18231F] font-bold text-base tracking-tight">{finalTitle}</h3>
            {finalSubtitle && (
              <p className="text-[#4B5345] text-xs font-normal mt-0.5 leading-relaxed">
                {finalSubtitle}
              </p>
            )}
          </div>

          <div className="mt-5 flex items-baseline justify-between border-t border-[#D5D2C7]/60 pt-4">
            <div>
              <span className="text-[#18231F] font-black text-2xl tracking-tight leading-none">
                {computedCount ?? '18'}
              </span>
              {computedCountLabel && (
                <span className="ml-1.5 text-[#6F7768] text-xs font-medium">
                  {computedCountLabel}
                </span>
              )}
            </div>
            {computedMeta && (
              <span className="text-[#6F7768] text-xs font-medium">
                {computedMeta}
              </span>
            )}
          </div>

          <div className="mt-4 pt-2.5 flex items-center justify-between border-t border-[#D5D2C7]/40">
            <span className="text-[#176B52] font-semibold text-xs flex items-center gap-1">
              {isActive ? (
                <>
                  <CheckCircle2 size={13} className="shrink-0" />
                  <span>Active Folder</span>
                </>
              ) : (
                <>
                  <span>Click to view files</span>
                  <ArrowRight size={12} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

export default FolderCard;

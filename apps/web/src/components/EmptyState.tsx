import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, Inbox } from 'lucide-react';
import { ApiError } from '@/lib/api';

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line px-6 py-10 text-center', className)}>
      <div className="text-ink-3 [&>svg]:size-7">{icon ?? <Inbox />}</div>
      <p className="font-medium">{title}</p>
      {body && <p className="max-w-sm text-sm text-ink-3">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Inline error for a failed query — never a whole-page error. */
export function ErrorNote({ error, retry }: { error: unknown; retry?: () => void }) {
  const msg = error instanceof ApiError ? `${error.message} (${error.code})` : error instanceof Error ? error.message : 'Something went wrong';
  const status = error instanceof ApiError ? error.status : undefined;
  return (
    <div role="alert" className="flex items-start gap-2 bg-[#9E2A2B]/10 border border-[#9E2A2B]/25 text-[#721C1D] rounded-xl p-3 text-xs font-semibold backdrop-blur-md">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1">
        <p>{status === 401 || status === 403 ? 'You do not have access to this. ' : ''}{msg}</p>
        {retry && (
          <button type="button" onClick={retry} className="mt-1 text-xs underline underline-offset-2">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

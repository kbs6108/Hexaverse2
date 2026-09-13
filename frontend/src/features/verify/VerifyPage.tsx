import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { api, qk } from '@/lib/api';
import { Card, CardBody } from '@/components/Card';
import { Loading } from '@/components/Spinner';
import { ErrorNote } from '@/components/EmptyState';
import { KV } from '@/components/Section';
import { fmtDate } from '@/lib/format';

/** Public: QR code on a Land Information Report resolves here. No auth. */
export function VerifyPage() {
  const { id } = useParams({ from: '/verify/$id' });
  const q = useQuery({ queryKey: qk.verifyReport(id), queryFn: () => api.verifyReport(id), retry: false });
  const r = q.data;
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <p className="mb-2 text-center text-[11px] uppercase tracking-wide text-ink-3">Land Information Report · verification</p>
      {q.isLoading && <Loading label="Checking signature…" />}
      {q.isError && <ErrorNote error={q.error} />}
      {r && (
        <Card className={r.valid ? 'border-primary/40' : 'border-brick/40'}>
          <CardBody className="pt-6 text-center">
            {r.valid ? <ShieldCheck size={52} className="mx-auto text-primary" /> : <ShieldX size={52} className="mx-auto text-brick" />}
            <h1 className="mt-3 text-2xl font-semibold">{r.valid ? 'Genuine report' : 'Not a valid report'}</h1>
            <p className="mt-1 font-mono text-sm text-ink-3">{r.id ?? id}</p>
            {!r.valid && r.reason && <p className="mt-2 text-sm text-brick">{r.reason}</p>}
            {r.valid && (
              <KV
                className="mt-6 text-left"
                items={[
                  { k: 'Issued to', v: r.issued_to ?? '—' },
                  { k: 'Issued at', v: fmtDate(r.issued_at, true) },
                  { k: 'Parcel', v: r.parcel?.survey_no ? `Sy. No. ${r.parcel.survey_no}${r.parcel.village ? ` · ${r.parcel.village}` : ''}` : '—' },
                  { k: 'ULPIN', v: r.ulpin ?? '—', mono: true },
                ]}
              />
            )}
            <p className="mt-6 text-xs text-ink-3">The report’s SHA-256 digest is signed by the Land Stack gateway. Names are shown masked. {r.ulpin && <Link to="/" search={{ ulpin: r.ulpin }} className="text-primary underline">View parcel on the map</Link>}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

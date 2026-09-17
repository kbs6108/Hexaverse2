import { useState, type FormEvent } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Field, Input } from '@/components/Field';
import { ParcelPicker } from '@/components/ParcelPicker';
import { Button } from '@/components/Button';
import { ErrorNote } from '@/components/EmptyState';
import { PageTitle } from '@/components/PageTitle';
import { titleCase } from '@/lib/format';

export function VerifyOwnership() {
  const search = useSearch({ from: '/citizen/verify' });
  const [ulpin, setUlpin] = useState(search.ulpin ?? '');
  const [name, setName] = useState('');
  const m = useMutation({ mutationFn: () => api.verifyOwnership(ulpin.trim(), name.trim()) });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    m.mutate();
  };

  return (
    <>
      <PageTitle title="Verify ownership" subtitle="Compares a claimed name with the record of rights and the latest registered deed. The result never reveals the actual owner." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Claim" />
          <CardBody>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <Field label="ULPIN" htmlFor="v-ulpin" hint="Pick a recently opened parcel, or select one on the map to prefill.">
                <ParcelPicker id="v-ulpin" value={ulpin} onChange={setUlpin} />
              </Field>
              <Field label="Claimed owner name" htmlFor="v-name">
                <Input id="v-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="As written on the sale deed" />
              </Field>
              <Button type="submit" variant="primary" loading={m.isPending} className="self-start">Verify</Button>
            </form>
          </CardBody>
        </Card>

        <div>
          {m.isError && <ErrorNote error={m.error} />}
          {m.data && (
            <Card className={m.data.match ? 'border-[#176B52]/40' : 'border-brick/40'}>
              <CardBody className="pt-5">
                <div className="flex items-start gap-3">
                  {m.data.match ? <CheckCircle2 size={36} className="text-[#176B52]" /> : <XCircle size={36} className="text-brick" />}
                  <div>
                    <p className="text-lg font-black text-[#18231F]">{m.data.match ? 'Name matches the record' : 'Name does not match'}</p>
                    <p className="text-sm font-medium text-[#4B5345]">Similarity score {Math.round(m.data.score * 100)}%</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#E9E5D8]" role="meter" aria-valuenow={Math.round(m.data.score * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Similarity">
                    <div className={`h-full ${m.data.match ? 'bg-[#176B52]' : 'bg-brick'}`} style={{ width: `${Math.round(m.data.score * 100)}%` }} />
                  </div>
                </div>
                <p className="mt-4 text-xs font-medium text-[#4B5345]">Compared against: {m.data.compared.map(titleCase).join(', ')}. The registered owner’s name is not disclosed by this service.</p>
                {m.data.match && ulpin && (
                  <div className="mt-5 border-t border-[#D5D2C7] pt-4">
                    <Link to="/citizen/request" search={{ ulpin: ulpin.trim() }}>
                      <Button variant="primary" icon={<ArrowRight size={15} />}>
                        Request service for this parcel
                      </Button>
                    </Link>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
          {!m.data && !m.isError && (
            <div className="rounded-2xl border border-dashed border-[#176B52]/20 bg-[#F4F1E7]/45 backdrop-blur-xl p-6 text-sm font-medium text-[#4B5345]">
              Result appears here. A match does not by itself prove title; use it together with the Land Information Report.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

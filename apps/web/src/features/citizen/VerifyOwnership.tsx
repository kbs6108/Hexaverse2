import { useState, type FormEvent } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, MapPin, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Field, Input } from '@/components/Field';
import { ParcelPicker } from '@/components/ParcelPicker';
import { Button } from '@/components/Button';
import { ErrorNote } from '@/components/EmptyState';
import { PageTitle } from './CitizenHome';
import { useTranslation } from '@/lib/i18n';

export function VerifyOwnership() {
  const search = useSearch({ from: '/citizen/verify' });
  const { user } = useAuth();
  const { t } = useTranslation();
  const [ulpin, setUlpin] = useState(search.ulpin ?? '');
  const [name, setName] = useState(user?.name ?? '');
  const m = useMutation({ mutationFn: () => api.verifyOwnership(ulpin.trim(), name.trim()) });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    m.mutate();
  };

  return (
    <>
      <PageTitle
        title={t('verify.title')}
        subtitle={t('verify.subtitle')}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title={t('verify.claimTitle')} />
          <CardBody>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <Field label={t('common.ulpin')} htmlFor="v-ulpin" hint={t('service.pickParcelHint')}>
                <ParcelPicker id="v-ulpin" value={ulpin} onChange={setUlpin} />
              </Field>
              <Field label={t('verify.claimedOwnerName')} htmlFor="v-name">
                <Input
                  id="v-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('verify.claimedOwnerPlaceholder')}
                />
              </Field>
              <Button type="submit" variant="primary" loading={m.isPending} className="self-start">
                {t('verify.btnVerify')}
              </Button>
            </form>
          </CardBody>
        </Card>

        <div>
          {m.isError && <ErrorNote error={m.error} />}
          {m.data && (
            <Card className={m.data.match ? 'border-primary/40' : 'border-brick/40'}>
              <CardBody className="pt-5">
                <div className="flex items-start gap-3">
                  {m.data.match ? <CheckCircle2 size={36} className="text-primary shrink-0" /> : <XCircle size={36} className="text-brick shrink-0" />}
                  <div>
                    <p className="text-lg font-semibold">
                      {m.data.match ? t('verify.nameMatches') : t('verify.nameDoesNotMatch')}
                    </p>
                    <p className="text-sm text-ink-2">
                      {t('verify.similarityScore')} {Math.round(m.data.score * 100)}%
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-ground-2"
                    role="meter"
                    aria-valuenow={Math.round(m.data.score * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Similarity"
                  >
                    <div
                      className={`h-full ${m.data.match ? 'bg-primary' : 'bg-brick'}`}
                      style={{ width: `${Math.round(m.data.score * 100)}%` }}
                    />
                  </div>
                </div>
                <p className="mt-4 text-xs text-ink-3">
                  {t('verify.comparedAgainst')}
                </p>

                {m.data.match && (
                  <div className="mt-4 pt-3 border-t border-line/60 flex flex-wrap gap-2">
                    <Link to="/map" search={{ ulpin }}>
                      <Button size="sm" variant="primary" icon={<MapPin size={13} />}>
                        Open Land Profile on Map
                      </Button>
                    </Link>
                    <Link to="/citizen/request" search={{ ulpin }}>
                      <Button size="sm" variant="secondary" icon={<ArrowRight size={13} />}>
                        Apply for Services
                      </Button>
                    </Link>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
          {!m.data && !m.isError && (
            <div className="rounded-lg border border-dashed border-line p-6 text-sm text-ink-3">
              {t('verify.emptyResult')}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

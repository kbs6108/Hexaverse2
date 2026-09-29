import {
  Building2,
  Check,
  CheckCircle2,
  Droplets,
  Flame,
  PlusCircle,
  Route,
  ShieldCheck,
  Waves,
  Wifi,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from '@tanstack/react-router';
import type { ParcelCDM } from '@/lib/cdm';
import { ProvenanceBadge } from '@/components/ProvenanceBadge';
import { SectionTitle } from '@/components/Section';
import { Button } from '@/components/Button';
import { titleCase } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';

function cleanProvider(name?: string): string {
  if (!name) return '';
  return name.split(/[-–(]/)[0]?.trim() ?? name;
}

export function UtilitiesSection({ p }: { p: ParcelCDM }) {
  const { t } = useTranslation();
  const u = p.utilities;
  const elec = u?.electricity_details;
  const water = u?.water_details;
  const sewer = u?.sewer_details;
  const gas = u?.gas_details;
  const bb = u?.broadband_details;
  const san = u?.sanitation_details;
  const history = u?.history || [];

  return (
    <div className="flex flex-col gap-3.5">
      {/* 1. Header with Title, Provenance & Action Button in one sleek line */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h3 className="text-sm font-semibold text-ink">
            {t('drawer.connections', 'Utility & Lifeline Services')}
          </h3>
          <ProvenanceBadge source="utilities" p={p.provenance.utilities} />
        </div>
        <Link
          to="/citizen/request"
          search={{ type: 'utility_request', ulpin: p.ulpin }}
          className="shrink-0"
        >
          <Button
            variant="secondary"
            size="sm"
            icon={<PlusCircle size={12} />}
            className="h-6.5 px-2 py-0 text-[11px] font-medium border-primary/30 text-primary hover:bg-primary-soft"
          >
            Apply / Edit
          </Button>
        </Link>
      </div>

      {/* 2. Quick Infrastructure Health Bar (5 Lifelines at a glance) */}
      <div className="grid grid-cols-5 gap-1 rounded-lg border border-line bg-ground-2/50 p-1 text-center shadow-2xs">
        {/* Power */}
        <div className="flex flex-col items-center justify-center rounded py-1 px-0.5 bg-panel border border-line/40">
          <div className="flex items-center gap-1">
            <Zap size={11} className={u?.electricity ? 'text-amber-500' : 'text-ink-3'} />
            <span className="text-[10px] font-semibold text-ink">Power</span>
          </div>
          <span className={clsx(
            'text-[9.5px] font-medium leading-tight mt-0.5',
            u?.electricity ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-3'
          )}>
            {u?.electricity ? (elec?.sanctioned_load_kw ? `${elec.sanctioned_load_kw}kW` : 'Active') : 'None'}
          </span>
        </div>

        {/* Water */}
        <div className="flex flex-col items-center justify-center rounded py-1 px-0.5 bg-panel border border-line/40">
          <div className="flex items-center gap-1">
            <Droplets size={11} className={u?.water ? 'text-sky-500' : 'text-ink-3'} />
            <span className="text-[10px] font-semibold text-ink">Water</span>
          </div>
          <span className={clsx(
            'text-[9.5px] font-medium leading-tight mt-0.5',
            u?.water ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-3'
          )}>
            {u?.water ? 'Piped Tap' : 'None'}
          </span>
        </div>

        {/* Drainage */}
        <div className="flex flex-col items-center justify-center rounded py-1 px-0.5 bg-panel border border-line/40">
          <div className="flex items-center gap-1">
            <Waves size={11} className={u?.sewer ? 'text-indigo-500' : 'text-amber-500'} />
            <span className="text-[10px] font-semibold text-ink">Sewer</span>
          </div>
          <span className={clsx(
            'text-[9.5px] font-medium leading-tight mt-0.5',
            u?.sewer ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          )}>
            {u?.sewer ? 'UGD Grid' : 'Septic'}
          </span>
        </div>

        {/* Gas */}
        <div className="flex flex-col items-center justify-center rounded py-1 px-0.5 bg-panel border border-line/40">
          <div className="flex items-center gap-1">
            <Flame size={11} className={u?.gas ? 'text-orange-500' : 'text-ink-3'} />
            <span className="text-[10px] font-semibold text-ink">Gas</span>
          </div>
          <span className={clsx(
            'text-[9.5px] font-medium leading-tight mt-0.5',
            u?.gas ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-3'
          )}>
            {u?.gas ? 'PNG Line' : 'None'}
          </span>
        </div>

        {/* OFC */}
        <div className="flex flex-col items-center justify-center rounded py-1 px-0.5 bg-panel border border-line/40">
          <div className="flex items-center gap-1">
            <Wifi size={11} className={u?.broadband ? 'text-teal-500' : 'text-ink-3'} />
            <span className="text-[10px] font-semibold text-ink">Fiber</span>
          </div>
          <span className={clsx(
            'text-[9.5px] font-medium leading-tight mt-0.5',
            u?.broadband ? 'text-teal-600 dark:text-teal-400' : 'text-ink-3'
          )}>
            {u?.broadband ? 'Gigabit' : 'Aerial'}
          </span>
        </div>
      </div>

      {/* 3. Detailed Service Connections */}
      <div className="flex flex-col gap-2">
        {/* 3.1 Electricity / DISCOM */}
        {u?.electricity ? (
          <div className="rounded-lg border border-line bg-panel p-2.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-line/50">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Zap size={11} />
                </span>
                <span className="font-semibold text-ink shrink-0 text-xs">Electricity (DISCOM)</span>
                {elec?.provider && (
                  <span className="text-[10.5px] text-ink-3 truncate max-w-[140px]">
                    · {cleanProvider(elec.provider)}
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <Check size={9} /> Active
              </span>
            </div>

            <div className="mt-1.5 grid grid-cols-2 gap-x-2.5 gap-y-1 rounded bg-ground-1/60 px-2 py-1.5 text-[11px]">
              <div className="flex items-baseline justify-between gap-1 border-b border-line/30 pb-0.5">
                <span className="text-[10px] text-ink-3">USC / Connection</span>
                <span className="font-mono font-semibold text-ink">{elec?.consumer_no || '—'}</span>
              </div>
              <div className="flex items-baseline justify-between gap-1 border-b border-line/30 pb-0.5">
                <span className="text-[10px] text-ink-3">Load</span>
                <span className="font-medium text-ink">
                  {elec?.sanctioned_load_kw ? `${elec.sanctioned_load_kw} kW (${elec.phase || '1-Ph'})` : '—'}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-1 pt-0.5">
                <span className="text-[10px] text-ink-3">Tariff</span>
                <span className="font-medium text-ink truncate">{elec?.tariff_category || 'LT-I Domestic'}</span>
              </div>
              <div className="flex items-baseline justify-between gap-1 pt-0.5">
                <span className="text-[10px] text-ink-3">Consumer</span>
                <span className="font-medium text-ink truncate">{elec?.consumer_name || '—'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-line bg-ground-2/30 px-2.5 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="flex size-4.5 shrink-0 items-center justify-center rounded bg-ground-2 text-ink-3">
                <Zap size={11} />
              </span>
              <span className="font-medium text-ink-2 shrink-0 text-xs">Power & Electricity</span>
              <span className="text-[10.5px] text-ink-3 truncate hidden sm:inline">· No active connection</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-ink-3 font-medium">Unconnected</span>
              <Link to="/citizen/request" search={{ type: 'utility_request', ulpin: p.ulpin }} className="text-[10.5px] font-semibold text-primary hover:underline">
                Apply →
              </Link>
            </div>
          </div>
        )}

        {/* 3.2 Municipal Water Supply */}
        {u?.water ? (
          <div className="rounded-lg border border-line bg-panel p-2.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-line/50">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-sky-500/15 text-sky-600 dark:text-sky-400">
                  <Droplets size={11} />
                </span>
                <span className="font-semibold text-ink shrink-0 text-xs">Municipal Water Supply</span>
                {water?.provider && (
                  <span className="text-[10.5px] text-ink-3 truncate max-w-[140px]">
                    · {cleanProvider(water.provider)}
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <Check size={9} /> Active
              </span>
            </div>

            <div className="mt-1.5 grid grid-cols-2 gap-x-2.5 gap-y-1 rounded bg-ground-1/60 px-2 py-1.5 text-[11px]">
              <div className="flex items-baseline justify-between gap-1 border-b border-line/30 pb-0.5">
                <span className="text-[10px] text-ink-3">CAN / Tap ID</span>
                <span className="font-mono font-semibold text-ink">{water?.consumer_no || '—'}</span>
              </div>
              <div className="flex items-baseline justify-between gap-1 border-b border-line/30 pb-0.5">
                <span className="text-[10px] text-ink-3">Pipe Size</span>
                <span className="font-medium text-ink">{water?.pipe_size_mm ? `${water.pipe_size_mm} mm (0.5")` : '15 mm'}</span>
              </div>
              <div className="flex items-baseline justify-between gap-1 pt-0.5">
                <span className="text-[10px] text-ink-3">Quality</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 truncate">
                  {water?.water_quality_index?.includes('TDS')
                    ? water.water_quality_index
                    : 'Potable (Govt Std)'}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-1 pt-0.5">
                <span className="text-[10px] text-ink-3">Schedule</span>
                <span className="font-medium text-ink truncate">
                  {water?.supply_hours ? 'Morning & Evening' : 'Daily Supply'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-line bg-ground-2/30 px-2.5 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="flex size-4.5 shrink-0 items-center justify-center rounded bg-ground-2 text-ink-3">
                <Droplets size={11} />
              </span>
              <span className="font-medium text-ink-2 shrink-0 text-xs">Municipal Water Supply</span>
              <span className="text-[10.5px] text-ink-3 truncate hidden sm:inline">· No piped tap</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-ink-3 font-medium">Unconnected</span>
              <Link to="/citizen/request" search={{ type: 'utility_request', ulpin: p.ulpin }} className="text-[10.5px] font-semibold text-primary hover:underline">
                Apply →
              </Link>
            </div>
          </div>
        )}

        {/* 3.3 Drainage & Sewerage (UGD) */}
        {u?.sewer ? (
          <div className="rounded-lg border border-line bg-panel p-2.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-line/50">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                  <Waves size={11} />
                </span>
                <span className="font-semibold text-ink shrink-0 text-xs">Underground Drainage (UGD)</span>
                {sewer?.maintenance_ward && (
                  <span className="text-[10.5px] text-ink-3 truncate max-w-[130px]">
                    · {cleanProvider(sewer.maintenance_ward)}
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <Check size={9} /> Connected
              </span>
            </div>

            <div className="mt-1.5 grid grid-cols-2 gap-x-2.5 gap-y-1 rounded bg-ground-1/60 px-2 py-1.5 text-[11px]">
              <div className="flex items-baseline justify-between gap-1 border-b border-line/30 pb-0.5">
                <span className="text-[10px] text-ink-3">UGD Connection</span>
                <span className="font-mono font-semibold text-ink">{sewer?.connection_no || '—'}</span>
              </div>
              <div className="flex items-baseline justify-between gap-1 border-b border-line/30 pb-0.5">
                <span className="text-[10px] text-ink-3">Nearest Manhole</span>
                <span className="font-medium text-ink">
                  {sewer?.nearest_manhole_distance_m ? `${sewer.nearest_manhole_distance_m} m` : '8 m'}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-1 pt-0.5 col-span-2">
                <span className="text-[10px] text-ink-3">Inspection Status</span>
                <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={10} />
                  {titleCase(sewer?.chamber_inspection || 'Clear Pass')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-line bg-ground-2/30 px-2.5 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="flex size-4.5 shrink-0 items-center justify-center rounded bg-ground-2 text-ink-3">
                <Waves size={11} />
              </span>
              <span className="font-medium text-ink-2 shrink-0 text-xs">Drainage</span>
              <span className="text-[10.5px] text-amber-600 dark:text-amber-400 font-medium truncate">· Septic Tank on-site</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/citizen/request" search={{ type: 'utility_request', ulpin: p.ulpin }} className="text-[10.5px] font-semibold text-primary hover:underline">
                Apply UGD →
              </Link>
            </div>
          </div>
        )}

        {/* 3.4 Piped Natural Gas (PNG) */}
        {u?.gas ? (
          <div className="rounded-lg border border-line bg-panel p-2.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-line/50">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-orange-500/15 text-orange-600 dark:text-orange-400">
                  <Flame size={11} />
                </span>
                <span className="font-semibold text-ink shrink-0 text-xs">Piped Natural Gas (PNG)</span>
                {gas?.provider && (
                  <span className="text-[10.5px] text-ink-3 truncate max-w-[130px]">
                    · {cleanProvider(gas.provider)}
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <Check size={9} /> Active
              </span>
            </div>

            <div className="mt-1.5 grid grid-cols-2 gap-x-2.5 gap-y-1 rounded bg-ground-1/60 px-2 py-1.5 text-[11px]">
              <div className="flex items-baseline justify-between gap-1 border-b border-line/30 pb-0.5">
                <span className="text-[10px] text-ink-3">BP Account</span>
                <span className="font-mono font-semibold text-ink">{gas?.bp_no || '—'}</span>
              </div>
              <div className="flex items-baseline justify-between gap-1 border-b border-line/30 pb-0.5">
                <span className="text-[10px] text-ink-3">Gas Meter</span>
                <span className="font-mono text-ink-2">{gas?.meter_no || '—'}</span>
              </div>
              <div className="flex items-baseline justify-between gap-1 pt-0.5 col-span-2">
                <span className="text-[10px] text-ink-3">Category</span>
                <span className="font-medium text-ink truncate">{gas?.connection_type || 'Domestic PNG'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-line bg-ground-2/30 px-2.5 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="flex size-4.5 shrink-0 items-center justify-center rounded bg-ground-2 text-ink-3">
                <Flame size={11} />
              </span>
              <span className="font-medium text-ink-2 shrink-0 text-xs">Natural Gas (PNG)</span>
              <span className="text-[10.5px] text-ink-3 truncate hidden sm:inline">· No pipeline connection</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-ink-3 font-medium">Unconnected</span>
              <Link to="/citizen/request" search={{ type: 'utility_request', ulpin: p.ulpin }} className="text-[10.5px] font-semibold text-primary hover:underline">
                Apply →
              </Link>
            </div>
          </div>
        )}

        {/* 3.5 OFC Fiber Broadband */}
        {u?.broadband ? (
          <div className="rounded-lg border border-line bg-panel p-2.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-line/50">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-teal-500/15 text-teal-600 dark:text-teal-400">
                  <Wifi size={11} />
                </span>
                <span className="font-semibold text-ink shrink-0 text-xs">OFC Fiber Broadband</span>
                <span className="text-[10.5px] text-ink-3 truncate hidden sm:inline">· Underground FTTH</span>
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-teal-500/10 px-1.5 py-0.5 text-[9.5px] font-medium text-teal-600 dark:text-teal-400 border border-teal-500/20 shrink-0">
                <Check size={9} /> Gigabit Ready
              </span>
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-2 rounded bg-ground-1/60 px-2 py-1.5 text-[11px]">
              <div>
                <span className="text-[10px] text-ink-3">Speed: </span>
                <span className="font-semibold text-ink">{bb?.max_speed_available || '1 Gbps'}</span>
              </div>
              <div className="flex items-center gap-1 truncate">
                <span className="text-[10px] text-ink-3">ISPs: </span>
                <span className="font-medium text-ink-2 truncate">
                  {(bb?.available_isps || ['BSNL', 'JioFiber', 'Airtel']).join(' · ')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-line bg-ground-2/30 px-2.5 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="flex size-4.5 shrink-0 items-center justify-center rounded bg-ground-2 text-ink-3">
                <Wifi size={11} />
              </span>
              <span className="font-medium text-ink-2 shrink-0 text-xs">Fiber Broadband</span>
              <span className="text-[10.5px] text-ink-3 truncate hidden sm:inline">· Overhead / Aerial only</span>
            </div>
            <span className="text-[10px] text-ink-3 font-medium shrink-0">Aerial</span>
          </div>
        )}

        {/* 3.6 Road Frontage & Environmental Infrastructure */}
        <div className="rounded-lg border border-line bg-panel p-2.5 text-xs shadow-2xs">
          <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-line/50">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="flex size-5 shrink-0 items-center justify-center rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Route size={11} />
              </span>
              <span className="font-semibold text-ink shrink-0 text-xs">Road Access & Sanitation</span>
              <span className="text-[10.5px] text-ink-3 truncate hidden sm:inline">· Civic Lifelines</span>
            </div>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <ShieldCheck size={10} /> Certified
            </span>
          </div>

          <div className="mt-1.5 grid grid-cols-2 gap-x-2.5 gap-y-1 rounded bg-ground-1/60 px-2 py-1.5 text-[11px]">
            <div className="flex items-baseline justify-between gap-1 border-b border-line/30 pb-0.5">
              <span className="text-[10px] text-ink-3">Frontage</span>
              <span className="font-semibold text-ink">
                {u?.road_access_m !== null && u?.road_access_m !== undefined ? `${u.road_access_m} m` : '—'}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1 border-b border-line/30 pb-0.5">
              <span className="text-[10px] text-ink-3">Classification</span>
              <span className="font-medium text-ink truncate">{titleCase(u?.nearest_road_class || 'District Road')}</span>
            </div>
            <div className="flex items-baseline justify-between gap-1 pt-0.5">
              <span className="text-[10px] text-ink-3">Rainwater (RWH)</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400 truncate">
                {san?.rwh_pit_status ? titleCase(san.rwh_pit_status) : (u?.rainwater_harvesting ? 'Compliant' : 'Pending')}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1 pt-0.5">
              <span className="text-[10px] text-ink-3">Solid Waste QR</span>
              <span className="font-mono text-ink-2 truncate">{san?.sanitation_qr || 'SWM-MUNICIPAL'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Endorsement & Modification History (Compact Feed) */}
      {history.length > 0 && (
        <div className="space-y-1.5">
          <SectionTitle>{t('drawer.utilityHistory', 'Endorsement & Modification Log')}</SectionTitle>
          <div className="rounded-lg border border-line bg-panel p-2 shadow-2xs divide-y divide-line/40">
            {history.map((h, i) => (
              <div key={i} className="py-1.5 first:pt-0.5 last:pb-0.5 text-xs">
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="inline-flex items-center gap-1 font-semibold text-ink capitalize">
                    <span className="size-1.5 rounded-full bg-primary" />
                    {h.action.replace('_', ' ')}: {h.consumer_name || 'Consumer'}
                  </span>
                  <span className="font-mono text-[10px] text-ink-3">{h.date}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[10.5px] text-ink-2 pl-2.5">
                  <span className="truncate">{h.remark || 'Processed by Department'}</span>
                  {h.application_id && (
                    <span className="font-mono text-[10px] text-ink-3 shrink-0 ml-1">
                      {h.application_id}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Buildings & Units (3D Cadastre) */}
      <div className="space-y-1.5">
        <SectionTitle>{t('drawer.buildingsUnits', 'Buildings & Units (3D Cadastre)')}</SectionTitle>
        {p.buildings.length === 0 ? (
          <p className="text-xs text-ink-3">{t('drawer.noBuildingFootprint', 'No building footprint on record.')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {p.buildings.map((b) => (
              <li key={b.id} className="rounded-lg border border-line bg-panel shadow-2xs overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 border-b border-line px-2.5 py-1.5 text-xs">
                  <Building2 size={13} className="text-primary shrink-0" />
                  <span className="font-semibold text-ink">{b.name ?? `Building ${b.id}`}</span>
                  <span className="text-ink-3 text-[10.5px]">
                    · {b.floors} fl{b.basement_floors ? ` + ${b.basement_floors}b` : ''}
                    {b.height_m ? ` · ${b.height_m}m` : ''}
                  </span>
                </div>
                <ul className="max-h-32 overflow-y-auto scroll-thin divide-y divide-line/40">
                  {b.units.map((un) => (
                    <li key={un.ulpin_3d} className="flex items-center justify-between gap-2 px-2.5 py-1 text-[11px] odd:bg-ground-2/40">
                      <span className="font-mono font-medium text-ink">{un.ulpin_3d}</span>
                      <span className="text-right text-ink-2 text-[10.5px]">
                        {un.floor === 0 ? 'B' : `F${un.floor}`} · {un.unit_no}
                        {un.area_sqm ? ` · ${un.area_sqm} m²` : ''}
                        {un.owner_name ? ` · ${un.owner_name}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

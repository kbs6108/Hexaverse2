import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, NavigationControl, ScaleControl, Source, type MapRef } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import { useQuery } from '@tanstack/react-query';
import { env } from '@/lib/env';
import { api, qk } from '@/lib/api';
import { useUI } from '@/lib/store';
import { ensureImages } from './patterns';
import * as L from './styles/layers';
import { HoverCard, type HoverInfo } from './HoverCard';
import { RegionMarkers } from './RegionMarkers';
import { BoundaryEditLayers } from './BoundaryEditor';
import { UnitCard, type UnitInfo } from './UnitCard';

// The demo spans three state clusters (CONTRACTS §10), so the map allows a national
// overview: bounds cover India + margin, and RegionMarkers guide users into a cluster.
const MAX_BOUNDS: [number, number, number, number] = [55.0, 0.0, 110.0, 40.0];

export function MapView() {
  const mapRef = useRef<MapRef>(null);
  const { layers, colourBy, basemap, show3D, selectedUlpin, hoverUlpin, flyTo, drawerOpen, select, setHover } = useUI();
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [unitInfo, setUnitInfo] = useState<UnitInfo | null>(null);
  const imagery = basemap === 'imagery';

  const mapStyle = useMemo(() => (imagery ? L.imageryStyle(env.esriApiKey || '') : L.STREETS_STYLE), [imagery]);

  const village = useQuery({
    queryKey: qk.villageBoundary(),
    queryFn: () => api.items('village_boundary', { limit: 10 }),
    staleTime: Infinity,
    retry: false,
  });

  /* ---- images survive basemap switches ---- */
  const onLoad = useCallback(() => {
    const m = mapRef.current?.getMap();
    if (!m) return;
    ensureImages(m);
    m.on('styleimagemissing', () => ensureImages(m));
    m.on('style.load', () => ensureImages(m));
  }, []);

  /* ---- feature-state: hover + selected ---- */
  const prevHover = useRef<string | null>(null);
  const prevSelected = useRef<string | null>(null);
  const setState = (id: string | null, key: 'hover' | 'selected', on: boolean) => {
    const m = mapRef.current?.getMap();
    if (!m || !id || !m.getSource(L.SRC.parcels)) return;
    m.setFeatureState({ source: L.SRC.parcels, sourceLayer: 'parcels', id }, { [key]: on });
  };
  useEffect(() => {
    setState(prevHover.current, 'hover', false);
    setState(hoverUlpin, 'hover', true);
    prevHover.current = hoverUlpin;
  }, [hoverUlpin]);
  useEffect(() => {
    setState(prevSelected.current, 'selected', false);
    setState(selectedUlpin, 'selected', true);
    prevSelected.current = selectedUlpin;
  }, [selectedUlpin, mapStyle]);

  /* ---- fly-to requests (search, story chips, deep links) ---- */
  useEffect(() => {
    if (!flyTo) return;
    const m = mapRef.current?.getMap();
    if (!m) return;
    const [w, s, e, n] = flyTo.bbox;
    m.fitBounds(
      [
        [w, s],
        [e, n],
      ],
      { padding: { top: 80, bottom: 80, left: 380, right: drawerOpen ? 520 : 80 }, maxZoom: 18.5, duration: 900 },
    );
  }, [flyTo, drawerOpen]);

  /* ---- 3D preview pitch ---- */
  useEffect(() => {
    const m = mapRef.current?.getMap();
    if (!m) return;
    m.easeTo({ pitch: show3D ? 55 : 0, bearing: show3D ? -12 : 0, duration: 700 });
    if (!show3D) setUnitInfo(null);
  }, [show3D]);

  const onMouseMove = (e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f) {
      if (hoverInfo) setHoverInfo(null);
      if (hoverUlpin) setHover(null);
      return;
    }
    const p = f.properties as Record<string, unknown>;
    const ulpin = String(p.ulpin ?? f.id ?? '');
    if (ulpin !== hoverUlpin) setHover(ulpin);
    setHoverInfo({ x: e.point.x, y: e.point.y, props: p });
  };
  const onMouseLeave = () => {
    setHoverInfo(null);
    setHover(null);
  };
  const onClick = (e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f) {
      select(null);
      setUnitInfo(null);
      return;
    }
    // In 3D mode, unit extrusions take precedence: clicking one opens its data card.
    if (f.layer?.id === 'units-3d') {
      setUnitInfo(f.properties as UnitInfo);
      return;
    }
    const ulpin = String((f.properties as Record<string, unknown>).ulpin ?? f.id ?? '');
    if (ulpin) select(ulpin);
  };

  return (
    <div className="relative h-full w-full" data-basemap={basemap}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: env.defaultCenter[0], latitude: env.defaultCenter[1], zoom: env.defaultZoom }}
        mapStyle={mapStyle}
        maxBounds={MAX_BOUNDS}
        minZoom={3.2}
        maxZoom={20}
        attributionControl={{ compact: true }}
        interactiveLayerIds={[...(show3D ? ['units-3d'] : []), ...(layers.parcels ? ['parcels-fill'] : [])]}
        cursor={hoverUlpin ? 'pointer' : 'grab'}
        onLoad={onLoad}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        style={{ width: '100%', height: '100%' }}
        reuseMaps
      >
        <NavigationControl position="bottom-right" visualizePitch />
        <ScaleControl position="bottom-left" maxWidth={120} />
        <RegionMarkers />
        <BoundaryEditLayers />

        {/* Tier 2: zones (under parcels) */}
        <Source id={L.SRC.zones} type="vector" tiles={[L.tileUrl('zones')]} minzoom={10} maxzoom={18}>
          {layers.zones && <Layer {...L.zonesFill} />}
          {layers.zones && <Layer {...L.zonesLine} />}
          {layers.zones && <Layer {...L.zonesLabel} />}
        </Source>

        {/* Tier 3: restriction zones + projects (under parcels) */}
        <Source id={L.SRC.settlement} type="vector" tiles={[L.tileUrl('settlement_schemes')]} minzoom={8} maxzoom={18}>
          {layers.settlement_schemes && <Layer {...L.settlementFill} />}
          {layers.settlement_schemes && <Layer {...L.settlementLine} />}
        </Source>
        <Source id={L.SRC.restriction} type="vector" tiles={[L.tileUrl('restriction_zones')]} minzoom={10} maxzoom={18}>
          {layers.restriction_zones && <Layer {...L.restrictionFill} />}
          {layers.restriction_zones && <Layer {...L.restrictionLine} />}
        </Source>
        <Source id={L.SRC.projects} type="vector" tiles={[L.tileUrl('projects')]} minzoom={10} maxzoom={18}>
          {layers.projects && <Layer {...L.projectsFill} />}
          {layers.projects && <Layer {...L.projectsLine} />}
          {layers.projects && <Layer {...L.projectsLabel} />}
        </Source>

        {/* Tier 1: parcels */}
        <Source id={L.SRC.parcels} type="vector" tiles={[L.tileUrl('parcels')]} promoteId="ulpin" minzoom={10} maxzoom={18}>
          {layers.parcels && <Layer {...L.parcelFill(colourBy, imagery)} />}
          {layers.parcels && <Layer {...L.parcelDisputeHatch} />}
          {layers.parcels && <Layer {...L.parcelSelectedGlow} />}
          {layers.parcels && <Layer {...L.parcelOutline(imagery)} />}
          {layers.parcels && layers.change_alerts && <Layer {...L.changeAlertOutline} />}
          {layers.parcels && layers.survey_labels && <Layer {...L.surveyLabels(imagery)} />}
          {layers.parcels && layers.change_alerts && <Layer {...L.changeAlertIcon} />}
        </Source>

        {/* Tier 3: lines on top */}
        <Source id={L.SRC.water} type="vector" tiles={[L.tileUrl('water_lines')]} minzoom={10} maxzoom={18}>
          {layers.water_lines && <Layer {...L.waterLine} />}
        </Source>
        <Source id={L.SRC.roads} type="vector" tiles={[L.tileUrl('roads')]} minzoom={10} maxzoom={18}>
          {layers.roads && <Layer {...L.roadsLine} />}
          {layers.roads && <Layer {...L.roadsLabel} />}
        </Source>

        {/* Tier 1: village boundary (GeoJSON) */}
        {village.data && (
          <Source id={L.SRC.village} type="geojson" data={village.data as unknown as FeatureCollection}>
            {layers.village_boundary && <Layer {...L.villageCasing} />}
            {layers.village_boundary && <Layer {...L.villageLine} />}
          </Source>
        )}

        {/* 3D preview */}
        <Source id={L.SRC.units} type="vector" tiles={[L.tileUrl('units')]} minzoom={12} maxzoom={18}>
          {show3D && <Layer {...L.unitsExtrusion} />}
        </Source>
      </Map>

      {hoverInfo && !show3D && <HoverCard info={hoverInfo} />}
      {show3D && unitInfo && <UnitCard unit={unitInfo} onClose={() => setUnitInfo(null)} />}
    </div>
  );
}

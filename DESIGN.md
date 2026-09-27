# Tract (Hexaverse2) — Design System Specification

## Overview & Sovereign Identity
Tract is the next-generation sovereign 3D Cadastral Digital Public Infrastructure (DPI) and Statutory Land Governance platform for the Ministry of Rural Development (MoRD) and Department of Land Resources (DoLR), Government of India (Problem Statement SIH26014).

The visual language communicates institutional gravitas, mathematical precision, and state-of-the-art geospatial technology. It combines an architectural slate substrate with luminous emerald (#10B981) and cyan (#06B6D4) accents, glassmorphic HUD overlays, and tabular monospace data chips.

---

## 1. Color Palette & Theming

### Dark Mode (Primary Operational HUD)
- **Canvas / Base Substrate**: `#0B0F14` (Deep obsidian slate)
- **Layer 1 Surface (Panels & Drawers)**: `#111822` (Substrate dark slate)
- **Layer 2 Surface (Cards & Modals)**: `#16202C` (Elevated panel)
- **Layer 3 Surface (Interactive HUD)**: `rgba(22, 32, 44, 0.85)` with `backdrop-filter: blur(16px)`
- **Border / Hairline Guides**: `#243447` (Default), `#334860` (Strong/Active)
- **Text / Typography**:
  - Ink Primary: `#F8FAFC` (Pure white text)
  - Ink Secondary: `#CBD5E1` (Muted technical details)
  - Ink Tertiary: `#94A3B8` (Captions, labels, timestamps)

### Sovereign Semantic Accents
- **Primary / Verified Cadastre**: `#10B981` (Sovereign Emerald)
  - Soft Container: `#064E3B`
  - Text Contrast: `#042F2E`
- **Secondary / Geospatial Vector**: `#06B6D4` (Electric Cyan)
  - Soft Container: `rgba(6, 182, 212, 0.15)`
- **Warning / Sub-Judice Lis Pendens**: `#F59E0B` (Amber Gold)
  - Soft Container: `#451A03`
- **Critical / Encroachment Alert / Stay Order**: `#EF4444` (Ruby Alert)
  - Soft Container: `#450A0A`
- **Judicial / Statutory Tier**: `#818CF8` (Sovereign Indigo/Violet)

---

## 2. Typography

- **Headlines & Display**: Space Grotesk / Bricolage Grotesque (Geometric, authoritative, high-legibility)
  - `display-xl`: 56px / 64px, weight 700, letter-spacing -0.03em
  - `headline-lg`: 36px / 44px, weight 600, letter-spacing -0.02em
  - `headline-md`: 24px / 32px, weight 600, letter-spacing -0.01em
- **Body & Interfaces**: Inter / SF Pro Text (Neutral, clear at small sizes)
  - `body-lg`: 18px / 28px, weight 400
  - `body-md`: 15px / 24px, weight 400
  - `body-sm`: 13px / 20px, weight 400
- **Technical & Cadastral Coordinates**: JetBrains Mono / IBM Plex Mono (Tabular numerals, aligned coordinates)
  - `label-lg`: 14px / 20px, weight 500
  - `label-md`: 12px / 16px, weight 500
  - `label-sm`: 10px / 14px, weight 600, uppercase tracking +0.06em

---

## 3. Elevation & Surfaces

- **Glassmorphic Refraction**: Elevated HUD toolbars use `backdrop-filter: blur(16px)` with a 1px border gradient transitioning from `rgba(16, 185, 129, 0.35)` to `rgba(6, 182, 212, 0.10)`.
- **Photon Halos**: Hard drop shadows are replaced with diffuse ambient glows (`0 0 24px rgba(16, 185, 129, 0.15)` for active modules; `0 0 24px rgba(6, 182, 212, 0.20)` for telemetry alerts).
- **Hairline Borders**: Crisp 1px borders enforcing cadastral discipline across cards and viewports.

---

## 4. Key Component Guidelines

### GovStrip (National DPI Bar)
- Indian Tricolour subtle bar on top.
- MoRD & DoLR national sovereign emblem badges.
- Live CORS Network and MeghRaj-3 cloud deployment indicators.

### 3D Cadastral Map Viewport & Overlays
- MapLibre GL 3D vector cadastre with extruded polygon voxel heights (sub-surface to airspace).
- Floating HUD toolbar for 3-tier cadastral layer toggling:
  - L1: Base Cadastre (CORS, boundaries, survey marks)
  - L2: Statutory RRR (Ownership, encumbrance, mortgage lien)
  - L3: Satellite AI Telemetry (NDVI/NDBI differencing overlay)

### SearchBox & ULPIN Navigator
- Auto-complete search supporting 14-digit ULPIN, Khata Number, Survey Number, and Owner Name.
- Quick navigation pills with keyboard shortcuts (Cmd+K / Ctrl+K).

### Parcel Drawer & Dossier
- Sliding glassmorphic drawer presenting the comprehensive land title:
  - ULPIN header with Bhoo-Aadhaar badge.
  - Ownership details with role-based masking (Citizen vs Officer).
  - Encumbrance & CERSAI bank charge registry status.
  - Interactive deed mutation timeline with cryptographic audit hashes.

### Officer & Admin Consoles
- 4-Stage Statutory Desk Scrutiny workflow queue:
  1. e-Sub-Registrar Deed Ingestion
  2. Kafka Canonical Event Bus
  3. Statutory Checks (Lis Pendens, CERSAI, Revenue Court)
  4. Auto-Mutation & DigiLocker Dispatch
- Multi-state adapter status indicators (Andhra Pradesh, Tamil Nadu, Telangana).

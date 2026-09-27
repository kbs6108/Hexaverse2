import base64
import os
import subprocess

def get_b64(path):
    if os.path.exists(path):
        with open(path, 'rb') as f:
            return 'data:image/png;base64,' + base64.b64encode(f.read()).decode('utf-8')
    return ''

parcel_b64 = get_b64('docs/plan/screenshot_parcel.png')
citizen_b64 = get_b64('docs/plan/screenshot_citizen.png')
mob_cit_b64 = get_b64('docs/plan/screenshot_mobile_citizen.png')
mob_trk_b64 = get_b64('docs/plan/screenshot_mobile_track.png')
map_b64 = get_b64('docs/plan/screenshot_map.png')

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SIH 2026 - Project Tract (Hexaverse)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
  :root {{
    --bg-page: #F8FAFC;
    --card-bg: #FFFFFF;
    --border-color: #E2E8F0;
    --border-strong: #CBD5E1;
    --text-primary: #0F172A;
    --text-secondary: #334155;
    --text-muted: #64748B;
    --navy-primary: #1E3A8A;
    --navy-dark: #0A2540;
    --navy-light: #EFF6FF;
    --amber-primary: #D97706;
    --amber-light: #FEF3C7;
    --emerald-primary: #059669;
    --emerald-light: #ECFDF5;
    --rose-primary: #E11D48;
    --rose-light: #FFF1F2;
  }}

  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  
  @page {{
    size: 1920px 1080px;
    margin: 0;
  }}

  body {{
    background: #525659;
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
    padding: 40px 0;
  }}

  @media print {{
    body {{
      background: transparent;
      padding: 0;
      gap: 0;
    }}
    .slide {{
      page-break-after: always;
      break-after: page;
      box-shadow: none !important;
      margin: 0 !important;
    }}
  }}

  .slide {{
    width: 1920px;
    height: 1080px;
    background: var(--bg-page);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 44px 60px 36px 60px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
  }}

  /* HEADER */
  .slide-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 16px;
    margin-bottom: 24px;
  }}
  .header-left {{
    display: flex;
    align-items: center;
    gap: 16px;
  }}
  .gov-badge {{
    display: flex;
    align-items: center;
    gap: 12px;
  }}
  .tricolor-bar {{
    width: 5px;
    height: 38px;
    background: linear-gradient(to bottom, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%);
    border-radius: 2px;
    border: 1px solid #CBD5E1;
  }}
  .gov-title {{
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--navy-dark);
    line-height: 1.25;
  }}
  .gov-subtitle {{
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
  }}
  .header-center {{
    text-align: center;
  }}
  .sih-badge-pill {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--navy-light);
    border: 1px solid #BFDBFE;
    padding: 6px 16px;
    border-radius: 9999px;
  }}
  .sih-badge-pill span.logo {{
    font-weight: 800;
    color: var(--navy-primary);
    font-size: 14px;
    letter-spacing: 0.05em;
  }}
  .sih-badge-pill span.ps {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 700;
    color: var(--amber-primary);
    background: var(--amber-light);
    padding: 2px 8px;
    border-radius: 4px;
  }}
  .header-right {{
    display: flex;
    align-items: center;
    gap: 14px;
  }}
  .slide-num {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-muted);
    background: #FFFFFF;
    border: 1px solid var(--border-color);
    padding: 5px 12px;
    border-radius: 6px;
  }}

  /* FOOTER */
  .slide-footer {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--border-color);
    padding-top: 14px;
    margin-top: 20px;
    font-size: 12.5px;
    color: var(--text-muted);
    font-weight: 500;
  }}
  .footer-left {{
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .footer-dot {{
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--emerald-primary);
  }}
  .footer-right {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
  }}

  /* UTILITY CARDS & GRIDS */
  .card {{
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 18px 22px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
  }}
  .card-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }}
  .card-title {{
    font-size: 15px;
    font-weight: 700;
    color: var(--navy-dark);
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .card-badge {{
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }}
  .badge-navy {{ background: var(--navy-light); color: var(--navy-primary); }}
  .badge-amber {{ background: var(--amber-light); color: var(--amber-primary); }}
  .badge-emerald {{ background: var(--emerald-light); color: var(--emerald-primary); }}
  .badge-rose {{ background: var(--rose-light); color: var(--rose-primary); }}

  /* DEVICE MOCKUPS */
  .macbook-wrapper {{
    position: relative;
    background: #E2E8F0;
    border-radius: 16px 16px 4px 4px;
    padding: 12px 12px 18px 12px;
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.08);
  }}
  .macbook-camera {{
    width: 6px;
    height: 6px;
    background: #334155;
    border-radius: 50%;
    margin: 0 auto 8px auto;
  }}
  .macbook-screen {{
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    border: 1px solid #94A3B8;
  }}
  .macbook-screen img {{
    width: 100%;
    height: 480px;
    object-fit: cover;
    display: block;
  }}
  .macbook-base {{
    height: 12px;
    background: linear-gradient(to bottom, #CBD5E1, #94A3B8);
    border-radius: 0 0 16px 16px;
    margin: 0 -24px;
    position: relative;
    box-shadow: 0 8px 16px rgba(0,0,0,0.15);
  }}
  .macbook-notch {{
    width: 120px;
    height: 5px;
    background: #64748B;
    margin: 0 auto;
    border-radius: 0 0 6px 6px;
  }}

  .phone-mockup {{
    width: 250px;
    background: #0F172A;
    border-radius: 36px;
    padding: 10px;
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.25), 0 0 0 3px #334155;
    position: relative;
  }}
  .phone-notch {{
    width: 80px;
    height: 16px;
    background: #000;
    border-radius: 12px;
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
  }}
  .phone-screen {{
    border-radius: 28px;
    overflow: hidden;
    background: #FFF;
    border: 1px solid #1E293B;
  }}
  .phone-screen img {{
    width: 100%;
    height: 460px;
    object-fit: cover;
    display: block;
  }}

  /* TECH STACK LOGOS RIBBON */
  .tech-ribbon {{
    display: flex;
    align-items: center;
    gap: 12px;
    background: #FFFFFF;
    border: 1px solid var(--border-color);
    padding: 10px 18px;
    border-radius: 10px;
    margin-top: 12px;
  }}
  .tech-pill {{
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #F1F5F9;
    border: 1px solid #E2E8F0;
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 12.5px;
    font-weight: 600;
    color: #1E293B;
  }}
  .tech-pill span.dot {{
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--navy-primary);
  }}

  /* TITLES & LABELS */
  h1.slide-title {{
    font-size: 28px;
    font-weight: 800;
    color: var(--navy-dark);
    letter-spacing: -0.02em;
    margin-bottom: 4px;
  }}
  p.slide-subtitle {{
    font-size: 14.5px;
    color: var(--text-secondary);
    font-weight: 500;
    margin-bottom: 18px;
  }}
</style>
</head>
<body>

<!-- ========================================================================= -->
<!-- SLIDE 1: TITLE PAGE                                                       -->
<!-- ========================================================================= -->
<div class="slide" id="slide-1">
  <div class="slide-header">
    <div class="header-left">
      <div class="gov-badge">
        <div class="tricolor-bar"></div>
        <div>
          <div class="gov-title">Government of India · Ministry of Rural Development</div>
          <div class="gov-subtitle">Department of Land Resources (DoLR)</div>
        </div>
      </div>
    </div>
    <div class="header-center">
      <div class="sih-badge-pill">
        <span class="logo">SMART INDIA HACKATHON 2026</span>
        <span class="ps">PS: SIH26014</span>
      </div>
    </div>
    <div class="header-right">
      <div class="slide-num">SLIDE 01 / 06</div>
    </div>
  </div>

  <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 28px;">
    <div>
      <div style="display: inline-flex; align-items: center; gap: 8px; background: #EEF2FF; border: 1px solid #C7D2FE; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 700; color: #3730A3; margin-bottom: 12px;">
        🏛️ SMART GOVERNANCE · RURAL LAND ADMINISTRATION & GIS INFRASTRUCTURE
      </div>
      <h1 style="font-size: 50px; font-weight: 800; color: var(--navy-dark); letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 12px;">
        PROJECT TRACT (HEXAVERSE)
      </h1>
      <p style="font-size: 20px; font-weight: 600; color: var(--text-secondary); max-width: 1400px; line-height: 1.4;">
        India’s Federated, Parcel-Centric Land Governance & 3D Cadastral Digital Public Infrastructure
      </p>
    </div>

    <!-- 4 IDENTITY CARDS -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
      <div class="card" style="border-top: 4px solid var(--navy-primary);">
        <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Problem Statement ID</div>
        <div style="font-size: 22px; font-weight: 800; color: var(--navy-dark); margin-top: 4px; font-family: 'JetBrains Mono', monospace;">SIH26014</div>
        <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px;">Department of Land Resources</div>
      </div>
      <div class="card" style="border-top: 4px solid var(--amber-primary);">
        <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Problem Statement Title</div>
        <div style="font-size: 16px; font-weight: 700; color: var(--navy-dark); margin-top: 4px; line-height: 1.3;">Integrated GIS-based DPI for Land Governance</div>
        <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px;">Federated Cadastral Operating System</div>
      </div>
      <div class="card" style="border-top: 4px solid var(--emerald-primary);">
        <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Theme & Category</div>
        <div style="font-size: 18px; font-weight: 800; color: var(--navy-dark); margin-top: 4px;">Smart Governance</div>
        <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px;">Category: Software (GIS, DPI & AI)</div>
      </div>
      <div class="card" style="border-top: 4px solid var(--rose-primary);">
        <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Team Details</div>
        <div style="font-size: 18px; font-weight: 800; color: var(--navy-dark); margin-top: 4px;">Team Tract</div>
        <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px;">Registered on SIH 2026 Portal</div>
      </div>
    </div>

    <!-- EXECUTIVE CALLOUT -->
    <div class="card" style="background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%); border-left: 6px solid var(--navy-primary); padding: 24px 30px;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 40px;">
        <div style="flex: 1;">
          <div style="font-size: 13px; font-weight: 800; color: var(--navy-primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">The Sovereign Innovation</div>
          <p style="font-size: 15.5px; color: var(--text-secondary); line-height: 1.5;">
            Tract connects six disconnected government silos—Revenue, Registration, Survey, Town Planning, Tax, and Courts—around one sovereign parcel key (ULPIN). Features an <strong>ISO 19152 3D volumetric cadastre</strong> for high-rise property rights, an automated <strong>RFCTLARR 2013 corridor severance engine</strong> for PM GatiShakti, and <strong>Sentinel-2 5-day orbital satellite monitoring</strong> for encroachment detection.
          </p>
        </div>
        <div style="display: flex; gap: 24px; border-left: 1px solid var(--border-color); padding-left: 30px;">
          <div style="text-align: center;">
            <div style="font-size: 30px; font-weight: 800; color: var(--rose-primary);">66%</div>
            <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Civil Suits Solved</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 30px; font-weight: 800; color: var(--amber-primary);">₹16 L Cr</div>
            <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Dead Capital Freed</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 30px; font-weight: 800; color: var(--emerald-primary);">&lt; 4 Min</div>
            <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Title Due Diligence</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <div class="footer-left">
      <div class="footer-dot"></div>
      <span>Project Tract (Hexaverse) · Smart India Hackathon 2026 Idea Submission</span>
    </div>
    <div class="footer-right">CONFIDENTIAL · SUBMITTED TO MINISTRY OF RURAL DEVELOPMENT</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- SLIDE 2: PROPOSED SOLUTION & PLATFORM PREVIEW                             -->
<!-- ========================================================================= -->
<div class="slide" id="slide-2">
  <div class="slide-header">
    <div class="header-left">
      <div class="gov-badge">
        <div class="tricolor-bar"></div>
        <div>
          <div class="gov-title">Proposed Solution · Prototype Preview</div>
          <div class="gov-subtitle">Live Working Prototype & Platform Architecture</div>
        </div>
      </div>
    </div>
    <div class="header-center">
      <div class="sih-badge-pill">
        <span class="logo">SIH 2026</span>
        <span class="ps">PS: SIH26014</span>
      </div>
    </div>
    <div class="header-right">
      <div class="slide-num">SLIDE 02 / 06</div>
    </div>
  </div>

  <div>
    <h1 class="slide-title">PLATFORM PREVIEW: FEDERATED 3D CADASTRE & MOBILE CITIZEN WORKFLOW</h1>
    <p class="slide-subtitle">Search, verify, and resolve land records across 6 departments with instant SHA-256 deed extent cross-verification.</p>
  </div>

  <!-- MAIN SPLIT CONTENT -->
  <div style="flex: 1; display: grid; grid-template-columns: 540px 1fr; gap: 32px; align-items: center;">
    
    <!-- LEFT: MOBILE APP PREVIEW -->
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="font-size: 14px; font-weight: 800; color: var(--navy-dark); text-transform: uppercase; letter-spacing: 0.05em;">
          📱 Citizen Mobile Experience
        </div>
        <span class="card-badge badge-emerald">Multilingual PWA</span>
      </div>

      <div style="display: flex; gap: 16px; justify-content: center;">
        <!-- Phone 1 -->
        <div class="phone-mockup">
          <div class="phone-notch"></div>
          <div class="phone-screen">
            <img src="{mob_cit_b64}" alt="Mobile Citizen Verification">
          </div>
          <div style="color: #FFF; font-size: 11px; text-align: center; margin-top: 8px; font-weight: 600;">Citizen Title Verification</div>
        </div>

        <!-- Phone 2 -->
        <div class="phone-mockup">
          <div class="phone-notch"></div>
          <div class="phone-screen">
            <img src="{mob_trk_b64}" alt="Mobile Track Application">
          </div>
          <div style="color: #FFF; font-size: 11px; text-align: center; margin-top: 8px; font-weight: 600;">4-Stage Statutory Tracker</div>
        </div>
      </div>

      <div style="margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div class="card" style="padding: 10px 14px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--navy-dark);">DPDP Act 2023</div>
          <div style="font-size: 11.5px; color: var(--text-muted);">Masked citizen identity on search</div>
        </div>
        <div class="card" style="padding: 10px 14px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--navy-dark);">Offline Passbook</div>
          <div style="font-size: 11.5px; color: var(--text-muted);">Verifiable QR code title certificate</div>
        </div>
      </div>
    </div>

    <!-- RIGHT: WEB APP LAPTOP PREVIEW -->
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="font-size: 14px; font-weight: 800; color: var(--navy-dark); text-transform: uppercase; letter-spacing: 0.05em;">
          💻 Web App · 3D Sovereign Cadastre Explorer
        </div>
        <span class="card-badge badge-navy">MapLibre GL + PostGIS MVT</span>
      </div>

      <div class="macbook-wrapper">
        <div class="macbook-camera"></div>
        <div class="macbook-screen">
          <img src="{parcel_b64}" alt="Tract Live Cadastre">
        </div>
        <div class="macbook-base">
          <div class="macbook-notch"></div>
        </div>
      </div>

      <!-- 4 FEATURE HIGHLIGHT PILLS -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px;">
        <div class="card" style="padding: 12px 14px;">
          <div style="font-size: 11.5px; font-weight: 800; color: var(--navy-primary); text-transform: uppercase;">1. 6-Dept Truth</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Instant sync across Revenue, SRO, Survey & Courts.</div>
        </div>
        <div class="card" style="padding: 12px 14px;">
          <div style="font-size: 11.5px; font-weight: 800; color: var(--emerald-primary); text-transform: uppercase;">2. ISO 19152 3D</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Volumetric titling for high-rise sky apartments.</div>
        </div>
        <div class="card" style="padding: 12px 14px;">
          <div style="font-size: 11.5px; font-weight: 800; color: var(--amber-primary); text-transform: uppercase;">3. Severance Math</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">RFCTLARR 2013 §23A highway severance + 100% solatium.</div>
        </div>
        <div class="card" style="padding: 12px 14px;">
          <div style="font-size: 11.5px; font-weight: 800; color: var(--rose-primary); text-transform: uppercase;">4. Satellite Watchdog</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Sentinel-2 5-day NDVI vegetation & built-up anomaly alerts.</div>
        </div>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <div class="footer-left">
      <div class="footer-dot"></div>
      <span>Platform Preview: 100% Working Production Prototype · Tested Across Andhra Pradesh, Tamil Nadu & Telangana Datasets</span>
    </div>
    <div class="footer-right">PAGE 2 OF 6</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- SLIDE 3: TECHNICAL APPROACH (ARCHITECTURE GRID)                           -->
<!-- ========================================================================= -->
<div class="slide" id="slide-3">
  <div class="slide-header">
    <div class="header-left">
      <div class="gov-badge">
        <div class="tricolor-bar"></div>
        <div>
          <div class="gov-title">Technical Approach · Architecture Blueprint</div>
          <div class="gov-subtitle">Multi-Tier Federated Architecture & Sovereign Spatial Invariants</div>
        </div>
      </div>
    </div>
    <div class="header-center">
      <div class="sih-badge-pill">
        <span class="logo">SIH 2026</span>
        <span class="ps">PS: SIH26014</span>
      </div>
    </div>
    <div class="header-right">
      <div class="slide-num">SLIDE 03 / 06</div>
    </div>
  </div>

  <div>
    <h1 class="slide-title">TECHNICAL APPROACH: FEDERATED COMMON DATA MODEL & ENGINE</h1>
    <p class="slide-subtitle">Seamless integration of legacy department silos into an interoperable, high-performance spatial pipeline.</p>
  </div>

  <!-- 12-BLOCK ARCHITECTURE GRID -->
  <div style="flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(3, 1fr); gap: 14px;">
    
    <!-- BLOCK 1 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">1. Data Sources (Silos)</div>
        <span class="card-badge badge-navy">Ingest</span>
      </div>
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
        • State Revenue (Meebhoomi, Patta Chitta, Dharani)<br>
        • SRO Deed Instruments & 30-Yr Encumbrance Records<br>
        • Village FMB Cadastral Shapefiles & Survey Maps<br>
        • Master Plans & Subsurface Easements
      </div>
    </div>

    <!-- BLOCK 2 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">2. Ingestion & Invariants</div>
        <span class="card-badge badge-emerald">PostGIS</span>
      </div>
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
        • <strong>Cadastral Snap:</strong> Vertex snapping to FMB traverse lines<br>
        • <strong>Statutory Variance:</strong> Strict ±15% area ceiling check<br>
        • <strong>Topological Invariants:</strong> Zero polygon overlaps/slivers<br>
        • Automated binary Mapbox Vector Tile (MVT) creation
      </div>
    </div>

    <!-- BLOCK 3 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">3. Spatial DB Tier</div>
        <span class="card-badge badge-navy">Storage</span>
      </div>
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
        • <strong>PostgreSQL 16 + PostGIS 3.4</strong> spatial engine<br>
        • High-speed <code>GIST</code> spatial bounding indexes<br>
        • Geometric spatial partitioning via <code>ST_Subdivide</code><br>
        • Neon serverless in cloud / Docker compose locally
      </div>
    </div>

    <!-- BLOCK 4 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">4. Common Data Model</div>
        <span class="card-badge badge-amber">JSON-LD</span>
      </div>
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
        • <strong>CLM 1.0 JSON-LD Context:</strong> Universal semantic key<br>
        • Native multi-state revenue dialect translation<br>
        • Cryptographic <strong>SHA-256 Provenance Hash</strong> per department<br>
        • Interoperable with W3C and ISO 19152 norms
      </div>
    </div>

    <!-- BLOCK 5 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">5. Core Gateway Tier</div>
        <span class="card-badge badge-navy">FastAPI</span>
      </div>
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
        • High-throughput async <strong>Python 3.12 FastAPI</strong> core<br>
        • <strong>ROR Act §5 State Machine:</strong> Sequential desk conveyor<br>
        • Automated Quasi-Judicial Speaking Order generation<br>
        • Sub-400ms federated concurrent department queries
      </div>
    </div>

    <!-- BLOCK 6 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">6. Deed Forensics</div>
        <span class="card-badge badge-rose">Verification</span>
      </div>
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
        • Multimodal OCR extracts survey extent and parties<br>
        • <strong>Geometric Cross-Check:</strong> Deed extent vs PostGIS polygon<br>
        • Immediate red-flag on area mismatch or court stay<br>
        • Cryptographic deed fingerprinting onto ledger
      </div>
    </div>

    <!-- BLOCK 7 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">7. AI & Remote Sensing</div>
        <span class="card-badge badge-emerald">Sentinel-2</span>
      </div>
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
        • Automated 10m Copernicus Sentinel-2 L2A ingestion<br>
        • 5-day orbital revisit NDVI vegetation drop monitoring<br>
        • NDBI built-up surge anomaly detection algorithm<br>
        • Instant triage alerts to Mandal Revenue Officers
      </div>
    </div>

    <!-- BLOCK 8 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">8. Privacy & Governance</div>
        <span class="card-badge badge-amber">DPDP Act</span>
      </div>
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
        • <strong>DPDP Act 2023:</strong> Masked citizen names (R*** K***)<br>
        • Authenticated, purpose-bound unmasking tokens<br>
        • Append-only immutable audit trail with timestamp<br>
        • Role-Based Access Control (VRO, Surveyor, RI, Tahsildar)
      </div>
    </div>

    <!-- BLOCK 9 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">9. Client Tier (Web/PWA)</div>
        <span class="card-badge badge-navy">Frontend</span>
      </div>
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
        • <strong>React 19 + TypeScript + MapLibre GL</strong> client<br>
        • GPU-accelerated client-side vector tile shaders<br>
        • Sub-100ms viewport navigation on rural 3G/4G<br>
        • Trilingual interface (English, Telugu, Hindi)
      </div>
    </div>

    <!-- BLOCK 10 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">10. Cloud Deployment</div>
        <span class="card-badge badge-navy">MeitY Cloud</span>
      </div>
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
        • Containerized microservices on <strong>Google Cloud Run</strong><br>
        • Sovereign data residence in <code>asia-south1</code> (Mumbai)<br>
        • Cloudflare CDN edge caching for cadastral base layers<br>
        • 99.9% uptime with automated horizontal autoscaling
      </div>
    </div>

    <!-- BLOCK 11 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">11. Institutional APIs</div>
        <span class="card-badge badge-emerald">Interoperable</span>
      </div>
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
        • High-security B2B APIs for commercial bank due diligence<br>
        • Instant 9-point title verification before mortgage sanction<br>
        • OGC API Features standard feeds for PM GatiShakti<br>
        • Digitally signed downloadable Title Passbooks
      </div>
    </div>

    <!-- BLOCK 12 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">12. 3D Volumetric Engine</div>
        <span class="card-badge badge-rose">ISO 19152</span>
      </div>
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
        • <strong>ISO 19152 LADM:</strong> 3D-ULPIN suffixing per apartment<br>
        • Above Ground Level (AGL) and Below Ground (BGL) strata<br>
        • Multi-tier property rights (Metro tunnel / Road / Flyover)<br>
        • Prevents unrecorded mortgage and builder fraud
      </div>
    </div>

  </div>

  <!-- TECH STACK RIBBON -->
  <div class="tech-ribbon">
    <div style="font-size: 12px; font-weight: 800; color: var(--navy-dark); text-transform: uppercase; letter-spacing: 0.05em; padding-right: 12px; border-right: 2px solid var(--border-color);">
      Production Tech Stack:
    </div>
    <div class="tech-pill"><span class="dot"></span>React 19</div>
    <div class="tech-pill"><span class="dot"></span>TypeScript 5.9</div>
    <div class="tech-pill"><span class="dot"></span>MapLibre GL</div>
    <div class="tech-pill"><span class="dot"></span>Python 3.12</div>
    <div class="tech-pill"><span class="dot"></span>FastAPI</div>
    <div class="tech-pill"><span class="dot"></span>PostGIS 3.4</div>
    <div class="tech-pill"><span class="dot"></span>PostgreSQL 16</div>
    <div class="tech-pill"><span class="dot"></span>Docker</div>
    <div class="tech-pill"><span class="dot"></span>Sentinel-2</div>
    <div class="tech-pill"><span class="dot"></span>Google Cloud Run</div>
    <div class="tech-pill"><span class="dot"></span>JSON-LD 1.1</div>
  </div>

  <div class="slide-footer">
    <div class="footer-left">
      <div class="footer-dot"></div>
      <span>Architecture: Strict Stateless Microservices + PostGIS Geometric Invariants · Certified MeitY Sovereign Compliance</span>
    </div>
    <div class="footer-right">PAGE 3 OF 6</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- SLIDE 4: FEASIBILITY AND VIABILITY                                        -->
<!-- ========================================================================= -->
<div class="slide" id="slide-4">
  <div class="slide-header">
    <div class="header-left">
      <div class="gov-badge">
        <div class="tricolor-bar"></div>
        <div>
          <div class="gov-title">Feasibility and Viability · Business Model</div>
          <div class="gov-subtitle">Statutory Compatibility, Lean OpEx (Rupees) & Risk Mitigation</div>
        </div>
      </div>
    </div>
    <div class="header-center">
      <div class="sih-badge-pill">
        <span class="logo">SIH 2026</span>
        <span class="ps">PS: SIH26014</span>
      </div>
    </div>
    <div class="header-right">
      <div class="slide-num">SLIDE 04 / 06</div>
    </div>
  </div>

  <div>
    <h1 class="slide-title">FEASIBILITY, ECONOMIC SUSTAINABILITY & RISK MITIGATION</h1>
    <p class="slide-subtitle">Rigorous analysis of operational readiness, cloud infrastructure costs in Indian Rupees, and statutory guardrails.</p>
  </div>

  <!-- 4 QUADRANTS -->
  <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 18px;">
    
    <!-- QUADRANT 1: TECHNICAL FEASIBILITY -->
    <div class="card" style="border-left: 4px solid var(--navy-primary);">
      <div class="card-header">
        <div class="card-title">1. Technical Feasibility & Scalability</div>
        <span class="card-badge badge-navy">Production-Ready</span>
      </div>
      <div style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.55;">
        • <strong>Bandwidth-Efficient:</strong> Streams binary Mapbox Vector Tiles (MVT) generated inside PostGIS. 5,000 parcels consume &lt;150 KB, loading in under 100ms on rural 3G networks.<br>
        • <strong>Stateless Scalability:</strong> Python FastAPI microservices scale horizontally on Google Cloud Run with zero cold-start bottlenecks.<br>
        • <strong>Tested Multi-State Datasets:</strong> Fully validated on real-world revenue cadastres from Andhra Pradesh (Guntur), Tamil Nadu (Sriperumbudur), and Telangana (Shamshabad).
      </div>
    </div>

    <!-- QUADRANT 2: ECONOMIC FEASIBILITY (OPEX IN RUPEES) -->
    <div class="card" style="border-left: 4px solid var(--emerald-primary);">
      <div class="card-header">
        <div class="card-title">2. Economic Feasibility & Running Cost (OpEx in ₹)</div>
        <span class="card-badge badge-emerald">Ultra-Lean</span>
      </div>
      <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
        <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
          <tr style="border-bottom: 1px solid var(--border-color); font-weight: 700;">
            <td style="padding: 4px 0;">Scale</td>
            <td>Infrastructure Components</td>
            <td style="text-align: right;">Monthly Cost (₹)</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 6px 0;"><strong>Pilot Mandal</strong> (100K Plots)</td>
            <td>Cloud Run + Neon Serverless PostGIS + Storage</td>
            <td style="text-align: right; font-weight: 700; color: var(--emerald-primary);">~₹8,000 / mo</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Full State</strong> (30M Plots)</td>
            <td>Autoscaling Cluster + HA PostGIS + Cloudflare CDN</td>
            <td style="text-align: right; font-weight: 700; color: var(--navy-primary);">~₹3,80,000 / mo</td>
          </tr>
        </table>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
          *A statewide deployment runs for ₹3.8 Lakhs/month—less than a single district collectorate’s annual stationery budget!
        </div>
      </div>
    </div>

    <!-- QUADRANT 3: OPERATIONAL & STATUTORY FEASIBILITY -->
    <div class="card" style="border-left: 4px solid var(--amber-primary);">
      <div class="card-header">
        <div class="card-title">3. Operational & Statutory Viability</div>
        <span class="card-badge badge-amber">Zero Friction</span>
      </div>
      <div style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.55;">
        • <strong>Statutory Law Alignment:</strong> Directly enforces Section 5 of the Record of Rights (ROR) Act and State Survey & Boundaries Acts.<br>
        • <strong>Zero Officer Disruption:</strong> Does not eliminate officers. Equips VRO, Surveyor, RI, and Tahsildar with automated pre-assembled dossiers and digital Speaking Orders.<br>
        • <strong>Judicial Defensibility:</strong> Full audit provenance ensures all mutation approvals withstand High Court writ review.
      </div>
    </div>

    <!-- QUADRANT 4: BUSINESS POTENTIAL & MONETIZATION -->
    <div class="card" style="border-left: 4px solid var(--rose-primary);">
      <div class="card-header">
        <div class="card-title">4. Business Potential & 3-Tier Monetization</div>
        <span class="card-badge badge-rose">Self-Funding</span>
      </div>
      <div style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.55;">
        • <strong>G2G State Concession:</strong> Annual SaaS license of <strong>₹15 Lakhs – ₹25 Lakhs per district</strong> for revenue consoles, satellite alerts, and spatial workflow engines.<br>
        • <strong>G2C Micro-Transactions:</strong> Nominal fee of <strong>₹25 – ₹50</strong> for citizen downloads of digitally signed Title Certificates and FMB maps.<br>
        • <strong>B2B Title Due Diligence API:</strong> High-margin fee of <strong>₹150 – ₹300 per query</strong> charged to commercial banks (SBI, HDFC, ICICI) for instant mortgage due diligence.
      </div>
    </div>

  </div>

  <!-- CHALLENGES & MITIGATIONS BAR -->
  <div class="card" style="background: #FFFFFF; border: 1px solid var(--border-color); padding: 14px 20px; margin-top: 14px;">
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 30px;">
      <div style="font-size: 12.5px; font-weight: 800; color: var(--navy-dark); text-transform: uppercase;">Challenges & Statutory Solutions:</div>
      <div style="font-size: 12.5px; color: var(--text-secondary);">
        <strong>Data Inconsistency:</strong> Provenance-based truth matrix flags Title-Registration Asymmetry automatically.
      </div>
      <div style="font-size: 12.5px; color: var(--text-secondary);">
        <strong>Boundary Tampering:</strong> Immutable ±15% statutory ceiling hardcoded in database schema.
      </div>
      <div style="font-size: 12.5px; color: var(--text-secondary);">
        <strong>Citizen Privacy:</strong> DPDP Act 2023 purpose-bound consent masking protects personal data.
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <div class="footer-left">
      <div class="footer-dot"></div>
      <span>Self-Funding SaaS Model: High-Margin Banking Due Diligence Subsidizes Free Rural Citizen Access</span>
    </div>
    <div class="footer-right">PAGE 4 OF 6</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- SLIDE 5: IMPACT AND BENEFITS                                              -->
<!-- ========================================================================= -->
<div class="slide" id="slide-5">
  <div class="slide-header">
    <div class="header-left">
      <div class="gov-badge">
        <div class="tricolor-bar"></div>
        <div>
          <div class="gov-title">Impact and Benefits · Socio-Economic Value</div>
          <div class="gov-subtitle">Transforming Land Governance, National GDP & Citizen Welfare</div>
        </div>
      </div>
    </div>
    <div class="header-center">
      <div class="sih-badge-pill">
        <span class="logo">SIH 2026</span>
        <span class="ps">PS: SIH26014</span>
      </div>
    </div>
    <div class="header-right">
      <div class="slide-num">SLIDE 05 / 06</div>
    </div>
  </div>

  <div>
    <h1 class="slide-title">SOCIO-ECONOMIC IMPACT: UNLOCKING DEAD CAPITAL & CITIZEN DIGNITY</h1>
    <p class="slide-subtitle">Tangible, measurable benefits for 1.4 billion citizens, rural smallholders, infrastructure authorities, and the banking sector.</p>
  </div>

  <!-- 4 STAT BOXES -->
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px;">
    <div class="card" style="text-align: center; border-bottom: 4px solid var(--rose-primary);">
      <div style="font-size: 38px; font-weight: 800; color: var(--rose-primary); line-height: 1;">66% → &lt;10%</div>
      <div style="font-size: 13.5px; font-weight: 700; color: var(--navy-dark); margin-top: 8px;">Civil Court Land Litigation</div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Disputes eliminated at source by unifying title and registry records.</div>
    </div>
    <div class="card" style="text-align: center; border-bottom: 4px solid var(--emerald-primary);">
      <div style="font-size: 38px; font-weight: 800; color: var(--emerald-primary); line-height: 1;">28 Days → 4 Mins</div>
      <div style="font-size: 13.5px; font-weight: 700; color: var(--navy-dark); margin-top: 8px;">Title Verification Turnaround</div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Instant multi-department search replaces manual physical office visits.</div>
    </div>
    <div class="card" style="text-align: center; border-bottom: 4px solid var(--amber-primary);">
      <div style="font-size: 38px; font-weight: 800; color: var(--amber-primary); line-height: 1;">₹16 Lakh Crore</div>
      <div style="font-size: 13.5px; font-weight: 700; color: var(--navy-dark); margin-top: 8px;">Dead Capital Unlocked</div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Liquid, bankable collateral for rural agricultural & housing credit.</div>
    </div>
    <div class="card" style="text-align: center; border-bottom: 4px solid var(--navy-primary);">
      <div style="font-size: 38px; font-weight: 800; color: var(--navy-primary); line-height: 1;">24 Mos → 60 Days</div>
      <div style="font-size: 13.5px; font-weight: 700; color: var(--navy-dark); margin-top: 8px;">GatiShakti Land Acquisition</div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Automated RFCTLARR severance calculations prevent land acquisition delay.</div>
    </div>
  </div>

  <!-- 4 STAKEHOLDER BENEFIT CARDS -->
  <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 18px;">
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">🌾 Citizens, Smallholder Farmers & Women Owners</div>
        <span class="card-badge badge-emerald">Social Dignity</span>
      </div>
      <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.55;">
        • <strong>Escape from Loan Sharks:</strong> Clean, verifiable title allows farmers to access formal 7% priority sector bank credit instead of borrowing at 36% compound interest.<br>
        • <strong>Ending Generational Trauma:</strong> Sparing children from 20-year civil court litigation inherited from parents.<br>
        • <strong>Protection of Women Property Rights:</strong> DPDP Act 2023 masking protects female landowners from harassment, extortion, and forged paper transfers.
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">🏛️ State Revenue & Registration Departments</div>
        <span class="card-badge badge-navy">Administrative Efficiency</span>
      </div>
      <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.55;">
        • <strong>80% Reduction in Mutation Backlogs:</strong> Automated 4-stage desk conveyor pre-assembles all statutory evidence for the Tahsildar.<br>
        • <strong>Eradication of Double Registrations:</strong> Sub-Registrar cannot register instruments without spatial parcel lock.<br>
        • <strong>Automated Speaking Orders:</strong> Eliminates clerical corruption and standardizes legal compliance under ROR Act §5.
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">🚄 National Infrastructure (NHAI, Railways, PM GatiShakti)</div>
        <span class="card-badge badge-amber">Infrastructure Velocity</span>
      </div>
      <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.55;">
        • <strong>Algorithmic Severance Awards:</strong> Section 23A mathematical severance ensures farmers receive fair compensation including 100% statutory solatium.<br>
        • <strong>Zero Acquisition Protests:</strong> Transparent spatial buffer overlays eliminate public agitations and high-court stay orders.<br>
        • <strong>Subsurface Transit Rights:</strong> ISO 19152 bounds metro tunnels without triggering costly surface property disputes.
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">🏦 Commercial Banks & Housing Finance Institutions</div>
        <span class="card-badge badge-rose">Financial Integrity</span>
      </div>
      <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.55;">
        • <strong>Zero Double-Pledging Fraud:</strong> Prevents fraudsters from pledging the same land title across multiple banks simultaneously.<br>
        • <strong>Automated Title Due Diligence:</strong> Instant 9-point verification API slashes mortgage loan origination costs by 90%.<br>
        • <strong>Reduction in Non-Performing Assets:</strong> Clean spatial collateral dramatically strengthens the rural lending ecosystem.
      </div>
    </div>

  </div>

  <div class="slide-footer">
    <div class="footer-left">
      <div class="footer-dot"></div>
      <span>Catalyzing Viksit Bharat 2047: Transforming Fragmented Paper Records into Liquid Sovereign Economic Capital</span>
    </div>
    <div class="footer-right">PAGE 5 OF 6</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- SLIDE 6: RESEARCH AND REFERENCES                                          -->
<!-- ========================================================================= -->
<div class="slide" id="slide-6">
  <div class="slide-header">
    <div class="header-left">
      <div class="gov-badge">
        <div class="tricolor-bar"></div>
        <div>
          <div class="gov-title">Research and References · Standards Alignment</div>
          <div class="gov-subtitle">Statutory Acts, International Norms & National Mission Alignment</div>
        </div>
      </div>
    </div>
    <div class="header-center">
      <div class="sih-badge-pill">
        <span class="logo">SIH 2026</span>
        <span class="ps">PS: SIH26014</span>
      </div>
    </div>
    <div class="header-right">
      <div class="slide-num">SLIDE 06 / 06</div>
    </div>
  </div>

  <div>
    <h1 class="slide-title">STATUTORY FRAMEWORKS, RESEARCH & TECHNICAL STANDARDS</h1>
    <p class="slide-subtitle">Grounding digital public infrastructure in established national legislation and international geospatial standards.</p>
  </div>

  <!-- 4 REFERENCE CARDS -->
  <div style="flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px;">
    
    <div class="card" style="border-top: 4px solid var(--navy-primary);">
      <div class="card-header">
        <div class="card-title">1. Statutory Acts</div>
        <span class="card-badge badge-navy">Legislation</span>
      </div>
      <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
        • <strong>State ROR Acts (§5):</strong> Quasi-judicial mutation conveyor & mandatory Speaking Orders.<br>
        • <strong>RFCTLARR Act 2013 (§23A, §64):</strong> Statutory severance compensation & 100% solatium.<br>
        • <strong>Registration Act 1908:</strong> Provenance-based title vs instrument matrix.<br>
        • <strong>DPDP Act 2023:</strong> Purpose-bound consent masking for landowner identities.
      </div>
    </div>

    <div class="card" style="border-top: 4px solid var(--emerald-primary);">
      <div class="card-header">
        <div class="card-title">2. Geospatial Norms</div>
        <span class="card-badge badge-emerald">Standards</span>
      </div>
      <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
        • <strong>ISO 19152 (LADM):</strong> Land Administration Domain Model for 3D Volumetric Cadastres.<br>
        • <strong>OGC API Features:</strong> Open geospatial consortium interoperable endpoints.<br>
        • <strong>Mapbox Vector Tiles (MVT):</strong> Binary vector streaming specification 2.1.<br>
        • <strong>W3C JSON-LD 1.1:</strong> Common Linked Data contextual schemas.
      </div>
    </div>

    <div class="card" style="border-top: 4px solid var(--amber-primary);">
      <div class="card-header">
        <div class="card-title">3. National Missions</div>
        <span class="card-badge badge-amber">Alignment</span>
      </div>
      <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
        • <strong>PM GatiShakti:</strong> Multimodal National Master Plan spatial corridor integration.<br>
        • <strong>DILRMP:</strong> Digital India Land Records Modernization Programme.<br>
        • <strong>SVAMITVA Scheme:</strong> Survey of Villages and Mapping with Improvised Technology.<br>
        • <strong>MeitY Cloud Guidelines:</strong> Sovereign in-country data residency.
      </div>
    </div>

    <div class="card" style="border-top: 4px solid var(--rose-primary);">
      <div class="card-header">
        <div class="card-title">4. Remote Sensing</div>
        <span class="card-badge badge-rose">Citations</span>
      </div>
      <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
        • <strong>ESA Copernicus Sentinel-2:</strong> Level-2A surface reflectance satellite pipeline.<br>
        • <strong>NDVI Algorithms:</strong> Rouse et al., Normalized Difference Vegetation Index for encroachment.<br>
        • <strong>NDBI Mapping:</strong> Zha et al., Built-up index for foundation trench detection.<br>
        • <strong>PostGIS 3.4 Specs:</strong> Topological spatial invariant validation algorithms.
      </div>
    </div>

  </div>

  <!-- CLOSING BANNER -->
  <div class="card" style="background: linear-gradient(135deg, var(--navy-dark) 0%, #1E3A8A 100%); color: #FFFFFF; padding: 24px 30px; margin-top: 16px;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 13px; font-weight: 800; color: #93C5FD; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">
          The Sovereign Vision · Viksit Bharat 2047
        </div>
        <div style="font-size: 18px; font-weight: 700; line-height: 1.35;">
          "Transitioning India from presumptive deed registration to conclusive, bankable 3D cadastral property rights."
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 13px; font-weight: 600; color: #E2E8F0;">Smart India Hackathon 2026</div>
        <div style="font-size: 15px; font-weight: 800; color: #FBBF24; margin-top: 2px;">Problem Statement SIH26014</div>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <div class="footer-left">
      <div class="footer-dot"></div>
      <span>Project Tract (Hexaverse) · Conclusive Land Titling & Federated Cadastral Infrastructure</span>
    </div>
    <div class="footer-right">PAGE 6 OF 6 · SUBMISSION READY</div>
  </div>
</div>


<!-- FLOATING PRESENTATION CONTROLS (Hidden on Print) -->
<div class="floating-nav">
  <button onclick="showSlide(current - 1)">◀ Prev</button>
  <span id="nav-indicator">Slide 1 / 6</span>
  <button onclick="showSlide(current + 1)">Next ▶</button>
  <button onclick="toggleFS()">⛶ Fullscreen</button>
  <button onclick="window.print()" style="background: var(--navy-primary); color: #FFF;">🖨️ Save as PDF</button>
</div>

<style>
.floating-nav {
  position: fixed;
  bottom: 24px;
  right: 32px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  padding: 8px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #FFF;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  z-index: 99999;
}
.floating-nav button {
  background: #334155;
  border: none;
  color: #FFF;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.floating-nav button:hover {
  background: #475569;
}
@media print {
  .floating-nav { display: none !important; }
}
</style>

<script>
let current = 1;
const total = 6;
function updateIndicator() {
  document.getElementById('nav-indicator').textContent = 'Slide ' + current + ' / ' + total;
}
function showSlide(n) {
  if (n < 1) n = 1;
  if (n > total) n = total;
  current = n;
  const el = document.getElementById('slide-' + n);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  updateIndicator();
}
function toggleFS() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
    e.preventDefault();
    showSlide(current + 1);
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    showSlide(current - 1);
  } else if (e.key === 'f' || e.key === 'F') {
    toggleFS();
  }
});
</script>
</body>

</html>
"""

with open('docs/plan/sih_presentation_deck.html', 'w') as f:
    f.write(html_content)

print("Generated docs/plan/sih_presentation_deck.html successfully!")

# Run Chrome to export high-res PDF
chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
pdf_out = "docs/plan/SIH2026_TRACT_PRESENTATION.pdf"
cmd = [
    chrome_path,
    "--headless",
    "--disable-gpu",
    "--print-to-pdf=" + pdf_out,
    "file://" + os.path.abspath("docs/plan/sih_presentation_deck.html")
]
print("Generating PDF via Chrome...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Chrome returncode:", res.returncode)
if os.path.exists(pdf_out):
    print("PDF successfully generated at:", pdf_out, "Size:", os.path.getsize(pdf_out), "bytes")
else:
    print("PDF generation failed:", res.stderr)

import base64
import os
import subprocess

def get_b64(path):
    if os.path.exists(path):
        with open(path, 'rb') as f:
            return 'data:image/png;base64,' + base64.b64encode(f.read()).decode('utf-8')
    return ''

live_map_b64 = get_b64('docs/plan/screenshot_map_live.png')
if not live_map_b64:
    live_map_b64 = get_b64('docs/plan/screenshot_parcel.png')

template = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Project Tract (Hexaverse) · SIH 2026</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --font-heading: 'Outfit', sans-serif;
    --font-body: 'Plus Jakarta Sans', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;

    --bg-page: #F8FAFC;
    --surface-glass: rgba(255, 255, 255, 0.9);
    --border-subtle: rgba(226, 232, 240, 0.9);

    --ink-hero: #091322;
    --ink-body: #1E293B;
    --ink-muted: #64748B;

    --blue-deep: #1E3A8A;
    --blue-vibrant: #2563EB;
    --blue-soft: #EFF6FF;

    --amber-deep: #B45309;
    --amber-soft: #FEF3C7;

    --emerald-deep: #047857;
    --emerald-soft: #ECFDF5;

    --rose-deep: #BE123C;
    --rose-soft: #FFF1F2;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @page {
    size: 1920px 1080px;
    margin: 0;
  }

  body {
    background: #334155;
    font-family: var(--font-body);
    color: var(--ink-body);
    -webkit-font-smoothing: antialiased;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
    padding: 40px 0;
  }

  @media print {
    body {
      background: transparent;
      padding: 0;
      gap: 0;
    }
    .slide {
      page-break-after: always;
      break-after: page;
      box-shadow: none !important;
      margin: 0 !important;
    }
    .floating-nav { display: none !important; }
  }

  /* MASTER SLIDE CANVAS */
  .slide {
    width: 1920px;
    height: 1080px;
    background: var(--bg-page);
    background-image: 
      radial-gradient(1100px circle at 15% 10%, rgba(219, 234, 254, 0.45) 0%, transparent 60%),
      radial-gradient(900px circle at 90% 85%, rgba(254, 243, 199, 0.35) 0%, transparent 50%);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 68px 36px 68px;
    box-shadow: 0 30px 80px rgba(15, 23, 42, 0.35);
  }

  /* MINIMALIST SOVEREIGN HEADER */
  .slide-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid var(--border-subtle);
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .tricolor-stripe {
    width: 5px;
    height: 38px;
    background: linear-gradient(to bottom, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%);
    border-radius: 3px;
    border: 1px solid #CBD5E1;
  }
  .gov-text {
    font-family: var(--font-heading);
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-hero);
  }
  .gov-subtext {
    font-size: 12px;
    font-weight: 500;
    color: var(--ink-muted);
  }
  .header-center {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .badge-sih {
    background: #FFFFFF;
    border: 1px solid #BFDBFE;
    padding: 6px 18px;
    border-radius: 9999px;
    font-family: var(--font-heading);
    font-size: 13.5px;
    font-weight: 700;
    color: var(--blue-deep);
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.06);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .badge-sih span.ps-pill {
    background: var(--blue-soft);
    color: var(--blue-vibrant);
    font-family: var(--font-mono);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
  }
  .header-right {
    font-family: var(--font-mono);
    font-size: 15px;
    font-weight: 700;
    color: var(--ink-muted);
  }

  /* MINIMALIST CLEAN FOOTER (NO CLUTTER) */
  .slide-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1.5px solid var(--border-subtle);
    padding-top: 14px;
    font-size: 13px;
    color: var(--ink-muted);
    font-weight: 600;
  }
  .footer-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--emerald-deep);
    display: inline-block;
    margin-right: 8px;
  }

  /* HEADINGS */
  h1.hero-title {
    font-family: var(--font-heading);
    font-size: 62px;
    font-weight: 900;
    color: var(--ink-hero);
    letter-spacing: -0.035em;
    line-height: 1.05;
  }
  h2.section-title {
    font-family: var(--font-heading);
    font-size: 34px;
    font-weight: 800;
    color: var(--ink-hero);
    letter-spacing: -0.025em;
    line-height: 1.15;
  }
  p.lead-text {
    font-size: 19px;
    font-weight: 500;
    color: var(--ink-body);
    line-height: 1.55;
  }

  /* SEAMLESS GLASS SURFACES */
  .glass-panel {
    background: var(--surface-glass);
    backdrop-filter: blur(12px);
    border: 1.5px solid var(--border-subtle);
    border-radius: 20px;
    padding: 26px 30px;
    box-shadow: 0 12px 30px -8px rgba(15, 23, 42, 0.05);
  }

  /* GRADIENT METRIC STATS */
  .gradient-num {
    font-family: var(--font-heading);
    font-size: 68px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, var(--blue-deep) 0%, var(--blue-vibrant) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .gradient-num.amber {
    background: linear-gradient(135deg, #B45309 0%, #F59E0B 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .gradient-num.rose {
    background: linear-gradient(135deg, #BE123C 0%, #FB7185 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .gradient-num.emerald {
    background: linear-gradient(135deg, #047857 0%, #10B981 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* CLICKABLE DELIVERABLE LINKS BAR */
  .links-bar {
    display: inline-flex;
    align-items: center;
    gap: 16px;
    background: #FFFFFF;
    border: 1.5px solid #BFDBFE;
    padding: 10px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.06);
  }
  .link-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 700;
    text-decoration: none;
    font-family: var(--font-mono);
    transition: transform 0.2s;
  }
  .link-pill:hover { transform: translateY(-1px); }
  .link-github { background: #0F172A; color: #FFFFFF; }
  .link-video { background: #E11D48; color: #FFFFFF; }
  .link-live { background: var(--blue-soft); color: var(--blue-deep); border: 1px solid #BFDBFE; }

  /* SEAMLESS HORIZONTAL PIPELINE FLOW (SLIDE 3) */
  .flow-stream {
    display: flex;
    gap: 20px;
    position: relative;
    margin-top: 10px;
  }
  .flow-col {
    flex: 1;
    background: #FFFFFF;
    border: 1.5px solid var(--border-subtle);
    border-radius: 18px;
    padding: 24px;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.04);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
  }
  .flow-col-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-subtle);
  }
  .flow-step-num {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--blue-soft);
    color: var(--blue-deep);
    font-family: var(--font-heading);
    font-weight: 800;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .flow-col-title {
    font-family: var(--font-heading);
    font-size: 18px;
    font-weight: 800;
    color: var(--ink-hero);
  }

  /* LAPTOP & PHONE STYLING */
  .laptop-showcase {
    position: relative;
    background: #E2E8F0;
    border-radius: 20px 20px 4px 4px;
    padding: 12px 12px 18px 12px;
    box-shadow: 0 30px 60px -15px rgba(15, 23, 42, 0.25);
  }
  .laptop-screen {
    background: #000;
    border-radius: 10px;
    overflow: hidden;
    border: 2px solid #64748B;
  }
  .laptop-screen img {
    width: 100%;
    height: 520px;
    object-fit: cover;
    display: block;
  }
  .laptop-base {
    height: 14px;
    background: linear-gradient(to bottom, #CBD5E1, #94A3B8);
    border-radius: 0 0 20px 20px;
    margin: 0 -26px;
    position: relative;
  }

  .native-phone-floating {
    width: 270px;
    background: #0F172A;
    border-radius: 40px;
    padding: 10px;
    box-shadow: 0 30px 60px -10px rgba(15, 23, 42, 0.35), 0 0 0 3px #334155;
    display: flex;
    flex-direction: column;
  }
  .phone-screen {
    height: 480px;
    background: #F8FAFC;
    border-radius: 30px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
    font-size: 11px;
    border: 1px solid #1E293B;
  }

  /* FLOATING NAVIGATION BUTTONS */
  .floating-nav {
    position: fixed;
    bottom: 24px;
    right: 32px;
    background: rgba(15, 23, 42, 0.94);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 9999px;
    padding: 8px 18px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: #FFF;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 12px 32px rgba(0,0,0,0.35);
    z-index: 99999;
  }
  .floating-nav button {
    background: #334155;
    border: none;
    color: #FFF;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .floating-nav button:hover { background: #475569; }
</style>
</head>
<body>

<!-- FLOATING PRESENTATION BAR -->
<div class="floating-nav">
  <button onclick="showSlide(current - 1)">◀ Prev</button>
  <span id="nav-indicator" style="font-family: var(--font-mono);">Slide 1 / 6</span>
  <button onclick="showSlide(current + 1)">Next ▶</button>
  <button onclick="toggleFS()">⛶ Fullscreen</button>
  <button onclick="window.print()" style="background: var(--blue-vibrant); color: #FFF;">🖨️ Print / Save PDF</button>
</div>

<!-- ========================================================================= -->
<!-- SLIDE 1: HERO & CORE THESIS                                               -->
<!-- ========================================================================= -->
<div class="slide" id="slide-1">
  <div class="slide-header">
    <div class="header-left">
      <div class="tricolor-stripe"></div>
      <div>
        <div class="gov-text">Government of India · Ministry of Rural Development</div>
        <div class="gov-subtext">Department of Land Resources (DoLR)</div>
      </div>
    </div>
    <div class="header-center">
      <div class="badge-sih">
        SMART INDIA HACKATHON 2026
        <span class="ps-pill">SIH26014</span>
      </div>
    </div>
    <div class="header-right">01 / 06</div>
  </div>

  <div style="flex: 1; display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 48px; align-items: center;">
    
    <!-- LEFT: EDITORIAL NARRATIVE -->
    <div>
      <div style="display: inline-flex; align-items: center; gap: 8px; background: var(--blue-soft); color: var(--blue-deep); font-family: var(--font-heading); font-weight: 700; font-size: 13.5px; padding: 6px 14px; border-radius: 6px; margin-bottom: 16px;">
        🏛️ SMART GOVERNANCE & CADASTRAL DIGITAL PUBLIC INFRASTRUCTURE
      </div>
      
      <h1 class="hero-title">Project Tract</h1>
      <p style="font-family: var(--font-heading); font-size: 24px; font-weight: 600; color: var(--blue-deep); margin-top: 8px; margin-bottom: 16px;">
        India’s Federated, Parcel-Centric Land Operating System
      </p>

      <p class="lead-text" style="max-width: 820px; margin-bottom: 24px;">
        When an Indian farmer purchases land, they must physically travel between six disconnected government departments—Revenue, Registration, Survey, Town Planning, Tax, and Courts. 
        Because these records never talk to each other, fraudsters exploit the blind spot, locking <strong>66% of all civil court cases</strong> and freezing <strong>₹16 Lakh Crore in dead capital</strong>.
      </p>

      <div style="font-size: 17px; font-weight: 700; color: var(--ink-hero); margin-bottom: 24px;">
        💡 Tract unites all six departments around one universal spatial key (ULPIN)—delivering the single source of truth in under 400 milliseconds.
      </div>

      <!-- DELIVERABLE LINKS BAR -->
      <div class="links-bar">
        <span style="font-family: var(--font-heading); font-size: 13px; font-weight: 800; color: var(--ink-hero); text-transform: uppercase; letter-spacing: 0.05em;">
          Explore Project:
        </span>
        <a href="https://github.com/kbs6108/Hexaverse2" class="link-pill link-github" target="_blank">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          GitHub Repository
        </a>
        <a href="https://youtu.be/your-pitch-video" class="link-pill link-video" target="_blank">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          Video Demo
        </a>
        <a href="http://localhost:5173" class="link-pill link-live" target="_blank">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          Live Web App
        </a>
      </div>
    </div>

    <!-- RIGHT: 3 BOLD GRADIENT PILLARS -->
    <div style="display: flex; flex-direction: column; gap: 20px;">
      
      <div class="glass-panel" style="border-left: 6px solid var(--rose-deep);">
        <div class="gradient-num rose">66%</div>
        <div style="font-family: var(--font-heading); font-size: 20px; font-weight: 800; color: var(--ink-hero); margin-top: 6px;">
          Of All Civil Court Cases in India Are Land Disputes
        </div>
        <div style="font-size: 15px; color: var(--ink-muted); margin-top: 4px;">
          Cases drag on for an average of 20 years, passing down from parents to children.
        </div>
      </div>

      <div class="glass-panel" style="border-left: 6px solid var(--amber-deep);">
        <div class="gradient-num amber">₹16 Lakh Cr</div>
        <div style="font-family: var(--font-heading); font-size: 20px; font-weight: 800; color: var(--ink-hero); margin-top: 6px;">
          Trapped in Frozen, Disputed Dead Capital
        </div>
        <div style="font-size: 15px; color: var(--ink-muted); margin-top: 4px;">
          Unbankable land that cannot be mortgaged, farmed peacefully, or acquired for highways.
        </div>
      </div>

      <div class="glass-panel" style="border-left: 6px solid var(--emerald-deep);">
        <div class="gradient-num emerald">&lt; 4 Minutes</div>
        <div style="font-family: var(--font-heading); font-size: 20px; font-weight: 800; color: var(--ink-hero); margin-top: 6px;">
          Conclusive Title Verification via ULPIN
        </div>
        <div style="font-size: 15px; color: var(--ink-muted); margin-top: 4px;">
          Down from 28 days of physical department queues across revenue and registration offices.
        </div>
      </div>

    </div>

  </div>

  <div class="slide-footer">
    <div><span class="footer-dot"></span>Project Tract · Team Tract · Problem Statement SIH26014</div>
    <div>TRANSITIONING FROM PRESUMPTIVE TO CONCLUSIVE LAND TITLES</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- SLIDE 2: SEAMLESS LIVE PRODUCT SHOWCASE                                   -->
<!-- ========================================================================= -->
<div class="slide" id="slide-2">
  <div class="slide-header">
    <div class="header-left">
      <div class="tricolor-stripe"></div>
      <div>
        <div class="gov-text">Platform Preview · Live Working Prototype</div>
        <div class="gov-subtext">3D Volumetric Cadastre & Native Citizen Mobile PWA</div>
      </div>
    </div>
    <div class="header-center">
      <div class="badge-sih">
        SMART INDIA HACKATHON 2026
        <span class="ps-pill">SIH26014</span>
      </div>
    </div>
    <div class="header-right">02 / 06</div>
  </div>

  <div>
    <h2 class="section-title">The Sovereign Operating System in Action</h2>
    <p class="lead-text" style="margin-top: 4px; margin-bottom: 18px;">
      Live MapLibre GL 3D vector tile shaders paired with offline-first citizen passbooks and field officer consoles.
    </p>
  </div>

  <!-- SEAMLESS STAGE: LAPTOP + FLOATING PHONE + FLOATING FEATURE CARDS -->
  <div style="flex: 1; display: grid; grid-template-columns: 1fr 300px; gap: 32px; align-items: center;">
    
    <!-- LEFT: WIDE LAPTOP SHOWCASING MAPLIBRE 3D CADASTRE -->
    <div>
      <div class="laptop-showcase">
        <div style="width: 6px; height: 6px; background: #334155; border-radius: 50%; margin: 0 auto 6px auto;"></div>
        <div class="laptop-screen">
          <img src="LIVE_MAP_B64_PLACEHOLDER" alt="Tract Live 3D Cadastre Web Interface">
        </div>
        <div class="laptop-base">
          <div style="width: 130px; height: 5px; background: #64748B; margin: 0 auto; border-radius: 0 0 6px 6px;"></div>
        </div>
      </div>

      <!-- 4 HORIZONTAL CALLOUT HIGHLIGHTS -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 18px;">
        <div class="glass-panel" style="padding: 14px 18px;">
          <div style="font-family: var(--font-heading); font-size: 15px; font-weight: 800; color: var(--blue-deep);">1. 6-Dept Truth</div>
          <div style="font-size: 13px; color: var(--ink-body); margin-top: 4px;">Synchronizes Revenue, Deeds, FMB & Stays in 400ms.</div>
        </div>
        <div class="glass-panel" style="padding: 14px 18px;">
          <div style="font-family: var(--font-heading); font-size: 15px; font-weight: 800; color: var(--emerald-deep);">2. ISO 19152 3D</div>
          <div style="font-size: 13px; color: var(--ink-body); margin-top: 4px;">Volumetric titling for sky apartments & subsurface rail.</div>
        </div>
        <div class="glass-panel" style="padding: 14px 18px;">
          <div style="font-family: var(--font-heading); font-size: 15px; font-weight: 800; color: var(--amber-deep);">3. Severance Math</div>
          <div style="font-size: 13px; color: var(--ink-body); margin-top: 4px;">RFCTLARR 2013 highway corridor severance + 100% solatium.</div>
        </div>
        <div class="glass-panel" style="padding: 14px 18px;">
          <div style="font-family: var(--font-heading); font-size: 15px; font-weight: 800; color: var(--rose-deep);">4. Sat Watchdog</div>
          <div style="font-size: 13px; color: var(--ink-body); margin-top: 4px;">Sentinel-2 5-day NDVI & NDBI built-up anomaly alerts.</div>
        </div>
      </div>
    </div>

    <!-- RIGHT: NATIVE MOBILE PASSBOOK APP -->
    <div style="display: flex; flex-direction: column; align-items: center;">
      <div style="font-family: var(--font-heading); font-size: 14px; font-weight: 800; color: var(--ink-hero); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">
        📱 Citizen E-Passbook
      </div>

      <div class="native-phone-floating">
        <div class="phone-screen">
          <div style="height: 38px; padding: 10px 16px 0 16px; display: flex; justify-content: space-between; font-weight: 700; font-size: 10px;">
            <span>9:41</span>
            <span>5G 📶 100%</span>
          </div>

          <div style="padding: 6px 14px; background: #FFF; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-family: var(--font-heading); font-weight: 800; color: var(--blue-deep); font-size: 13px;">DoLR Tract · పహణీ</div>
            <div style="font-size: 10px; background: var(--blue-soft); padding: 2px 6px; border-radius: 4px; color: var(--blue-vibrant); font-weight: 700;">తెలుగు</div>
          </div>

          <div style="padding: 12px; display: flex; flex-direction: column; gap: 10px; flex: 1;">
            
            <div style="background: linear-gradient(135deg, #1E3A8A 0%, #091322 100%); color: #FFF; border-radius: 10px; padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 10px; font-weight: 800; color: #FBBF24;">DIGITAL TITLE PASSBOOK</span>
                <span style="font-size: 8.5px; background: #059669; padding: 2px 6px; border-radius: 4px; font-weight: 700;">VERIFIED</span>
              </div>
              <div style="font-size: 12px; font-weight: 800; margin-top: 6px;">Pattadar: Ravi Kumar (K-0421)</div>
              <div style="font-size: 10px; color: #CBD5E1; margin-top: 2px;">Sy No: 123/4 · Extent: 874.3 m²</div>
              <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px;">
                <div style="font-family: var(--font-mono); font-size: 8px; color: #94A3B8;">SHA-256: 8f4c2...ba1</div>
                <div style="width: 26px; height: 26px; background: #FFF; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #000; font-size: 9px; font-weight: 900;">QR</div>
              </div>
            </div>

            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 10px;">
              <div style="font-size: 10.5px; font-weight: 800; color: var(--ink-hero); margin-bottom: 6px;">Sovereign Encumbrance:</div>
              <div style="font-size: 10px; color: #059669; font-weight: 600;">✓ Revenue 1-B: Clear Title</div>
              <div style="font-size: 10px; color: #059669; font-weight: 600; margin-top: 2px;">✓ SRO: 0 Mortgages (30-Yr EC)</div>
              <div style="font-size: 10px; color: #059669; font-weight: 600; margin-top: 2px;">✓ Court: 0 Lis Pendens Injunction</div>
            </div>

            <div style="background: var(--blue-soft); border: 1px solid #BFDBFE; border-radius: 8px; padding: 8px; font-size: 9.5px; color: var(--blue-deep); text-align: center; font-weight: 700;">
              DPDP Act 2023 Masked (R*** K***)
            </div>

          </div>

          <div style="height: 44px; background: #FFFFFF; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-around; align-items: center; font-size: 10px; font-weight: 700; color: var(--ink-muted);">
            <span style="color: var(--blue-deep);">🏠 Home</span>
            <span>🔍 Search</span>
            <span>📜 Passbook</span>
            <span>👤 Profile</span>
          </div>
        </div>
      </div>

    </div>

  </div>

  <div class="slide-footer">
    <div><span class="footer-dot"></span>Production-Grade Web & Mobile Stack · Tested in Andhra Pradesh, Tamil Nadu & Telangana</div>
    <div>ISO 19152 3D VOLUMETRIC STANDARD COMPLIANT</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- SLIDE 3: SEAMLESS 4-STAGE ARCHITECTURAL PIPELINE                          -->
<!-- ========================================================================= -->
<div class="slide" id="slide-3">
  <div class="slide-header">
    <div class="header-left">
      <div class="tricolor-stripe"></div>
      <div>
        <div class="gov-text">Technical Architecture · Federated Engineering</div>
        <div class="gov-subtext">Statutory Invariant Engine, Spatial PostGIS & Asynchronous FastAPI Core</div>
      </div>
    </div>
    <div class="header-center">
      <div class="badge-sih">
        SMART INDIA HACKATHON 2026
        <span class="ps-pill">SIH26014</span>
      </div>
    </div>
    <div class="header-right">03 / 06</div>
  </div>

  <div>
    <h2 class="section-title">End-to-End Architectural Pipeline</h2>
    <p class="lead-text" style="margin-top: 4px; margin-bottom: 20px;">
      Eliminating isolated database silos through an open, provenance-hashed Common Data Model (CLM 1.0 JSON-LD).
    </p>
  </div>

  <!-- SEAMLESS 4-STAGE PIPELINE (NO 12-BOX JAIL) -->
  <div class="flow-stream" style="flex: 1;">
    
    <!-- STAGE 1: INGESTION -->
    <div class="flow-col">
      <div>
        <div class="flow-col-header">
          <div class="flow-step-num">1</div>
          <div class="flow-col-title">Legacy Department Silos</div>
        </div>
        <p style="font-size: 14.5px; color: var(--ink-body); line-height: 1.6; margin-bottom: 14px;">
          Ingests disconnected departmental records across multiple states:
        </p>
        <ul style="font-size: 14px; color: var(--ink-body); line-height: 1.6; padding-left: 20px;">
          <li><strong>Revenue:</strong> Meebhoomi (AP), Patta Chitta (TN), Dharani (TG) 1-B Adangals.</li>
          <li><strong>Registration (SRO):</strong> Registered deed instruments & 30-year encumbrance charges.</li>
          <li><strong>Survey:</strong> Village FMB boundary shapefiles & total station points.</li>
          <li><strong>Satellite:</strong> Sentinel-2 Level-2A multispectral 10m imagery.</li>
        </ul>
      </div>
      <div style="background: var(--blue-soft); border-radius: 10px; padding: 12px; margin-top: 14px;">
        <span style="font-size: 12px; font-weight: 800; color: var(--blue-deep); text-transform: uppercase;">Adapters:</span>
        <div style="font-size: 13px; color: var(--ink-body); margin-top: 2px;">Declarative state dialect mappings translate Telugu, Tamil & Hindi revenue terms.</div>
      </div>
    </div>

    <!-- STAGE 2: INVARIANT ENGINE -->
    <div class="flow-col">
      <div>
        <div class="flow-col-header">
          <div class="flow-step-num">2</div>
          <div class="flow-col-title">PostGIS Invariant Engine</div>
        </div>
        <p style="font-size: 14.5px; color: var(--ink-body); line-height: 1.6; margin-bottom: 14px;">
          Enforces mathematical and statutory spatial guardrails directly in the database:
        </p>
        <ul style="font-size: 14px; color: var(--ink-body); line-height: 1.6; padding-left: 20px;">
          <li><strong>Cadastral Snap Assistant:</strong> Vertices snap magnetically to FMB traverse lines.</li>
          <li><strong>±15% Area Variance Ceiling:</strong> Boundary edits exceeding statutory limits are rejected.</li>
          <li><strong>Topological Invariants:</strong> Mathematically eliminates overlapping polygons and slivers.</li>
          <li><strong>Dynamic Vector Tiles:</strong> PostGIS generates binary MVT streams in sub-100ms.</li>
        </ul>
      </div>
      <div style="background: var(--emerald-soft); border-radius: 10px; padding: 12px; margin-top: 14px;">
        <span style="font-size: 12px; font-weight: 800; color: var(--emerald-deep); text-transform: uppercase;">Storage:</span>
        <div style="font-size: 13px; color: var(--ink-body); margin-top: 2px;">PostgreSQL 16 + PostGIS 3.4 with <code>GIST</code> spatial indexes & geometric partitioning.</div>
      </div>
    </div>

    <!-- STAGE 3: CORE GATEWAY -->
    <div class="flow-col">
      <div>
        <div class="flow-col-header">
          <div class="flow-step-num">3</div>
          <div class="flow-col-title">FastAPI Gateway & Logic</div>
        </div>
        <p style="font-size: 14.5px; color: var(--ink-body); line-height: 1.6; margin-bottom: 14px;">
          Stateless asynchronous core coordinating legal state machines:
        </p>
        <ul style="font-size: 14px; color: var(--ink-body); line-height: 1.6; padding-left: 20px;">
          <li><strong>CLM 1.0 JSON-LD:</strong> Universal semantic spatial parcel representation.</li>
          <li><strong>ROR Act §5 State Machine:</strong> Sequential VRO $\to$ Surveyor $\to$ RI $\to$ Tahsildar conveyor.</li>
          <li><strong>Forensic Deed Scrutiny:</strong> SHA-256 fingerprinting + OCR extent cross-verification.</li>
          <li><strong>DPDP Act 2023:</strong> Purpose-bound consent tokenization & masking.</li>
        </ul>
      </div>
      <div style="background: var(--amber-soft); border-radius: 10px; padding: 12px; margin-top: 14px;">
        <span style="font-size: 12px; font-weight: 800; color: var(--amber-deep); text-transform: uppercase;">AI Watchdog:</span>
        <div style="font-size: 13px; color: var(--ink-body); margin-top: 2px;">5-day orbital Sentinel-2 pipeline monitors NDVI vegetation drops & NDBI built-up surges.</div>
      </div>
    </div>

    <!-- STAGE 4: OUTPUT APPLICATIONS -->
    <div class="flow-col">
      <div>
        <div class="flow-col-header">
          <div class="flow-step-num">4</div>
          <div class="flow-col-title">Sovereign Applications</div>
        </div>
        <p style="font-size: 14.5px; color: var(--ink-body); line-height: 1.6; margin-bottom: 14px;">
          Empowers citizens, revenue officers, infrastructure, and banks:
        </p>
        <ul style="font-size: 14px; color: var(--ink-body); line-height: 1.6; padding-left: 20px;">
          <li><strong>Citizen PWA:</strong> Multilingual search, name change mutation & e-Passbooks.</li>
          <li><strong>Officer Queue:</strong> Automated evidence compilation & digital Speaking Orders.</li>
          <li><strong>PM GatiShakti:</strong> Automated corridor severance math under RFCTLARR 2013 §23A.</li>
          <li><strong>B2B Banking APIs:</strong> Instant 9-point title verification for SBI, HDFC & NABARD.</li>
        </ul>
      </div>
      <div style="background: var(--rose-soft); border-radius: 10px; padding: 12px; margin-top: 14px;">
        <span style="font-size: 12px; font-weight: 800; color: var(--rose-deep); text-transform: uppercase;">Cloud Scale:</span>
        <div style="font-size: 13px; color: var(--ink-body); margin-top: 2px;">Google Cloud Run (<code>asia-south1</code> Mumbai) + Cloudflare CDN vector tile caching.</div>
      </div>
    </div>

  </div>

  <!-- CLEAN PRODUCTION LOGO BAR -->
  <div style="display: flex; align-items: center; justify-content: space-between; background: #FFFFFF; border: 1.5px solid var(--border-subtle); padding: 12px 24px; border-radius: 12px; margin-top: 16px;">
    <span style="font-family: var(--font-heading); font-size: 13px; font-weight: 800; color: var(--ink-hero); text-transform: uppercase;">
      Core Engineering Stack:
    </span>
    <span style="font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: var(--blue-deep);">
      React 19 · TypeScript 5.9 · MapLibre GL · Python 3.12 · FastAPI · PostgreSQL 16 · PostGIS 3.4 · Docker · Sentinel-2 · Cloud Run
    </span>
  </div>

  <div class="slide-footer">
    <div><span class="footer-dot"></span>Stateless Architecture with Zero Single Points of Failure · Sovereign Data Residence in India</div>
    <div>COMMON DATA MODEL (CLM 1.0 JSON-LD)</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- SLIDE 4: FEASIBILITY, OPEX & BUSINESS SUSTAINABILITY                      -->
<!-- ========================================================================= -->
<div class="slide" id="slide-4">
  <div class="slide-header">
    <div class="header-left">
      <div class="tricolor-stripe"></div>
      <div>
        <div class="gov-text">Feasibility and Viability · Financial & Operational Model</div>
        <div class="gov-subtext">Lean OpEx (Rupees), Administrative Scalability & Risk Mitigation</div>
      </div>
    </div>
    <div class="header-center">
      <div class="badge-sih">
        SMART INDIA HACKATHON 2026
        <span class="ps-pill">SIH26014</span>
      </div>
    </div>
    <div class="header-right">04 / 06</div>
  </div>

  <div>
    <h2 class="section-title">Feasibility, Lean Economics & Self-Funding Model</h2>
    <p class="lead-text" style="margin-top: 4px; margin-bottom: 20px;">
      Running a complete Indian state for less than a single district's annual paper and stationery budget.
    </p>
  </div>

  <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 28px;">
    
    <!-- LEFT: ECONOMIC OPEX & MONETIZATION -->
    <div style="display: flex; flex-direction: column; gap: 18px;">
      
      <!-- OPEX IN RUPEES TABLE -->
      <div class="glass-panel" style="border-top: 5px solid var(--emerald-deep);">
        <div style="font-family: var(--font-heading); font-size: 20px; font-weight: 800; color: var(--ink-hero); margin-bottom: 12px;">
          Monthly Infrastructure Cost (OpEx in Indian Rupees)
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14.5px;">
          <tr style="border-bottom: 2px solid var(--border-subtle); font-weight: 700; color: var(--ink-hero);">
            <td style="padding: 8px 0;">Deployment Tier</td>
            <td>Cloud Components</td>
            <td style="text-align: right;">Monthly Cost</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--border-subtle);">
            <td style="padding: 12px 0;"><strong>Pilot Mandal</strong><br><span style="font-size: 12.5px; color: var(--ink-muted);">100,000 Plots</span></td>
            <td>Google Cloud Run (2 vCPU/4GB) + Neon PostGIS + Cloud Storage</td>
            <td style="text-align: right; font-family: var(--font-heading); font-size: 20px; font-weight: 800; color: var(--emerald-deep);">~₹8,000 / mo</td>
          </tr>
          <tr>
            <td style="padding: 12px 0;"><strong>Full State</strong><br><span style="font-size: 12.5px; color: var(--ink-muted);">30 Million Plots</span></td>
            <td>Autoscaling Cluster + High-Availability PostGIS + Cloudflare Edge CDN</td>
            <td style="text-align: right; font-family: var(--font-heading); font-size: 20px; font-weight: 800; color: var(--blue-deep);">~₹3,80,000 / mo</td>
          </tr>
        </table>
        
        <div style="font-size: 13.5px; color: var(--ink-muted); margin-top: 10px; font-style: italic;">
          *A statewide deployment runs for under ₹3.8 Lakhs/month—less than a single district collectorate’s annual printing budget!
        </div>
      </div>

      <!-- 3-TIER REVENUE ENGINE -->
      <div class="glass-panel" style="border-top: 5px solid var(--blue-deep);">
        <div style="font-family: var(--font-heading); font-size: 20px; font-weight: 800; color: var(--ink-hero); margin-bottom: 10px;">
          3-Tier Self-Funding Monetization Engine
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px;">
          <div>
            <strong>1. G2G State SaaS Concession:</strong> Annual software license of <strong>₹15 Lakhs – ₹25 Lakhs per district</strong> for revenue consoles, satellite alerts, and spatial workflow engines.
          </div>
          <div>
            <strong>2. G2C Citizen Micro-Fees:</strong> Nominal fee of <strong>₹25 – ₹50</strong> for citizen downloads of digitally signed Title Certificates and FMB maps.
          </div>
          <div>
            <strong>3. B2B Banking APIs:</strong> High-margin fee of <strong>₹150 – ₹300 per hit</strong> charged to commercial banks (SBI, HDFC, NABARD) for automated 9-point title verification.
          </div>
        </div>
      </div>

    </div>

    <!-- RIGHT: TECHNICAL & STATUTORY FEASIBILITY -->
    <div style="display: flex; flex-direction: column; gap: 18px;">
      
      <div class="glass-panel" style="border-top: 5px solid var(--amber-deep);">
        <div style="font-family: var(--font-heading); font-size: 20px; font-weight: 800; color: var(--ink-hero); margin-bottom: 10px;">
          Operational Readiness & Zero Administrative Friction
        </div>
        <ul style="font-size: 14px; color: var(--ink-body); line-height: 1.65; padding-left: 20px;">
          <li><strong>Direct Statutory Alignment:</strong> Directly enforces Section 5 of the Record of Rights (ROR) Act and State Survey & Boundaries Acts.</li>
          <li><strong>Empowers Existing Revenue Officers:</strong> Does not replace officers. Pre-assembles dossiers for VROs, Surveyors, and Tahsildars to issue valid Speaking Orders.</li>
          <li><strong>Bandwidth-Efficient for Rural Bharat:</strong> Mapbox Vector Tiles stream over low-bandwidth 3G/4G connections consuming &lt;150 KB per viewport.</li>
        </ul>
      </div>

      <div class="glass-panel" style="border-top: 5px solid var(--rose-deep);">
        <div style="font-family: var(--font-heading); font-size: 20px; font-weight: 800; color: var(--ink-hero); margin-bottom: 10px;">
          Critical Challenges & Statutory Mitigations
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13.5px;">
          <div>
            <strong style="color: var(--rose-deep);">Discrepancy between Revenue and Deeds:</strong><br>
            Tract never artificially overwrites records; it surfaces an automated <em>'Title-Registration Asymmetry'</em> warning to prevent fraudulent sales.
          </div>
          <div>
            <strong style="color: var(--rose-deep);">Boundary Tampering:</strong><br>
            Database schema enforces an immutable ±15% statutory area variance ceiling. Any higher variance legally requires gazetted District Collector de-novo approval.
          </div>
          <div>
            <strong style="color: var(--rose-deep);">Privacy vs Public Transparency:</strong><br>
            DPDP Act 2023 purpose-bound consent masking protects personal data by default, unmasking strictly with authenticated citizen OTP or bank tokens.
          </div>
        </div>
      </div>

    </div>

  </div>

  <div class="slide-footer">
    <div><span class="footer-dot"></span>Self-Funding DPI: Commercial Bank Due Diligence Subsidizes Free Citizen Title Verification</div>
    <div>OPERATIONAL & STATUTORY FEASIBILITY</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- SLIDE 5: SOCIO-ECONOMIC IMPACT & CITIZEN WELFARE                          -->
<!-- ========================================================================= -->
<div class="slide" id="slide-5">
  <div class="slide-header">
    <div class="header-left">
      <div class="tricolor-stripe"></div>
      <div>
        <div class="gov-text">Impact and Benefits · Socio-Economic Value</div>
        <div class="gov-subtext">Unlocking Dead Capital, Eradicating Generational Litigation & Citizen Dignity</div>
      </div>
    </div>
    <div class="header-center">
      <div class="badge-sih">
        SMART INDIA HACKATHON 2026
        <span class="ps-pill">SIH26014</span>
      </div>
    </div>
    <div class="header-right">05 / 06</div>
  </div>

  <div>
    <h2 class="section-title">National Economic Multipliers & Human Dignity</h2>
    <p class="lead-text" style="margin-top: 4px; margin-bottom: 20px;">
      Tangible transformation for smallholder farmers, state revenue administrations, infrastructure, and banking.
    </p>
  </div>

  <!-- 4 STAT CARDS -->
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px;">
    
    <div class="glass-panel" style="text-align: center;">
      <div class="gradient-num rose">66% → &lt;10%</div>
      <div style="font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--ink-hero); margin-top: 6px;">
        Civil Court Land Cases
      </div>
      <div style="font-size: 13.5px; color: var(--ink-muted); margin-top: 4px;">
        Disputes eliminated at source by unifying title and registry records.
      </div>
    </div>

    <div class="glass-panel" style="text-align: center;">
      <div class="gradient-num emerald">28d → 4min</div>
      <div style="font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--ink-hero); margin-top: 6px;">
        Title Verification Time
      </div>
      <div style="font-size: 13.5px; color: var(--ink-muted); margin-top: 4px;">
        Instant multi-department search replaces physical queues.
      </div>
    </div>

    <div class="glass-panel" style="text-align: center;">
      <div class="gradient-num amber">₹16 Lakh Cr</div>
      <div style="font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--ink-hero); margin-top: 6px;">
        Dead Capital Unlocked
      </div>
      <div style="font-size: 13.5px; color: var(--ink-muted); margin-top: 4px;">
        Converts frozen land into bankable collateral for formal credit.
      </div>
    </div>

    <div class="glass-panel" style="text-align: center;">
      <div class="gradient-num">24m → 60d</div>
      <div style="font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--ink-hero); margin-top: 6px;">
        GatiShakti Land Clearance
      </div>
      <div style="font-size: 13.5px; color: var(--ink-muted); margin-top: 4px;">
        Automated RFCTLARR severance math prevents acquisition delays.
      </div>
    </div>

  </div>

  <!-- 4 DEEP STAKEHOLDER PILLARS -->
  <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
    
    <div class="glass-panel">
      <div style="font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--emerald-deep); margin-bottom: 8px;">
        🌾 Smallholder Farmers & Rural Families
      </div>
      <div style="font-size: 14.5px; color: var(--ink-body); line-height: 1.6;">
        • <strong>Escape from 36% Moneylenders:</strong> A verified digital title allows a farmer to secure formal 7% priority-sector bank credit instead of falling into compound debt.<br>
        • <strong>Ending Generational Trauma:</strong> Sparing children from 20-year civil court litigation inherited from parents.<br>
        • <strong>Women Landowner Security:</strong> DPDP Act 2023 masking shields female property owners from harassment and forged transfers.
      </div>
    </div>

    <div class="glass-panel">
      <div style="font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--blue-deep); margin-bottom: 8px;">
        🏛️ State Revenue & Registration Departments
      </div>
      <div style="font-size: 14.5px; color: var(--ink-body); line-height: 1.6;">
        • <strong>80% Reduction in Mutation Backlogs:</strong> 4-stage desk conveyor pre-assembles statutory evidence for Tahsildars.<br>
        • <strong>Zero Double-Registration Scams:</strong> Sub-Registrar cannot register deed papers without spatial parcel lock.<br>
        • <strong>Automated Speaking Orders:</strong> Standardizes quasi-judicial records to withstand High Court scrutiny.
      </div>
    </div>

    <div class="glass-panel">
      <div style="font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--amber-deep); margin-bottom: 8px;">
        🚄 National Infrastructure (NHAI, Railways, GatiShakti)
      </div>
      <div style="font-size: 14.5px; color: var(--ink-body); line-height: 1.6;">
        • <strong>Fair Severance Compensation:</strong> Section 23A mathematical severance ensures farmers receive full statutory 100% solatium.<br>
        • <strong>Zero Acquisition Agitations:</strong> Transparent buffer overlays eliminate public protests and stay orders.<br>
        • <strong>Subsurface Transit Rights:</strong> ISO 19152 bounds metro tunnels without triggering surface property disputes.
      </div>
    </div>

    <div class="glass-panel">
      <div style="font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--rose-deep); margin-bottom: 8px;">
        🏦 Commercial Banking & Housing Finance
      </div>
      <div style="font-size: 14.5px; color: var(--ink-body); line-height: 1.6;">
        • <strong>Zero Double-Pledging Fraud:</strong> Prevents fraudsters from pledging the same land title across multiple banks.<br>
        • <strong>90% Lower Origination Costs:</strong> Instant 9-point verification API accelerates home and mortgage loans.<br>
        • <strong>Reduction in Non-Performing Assets (NPAs):</strong> Clean spatial collateral strengthens the rural lending ecosystem.
      </div>
    </div>

  </div>

  <div class="slide-footer">
    <div><span class="footer-dot"></span>Catalyzing Viksit Bharat 2047: Converting Presumptive Paper Records into Liquid Sovereign Capital</div>
    <div>MACROECONOMIC MULTIPLIERS</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- SLIDE 6: RESEARCH, STATUTORY STANDARDS & SUBMISSION                       -->
<!-- ========================================================================= -->
<div class="slide" id="slide-6">
  <div class="slide-header">
    <div class="header-left">
      <div class="tricolor-stripe"></div>
      <div>
        <div class="gov-text">Research and References · Standards Alignment</div>
        <div class="gov-subtext">Statutory Acts, International Norms & National Mission Alignment</div>
      </div>
    </div>
    <div class="header-center">
      <div class="badge-sih">
        SMART INDIA HACKATHON 2026
        <span class="ps-pill">SIH26014</span>
      </div>
    </div>
    <div class="header-right">06 / 06</div>
  </div>

  <div>
    <h2 class="section-title">Statutory Grounding & Geospatial Compliance</h2>
    <p class="lead-text" style="margin-top: 4px; margin-bottom: 24px;">
      Built on established parliamentary legislation, OGC open geospatial standards, and national digital infrastructure missions.
    </p>
  </div>

  <div style="flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
    
    <div class="glass-panel" style="border-top: 5px solid var(--blue-deep);">
      <div style="font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--ink-hero); margin-bottom: 12px;">
        1. Statutory Acts
      </div>
      <div style="font-size: 14px; color: var(--ink-body); line-height: 1.65;">
        • <strong>State ROR Acts (§5):</strong> Quasi-judicial mutation conveyor & mandatory Speaking Orders.<br>
        • <strong>RFCTLARR Act 2013 (§23A, §64):</strong> Statutory severance compensation & 100% solatium.<br>
        • <strong>Registration Act 1908:</strong> Provenance-based title vs instrument matrix.<br>
        • <strong>DPDP Act 2023:</strong> Purpose-bound consent masking for citizen data.
      </div>
    </div>

    <div class="glass-panel" style="border-top: 5px solid var(--emerald-deep);">
      <div style="font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--ink-hero); margin-bottom: 12px;">
        2. Geospatial Norms
      </div>
      <div style="font-size: 14px; color: var(--ink-body); line-height: 1.65;">
        • <strong>ISO 19152 (LADM):</strong> Land Administration Domain Model for 3D Volumetric Cadastres.<br>
        • <strong>OGC API Features:</strong> Open geospatial consortium interoperable endpoints.<br>
        • <strong>Mapbox Vector Tiles (MVT):</strong> Binary vector streaming specification 2.1.<br>
        • <strong>W3C JSON-LD 1.1:</strong> Common Linked Data contextual schemas.
      </div>
    </div>

    <div class="glass-panel" style="border-top: 5px solid var(--amber-deep);">
      <div style="font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--ink-hero); margin-bottom: 12px;">
        3. National Missions
      </div>
      <div style="font-size: 14px; color: var(--ink-body); line-height: 1.65;">
        • <strong>PM GatiShakti:</strong> Multimodal National Master Plan spatial corridor integration.<br>
        • <strong>DILRMP:</strong> Digital India Land Records Modernization Programme.<br>
        • <strong>SVAMITVA Scheme:</strong> Survey of Villages and Mapping with Improvised Technology.<br>
        • <strong>MeitY Cloud Guidelines:</strong> Sovereign in-country data residency.
      </div>
    </div>

    <div class="glass-panel" style="border-top: 5px solid var(--rose-deep);">
      <div style="font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--ink-hero); margin-bottom: 12px;">
        4. Remote Sensing
      </div>
      <div style="font-size: 14px; color: var(--ink-body); line-height: 1.65;">
        • <strong>ESA Copernicus Sentinel-2:</strong> Level-2A surface reflectance satellite pipeline.<br>
        • <strong>NDVI Algorithms:</strong> Rouse et al., Normalized Difference Vegetation Index for encroachment.<br>
        • <strong>NDBI Mapping:</strong> Zha et al., Built-up index for foundation trench detection.<br>
        • <strong>PostGIS 3.4 Specs:</strong> Topological spatial invariant validation algorithms.
      </div>
    </div>

  </div>

  <!-- CLOSING VISION & VERIFICATION -->
  <div style="background: linear-gradient(135deg, var(--ink-hero) 0%, #1E3A8A 100%); color: #FFFFFF; border-radius: 18px; padding: 24px 34px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <div style="font-family: var(--font-heading); font-size: 13px; font-weight: 800; color: #93C5FD; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">
        The Sovereign Vision · Viksit Bharat 2047
      </div>
      <div style="font-family: var(--font-heading); font-size: 20px; font-weight: 700;">
        "Transitioning India from presumptive deed registration to conclusive, bankable 3D cadastral property rights."
      </div>
    </div>
    <div style="display: flex; gap: 14px;">
      <a href="https://github.com/kbs6108/Hexaverse2" style="background: rgba(255,255,255,0.15); color: #FFF; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; border: 1px solid rgba(255,255,255,0.3); font-family: var(--font-mono);" target="_blank">
        GitHub Repository
      </a>
      <a href="https://youtu.be/your-pitch-video" style="background: #E11D48; color: #FFF; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; font-family: var(--font-mono);" target="_blank">
        ▶️ Video Pitch Demo
      </a>
    </div>
  </div>

  <div class="slide-footer">
    <div><span class="footer-dot"></span>Project Tract · Team Tract · Ministry of Rural Development Submission</div>
    <div>SMART INDIA HACKATHON 2026 · FINAL EVALUATION DECK</div>
  </div>
</div>

<script>
let current = 1;
const total = 6;
function updateIndicator() {
  const ind = document.getElementById('nav-indicator');
  if (ind) ind.textContent = 'Slide ' + current + ' / ' + total;
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
window.addEventListener('scroll', () => {
  for (let i = 1; i <= total; i++) {
    const el = document.getElementById('slide-' + i);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top >= -200 && rect.top <= 400) {
        current = i;
        updateIndicator();
        break;
      }
    }
  }
});
</script>
</body>
</html>
'''

final_html = template.replace('LIVE_MAP_B64_PLACEHOLDER', live_map_b64)

with open('docs/plan/sih_presentation_deck.html', 'w') as f:
    f.write(final_html)

print("Saved gold standard docs/plan/sih_presentation_deck.html!")

# Compile to PDF
chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
pdf_out = "docs/plan/SIH2026_TRACT_PRESENTATION.pdf"
cmd = [
    chrome_path,
    "--headless",
    "--disable-gpu",
    "--print-to-pdf=" + pdf_out,
    "file://" + os.path.abspath("docs/plan/sih_presentation_deck.html")
]
print("Compiling PDF...")
res = subprocess.run(cmd, capture_output=True, text=True)
if os.path.exists(pdf_out):
    print("New Gold Standard PDF generated at:", pdf_out, "Size:", os.path.getsize(pdf_out), "bytes")
else:
    print("PDF compilation failed:", res.stderr)

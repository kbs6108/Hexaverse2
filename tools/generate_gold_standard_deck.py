#!/usr/bin/env python3
"""
Generate Gold Standard, Anti-AI-Slop Presentation Deck for Project Tract (SIH 2026).
- Seamless, unboxed layouts (no generic dashboard boxes).
- Sophisticated typography (Space Grotesk + Plus Jakarta Sans).
- Subtle mesh gradients and warm architectural tones.
- High legibility (large text, high contrast).
- No unnecessary bottom ribbons ("submission ready" fluff removed).
- Handcrafted inline SVGs.
- Real WebGL live cadastre screenshot embedded.
"""

import os
import base64
import subprocess
import pymupdf

def build_deck():
    screenshot_path = "docs/plan/screenshot_map_live.png"
    if os.path.exists(screenshot_path):
        with open(screenshot_path, "rb") as f:
            live_map_b64 = "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")
    else:
        live_map_b64 = ""

    sih_top_logo_path = "docs/plan/sih_assets/sih_top_right_logo_alpha.png"
    if os.path.exists(sih_top_logo_path):
        with open(sih_top_logo_path, "rb") as f:
            sih_top_logo_b64 = "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")
    else:
        sih_top_logo_b64 = ""

    sih_graphic_path = "docs/plan/sih_assets/sih_slide1_graphic_alpha.png"
    if os.path.exists(sih_graphic_path):
        with open(sih_graphic_path, "rb") as f:
            sih_graphic_b64 = "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")
    else:
        sih_graphic_b64 = ""

    webapp_path = "docs/plan/sih_assets/webapp_screenshot_clean.png"
    if os.path.exists(webapp_path):
        with open(webapp_path, "rb") as f:
            webapp_b64 = "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")
    else:
        webapp_b64 = ""

    phone_mockup_path = "docs/plan/sih_assets/phone_mockup_clean.png"
    if os.path.exists(phone_mockup_path):
        with open(phone_mockup_path, "rb") as f:
            phone_mockup_b64 = "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")
    else:
        phone_mockup_b64 = ""

    farmer_img_path = "docs/plan/assets/farmer_impact.jpg"
    if os.path.exists(farmer_img_path):
        with open(farmer_img_path, "rb") as f:
            farmer_img_b64 = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode("utf-8")
    else:
        farmer_img_b64 = ""

    govtech_img_path = "docs/plan/assets/govtech_dpi_api.jpg"
    if os.path.exists(govtech_img_path):
        with open(govtech_img_path, "rb") as f:
            govtech_img_b64 = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode("utf-8")
    else:
        govtech_img_b64 = ""

    ward_img_path = "docs/plan/assets/k_bhaskar_ias.png"
    if os.path.exists(ward_img_path):
        with open(ward_img_path, "rb") as f:
            ward_img_b64 = "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")
    else:
        ward_img_b64 = ""

    tech_logos = {}
    for name in ["postgresql", "postgis", "fastapi", "python", "react", "vite", "sentinel2"]:
        p = f"docs/plan/logos/{name}.png"
        if os.path.exists(p):
            with open(p, "rb") as f:
                tech_logos[name] = "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")
        else:
            tech_logos[name] = ""



    html_content = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Tract · SIH 2026 Final Presentation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #f8fafc;
      --bg-surface: #ffffff;
      --text-main: #0f172a;
      --text-muted: #475569;
      --text-light: #64748b;
      --primary: #1e3a8a;
      --primary-light: #3b82f6;
      --accent-saffron: #d97706;
      --accent-green: #059669;
      --accent-crimson: #dc2626;
      --border-subtle: rgba(226, 232, 240, 0.8);
      --border-focus: rgba(30, 58, 138, 0.2);
      --font-display: 'Space Grotesk', -apple-system, sans-serif;
      --font-body: 'Plus Jakarta Sans', -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    body {
      background: #0b0f19;
      font-family: var(--font-body);
      color: var(--text-main);
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      padding: 20px 0 100px;
    }

    /* Print & Slide Container */
    @page {
      size: 1920px 1080px;
      margin: 0;
    }

    .slide {
      width: 1920px;
      height: 1080px;
      position: relative;
      background: #fafcff;
      background-image: 
        radial-gradient(at 0% 0%, rgba(224, 236, 255, 0.6) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(254, 243, 199, 0.4) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(209, 250, 229, 0.3) 0px, transparent 40%);
      overflow: hidden;
      display: none;
      flex-direction: column;
      justify-content: space-between;
      padding: 56px 80px 52px;
      box-shadow: 0 30px 90px rgba(0, 0, 0, 0.45);
    }

    .slide.active {
      display: flex;
    }

    @media print {
      body {
        background: transparent;
        padding: 0;
      }
      .slide {
        display: flex !important;
        page-break-after: always;
        box-shadow: none;
        margin: 0;
      }
      .nav-bar {
        display: none !important;
      }
    }

    /* Top Utility Header */
    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(203, 213, 225, 0.6);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .national-flag-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #ffffff;
      padding: 6px 14px;
      border-radius: 999px;
      border: 1px solid rgba(226, 232, 240, 0.9);
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }

    .flag-bar {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      background: linear-gradient(180deg, #ff9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%);
      border: 1px solid rgba(0,0,0,0.1);
    }

    .dept-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #334155;
    }

    .dept-sub {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .hackathon-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(30, 58, 138, 0.06);
      border: 1px solid rgba(30, 58, 138, 0.15);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      color: var(--primary);
      letter-spacing: 0.05em;
    }

    .hackathon-badge span.id {
      background: var(--primary);
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
    }

    .slide-page-num {
      font-family: var(--font-mono);
      font-size: 18px;
      font-weight: 700;
      color: #94a3b8;
    }

    .slide-page-num strong {
      color: #0f172a;
    }

    /* Main Slide Body */
    .slide-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin: 28px 0;
    }

    /* Typography Hierarchy */
    .category-kicker {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #1e3a8a;
      margin-bottom: 12px;
    }

    .slide-headline {
      font-family: var(--font-display);
      font-size: 46px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.15;
      letter-spacing: -0.02em;
    }

    .slide-subheadline {
      font-size: 21px;
      font-weight: 500;
      color: #475569;
      line-height: 1.45;
      margin-top: 10px;
      max-width: 1400px;
    }

    /* Action Link Pills */
    .pill-links {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 32px;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 22px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }

    .action-btn.dark {
      background: #0f172a;
      color: #ffffff;
      border: 1px solid #0f172a;
    }

    .action-btn.ruby {
      background: linear-gradient(135deg, #e11d48, #be123c);
      color: #ffffff;
      border: 1px solid #be123c;
    }

    .action-btn.outline {
      background: #ffffff;
      color: #1e3a8a;
      border: 1.5px solid #cbd5e1;
    }

    /* ========================================= */
    /* SLIDE 1: STRICT OFFICIAL SIH TITLE PAGE   */
    /* ========================================= */
    .slide.sih-title-slide {
      padding: 44px 84px 34px;
      justify-content: space-between;
      border: 1.5px solid rgba(203, 213, 225, 0.7);
      background: #ffffff;
      background-image: 
        radial-gradient(at 0% 0%, rgba(219, 234, 254, 0.4) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(254, 243, 199, 0.3) 0px, transparent 45%),
        radial-gradient(at 100% 0%, rgba(209, 250, 229, 0.25) 0px, transparent 40%);
    }

    .sih-title-banner {
      position: relative;
      width: 100%;
      height: 94px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sih-main-title {
      font-family: 'Space Grotesk', -apple-system, sans-serif;
      font-size: 54px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #0c3c78;
      text-transform: uppercase;
      text-align: center;
    }

    .sih-top-right-logo {
      position: absolute;
      right: 0;
      top: -4px;
      height: 98px;
      width: auto;
      object-fit: contain;
    }

    .sih-subheading {
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 42px;
      font-weight: 700;
      letter-spacing: 3px;
      color: #000000;
      text-align: center;
      margin-top: 6px;
      margin-bottom: 20px;
      text-transform: uppercase;
    }

    .sih-title-body {
      display: grid;
      grid-template-columns: 1.25fr 0.85fr;
      gap: 48px;
      align-items: center;
      flex: 1;
      min-height: 0;
      padding: 0 10px;
    }

    .sih-details-col {
      display: flex;
      flex-direction: column;
    }

    .sih-details-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 48px;
    }

    .sih-detail-item {
      display: flex;
      align-items: flex-start;
      gap: 20px;
    }

    .sih-detail-item .bullet-dot {
      font-size: 38px;
      line-height: 1.25;
      color: #0c3c78;
      display: inline-block;
    }

    .sih-detail-item .item-content {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      font-size: 36px;
      line-height: 1.50;
      color: #0f172a;
    }

    .sih-detail-item .field-label {
      font-weight: 800;
      color: #000000;
      margin-right: 8px;
    }

    .sih-detail-item .field-value {
      font-weight: 600;
      color: #0f172a;
    }

    .sih-detail-item .field-value.id-val {
      font-weight: 800;
      color: #0c3c78;
    }

    .sih-detail-item .field-value.title-val {
      font-weight: 700;
      color: #0f172a;
    }

    .sih-detail-item .field-value.team-name-val {
      font-weight: 800;
      color: #0c3c78;
    }

    .sih-detail-item .field-value.placeholder-val {
      color: #64748b;
      font-weight: 500;
      font-style: italic;
    }

    .sih-graphic-col {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sih-right-graphic {
      width: 100%;
      max-width: 820px;
      max-height: 740px;
      object-fit: contain;
      filter: drop-shadow(0 15px 35px rgba(0, 0, 0, 0.04));
    }

    .sih-title-footer {
      border-top: 1.5px solid #cbd5e1;
      padding-top: 18px;
      margin-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16.5px;
      font-weight: 700;
      color: #475569;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    .sih-title-footer .footer-org {
      color: #0c3c78;
      font-weight: 800;
    }

    /* ========================================= */
    /* SLIDE 2: PROPOSED SOLUTION & INNOVATION   */
    /* ========================================= */
    .slide.sih-slide-2 {
      padding: 18px 48px 0 48px;
      justify-content: flex-start;
      border: 1.5px solid rgba(203, 213, 225, 0.7);
      background: #ffffff;
      background-image: 
        radial-gradient(at 0% 0%, rgba(241, 245, 249, 0.6) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(248, 250, 252, 0.8) 0px, transparent 50%);
      position: relative;
    }

    .sih-s2-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      height: 62px;
      margin-bottom: 2px;
    }

    .sih-team-oval {
      border: 2px solid #581c87;
      border-radius: 999px;
      padding: 5px 18px;
      background: #ffffff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 800;
      color: #581c87;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .sih-idea-title-center {
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 29px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #000000;
      text-align: center;
      text-transform: uppercase;
    }

    .sih-idea-title-center .brand-accent {
      color: #0c3c78;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .sih-s2-top-logo {
      height: 66px;
      width: auto;
      object-fit: contain;
    }

    .sih-section-title-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 6px;
      margin-bottom: 12px;
      border-bottom: 3px solid #0070c0;
    }

    .sih-section-heading {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 23px;
      font-weight: 800;
      color: #0070c0;
      display: flex;
      align-items: center;
      gap: 8px;
      letter-spacing: -0.01em;
    }

    .sih-diamond-icon {
      font-size: 19px;
      color: #0070c0;
      line-height: 1;
    }

    .sih-links-strip {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sih-link-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 18px;
      border-radius: 999px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      letter-spacing: 0.1px;
    }

    .sih-link-pill.github {
      background: #0f172a;
      color: #ffffff;
      border: 1.5px solid #334155;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.28);
    }

    .sih-link-pill.video {
      background: #dc2626;
      color: #ffffff;
      border: 1.5px solid #b91c1c;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.32);
    }

    .sih-link-pill.hosted {
      background: #0284c7;
      color: #ffffff;
      border: 1.5px solid #0369a1;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.38);
    }

    .pulse-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 8px #4ade80, 0 0 14px #22c55e;
    }

    /* 2-Column Content Layout */
    .sih-s2-content-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 20px;
      align-items: stretch;
      flex: 1;
      min-height: 0;
      margin-bottom: 2px;
    }

    /* Left Column: Larger deliverable blocks + Technical Architecture Card */
    .sih-left-column {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
      height: 100%;
    }

    .sih-deliverables-stack {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
      flex: 1;
    }

    .sih-deliverable-block {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-left: 5px solid #0b3b6f;
      border-radius: 8px;
      padding: 8px 15px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex: 1;
    }

    .sih-block-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 18px;
      font-weight: 800;
      color: #0b3b6f;
      margin-bottom: 3px;
      letter-spacing: -0.01em;
    }

    .sih-bullets-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .sih-bullet-line {
      font-family: 'Inter', sans-serif;
      font-size: 15.6px;
      line-height: 1.38;
      color: #334155;
      position: relative;
      padding-left: 17px;
    }

    .sih-bullet-line::before {
      content: '•';
      position: absolute;
      left: 0;
      top: -1px;
      color: #0b3b6f;
      font-size: 17px;
      font-weight: 800;
    }

    .sih-bullet-line strong {
      color: #0f172a;
      font-weight: 700;
    }

    /* Slide 2: Real-World Resolution Scenario Card */
    .sih-scenario-card {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 14px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .scenario-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }

    .scenario-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #0b3b6f;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .scenario-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      color: #0369a1;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 2px 7px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .scenario-steps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .scenario-step-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .scenario-step-box.warning {
      background: #fffbeb;
      border-color: #fde68a;
    }

    .scenario-step-box.success {
      background: #eff6ff;
      border-color: #bfdbfe;
    }

    .step-num-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .step-num-badge.warning {
      color: #b45309;
    }

    .step-num-badge.success {
      color: #1e40af;
    }

    .step-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }

    .step-desc {
      font-family: 'Inter', sans-serif;
      font-size: 13.8px;
      line-height: 1.34;
      color: #334155;
    }

    .step-desc strong {
      color: #0f172a;
      font-weight: 700;
    }

    .step-desc code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      background: #e2e8f0;
      padding: 1px 4px;
      border-radius: 3px;
      color: #0b3b6f;
    }

    /* Technical Architecture Card (Used in Slide 3) */
    .sih-arch-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      padding: 8px 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }

    .sih-arch-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
      padding-bottom: 4px;
      border-bottom: 1px solid #f1f5f9;
    }

    .sih-arch-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13.5px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .sih-arch-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      color: #0369a1;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* Compact Tech Stack Strip (Bottom Left) */
    .sih-tech-logos-strip {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 5px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
    }

    .tech-strip-label {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11px;
      font-weight: 800;
      color: #0b3b6f;
      letter-spacing: 0.4px;
      display: flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
    }

    .tech-logos-container {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1;
      justify-content: space-between;
      padding-left: 6px;
    }

    .tech-logo-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .tech-logo-item img {
      object-fit: contain;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.04));
    }

    .tech-logo-caption {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.2px;
      white-space: nowrap;
    }

    /* Right Column: Web GIS on top, Phone Mockup on bottom */
    .sih-visual-column {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
      height: 100%;
    }

    /* Top: Webapp Screenshot Frame */
    .sih-webapp-frame {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      overflow: hidden;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
    }

    .webapp-titlebar {
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .titlebar-dots {
      display: flex;
      gap: 5px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot.red { background: #ef4444; }
    .dot.yellow { background: #f59e0b; }
    .dot.green { background: #10b981; }

    .titlebar-url {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #475569;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 2px 12px;
      border-radius: 4px;
      letter-spacing: 0.2px;
    }

    .titlebar-badge {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 10px;
      font-weight: 700;
      color: #0284c7;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .webapp-screenshot {
      width: 100%;
      height: 435px;
      object-fit: cover;
      object-position: top center;
      display: block;
    }

    /* Bottom: Mobile Phone Mockup Showcase */
    .sih-mobile-showcase {
      display: grid;
      grid-template-columns: 195px 1fr;
      gap: 18px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 9px;
      padding: 14px 20px;
      align-items: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
      flex: 1;
    }

    .phone-mockup-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 370px;
    }

    .phone-mockup-img {
      height: 365px;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.12));
    }

    .mobile-specs-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .mobile-specs-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 19.5px;
      font-weight: 800;
      color: #0b3b6f;
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .mobile-specs-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      color: #0b3b6f;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 2px 7px;
      border-radius: 4px;
    }

    .mobile-specs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .mobile-feature-box {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-left: 4px solid #0b3b6f;
      border-radius: 6px;
      padding: 8px 11px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .mobile-feat-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 15.5px;
      font-weight: 800;
      color: #0b3b6f;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .mobile-feat-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      font-weight: 800;
      color: #0284c7;
      background: #e0f2fe;
      padding: 1px 5px;
      border-radius: 3px;
    }

    .mobile-feat-desc {
      font-family: 'Inter', sans-serif;
      font-size: 14.2px;
      line-height: 1.40;
      color: #334155;
    }

    .mobile-feat-desc strong {
      color: #0f172a;
      font-weight: 700;
    }

    /* Bottom Official Ribbon */
    .sih-bottom-ribbon {
      width: calc(100% + 96px);
      margin-left: -48px;
      height: 36px;
      background: #0070c0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 32px;
      margin-top: auto;
    }

    .sih-bottom-ribbon .ribbon-left {
      color: #ffffff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13.5px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .sih-bottom-ribbon .ribbon-right {
      color: #ffffff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 15px;
      font-weight: 800;
    }

    .sih-slide-3 .sih-bottom-ribbon,
    .sih-slide-4 .sih-bottom-ribbon,
    .sih-slide-5 .sih-bottom-ribbon,
    .sih-slide-6 .sih-bottom-ribbon {
      width: calc(100% + 72px);
      margin-left: -36px;
    }

    /* SLIDE 1 Legacy Split (kept for compatibility) */
    .hero-split {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 72px;
      align-items: center;
    }



    .hero-left h1 {
      font-family: var(--font-display);
      font-size: 60px;
      font-weight: 700;
      color: #091322;
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin-bottom: 16px;
    }

    .hero-left h2 {
      font-size: 24px;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 24px;
      line-height: 1.35;
    }

    .hero-narrative {
      font-size: 19px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 24px;
    }

    .hero-punchline {
      font-size: 19px;
      line-height: 1.55;
      color: #0f172a;
      background: rgba(255, 255, 255, 0.85);
      border-left: 4px solid #d97706;
      padding: 16px 20px;
      border-radius: 0 12px 12px 0;
      box-shadow: 0 4px 14px rgba(0,0,0,0.03);
    }

    /* Luminous Metric Rows */
    .metric-stream {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .metric-row {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      padding: 26px 32px;
      border-radius: 20px;
      border: 1px solid rgba(226, 232, 240, 0.9);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
      position: relative;
      overflow: hidden;
    }

    .metric-row::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 6px;
    }

    .metric-row.red::before { background: linear-gradient(180deg, #dc2626, #ef4444); }
    .metric-row.amber::before { background: linear-gradient(180deg, #d97706, #f59e0b); }
    .metric-row.green::before { background: linear-gradient(180deg, #059669, #10b981); }

    .metric-num {
      font-family: var(--font-display);
      font-size: 58px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }

    .metric-row.red .metric-num { color: #dc2626; }
    .metric-row.amber .metric-num { color: #b45309; }
    .metric-row.green .metric-num { color: #047857; }

    .metric-label {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .metric-desc {
      font-size: 15px;
      color: #64748b;
      line-height: 1.4;
    }

    /* SLIDE 2: Interactive Product Showcase */
    .preview-canvas {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 48px;
      margin-top: 18px;
    }

    .macbook-outer {
      width: 1220px;
      background: #0f172a;
      border-radius: 22px 22px 4px 4px;
      padding: 18px 18px 0;
      box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.35);
      border: 1px solid #334155;
      position: relative;
    }

    .macbook-notch {
      width: 130px;
      height: 12px;
      background: #0f172a;
      position: absolute;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      border-radius: 0 0 8px 8px;
      z-index: 10;
    }

    .macbook-screen {
      background: #ffffff;
      border-radius: 12px 12px 0 0;
      overflow: hidden;
      height: 610px;
      position: relative;
    }

    .macbook-screen img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
      display: block;
    }

    .macbook-base {
      width: 1360px;
      height: 20px;
      background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
      margin-left: -70px;
      border-radius: 0 0 24px 24px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.25);
    }

    /* Native Phone Showcase */
    .phone-outer {
      width: 320px;
      height: 630px;
      background: #090d16;
      border-radius: 46px;
      padding: 12px;
      border: 4px solid #334155;
      box-shadow: 0 25px 50px -10px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
    }

    .phone-screen {
      background: #ffffff;
      border-radius: 36px;
      flex: 1;
      padding: 22px 18px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      font-size: 13px;
    }

    .phone-notch-bar {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 14px;
    }

    .phone-card {
      background: #0f172a;
      color: #ffffff;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 14px;
    }

    .phone-pills-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .phone-tag {
      background: #059669;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .phone-qr-box {
      width: 34px;
      height: 34px;
      background: #ffffff;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0f172a;
      font-weight: 800;
      font-size: 12px;
    }

    .phone-list {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 12px;
      font-size: 12px;
      line-height: 1.7;
    }

    /* 4-Item Floating Ribbon */
    .capability-ribbon {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-top: 24px;
    }

    .cap-item {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 18px 22px;
      border-radius: 16px;
      border: 1px solid rgba(226, 232, 240, 0.9);
      box-shadow: 0 4px 14px rgba(0,0,0,0.03);
    }

    .cap-item h4 {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cap-item p {
      font-size: 14px;
      color: #64748b;
      line-height: 1.45;
    }

    /* ======================================================== */
    /* SLIDE 3: TECHNICAL APPROACH & ARCHITECTURAL BLUEPRINT    */
    /* ======================================================== */
    .sih-slide-3,
    .sih-slide-4,
    .sih-slide-5,
    .sih-slide-6 {
      padding: 16px 36px 0px 36px;
      display: flex;
      flex-direction: column;
      height: 100vh;
      box-sizing: border-box;
      position: relative;
      background: #ffffff;
    }

    /* Technical Approach 2-Column Grid */
    .sih-s3-tech-grid {
      display: grid;
      grid-template-columns: 0.95fr 1.05fr;
      gap: 14px;
      align-items: stretch;
      flex: 1;
      min-height: 0;
      margin-top: 5px;
      margin-bottom: 5px;
    }

    .sih-s3-tech-left {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 12px;
    }

    .sih-s3-tech-right {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 12px;
    }

    .sih-s3-panel {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 7px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .sih-s3-tech-left .sih-s3-panel:first-child {
      flex: 1.02;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 6px;
      padding: 8px 12px;
    }

    .sih-s3-tech-left .sih-s3-panel:last-child {
      flex: 0.98;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 5px;
      padding: 8px 12px;
    }

    .sih-s3-tech-right .sih-s3-panel:first-child {
      flex: 0.95;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4px;
      padding: 6px 12px;
    }

    .sih-s3-tech-right .sih-benchmark-panel {
      flex: 1.05;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4px;
      padding: 6px 12px;
    }

    .sih-s3-panel-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
      margin-bottom: 1px;
    }

    .sih-s3-panel-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 15.5px;
      font-weight: 800;
      color: #0b3b6f;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .sih-s3-panel-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.2px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* 6-Grid Category Cards for Tech Stack */
    .sih-tech-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      flex: 1;
    }

    .tech-category-card {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 11px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 3px;
    }

    .tech-cat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
    }

    .tech-cat-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #0b3b6f;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .tech-cat-tags {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .tech-tag-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      color: #0369a1;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 1.5px 6px;
      border-radius: 3px;
    }

    .tech-cat-desc {
      font-family: 'Inter', sans-serif;
      font-size: 14.2px;
      line-height: 1.38;
      color: #334155;
    }

    .tech-cat-desc strong {
      color: #0f172a;
    }

    .tech-cat-desc code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      background: #e2e8f0;
      padding: 1px 4px;
      border-radius: 3px;
      color: #0b3b6f;
    }

    /* Hardware Ground Truth 3-Grid */
    .sih-s3-hardware-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .sih-hardware-card {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 7px 10px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      justify-content: space-between;
    }

    .hw-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
    }

    .hw-card-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 15.5px;
      font-weight: 800;
      color: #0b3b6f;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .hw-card-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.8px;
      font-weight: 700;
      color: #059669;
      background: #ecfdf5;
      padding: 1px 5px;
      border-radius: 2px;
      border: 1px solid #a7f3d0;
      width: fit-content;
    }

    .hw-card-desc {
      font-family: 'Inter', sans-serif;
      font-size: 13.8px;
      line-height: 1.34;
      color: #334155;
      margin-top: 1px;
    }

    .hw-card-desc strong {
      color: #0f172a;
    }

    /* Statutory & Open Geospatial Standards Strip */
    .sih-standards-strip {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 5px 10px;
    }

    .std-item {
      display: flex;
      flex-direction: column;
      gap: 1.5px;
    }

    .std-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 800;
      color: #0b3b6f;
      background: #e0f2fe;
      border: 1px solid #bae6fd;
      padding: 1px 5px;
      border-radius: 2px;
      width: fit-content;
    }

    .std-desc {
      font-family: 'Inter', sans-serif;
      font-size: 12.8px;
      line-height: 1.28;
      color: #334155;
    }

    /* Core Technology Logos Strip */
    .sih-tech-logos-strip {
      background: #f1f5f9;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 4px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .tech-strip-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 800;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
    }

    .tech-logos-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .tech-logo-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .tech-logo-caption {
      font-family: 'Inter', sans-serif;
      font-size: 11.5px;
      font-weight: 700;
      color: #475569;
    }

    /* Architecture Flowchart Card */
    .sih-arch-card {
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      padding: 4px 8px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
      gap: 2px;
    }

    .sih-arch-card > svg {
      width: 100%;
      height: auto;
      max-height: 350px;
      display: block;
      margin: 0 auto;
    }

    .sih-arch-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
    }

    .sih-arch-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 800;
      color: #0b3b6f;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .sih-arch-title svg {
      width: 13px !important;
      height: 13px !important;
      flex-shrink: 0;
    }

    .sih-arch-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      color: #059669;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 1.5px 6px;
      border-radius: 3px;
    }

    /* Technical Performance & Federated Latency Benchmark Panel (Slide 3) */
    .sih-benchmark-panel {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 7px;
      padding: 6px 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4px;
    }

    .sih-benchmark-grid {
      display: grid;
      grid-template-columns: 1.16fr 0.84fr;
      gap: 8px;
      align-items: stretch;
      flex: 1;
    }

    .sih-latency-box {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 2px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 5px 8px;
    }

    .latency-header-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
      margin-bottom: 1px;
    }

    .latency-header-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .latency-header-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.8px;
      font-weight: 700;
      color: #0284c7;
      background: #e0f2fe;
      padding: 1px 5px;
      border-radius: 3px;
    }

    .latency-bar-row {
      display: grid;
      grid-template-columns: 145px 1fr 50px;
      align-items: center;
      gap: 6px;
      padding: 1.5px 0;
    }

    .latency-bar-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.8px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .latency-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .latency-bar-track {
      background: #e2e8f0;
      border-radius: 4px;
      height: 8px;
      overflow: hidden;
      position: relative;
    }

    .latency-bar-fill {
      height: 100%;
      border-radius: 4px;
    }

    .latency-bar-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.8px;
      font-weight: 800;
      text-align: right;
      color: #0b3b6f;
    }

    .latency-summary-strip {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
      margin-top: 2px;
      padding-top: 2px;
      border-top: 1px solid #e2e8f0;
    }

    .latency-summary-card {
      padding: 3px 6px;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .summary-tract {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
    }

    .summary-legacy {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .summary-card-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.8px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .summary-tract .summary-card-title { color: #1d4ed8; }
    .summary-legacy .summary-card-title { color: #b91c1c; }

    .summary-card-metric {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 15.5px;
      font-weight: 800;
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .summary-tract .summary-card-metric { color: #0284c7; }
    .summary-legacy .summary-card-metric { color: #dc2626; }

    .summary-card-sub {
      font-family: 'Inter', sans-serif;
      font-size: 11.2px;
      color: #64748b;
    }

    /* Mathematical Invariants & Production Runtime Box (Slide 3) */
    .sih-runtime-invariants-box {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 5px 8px;
    }

    .invariants-section {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .invariants-header {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.8px;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 1px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .invariants-header-tag {
      font-size: 9px;
      color: #0b3b6f;
      background: #e0f2fe;
      padding: 1px 5px;
      border-radius: 2px;
      font-weight: 700;
    }

    .inv-item {
      display: flex;
      flex-direction: column;
      gap: 1px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 3.5px solid #0070c0;
      border-radius: 4px;
      padding: 2.5px 6px;
    }

    .inv-item.green { border-left-color: #059669; }
    .inv-item.amber { border-left-color: #d97706; }
    .inv-item.purple { border-left-color: #7c3aed; }

    .inv-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .inv-label {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11.5px;
      font-weight: 800;
      color: #0f172a;
    }

    .inv-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5px;
      font-weight: 800;
      color: #0070c0;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 0.5px 4px;
      border-radius: 2px;
    }

    .inv-badge.green { color: #059669; background: #ecfdf5; border-color: #a7f3d0; }
    .inv-badge.amber { color: #b45309; background: #fffbeb; border-color: #fde68a; }
    .inv-badge.purple { color: #6d28d9; background: #f5f3ff; border-color: #ddd6fe; }

    .inv-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      background: #f8fafc;
      padding: 1px 5px;
      border-radius: 3px;
      color: #0b3b6f;
      border: 1px solid #cbd5e1;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .inv-desc {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      color: #475569;
      line-height: 1.2;
    }

    /* PostGIS Formal Kernel Enforcement Strip to bridge invariants and KPIs */
    .invariants-proof-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      padding: 2.5px 6px;
      margin-top: 1px;
    }

    .proof-banner-left {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.2px;
      font-weight: 800;
      color: #1e40af;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .proof-badges {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .proof-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8px;
      font-weight: 700;
      color: #047857;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 0.5px 4px;
      border-radius: 2px;
    }

    .proof-tag.blue { color: #1d4ed8; background: #eff6ff; border-color: #bfdbfe; }
    .proof-tag.purple { color: #6d28d9; background: #f5f3ff; border-color: #ddd6fe; }

    .runtime-kpi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      margin-top: 2px;
      padding-top: 2px;
      border-top: 1px solid #e2e8f0;
    }

    .runtime-kpi-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-left: 3px solid #0b3b6f;
      border-radius: 4px;
      padding: 3px 6px;
      display: flex;
      flex-direction: column;
      gap: 0.5px;
    }

    .runtime-kpi-card.green { border-left-color: #059669; }
    .runtime-kpi-card.amber { border-left-color: #d97706; }
    .runtime-kpi-card.purple { border-left-color: #7c3aed; }

    .runtime-kpi-name {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      color: #475569;
      font-weight: 700;
    }

    .runtime-kpi-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      font-weight: 800;
      color: #0b3b6f;
    }

    /* ======================================================== */
    /* SLIDE 4: FEASIBILITY AND VIABILITY (INSTITUTIONAL)       */
    /* ======================================================== */
    .sih-s3-content-grid,
    .sih-s4-content-grid {
      display: grid;
      grid-template-columns: 1.18fr 0.82fr;
      gap: 14px;
      align-items: stretch;
      flex: 1;
      min-height: 0;
      margin-top: 5px;
      margin-bottom: 2px;
    }

    .sih-s3-left-col,
    .sih-s4-left-col {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 10px;
    }

    /* Section 1: Feasibility Pillars Container */
    .sih-s3-section-panel {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 13px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .sih-s3-section-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
      margin-bottom: 1px;
    }

    .sih-s3-heading {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16.5px;
      font-weight: 800;
      color: #0b3b6f;
      letter-spacing: -0.01em;
    }

    .sih-s3-subheading {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* 3-Pillar Row */
    .sih-pillars-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .sih-pillar-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .pillar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 3px;
    }

    .pillar-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16.5px;
      font-weight: 800;
      color: #0f172a;
    }

    .pillar-score {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 800;
      color: #0b3b6f;
      background: #e2e8f0;
      padding: 1.5px 6px;
      border-radius: 4px;
    }

    .pillar-bullets {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .pillar-bullet-line {
      font-family: 'Inter', sans-serif;
      font-size: 15.2px;
      line-height: 1.44;
      color: #334155;
      position: relative;
      padding-left: 13px;
    }

    .pillar-bullet-line::before {
      content: '▪';
      position: absolute;
      left: 0;
      top: -1px;
      color: #0b3b6f;
      font-size: 13px;
    }

    .pillar-bullet-line strong {
      color: #0f172a;
      font-weight: 700;
    }

    /* Challenge-Mitigation Structured Matrix Table */
    .sih-matrix-panel {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .sih-matrix-table-head {
      display: grid;
      grid-template-columns: 0.95fr 1.35fr;
      background: #f1f5f9;
      border-bottom: 1.5px solid #cbd5e1;
      padding: 7px 14px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12.5px;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .sih-matrix-table-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: space-between;
    }

    .sih-matrix-row {
      display: grid;
      grid-template-columns: 0.95fr 1.35fr;
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 14px;
      gap: 14px;
      align-items: center;
      background: #ffffff;
      flex: 1;
    }

    .sih-matrix-row:nth-child(even) {
      background: #fcfdfe;
    }

    .sih-matrix-row:last-child {
      border-bottom: none;
    }

    .matrix-challenge {
      display: flex;
      flex-direction: column;
      gap: 2px;
      border-right: 2px solid #cbd5e1;
      padding-right: 12px;
    }

    .challenge-headline {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .matrix-num-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      font-weight: 800;
      color: #0b3b6f;
      background: #e0f2fe;
      border: 1px solid #bae6fd;
      border-radius: 4px;
      padding: 1px 5px;
      margin-right: 2px;
      flex-shrink: 0;
    }

    .challenge-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 800;
      color: #475569;
      background: #f1f5f9;
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid #cbd5e1;
    }

    .challenge-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }

    .challenge-desc {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      line-height: 1.36;
      color: #475569;
    }

    .matrix-solution {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .solution-headline {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #0b3b6f;
    }

    .solution-headline svg {
      flex-shrink: 0;
    }

    .solution-desc {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      line-height: 1.36;
      color: #1e293b;
    }

    .solution-desc strong {
      color: #0f172a;
      font-weight: 700;
    }

    .solution-desc code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 3px;
      color: #0b3b6f;
      border: 1px solid #e2e8f0;
    }

    /* Right Column: Graphs, Visual Benchmarks, and Macroeconomics */
    .sih-s3-right-col {
      display: flex;
      flex-direction: column;
      gap: 10px;
      height: 100%;
    }

    .sih-s3-content-grid .sih-benchmark-panel,
    .sih-s4-content-grid .sih-benchmark-panel {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 7px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .sih-viability-panel {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 7px 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4px;
      flex: 1;
    }

    .sih-viability-stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }

    .sih-stat-box {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-left: 4px solid #0b3b6f;
      border-radius: 6px;
      padding: 7px 11px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      justify-content: center;
    }

    .stat-number {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 24px;
      font-weight: 800;
      color: #0b3b6f;
      letter-spacing: -0.02em;
      line-height: 1.05;
    }

    .stat-label {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }

    .stat-sub {
      font-family: 'Inter', sans-serif;
      font-size: 12.8px;
      line-height: 1.32;
      color: #475569;
    }

    /* High-Value Operational Feasibility Table */
    .sih-viability-table-wrap {
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      background: #ffffff;
    }

    .sih-viability-table {
      width: 100%;
      border-collapse: collapse;
      font-family: 'Inter', sans-serif;
    }

    .sih-viability-table th {
      background: #f1f5f9;
      color: #334155;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 5px 8px;
      border-bottom: 1px solid #cbd5e1;
      text-align: left;
    }

    .sih-viability-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
      line-height: 1.28;
      color: #334155;
    }

    .sih-viability-table tr:last-child td {
      border-bottom: none;
    }

    .sih-viability-table tr:nth-child(even) td {
      background: #fcfdfe;
    }

    .tbl-sub {
      display: block;
      font-size: 11px;
      color: #64748b;
    }

    .tbl-gain {
      color: #0b3b6f;
      font-weight: 800;
    }

    .sovereign-compliance-bar {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 5px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12.2px;
    }


    /* SLIDE 4: Feasibility & Lean Economics */
    .feasibility-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      margin-top: 36px;
    }

    .clean-panel {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      border-radius: 24px;
      border: 1px solid rgba(226, 232, 240, 0.9);
      padding: 38px 40px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.02);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .panel-title {
      font-family: var(--font-display);
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .cost-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }

    .cost-table th {
      text-align: left;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      padding-bottom: 12px;
      border-bottom: 1.5px solid #e2e8f0;
    }

    .cost-table td {
      padding: 18px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 16px;
      vertical-align: middle;
    }

    .cost-table tr:last-child td {
      border-bottom: none;
    }

    .cost-table td.tier {
      font-weight: 700;
      color: #0f172a;
    }

    .cost-table td.price {
      text-align: right;
      font-family: var(--font-display);
      font-size: 24px;
      font-weight: 700;
      color: #059669;
    }

    .monetize-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 22px;
      margin-top: 10px;
    }

    .monetize-box h4 {
      font-size: 17px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 12px;
    }

    .monetize-items {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .monetize-items p {
      font-size: 15px;
      color: #334155;
      line-height: 1.45;
    }

    .monetize-items strong {
      color: #0f172a;
    }

    .readiness-list {
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .readiness-item {
      position: relative;
      padding-left: 28px;
    }

    .readiness-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 6px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #059669;
    }

    .readiness-item.amber::before {
      background: #d97706;
    }

    .readiness-item h5 {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }

    .readiness-item p {
      font-size: 15px;
      color: #475569;
      line-height: 1.5;
    }

    /* ======================================================== */
    /* SLIDE 5: IMPACT AND BENEFITS & REVENUE MODEL (REFINED)   */
    /* ======================================================== */
    /* Top 4 Headline KPI Metrics Strip */
    .sih-s5-kpi-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 1px;
      margin-bottom: 8px;
    }

    .sih-s5-kpi-card {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 7px;
      padding: 8px 14px 9px 14px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 3px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }

    .s5-kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .s5-kpi-val {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 29px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.05;
      color: #0b3b6f;
    }

    .s5-kpi-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 2px 7px;
      border-radius: 3px;
      color: #0f172a;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
    }

    .s5-kpi-label {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16.2px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }

    .s5-kpi-sub {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      line-height: 1.40;
      color: #475569;
    }

    /* 2-Column Balanced Grid */
    .sih-s5-content-grid {
      display: grid;
      grid-template-columns: 1.02fr 0.98fr;
      gap: 14px;
      align-items: stretch;
      flex: 1;
      min-height: 0;
      margin-bottom: 2px;
    }

    .sih-s5-left-col {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 12px;
    }

    .sih-s5-right-col {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 12px;
    }

    /* Generic Panel */
    .sih-s5-panel {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 7px;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sih-s5-left-col .sih-s5-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 16px;
    }

    .sih-s5-right-col .sih-s5-panel {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 8px;
      padding: 12px 16px;
    }

    .sih-s5-panel-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 1px;
    }

    .sih-s5-panel-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16.5px;
      font-weight: 800;
      color: #0b3b6f;
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .sih-s5-panel-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Left Column Layout */
    .s5-impact-top-grid {
      display: grid;
      grid-template-columns: 295px 1fr;
      gap: 14px;
      align-items: stretch;
    }

    .s5-image-card {
      position: relative;
      border-radius: 6px;
      overflow: hidden;
      border: 1.5px solid #cbd5e1;
      background: #0f172a;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      height: 335px;
    }

    .s5-image-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .s5-image-caption {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.94) 100%);
      color: #f8fafc;
      padding: 16px 14px 10px 14px;
      font-size: 13.8px;
      font-weight: 700;
      line-height: 1.38;
      letter-spacing: 0.1px;
    }

    .s5-compact-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
      justify-content: space-between;
    }

    .s5-compact-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4.5px solid #0b3b6f;
      border-radius: 5px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .s5-compact-card.green-accent {
      border-left-color: #047857;
    }

    .s5-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .s5-card-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 18.5px;
      font-weight: 800;
      color: #0b3b6f;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .s5-card-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.8px;
      font-weight: 800;
      color: #065f46;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 2px 7px;
      border-radius: 3px;
    }

    .s5-card-tag.slate {
      color: #1e293b;
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .s5-card-desc {
      font-family: 'Inter', sans-serif;
      font-size: 16.2px;
      line-height: 1.52;
      color: #334155;
    }

    .s5-card-desc strong {
      color: #0f172a;
      font-weight: 700;
    }

    .s5-compact-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .s5-compact-grid-2 .s5-compact-card {
      padding: 18px 20px;
      gap: 6px;
    }

    /* Flywheel Container */
    .sih-s5-flywheel-panel {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 11px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .flywheel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }

    .flywheel-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #0b3b6f;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .flywheel-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 800;
      color: #0b3b6f;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 2px 7px;
      border-radius: 3px;
    }

    /* Right Column: GovTech Revenue Model */
    .s5-rev-top-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 14px;
      align-items: stretch;
    }

    .s5-rev-streams-compact {
      display: flex;
      flex-direction: column;
      gap: 6px;
      justify-content: space-between;
    }

    .s5-govtech-banner {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #0b3b6f;
      border-radius: 5px;
      padding: 7px 14px;
      font-family: 'Inter', sans-serif;
      font-size: 15px;
      line-height: 1.4;
      color: #1e293b;
    }

    .s5-govtech-banner strong {
      color: #0b3b6f;
      font-weight: 800;
    }

    .s5-rev-mini-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #0b3b6f;
      border-radius: 5px;
      padding: 9px 14px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .s5-rev-mini-card.green {
      border-left-color: #047857;
    }

    .s5-rev-mini-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .s5-rev-mini-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 17px;
      font-weight: 800;
      color: #0b3b6f;
    }

    .s5-rev-mini-price {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13.5px;
      font-weight: 800;
      color: #065f46;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 2px 7px;
      border-radius: 3px;
    }

    .s5-rev-mini-sub {
      font-family: 'Inter', sans-serif;
      font-size: 14.5px;
      color: #475569;
      line-height: 1.42;
    }

    /* B2B Unit Economics Benchmark Strip */
    .s5-benchmark-strip {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      padding: 8px 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .s5-bench-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14.2px;
    }

    .s5-bench-label {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 700;
      color: #334155;
      font-size: 14px;
    }

    .s5-bench-val {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .s5-bench-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 3px;
    }

    .s5-bench-pill.good {
      color: #065f46;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
    }

    /* Prominent 3-Year Scalability Chart Box */
    .s5-trajectory-box {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.03);
      flex: 1;
    }

    .s5-traj-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }

    .s5-traj-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16.2px;
      font-weight: 800;
      color: #0b3b6f;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .s5-traj-header-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .s5-traj-legend {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .s5-traj-legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #475569;
    }

    .s5-traj-legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      display: inline-block;
    }

    .s5-traj-legend-dot.rev {
      background: linear-gradient(135deg, #0b3b6f, #1d4ed8);
    }

    .s5-traj-legend-dot.opex {
      background: linear-gradient(135deg, #64748b, #94a3b8);
    }

    .s5-traj-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      font-weight: 800;
      color: #065f46;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 1.5px 7px;
      border-radius: 3px;
    }

    /* ======================================================== */
    /* SLIDE 6: RESEARCH AND REFERENCES (GOLD STANDARD)         */
    /* ======================================================== */
    .sih-s6-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 6px;
      margin-bottom: 4px;
    }

    .sih-s6-title-center {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 28px;
      font-weight: 800;
      color: #0b1528;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      text-align: center;
    }

    .sih-s6-grid {
      display: grid;
      grid-template-columns: 0.98fr 1.02fr;
      gap: 16px;
      align-items: stretch;
      flex: 1;
      min-height: 0;
      margin-top: 5px;
      margin-bottom: 2px;
    }

    .sih-s6-left-col,
    .sih-s6-right-col {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      gap: 10px;
      min-height: 0;
    }

    .sih-s6-panel {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
    }

    /* Left Column: Photo Strip */
    .sih-s6-photo-strip {
      display: grid;
      grid-template-columns: 195px 1fr;
      gap: 12px;
      align-items: center;
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 7px;
      padding: 6px 11px;
    }

    .s6-photo-wrapper {
      position: relative;
      width: 195px;
      height: 112px;
      border-radius: 6px;
      overflow: hidden;
      border: 1.5px solid #94a3b8;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }

    .s6-field-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 15%;
      display: block;
    }

    .s6-photo-tag {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(11, 21, 40, 0.92);
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      padding: 2.5px 5px;
      text-align: center;
      letter-spacing: 0.3px;
    }

    .s6-photo-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .s6-meta-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 17.5px;
      font-weight: 800;
      color: #0b3b6f;
    }

    .s6-meta-role {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13.5px;
      font-weight: 700;
      color: #475569;
    }

    .s6-meta-desc {
      font-family: 'Inter', sans-serif;
      font-size: 14.5px;
      line-height: 1.38;
      color: #334155;
    }

    /* Left Column: Real Ground Discoveries */
    .s6-field-discoveries {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .s6-discovery-card {
      display: grid;
      grid-template-columns: 32px 1fr;
      gap: 10px;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 6px;
      padding: 5px 11px;
      align-items: flex-start;
    }

    .s6-discovery-num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13.5px;
      font-weight: 800;
      color: #0b3b6f;
      background: #e0f2fe;
      border: 1px solid #bae6fd;
      border-radius: 4px;
      padding: 2px 0;
      text-align: center;
    }

    .s6-discovery-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 15.8px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 1px;
    }

    .s6-discovery-text {
      font-family: 'Inter', sans-serif;
      font-size: 14.2px;
      line-height: 1.38;
      color: #334155;
    }

    .s6-discovery-text strong {
      color: #0f172a;
      font-weight: 700;
    }

    /* Left Column: Officer Quote Box (Executive Slate & Navy - No AI Green) */
    .s6-officer-quote-box {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-left: 5px solid #0b3b6f;
      border-radius: 7px;
      padding: 6px 12px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
      margin-top: 2px;
      box-shadow: 0 2px 6px rgba(11, 59, 111, 0.04);
    }

    .s6-quote-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      color: #0b3b6f;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .s6-quote-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .s6-quote-label {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12.2px;
      font-weight: 800;
      color: #0b3b6f;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .s6-quote-text {
      font-family: 'Inter', sans-serif;
      font-size: 14.2px;
      font-weight: 500;
      line-height: 1.38;
      color: #0f172a;
    }

    .s6-quote-author {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.8px;
      font-weight: 700;
      color: #1e3a8a;
      margin-top: 2px;
    }

    /* Right Column: 4 Policy Whitepaper Cards */
    .s6-ref-cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .s6-ref-card {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .s6-ref-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .s6-ref-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      font-weight: 800;
      padding: 1.5px 6px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .s6-ref-badge.niti {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }

    .s6-ref-badge.njdg {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .s6-ref-badge.dolr {
      background: #f1f5f9;
      color: #0b3b6f;
      border: 1px solid #cbd5e1;
    }

    .s6-ref-badge.iso {
      background: #eff6ff;
      color: #1e3a8a;
      border: 1px solid #bfdbfe;
    }

    .s6-ref-type {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
    }

    .s6-ref-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 15.5px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.24;
    }

    .s6-ref-meta {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #64748b;
      font-style: italic;
    }

    .s6-ref-body {
      font-family: 'Inter', sans-serif;
      font-size: 14.2px;
      line-height: 1.38;
      color: #334155;
    }

    .s6-ref-body strong {
      color: #0f172a;
      font-weight: 700;
    }

    .s6-ref-link {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      color: #0b3b6f;
      margin-top: 1px;
      word-break: break-all;
    }

    /* Interactive Bottom Navigation Toolbar (Hidden in Print) */
    .nav-bar {
      position: fixed;
      bottom: 24px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(16px);
      padding: 10px 24px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      z-index: 1000;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .nav-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }

    .nav-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .nav-page-indicator {
      font-family: var(--font-mono);
      color: #94a3b8;
      font-size: 14px;
      font-weight: 600;
    }

    .print-btn {
      background: #2563eb;
      color: #ffffff;
    }
  </style>
</head>
<body>

  <!-- ========================================== -->
  <!-- SLIDE 1: STRICT OFFICIAL SIH TITLE PAGE     -->
  <!-- ========================================== -->
  <section class="slide sih-title-slide active" id="slide-1">
    <!-- Top Header Banner -->
    <div class="sih-title-banner">
      <div class="sih-main-title">SMART INDIA HACKATHON 2026</div>
      <img src="SIH_TOP_LOGO_B64_PLACEHOLDER" alt="Smart India Hackathon 2026 Logo" class="sih-top-right-logo">
    </div>

    <!-- Main Content Grid -->
    <div class="sih-title-body">
      <div class="sih-details-col">
        <ul class="sih-details-list">
          <li class="sih-detail-item">
            <span class="bullet-dot">•</span>
            <div class="item-content">
              <span class="field-label">Problem Statement ID –</span>
              <span class="field-value id-val">SIH26014</span>
            </div>
          </li>
          <li class="sih-detail-item">
            <span class="bullet-dot">•</span>
            <div class="item-content">
              <span class="field-label">Problem Statement Title-</span>
              <span class="field-value title-val">An Integrated GIS-based Digital Public Infrastructure for Land Governance</span>
            </div>
          </li>
          <li class="sih-detail-item">
            <span class="bullet-dot">•</span>
            <div class="item-content">
              <span class="field-label">Theme-</span>
              <span class="field-value">Agriculture, FoodTech & Rural Development</span>
            </div>
          </li>
          <li class="sih-detail-item">
            <span class="bullet-dot">•</span>
            <div class="item-content">
              <span class="field-label">PS Category-</span>
              <span class="field-value">Software</span>
            </div>
          </li>
          <li class="sih-detail-item">
            <span class="bullet-dot">•</span>
            <div class="item-content">
              <span class="field-label">Team ID-</span>
              <span class="field-value id-val">145336</span>
            </div>
          </li>
          <li class="sih-detail-item">
            <span class="bullet-dot">•</span>
            <div class="item-content">
              <span class="field-label">Team Name (Registered on portal)</span>
              <span class="field-value team-name-val">Hexaverse</span>
            </div>
          </li>
        </ul>
      </div>

      <div class="sih-graphic-col">
        <img src="SIH_GRAPHIC_B64_PLACEHOLDER" alt="SIH Brain Bulb and Hexagon Crest" class="sih-right-graphic">
      </div>
    </div>
  </section>


  <!-- ======================================================== -->
  <!-- SLIDE 2: PROPOSED SOLUTION, INNOVATION & VERIFICATION    -->
  <!-- ======================================================== -->
  <section class="slide sih-slide-2" id="slide-2">
    <!-- Top Header Bar -->
    <div class="sih-s2-header">
      <div class="sih-team-oval">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        Team Hexaverse
      </div>
      <div class="sih-idea-title-center">
        IDEA TITLE: <span class="brand-accent">Project Tract</span>
      </div>
      <img src="SIH_TOP_LOGO_B64_PLACEHOLDER" alt="Smart India Hackathon 2026 Logo" class="sih-s2-top-logo">
    </div>

    <!-- Section Heading & Proof Action Links -->
    <div class="sih-section-title-bar">
      <div class="sih-section-heading">
        <span class="sih-diamond-icon">❖</span>
        Proposed Solution (Describe your Idea/Solution/Prototype)
      </div>
      <div class="sih-links-strip">
        <a href="https://github.com/kbs6108/Hexaverse2" target="_blank" class="sih-link-pill github">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          GitHub Code
        </a>
        <a href="https://youtu.be/demo" target="_blank" class="sih-link-pill video">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Watch Demo Pitch
        </a>
        <a href="http://localhost:5173/map" target="_blank" class="sih-link-pill hosted">
          <span class="pulse-dot"></span>
          Live Working App
        </a>
      </div>
    </div>

    <!-- Main Content 2-Column Split -->
    <div class="sih-s2-content-grid">
      <!-- Left Column: Compact Deliverables + Technical Architecture -->
      <div class="sih-left-column">
        <!-- The 3 Core Deliverables Stack -->
        <div class="sih-deliverables-stack">
          <!-- 1. Detailed Explanation -->
          <div class="sih-deliverable-block">
            <div class="sih-block-title">
              1. Detailed Explanation of the Proposed Solution
            </div>
            <ul class="sih-bullets-list">
              <li class="sih-bullet-line">
                <strong>Live Map-First Registration:</strong> Links Sub-Registrar deed desks directly to village survey maps (FMB) and revenue records (Patta/RoR). Officers and buyers see the exact, live parcel boundary on-screen before any sale deed is signed.
              </li>
              <li class="sih-bullet-line">
                <strong>Bhu-Aadhaar Digital Property Identity:</strong> Assigns a unique 14-digit geo-coded ID (ULPIN / Bhu-Aadhaar) to every land parcel—establishing an authoritative digital property identity just like Aadhaar did for individuals.
              </li>
              <li class="sih-bullet-line">
                <strong>Proactive Boundary Overlap Protection:</strong> The system automatically cross-checks plot borders against adjacent lands before registration. If a deed overlaps with a neighbor or road, the registration is blocked instantly.
              </li>
            </ul>
          </div>

          <!-- 2. How It Addresses Problem -->
          <div class="sih-deliverable-block">
            <div class="sih-block-title">
              2. How It Addresses the Problem
            </div>
            <ul class="sih-bullets-list">
              <li class="sih-bullet-line">
                <strong>Stops Duplicate Sales &amp; Fraud:</strong> Locks verified parcel boundaries digitally so fraudsters cannot resell the same plot twice or register fake, non-existent survey numbers.
              </li>
              <li class="sih-bullet-line">
                <strong>Shields Citizens from Disputed Land:</strong> Instantly cross-checks active civil court disputes and stay orders (<em>lis pendens</em>) before purchase, saving families from 20-year boundary litigation.
              </li>
              <li class="sih-bullet-line">
                <strong>Speeds Up Farmer Loans from 45 Days to &lt;1 Day:</strong> Banks verify clear, encumbrance-free titles instantly through automated digital APIs, eliminating physical office visits and speeding up Kisan Credit Cards (KCC).
              </li>
              <li class="sih-bullet-line">
                <strong>Fair &amp; Instant Infrastructure Compensation:</strong> Automatically calculates exact split areas and statutory solatium when highways or rail corridors bisect private land, preventing project delays and court disputes.
              </li>
            </ul>
          </div>

          <!-- 3. Innovation & Uniqueness -->
          <div class="sih-deliverable-block">
            <div class="sih-block-title">
              3. Innovation and Uniqueness of the Solution
            </div>
            <ul class="sih-bullets-list">
              <li class="sih-bullet-line">
                <strong>Automated Database Guard (Zero Tampering):</strong> Spatial land laws are enforced directly in the database, automatically rejecting any attempt to register or encroach on water bodies, lakes, or government poramboke land.
              </li>
              <li class="sih-bullet-line">
                <strong>5-Day Automated Satellite Watchdog:</strong> Connects with free Sentinel-2 satellite imagery to monitor village boundaries every 5 days, automatically alerting revenue officers to unauthorized ground changes.
              </li>
              <li class="sih-bullet-line">
                <strong>Offline Mobile Land Passbook for Farmers:</strong> Generates tamper-proof digital land passbooks with verifiable QR codes that work seamlessly on budget smartphones even with zero cellular signal in remote fields.
              </li>
            </ul>
          </div>
        </div>

        <!-- Real-World Resolution Scenario (Grounded Field Walkthrough) -->
        <div class="sih-scenario-card">
          <div class="scenario-header">
            <div class="scenario-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Real-World Resolution Scenario (Grounded Field Simulation)
            </div>
            <span class="scenario-tag">AP / TN REVENUE MANDAL SIMULATION</span>
          </div>
          <div class="scenario-steps-grid">
            <div class="scenario-step-box">
              <div class="step-num-badge">1. THE SITUATION</div>
              <div class="step-title">Farmer Ramesh (Kisan Loan)</div>
              <div class="step-desc">Applies for a <strong>₹5 Lakh</strong> crop loan in Guntur against ancestral agricultural parcel <strong>Survey No. 412/2B</strong>.</div>
            </div>
            <div class="scenario-step-box warning">
              <div class="step-num-badge warning">2. LEGACY BOTTLENECK</div>
              <div class="step-title">45-Day Panchnama Freeze</div>
              <div class="step-desc">Paper FMB shows an ambiguous 1.2m overlap with temple land. SRO cannot verify lis pendens; bank freezes credit.</div>
            </div>
            <div class="scenario-step-box success">
              <div class="step-num-badge success">3. TRACT RESOLUTION</div>
              <div class="step-title">&lt;24 Hr Sanction via DPI</div>
              <div class="step-desc">PostGIS <code>ST_Snap</code> resolves boundary to CORS tie-points within ±15% tolerance in <strong>&lt;400ms</strong>. Tahsildar issues verified Speaking Order with digital certificate; loan sanctioned.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Web GIS Top + Phone Mockup Bottom -->
      <div class="sih-visual-column">
        <!-- Top: Production Webapp Frame -->
        <div class="sih-webapp-frame">
          <div class="webapp-titlebar">
            <div class="titlebar-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="titlebar-url">tract.gov.in/map?ulpin=TFCM91641E6C82</div>
            <div class="titlebar-badge">Web GIS Cadastre</div>
          </div>
          <img src="WEBAPP_IMG_B64_PLACEHOLDER" alt="Tract Web GIS Cadastral Portal" class="webapp-screenshot">
        </div>

        <!-- Bottom: Clean Phone Cutout Showcase -->
        <div class="sih-mobile-showcase">
          <div class="phone-mockup-wrapper">
            <img src="PHONE_MOCKUP_B64_PLACEHOLDER" alt="Tract Mobile Citizen Passbook Mockup" class="phone-mockup-img">
          </div>
          <div class="mobile-specs-card">
            <div class="mobile-specs-title">
              <span>Citizen Passbook & Field App</span>
              <span class="mobile-specs-tag">PWA · Offline First</span>
            </div>
            <div class="mobile-specs-grid">
              <div class="mobile-feature-box">
                <div class="mobile-feat-title">
                  <span>Offline QR Verification</span>
                  <span class="mobile-feat-tag">0 KBPS</span>
                </div>
                <div class="mobile-feat-desc">Scannable <strong>SHA-256 QR codes</strong> verify statutory RoR ownership instantly without active internet.</div>
              </div>
              <div class="mobile-feature-box">
                <div class="mobile-feat-title">
                  <span>Edge Privacy Masking</span>
                  <span class="mobile-feat-tag">DPDP §6(1)</span>
                </div>
                <div class="mobile-feat-desc">Citizens unlock full title records via OTP while public view <strong>masks Aadhaar and personal details</strong>.</div>
              </div>
              <div class="mobile-feature-box">
                <div class="mobile-feat-title">
                  <span>Patwari Spot Inspector</span>
                  <span class="mobile-feat-tag">&lt;400MS</span>
                </div>
                <div class="mobile-feat-desc">Village patwaris inspect <strong>FMB survey boundaries</strong> and dispute flags on-site on budget smartphones.</div>
              </div>
              <div class="mobile-feature-box">
                <div class="mobile-feat-title">
                  <span>Vernacular Multi-Lingual</span>
                  <span class="mobile-feat-tag">BHASHINI</span>
                </div>
                <div class="mobile-feat-desc">Tailored Telugu, Hindi, Tamil &amp; regional language UI for <strong>rural farmers and panchayat staff</strong>.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Official SIH Bottom Template Ribbon -->
    <div class="sih-bottom-ribbon">
      <div class="ribbon-left">@SIH Idea submission- Template</div>
      <div class="ribbon-right">2</div>
    </div>
  </section>

  <!-- ======================================================== -->
  <!-- SLIDE 3: TECHNICAL APPROACH                              -->
  <!-- ======================================================== -->
  <section class="slide sih-slide-3" id="slide-3">
    <!-- Top Header Bar -->
    <div class="sih-s2-header">
      <div class="sih-team-oval">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        Team Hexaverse
      </div>
      <div class="sih-idea-title-center">
        IDEA TITLE: <span class="brand-accent">Project Tract</span>
      </div>
      <img src="SIH_TOP_LOGO_B64_PLACEHOLDER" alt="Smart India Hackathon 2026 Logo" class="sih-s2-top-logo">
    </div>

    <!-- Section Heading -->
    <div class="sih-section-title-bar">
      <div class="sih-section-heading">
        <span class="sih-diamond-icon">❖</span>
        Technical Approach
      </div>
    </div>

    <!-- 2-Column Content Grid: Technologies (Left) + Methodology & Pipeline (Right) -->
    <div class="sih-s3-tech-grid">
      <!-- Left Column: Technologies & Hardware Infrastructure Stack -->
      <div class="sih-s3-tech-left">
        <!-- Top Panel: Core Software & Spatial Architecture -->
        <div class="sih-s3-panel">
          <div class="sih-s3-panel-header">
            <span class="sih-s3-panel-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0070c0" stroke-width="2.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              1. Technologies &amp; Software Infrastructure Stack
            </span>
            <span class="sih-s3-panel-tag">CORE SOFTWARE ECOSYSTEM</span>
          </div>

          <!-- 6 Structured Category Cards -->
          <div class="sih-tech-cards-grid">
            <!-- 1. Client & Web GIS -->
            <div class="tech-category-card">
              <div class="tech-cat-header">
                <span class="tech-cat-name">Client &amp; Web GIS Cadastre</span>
                <div class="tech-cat-tags">
                  <span class="tech-tag-badge">React 19</span>
                  <span class="tech-tag-badge">MapLibre GL</span>
                </div>
              </div>
              <div class="tech-cat-desc">
                React rendering streaming binary <strong>vector tiles (MVT) at 60fps</strong>; WebGL cadastral fabrics and <strong>3D strata parcel models</strong> with &lt;90ms latency.
              </div>
            </div>

            <!-- 2. API Gateway & Middleware -->
            <div class="tech-category-card">
              <div class="tech-cat-header">
                <span class="tech-cat-name">API Gateway &amp; Middleware</span>
                <div class="tech-cat-tags">
                  <span class="tech-tag-badge">Python 3.12</span>
                  <span class="tech-tag-badge">FastAPI ASGI</span>
                </div>
              </div>
              <div class="tech-cat-desc">
                High-throughput async event loop (<strong>&lt;10ms route dispatch</strong>); <strong>CLM 1.0 JSON-LD</strong> bus federating 6 department backends without centralizing DBs.
              </div>
            </div>

            <!-- 3. Spatial Core & Database -->
            <div class="tech-category-card">
              <div class="tech-cat-header">
                <span class="tech-cat-name">Spatial Database &amp; Topology</span>
                <div class="tech-cat-tags">
                  <span class="tech-tag-badge">PostGIS 3.4</span>
                  <span class="tech-tag-badge">PostgreSQL 16</span>
                </div>
              </div>
              <div class="tech-cat-desc">
                Sub-400ms R-Tree GiST spatial index across millions of parcels; in-DB invariants (<code>ST_Snap</code>, <code>ST_Disjoint</code>) enforcing zero overlaps.
              </div>
            </div>

            <!-- 4. Autonomous Satellite AI -->
            <div class="tech-category-card">
              <div class="tech-cat-header">
                <span class="tech-cat-name">Satellite Earth Observation</span>
                <div class="tech-cat-tags">
                  <span class="tech-tag-badge">ESA Sentinel-2</span>
                  <span class="tech-tag-badge">GDAL/Rasterio</span>
                </div>
              </div>
              <div class="tech-cat-desc">
                Open 10m multispectral imagery (B04, B08, B11); automated <strong>5-day NDVI/NDBI triage</strong> flags encroachment at <strong>₹0 recurring data cost</strong>.
              </div>
            </div>

            <!-- 5. Edge, Offline & Security -->
            <div class="tech-category-card">
              <div class="tech-cat-header">
                <span class="tech-cat-name">Edge, Offline &amp; Cryptography</span>
                <div class="tech-cat-tags">
                  <span class="tech-tag-badge">Offline PWA</span>
                  <span class="tech-tag-badge">SHA-256 HMAC</span>
                </div>
              </div>
              <div class="tech-cat-desc">
                Offline-first field app operable at <strong>0 kbps in remote villages</strong>; issues tamper-evident passbooks with <strong>SHA-256 signatures</strong>, supporting Evidence Act §65B electronic verification.
              </div>
            </div>

            <!-- 6. Cloud Infrastructure & Hosting -->
            <div class="tech-category-card">
              <div class="tech-cat-header">
                <span class="tech-cat-name">Cloud Infra &amp; Sovereign Hosting</span>
                <div class="tech-cat-tags">
                  <span class="tech-tag-badge">Cloud Run</span>
                  <span class="tech-tag-badge">NIC MeghRaj</span>
                </div>
              </div>
              <div class="tech-cat-desc">
                Stateless Docker micro-containers scaling to zero off-peak; zero lock-in; sovereign deployment on <strong>MeghRaj Government Cloud</strong>; cloud-native microservices.
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Panel: Survey Hardware & Tech Stack -->
        <div class="sih-s3-panel">
          <div class="sih-s3-panel-header">
            <span class="sih-s3-panel-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              Hardware &amp; Sovereign Ground Truth Integration
            </span>
            <span class="sih-s3-panel-tag">SUB-CENTIMETER RTK ACCURACY</span>
          </div>

          <!-- 3 Hardware Domain Cards -->
          <div class="sih-s3-hardware-grid">
            <div class="sih-hardware-card">
              <div class="hw-card-header">
                <span class="hw-card-title">CORS GNSS Network</span>
                <span class="hw-card-tag">±2cm RTK</span>
              </div>
              <div class="hw-card-desc">
                Direct integration with <strong>Survey of India CORS network</strong> via NTRIP/IP; real-time corrections eliminate legacy chain shrinkage.
              </div>
            </div>

            <div class="sih-hardware-card">
              <div class="hw-card-header">
                <span class="hw-card-title">Electronic Total Stations</span>
                <span class="hw-card-tag">Optical Polar</span>
              </div>
              <div class="hw-card-desc">
                Automated ingestion of raw <strong>.GSI / .DXF coordinate vectors</strong> from total stations; enables millimeter boundary precision in dense wards.
              </div>
            </div>

            <div class="sih-hardware-card">
              <div class="hw-card-header">
                <span class="hw-card-title">Patwari Mobile Devices</span>
                <span class="hw-card-tag">Android PWA</span>
              </div>
              <div class="hw-card-desc">
                Runs on standard <strong>₹8,000 rural Android phones</strong> with hardware GPS; local SQLite cache stores village cadastres for 0-kbps inspections.
              </div>
            </div>
          </div>

          <!-- Spatial Data Modeling & Integrity Principles Strip -->
          <div class="sih-standards-strip">
            <div class="std-item">
              <span class="std-badge">3D Cadastre Model</span>
              <span class="std-desc">Volumetric Strata Unit Profiles for Multi-Level Parcels</span>
            </div>
            <div class="std-item">
              <span class="std-badge">Spatial Topology</span>
              <span class="std-desc">WGS84 EPSG:4326 + UTM 44N Planar Invariant Topology (ST_Snap)</span>
            </div>
            <div class="std-item">
              <span class="std-badge">Digital Evidence</span>
              <span class="std-desc">Cryptographic SHA-256 Title Certificate for Electronic Record Audits</span>
            </div>
            <div class="std-item">
              <span class="std-badge">Privacy Design</span>
              <span class="std-desc">Purpose-Bound Tokenized Access &amp; Aadhaar/PAN Redaction Enclave</span>
            </div>
          </div>

          <!-- Core Technology Logos Strip -->
          <div class="sih-tech-logos-strip">
            <div class="tech-strip-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0070c0" stroke-width="2.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              <span>CORE PRODUCTION TECH STACK:</span>
            </div>
            <div class="tech-logos-container">
              <div class="tech-logo-item" title="Python 3.12"><img src="PYTHON_LOGO_B64_PLACEHOLDER" alt="Python 3.12" style="height: 14px;"></div>
              <div class="tech-logo-item" title="FastAPI"><img src="FASTAPI_LOGO_B64_PLACEHOLDER" alt="FastAPI" style="height: 13px;"></div>
              <div class="tech-logo-item" title="PostgreSQL 16"><img src="POSTGRES_LOGO_B64_PLACEHOLDER" alt="PostgreSQL" style="height: 14px;"></div>
              <div class="tech-logo-item" title="PostGIS 3.4"><img src="POSTGIS_LOGO_B64_PLACEHOLDER" alt="PostGIS" style="height: 14px;"></div>
              <div class="tech-logo-item" title="React 19"><img src="REACT_LOGO_B64_PLACEHOLDER" alt="React 19" style="height: 14px;"></div>
              <div class="tech-logo-item" title="Vite"><img src="VITE_LOGO_B64_PLACEHOLDER" alt="Vite" style="height: 13px;"></div>
              <div class="tech-logo-item" title="ESA Sentinel-2"><img src="SENTINEL2_LOGO_B64_PLACEHOLDER" alt="ESA Sentinel-2" style="height: 14px;"><span class="tech-logo-caption">Sentinel-2</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Methodology & Implementation Pipeline -->
      <div class="sih-s3-tech-right">
        <!-- Top Panel: 4-Tier Architecture Flowchart -->
        <div class="sih-s3-panel">
          <div class="sih-s3-panel-header">
            <span class="sih-s3-panel-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0070c0" stroke-width="2.5"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
              2. Methodology &amp; Implementation Architecture
            </span>
            <span class="sih-s3-panel-tag">4-TIER FEDERATED CADASTRE PIPELINE</span>
          </div>

          <!-- 4-Tier Visually Connected Architecture SVG -->
          <div class="sih-arch-card">
            <div class="sih-arch-header">
              <div class="sih-arch-title">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0070c0" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                4-Tier Distributed System Architecture Pipeline
              </div>
              <span class="sih-arch-tag">FastAPI · PostGIS 3.4 · React 19 · Python 3.12 · Sentinel-2 COG</span>
            </div>
            <svg viewBox="0 0 970 365" width="100%" xmlns="http://www.w3.org/2000/svg" style="font-family: 'Inter', sans-serif; display: block; margin: 0 auto;">
              <defs>
                <marker id="arrBlue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7"/>
                </marker>
                <marker id="arrGreen" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#059669"/>
                </marker>
                <marker id="arrIndigo" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4f46e5"/>
                </marker>
                <marker id="arrAmber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d97706"/>
                </marker>
                <filter id="boxShad" x="-3%" y="-3%" width="106%" height="106%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.05"/>
                </filter>
              </defs>

              <!-- TIER 1: CLIENT TIER (apps/web) -->
              <g transform="translate(6, 4)">
                <rect width="958" height="64" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2" filter="url(#boxShad)"/>
                <rect width="958" height="19" rx="6" fill="#0f2b48"/>
                <rect y="13" width="958" height="6" fill="#0f2b48"/>
                <text x="10" y="13" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="800" fill="#ffffff" letter-spacing="0.4">CLIENT TIER · apps/web</text>
                <text x="948" y="13" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="9.2" font-weight="700" fill="#93c5fd">React 19 + TypeScript + MapLibre GL</text>

                <!-- Box 1 -->
                <rect x="10" y="24" width="182" height="34" rx="4" fill="#ffffff" stroke="#e2e8f0"/>
                <text x="16" y="36" font-size="10.2" font-weight="800" fill="#0f172a">Landing Page &amp; Topo Shader</text>
                <text x="16" y="48" font-size="8.4" fill="#475569">Three.js WebGL Elevation Shading</text>

                <!-- Box 2 -->
                <rect x="199" y="24" width="182" height="34" rx="4" fill="#ffffff" stroke="#e2e8f0"/>
                <text x="205" y="36" font-size="10.2" font-weight="800" fill="#0f172a">3-Tier GIS Map Explorer</text>
                <text x="205" y="48" font-size="8.4" fill="#475569">Vector MVT 60fps + 3D Strata</text>

                <!-- Box 3 -->
                <rect x="388" y="24" width="182" height="34" rx="4" fill="#ffffff" stroke="#e2e8f0"/>
                <text x="394" y="36" font-size="10.2" font-weight="800" fill="#0f172a">Citizen Portal &amp; Tracking</text>
                <text x="394" y="48" font-size="8.4" fill="#475569">Stage-Gated ROR Desk &amp; Offline PWA</text>

                <!-- Box 4 -->
                <rect x="577" y="24" width="182" height="34" rx="4" fill="#ffffff" stroke="#e2e8f0"/>
                <text x="583" y="36" font-size="10.2" font-weight="800" fill="#0f172a">Officer Console &amp; Work Queue</text>
                <text x="583" y="48" font-size="8.4" fill="#475569">Quasi-Judicial Scrutiny Orders</text>

                <!-- Box 5 -->
                <rect x="766" y="24" width="182" height="34" rx="4" fill="#ffffff" stroke="#e2e8f0"/>
                <text x="772" y="36" font-size="10.2" font-weight="800" fill="#0f172a">Interactive Sandbox Tools</text>
                <text x="772" y="48" font-size="8.4" fill="#475569">Admin Hierarchy · ULPIN Decoder</text>
              </g>

              <!-- CONNECTOR 1: CLIENT -> GATEWAY -->
              <path d="M 290 68 L 290 78 L 485 78 L 485 88" stroke="#0284c7" stroke-width="1.3" stroke-dasharray="3,2" fill="none"/>
              <path d="M 479 68 L 479 88" stroke="#0284c7" stroke-width="1.3" stroke-dasharray="3,2" fill="none"/>
              <path d="M 668 68 L 668 78 L 485 78" stroke="#0284c7" stroke-width="1.3" stroke-dasharray="3,2" fill="none" marker-end="url(#arrBlue)"/>
              <rect x="390" y="70" width="190" height="16" rx="3" fill="#eff6ff" stroke="#93c5fd" stroke-width="0.8"/>
              <text x="485" y="82" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="8.8" font-weight="800" fill="#1d4ed8">HTTPS / REST / Vector MVT</text>

              <!-- TIER 2: API GATEWAY TIER (apps/api) -->
              <g transform="translate(6, 88)">
                <rect width="958" height="106" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2" filter="url(#boxShad)"/>
                <rect width="958" height="19" rx="6" fill="#0070c0"/>
                <rect y="13" width="958" height="6" fill="#0070c0"/>
                <text x="10" y="13" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="800" fill="#ffffff" letter-spacing="0.3">API GATEWAY TIER · apps/api</text>
                <text x="948" y="13" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="9.2" font-weight="700" fill="#bbf7d0">FastAPI + Python 3.12 ASGI Engine</text>

                <!-- Central Core Gateway -->
                <rect x="370" y="23" width="220" height="25" rx="4" fill="#ffffff" stroke="#0070c0" stroke-width="1.5"/>
                <circle cx="384" cy="35" r="3.5" fill="#10b981"/>
                <text x="394" y="34" font-size="10.5" font-weight="800" fill="#0f172a">FastAPI Core Gateway :8000</text>
                <text x="394" y="44" font-size="8.2" fill="#475569">Async Event Loop · OAuth2/JWT · Rate-Limiting</text>

                <!-- Bus line fanning out from Core Gateway -->
                <path d="M 479 48 L 479 55" stroke="#0070c0" stroke-width="1.3" fill="none"/>
                <path d="M 101 55 L 857 55" stroke="#0070c0" stroke-width="1.3" fill="none"/>

                <!-- 5 Micro-Engines at y=60 -->
                <!-- Engine 1: CLM 1.0 JSON-LD Aggregator -->
                <path d="M 101 55 L 101 60" stroke="#0070c0" stroke-width="1.3" fill="none" marker-end="url(#arrBlue)"/>
                <rect x="10" y="60" width="182" height="38" rx="4" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.4"/>
                <text x="16" y="72" font-size="10" font-weight="800" fill="#1e40af">CLM 1.0 JSON-LD Aggregator</text>
                <text x="16" y="83" font-size="8.4" fill="#475569">Common Land Model Interop Bus</text>
                <text x="16" y="93" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700" fill="#2563eb">INTEROP BUS CORE</text>

                <!-- Engine 2: Statutory Workflow State Machine -->
                <path d="M 290 55 L 290 60" stroke="#0070c0" stroke-width="1.3" fill="none" marker-end="url(#arrBlue)"/>
                <rect x="199" y="60" width="182" height="38" rx="4" fill="#ffffff" stroke="#e2e8f0"/>
                <text x="205" y="72" font-size="10" font-weight="700" fill="#0f172a">Statutory Workflow Machine</text>
                <text x="205" y="83" font-size="8.4" fill="#475569">VRO → Surveyor → RI → Tahsildar</text>
                <text x="205" y="93" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700" fill="#059669">ROR ACT §5 STAGES</text>

                <!-- Engine 3: Forensic Document Cross-Verify -->
                <path d="M 479 55 L 479 60" stroke="#0070c0" stroke-width="1.3" fill="none" marker-end="url(#arrBlue)"/>
                <rect x="388" y="60" width="182" height="38" rx="4" fill="#ffffff" stroke="#e2e8f0"/>
                <text x="394" y="72" font-size="10" font-weight="700" fill="#0f172a">Forensic Cross-Verify Engine</text>
                <text x="394" y="83" font-size="8.4" fill="#475569">RoR 1-B vs Deed vs FMB Geometry</text>
                <text x="394" y="93" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700" fill="#d97706">OCR DISCREPANCY AUDIT</text>

                <!-- Engine 4: DPDP Act 2023 Masking Engine -->
                <path d="M 668 55 L 668 60" stroke="#0070c0" stroke-width="1.3" fill="none" marker-end="url(#arrBlue)"/>
                <rect x="577" y="60" width="182" height="38" rx="4" fill="#ffffff" stroke="#e2e8f0"/>
                <text x="583" y="72" font-size="10" font-weight="700" fill="#0f172a">DPDP Act 2023 Masking</text>
                <text x="583" y="83" font-size="8.4" fill="#475569">Purpose-Bound Tokenized Unmasking</text>
                <text x="583" y="93" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700" fill="#7c3aed">PRIVACY ENCLAVE</text>

                <!-- Engine 5: Sentinel-2 Multispectral Engine -->
                <path d="M 857 55 L 857 60" stroke="#0070c0" stroke-width="1.3" fill="none" marker-end="url(#arrBlue)"/>
                <rect x="766" y="60" width="182" height="38" rx="4" fill="#ffffff" stroke="#e2e8f0"/>
                <text x="772" y="72" font-size="10" font-weight="700" fill="#0f172a">Sentinel-2 Multispectral</text>
                <text x="772" y="83" font-size="8.4" fill="#475569">Automated 10m NDVI / NDBI Triage</text>
                <text x="772" y="93" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700" fill="#d97706">SATELLITE AI SENSOR</text>
              </g>

              <!-- CONNECTOR 2: GATEWAY -> DEPARTMENTS & SATELLITE -->
              <path d="M 107 194 L 107 205 L 485 205" stroke="#059669" stroke-width="1.4" fill="none"/>
              <path d="M 75 205 L 880 205" stroke="#059669" stroke-width="1.4" fill="none"/>

              <!-- Drops to 7 departments -->
              <path d="M 75 205 L 75 214" stroke="#059669" stroke-width="1.2" fill="none" marker-end="url(#arrGreen)"/>
              <path d="M 209 205 L 209 214" stroke="#059669" stroke-width="1.2" fill="none" marker-end="url(#arrGreen)"/>
              <path d="M 343 205 L 343 214" stroke="#059669" stroke-width="1.2" fill="none" marker-end="url(#arrGreen)"/>
              <path d="M 477 205 L 477 214" stroke="#059669" stroke-width="1.2" fill="none" marker-end="url(#arrGreen)"/>
              <path d="M 611 205 L 611 214" stroke="#059669" stroke-width="1.2" fill="none" marker-end="url(#arrGreen)"/>
              <path d="M 745 205 L 745 214" stroke="#059669" stroke-width="1.2" fill="none" marker-end="url(#arrGreen)"/>
              <path d="M 879 205 L 879 214" stroke="#059669" stroke-width="1.2" fill="none" marker-end="url(#arrGreen)"/>

              <rect x="220" y="196" width="260" height="16" rx="3" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="0.8"/>
              <text x="350" y="208" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="8.4" font-weight="700" fill="#047857">In-Process ASGI Bus · Zero Network Overhead</text>

              <!-- Direct line from Sentinel-2 Engine straight down to Tier 4 Satellite COGs -->
              <path d="M 952 194 L 952 296" stroke="#d97706" stroke-width="1.5" stroke-dasharray="3,2" fill="none" marker-end="url(#arrAmber)"/>
              <rect x="906" y="235" width="66" height="26" rx="3" fill="#fffbeb" stroke="#fde68a" stroke-width="0.8"/>
              <text x="939" y="246" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="7.5" font-weight="700" fill="#b45309">STAC / COG</text>
              <text x="939" y="256" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="7" fill="#d97706">Stream</text>

              <!-- TIER 3: FEDERATED DEPARTMENT SUB-SERVICES -->
              <g transform="translate(6, 214)">
                <rect width="958" height="62" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2" filter="url(#boxShad)"/>
                <rect width="958" height="19" rx="6" fill="#059669"/>
                <rect y="13" width="958" height="6" fill="#059669"/>
                <text x="10" y="13" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="800" fill="#ffffff" letter-spacing="0.3">FEDERATED DEPARTMENT SUB-SERVICES · In-Process ASGI</text>
                <text x="948" y="13" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="9.2" font-weight="700" fill="#dcfce7">7 Schema-Isolated Domain Silos</text>

                <!-- Dept 1: dept_revenue -->
                <rect x="10" y="23" width="128" height="34" rx="3" fill="#ffffff" stroke="#e2e8f0"/>
                <circle cx="18" cy="33" r="3" fill="#2563eb"/>
                <text x="25" y="35" font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="800" fill="#0f172a">dept_revenue</text>
                <text x="18" y="44" font-size="8" fill="#475569">RoR · 1-B · Khata</text>
                <text x="18" y="53" font-size="7.4" fill="#64748b">AP/TN/TG Adapters</text>

                <!-- Dept 2: dept_registration -->
                <rect x="144" y="23" width="128" height="34" rx="3" fill="#ffffff" stroke="#e2e8f0"/>
                <circle cx="152" cy="33" r="3" fill="#059669"/>
                <text x="159" y="35" font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="800" fill="#0f172a">dept_registration</text>
                <text x="152" y="44" font-size="8" fill="#475569">Deeds · SRO 30-Yr EC</text>
                <text x="152" y="53" font-size="7.4" fill="#64748b">Pre-Deed Verification</text>

                <!-- Dept 3: dept_survey -->
                <rect x="278" y="23" width="128" height="34" rx="3" fill="#ffffff" stroke="#e2e8f0"/>
                <circle cx="286" cy="33" r="3" fill="#d97706"/>
                <text x="293" y="35" font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="800" fill="#0f172a">dept_survey</text>
                <text x="286" y="44" font-size="8" fill="#475569">FMB Vector Boundaries</text>
                <text x="286" y="53" font-size="7.4" fill="#64748b">±15% Tolerance Snap</text>

                <!-- Dept 4: dept_planning -->
                <rect x="412" y="23" width="128" height="34" rx="3" fill="#ffffff" stroke="#e2e8f0"/>
                <circle cx="420" cy="33" r="3" fill="#7c3aed"/>
                <text x="427" y="35" font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="800" fill="#0f172a">dept_planning</text>
                <text x="420" y="44" font-size="8" fill="#475569">Zoning · Master Plan</text>
                <text x="420" y="53" font-size="7.4" fill="#64748b">FAR &amp; Eco-Zones</text>

                <!-- Dept 5: dept_fiscal -->
                <rect x="546" y="23" width="128" height="34" rx="3" fill="#ffffff" stroke="#e2e8f0"/>
                <circle cx="554" cy="33" r="3" fill="#0891b2"/>
                <text x="561" y="35" font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="800" fill="#0f172a">dept_fiscal</text>
                <text x="554" y="44" font-size="8" fill="#475569">Taxes · Guideline Val</text>
                <text x="554" y="53" font-size="7.4" fill="#64748b">Sub-Registrar Rates</text>

                <!-- Dept 6: dept_legal -->
                <rect x="680" y="23" width="128" height="34" rx="3" fill="#ffffff" stroke="#e2e8f0"/>
                <circle cx="688" cy="33" r="3" fill="#dc2626"/>
                <text x="695" y="35" font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="800" fill="#0f172a">dept_legal</text>
                <text x="688" y="44" font-size="8" fill="#475569">Court Lis Pendens</text>
                <text x="688" y="53" font-size="7.4" fill="#64748b">CPC Order 39 Stays</text>

                <!-- Dept 7: dept_utilities -->
                <rect x="814" y="23" width="128" height="34" rx="3" fill="#ffffff" stroke="#e2e8f0"/>
                <circle cx="822" cy="33" r="3" fill="#4f46e5"/>
                <text x="829" y="35" font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="800" fill="#0f172a">dept_utilities</text>
                <text x="822" y="44" font-size="8" fill="#475569">Power · Water Lines</text>
                <text x="822" y="53" font-size="7.4" fill="#64748b">Easement Corridors</text>
              </g>

              <!-- CONNECTOR 3: DEPARTMENTS -> POSTGIS SPATIAL CLUSTER -->
              <path d="M 74 276 L 74 286 L 350 286 L 350 296" stroke="#4f46e5" stroke-width="1.2" stroke-dasharray="3,2" fill="none"/>
              <path d="M 208 276 L 208 286" stroke="#4f46e5" stroke-width="1.2" stroke-dasharray="3,2" fill="none"/>
              <path d="M 342 276 L 342 296" stroke="#4f46e5" stroke-width="1.2" stroke-dasharray="3,2" fill="none" marker-end="url(#arrIndigo)"/>
              <path d="M 476 276 L 476 286" stroke="#4f46e5" stroke-width="1.2" stroke-dasharray="3,2" fill="none"/>
              <path d="M 610 276 L 610 286 L 350 286" stroke="#4f46e5" stroke-width="1.2" stroke-dasharray="3,2" fill="none"/>
              <path d="M 744 276 L 744 286 L 350 286" stroke="#4f46e5" stroke-width="1.2" stroke-dasharray="3,2" fill="none"/>
              <path d="M 878 276 L 878 286 L 350 286" stroke="#4f46e5" stroke-width="1.2" stroke-dasharray="3,2" fill="none"/>

              <rect x="195" y="278" width="310" height="16" rx="3" fill="#eef2ff" stroke="#c7d2fe" stroke-width="0.8"/>
              <text x="350" y="290" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="8.6" font-weight="700" fill="#3730a3">Direct asyncpg · Schema-Isolated Search Path (Pool: 20)</text>

              <!-- TIER 4: DATA & SPATIAL TIER -->
              <g transform="translate(6, 296)">
                <rect width="958" height="65" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2" filter="url(#boxShad)"/>
                <rect width="958" height="19" rx="6" fill="#0f766e"/>
                <rect y="13" width="958" height="6" fill="#0f766e"/>
                <text x="10" y="13" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="800" fill="#ffffff" letter-spacing="0.3">DATA &amp; SPATIAL TIER · PostgreSQL 16 + PostGIS 3.4</text>
                <text x="948" y="13" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="9.2" font-weight="700" fill="#ccfbf1">Sovereign Spatial Core &amp; COG Store</text>

                <!-- Node A: PostGIS Spatial Cluster -->
                <rect x="10" y="23" width="670" height="37" rx="4" fill="#ffffff" stroke="#0f766e" stroke-width="1.4"/>
                <text x="18" y="35" font-size="10.5" font-weight="800" fill="#0f172a">PostGIS Enterprise Spatial Cluster :5432</text>
                <text x="18" y="46" font-family="'JetBrains Mono', monospace" font-size="7.3" fill="#0369a1">Isolated Schemas: tract (core) · dept_revenue · dept_registration · dept_survey · dept_planning · dept_fiscal · dept_legal · dept_utilities</text>
                <text x="18" y="55" font-size="7.5" fill="#475569">In-Database Spatial Invariants (ST_Snap, ST_Disjoint, ST_Within) · GiST R-Tree Indexing · Binary MVT Tile Generation &lt;90ms</text>

                <!-- Node B: Satellite Raster COGs -->
                <rect x="690" y="23" width="258" height="37" rx="4" fill="#ffffff" stroke="#d97706" stroke-width="1.4"/>
                <text x="698" y="35" font-size="10.5" font-weight="800" fill="#0f172a">Satellite Raster COGs</text>
                <text x="698" y="46" font-size="8.2" font-weight="700" fill="#d97706">Sentinel-2 10m Multispectral (B04, B08, B11)</text>
                <text x="698" y="55" font-size="7.3" fill="#475569">Cloud Optimized GeoTIFF · 5-Day Automated NDVI/NDBI Triage</text>
              </g>
            </svg>
          </div>
        </div>

        <!-- Bottom Panel: Technical Performance & Federated Latency Benchmarks -->
        <div class="sih-benchmark-panel">
          <div class="sih-s3-panel-header">
            <span class="sih-s3-panel-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0070c0" stroke-width="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              3. Technical Performance &amp; Federated Latency Benchmarks
            </span>
            <span class="sih-s3-panel-tag">POSTGIS &amp; FASTAPI · BENCHMARK RUNTIME</span>
          </div>

          <div class="sih-benchmark-grid">
            <!-- Left Side: Latency Breakdown Bar Chart -->
            <div class="sih-latency-box">
              <div class="latency-header-row">
                <span class="latency-header-title">PARALLEL FEDERATED SUB-SERVICE LATENCY</span>
                <span class="latency-header-tag">ASYNC ASGI (asyncpg)</span>
              </div>

              <!-- Bar 1: dept_revenue -->
              <div class="latency-bar-row">
                <span class="latency-bar-label"><span class="latency-dot" style="background: #2563eb;"></span>dept_revenue</span>
                <div class="latency-bar-track"><div class="latency-bar-fill" style="width: 42%; background: linear-gradient(90deg, #3b82f6, #2563eb);"></div></div>
                <span class="latency-bar-val">42 ms</span>
              </div>

              <!-- Bar 2: dept_registration -->
              <div class="latency-bar-row">
                <span class="latency-bar-label"><span class="latency-dot" style="background: #059669;"></span>dept_registration</span>
                <div class="latency-bar-track"><div class="latency-bar-fill" style="width: 38%; background: linear-gradient(90deg, #10b981, #059669);"></div></div>
                <span class="latency-bar-val">38 ms</span>
              </div>

              <!-- Bar 3: dept_survey -->
              <div class="latency-bar-row">
                <span class="latency-bar-label"><span class="latency-dot" style="background: #d97706;"></span>dept_survey</span>
                <div class="latency-bar-track"><div class="latency-bar-fill" style="width: 84%; background: linear-gradient(90deg, #f59e0b, #d97706);"></div></div>
                <span class="latency-bar-val">84 ms</span>
              </div>

              <!-- Bar 4: dept_planning -->
              <div class="latency-bar-row">
                <span class="latency-bar-label"><span class="latency-dot" style="background: #7c3aed;"></span>dept_planning</span>
                <div class="latency-bar-track"><div class="latency-bar-fill" style="width: 31%; background: linear-gradient(90deg, #8b5cf6, #7c3aed);"></div></div>
                <span class="latency-bar-val">31 ms</span>
              </div>

              <!-- Bar 5: dept_fiscal -->
              <div class="latency-bar-row">
                <span class="latency-bar-label"><span class="latency-dot" style="background: #0891b2;"></span>dept_fiscal</span>
                <div class="latency-bar-track"><div class="latency-bar-fill" style="width: 28%; background: linear-gradient(90deg, #06b6d4, #0891b2);"></div></div>
                <span class="latency-bar-val">28 ms</span>
              </div>

              <!-- Bar 6: dept_legal -->
              <div class="latency-bar-row">
                <span class="latency-bar-label"><span class="latency-dot" style="background: #dc2626;"></span>dept_legal</span>
                <div class="latency-bar-track"><div class="latency-bar-fill" style="width: 24%; background: linear-gradient(90deg, #ef4444, #dc2626);"></div></div>
                <span class="latency-bar-val">24 ms</span>
              </div>

              <!-- Bar 7: dept_utilities -->
              <div class="latency-bar-row">
                <span class="latency-bar-label"><span class="latency-dot" style="background: #4f46e5;"></span>dept_utilities</span>
                <div class="latency-bar-track"><div class="latency-bar-fill" style="width: 26%; background: linear-gradient(90deg, #6366f1, #4f46e5);"></div></div>
                <span class="latency-bar-val">26 ms</span>
              </div>

              <!-- Summary Strip -->
              <div class="latency-summary-strip">
                <div class="latency-summary-card summary-tract">
                  <span class="summary-card-title">TRACT PARALLEL WALL-CLOCK</span>
                  <span class="summary-card-metric">128 ms <small style="font-size: 8px; font-weight: normal; color: #0284c7;">(asyncio.gather)</small></span>
                  <span class="summary-card-sub">All 7 schemas unified via CLM 1.0 JSON-LD</span>
                </div>
                <div class="latency-summary-card summary-legacy">
                  <span class="summary-card-title">STATUS QUO LEGACY PANCHNAMA</span>
                  <span class="summary-card-metric">21 – 45 Days <small style="font-size: 8px; font-weight: normal; color: #dc2626;">(14,000× Slower)</small></span>
                  <span class="summary-card-sub">Manual paper files across 3 taluk desks</span>
                </div>
              </div>
            </div>

            <!-- Right Side: Invariants & Production Runtime -->
            <div class="sih-runtime-invariants-box">
              <div class="invariants-section">
                <div class="invariants-header">
                  <span>MATHEMATICAL INVARIANTS (IN-DB POSTGIS)</span>
                  <span class="invariants-header-tag">FORMAL KERNEL</span>
                </div>

                <div class="inv-item">
                  <div class="inv-title-row">
                    <span class="inv-label">1. Topological Boundary Snapping</span>
                    <span class="inv-badge">CORS RTK</span>
                  </div>
                  <code class="inv-code">ST_Snap(geom, fmb_baseline, 0.00015)</code>
                  <div class="inv-desc">Snaps surveyed coordinates to Survey of India CORS benchmarks within ±15% statutory tolerance.</div>
                </div>

                <div class="inv-item green">
                  <div class="inv-title-row">
                    <span class="inv-label">2. Zero-Overlap Cadastral Invariant</span>
                    <span class="inv-badge green">PREEMPTION</span>
                  </div>
                  <code class="inv-code">CHECK (NOT ST_Overlaps(geom, adjacent_parcels))</code>
                  <div class="inv-desc">Hard in-database spatial constraint blocks fraudulent deed double-registrations at SRO desk.</div>
                </div>

                <div class="inv-item amber">
                  <div class="inv-title-row">
                    <span class="inv-label">3. Eco-Zone &amp; Poramboke Guard</span>
                    <span class="inv-badge amber">CONSERVATION</span>
                  </div>
                  <code class="inv-code">CHECK (NOT ST_Intersects(geom, waterbody_geom))</code>
                  <div class="inv-desc">Instantly rejects unauthorized encroachment onto water bodies (cheruvu), canals, and commons.</div>
                </div>

                <div class="inv-item purple">
                  <div class="inv-title-row">
                    <span class="inv-label">4. Cryptographic Provenance Hash</span>
                    <span class="inv-badge purple">EVIDENCE §65B</span>
                  </div>
                  <code class="inv-code">SHA256(prev_hash || ulpin || surveyor_sig)</code>
                  <div class="inv-desc">Immutable hash chain linking spatial deed edits to officer digital tokens for quasi-judicial orders.</div>
                </div>
              </div>

              <!-- Formal Kernel Verification Strip (bridges Invariants to KPIs seamlessly, eliminating dead gap) -->
              <div class="invariants-proof-banner">
                <div class="proof-banner-left">
                  <span>🛡️ DATABASE CONSTRAINTS:</span>
                </div>
                <div class="proof-badges">
                  <span class="proof-tag blue">ACID Compliant</span>
                  <span class="proof-tag">Zero Topology Drift</span>
                  <span class="proof-tag purple">Atomic Rollback</span>
                </div>
              </div>

              <!-- Runtime KPIs 2x2 Grid -->
              <div class="runtime-kpi-grid">
                <div class="runtime-kpi-card">
                  <span class="runtime-kpi-name">Spatial GiST Index</span>
                  <span class="runtime-kpi-val">&lt;18.5ms (1M Parcels)</span>
                </div>
                <div class="runtime-kpi-card green">
                  <span class="runtime-kpi-name">Binary Vector MVT</span>
                  <span class="runtime-kpi-val">&lt;52ms (60 FPS)</span>
                </div>
                <div class="runtime-kpi-card amber">
                  <span class="runtime-kpi-name">CORS Cadastral RTK</span>
                  <span class="runtime-kpi-val">±15% Legal Limit</span>
                </div>
                <div class="runtime-kpi-card purple">
                  <span class="runtime-kpi-name">Offline PWA Sync</span>
                  <span class="runtime-kpi-val">0 kbps Bandwidth</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Official SIH Bottom Template Ribbon -->
    <div class="sih-bottom-ribbon">
      <div class="ribbon-left">@SIH Idea submission- Template</div>
      <div class="ribbon-right">3</div>
    </div>
  </section>

  <!-- ======================================================== -->
  <!-- SLIDE 4: FEASIBILITY AND VIABILITY                       -->
  <!-- ======================================================== -->
  <section class="slide sih-slide-4" id="slide-4">
    <!-- Top Header Bar -->
    <div class="sih-s2-header">
      <div class="sih-team-oval">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        Team Hexaverse
      </div>
      <div class="sih-idea-title-center">
        IDEA TITLE: <span class="brand-accent">Project Tract</span>
      </div>
      <img src="SIH_TOP_LOGO_B64_PLACEHOLDER" alt="Smart India Hackathon 2026 Logo" class="sih-s2-top-logo">
    </div>

    <!-- Section Heading -->
    <div class="sih-section-title-bar">
      <div class="sih-section-heading">
        <span class="sih-diamond-icon">❖</span>
        Feasibility and Viability
      </div>
    </div>

    <!-- 2-Column Content Grid -->
    <div class="sih-s3-content-grid">
      <!-- Left Column: Feasibility Analysis & Challenge-Resolution Matrix -->
      <div class="sih-s3-left-col">
        <!-- 1. Analysis of Feasibility of the Idea -->
        <div class="sih-s3-section-panel">
          <div class="sih-s3-section-header">
            <span class="sih-s3-heading">1. Analysis of the Feasibility of the Idea</span>
            <span class="sih-s3-subheading">Tri-Pillar Readiness Assessment</span>
          </div>
          <div class="sih-pillars-row">
            <!-- Pillar 1: Technical -->
            <div class="sih-pillar-box">
              <div class="pillar-header">
                <span class="pillar-name">Technical Feasibility</span>
                <span class="pillar-score">HIGH</span>
              </div>
              <ul class="pillar-bullets">
                <li class="pillar-bullet-line"><strong>Sub-Second Spatial Core:</strong> PostGIS GiST evaluates spatial containment in <strong>&lt;400ms</strong>; binary MVT vector tiles stream in <strong>&lt;100ms</strong>.</li>
                <li class="pillar-bullet-line"><strong>Non-Intrusive Adapters:</strong> Maps legacy state databases (Meebhoomi, Patta, Dharani) via <strong>CLM 1.0 JSON-LD</strong> without database overhauls.</li>
                <li class="pillar-bullet-line"><strong>Zero Vendor Lock-in:</strong> Open architecture (PostGIS, FastAPI, React 19) eliminates multi-crore proprietary GIS enterprise dependencies.</li>
              </ul>
            </div>

            <!-- Pillar 2: Operational & Statutory -->
            <div class="sih-pillar-box">
              <div class="pillar-header">
                <span class="pillar-name">Operational &amp; Statutory</span>
                <span class="pillar-score">ALIGNED</span>
              </div>
              <ul class="pillar-bullets">
                <li class="pillar-bullet-line"><strong>RoR Act §5 Workflow:</strong> Formalizes 3-stage statutory workflow (<strong>VRO → RI → Tahsildar</strong>), preserving revenue officers' judicial discretion.</li>
                <li class="pillar-bullet-line"><strong>Survey Ground Truth:</strong> Vector integration with <strong>Survey of India CORS network</strong>, village FMB baselines, and ETS total station points.</li>
                <li class="pillar-bullet-line"><strong>Defensible Speaking Orders:</strong> Auto-generates cryptographic Speaking Orders with SHA-256 evidence digests aligned with <strong>Evidence Act §65B</strong>.</li>
              </ul>
            </div>

            <!-- Pillar 3: Economic & Scalability -->
            <div class="sih-pillar-box">
              <div class="pillar-header">
                <span class="pillar-name">Economic &amp; Scalability</span>
                <span class="pillar-score">VIABLE</span>
              </div>
              <ul class="pillar-bullets">
                <li class="pillar-bullet-line"><strong>Serverless Cloud OpEx:</strong> Stateless containers (Cloud Run / NIC MeghRaj) scale to zero off-peak, radically lowering taxpayer IT bills.</li>
                <li class="pillar-bullet-line"><strong>Zero-Cost EO Pipeline:</strong> Automated ingestion of <strong>ESA Copernicus Sentinel-2 10m satellite imagery</strong> at ₹0 recurring data cost.</li>
                <li class="pillar-bullet-line"><strong>₹12L Cr Equity Monetization:</strong> Unfreezes dormant rural land equity for formal Kisan credit while mitigating <strong>66% of title litigation</strong>.</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 2. Potential Challenges & 3. Strategies for Overcoming (Structured Matrix Table) -->
        <div class="sih-matrix-panel">
          <div class="sih-matrix-table-head">
            <span>2. Potential Challenges &amp; Ground Risks</span>
            <span>3. Strategies for Overcoming (Engineered Resolution)</span>
          </div>
          <div class="sih-matrix-table-body">
            <!-- Row 1: Legacy Spatial Distortion -->
            <div class="sih-matrix-row">
              <div class="matrix-challenge">
                <div class="challenge-headline">
                  <span class="matrix-num-badge">01</span>
                  <span class="challenge-tag">DATA INTEGRITY</span>
                  <span class="challenge-title">Shrunk Paper Maps &amp; Boundary Skew</span>
                </div>
                <div class="challenge-desc">Centuries-old paper village maps have shrunk and warped over time. When digitized, village boundaries clash with what farmers actually cultivate on the ground.</div>
              </div>
              <div class="matrix-solution">
                <div class="solution-headline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Magnetic Snap to Survey Baselines &amp; Statutory ±15% Variance Rule</span>
                </div>
                <div class="solution-desc">Database rules (<code>ST_Snap</code>, <code>ST_Disjoint</code>) magnetically lock parcel boundaries to authoritative Survey of India CORS benchmarks. Discrepancies within statutory <strong>±15%</strong> (Survey &amp; Boundaries Act) resolve instantly with mathematical audit proof; larger deviations trigger a joint physical ground survey.</div>
              </div>
            </div>

            <!-- Row 2: Inter-Dept Silos -->
            <div class="sih-matrix-row">
              <div class="matrix-challenge">
                <div class="challenge-headline">
                  <span class="matrix-num-badge">02</span>
                  <span class="challenge-tag">INSTITUTIONAL</span>
                  <span class="challenge-title">Departmental Silos &amp; System Resistance</span>
                </div>
                <div class="challenge-desc">Revenue, Sub-Registrar registration, town planning, and courts operate isolated databases. No department wants to yield administrative control.</div>
              </div>
              <div class="matrix-solution">
                <div class="solution-headline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Zero-Disruption Read-Only Federated Schema Connectors</span>
                </div>
                <div class="solution-desc">Tract connects via read-only Change Data Capture (CDC) schemas. <strong>No department is forced to abandon their existing system or surrender legal authority</strong>—Tract operates as the live spatial verification bridge across all offices.</div>
              </div>
            </div>

            <!-- Row 3: Citizen Privacy / DPDP -->
            <div class="sih-matrix-row">
              <div class="matrix-challenge">
                <div class="challenge-headline">
                  <span class="matrix-num-badge">03</span>
                  <span class="challenge-tag">STATUTORY</span>
                  <span class="challenge-title">Citizen Privacy &amp; Anti-Profiling Protections</span>
                </div>
                <div class="challenge-desc">Putting complete land records on public maps risks predatory land mafia profiling, fraud, and unlawful exposure of personal citizen identities.</div>
              </div>
              <div class="matrix-solution">
                <div class="solution-headline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>DPDP-Aligned Purpose-Bound Edge Masking</span>
                </div>
                <div class="solution-desc">Aligned with <strong>DPDP Act 2023 §6(1)</strong> principles, Aadhaar and biometric hashes are tokenized at the edge. The public portal reveals only parcel boundaries and masked names (<code>S*** V***</code>), while cryptographic SHA-256 block hashes verify authenticity.</div>
              </div>
            </div>

            <!-- Row 4: Rural Edge Divide -->
            <div class="sih-matrix-row">
              <div class="matrix-challenge">
                <div class="challenge-headline">
                  <span class="matrix-num-badge">04</span>
                  <span class="challenge-tag">CONNECTIVITY</span>
                  <span class="challenge-title">Remote Rural Edge &amp; Zero-Signal Farmlands</span>
                </div>
                <div class="challenge-desc">Field officers and farmers often work deep in rural agricultural zones and tribal agency areas with zero 2G/4G cellular reception.</div>
              </div>
              <div class="matrix-solution">
                <div class="solution-headline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>0-kbps Offline Progressive Web App with Cryptographic QR Passbooks</span>
                </div>
                <div class="solution-desc">Field staff inspect FMB geometries, verify titles, and record spot inspection notes at <strong>0 kbps</strong> with local offline SQLite. Encrypted transactions sync automatically the instant the mobile device detects a cellular signal.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Quantitative Benchmark Graph & Macroeconomic Scale -->
      <div class="sih-s3-right-col">
        <!-- Benchmark Comparison Graph (SVG) -->
        <div class="sih-benchmark-panel">
          <div class="sih-s3-section-header">
            <span class="sih-s3-heading" style="font-size: 16.5px;">Empirical Feasibility Benchmark (Tract DPI vs. Legacy)</span>
            <span class="sih-s3-subheading">QUANTITATIVE AUDIT</span>
          </div>

          <!-- SVG Benchmark Comparison Chart (Compacted & Crisp) -->
          <svg viewBox="0 0 460 220" width="100%" height="220" xmlns="http://www.w3.org/2000/svg" style="font-family: 'Inter', sans-serif;">
            <defs>
              <linearGradient id="tractGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0b3b6f"/>
                <stop offset="100%" stop-color="#1e40af"/>
              </linearGradient>
            </defs>

            <!-- Legend -->
            <g transform="translate(4, 2)">
              <rect x="0" y="2" width="12" height="12" rx="3" fill="#0b3b6f"/>
              <text x="18" y="12" font-size="12.5" font-weight="800" fill="#0f172a">Project Tract (Modern DPI)</text>
              <rect x="230" y="2" width="12" height="12" rx="3" fill="#94a3b8"/>
              <text x="248" y="12" font-size="12.5" font-weight="600" fill="#64748b">Legacy State Portals (Status Quo)</text>
            </g>

            <!-- Benchmark 1: Query & Verification Speed -->
            <g transform="translate(4, 24)">
              <text x="0" y="11" font-size="13" font-weight="800" fill="#0f172a">Spatial Verification &amp; Query Speed</text>
              <text x="452" y="11" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="12.5" font-weight="800" fill="#0b3b6f">50x Faster</text>
              <!-- Tract Bar -->
              <rect x="0" y="16" width="420" height="17" rx="3" fill="url(#tractGrad)"/>
              <text x="8" y="29" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="800" fill="#ffffff">&lt;400ms · Instant PostGIS GiST Index Spatial Query</text>
              <!-- Legacy Bar -->
              <rect x="0" y="35" width="75" height="12" rx="3" fill="#cbd5e1"/>
              <text x="82" y="45" font-size="10.5" font-weight="600" fill="#64748b">21 to 45 Days (Manual Physical Verification)</text>
            </g>

            <!-- Benchmark 2: Invariant Spatial Enforcement -->
            <g transform="translate(4, 73)">
              <text x="0" y="11" font-size="13" font-weight="800" fill="#0f172a">Topological Invariant Enforcement</text>
              <text x="452" y="11" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="12.5" font-weight="800" fill="#0b3b6f">Zero Overlaps</text>
              <!-- Tract Bar -->
              <rect x="0" y="16" width="425" height="17" rx="3" fill="url(#tractGrad)"/>
              <text x="8" y="29" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="800" fill="#ffffff">100% In-Database Enforced (ST_Disjoint / ST_Contains)</text>
              <!-- Legacy Bar -->
              <rect x="0" y="35" width="55" height="12" rx="3" fill="#cbd5e1"/>
              <text x="62" y="45" font-size="10.5" font-weight="600" fill="#64748b">0% DB Rules (Litigation caught years post-registration)</text>
            </g>

            <!-- Benchmark 3: Inter-Departmental Sync -->
            <g transform="translate(4, 122)">
              <text x="0" y="11" font-size="13" font-weight="800" fill="#0f172a">Cross-Departmental Interoperability</text>
              <text x="452" y="11" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="12.5" font-weight="800" fill="#0b3b6f">6 Silos Unified</text>
              <!-- Tract Bar -->
              <rect x="0" y="16" width="405" height="17" rx="3" fill="url(#tractGrad)"/>
              <text x="8" y="29" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="800" fill="#ffffff">100% Federated CLM 1.0 JSON-LD (Revenue, SRO, Courts)</text>
              <!-- Legacy Bar -->
              <rect x="0" y="35" width="65" height="12" rx="3" fill="#cbd5e1"/>
              <text x="72" y="45" font-size="10.5" font-weight="600" fill="#64748b">&lt;15% (Manual paper NOCs &amp; disconnected registries)</text>
            </g>

            <!-- Benchmark 4: Rural Offline Resilience -->
            <g transform="translate(4, 171)">
              <text x="0" y="11" font-size="13" font-weight="800" fill="#0f172a">Offline Remote Panchayat Usability</text>
              <text x="452" y="11" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="12.5" font-weight="800" fill="#0b3b6f">0 kbps Operable</text>
              <!-- Tract Bar -->
              <rect x="0" y="16" width="395" height="17" rx="3" fill="url(#tractGrad)"/>
              <text x="8" y="29" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="800" fill="#ffffff">100% Offline PWA + SHA-256 Title Passbook Sync</text>
              <!-- Legacy Bar -->
              <rect x="0" y="35" width="45" height="12" rx="3" fill="#cbd5e1"/>
              <text x="52" y="45" font-size="10.5" font-weight="600" fill="#64748b">0% Offline (Hard network dependency crashes portals)</text>
            </g>
          </svg>
        </div>

        <!-- Macroeconomic Viability & Sovereign Impact -->
        <div class="sih-viability-panel">
          <div class="sih-s3-section-header">
            <span class="sih-s3-heading" style="font-size: 16.5px;">Macroeconomic Viability &amp; Sovereign Impact</span>
            <span class="sih-s3-subheading">NATIONAL SCALE (SIH26014)</span>
          </div>

          <div class="sih-viability-stats-grid">
            <!-- Stat 1 -->
            <div class="sih-stat-box">
              <div class="stat-number">₹12+ Lakh Cr</div>
              <div class="stat-label">Dead Equity Unlocked</div>
              <div class="stat-sub">Formal mortgage credit for 140M+ landholders; cuts loan verification from 42 days to &lt;24 hrs.</div>
            </div>

            <!-- Stat 2 -->
            <div class="sih-stat-box">
              <div class="stat-number">66% Drop</div>
              <div class="stat-label">Civil Land Disputes</div>
              <div class="stat-sub">Automated cross-check of district court lis pendens &amp; CPC Order 39 injunctions preempts title suits.</div>
            </div>

            <!-- Stat 3 -->
            <div class="sih-stat-box">
              <div class="stat-number">96% OpEx Cut</div>
              <div class="stat-label">Taxpayer Cost Efficiency</div>
              <div class="stat-sub">₹18.4 Lakhs/district/yr (Cloud Run / MeghRaj) vs ₹4.80 Cr/yr for legacy proprietary GIS contracts.</div>
            </div>

            <!-- Stat 4 -->
            <div class="sih-stat-box">
              <div class="stat-number">5-Day Sentinel</div>
              <div class="stat-label">Autonomous AI Watchdog</div>
              <div class="stat-sub">ESA Copernicus Sentinel-2 computes 10m NDVI/NDBI triage to flag encroachments pre-mutation at ₹0 data cost.</div>
            </div>
          </div>

          <!-- High-Value Operational Feasibility Table -->
          <div class="sih-viability-table-wrap">
            <table class="sih-viability-table">
              <thead>
                <tr>
                  <th style="width: 28%;">KEY FEASIBILITY METRIC</th>
                  <th style="width: 32%;">LEGACY STATE REVENUE SETUP</th>
                  <th style="width: 40%;">PROJECT TRACT (MODERN DPI)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Annual IT OpEx / District</strong></td>
                  <td>₹4.20 – ₹5.50 Cr/yr <span class="tbl-sub">(Proprietary GIS, paper archives)</span></td>
                  <td><strong class="tbl-gain">₹18.4 Lakhs/yr</strong> <span class="tbl-sub">(96% Taxpayer OpEx reduction via Cloud Run / MeghRaj)</span></td>
                </tr>
                <tr>
                  <td><strong>Title Due Diligence Speed</strong></td>
                  <td>21 to 45 Days <span class="tbl-sub">(Manual field inspections &amp; panchnamas)</span></td>
                  <td><strong class="tbl-gain">&lt;400ms Query</strong> <span class="tbl-sub">(Instant PostGIS GiST topological containment)</span></td>
                </tr>
                <tr>
                  <td><strong>Encroachment Monitoring</strong></td>
                  <td>Post-Facto Litigation <span class="tbl-sub">(Caught months/years after mutation)</span></td>
                  <td><strong class="tbl-gain">5-Day Autonomous Cadence</strong> <span class="tbl-sub">(ESA Sentinel-2 NDVI/NDBI triage pre-mutation)</span></td>
                </tr>
                <tr>
                  <td><strong>Quasi-Judicial Standing</strong></td>
                  <td>Contested paper sketches <span class="tbl-sub">(Prone to civil court stay orders)</span></td>
                  <td><strong class="tbl-gain">SHA-256 Speaking Orders</strong> <span class="tbl-sub">(Aligned with Indian Evidence Act §65B)</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="sovereign-compliance-bar">
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12.8px; font-weight: 800; color: #0b3b6f; display: flex; align-items: center; gap: 6px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>STATUTORY &amp; LEGAL ALIGNMENT:</span>
            </div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 11.8px; font-weight: 800; color: #1e293b; display: flex; gap: 14px;">
              <span>DPDP Act 2023 §6(1)</span>
              <span>•</span>
              <span>RFCTLARR 2013 §23A</span>
              <span>•</span>
              <span>State RoR Act §5</span>
              <span>•</span>
              <span>Evidence Act §65B</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Official SIH Bottom Template Ribbon -->
    <div class="sih-bottom-ribbon">
      <div class="ribbon-left">@SIH Idea submission- Template</div>
      <div class="ribbon-right">4</div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- SLIDE 5: IMPACT AND BENEFITS               -->
  <!-- ========================================== -->
  <section class="slide sih-slide-5" id="slide-5">
    <!-- Top Header Bar (SIH Template) -->
    <div class="sih-s2-header">
      <div class="sih-team-oval">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        Team Hexaverse
      </div>
      <div class="sih-idea-title-center">
        IDEA TITLE: <span class="brand-accent">Project Tract</span>
      </div>
      <img src="SIH_TOP_LOGO_B64_PLACEHOLDER" alt="Smart India Hackathon 2026 Logo" class="sih-s2-top-logo">
    </div>

    <!-- Section Heading -->
    <div class="sih-section-title-bar">
      <div class="sih-section-heading">
        <span class="sih-diamond-icon">❖</span>
        Impact and Benefits
      </div>
    </div>

    <!-- 4 High-Impact Headline KPI Metric Cards Strip (Refined Executive Palette) -->
    <div class="sih-s5-kpi-strip">
      <!-- KPI 1 -->
      <div class="sih-s5-kpi-card">
        <div class="s5-kpi-header">
          <span class="s5-kpi-val">66% → &lt;10%</span>
          <span class="s5-kpi-tag">JUSTICE SYSTEM</span>
        </div>
        <div class="s5-kpi-label">Civil Court Litigation Preempted</div>
        <div class="s5-kpi-sub">PostGIS spatial topology locks halt boundary suits before Sub-Registrar deed execution.</div>
      </div>

      <!-- KPI 2 -->
      <div class="sih-s5-kpi-card">
        <div class="s5-kpi-header">
          <span class="s5-kpi-val">₹16 Lakh Cr</span>
          <span class="s5-kpi-tag">AGRI-FINANCE</span>
        </div>
        <div class="s5-kpi-label">Dead Rural Capital Unlocked</div>
        <div class="s5-kpi-sub">Converts dispute-ridden agricultural land into bankable, liquid collateral for formal 7% credit.</div>
      </div>

      <!-- KPI 3 -->
      <div class="sih-s5-kpi-card">
        <div class="s5-kpi-header">
          <span class="s5-kpi-val">28 Days → 4 Mins</span>
          <span class="s5-kpi-tag">BANKING DPI</span>
        </div>
        <div class="s5-kpi-label">Bank Mortgage Due-Diligence</div>
        <div class="s5-kpi-sub">Instant federated cryptographic title dossier replaces 30-day manual advocate searches.</div>
      </div>

      <!-- KPI 4 -->
      <div class="sih-s5-kpi-card">
        <div class="s5-kpi-header">
          <span class="s5-kpi-val">24 Mo → &lt;60 Days</span>
          <span class="s5-kpi-tag">GATISHAKTI</span>
        </div>
        <div class="s5-kpi-label">Infrastructure Corridor Approvals</div>
        <div class="s5-kpi-sub">Automated RFCTLARR 2013 severance math &amp; genealogy accelerates national highways &amp; rail.</div>
      </div>
    </div>

    <!-- 2-Column Balanced Content Grid: Target Audience Benefits (Left) vs. GovTech Revenue Model (Right) -->
    <div class="sih-s5-content-grid">
      <!-- LEFT COLUMN: 1. Citizen, Sovereign & Judicial Impact -->
      <div class="sih-s5-left-col">
        <div class="sih-s5-panel">
          <div class="sih-s5-panel-header">
            <span class="sih-s5-panel-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0070c0" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              1. Sovereign, Human &amp; Citizen Impact
            </span>
            <span class="sih-s5-panel-tag">GROUND-TRUTH TRANSFORMATION</span>
          </div>

          <!-- Top Row: Real Photograph + 2 Compact Primary Cards -->
          <div class="s5-impact-top-grid">
            <!-- Authentic Farmer Photograph Card -->
            <div class="s5-image-card">
              <img src="FARMER_IMG_B64_PLACEHOLDER" alt="Smallholder Farmer with Verified Land Parcel Map">
              <div class="s5-image-caption">
                Every farmer can access, verify, and prove their land ownership digitally
              </div>
            </div>

            <!-- 2 Compact Primary Impact Cards -->
            <div class="s5-compact-cards">
              <!-- Farmer Equity Card -->
              <div class="s5-compact-card green-accent">
                <div class="s5-card-header">
                  <span class="s5-card-title">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Smallholder Farmers &amp; Credit Dignity
                  </span>
                  <span class="s5-card-tag">7% PRIORITY KCC</span>
                </div>
                <div class="s5-card-desc">
                  <strong>₹16 Lakh Cr Unlocked:</strong> Authoritative spatial title qualifies farmers for formal 7% institutional credit, terminating 36% debt traps. Tamper-evident 0-kbps offline QR passbooks are instantly verifiable in remote rural fields.
                </div>
              </div>

              <!-- Women Landowners Card -->
              <div class="s5-compact-card">
                <div class="s5-card-header">
                  <span class="s5-card-title">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Women Landowners &amp; Vulnerable Heirs
                  </span>
                  <span class="s5-card-tag slate">DPDP ACT §6(1)</span>
                </div>
                <div class="s5-card-desc">
                  <strong>Anti-Coercion Tokenization:</strong> Purpose-bound consent masking shields female and elderly landowners from predatory grabs. Strict 3-stage statutory workflow (VRO → RI → Tahsildar) completely stops off-the-record tampering.
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Row: 2 Secondary Horizontal Impact Cards -->
          <div class="s5-compact-grid-2">
            <div class="s5-compact-card">
              <div class="s5-card-header">
                <span class="s5-card-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><path d="M3 21h18M3 7h18M5 7v14M19 7v14M10 7v14M14 7v14M12 2l10 5H2l10-5z"/></svg>
                  Civil Court Litigation Preemption
                </span>
                <span class="s5-card-tag slate">&gt;80% PENDENCY CUT</span>
              </div>
              <div class="s5-card-desc">
                Preempts 20–30 year boundary partition suits before deed registration. SRO spatial locks automatically block fraudulent double registrations across overlapping survey numbers.
              </div>
            </div>

            <div class="s5-compact-card green-accent">
              <div class="s5-card-header">
                <span class="s5-card-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                  Autonomous Commons &amp; Eco Defense
                </span>
                <span class="s5-card-tag">₹0 SATELLITE COST</span>
              </div>
              <div class="s5-card-desc">
                Copernicus Sentinel-2 10m automated satellite triage detects unauthorized construction over water bodies (<em>cheruvu</em>), drainage canals (<em>nala</em>), and village commons (<em>poramboke</em>) at zero data cost.
              </div>
            </div>
          </div>
        </div>

        <!-- Macroeconomic Multiplier Flywheel Graphic (Streamlined SVG) -->
        <div class="sih-s5-flywheel-panel">
          <div class="flywheel-header">
            <span class="flywheel-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0070c0" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              Macroeconomic Multiplier Flywheel · Sovereign Value Creation Flow
            </span>
            <span class="flywheel-tag">VIRTUOUS CYCLE</span>
          </div>

          <svg viewBox="0 0 880 115" width="100%" height="115" xmlns="http://www.w3.org/2000/svg" style="font-family: 'Inter', sans-serif;">
            <defs>
              <marker id="fwArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0b3b6f"/>
              </marker>
            </defs>

            <!-- Node 1 -->
            <g transform="translate(6, 4)">
              <rect width="154" height="58" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
              <text x="10" y="24" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="800" fill="#0b3b6f">1. Authoritative Title</text>
              <text x="10" y="46" font-family="'JetBrains Mono', monospace" font-size="9.8" font-weight="800" fill="#065f46">ZERO BOUNDARY OVERLAP</text>
            </g>
            <path d="M 162 33 L 178 33" stroke="#0b3b6f" stroke-width="1.6" fill="none" marker-end="url(#fwArr)"/>

            <!-- Node 2 -->
            <g transform="translate(182, 4)">
              <rect width="154" height="58" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
              <text x="10" y="24" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="800" fill="#0b3b6f">2. Formal 7% Credit</text>
              <text x="10" y="46" font-family="'JetBrains Mono', monospace" font-size="9.8" font-weight="800" fill="#065f46">₹16L CR COLLATERAL</text>
            </g>
            <path d="M 338 33 L 354 33" stroke="#0b3b6f" stroke-width="1.6" fill="none" marker-end="url(#fwArr)"/>

            <!-- Node 3 -->
            <g transform="translate(358, 4)">
              <rect width="154" height="58" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
              <text x="10" y="24" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="800" fill="#0b3b6f">3. Preempted Suits</text>
              <text x="10" y="46" font-family="'JetBrains Mono', monospace" font-size="9.8" font-weight="800" fill="#065f46">66% → &lt;10% COURT LOAD</text>
            </g>
            <path d="M 514 33 L 530 33" stroke="#0b3b6f" stroke-width="1.6" fill="none" marker-end="url(#fwArr)"/>

            <!-- Node 4 -->
            <g transform="translate(534, 4)">
              <rect width="154" height="58" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
              <text x="10" y="24" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="800" fill="#0b3b6f">4. Rapid Infra Corridor</text>
              <text x="10" y="46" font-family="'JetBrains Mono', monospace" font-size="9.8" font-weight="800" fill="#065f46">24m → &lt;60d CLEARANCE</text>
            </g>
            <path d="M 690 33 L 706 33" stroke="#0b3b6f" stroke-width="1.6" fill="none" marker-end="url(#fwArr)"/>

            <!-- Node 5 -->
            <g transform="translate(710, 4)">
              <rect width="164" height="58" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
              <text x="10" y="24" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="800" fill="#0b3b6f">5. Fiscal Buoyancy</text>
              <text x="10" y="46" font-family="'JetBrains Mono', monospace" font-size="9.8" font-weight="800" fill="#065f46">+18% STAMP DUTY GAIN</text>
            </g>

            <!-- Bottom ROI Summary Bar -->
            <rect x="6" y="74" width="868" height="34" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8"/>
            <text x="16" y="95" font-family="'JetBrains Mono', monospace" font-size="11.5" font-weight="800" fill="#0b3b6f">SOVEREIGN MULTIPLIER:</text>
            <text x="175" y="95" font-size="11.2" fill="#334155">Every ₹1 invested yields <tspan font-weight="700" fill="#0f172a">₹42.80 in Litigation Cuts, Agri-Credit &amp; Corridors</tspan></text>
            <text x="860" y="95" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="11.5" font-weight="800" fill="#065f46">100% SOVEREIGN ROI</text>
          </svg>
        </div>
      </div>

      <!-- RIGHT COLUMN: 2. Practical, Self-Sustaining GovTech Revenue Model & Prominent Chart -->
      <div class="sih-s5-right-col">
        <div class="sih-s5-panel">
          <div class="sih-s5-panel-header">
            <span class="sih-s5-panel-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0070c0" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              2. Self-Sustaining B2B GovTech Revenue Model
            </span>
            <span class="sih-s5-panel-tag">PRACTICAL UNIT ECONOMICS</span>
          </div>

          <!-- Top Row: High-Tech GovTech DPI Visual + 3 Compact Revenue Streams -->
          <div class="s5-rev-top-grid">
            <!-- GovTech DPI Image Card -->
            <div class="s5-image-card">
              <img src="GOVTECH_IMG_B64_PLACEHOLDER" alt="GovTech DPI Satellite Geometry to Bank Mortgage Clearance">
              <div class="s5-image-caption">
                GovTech DPI: Satellite Geometry linked to Bank Mortgage &amp; Highway Approvals
              </div>
            </div>

            <!-- Revenue Streams Compact Stack -->
            <div class="s5-rev-streams-compact">
              <div class="s5-govtech-banner">
                <strong>Core Principle:</strong> 100% Free for Smallholder Farmers &amp; Citizens · Fully funded by B2B institutional beneficiaries.
              </div>

              <!-- B2B Bank API -->
              <div class="s5-rev-mini-card">
                <div class="s5-rev-mini-head">
                  <span class="s5-rev-mini-title">B2B Bank Mortgage API</span>
                  <span class="s5-rev-mini-price">₹150 – ₹250 / Query</span>
                </div>
                <div class="s5-rev-mini-sub">SBI, HDFC, and PNB pay for sub-4-minute certified encumbrance dossiers, replacing 30-day manual searches.</div>
              </div>

              <!-- Linear Infra API -->
              <div class="s5-rev-mini-card">
                <div class="s5-rev-mini-head">
                  <span class="s5-rev-mini-title">Linear Infrastructure Corridor API</span>
                  <span class="s5-rev-mini-price">₹1,000 / km or Batch</span>
                </div>
                <div class="s5-rev-mini-sub">NHAI, Railways, and Solar EPCs automate land severance math and compensation under RFCTLARR 2013 in seconds.</div>
              </div>

              <!-- State Sovereign AMC -->
              <div class="s5-rev-mini-card green">
                <div class="s5-rev-mini-head">
                  <span class="s5-rev-mini-title">State Sovereign AMC &amp; MeghRaj SLA</span>
                  <span class="s5-rev-mini-price">₹1.50 Cr – ₹2.50 Cr / Yr</span>
                </div>
                <div class="s5-rev-mini-sub">MeghRaj sovereign cloud hosting, CORS RTK network upkeep, and Tier-1 operational availability SLA.</div>
              </div>
            </div>
          </div>

          <!-- Benchmark Strip (Compact & High Contrast) -->
          <div class="s5-benchmark-strip">
            <div class="s5-bench-item">
              <span class="s5-bench-label">Mortgage Title Search:</span>
              <span class="s5-bench-val">Legacy ₹5,000+ (28 Days) → <strong>Tract API ₹200 (&lt;4 Mins)</strong> <span class="s5-bench-pill good">96% COST CUT</span></span>
            </div>
            <div class="s5-bench-item">
              <span class="s5-bench-label">Forgery &amp; Audit Risk:</span>
              <span class="s5-bench-val">Legacy High Paper Risk → <strong>In-Database Invariant Proofs</strong> <span class="s5-bench-pill good">100% PROVENANCE</span></span>
            </div>
          </div>

          <!-- Prominent 3-Year Scalability & Breakeven Trajectory Chart (SVG) -->
          <div class="s5-trajectory-box">
            <div class="s5-traj-header">
              <span class="s5-traj-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                3-Year Scalability &amp; Financial Breakeven Trajectory
              </span>
              <div class="s5-traj-header-right">
                <div class="s5-traj-legend">
                  <span class="s5-traj-legend-item"><span class="s5-traj-legend-dot rev"></span>ARR Revenue</span>
                  <span class="s5-traj-legend-item"><span class="s5-traj-legend-dot opex"></span>OpEx Costs</span>
                </div>
                <span class="s5-traj-tag">SELF-FUNDED DPI · MONTH 14 BREAKEVEN</span>
              </div>
            </div>

            <!-- Self-Made Prominent Financial Trajectory SVG (Refined Heights & Zero Collision) -->
            <svg viewBox="0 0 850 240" width="100%" height="235" xmlns="http://www.w3.org/2000/svg" style="font-family: 'Inter', sans-serif;">
              <defs>
                <linearGradient id="barRevGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#0b3b6f"/>
                  <stop offset="100%" stop-color="#1d4ed8"/>
                </linearGradient>
                <linearGradient id="barOpexGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#64748b"/>
                  <stop offset="100%" stop-color="#94a3b8"/>
                </linearGradient>
              </defs>

              <!-- Chart Background Grid & Axis -->
              <line x1="60" y1="36" x2="830" y2="36" stroke="#e2e8f0" stroke-dasharray="3,3"/>
              <text x="52" y="40" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#64748b">₹35 Cr</text>

              <line x1="60" y1="80" x2="830" y2="80" stroke="#e2e8f0" stroke-dasharray="3,3"/>
              <text x="52" y="84" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#64748b">₹20 Cr</text>

              <line x1="60" y1="128" x2="830" y2="128" stroke="#e2e8f0" stroke-dasharray="3,3"/>
              <text x="52" y="132" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#64748b">₹10 Cr</text>

              <line x1="60" y1="180" x2="830" y2="180" stroke="#cbd5e1" stroke-width="1.2"/>
              <text x="52" y="184" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#64748b">₹0 Cr</text>

              <!-- YEAR 1: PILOT -->
              <g transform="translate(130, 0)">
                <!-- OpEx Bar (₹1.20 Cr) -->
                <rect x="15" y="160" width="36" height="20" rx="3" fill="url(#barOpexGrad)"/>
                <text x="33" y="153" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#64748b">₹1.2 Cr</text>
                <!-- Rev Bar (₹1.85 Cr) -->
                <rect x="57" y="148" width="36" height="32" rx="3" fill="url(#barRevGrad)"/>
                <text x="75" y="141" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="10.8" font-weight="800" fill="#0b3b6f">₹1.85 Cr</text>
                <!-- Breakeven Flag -->
                <rect x="-10" y="96" width="128" height="24" rx="4" fill="#ecfdf5" stroke="#047857" stroke-width="1"/>
                <text x="54" y="112" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="800" fill="#065f46">★ BREAKEVEN AT MONTH 14</text>
                <line x1="54" y1="120" x2="54" y2="140" stroke="#047857" stroke-width="1.2" stroke-dasharray="2,2"/>
                <!-- Labels -->
                <text x="54" y="202" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="12.5" font-weight="800" fill="#0f172a">Year 1 · 3 Pilot States</text>
                <text x="54" y="218" text-anchor="middle" font-size="10.5" font-weight="600" fill="#64748b">150k Queries · Breakeven M14</text>
              </g>

              <!-- YEAR 2: EXPANSION -->
              <g transform="translate(380, 0)">
                <!-- OpEx Bar (₹3.30 Cr) -->
                <rect x="15" y="128" width="36" height="52" rx="3" fill="url(#barOpexGrad)"/>
                <text x="33" y="121" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="10.5" font-weight="700" fill="#64748b">₹3.3 Cr</text>
                <!-- Rev Bar (₹9.20 Cr) -->
                <rect x="57" y="64" width="36" height="116" rx="3" fill="url(#barRevGrad)"/>
                <text x="75" y="55" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="800" fill="#0b3b6f">₹9.20 Cr</text>
                <!-- Labels -->
                <text x="56" y="202" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="800" fill="#0f172a">Year 2 · 8 Expansion States</text>
                <text x="56" y="218" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="10.8" font-weight="700" fill="#1e40af">1.8M Queries · 64% Net Margin</text>
              </g>

              <!-- YEAR 3: PAN-INDIA SCALE -->
              <g transform="translate(630, 0)">
                <!-- OpEx Bar (₹9.60 Cr) -->
                <rect x="15" y="58" width="36" height="122" rx="3" fill="url(#barOpexGrad)"/>
                <text x="33" y="51" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="10.5" font-weight="700" fill="#64748b">₹9.6 Cr</text>
                <!-- Rev Bar (₹34.50 Cr) -->
                <rect x="57" y="46" width="36" height="134" rx="3" fill="url(#barRevGrad)"/>
                <text x="75" y="38" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="800" fill="#0b3b6f">₹34.50 Cr</text>
                <!-- Labels -->
                <text x="56" y="202" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="800" fill="#0f172a">Year 3 · Pan-India Scale</text>
                <text x="56" y="218" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="10.8" font-weight="700" fill="#065f46">8.5M Queries · 72% Op. Margin</text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Official SIH Bottom Template Ribbon -->
    <div class="sih-bottom-ribbon">
      <div class="ribbon-left">@SIH Idea submission- Template</div>
      <div class="ribbon-right">5</div>
    </div>
  </section>

  <!-- ======================================================== -->
  <!-- SLIDE 6: RESEARCH AND REFERENCES (OFFICIAL SIH TEMPLATE) -->
  <!-- ======================================================== -->
  <section class="slide sih-slide-6" id="slide-6">
    <!-- Top Header Bar (Strict SIH Template) -->
    <div class="sih-s2-header sih-s6-header">
      <div class="sih-team-oval">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        Team Hexaverse
      </div>
      <div class="sih-s6-title-center">
        RESEARCH AND REFERENCES
      </div>
      <img src="SIH_TOP_LOGO_B64_PLACEHOLDER" alt="Smart India Hackathon 2026 Logo" class="sih-s2-top-logo">
    </div>

    <!-- Section Heading -->
    <div class="sih-section-title-bar">
      <div class="sih-section-heading">
        <span class="sih-diamond-icon">❖</span>
        Primary Field Groundwork &amp; Authoritative National References
      </div>
    </div>

    <!-- 2-Column Balanced Grid -->
    <div class="sih-s6-grid">
      <!-- Left Column: Primary Field Groundwork & Vizag DRO Enquiry -->
      <div class="sih-s6-left-col">
        <div class="sih-s6-panel">
          <div class="sih-s3-panel-header">
            <span class="sih-s3-panel-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              1. Primary Field Groundwork: Visakhapatnam District Revenue Enquiry
            </span>
            <span class="sih-s3-panel-tag">IN-PERSON FIELD STUDY · VISAKHAPATNAM COLLECTORATE</span>
          </div>

          <!-- Documentary Photo + Officer Context Strip -->
          <div class="sih-s6-photo-strip">
            <div class="s6-photo-wrapper">
              <img src="WARD_IMG_B64_PLACEHOLDER" alt="DRO Sri B.H. Bhavani Shankar &amp; Collector Sri K. Bhaskar, IAS" class="s6-field-img">
              <div class="s6-photo-tag">Sri B.H. Bhavani Shankar, DRO · Vizag Collectorate</div>
            </div>
            <div class="s6-photo-meta">
              <div class="s6-meta-title">Executive Field Enquiry: Sri B.H. Bhavani Shankar, DRO &amp; Revenue Admin</div>
              <div class="s6-meta-role">District Revenue Officer (DRO) &amp; Collectorate Leadership · Visakhapatnam</div>
              <div class="s6-meta-desc">To ground Project Tract in real administrative reality, our team conducted field enquiries at the Visakhapatnam Collectorate with District Revenue Officer Sri B.H. Bhavani Shankar and the revenue leadership. We audited active quasi-judicial mutation appeals, Spandana citizen land grievances, inspected village FMBs, and investigated why Sub-Registrar registrations fail to sync with Meebhoomi / Webland records.</div>
            </div>
          </div>

          <!-- 4 Real Ground Discoveries (Humanized, Everyday Language - No Jargon) -->
          <div class="s6-field-discoveries">
            <div class="s6-discovery-card">
              <div class="s6-discovery-num">01</div>
              <div class="s6-discovery-body">
                <div class="s6-discovery-title">Sub-Registrars register deeds blindly without seeing any map (CARD vs. Meebhoomi)</div>
                <div class="s6-discovery-text">
                  When someone buys 200 sq. yards in Pendurthi or Anandapuram, the Sub-Registrar office registers the deed based only on seller/buyer signatures and typed text boundaries ("North: neighbor, South: road"). <strong>Their registration computer has no live map.</strong> They register the deed without checking if those 200 yards overlap with the adjacent plot or if the seller even has that land left to sell.
                </div>
              </div>
            </div>

            <div class="s6-discovery-card">
              <div class="s6-discovery-num">02</div>
              <div class="s6-discovery-body">
                <div class="s6-discovery-title">The dispute blows up the moment the buyer applies for mutation on Meebhoomi</div>
                <div class="s6-discovery-text">
                  Weeks later, the buyer brings the stamped deed to the Tahsildar office to update their name on the 1-B Adangal (record of rights). When field staff check the ground, they find the registration deed cuts 10 feet into the neighbor's field. <strong>The mutation is frozen, fighting erupts, and an emotional family battle begins before the revenue department even touched the file.</strong>
                </div>
              </div>
            </div>

            <div class="s6-discovery-card">
              <div class="s6-discovery-num">03</div>
              <div class="s6-discovery-body">
                <div class="s6-discovery-title">Over 70% of citizen petitions at Monday Spandana hearings are these exact boundary wars</div>
                <div class="s6-discovery-text">
                  Revenue leadership confirmed during our enquiry that every Monday during Spandana (public grievance day) at the Collectorate, over 70% of citizen petitions stem directly from blocked mutations and double registrations. <strong>Tahsildars and field staff spend weeks conducting spot inquiries (panchanamas) for disputes that proactive GIS validation prevents entirely.</strong>
                </div>
              </div>
            </div>

            <div class="s6-discovery-card">
              <div class="s6-discovery-num">04</div>
              <div class="s6-discovery-body">
                <div class="s6-discovery-title">Physical notices on mandal boards fail because villagers never see them</div>
                <div class="s6-discovery-text">
                  By rule, a 30-day mutation objection notice is pinned on a wooden board at the mandal revenue office. <strong>Actual neighbors living 15 km away in rural villages never see it.</strong> By the time they realize their boundary was cut, concrete pillars have already been erected, dragging ordinary families into 15-year civil court litigation.
                </div>
              </div>
            </div>
          </div>

          <!-- Impactful Point Deduced from Field Discussion -->
          <div class="s6-officer-quote-box">
            <div class="s6-quote-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            </div>
            <div class="s6-quote-content">
              <div class="s6-quote-label">Impactful Deduction from Field Enquiry with Revenue Leadership</div>
              <div class="s6-quote-text">
                Consultations with District Revenue Officer Sri B.H. Bhavani Shankar established that mandating an on-screen live cadastral map before deed execution—coupled with automated boundary locking to physically prevent overlapping registrations—directly eliminates the root cause behind <strong>over 70% of weekly Spandana grievance petitions and revenue court appeals</strong>.
              </div>
              <div class="s6-quote-author">
                — Primary analytical takeaway from in-person consultation with Sri B.H. Bhavani Shankar, DRO, Visakhapatnam Collectorate
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Authoritative Policy Papers & Research References -->
      <div class="sih-s6-right-col">
        <div class="sih-s6-panel">
          <div class="sih-s3-panel-header">
            <span class="sih-s3-panel-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              2. Authoritative Policy Whitepapers &amp; Research References
            </span>
            <span class="sih-s3-panel-tag">GOVERNMENT COMMISSIONS &amp; BENCHMARKS</span>
          </div>

          <!-- 4 Policy Whitepaper Cards (Slide 4 Style) -->
          <div class="s6-ref-cards-grid">
            <!-- Ref 1: NITI Aayog -->
            <div class="s6-ref-card">
              <div class="s6-ref-header">
                <span class="s6-ref-badge niti">NITI AAYOG (2020)</span>
                <span class="s6-ref-type">Government Whitepaper</span>
              </div>
              <div class="s6-ref-title">Draft Model Land Title Act &amp; Conclusive Titling Guidelines</div>
              <div class="s6-ref-meta">Expert Committee on Land Titling (Chaired by Dr. T. Haque), NITI Aayog, New Delhi.</div>
              <div class="s6-ref-body">
                Demonstrates that India's Registration Act 1908 registers only deeds (presumptive transactions), not guaranteed boundaries. Recommends state-guaranteed conclusive titles linked to dynamic spatial parcel maps.
              </div>
              <div class="s6-ref-link">Source: <code>niti.gov.in/sites/default/files/2020-11/Model_Land_Title_Act.pdf</code></div>
            </div>

            <!-- Ref 2: NJDG / DAKSH -->
            <div class="s6-ref-card">
              <div class="s6-ref-header">
                <span class="s6-ref-badge njdg">NJDG &amp; DAKSH (2023)</span>
                <span class="s6-ref-type">Judicial Data Benchmark</span>
              </div>
              <div class="s6-ref-title">Access to Justice Survey &amp; National Civil Case Analytics</div>
              <div class="s6-ref-meta">Supreme Court e-Committee / DAKSH India Civil Litigation Benchmarking Study.</div>
              <div class="s6-ref-body">
                Documents that <strong>66.2% of all pending civil cases in India are land disputes</strong>, requiring an average of <strong>15.4 years</strong> in court. Disconnected registration and boundary overlap cited as #1 trigger.
              </div>
              <div class="s6-ref-link">Source: <code>njdg.ecourts.gov.in</code> · Access to Justice Report</div>
            </div>

            <!-- Ref 3: DoLR DILRMP -->
            <div class="s6-ref-card">
              <div class="s6-ref-header">
                <span class="s6-ref-badge dolr">DoLR / MoRD (2024–25)</span>
                <span class="s6-ref-type">National Mission Standard</span>
              </div>
              <div class="s6-ref-title">DILRMP &amp; Bhoo-Aadhaar (ULPIN) Technical Architecture</div>
              <div class="s6-ref-meta">Dept. of Land Resources, Ministry of Rural Development, Govt of India (Report No. 34).</div>
              <div class="s6-ref-body">
                Standardizes 14-digit geo-coded Unique Land Parcel Identification Numbers (ULPIN) and mandates real-time electronic integration between Sub-Registrar Offices (SRO) and Tehsil land records.
              </div>
              <div class="s6-ref-link">Source: <code>dolr.gov.in/programmes/dilrmp</code> · Bhoo-Aadhaar Architecture</div>
            </div>

            <!-- Ref 4: RBI Innovation Hub (PTPFC) -->
            <div class="s6-ref-card">
              <div class="s6-ref-header">
                <span class="s6-ref-badge rbi" style="background: #ecfdf5; color: #047857; border-color: #a7f3d0;">RBI INNOVATION HUB (2024)</span>
                <span class="s6-ref-type">Agri-Credit Benchmark</span>
              </div>
              <div class="s6-ref-title">Public Tech Platform for Frictionless Credit (PTPFC)</div>
              <div class="s6-ref-meta">Reserve Bank of India (RBIH) · Automated Land Record Verification for Kisan Credit.</div>
              <div class="s6-ref-body">
                Establishes architecture for automated API-driven land record validation directly with state revenue servers, enabling banks to sanction Kisan Credit Card (KCC) loans without manual paper title searches.
              </div>
              <div class="s6-ref-link">Source: <code>rbi.org.in</code> · <code>rbih.org.in/ptpfc</code></div>
            </div>
          </div>

          <!-- Statutory Acts & Legal Compliance Table (Slide 4 style) -->
          <div class="sih-matrix-panel" style="margin-top: 3px;">
            <div class="sih-matrix-table-head" style="grid-template-columns: 0.95fr 1.35fr; padding: 5px 12px; font-size: 12.5px;">
              <span>Statutory Framework / Legislation</span>
              <span>Operational Mandate &amp; Defensibility in Project Tract</span>
            </div>
            <div class="sih-matrix-table-body">
              <div class="sih-matrix-row" style="grid-template-columns: 0.95fr 1.35fr; padding: 5px 12px; gap: 12px;">
                <div class="matrix-challenge" style="padding-right: 10px;">
                  <div class="challenge-headline">
                    <span class="challenge-tag" style="background: #eff6ff; color: #1e40af; border-color: #bfdbfe;">STATUTORY ROR</span>
                    <span class="challenge-title" style="font-size: 15.2px;">State RoR Acts (§5)</span>
                  </div>
                  <div class="challenge-desc" style="font-size: 13.2px;">Quasi-judicial mutation conveyor &amp; mandatory Speaking Orders.</div>
                </div>
                <div class="matrix-solution">
                  <div class="solution-desc" style="font-size: 14.2px; line-height: 1.36;">Formalizes sequential 3-stage statutory workflow (VRO → RI → Tahsildar), automatically attaching cadastral audit proof to speaking orders.</div>
                </div>
              </div>

              <div class="sih-matrix-row" style="grid-template-columns: 0.95fr 1.35fr; padding: 5px 12px; gap: 12px;">
                <div class="matrix-challenge" style="padding-right: 10px;">
                  <div class="challenge-headline">
                    <span class="challenge-tag" style="background: #fef2f2; color: #991b1b; border-color: #fecaca;">COMPENSATION</span>
                    <span class="challenge-title" style="font-size: 15.2px;">RFCTLARR Act 2013 (§23A)</span>
                  </div>
                  <div class="challenge-desc" style="font-size: 13.2px;">Statutory severance compensation &amp; 100% solatium calculation.</div>
                </div>
                <div class="matrix-solution">
                  <div class="solution-desc" style="font-size: 14.2px; line-height: 1.36;">PostGIS geometric intersection auto-calculates residual area and applies statutory 100% solatium whenever an infrastructure corridor bisects a parcel.</div>
                </div>
              </div>

              <div class="sih-matrix-row" style="grid-template-columns: 0.95fr 1.35fr; padding: 5px 12px; gap: 12px;">
                <div class="matrix-challenge" style="padding-right: 10px;">
                  <div class="challenge-headline">
                    <span class="challenge-tag" style="background: #f1f5f9; color: #1e293b; border-color: #cbd5e1;">DATA PRIVACY</span>
                    <span class="challenge-title" style="font-size: 15.2px;">DPDP Act 2023 (§6(1))</span>
                  </div>
                  <div class="challenge-desc" style="font-size: 13.2px;">Purpose-bound consent &amp; confidential citizen data masking.</div>
                </div>
                <div class="matrix-solution">
                  <div class="solution-desc" style="font-size: 14.2px; line-height: 1.36;">Enforces one-time OTP consent masking of Aadhaar and phone numbers; public views display only parcel geometries and encumbrance status.</div>
                </div>
              </div>

              <div class="sih-matrix-row" style="grid-template-columns: 0.95fr 1.35fr; padding: 5px 12px; gap: 12px;">
                <div class="matrix-challenge" style="padding-right: 10px;">
                  <div class="challenge-headline">
                    <span class="challenge-tag" style="background: #f8fafc; color: #334155; border-color: #cbd5e1;">EVIDENCE ACT</span>
                    <span class="challenge-title" style="font-size: 15.2px;">Indian Evidence Act (§65B)</span>
                  </div>
                  <div class="challenge-desc" style="font-size: 13.2px;">Electronic record admissibility &amp; cryptographic tamper proofing.</div>
                </div>
                <div class="matrix-solution">
                  <div class="solution-desc" style="font-size: 14.2px; line-height: 1.36;">Every spatial split, approval, or rejection generates a SHA-256 cryptographic digest and digital certificate, supporting electronic evidence standards under §65B.</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sovereign Research Grounding Banner -->
          <div style="margin-top: 4px; padding: 5px 12px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 5px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 11.5px; font-weight: 800; color: #0b3b6f;">🛡️ SOVEREIGN RESEARCH GROUNDING</span>
            <span style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: #334155;">NITI Aayog Model Titling Act · DILRMP Bhoo-Aadhaar · Survey of India CORS · Supreme Court NJDG Benchmarks</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Official SIH Bottom Template Ribbon -->
    <div class="sih-bottom-ribbon">
      <div class="ribbon-left">@SIH Idea submission- Template</div>
      <div class="ribbon-right">6</div>
    </div>
  </section>

  <!-- Interactive Navigation Toolbar -->
  <div class="nav-bar">
    <button class="nav-btn" onclick="prevSlide()">◀ Prev</button>
    <div class="nav-page-indicator">Slide <span id="current-slide">1</span> / 6</div>
    <button class="nav-btn" onclick="nextSlide()">Next ▶</button>
    <button class="nav-btn" onclick="toggleFullScreen()">⛶ Fullscreen</button>
    <button class="nav-btn print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
  </div>

  <script>
    let currentSlide = 1;
    const totalSlides = 6;

    function showSlide(n) {
      if (n < 1) n = 1;
      if (n > totalSlides) n = totalSlides;
      currentSlide = n;

      for (let i = 1; i <= totalSlides; i++) {
        const slide = document.getElementById(`slide-${i}`);
        if (slide) {
          slide.classList.remove('active');
        }
      }

      const activeSlide = document.getElementById(`slide-${currentSlide}`);
      if (activeSlide) {
        activeSlide.classList.add('active');
      }

      const indicator = document.getElementById('current-slide');
      if (indicator) indicator.textContent = currentSlide;
    }

    function nextSlide() {
      if (currentSlide < totalSlides) showSlide(currentSlide + 1);
    }

    function prevSlide() {
      if (currentSlide > 1) showSlide(currentSlide - 1);
    }

    function toggleFullScreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullScreen();
      } else if (e.key === 'p' || e.key === 'P') {
        window.print();
      }
    });
  </script>
</body>
</html>
'''

    final_html = html_content.replace('LIVE_MAP_B64_PLACEHOLDER', live_map_b64)
    final_html = final_html.replace('SIH_TOP_LOGO_B64_PLACEHOLDER', sih_top_logo_b64)
    final_html = final_html.replace('SIH_GRAPHIC_B64_PLACEHOLDER', sih_graphic_b64)
    final_html = final_html.replace('WEBAPP_IMG_B64_PLACEHOLDER', webapp_b64)
    final_html = final_html.replace('PHONE_MOCKUP_B64_PLACEHOLDER', phone_mockup_b64)
    final_html = final_html.replace('PYTHON_LOGO_B64_PLACEHOLDER', tech_logos.get('python', ''))
    final_html = final_html.replace('FASTAPI_LOGO_B64_PLACEHOLDER', tech_logos.get('fastapi', ''))
    final_html = final_html.replace('POSTGRES_LOGO_B64_PLACEHOLDER', tech_logos.get('postgresql', ''))
    final_html = final_html.replace('POSTGIS_LOGO_B64_PLACEHOLDER', tech_logos.get('postgis', ''))
    final_html = final_html.replace('REACT_LOGO_B64_PLACEHOLDER', tech_logos.get('react', ''))
    final_html = final_html.replace('VITE_LOGO_B64_PLACEHOLDER', tech_logos.get('vite', ''))
    final_html = final_html.replace('SENTINEL2_LOGO_B64_PLACEHOLDER', tech_logos.get('sentinel2', ''))
    final_html = final_html.replace('FARMER_IMG_B64_PLACEHOLDER', farmer_img_b64)
    final_html = final_html.replace('GOVTECH_IMG_B64_PLACEHOLDER', govtech_img_b64)
    final_html = final_html.replace('WARD_IMG_B64_PLACEHOLDER', ward_img_b64)
    out_html = "docs/plan/sih_presentation_deck.html"
    with open(out_html, "w", encoding="utf-8") as f:
        f.write(final_html)
    print(f"Generated {out_html}")

    # Compile PDF via Chrome
    pdf_out = "docs/plan/SIH2026_TRACT_PRESENTATION.pdf"
    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--print-to-pdf=" + os.path.abspath(pdf_out),
        "file://" + os.path.abspath(out_html)
    ]
    print("Compiling PDF...")
    subprocess.run(cmd, check=True)
    print(f"Generated {pdf_out}")

    # Render all 6 pages to PNG
    doc = pymupdf.open(pdf_out)
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=150)
        png_path = f"docs/plan/slide_{i+1}_rendered.png"
        pix.save(png_path)
        print(f"Saved {png_path}")

if __name__ == "__main__":
    build_deck()

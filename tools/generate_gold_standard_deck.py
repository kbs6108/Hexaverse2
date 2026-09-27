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

    html_content = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Tract · SIH 2026 Final Presentation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
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

    /* SLIDE 1: Hero Split (Editorial Left, Impact Right) */
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

    /* SLIDE 3: Seamless Flow Stream (NO BOXES) */
    .pipeline-stream {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 32px;
      margin-top: 40px;
      position: relative;
    }

    .pipeline-stream::before {
      content: '';
      position: absolute;
      top: 36px;
      left: 10%;
      right: 10%;
      height: 3px;
      background: linear-gradient(90deg, #3b82f6, #059669, #d97706, #1e3a8a);
      z-index: 1;
    }

    .stage-column {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
    }

    .stage-node-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .stage-badge {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid #1e3a8a;
      color: #1e3a8a;
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(30, 58, 138, 0.15);
    }

    .stage-name {
      font-family: var(--font-display);
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }

    .stage-body {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      padding: 28px 26px;
      border-radius: 20px;
      border: 1px solid rgba(226, 232, 240, 0.8);
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 10px 25px rgba(0,0,0,0.02);
    }

    .stage-intro {
      font-size: 16px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 18px;
      line-height: 1.45;
    }

    .feature-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .feature-list li {
      font-size: 15px;
      color: #475569;
      line-height: 1.45;
      position: relative;
      padding-left: 18px;
    }

    .feature-list li::before {
      content: '▪';
      position: absolute;
      left: 0;
      color: #1e40af;
      font-size: 16px;
    }

    .feature-list li strong {
      color: #0f172a;
    }

    .stage-accent-tag {
      margin-top: 24px;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 13px;
      line-height: 1.4;
      font-weight: 500;
    }

    .tag-blue { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; }
    .tag-green { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .tag-amber { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    .tag-purple { background: #faf5ff; color: #6b21a8; border: 1px solid #e9d5ff; }

    .tech-stack-strip {
      margin-top: 32px;
      background: rgba(255, 255, 255, 0.7);
      padding: 16px 28px;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 15px;
    }

    .tech-stack-strip strong {
      color: #0f172a;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-size: 13px;
    }

    .tech-badges {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .tech-pill {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 4px 12px;
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 600;
      color: #334155;
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

    /* SLIDE 5: Economic Multipliers (Big Impact) */
    .headline-metrics-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 28px;
      margin-top: 32px;
    }

    .headline-stat-card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      border: 1px solid rgba(226, 232, 240, 0.9);
      padding: 30px 26px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.02);
      text-align: center;
    }

    .headline-stat-card .val {
      font-family: var(--font-display);
      font-size: 64px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.03em;
      margin-bottom: 12px;
    }

    .headline-stat-card .lbl {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }

    .headline-stat-card .sub {
      font-size: 14px;
      color: #64748b;
      line-height: 1.4;
    }

    .stakeholder-editorial {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 36px;
      margin-top: 36px;
    }

    .stakeholder-col {
      background: rgba(255, 255, 255, 0.85);
      border-radius: 20px;
      border: 1px solid rgba(226, 232, 240, 0.8);
      padding: 30px 34px;
    }

    .stakeholder-col h4 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stakeholder-col ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stakeholder-col li {
      font-size: 16px;
      color: #334155;
      line-height: 1.5;
      position: relative;
      padding-left: 20px;
    }

    .stakeholder-col li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: #2563eb;
      font-weight: 700;
    }

    .stakeholder-col li strong {
      color: #0f172a;
    }

    /* SLIDE 6: Statutory Grounding & Closing */
    .compliance-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 32px;
      margin-top: 36px;
    }

    .comp-col {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 20px;
      border: 1px solid rgba(226, 232, 240, 0.8);
      padding: 32px 28px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.02);
    }

    .comp-col h4 {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .comp-col ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .comp-col li {
      font-size: 15px;
      color: #475569;
      line-height: 1.45;
    }

    .comp-col li strong {
      color: #0f172a;
      display: block;
      margin-bottom: 2px;
    }

    /* Sovereign Banner Anchor */
    .sovereign-anchor {
      margin-top: 40px;
      background: linear-gradient(135deg, #091322 0%, #1e293b 100%);
      border-radius: 20px;
      padding: 28px 44px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #ffffff;
      box-shadow: 0 15px 35px rgba(0,0,0,0.15);
    }

    .anchor-text h3 {
      font-family: var(--font-display);
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 6px;
    }

    .anchor-text p {
      font-size: 16px;
      color: #94a3b8;
    }

    .anchor-actions {
      display: flex;
      gap: 16px;
    }

    .anchor-actions a {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .anchor-actions a.primary {
      background: #ffffff;
      color: #0f172a;
    }

    .anchor-actions a.secondary {
      background: #e11d48;
      color: #ffffff;
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
  <!-- SLIDE 1: THE CORE PROBLEM & EXECUTIVE HOOK -->
  <!-- ========================================== -->
  <section class="slide active" id="slide-1">
    <div class="slide-header">
      <div class="header-left">
        <div class="national-flag-pill">
          <div class="flag-bar"></div>
          <div>
            <div class="dept-title">Government of India · Ministry of Rural Development</div>
            <div class="dept-sub">Department of Land Resources (DoLR)</div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="hackathon-badge">
          SMART INDIA HACKATHON 2026
          <span class="id">SIH26014</span>
        </div>
        <div class="slide-page-num"><strong>01</strong> / 06</div>
      </div>
    </div>

    <div class="slide-content">
      <div class="hero-split">
        <div class="hero-left">
          <div class="category-kicker">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            Smart Governance & Cadastral Digital Public Infrastructure
          </div>
          <h1>Project Tract</h1>
          <h2>India’s Federated, Parcel-Centric Land Operating System</h2>
          <p class="hero-narrative">
            When an Indian citizen purchases land, they must physically run between six disconnected government silos—Revenue, Sub-Registrar Deeds, Survey (FMB), Town Planning, Tax, and Courts. Because these records never talk to each other, fraudsters exploit the blind spot, locking <strong>66% of all civil litigation</strong> and freezing <strong>₹16 Lakh Crore in dead capital</strong>.
          </p>
          <div class="hero-punchline">
            ⚡ <strong>The Sovereign Leap:</strong> Tract unites all six departments around one universal spatial key (ULPIN)—delivering instant conclusive title truth in under <strong>400 milliseconds</strong>.
          </div>
          <div class="pill-links">
            <a href="https://github.com/kbs6108/Hexaverse2" target="_blank" class="action-btn dark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              GitHub Repository
            </a>
            <a href="https://youtu.be/demo" target="_blank" class="action-btn ruby">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Watch Video Pitch
            </a>
            <a href="http://localhost:5173/map" target="_blank" class="action-btn outline">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              Launch Live App
            </a>
          </div>
        </div>

        <div class="hero-right">
          <div class="metric-stream">
            <div class="metric-row red">
              <div class="metric-num">66%</div>
              <div class="metric-label">Of All Civil Court Cases in India Are Land Disputes</div>
              <div class="metric-desc">Inherited from parents to children, dragging on for an average of 20 years across generations.</div>
            </div>
            <div class="metric-row amber">
              <div class="metric-num">₹16 Lakh Cr</div>
              <div class="metric-label">Trapped in Frozen, Disputed Dead Capital</div>
              <div class="metric-desc">Unbankable land that cannot be mortgaged, farmed peacefully, or acquired for critical highways.</div>
            </div>
            <div class="metric-row green">
              <div class="metric-num">&lt; 4 Minutes</div>
              <div class="metric-label">Conclusive Title Verification via ULPIN</div>
              <div class="metric-desc">Down from 28 days of physical department queues across revenue and registration offices.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- SLIDE 2: LIVE OPERATING SYSTEM IN ACTION -->
  <!-- ========================================== -->
  <section class="slide" id="slide-2">
    <div class="slide-header">
      <div class="header-left">
        <div class="national-flag-pill">
          <div class="flag-bar"></div>
          <div>
            <div class="dept-title">Platform Preview · Live Working Prototype</div>
            <div class="dept-sub">3D Volumetric Cadastre & Native Citizen Mobile PWA</div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="hackathon-badge">SMART INDIA HACKATHON 2026 <span class="id">SIH26014</span></div>
        <div class="slide-page-num"><strong>02</strong> / 06</div>
      </div>
    </div>

    <div class="slide-content">
      <div class="category-kicker">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        Full Sovereign Interface
      </div>
      <h2 class="slide-headline">The Sovereign Operating System in Action</h2>
      <p class="slide-subheadline">
        Live MapLibre GL 3D vector tile shaders paired with offline-first citizen passbooks and field officer consoles.
      </p>

      <div class="preview-canvas">
        <!-- MacBook Frame -->
        <div class="macbook-wrap">
          <div class="macbook-outer">
            <div class="macbook-notch"></div>
            <div class="macbook-screen">
              <img src="LIVE_MAP_B64_PLACEHOLDER" alt="Tract Live Map">
            </div>
          </div>
          <div class="macbook-base"></div>
        </div>

        <!-- Mobile Phone Frame -->
        <div class="phone-outer">
          <div class="phone-screen">
            <div class="phone-notch-bar">
              <span>9:41</span>
              <span>5G 📶 100%</span>
            </div>
            <div style="font-weight: 800; font-size: 15px; color: #0f172a; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <span>DoLR Tract · పహాణీ</span>
              <span style="font-size: 11px; background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px;">తెలుగు</span>
            </div>
            <div class="phone-card">
              <div class="phone-pills-row">
                <span class="phone-tag">DIGITAL TITLE PASSBOOK</span>
                <span style="font-size: 10px; color: #38bdf8;">VERIFIED</span>
              </div>
              <div style="font-size: 16px; font-weight: 700; margin-bottom: 2px;">Pattadar: Ravi Kumar</div>
              <div style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">Sy No: 123/4 · Extent: 874.3 m²</div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="phone-qr-box">QR</div>
                <div style="font-family: var(--font-mono); font-size: 10px; color: #94a3b8;">SHA-256: 8f4c2...ba1</div>
              </div>
            </div>
            <div class="phone-list">
              <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">Sovereign Encumbrance:</div>
              <div style="color: #059669;">✓ Revenue 1-B: Clear Title</div>
              <div style="color: #059669;">✓ SRO: 0 Mortgages (30-Yr EC)</div>
              <div style="color: #059669;">✓ Court: 0 Lis Pendens Injunction</div>
              <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
                DPDP Act 2023 Masked (R*** K***)
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4 Capability Ribbon -->
      <div class="capability-ribbon">
        <div class="cap-item">
          <h4>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            6-Department Truth
          </h4>
          <p>Synchronizes Revenue, Deeds, FMB & Injunctions in under 400 milliseconds.</p>
        </div>
        <div class="cap-item">
          <h4>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg>
            ISO 19152 3D Cadastre
          </h4>
          <p>Volumetric parcel titling for sky apartments and subterranean metro rail tunnels.</p>
        </div>
        <div class="cap-item">
          <h4>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Severance Math
          </h4>
          <p>RFCTLARR 2013 §23A highway corridor severance & 100% solatium compensation.</p>
        </div>
        <div class="cap-item">
          <h4>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            Sat Watchdog
          </h4>
          <p>Sentinel-2 5-day NDVI vegetation and NDBI construction anomaly pipeline.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- SLIDE 3: SEAMLESS ARCHITECTURAL PIPELINE -->
  <!-- ========================================== -->
  <section class="slide" id="slide-3">
    <div class="slide-header">
      <div class="header-left">
        <div class="national-flag-pill">
          <div class="flag-bar"></div>
          <div>
            <div class="dept-title">Technical Architecture · Federated Engineering</div>
            <div class="dept-sub">Statutory Invariant Engine, Spatial PostGIS & Asynchronous FastAPI Core</div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="hackathon-badge">SMART INDIA HACKATHON 2026 <span class="id">SIH26014</span></div>
        <div class="slide-page-num"><strong>03</strong> / 06</div>
      </div>
    </div>

    <div class="slide-content">
      <div class="category-kicker">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
        Continuous Engineering Stream
      </div>
      <h2 class="slide-headline">End-to-End Architectural Pipeline</h2>
      <p class="slide-subheadline">
        Eliminating isolated database silos through an open, provenance-hashed Common Data Model (CLM 1.0 JSON-LD).
      </p>

      <div class="pipeline-stream">
        <!-- Stage 1 -->
        <div class="stage-column">
          <div class="stage-node-header">
            <div class="stage-badge">01</div>
            <div class="stage-name">Legacy Department Silos</div>
          </div>
          <div class="stage-body">
            <div>
              <p class="stage-intro">Ingests disconnected departmental records across multiple Indian states:</p>
              <ul class="feature-list">
                <li><strong>Revenue:</strong> Meebhoomi (AP), Patta Chitta (TN), Dharani (TG) 1-B Adangals.</li>
                <li><strong>Registration (SRO):</strong> Registered deed instruments & 30-year encumbrance charges.</li>
                <li><strong>Survey:</strong> Village FMB boundary shapefiles & total station traverse points.</li>
                <li><strong>Satellite:</strong> Sentinel-2 Level-2A multispectral 10m imagery.</li>
              </ul>
            </div>
            <div class="stage-accent-tag tag-blue">
              <strong>ADAPTERS:</strong> Declarative state dialect mappings translate Telugu, Tamil & Hindi revenue terms.
            </div>
          </div>
        </div>

        <!-- Stage 2 -->
        <div class="stage-column">
          <div class="stage-node-header">
            <div class="stage-badge">02</div>
            <div class="stage-name">PostGIS Invariant Engine</div>
          </div>
          <div class="stage-body">
            <div>
              <p class="stage-intro">Enforces mathematical and statutory spatial guardrails directly in the database:</p>
              <ul class="feature-list">
                <li><strong>Cadastral Snap Assistant:</strong> Vertices snap magnetically to authoritative FMB traverse lines.</li>
                <li><strong>±15% Area Variance Ceiling:</strong> Boundary edits exceeding statutory limits are rejected at the DB level.</li>
                <li><strong>Topological Invariants:</strong> Mathematically eliminates overlapping polygons and slivers.</li>
                <li><strong>Dynamic Vector Tiles:</strong> PostGIS generates binary MVT streams in sub-100ms.</li>
              </ul>
            </div>
            <div class="stage-accent-tag tag-green">
              <strong>STORAGE:</strong> PostgreSQL 16 + PostGIS 3.4 with GiST spatial indexes & geometric partitioning.
            </div>
          </div>
        </div>

        <!-- Stage 3 -->
        <div class="stage-column">
          <div class="stage-node-header">
            <div class="stage-badge">03</div>
            <div class="stage-name">FastAPI Gateway & Logic</div>
          </div>
          <div class="stage-body">
            <div>
              <p class="stage-intro">Stateless asynchronous core coordinating legal state machines:</p>
              <ul class="feature-list">
                <li><strong>CLM 1.0 JSON-LD:</strong> Universal semantic spatial parcel representation.</li>
                <li><strong>ROR Act §5 State Machine:</strong> Sequential VRO → RI → Tahsildar quasi-judicial conveyor.</li>
                <li><strong>Forensic Deed Scrutiny:</strong> SHA-256 fingerprinting + OCR extent cross-verification.</li>
                <li><strong>DPDP Act 2023:</strong> Purpose-bound consent tokenization & masking.</li>
              </ul>
            </div>
            <div class="stage-accent-tag tag-amber">
              <strong>AI WATCHDOG:</strong> 5-day orbital Sentinel-2 pipeline monitors NDVI vegetation drops & NDBI built-up surges.
            </div>
          </div>
        </div>

        <!-- Stage 4 -->
        <div class="stage-column">
          <div class="stage-node-header">
            <div class="stage-badge">04</div>
            <div class="stage-name">Sovereign Applications</div>
          </div>
          <div class="stage-body">
            <div>
              <p class="stage-intro">Empowers citizens, revenue officers, infrastructure, and commercial banks:</p>
              <ul class="feature-list">
                <li><strong>Citizen PWA:</strong> Multilingual search, name change mutation & e-Passbooks.</li>
                <li><strong>Officer Queue:</strong> Automated evidence compilation & digital Speaking Orders.</li>
                <li><strong>PM GatiShakti:</strong> Automated corridor severance math under RFCTLARR 2013 §23A.</li>
                <li><strong>B2B Banking APIs:</strong> Instant 9-point title verification for SBI, HDFC & NABARD.</li>
              </ul>
            </div>
            <div class="stage-accent-tag tag-purple">
              <strong>CLOUD SCALE:</strong> Google Cloud Run (asia-south1 Mumbai) + Cloudflare CDN vector tile caching.
            </div>
          </div>
        </div>
      </div>

      <div class="tech-stack-strip">
        <strong>Core Engineering Stack:</strong>
        <div class="tech-badges">
          <span class="tech-pill">React 19</span>
          <span class="tech-pill">TypeScript 5.9</span>
          <span class="tech-pill">MapLibre GL</span>
          <span class="tech-pill">Python 3.12</span>
          <span class="tech-pill">FastAPI</span>
          <span class="tech-pill">PostgreSQL 16</span>
          <span class="tech-pill">PostGIS 3.4</span>
          <span class="tech-pill">Docker</span>
          <span class="tech-pill">Sentinel-2</span>
          <span class="tech-pill">Cloud Run</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- SLIDE 4: FEASIBILITY & LEAN ECONOMICS -->
  <!-- ========================================== -->
  <section class="slide" id="slide-4">
    <div class="slide-header">
      <div class="header-left">
        <div class="national-flag-pill">
          <div class="flag-bar"></div>
          <div>
            <div class="dept-title">Feasibility and Viability · Financial & Operational Model</div>
            <div class="dept-sub">Lean OpEx (Rupees), Administrative Scalability & Risk Mitigation</div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="hackathon-badge">SMART INDIA HACKATHON 2026 <span class="id">SIH26014</span></div>
        <div class="slide-page-num"><strong>04</strong> / 06</div>
      </div>
    </div>

    <div class="slide-content">
      <div class="category-kicker">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        Pragmatic Economics & Readiness
      </div>
      <h2 class="slide-headline">Feasibility, Lean Economics & Self-Funding Model</h2>
      <p class="slide-subheadline">
        Running a complete Indian state for less than a single district's annual paper and stationery budget.
      </p>

      <div class="feasibility-grid">
        <!-- Left Panel: Cost Model -->
        <div class="clean-panel">
          <div>
            <div class="panel-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Monthly Infrastructure Cost (OpEx in Indian Rupees)
            </div>
            <table class="cost-table">
              <thead>
                <tr>
                  <th>Deployment Tier</th>
                  <th>Cloud Components</th>
                  <th style="text-align: right;">Monthly Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="tier">Pilot Mandal<br><span style="font-size: 13px; color: #64748b; font-weight: 500;">100,000 Plots</span></td>
                  <td style="color: #475569;">Google Cloud Run (2 vCPU/4GB) + Neon PostGIS + Cloud Storage</td>
                  <td class="price">~₹8,000 / mo</td>
                </tr>
                <tr>
                  <td class="tier">Full State<br><span style="font-size: 13px; color: #64748b; font-weight: 500;">30 Million Plots</span></td>
                  <td style="color: #475569;">Autoscaling Cluster + High-Availability PostGIS + Cloudflare Edge CDN</td>
                  <td class="price">~₹3,80,000 / mo</td>
                </tr>
              </tbody>
            </table>
            <div style="font-size: 13px; color: #64748b; font-style: italic; margin-bottom: 20px;">
              *A statewide deployment runs for under ₹3.8 Lakhs/month—less than a single district collectorate’s annual printing budget!
            </div>
          </div>

          <div class="monetize-box">
            <h4>3-Tier Self-Funding Monetization Engine</h4>
            <div class="monetize-items">
              <p><strong>1. G2G State SaaS Concession:</strong> Annual software license of <strong>₹15 Lakhs – ₹25 Lakhs per district</strong> for revenue consoles, satellite alerts, and spatial workflow engines.</p>
              <p><strong>2. G2C Citizen Micro-Fees:</strong> Nominal fee of <strong>₹25 – ₹50</strong> for citizen downloads of digitally signed Title Certificates and FMB maps.</p>
              <p><strong>3. B2B Banking APIs:</strong> High-margin fee of <strong>₹150 – ₹300 per hit</strong> charged to commercial banks (SBI, HDFC, NABARD) for automated 9-point title verification.</p>
            </div>
          </div>
        </div>

        <!-- Right Panel: Operational & Legal Mitigations -->
        <div class="clean-panel">
          <div>
            <div class="panel-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Operational Readiness & Zero Administrative Friction
            </div>
            <div class="readiness-list">
              <div class="readiness-item">
                <h5>Direct Statutory Alignment</h5>
                <p>Directly enforces Section 5 of the Record of Rights (ROR) Act and State Survey & Boundaries Acts without requiring constitutional amendments.</p>
              </div>
              <div class="readiness-item">
                <h5>Empowers Existing Revenue Officers</h5>
                <p>Does not replace officers. Pre-assembles evidence dossiers for VROs, Surveyors, and Tahsildars to issue valid Speaking Orders.</p>
              </div>
              <div class="readiness-item">
                <h5>Bandwidth-Efficient for Rural Bharat</h5>
                <p>Mapbox Vector Tiles stream over low-bandwidth 3G/4G connections consuming &lt;150 KB per viewport.</p>
              </div>
            </div>
          </div>

          <div style="margin-top: 24px; padding-top: 20px; border-top: 1.5px solid #e2e8f0;">
            <div style="font-weight: 700; font-size: 18px; color: #0f172a; margin-bottom: 12px;">Critical Challenges & Statutory Mitigations</div>
            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 14px;">
              <div>
                <strong style="color: #dc2626;">Discrepancy between Revenue and Deeds:</strong>
                <span style="color: #475569;">Tract never artificially overwrites records; it surfaces an automated <em>'Title-Registration Asymmetry'</em> warning to prevent fraudulent sales.</span>
              </div>
              <div>
                <strong style="color: #d97706;">Boundary Tampering:</strong>
                <span style="color: #475569;">Database schema enforces an immutable ±15% statutory area variance ceiling. Any higher variance legally requires gazetted District Collector de-novo approval.</span>
              </div>
              <div>
                <strong style="color: #2563eb;">Privacy vs Public Transparency:</strong>
                <span style="color: #475569;">DPDP Act 2023 purpose-bound consent masking protects personal data by default, unmasking strictly with authenticated citizen OTP or bank tokens.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- SLIDE 5: SOCIO-ECONOMIC MULTIPLIERS -->
  <!-- ========================================== -->
  <section class="slide" id="slide-5">
    <div class="slide-header">
      <div class="header-left">
        <div class="national-flag-pill">
          <div class="flag-bar"></div>
          <div>
            <div class="dept-title">Impact and Benefits · Socio-Economic Value</div>
            <div class="dept-sub">Unlocking Dead Capital, Eradicating Generational Litigation & Citizen Dignity</div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="hackathon-badge">SMART INDIA HACKATHON 2026 <span class="id">SIH26014</span></div>
        <div class="slide-page-num"><strong>05</strong> / 06</div>
      </div>
    </div>

    <div class="slide-content">
      <div class="category-kicker">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Transformational Impact
      </div>
      <h2 class="slide-headline">National Economic Multipliers & Human Dignity</h2>
      <p class="slide-subheadline">
        Tangible transformation for smallholder farmers, state revenue administrations, infrastructure, and banking.
      </p>

      <!-- 4 Giant Headline Impact Metrics -->
      <div class="headline-metrics-row">
        <div class="headline-stat-card">
          <div class="val" style="color: #dc2626;">66% → &lt;10%</div>
          <div class="lbl">Civil Court Land Cases</div>
          <div class="sub">Disputes eliminated at source by unifying title and registry records.</div>
        </div>
        <div class="headline-stat-card">
          <div class="val" style="color: #059669;">28d → 4min</div>
          <div class="lbl">Title Verification Time</div>
          <div class="sub">Instant multi-department search replaces physical queues.</div>
        </div>
        <div class="headline-stat-card">
          <div class="val" style="color: #d97706;">₹16 Lakh Cr</div>
          <div class="lbl">Dead Capital Unlocked</div>
          <div class="sub">Converts frozen land into bankable collateral for formal credit.</div>
        </div>
        <div class="headline-stat-card">
          <div class="val" style="color: #2563eb;">24m → 60d</div>
          <div class="lbl">GatiShakti Land Clearance</div>
          <div class="sub">Automated RFCTLARR severance math prevents acquisition delays.</div>
        </div>
      </div>

      <!-- Stakeholder Stories -->
      <div class="stakeholder-editorial">
        <div class="stakeholder-col">
          <h4>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Smallholder Farmers & Rural Families
          </h4>
          <ul>
            <li><strong>Escape from 36% Moneylenders:</strong> A verified digital title allows a farmer to secure formal 7% priority-sector bank credit instead of falling into compound debt.</li>
            <li><strong>Ending Generational Trauma:</strong> Sparing children from 20-year civil court litigation inherited from parents.</li>
            <li><strong>Women Landowner Security:</strong> DPDP Act 2023 masking shields female property owners from harassment and forged transfers.</li>
          </ul>
        </div>

        <div class="stakeholder-col">
          <h4>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M3 21h18M3 7h18M5 7v14M19 7v14M10 7v14M14 7v14M12 2l10 5H2l10-5z"/></svg>
            State Revenue & Registration Departments
          </h4>
          <ul>
            <li><strong>80% Reduction in Mutation Backlogs:</strong> 4-stage desk conveyor pre-assembles statutory evidence for Tahsildars.</li>
            <li><strong>Zero Double-Registration Scams:</strong> Sub-Registrar cannot register deed papers without spatial parcel lock.</li>
            <li><strong>Automated Speaking Orders:</strong> Standardizes quasi-judicial records to withstand High Court scrutiny.</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- SLIDE 6: STATUTORY GROUNDING & STANDARDS -->
  <!-- ========================================== -->
  <section class="slide" id="slide-6">
    <div class="slide-header">
      <div class="header-left">
        <div class="national-flag-pill">
          <div class="flag-bar"></div>
          <div>
            <div class="dept-title">Research and References · Standards Alignment</div>
            <div class="dept-sub">Statutory Acts, International Norms & National Mission Alignment</div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="hackathon-badge">SMART INDIA HACKATHON 2026 <span class="id">SIH26014</span></div>
        <div class="slide-page-num"><strong>06</strong> / 06</div>
      </div>
    </div>

    <div class="slide-content">
      <div class="category-kicker">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Sovereign Compliance
      </div>
      <h2 class="slide-headline">Statutory Grounding & Geospatial Compliance</h2>
      <p class="slide-subheadline">
        Built strictly on established parliamentary legislation, OGC open geospatial standards, and national digital infrastructure missions.
      </p>

      <div class="compliance-grid">
        <div class="comp-col">
          <h4>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            1. Statutory Acts
          </h4>
          <ul>
            <li><strong>State ROR Acts (§5):</strong> Quasi-judicial mutation conveyor & mandatory Speaking Orders.</li>
            <li><strong>RFCTLARR Act 2013 (§23A, §64):</strong> Statutory severance compensation & 100% solatium.</li>
            <li><strong>Registration Act 1908:</strong> Provenance-based title vs instrument matrix.</li>
            <li><strong>DPDP Act 2023:</strong> Purpose-bound consent masking for citizen data.</li>
          </ul>
        </div>

        <div class="comp-col">
          <h4>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg>
            2. Geospatial Norms
          </h4>
          <ul>
            <li><strong>ISO 19152 (LADM):</strong> Land Administration Domain Model for 3D Volumetric Cadastres.</li>
            <li><strong>OGC API Features:</strong> Open geospatial consortium interoperable endpoints.</li>
            <li><strong>Mapbox Vector Tiles (MVT):</strong> Binary vector streaming specification 2.1.</li>
            <li><strong>W3C JSON-LD 1.1:</strong> Common Linked Data contextual schemas.</li>
          </ul>
        </div>

        <div class="comp-col">
          <h4>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            3. National Missions
          </h4>
          <ul>
            <li><strong>PM GatiShakti:</strong> Multimodal National Master Plan spatial corridor integration.</li>
            <li><strong>DILRMP:</strong> Digital India Land Records Modernization Programme.</li>
            <li><strong>SVAMITVA Scheme:</strong> Survey of Villages and Mapping with Improvised Technology.</li>
            <li><strong>MeitY Cloud Guidelines:</strong> Sovereign in-country data residency.</li>
          </ul>
        </div>

        <div class="comp-col">
          <h4>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            4. Remote Sensing
          </h4>
          <ul>
            <li><strong>ESA Copernicus Sentinel-2:</strong> Level-2A surface reflectance satellite pipeline.</li>
            <li><strong>NDVI Algorithms:</strong> Rouse et al., Normalized Difference Vegetation Index for encroachment.</li>
            <li><strong>NDBI Mapping:</strong> Zha et al., Built-up index for foundation trench detection.</li>
            <li><strong>PostGIS 3.4 Specs:</strong> Topological spatial invariant validation algorithms.</li>
          </ul>
        </div>
      </div>

      <!-- Sovereign Vision Anchor Bar -->
      <div class="sovereign-anchor">
        <div class="anchor-text">
          <h3>"Transitioning India from presumptive deed registration to conclusive, bankable 3D cadastral property rights."</h3>
          <p>Project Tract · Team Tract · Ministry of Rural Development & Smart India Hackathon 2026 Submission</p>
        </div>
        <div class="anchor-actions">
          <a href="https://github.com/kbs6108/Hexaverse2" target="_blank" class="primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
            GitHub Repository
          </a>
          <a href="https://youtu.be/demo" target="_blank" class="secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Video Pitch Demo
          </a>
        </div>
      </div>
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

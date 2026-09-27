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

with open('docs/plan/sih_presentation_deck.html', 'r') as f:
    template = f.read()

# Let's replace the laptop screen image with live_map_b64
import re
# Find the macbook-screen img src and replace it with live_map_b64
template = re.sub(
    r'(<div class="macbook-screen">\s*<img src=")[^"]+(")',
    r'\g<1>' + live_map_b64 + r'\2',
    template
)

# Now let's replace the left side mobile section of Slide 2 with the genuine native mobile app UI!
old_mobile_block_pattern = r'<!-- LEFT: MOBILE APP PREVIEW -->.*?<!-- RIGHT: WEB APP LAPTOP PREVIEW -->'

native_mobile_html = '''<!-- LEFT: NATIVE MOBILE EXPERIENCE -->
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
        <div style="font-size: 13.5px; font-weight: 800; color: var(--navy-dark); text-transform: uppercase; letter-spacing: 0.05em;">
          📱 Native Mobile App · Citizen & Field Officer
        </div>
        <span class="card-badge badge-emerald">Offline-First PWA</span>
      </div>

      <div style="display: flex; gap: 14px; justify-content: center;">
        
        <!-- PHONE 1: CITIZEN PASSBOOK & SEARCH -->
        <div class="native-phone">
          <div class="phone-island"></div>
          <div class="phone-screen-native">
            <div class="phone-status-bar">
              <span>9:41</span>
              <span>5G 📶 100%</span>
            </div>
            <div class="phone-app-header">
              <div style="font-weight: 800; color: var(--navy-dark); font-size: 11.5px;">DoLR Tract · భూమి</div>
              <div style="font-size: 9.5px; background: #EEF2FF; padding: 2px 6px; border-radius: 4px; color: var(--navy-primary); font-weight: 700;">తెలుగు | EN</div>
            </div>
            <div class="phone-scroll">
              <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px;">
                <div style="font-size: 9px; font-weight: 700; color: #64748B;">ULPIN PARCEL SEARCH</div>
                <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: var(--navy-dark);">TFCM91641E6C82</div>
              </div>

              <!-- E-PASSBOOK CARD -->
              <div style="background: linear-gradient(135deg, #1E3A8A 0%, #0A2540 100%); color: #FFF; border-radius: 8px; padding: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 9.5px; font-weight: 800; color: #FBBF24;">DIGITAL TITLE PASSBOOK</span>
                  <span style="font-size: 8px; background: #059669; padding: 1px 4px; border-radius: 3px; font-weight: 700;">VERIFIED</span>
                </div>
                <div style="font-size: 11px; font-weight: 700; margin-top: 4px;">Pattadar: Ravi Kumar (K-0421)</div>
                <div style="font-size: 9.5px; color: #E2E8F0; margin-top: 2px;">Survey No: 123/4 · Extent: 874.3 m²</div>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6px;">
                  <div style="font-size: 8px; color: #94A3B8;">SHA-256: 8f4c2...ba1</div>
                  <div style="width: 22px; height: 22px; background: #FFF; border-radius: 3px; display: flex; align-items: center; justify-content: center; color: #000; font-size: 8px; font-weight: 800;">QR</div>
                </div>
              </div>

              <!-- 4-DEPT STATUS -->
              <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px;">
                <div style="font-size: 9.5px; font-weight: 800; color: var(--navy-dark); margin-bottom: 4px;">Sovereign Truth Check:</div>
                <div style="font-size: 9px; color: #059669; font-weight: 600;">✓ Revenue 1-B: Clear Title</div>
                <div style="font-size: 9px; color: #059669; font-weight: 600;">✓ SRO: 0 Charges (30-Yr EC)</div>
                <div style="font-size: 9px; color: #059669; font-weight: 600;">✓ Court: 0 Lis Pendens Injunction</div>
              </div>
            </div>
            <div class="phone-tab-bar">
              <span class="tab-item active" style="color: #1E3A8A;">🏠 Home</span>
              <span class="tab-item">🔍 Search</span>
              <span class="tab-item">📜 Passbook</span>
              <span class="tab-item">👤 Profile</span>
            </div>
          </div>
        </div>

        <!-- PHONE 2: FIELD OFFICER SAT ALERT & QUEUE -->
        <div class="native-phone">
          <div class="phone-island"></div>
          <div class="phone-screen-native">
            <div class="phone-status-bar">
              <span>9:41</span>
              <span>5G 📶 100%</span>
            </div>
            <div class="phone-app-header">
              <div style="font-weight: 800; color: var(--navy-dark); font-size: 11.5px;">Officer Desk · Tahsildar</div>
              <div style="font-size: 9.5px; background: #FEF3C7; padding: 2px 6px; border-radius: 4px; color: #B45309; font-weight: 700;">Active Duty</div>
            </div>
            <div class="phone-scroll">
              
              <!-- SATELLITE ALERT CARD -->
              <div style="background: #FFF1F2; border: 1px solid #FECDD3; border-radius: 8px; padding: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 9.5px; font-weight: 800; color: #BE123C;">🛰️ SENTINEL-2 ALERT</span>
                  <span style="font-size: 8px; background: #E11D48; color: #FFF; padding: 1px 4px; border-radius: 3px; font-weight: 700;">ORBIT DAY 5</span>
                </div>
                <div style="font-size: 10px; font-weight: 700; color: #881337; margin-top: 3px;">Plot 124 (Poramboke Land)</div>
                <div style="font-size: 8.5px; color: #475569; margin-top: 2px;">NDVI: -38% drop · NDBI: +64% built-up surge. Unrecorded foundation detected.</div>
              </div>

              <!-- PENDING QUASI-JUDICIAL MUTATION -->
              <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px;">
                <div style="font-size: 9.5px; font-weight: 800; color: var(--navy-dark);">Mutation Desk (ROR Act §5)</div>
                <div style="font-size: 9px; color: #334155; margin-top: 2px;">App: APP-2026-000121 · Sy 123/4</div>
                <div style="font-size: 8.5px; color: #059669; font-weight: 600; margin-top: 3px;">✓ Stage 1 VRO Ground Panchanama</div>
                <div style="font-size: 8.5px; color: #059669; font-weight: 600;">✓ Stage 2 Surveyor FMB Demarcation</div>
                <div style="font-size: 8.5px; color: #059669; font-weight: 600;">✓ Stage 3 RI 30-Year Ancestral Link</div>
                <div style="background: var(--navy-primary); color: #FFF; text-align: center; padding: 4px; border-radius: 4px; font-size: 8.5px; font-weight: 700; margin-top: 5px;">
                  Issue Statutory Speaking Order
                </div>
              </div>

            </div>
            <div class="phone-tab-bar">
              <span class="tab-item active" style="color: #1E3A8A;">📋 Queue</span>
              <span class="tab-item">🛰️ Alerts</span>
              <span class="tab-item">🗺️ GIS Map</span>
              <span class="tab-item">⚙️ Settings</span>
            </div>
          </div>
        </div>

      </div>

      <div style="margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div class="card" style="padding: 8px 12px;">
          <div style="font-size: 11.5px; font-weight: 700; color: var(--navy-dark);">DPDP Act 2023 Masking</div>
          <div style="font-size: 10.5px; color: var(--text-muted);">Names masked (R*** K***) on search</div>
        </div>
        <div class="card" style="padding: 8px 12px;">
          <div style="font-size: 11.5px; font-weight: 700; color: var(--navy-dark);">Instant E-Passbook</div>
          <div style="font-size: 10.5px; color: var(--text-muted);">Verifiable QR cryptographic proof</div>
        </div>
      </div>
    </div>

    <!-- RIGHT: WEB APP LAPTOP PREVIEW -->'''

template = re.sub(old_mobile_block_pattern, native_mobile_html, template, flags=re.DOTALL)

# Add native mobile CSS
native_css = '''
  /* NATIVE MOBILE APP FRAMES */
  .native-phone {
    width: 255px;
    background: #0F172A;
    border-radius: 38px;
    padding: 10px;
    box-shadow: 0 25px 45px -10px rgba(15, 23, 42, 0.3), 0 0 0 3px #334155;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .phone-island {
    width: 80px;
    height: 18px;
    background: #000000;
    border-radius: 12px;
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
  }
  .phone-screen-native {
    height: 475px;
    background: #F8FAFC;
    border-radius: 28px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
    font-size: 11px;
    border: 1px solid #1E293B;
  }
  .phone-status-bar {
    height: 38px;
    padding: 10px 16px 0 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
    font-weight: 700;
    color: #0F172A;
  }
  .phone-app-header {
    padding: 4px 14px 10px 14px;
    background: #FFFFFF;
    border-bottom: 1px solid #E2E8F0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .phone-scroll {
    flex: 1;
    overflow-y: hidden;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .phone-tab-bar {
    height: 44px;
    background: #FFFFFF;
    border-top: 1px solid #E2E8F0;
    display: flex;
    justify-content: space-around;
    align-items: center;
    font-size: 9.5px;
    font-weight: 700;
    color: #64748B;
  }
  /* EDITABLE LINKS BAR */
  .links-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #FFFFFF;
    border: 1.5px dashed #3B82F6;
    padding: 8px 16px;
    border-radius: 10px;
    margin-top: 10px;
  }
  .link-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    font-family: 'JetBrains Mono', monospace;
  }
  .link-github { background: #F1F5F9; color: #0F172A; border: 1px solid #CBD5E1; }
  .link-video { background: #FFF1F2; color: #BE123C; border: 1px solid #FECDD3; }
  .link-live { background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; }
'''

template = template.replace('</style>', native_css + '\n</style>')

# Add the editable links bar into Slide 1
slide_1_links = '''
    <!-- EDITABLE REPO & VIDEO LINKS PLACEHOLDER -->
    <div class="links-bar">
      <div style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: var(--navy-primary); letter-spacing: 0.05em;">
        🔗 Submission Verification Links:
      </div>
      <a href="https://github.com/kbs6108/Hexaverse2" class="link-pill link-github" target="_blank">
        GitHub: https://github.com/kbs6108/Hexaverse2
      </a>
      <a href="https://youtu.be/your-pitch-video" class="link-pill link-video" target="_blank">
        ▶️ Video Pitch: https://youtu.be/your-pitch-video
      </a>
      <a href="http://localhost:5173" class="link-pill link-live" target="_blank">
        🌐 Live DPI Web App: http://localhost:5173
      </a>
    </div>
'''

if 'links-bar' not in template:
    template = template.replace('<!-- EXECUTIVE CALLOUT -->', slide_1_links + '\n    <!-- EXECUTIVE CALLOUT -->')

# Add link buttons to Slide 6 footer
slide_6_links = '''
      <div style="display: flex; gap: 12px;">
        <a href="https://github.com/kbs6108/Hexaverse2" style="background: rgba(255,255,255,0.15); color: #FFF; padding: 7px 14px; border-radius: 6px; font-size: 11.5px; font-weight: 700; text-decoration: none; border: 1px solid rgba(255,255,255,0.3); font-family: 'JetBrains Mono', monospace;" target="_blank">
          GitHub Repository
        </a>
        <a href="https://youtu.be/your-pitch-video" style="background: #E11D48; color: #FFF; padding: 7px 14px; border-radius: 6px; font-size: 11.5px; font-weight: 700; text-decoration: none; font-family: 'JetBrains Mono', monospace;" target="_blank">
          ▶️ Video Pitch Demo
        </a>
      </div>
'''
if 'GitHub Repository' not in template:
    template = template.replace('Problem Statement SIH26014</div>\n      </div>', 'Problem Statement SIH26014</div>\n      </div>\n' + slide_6_links)

# Humanize Slide 1 Narrative
humanized_story = '''
          <div style="font-size: 12.5px; font-weight: 800; color: var(--navy-primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px;">
            The Everyday Citizen Struggle: Six Disconnected Offices for One Plot of Land
          </div>
          <p style="font-size: 14.5px; color: var(--text-secondary); line-height: 1.5;">
            When an Indian farmer or homebuyer purchases land, they must physically run between six disconnected offices—Revenue (Tehsil), Sub-Registrar (SRO), Survey (FMB), Town Planning, Tax, and Courts. Because these systems never talk to each other, fraudsters exploit the gap to register forged deeds on mortgaged land, resulting in <strong>66% of all civil court disputes</strong> and trapping <strong>₹16 Lakh Crore in dead capital</strong>.
          </p>
          <div style="margin-top: 8px; font-size: 13.5px; font-weight: 700; color: var(--navy-dark);">
            💡 Project Tract solves this by connecting all six departments around one universal spatial key (ULPIN)—delivering the single source of truth in under 400 milliseconds.
          </div>
'''
template = re.sub(
    r'<div style="font-size: 13px; font-weight: 800; color: var\(--navy-primary\); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">The Sovereign Innovation</div>\s*<p style="font-size: 15.5px; color: var\(--text-secondary\); line-height: 1.5;">.*?</p>',
    humanized_story,
    template,
    flags=re.DOTALL
)

with open('docs/plan/sih_presentation_deck.html', 'w') as f:
    f.write(template)

print("Updated docs/plan/sih_presentation_deck.html successfully!")

# Run Chrome to compile new PDF
chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
pdf_out = "docs/plan/SIH2026_TRACT_PRESENTATION.pdf"
cmd = [
    chrome_path,
    "--headless",
    "--disable-gpu",
    "--print-to-pdf=" + pdf_out,
    "file://" + os.path.abspath("docs/plan/sih_presentation_deck.html")
]
print("Re-compiling PDF via Chrome...")
res = subprocess.run(cmd, capture_output=True, text=True)
if os.path.exists(pdf_out):
    print("New PDF successfully generated at:", pdf_out, "Size:", os.path.getsize(pdf_out), "bytes")
else:
    print("PDF generation failed:", res.stderr)

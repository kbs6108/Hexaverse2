#!/usr/bin/env python3
"""
Update Slide 4 in docs/plan/sih_presentation_deck.html to explicitly reflect:
1. Multi-State Heterogeneity (Webland, Dharani, Bhoomi, Bhulekh, AnyRoR)
2. Degraded Physical Offline Paper Deeds & Faded Vernacular Ink (Google Cloud Vertex AI & Gemini Multimodal Vision)
3. National Scaling on Google Cloud Infrastructure (Cloud Run, BigQuery GIS, 150KB Vector Tiles)
"""
import re

html_path = "docs/plan/sih_presentation_deck.html"
with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

old_matrix = """            <!-- Row 1: Legacy Spatial Distortion -->
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
            </div>"""

new_matrix = """            <!-- Row 1: Degraded Offline Paper Records -->
            <div class="sih-matrix-row">
              <div class="matrix-challenge">
                <div class="challenge-headline">
                  <span class="matrix-num-badge">01</span>
                  <span class="challenge-tag">HERITAGE RECORDS</span>
                  <span class="challenge-title">Degraded Paper Deeds &amp; Faded Vernacular Ink</span>
                </div>
                <div class="challenge-desc">Legacy tehsil records are 30–70 years old—yellowed, water-stained, torn, with faded rubber stamps and cursive regional scripts (Telugu, Hindi, Kannada) where traditional OCR fails.</div>
              </div>
              <div class="matrix-solution">
                <div class="solution-headline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Google Cloud Vertex AI Multimodal Vision &amp; Spatial Triangulation</span>
                </div>
                <div class="solution-desc">Tract deploys <strong>Gemini Multimodal Vision on Google Cloud Vertex AI</strong> to extract low-contrast handwriting and seals, triangulating extracted survey numbers against the live PostGIS cadastre with cryptographic SHA-256 fingerprinting.</div>
              </div>
            </div>

            <!-- Row 2: Multi-State Heterogeneity -->
            <div class="sih-matrix-row">
              <div class="matrix-challenge">
                <div class="challenge-headline">
                  <span class="matrix-num-badge">02</span>
                  <span class="challenge-tag">FEDERATION</span>
                  <span class="challenge-title">Fragmented Multi-State Data &amp; Siloed Portals</span>
                </div>
                <div class="challenge-desc">All 28 States operate isolated land portals (AP: Webland, TS: Dharani, KA: Bhoomi, UP: Bhulekh, GJ: AnyRoR) with divergent database schemas, local land units (cents, bigha, gunta), and regional rules.</div>
              </div>
              <div class="matrix-solution">
                <div class="solution-headline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Zero-Disruption Read-Only Adapters &amp; ISO 19152 ULPIN Mapping</span>
                </div>
                <div class="solution-desc">Tract connects via read-only Change Data Capture (CDC) adapters without altering state databases. Diverse units dynamically canonicalize to standard metric m² (EPSG:4326) and bind to the central 14-digit ULPIN (Bhu-Aadhaar).</div>
              </div>
            </div>

            <!-- Row 3: National Scale on Google Cloud -->
            <div class="sih-matrix-row">
              <div class="matrix-challenge">
                <div class="challenge-headline">
                  <span class="matrix-num-badge">03</span>
                  <span class="challenge-tag">CLOUD SCALING</span>
                  <span class="challenge-title">Pan-India Scale (140M+ Agricultural Holdings)</span>
                </div>
                <div class="challenge-desc">Hosting and querying over 140 million parcel boundaries in real time risks extreme cloud server costs, network latency on rural 3G, and database locking.</div>
              </div>
              <div class="matrix-solution">
                <div class="solution-headline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Google Cloud Run, BigQuery GIS &amp; 150KB Edge Vector Tiling</span>
                </div>
                <div class="solution-desc">Stateless microservices auto-scale on <strong>Google Cloud Run &amp; GKE</strong>; <strong>Google BigQuery GIS</strong> handles petabyte-scale infrastructure corridor overlays; and compressed binary vector tiles stream under <strong>150 KB</strong> to mobile GPUs.</div>
              </div>
            </div>

            <!-- Row 4: Shrunk Paper Maps -->
            <div class="sih-matrix-row">
              <div class="matrix-challenge">
                <div class="challenge-headline">
                  <span class="matrix-num-badge">04</span>
                  <span class="challenge-tag">DATA INTEGRITY</span>
                  <span class="challenge-title">Shrunk Paper Maps &amp; Boundary Skew</span>
                </div>
                <div class="challenge-desc">Centuries-old paper village maps have shrunk over time. When digitized, boundaries clash with what farmers cultivate on the ground.</div>
              </div>
              <div class="matrix-solution">
                <div class="solution-headline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Magnetic Snap to Baselines &amp; Statutory ±15% Variance Rule</span>
                </div>
                <div class="solution-desc">Database rules (<code>ST_Snap</code>, <code>ST_Disjoint</code>) magnetically lock boundaries to CORS benchmarks. Deviations within statutory <strong>±15%</strong> (Survey &amp; Boundaries Act) resolve with mathematical audit logs; larger variance triggers joint ground demarcation.</div>
              </div>
            </div>

            <!-- Row 5: Citizen Privacy / DPDP -->
            <div class="sih-matrix-row">
              <div class="matrix-challenge">
                <div class="challenge-headline">
                  <span class="matrix-num-badge">05</span>
                  <span class="challenge-tag">STATUTORY</span>
                  <span class="challenge-title">Citizen Privacy &amp; Anti-Profiling Protections</span>
                </div>
                <div class="challenge-desc">Putting land records on public maps risks predatory land mafia profiling, fraud, and unlawful exposure of personal citizen identities.</div>
              </div>
              <div class="matrix-solution">
                <div class="solution-headline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b3b6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>DPDP-Aligned Purpose-Bound Edge Masking (DPDP Act 2023 §6)</span>
                </div>
                <div class="solution-desc">Public portal displays masked names (<code>R*** K***</code>), revealing full personal details strictly to authenticated landowners (Aadhaar OTP) or licensed financial institutions with audit trails.</div>
              </div>
            </div>"""

if old_matrix in content:
    content = content.replace(old_matrix, new_matrix)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Slide 4 successfully updated with new challenges and solutions.")
else:
    print("Warning: exact old_matrix snippet not found, trying regex...")
    pattern = re.compile(r'<!-- Row 1: Legacy Spatial Distortion -->.*?<!-- Row 4: Rural Edge Divide -->\s*<div class="sih-matrix-row">.*?</div>\s*</div>', re.DOTALL)
    if pattern.search(content):
        content = pattern.sub(new_matrix + "\n          </div>", content)
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Slide 4 updated via regex replacement.")
    else:
        print("Error: Could not locate matrix container in Slide 4.")

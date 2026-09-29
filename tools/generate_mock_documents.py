#!/usr/bin/env python3
"""
Generate Realistic Mock Indian Land & Revenue Documents for Project Tract.
Outputs formatted, official-looking PDFs and images into `docs/mock_documents/`:
1. 01_REGISTERED_SALE_DEED_Sy123_4.pdf (Title Mutation / Name Change following sale)
2. 02_SUCCESSION_LEGAL_HEIR_CERTIFICATE_Sy123_4.pdf (Inheritance / Succession Mutation)
3. 03_CORRIDOR_ACQUISITION_CLAIM_Sy127_1.pdf (Statutory Land Acquisition Claim under RFCTLARR 2013)
"""

import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

OUT_DIR = Path("docs/mock_documents")
OUT_DIR.mkdir(parents=True, exist_ok=True)

def build_sale_deed():
    pdf_path = OUT_DIR / "01_REGISTERED_SALE_DEED_Sy123_4.pdf"
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40,
    )
    styles = getSampleStyleSheet()
    
    header_style = ParagraphStyle(
        'GovHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        alignment=1, # Center
        textColor=colors.HexColor('#1E293B'),
    )
    sub_header = ParagraphStyle(
        'GovSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        alignment=1,
        textColor=colors.HexColor('#475569'),
    )
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        alignment=1,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=8,
    )
    body = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#1E293B'),
        alignment=4, # Justify
    )
    meta_label = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#334155'),
    )
    meta_val = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#0F172A'),
    )

    story = []

    # Stamp Duty & E-Stamping Header Box
    stamp_data = [
        [
            Paragraph("<b>GOVERNMENT OF ANDHRA PRADESH</b><br/>REGISTRATION AND STAMPS DEPARTMENT", header_style),
            Paragraph("<b>NON-JUDICIAL E-STAMP CERTIFICATE</b><br/>Certificate No: <b>IN-AP88421092384752U</b><br/>Date of E-Stamp: 18-Feb-2026", sub_header),
        ],
        [
            Paragraph("<b>Sub-Registrar Office:</b> Mangalagiri (Guntur Dist.)<br/><b>Document No:</b> DOC-2026-AP-008421<br/><b>Book / CD No:</b> Book-1 / CD-2026-04", meta_label),
            Paragraph("<b>Stamp Duty:</b> ₹3,41,250/- (e-Challan Paid)<br/><b>Transfer Duty:</b> ₹68,250/- | <b>Reg. Fee:</b> ₹45,500/-<br/><b>Consideration:</b> ₹45,50,000/-", meta_label),
        ]
    ]
    stamp_table = Table(stamp_data, colWidths=[260, 255])
    stamp_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#0F766E')),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F0FDFA')),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#F8FAFC')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(stamp_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("DEED OF ABSOLUTE SALE (TITLE CONVEYANCE)", title_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=8))

    # Parties narrative
    narrative_1 = """
    This <b>DEED OF ABSOLUTE SALE</b> is executed on this <b>18th day of February, 2026</b> at Mangalagiri, Andhra Pradesh by and between:
    <br/><br/>
    <b>EXECUTANT / VENDOR:</b><br/>
    <b>SRI RAVI KUMAR</b>, Aged about 48 Years, S/o Late Koteswara Rao, Indian National, Hindu, 
    Occupation: Agriculture & Business, Residing at Door No. 4-122, Main Bazaar, Mangalagiri Rural, 
    Guntur District, Andhra Pradesh. 
    <i>(Hereinafter called the <b>VENDOR</b>, which expression shall include his heirs, legal successors, executors, and administrators).</i>
    <br/><br/>
    <b>IN FAVOUR OF:</b>
    <br/><br/>
    <b>CLAIMANT / PURCHASER:</b><br/>
    <b>SRI RAMESH NAIDU</b>, Aged about 42 Years, S/o Sri Appa Rao, Indian National, Hindu, 
    Occupation: Salaried Professional, Residing at Flat No. 302, Sri Balaji Towers, MG Road, Vijayawada, 
    Krishna District, Andhra Pradesh. 
    <i>(Hereinafter called the <b>PURCHASER</b>, which expression shall include his heirs, legal successors, executors, and administrators).</i>
    """
    story.append(Paragraph(narrative_1, body))
    story.append(Spacer(1, 8))

    narrative_2 = """
    <b>WHEREAS</b> the VENDOR is the absolute, lawful and sole owner and in peaceful possession and enjoyment of the 
    agricultural / residential property bearing <b>Survey No. 123/4</b>, Khata No. <b>K-0421</b>, measuring an extent of 
    <b>874.30 Square Metres (equivalent to 0.216 Acres / 21.6 Cents)</b>, situated at Mangalagiri (Rural) Village, 
    Mangalagiri Mandal, Guntur District, Andhra Pradesh, having acquired the same through inheritance under ancestral title 
    and duly recorded in Record of Rights (RoR 1-B) by the Tahsildar, Mangalagiri with Assigned Unique Land Parcel 
    Identification Number <b>ULPIN: TFCM91641E6C82</b>.
    <br/><br/>
    <b>NOW THIS INDENTURE OF SALE WITNESSETH:</b><br/>
    That in consideration of the sum of <b>₹45,50,000/- (Rupees Forty-Five Lakhs and Fifty Thousand Only)</b> mutually agreed upon, 
    the entire sale consideration having been paid in full by the PURCHASER to the VENDOR vide RTGS/Bank Transfer 
    No. <i>HDFC0001842-TXN-99410</i> dated 16-Feb-2026 drawn on HDFC Bank, the VENDOR hereby transfers, conveys, assigns, and delivers 
    all his absolute ownership rights, title, interests, easements, and physical vacant possession of the SCHEDULE PROPERTY unto 
    the said PURCHASER forever.
    """
    story.append(Paragraph(narrative_2, body))
    story.append(Spacer(1, 10))

    # Schedule of Property Table
    sched_header = ParagraphStyle('SchedH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#0F172A'))
    story.append(Paragraph("<b>SCHEDULE OF PROPERTY CONVEYED (THE VESTED SUBJECT MATTER):</b>", sched_header))
    story.append(Spacer(1, 4))

    sched_data = [
        [Paragraph("<b>State / District</b>", meta_label), Paragraph("Andhra Pradesh / Guntur", meta_val), Paragraph("<b>Mandal / Village</b>", meta_label), Paragraph("Mangalagiri / Mangalagiri (Rural)", meta_val)],
        [Paragraph("<b>Survey Number</b>", meta_label), Paragraph("<b>123/4</b>", meta_val), Paragraph("<b>ULPIN (14-Digit)</b>", meta_label), Paragraph("<b>TFCM91641E6C82</b>", meta_val)],
        [Paragraph("<b>Khata Number</b>", meta_label), Paragraph("K-0421", meta_val), Paragraph("<b>Total Extent Conveyed</b>", meta_label), Paragraph("<b>874.30 Sq. Metres</b> (21.6 Cents)", meta_val)],
        [Paragraph("<b>Land Classification</b>", meta_label), Paragraph("Dry / Agricultural (Patta)", meta_val), Paragraph("<b>Registration Office</b>", meta_label), Paragraph("Sub-Registrar Office, Mangalagiri", meta_val)],
        [
            Paragraph("<b>Four Boundaries<br/>(Cadastral Schedule)</b>", meta_label),
            Paragraph("<b>North:</b> Land in Survey No. 123/3 (P. Venkatesh)<br/>"
                      "<b>South:</b> 30-Feet Village Panchayat Metal Road<br/>"
                      "<b>East:</b> Field Drainage Channel & Survey No. 123/5<br/>"
                      "<b>West:</b> Land in Survey No. 124 (Nageswara Rao)", meta_val),
            Paragraph("<b>Market Valuation & Tax Dues</b>", meta_label),
            Paragraph("Govt Circle Rate: ₹52,042/m²<br/>Guideline Value: ₹45,50,000/-<br/>Municipal / Land Cess: Nil (Clear)", meta_val),
        ]
    ]
    sched_table = Table(sched_data, colWidths=[105, 150, 110, 150])
    sched_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#94A3B8')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F8FAFC')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#F8FAFC')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(sched_table)
    story.append(Spacer(1, 10))

    # Covenants & Mutation Instruction
    covenants = """
    <b>COVENANTS OF TITLE & REVENUE MUTATION:</b><br/>
    The VENDOR covenants that the Schedule Property is free from all mortgages, charges, court attachments, lis pendens, 
    land acquisition notifications, and government claims. The VENDOR hereby accords full and unconditional consent for the 
    Tahsildar / Mandal Revenue Officer (MRO), Mangalagiri to mutate the name of <b>RAMESH NAIDU</b> in place of <b>RAVI KUMAR</b> 
    in the Revenue Records (RoR 1-B & Webland Portal) and issue an updated electronic e-Pattadar Passbook under the 
    Andhra Pradesh Rights in Land and Pattadar Passbooks Act, 1971.
    """
    story.append(Paragraph(covenants, body))
    story.append(Spacer(1, 12))

    # Signatures Table
    sig_data = [
        [
            Paragraph("<b>VENDOR / SELLER:</b><br/><br/><font color='#1E40AF'><b><i>Ravi Kumar</i></b></font><br/>(RAVI KUMAR)<br/>Aadhaar: XXXX-XXXX-4812", meta_label),
            Paragraph("<b>PURCHASER / BUYER:</b><br/><br/><font color='#1E40AF'><b><i>Ramesh Naidu</i></b></font><br/>(RAMESH NAIDU)<br/>Aadhaar: XXXX-XXXX-9904", meta_label),
            Paragraph("<b>WITNESSES:</b><br/>1. <i>K. Srinivasa Rao</i> (Mangalagiri)<br/>2. <i>M. Venkata Reddy</i> (Guntur)<br/><br/><b>REGISTERING OFFICER:</b><br/><i>[Signed & Digitally Sealed]</i><br/>Sub-Registrar, Mangalagiri", meta_label),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[170, 170, 175])
    sig_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#0F766E')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F0FDFA')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(sig_table)

    doc.build(story)
    print(f"Created: {pdf_path}")


def build_succession_certificate():
    pdf_path = OUT_DIR / "02_SUCCESSION_LEGAL_HEIR_CERTIFICATE_Sy123_4.pdf"
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40,
    )
    styles = getSampleStyleSheet()

    header_style = ParagraphStyle(
        'Header',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        alignment=1,
        textColor=colors.HexColor('#0F172A'),
    )
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        alignment=1,
        textColor=colors.HexColor('#B45309'),
        spaceAfter=10,
    )
    body = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#1E293B'),
    )
    meta_label = ParagraphStyle('ML', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.HexColor('#334155'))
    meta_val = ParagraphStyle('MV', fontName='Helvetica', fontSize=8, leading=10, textColor=colors.HexColor('#0F172A'))

    story = []

    story.append(Paragraph("<b>GOVERNMENT OF ANDHRA PRADESH</b><br/>REVENUE DEPARTMENT · OFFICE OF THE TAHSILDAR & EXECUTIVE MAGISTRATE<br/>MANGALAGIRI MANDAL, GUNTUR DISTRICT", header_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284C7'), spaceAfter=6))
    story.append(Paragraph("PROCEEDINGS OF THE TAHSILDAR: MANGALAGIRI<br/><b>STATUTORY LEGAL HEIR & SUCCESSION CERTIFICATE</b>", title_style))

    meta_top = [
        [Paragraph("<b>File No:</b> REV-MGL-SUC-2026/00142", meta_label), Paragraph("<b>Dated:</b> 12-Jan-2026", meta_val), Paragraph("<b>Application No:</b> AP-MUT-2026-904", meta_label)],
        [Paragraph("<b>Village:</b> Mangalagiri (Rural)", meta_label), Paragraph("<b>Mandal:</b> Mangalagiri", meta_val), Paragraph("<b>District:</b> Guntur", meta_val)]
    ]
    meta_table = Table(meta_top, colWidths=[175, 170, 170])
    meta_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    order_text = """
    <b>ORDER / PROCEEDINGS:</b><br/>
    <b>Sub:</b> Land Administration & Mutation — Mangalagiri (R) Village — Succession to the estate of Late <b>KOTESWARA RAO</b> — Death of Pattadar — Inquest conducted — Statutory Legal Heir Certificate Issued — Reg.<br/>
    <b>Ref:</b> 1. Application from Sri <b>Ravi Kumar</b> dated 02-Jan-2026.<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2. Death Certificate Reg. No. 2025/MGL/0984 dated 14-Nov-2025.<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3. Field Inquiry & Panchanama report of Village Revenue Officer (VRO), Mangalagiri (R) dated 08-Jan-2026.<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;4. Recommendation of the Revenue Inspector (RI), Mangalagiri Section dated 10-Jan-2026.
    <br/><br/>
    <b>PREAMBLE:</b><br/>
    Consequent to the demise of Sri <b>Koteswara Rao</b> on 10-Nov-2025 who was the recorded Pattadar in RoR 1-B for the agricultural land 
    bearing <b>Survey No. 123/4</b> (ULPIN: <b>TFCM91641E6C82</b>, Extent: <b>874.30 Sq. Metres</b>), field inquiry was conducted under Section 5 
    of the AP Rights in Land and Pattadar Passbooks Act. A statutory public notice was published in the village chavadi calling for objections. 
    No objections were received within the 15-day statutory window.
    <br/><br/>
    <b>DETERMINATION OF SURVIVING LEGAL HEIRS:</b><br/>
    The following individuals are verified and certified as the sole lawful surviving legal heirs of the deceased Pattadar:
    """
    story.append(Paragraph(order_text, body))
    story.append(Spacer(1, 6))

    heir_data = [
        [Paragraph("<b>Sl.</b>", meta_label), Paragraph("<b>Name of Legal Heir</b>", meta_label), Paragraph("<b>Age</b>", meta_label), Paragraph("<b>Relationship with Deceased</b>", meta_label), Paragraph("<b>Status & Entitlement</b>", meta_label)],
        [Paragraph("1", meta_val), Paragraph("<b>Smt. Lakshmi Devi</b>", meta_val), Paragraph("68 Yrs", meta_val), Paragraph("Wife / Widow", meta_val), Paragraph("Relinquished in favour of son (vide affidavit)", meta_val)],
        [Paragraph("2", meta_val), Paragraph("<b>Sri Ravi Kumar</b>", meta_val), Paragraph("48 Yrs", meta_val), Paragraph("Son (Applicant)", meta_val), Paragraph("<b>Sole Successor-in-Title (100% Extent)</b>", meta_val)],
    ]
    heir_table = Table(heir_data, colWidths=[30, 140, 50, 135, 160])
    heir_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(heir_table)
    story.append(Spacer(1, 8))

    final_order = """
    <b>DIRECTIVE:</b><br/>
    In exercise of powers vested under the Revenue Code and the ROR Act, it is hereby ordered that the name of 
    <b>RAVI KUMAR</b>, S/o Late Koteswara Rao be mutated as the absolute Pattadar in respect of <b>Survey No. 123/4 (ULPIN: TFCM91641E6C82)</b> 
    measuring 874.30 Sq.m in Mangalagiri (Rural) village, and an e-Pattadar Passbook be generated accordingly.
    """
    story.append(Paragraph(final_order, body))
    story.append(Spacer(1, 14))

    officer_box = [
        [
            Paragraph("<b>SEAL OF THE EXECUTIVE MAGISTRATE</b><br/><br/>[State Emblem of India]<br/>Tahsildar Office, Mangalagiri", meta_label),
            Paragraph("<b>DR. ANITHA SHARMA</b><br/>Tahsildar & Executive Magistrate<br/>Mangalagiri Mandal, Guntur District<br/><i>Digitally Signed via NIC Public Key</i>", meta_label),
        ]
    ]
    off_table = Table(officer_box, colWidths=[255, 260])
    off_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#0369A1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F0F9FF')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(off_table)

    doc.build(story)
    print(f"Created: {pdf_path}")


def build_acquisition_claim():
    pdf_path = OUT_DIR / "03_CORRIDOR_ACQUISITION_CLAIM_Sy127_1.pdf"
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40,
    )
    styles = getSampleStyleSheet()

    header_style = ParagraphStyle(
        'Header',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        alignment=1,
        textColor=colors.HexColor('#0F172A'),
    )
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        alignment=1,
        textColor=colors.HexColor('#B91C1C'),
        spaceAfter=10,
    )
    body = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#1E293B'),
    )
    meta_label = ParagraphStyle('ML', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.HexColor('#334155'))
    meta_val = ParagraphStyle('MV', fontName='Helvetica', fontSize=8, leading=10, textColor=colors.HexColor('#0F172A'))

    story = []

    story.append(Paragraph("<b>BEFORE THE COMPETENT AUTHORITY FOR LAND ACQUISITION (CALA)</b><br/>REVENUE DIVISIONAL OFFICER, GUNTUR DIVISION<br/>GOVERNMENT OF ANDHRA PRADESH", header_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#DC2626'), spaceAfter=6))
    story.append(Paragraph("FORMAL STATUTORY APPLICATION & CONSENT CLAIM UNDER SECTION 23A & 94<br/><b>THE RIGHT TO FAIR COMPENSATION AND TRANSPARENCY IN LAND ACQUISITION, REHABILITATION AND RESETTLEMENT ACT, 2013 (RFCTLARR)</b>", title_style))

    claim_meta = [
        [Paragraph("<b>Project:</b> Amaravati Outer Ring Road (NHAI Expressway)", meta_label), Paragraph("<b>Gazette Notification:</b> SO-2026/NHAI-AP/442", meta_label)],
        [Paragraph("<b>Claimant / Pattadar:</b> Sambasiva Rao Mekala", meta_label), Paragraph("<b>ULPIN:</b> TFCM91KDED50FD | <b>Survey No:</b> 127/1", meta_val)],
        [Paragraph("<b>Total Extent:</b> 11,761.90 m² (2.91 Acres)", meta_label), Paragraph("<b>Acquired Right-of-Way:</b> 3,763.80 m² (32.0%)", meta_val)],
    ]
    m_table = Table(claim_meta, colWidths=[255, 260])
    m_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#DC2626')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEF2F2')),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(m_table)
    story.append(Spacer(1, 10))

    statement = """
    <b>TO THE COMPETENT AUTHORITY (CALA) / REVENUE DIVISIONAL OFFICER:</b><br/>
    I, <b>Sambasiva Rao Mekala</b>, S/o Late Subba Rao, resident of Mangalagiri, the verified absolute Pattadar of the agricultural land 
    bearing Survey No. 127/1 (ULPIN: TFCM91KDED50FD), hereby submit this formal statutory representation pursuant to the Preliminary 
    Notification issued under Section 11 of the RFCTLARR Act, 2013:
    <br/><br/>
    <b>1. ACCEPTANCE OF DIRECT CONSENT SETTLEMENT (§23A):</b><br/>
    I hereby convey my unconditional consent to surrender the acquired Right-of-Way strip measuring <b>3,763.80 Sq. Metres</b> for the 
    construction of the Amaravati Outer Ring Road Expressway, subject to the disbursement of the statutory <b>+25% Consent Incentive Bonus</b> 
    totaling <b>₹19,07,92,375/- (Rupees Nineteen Crores Seven Lakhs Ninety-Two Thousand Three Hundred Seventy-Five Only)</b> 
    calculated on guideline value plus 100% Solatium (§30) and structural compound damages.
    <br/><br/>
    <b>2. FORMAL PETITION UNDER SECTION 94 (SEVERANCE & COMPULSORY FULL ACQUISITION):</b><br/>
    I bring to the urgent notice of CALA that the proposed expressway buffer bisects my farm diagonally, severing the residual plot 
    of 7,998.10 Sq. Metres from the main irrigation canal and cutting off tractor road frontage. Under Section 94 of the RFCTLARR Act, 2013, 
    I hereby petition the Competent Authority to acquire the entire parcel or guarantee statutory culvert and irrigation conduit access.
    """
    story.append(Paragraph(statement, body))
    story.append(Spacer(1, 12))

    claim_sig = [
        [
            Paragraph("<b>CLAIMANT / TITLEHOLDER:</b><br/><br/><font color='#B91C1C'><b><i>Sambasiva Rao Mekala</i></b></font><br/>(SAMBASIVA RAO MEKALA)<br/>Bank A/C: 50100492819482 (SBI Mangalagiri)<br/>IFSC: SBIN0001842", meta_label),
            Paragraph("<b>VERIFICATION ENDORSEMENT:</b><br/><br/><i>Forwarded to Mandal Revenue Officer (MRO) and<br/>Mandal Surveyor for spatial traverse validation and<br/>DBT disbursement through RBI e-Kuber treasury.</i>", meta_label),
        ]
    ]
    sig_tab = Table(claim_sig, colWidths=[260, 255])
    sig_tab.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#991B1B')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FFF1F2')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(sig_tab)

    doc.build(story)
    print(f"Created: {pdf_path}")

if __name__ == "__main__":
    build_sale_deed()
    build_succession_certificate()
    build_acquisition_claim()
    print("All mock legal documents generated successfully.")

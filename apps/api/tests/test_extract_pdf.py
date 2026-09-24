import io
import pytest
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from ai.extract import extract_ror, parse_document_text


@pytest.mark.asyncio
async def test_extract_real_pdf_with_pypdf():
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    c.drawString(50, 750, "REGISTERED SALE DEED")
    c.drawString(50, 730, "Document No: DOC-2026-7788 Registered at SRO Mangalagiri on 2026-03-20")
    c.drawString(50, 710, "Survey No: 141/2B, Khata No: 654, Village: Mangalagiri, District: Guntur, State: AP")
    c.drawString(50, 690, "Total Extent: 3.25 acres")
    c.drawString(50, 670, "Executant / Seller: Ramesh Chandra s/o Satyanarayana, residing at Mangalagiri")
    c.drawString(50, 650, "Claimant / Buyer: Ravi Kumar s/o Venkataramaiah, residing at Vijayawada")
    c.drawString(50, 630, "North by: Survey No. 140 Road")
    c.drawString(50, 610, "South by: Survey No. 142 Land")
    c.drawString(50, 590, "East by: Canal")
    c.drawString(50, 570, "West by: Survey No. 141/1")
    c.drawString(50, 550, "Consideration Amount: Rs. 85,00,000. Stamp Duty: Rs. 5,95,000.")
    c.save()

    pdf_data = buf.getvalue()
    result = await extract_ror(pdf_data, "application/pdf", filename="deed_141_2b.pdf")

    assert result["document_type"] == "Registered Sale Deed"
    assert result["core_anchors"]["survey_no"] == "141/2B"
    assert result["core_anchors"]["sub_division"] == "2B"
    assert result["core_anchors"]["extent"] == "3.25"
    assert result["core_anchors"]["extent_unit"] == "acres"
    assert result["core_anchors"]["registration"]["document_no"] == "DOC-2026-7788"
    assert result["core_anchors"]["boundaries"]["north"] == "Survey No. 140 Road"

    parties = result["core_anchors"]["parties"]
    assert len(parties) >= 2
    assert parties[0]["name"] == "Ramesh Chandra"
    assert parties[0]["role"] == "seller/executant"
    assert parties[1]["name"] == "Ravi Kumar"
    assert parties[1]["role"] == "buyer/claimant"

    # Backward compatible fields dict
    assert result["fields"]["survey_no"] == "141/2B"
    assert result["fields"]["owner_name"] == "Ramesh Chandra"
    assert result["fields"]["document_no"] == "DOC-2026-7788"

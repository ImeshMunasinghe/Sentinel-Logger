import csv
import io
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..deps import get_current_admin
from .. import models

# ReportLab libraries for PDF export
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

router = APIRouter(prefix="/report", tags=["Reports Export"])

def generate_pdf_report(title: str, headers: list, data: list) -> bytes:
    """Generates a styled, premium PDF document in-memory using ReportLab."""
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Styled header
    title_style = ParagraphStyle(
        name="TitleStyle",
        parent=styles["Heading1"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=15
    )
    
    meta_style = ParagraphStyle(
        name="MetaStyle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=25
    )
    
    story.append(Paragraph(title, title_style))
    story.append(Paragraph(f"Generated on {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Security Operations System", meta_style))
    
    # Build Table
    table_data = [headers]
    
    # Wrap text in paragraphs for row wrapping
    cell_style = ParagraphStyle(
        name="CellStyle",
        parent=styles["Normal"],
        fontSize=9,
        leading=11,
        textColor=colors.HexColor("#334155")
    )
    
    col_widths = []
    # Dynamic simple column widths based on header count
    if len(headers) > 0:
        total_width = 532 # letter width (612) - margins (80)
        col_widths = [total_width / len(headers)] * len(headers)
        
    for row in data:
        formatted_row = []
        for cell in row:
            formatted_row.append(Paragraph(str(cell), cell_style))
        table_data.append(formatted_row)
        
    # Table Styling
    t = Table(table_data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")), # Dark slate
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.HexColor("#ffffff")]), # Alternating rows
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")), # Light outline grid
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
    ]))
    
    story.append(t)
    doc.build(story)
    
    pdf_buffer.seek(0)
    return pdf_buffer.getvalue()

@router.get("")
def export_report(
    type: str = Query(..., description="Report type: 'officer', 'patrol', or 'location'"),
    id: int = Query(..., description="Specific ID of the selected entity"),
    format: str = Query(..., description="Export format: 'csv' or 'pdf'"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    if format not in ["csv", "pdf"]:
        raise HTTPException(code=400, detail="Invalid format specified. Must be 'csv' or 'pdf'.")
        
    headers = []
    data = []
    filename = f"report_{type}_{id}_{datetime.datetime.utcnow().strftime('%Y%m%d')}"
    title = ""
    
    if type == "officer":
        officer = db.query(models.User).filter(models.User.id == id, models.User.role == "officer").first()
        if not officer:
            raise HTTPException(status_code=404, detail="Officer not found")
            
        title = f"Patrol Activities Report: {officer.full_name or officer.username}"
        headers = ["Session ID", "Checkpoint Name", "NFC Tag ID", "Scan Timestamp", "Sequence Order"]
        
        # Query scan logs for this officer
        logs = db.query(models.ScanLog).filter(models.ScanLog.officer_id == id).order_by(models.ScanLog.timestamp.desc()).all()
        for log in logs:
            loc_name = log.location.name if log.location else "Unknown Checkpoint"
            tag_id = log.location.nfc_tag_id if log.location else "N/A"
            timestamp_str = log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            data.append([log.patrol_session_id, loc_name, tag_id, timestamp_str, log.sequence_order])
            
    elif type == "patrol":
        session = db.query(models.PatrolSession).filter(models.PatrolSession.id == id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Patrol session not found")
            
        officer_name = session.officer.full_name or session.officer.username if session.officer else "Unknown"
        title = f"Patrol Session #{session.id} Log (Officer: {officer_name})"
        headers = ["Sequence Order", "Checkpoint Name", "NFC Tag ID", "Latitude", "Longitude", "Scan Timestamp"]
        
        # Query scan logs for this session in chronological order
        logs = db.query(models.ScanLog).filter(models.ScanLog.patrol_session_id == id).order_by(models.ScanLog.sequence_order.asc()).all()
        for log in logs:
            loc_name = log.location.name if log.location else "Unknown Checkpoint"
            tag_id = log.location.nfc_tag_id if log.location else "N/A"
            lat = log.location.latitude if log.location else 0.0
            lng = log.location.longitude if log.location else 0.0
            timestamp_str = log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            data.append([log.sequence_order, loc_name, tag_id, lat, lng, timestamp_str])
            
    elif type == "location":
        loc = db.query(models.Location).filter(models.Location.id == id).first()
        if not loc:
            raise HTTPException(status_code=404, detail="Location checkpoint not found")
            
        title = f"Access Logs: Checkpoint {loc.name} (Tag: {loc.nfc_tag_id})"
        headers = ["Scan Timestamp", "Officer Name", "Badge ID", "Patrol Session ID", "Sequence Order"]
        
        # Query scans at this location
        logs = db.query(models.ScanLog).filter(models.ScanLog.location_id == id).order_by(models.ScanLog.timestamp.desc()).all()
        for log in logs:
            officer_name = log.officer.full_name or log.officer.username if log.officer else "Unknown"
            badge = log.officer.badge_id if log.officer else "N/A"
            timestamp_str = log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            data.append([timestamp_str, officer_name, badge, log.patrol_session_id, log.sequence_order])
            
    else:
        raise HTTPException(code=400, detail="Invalid report type. Mode must be 'officer', 'patrol', or 'location'.")
        
    # Return as CSV
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        # Write Title block
        writer.writerow([title])
        writer.writerow(["Generated:", datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')])
        writer.writerow([])
        writer.writerow(headers)
        writer.writerows(data)
        
        # Convert String stream encoding for download
        csv_payload = output.getvalue()
        return Response(
            content=csv_payload,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
        )
        
    # Return as PDF
    elif format == "pdf":
        pdf_payload = generate_pdf_report(title, headers, data)
        return Response(
            content=pdf_payload,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}.pdf"}
        )

import { jsPDF } from 'jspdf';

export interface CertificateRenderData {
  studentName: string;
  courseTitle: string;
  certificateCode: string;
  issuedDateStr: string;
  academyName: string;
  signatoryName: string;
  signatoryTitle: string;
  verificationUrl: string;
}

export function generateCertificatePDF(data: CertificateRenderData): jsPDF {
  // A4 landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Background Fill (Clean warm white / ivory slate)
  doc.setFillColor(252, 253, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer Border (Navy #0f2744)
  doc.setDrawColor(15, 39, 68);
  doc.setLineWidth(3);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner Border (Blue #1d4ed8)
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.8);
  doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

  // Corner Accents
  doc.setFillColor(29, 78, 216);
  doc.rect(10, 10, 8, 8, 'F');
  doc.rect(pageWidth - 18, 10, 8, 8, 'F');
  doc.rect(10, pageHeight - 18, 8, 8, 'F');
  doc.rect(pageWidth - 18, pageHeight - 18, 8, 8, 'F');

  // Header: Academy Name
  doc.setTextColor(15, 39, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(data.academyName.toUpperCase(), pageWidth / 2, 35, { align: 'center' });

  // Subheading
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('EXCELLENCE IN APPLIED PROFESSIONAL LEARNING', pageWidth / 2, 42, { align: 'center' });

  // Decorative Horizontal Line
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, 46, pageWidth / 2 + 40, 46);

  // Certificate Title
  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(15, 39, 68);
  doc.text('Certificate of Completion', pageWidth / 2, 60, { align: 'center' });

  // Recipient Intro
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text('This official academy certificate is proudly awarded to', pageWidth / 2, 75, { align: 'center' });

  // Student Name
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(29, 78, 216);
  doc.text(data.studentName, pageWidth / 2, 92, { align: 'center' });

  // Underline for Student Name
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 70, 96, pageWidth / 2 + 70, 96);

  // Description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text('for satisfactorily fulfilling all coursework, assessments, and attendance requirements in', pageWidth / 2, 107, { align: 'center' });

  // Course Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 39, 68);
  doc.text(data.courseTitle, pageWidth / 2, 120, { align: 'center' });

  // Signatures and Metadata Section
  const footerY = 160;

  // Left side: Date & Certificate ID
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 39, 68);
  doc.text(`Issue Date: ${data.issuedDateStr}`, 30, footerY);
  doc.text(`Certificate ID: ${data.certificateCode}`, 30, footerY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Verify online: ${data.verificationUrl}`, 30, footerY + 12);

  // Center: Academy Seal Graphic
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.8);
  doc.circle(pageWidth / 2, footerY + 3, 14);
  doc.circle(pageWidth / 2, footerY + 3, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(29, 78, 216);
  doc.text('OFFICIAL SEAL', pageWidth / 2, footerY + 1, { align: 'center' });
  doc.text('VERIFIED', pageWidth / 2, footerY + 6, { align: 'center' });

  // Right side: Signatory
  doc.setDrawColor(15, 39, 68);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 90, footerY + 2, pageWidth - 30, footerY + 2);

  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(15, 39, 68);
  doc.text(data.signatoryName, pageWidth - 60, footerY - 2, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(data.signatoryTitle, pageWidth - 60, footerY + 7, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Academic Verification Authority', pageWidth - 60, footerY + 12, { align: 'center' });

  return doc;
}

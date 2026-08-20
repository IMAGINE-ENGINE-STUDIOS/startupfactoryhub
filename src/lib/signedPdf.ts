import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface SignedPdfSigner {
  signer_name: string;
  signer_email: string;
  signature_data: string;
  signed_at: string;
}

const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const MARGIN = 40;

/**
 * Renders the document element plus a signature certificate page into a PDF.
 * Returns the jsPDF instance so callers can download, print or email it.
 */
export async function buildSignedPdf(
  element: HTMLElement,
  title: string,
  signers: SignedPdfSigner[]
): Promise<jsPDF> {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const imgW = PAGE_W - MARGIN * 2;
  const imgH = (canvas.height * imgW) / canvas.width;
  const usableH = PAGE_H - MARGIN * 2;
  const img = canvas.toDataURL("image/jpeg", 0.92);

  let remaining = imgH;
  let offset = 0;
  while (remaining > 0) {
    pdf.addImage(img, "JPEG", MARGIN, MARGIN - offset, imgW, imgH, undefined, "FAST");
    remaining -= usableH;
    offset += usableH;
    if (remaining > 0) pdf.addPage();
  }

  // Certificate page
  pdf.addPage();
  let y = MARGIN + 10;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Certificate of Signature", MARGIN, y);
  y += 22;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(90);
  pdf.text(pdf.splitTextToSize(title, PAGE_W - MARGIN * 2), MARGIN, y);
  y += 18;
  pdf.text(`Issued by Startup Factory Hub · ${new Date().toLocaleString()}`, MARGIN, y);
  y += 26;
  pdf.setDrawColor(220);
  pdf.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 26;

  pdf.setTextColor(20);
  signers.forEach((s) => {
    if (y > PAGE_H - 140) {
      pdf.addPage();
      y = MARGIN + 10;
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(s.signer_name, MARGIN, y);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(110);
    pdf.text(s.signer_email, MARGIN, y + 14);
    pdf.text(`Signed on ${new Date(s.signed_at).toLocaleString()}`, MARGIN, y + 28);
    pdf.setTextColor(20);
    try {
      pdf.addImage(s.signature_data, "PNG", PAGE_W - MARGIN - 180, y - 14, 180, 60);
    } catch {
      /* ignore malformed signature image */
    }
    y += 76;
    pdf.setDrawColor(235);
    pdf.line(MARGIN, y - 14, PAGE_W - MARGIN, y - 14);
  });

  return pdf;
}

export const pdfFileName = (title: string) =>
  `${title.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "-") || "document"}-signed.pdf`;

export const pdfToBase64 = (pdf: jsPDF): string => {
  const uri = pdf.output("datauristring");
  return uri.substring(uri.indexOf(",") + 1);
};

export const printPdf = (pdf: jsPDF) => {
  const url = pdf.output("bloburl") as unknown as string;
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.src = url;
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  };
  document.body.appendChild(frame);
  setTimeout(() => frame.remove(), 60000);
};

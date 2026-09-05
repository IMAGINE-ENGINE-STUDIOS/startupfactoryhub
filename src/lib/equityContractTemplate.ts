/**
 * Startup Factory Hub Accelerator Agreement (equity + profit participation).
 * Renders print-ready HTML used by the admin Equity Contracts section and by
 * the public signing page (`/sign/:token`). Underscore runs become signature
 * fields automatically (see `src/lib/signatureFields.ts`).
 */

export interface EquityContractClause {
  title: string;
  body: string;
}

export interface EquityContractValues {
  effectiveDate: string;
  companyName: string;
  jurisdiction: string;
  companyAddress: string;
  equityPercent: string;
  profitPercent: string;
  termMonths: string;
  companySignerName: string;
  companySignerTitle: string;
  acceleratorSignerName: string;
  acceleratorSignerTitle: string;
  customClauses?: EquityContractClause[];
}

export const DEFAULT_EQUITY_CONTRACT: EquityContractValues = {
  effectiveDate: "",
  companyName: "",
  jurisdiction: "",
  companyAddress: "",
  equityPercent: "5",
  profitPercent: "5",
  termMonths: "12",
  companySignerName: "",
  companySignerTitle: "",
  acceleratorSignerName: "Khalia Padilla",
  acceleratorSignerTitle: "Managing Partner",
  customClauses: [],
};

export const SFH_FOUNDERS = [
  { name: "Khalia Padilla", role: "Managing Partner & Founder" },
  { name: "Ricardo Font", role: "Managing Partner & Founder" },
  
];

export const PARTNERS_URL = "https://startupfactoryhub.com/forpartners";

const esc = (s: string) =>
  (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const blank = (v: string, width = 28) => (v?.trim() ? esc(v.trim()) : "_".repeat(width));

const h = (n: string, t: string) =>
  `<h3 style="font-size:15px;margin:26px 0 10px;letter-spacing:.4px">${n}. ${t}</h3>`;

const p = (html: string) => `<p style="margin:0 0 12px;line-height:1.75">${html}</p>`;

const ul = (items: string[]) =>
  `<ul style="margin:0 0 14px 20px;line-height:1.75">${items
    .map((i) => `<li>${esc(i)}</li>`)
    .join("")}</ul>`;

const group = (title: string, items: string[]) =>
  `<p style="margin:12px 0 4px;font-weight:600">${esc(title)}</p>${ul(items)}`;

export function buildEquityContractHtml(v: EquityContractValues): string {
  const equity = blank(v.equityPercent, 4);
  const profit = blank(v.profitPercent, 4);
  const term = v.termMonths?.trim() || "12";

  const founders = SFH_FOUNDERS.map(
    (f) =>
      `<li><strong>${esc(f.name)}</strong> — ${esc(f.role)}</li>`
  ).join("");

  return `
<div style="font-family:Georgia,'Times New Roman',serif;color:#111827;font-size:14px">
  <h2 style="text-align:center;font-size:20px;margin:0 0 4px">STARTUP FACTORY HUB ACCELERATOR AGREEMENT</h2>
  <p style="text-align:center;font-size:12px;color:#6b7280;margin:0 0 24px">
    Imagine Engine Studios Corp · Lake Nona Center, Orlando, Florida ·
    <a href="${PARTNERS_URL}" style="color:#0ea270">Learn more about us</a>
  </p>

  ${p(
    `This Accelerator Agreement ("Agreement") is entered into on ${blank(
      v.effectiveDate,
      20
    )} ("Effective Date") by and between:`
  )}
  ${p(
    `<strong>Imagine Engine Studios Corp</strong>, a Florida corporation, with its principal place of business at 6900 Tavistock Lakes Boulevard SE, Suite 400, Lake Nona Center, Orlando, Florida 32827, hereinafter referred to as the "Accelerator",`
  )}
  ${p("and")}
  ${p(
    `<strong>${blank(v.companyName, 32)}</strong>, a company organized under the laws of ${blank(
      v.jurisdiction,
      24
    )}, having its principal place of business at ${blank(
      v.companyAddress,
      36
    )}, hereinafter referred to as the "Company."`
  )}
  ${p('Collectively referred to as the "Parties."')}

  ${h("1", "PURPOSE")}
  ${p(
    "The Accelerator operates the Startup Factory Hub Accelerator Program to assist early-stage companies through mentorship, strategic guidance, business development, technical support, fundraising preparation, and operational assistance."
  )}
  ${p(
    "In consideration of these services, the Company agrees to grant equity and profit participation to the Accelerator under the terms of this Agreement."
  )}

  ${h("2", "SERVICES PROVIDED")}
  ${p(
    "During the Accelerator Program, the Accelerator agrees to provide the Company with services that may include:"
  )}
  ${group("Business Development", [
    "Strategic planning",
    "Business model development",
    "Revenue model design",
    "Market validation",
    "Business consulting",
  ])}
  ${group("Executive Support", [
    "Fractional CEO",
    "Fractional CTO",
    "Fractional CFO",
    "Fractional COO",
    "Advisory board access",
  ])}
  ${group("Product Development", [
    "MVP planning",
    "Product strategy",
    "Website development",
    "Technical architecture",
    "Access to proprietary technologies where applicable",
  ])}
  ${group("Investment Readiness", [
    "Pitch deck preparation",
    "Financial projections",
    "Investor reports",
    "Cap table management",
    "Due diligence preparation",
  ])}
  ${group("Networking", [
    "Investor introductions",
    "Partnership development",
    "Corporate networking",
    "Startup community access",
  ])}
  ${group("Infrastructure", [
    "Office space (if available)",
    "Corporate resources",
    "Employee benefits",
    "Business systems",
  ])}
  ${p("The Accelerator may modify or expand the services offered as the Company evolves.")}

  ${h("3", "TERM")}
  ${p(
    `The active acceleration program shall continue for ${esc(term)} (${esc(
      term
    )}) months beginning on the Effective Date.`
  )}
  ${p(
    "Certain benefits, including advisory support, networking opportunities, and partnership access, may continue after completion of the formal program at the Accelerator's discretion."
  )}

  ${h("4", "EQUITY COMPENSATION")}
  ${p(
    `In consideration for the services provided under this Agreement, the Company shall issue to the Accelerator equity equal to ${equity}% of the Company's fully diluted issued and outstanding equity immediately following execution of this Agreement.`
  )}
  ${p(
    "The equity shall consist of Common Stock (or equivalent ownership interests for non-corporate entities)."
  )}
  ${p(
    "The Company agrees to complete all documentation necessary to issue the shares within ten (10) business days following execution of this Agreement."
  )}

  ${h("5", "DILUTION")}
  ${p(
    "The Accelerator acknowledges that its ownership shall dilute proportionally in future financing rounds, including but not limited to:"
  )}
  ${ul([
    "Venture capital investments",
    "Angel investments",
    "SAFE Agreements",
    "Convertible Notes",
    "Employee stock option plans",
    "Warrants",
    "Additional equity issuances",
  ])}
  ${p(
    "The Accelerator shall receive no anti-dilution protections unless separately agreed in writing."
  )}

  ${h("6", "PROFIT PARTICIPATION")}
  ${p(
    `In addition to the equity granted herein, the Company agrees to pay the Accelerator an amount equal to ${profit}% of the Company's Net Profits.`
  )}
  ${p(
    "For purposes of this Agreement, Net Profits means the Company's net income after deducting ordinary and necessary operating expenses, taxes, payroll, interest, depreciation, amortization, and other customary accounting adjustments."
  )}

  ${h("7", "MONTHLY PAYMENTS")}
  ${p("Profit participation payments shall:")}
  ${ul([
    "be calculated monthly;",
    "be accompanied by a monthly Profit and Loss Statement;",
    "be paid no later than the fifteenth (15th) day of the following month.",
  ])}
  ${p(
    "Payments shall continue for as long as the Company remains in operation unless otherwise agreed in writing."
  )}

  ${h("8", "REPORTING REQUIREMENTS")}
  ${p("The Company agrees to provide:")}
  ${ul([
    "Monthly Profit & Loss Statement",
    "Monthly Balance Sheet",
    "Quarterly Financial Summary",
    "Annual Financial Statements",
    "Updated Capitalization Table upon request",
  ])}
  ${p(
    "The Accelerator may request reasonable additional financial information necessary to verify calculations under this Agreement."
  )}

  ${h("9", "INTELLECTUAL PROPERTY")}
  ${p(
    "All intellectual property owned by either Party before entering into this Agreement shall remain the sole property of that Party."
  )}
  ${p(
    "Any software, templates, methodologies, source code, frameworks, or proprietary technologies provided by the Accelerator remain the exclusive property of the Accelerator unless expressly assigned in writing."
  )}
  ${p("All intellectual property developed solely by the Company shall remain the Company's property.")}

  ${h("10", "CONFIDENTIALITY")}
  ${p(
    "Each Party agrees to keep confidential all proprietary information disclosed during the term of this Agreement."
  )}
  ${p("Confidential Information includes:")}
  ${ul([
    "Trade secrets",
    "Business plans",
    "Source code",
    "Financial records",
    "Customer information",
    "Marketing strategies",
    "Product roadmaps",
  ])}
  ${p("These obligations shall survive termination of this Agreement for five (5) years.")}

  ${h("11", "REPRESENTATIONS")}
  ${p("The Company represents that:")}
  ${ul([
    "it is legally organized;",
    "it has authority to enter this Agreement;",
    "issuing the equity does not violate any existing agreements;",
    "all information provided to the Accelerator is materially accurate.",
  ])}

  ${h("12", "FOUNDER OBLIGATIONS")}
  ${p("The founders agree to:")}
  ${ul([
    "devote reasonable efforts to the business;",
    "maintain accurate financial records;",
    "notify the Accelerator of material events;",
    "comply with applicable laws.",
  ])}

  ${h("13", "TERMINATION")}
  ${p(
    "Either Party may terminate this Agreement upon thirty (30) days written notice for a material breach that remains uncured."
  )}
  ${p("Termination shall not affect:")}
  ${ul([
    "previously issued equity;",
    "accrued profit-sharing obligations;",
    "confidentiality obligations.",
  ])}

  ${h("14", "LIMITATION OF LIABILITY")}
  ${p(
    "The Accelerator provides advisory and business support services and makes no guarantee regarding investment, profitability, fundraising success, or business performance."
  )}

  ${h("15", "GOVERNING LAW")}
  ${p("This Agreement shall be governed by the laws of the State of Florida.")}
  ${p("The Parties agree to attempt mediation before commencing litigation.")}
  ${p("Venue shall lie exclusively in Orange County, Florida.")}

  ${h("16", "MISCELLANEOUS")}
  ${p("This Agreement constitutes the entire agreement between the Parties.")}
  ${p("No amendment shall be effective unless in writing and signed by both Parties.")}
  ${p("If any provision is held invalid, the remaining provisions shall remain enforceable.")}
  ${p("Electronic signatures shall have the same force and effect as original signatures.")}
  ${(v.customClauses || [])
    .filter((c) => (c.title || "").trim() || (c.body || "").trim())
    .map(
      (c, i) =>
        `${h(String(17 + i), (c.title || "ADDITIONAL TERMS").toUpperCase())}${(c.body || "")
          .split(/\n{1,}/)
          .filter((line) => line.trim())
          .map((line) => p(esc(line.trim())))
          .join("")}`
    )
    .join("")}

  <h3 style="font-size:15px;margin:32px 0 12px">SIGNATURES</h3>


  <p style="margin:0 0 6px;font-weight:600">Imagine Engine Studios Corp</p>
  ${p(`By: ______________________________`)}
  ${p(`Name: ${blank(v.acceleratorSignerName, 22)}`)}
  ${p(`Title: ${blank(v.acceleratorSignerTitle, 22)}`)}
  ${p(`Date: ______________________________`)}

  <p style="margin:24px 0 6px;font-weight:600">COMPANY</p>
  ${p(`Company Name: ${blank(v.companyName, 26)}`)}
  ${p(`By: ______________________________`)}
  ${p(`Name: ${blank(v.companySignerName, 22)}`)}
  ${p(`Title: ${blank(v.companySignerTitle, 22)}`)}
  ${p(`Date: ______________________________`)}

  <div style="margin-top:34px;padding:18px 20px;border:1px solid #d1d5db;border-radius:10px;background:#f9fafb">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;color:#0ea270;font-weight:700">STARTUP FACTORY HUB FOUNDERS</p>
    <ul style="margin:0 0 10px 18px;line-height:1.7;font-size:13px">${founders}</ul>
    <p style="margin:0;font-size:13px">
      Learn more about the Accelerator and our partner network at
      <a href="${PARTNERS_URL}" style="color:#0ea270">${PARTNERS_URL}</a>
    </p>
  </div>
</div>`.trim();
}

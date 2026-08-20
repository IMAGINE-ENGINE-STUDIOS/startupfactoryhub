/**
 * Reusable LightPaper templates for signable documents.
 * Each template renders clean HTML plus auto-generated signature blocks.
 */

export interface TemplateField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "date" | "textarea";
  defaultValue?: string;
}

export interface SignTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultTitle: string;
  defaultSigners: { name: string; role: string }[];
  fields: TemplateField[];
  body: (v: Record<string, string>) => string;
}

export interface TemplateSigner {
  name: string;
  role: string;
}

const esc = (s: string) =>
  (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const val = (v: Record<string, string>, key: string, fallback = "____________") =>
  esc(v[key]?.trim() || fallback);

const p = (html: string) => `<p style="margin:0 0 14px;line-height:1.75">${html}</p>`;

const heading = (text: string) =>
  `<h2 style="text-align:center;font-size:20px;margin:0 0 6px">${esc(text)}</h2>`;

const subheading = (text: string) =>
  `<h3 style="text-align:center;font-size:17px;margin:0 0 28px;font-weight:600">${esc(text)}</h3>`;

/** Bulleted list from a multi-line textarea value. */
const list = (raw: string) => {
  const items = (raw || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!items.length) return p("____________");
  return `<ul style="margin:0 0 14px 20px;line-height:1.75">${items
    .map((i) => `<li>${esc(i)}</li>`)
    .join("")}</ul>`;
};

/** Signature lines rendered at the end of every generated document. */
export const buildSignatureBlocks = (signers: TemplateSigner[]) => {
  const rows = signers
    .map((s, i) => {
      const name = esc(s.name?.trim() || `Signer ${i + 1}`);
      const role = esc(s.role?.trim() || "");
      return `
      <tr>
        <td style="padding:34px 24px 0 0;width:55%;vertical-align:bottom">
          <div data-signature-slot="${i}" style="height:56px;border-bottom:1px solid #111827"></div>
          <div style="font-size:13px;margin-top:6px">${name}</div>
          ${role ? `<div style="font-size:12px;color:#6b7280">${role}</div>` : ""}
        </td>
        <td style="padding:34px 0 0 0;width:45%;vertical-align:bottom">
          <div style="height:56px;border-bottom:1px solid #111827"></div>
          <div style="font-size:13px;margin-top:6px">Date</div>
        </td>
      </tr>`;
    })
    .join("");

  return `
  <div style="margin-top:36px">
    <p style="font-weight:700;margin:0 0 4px">Signatures</p>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
  </div>`;
};

const partiesLine = (v: Record<string, string>, aKey: string, bKey: string, aRole: string, bRole: string) =>
  p(
    `This Agreement is entered into on ${val(v, "date")} by and between <strong>${val(
      v,
      aKey,
    )}</strong> (the "${aRole}") and <strong>${val(v, bKey)}</strong> (the "${bRole}").`,
  );

const governingLaw = (v: Record<string, string>) =>
  p(
    `<strong>Governing law.</strong> This document shall be governed by and construed in accordance with the laws of ${val(
      v,
      "law",
      "the State of Delaware, USA",
    )}, without regard to conflict of law principles.`,
  );

export const SIGN_TEMPLATES: SignTemplate[] = [
  {
    id: "board-minutes",
    name: "Board Meeting Minutes",
    description: "Formal minutes of a board of directors meeting, with quorum and resolutions.",
    category: "Corporate",
    defaultTitle: "Minutes of the Board of Directors Meeting",
    defaultSigners: [
      { name: "", role: "Secretary" },
      { name: "", role: "Chairperson" },
    ],
    fields: [
      { key: "company", label: "Company", placeholder: "Acme Inc." },
      { key: "date", label: "Meeting date", type: "date" },
      { key: "time", label: "Time", placeholder: "2:30 PM" },
      { key: "location", label: "Location", placeholder: "Virtual", defaultValue: "Virtual" },
      { key: "purpose", label: "Purpose", placeholder: "Update of corporate roles" },
      { key: "directors", label: "Directors present (one per line)", type: "textarea" },
      { key: "previous", label: "Previous minutes approved (date)", type: "date" },
      { key: "next", label: "Next meeting", placeholder: "September 4, 4:00 PM" },
    ],
    body: (v) => {
      const directors = (v.directors || "")
        .split("\n")
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => p(`<strong>Director:</strong> ${esc(d)}`))
        .join("");
      return [
        heading("Minutes of the Board of Directors Meeting"),
        subheading(`Directors of ${v.company?.trim() || "the Company"}`),
        p(
          `A regular meeting of the Board of Directors of the above-named corporation was held on ${val(
            v,
            "date",
          )} at ${val(v, "time")} at ${val(v, "location", "Virtual")}.`,
        ),
        p(`The purpose of the meeting: ${val(v, "purpose")}`),
        p(`<strong>Quorum.</strong> A quorum was declared with the following directors present:`),
        directors,
        p(
          `<strong>Review/Approval of previous minutes.</strong> The minutes of the meeting held on ${val(
            v,
            "previous",
          )} were approved as presented.`,
        ),
        p(
          `<strong>Adoption of documents/plans.</strong> The attached document (${val(
            v,
            "purpose",
          )}) was adopted by vote of the directors.`,
        ),
        p(`<strong>Next meeting.</strong> The next meeting will be held on ${val(v, "next")}.`),
        p("There being no further business, the meeting was adjourned."),
      ].join("");
    },
  },
  {
    id: "nda",
    name: "Mutual NDA",
    description: "Standard mutual non-disclosure agreement with configurable term.",
    category: "Legal",
    defaultTitle: "Mutual Non-Disclosure Agreement",
    defaultSigners: [
      { name: "", role: "Disclosing Party" },
      { name: "", role: "Receiving Party" },
    ],
    fields: [
      { key: "partyA", label: "Party A", placeholder: "Startup Factory Hub LLC" },
      { key: "partyB", label: "Party B", placeholder: "Counterparty" },
      { key: "date", label: "Effective date", type: "date" },
      { key: "term", label: "Term", placeholder: "3 years", defaultValue: "3 years" },
      { key: "purpose", label: "Purpose of disclosure", type: "textarea" },
      { key: "law", label: "Governing law", placeholder: "State of Delaware, USA" },
    ],
    body: (v) =>
      [
        heading("Mutual Non-Disclosure Agreement"),
        partiesLine(v, "partyA", "partyB", "Party A", "Party B"),
        p(`<strong>1. Purpose.</strong> ${val(v, "purpose")}`),
        p(
          `<strong>2. Confidential Information.</strong> All technical, commercial, financial or product information shared between the Parties, in any format, shall be treated as confidential.`,
        ),
        p(
          `<strong>3. Obligations.</strong> The receiving Party shall not disclose Confidential Information to third parties without prior written authorization, and shall use it solely for the Purpose.`,
        ),
        p(
          `<strong>4. Term.</strong> Confidentiality obligations shall remain in force for ${val(
            v,
            "term",
            "3 years",
          )} from the effective date.`,
        ),
        p(
          `<strong>5. Return.</strong> Upon request, the receiving Party shall return or destroy all Confidential Information received.`,
        ),
        governingLaw(v),
      ].join(""),
  },
  {
    id: "advisor-agreement",
    name: "Advisor Agreement",
    description: "Advisor contract with time commitment, term and compensation.",
    category: "Talent",
    defaultTitle: "Advisor Agreement",
    defaultSigners: [
      { name: "", role: "Company" },
      { name: "", role: "Advisor" },
    ],
    fields: [
      { key: "company", label: "Company" },
      { key: "advisor", label: "Advisor" },
      { key: "date", label: "Start date", type: "date" },
      { key: "hours", label: "Commitment", placeholder: "4 hours / month" },
      { key: "term", label: "Term", placeholder: "12 months" },
      { key: "comp", label: "Compensation", placeholder: "0.25% equity, 24-month vesting" },
      { key: "scope", label: "Scope of advisory", type: "textarea" },
    ],
    body: (v) =>
      [
        heading("Advisor Agreement"),
        partiesLine(v, "company", "advisor", "Company", "Advisor"),
        p(`<strong>1. Services.</strong> ${val(v, "scope")}`),
        p(`<strong>2. Commitment.</strong> The Advisor will dedicate approximately ${val(v, "hours")}.`),
        p(`<strong>3. Term.</strong> ${val(v, "term")}, renewable by written agreement of the parties.`),
        p(`<strong>4. Compensation.</strong> ${val(v, "comp")}.`),
        p(
          `<strong>5. Intellectual property.</strong> All deliverables created under this agreement belong to the Company.`,
        ),
        p(`<strong>6. Confidentiality.</strong> The Advisor shall keep all Company information confidential.`),
      ].join(""),
  },
  {
    id: "loi",
    name: "Letter of Intent (LOI)",
    description: "Non-binding terms for an investment or strategic alliance.",
    category: "Investment",
    defaultTitle: "Letter of Intent",
    defaultSigners: [
      { name: "", role: "Investor" },
      { name: "", role: "Company" },
    ],
    fields: [
      { key: "investor", label: "Investor / Partner" },
      { key: "company", label: "Company" },
      { key: "amount", label: "Amount / scope", placeholder: "US$250,000" },
      { key: "valuation", label: "Valuation / terms", placeholder: "US$5M pre-money" },
      { key: "date", label: "Date", type: "date" },
      { key: "conditions", label: "Key conditions", type: "textarea" },
    ],
    body: (v) =>
      [
        heading("Letter of Intent"),
        p(`Date: ${val(v, "date")}`),
        p(
          `<strong>${val(v, "investor")}</strong> expresses its intent to participate in <strong>${val(
            v,
            "company",
          )}</strong> for an amount of ${val(v, "amount")} under terms of ${val(v, "valuation")}.`,
        ),
        p(`<strong>Key conditions.</strong> ${val(v, "conditions")}`),
        p(
          `<strong>Due diligence.</strong> The transaction is subject to satisfactory completion of legal, financial and technical due diligence.`,
        ),
        p(
          `<strong>Non-binding.</strong> Except for confidentiality and exclusivity clauses, this letter creates no binding obligations until definitive documents are signed.`,
        ),
      ].join(""),
  },
  {
    id: "service-agreement",
    name: "Services Agreement",
    description: "Professional services contract with deliverables and payment terms.",
    category: "Commercial",
    defaultTitle: "Services Agreement",
    defaultSigners: [
      { name: "", role: "Provider" },
      { name: "", role: "Client" },
    ],
    fields: [
      { key: "provider", label: "Provider" },
      { key: "client", label: "Client" },
      { key: "date", label: "Start date", type: "date" },
      { key: "scope", label: "Deliverables", type: "textarea" },
      { key: "fee", label: "Fees", placeholder: "US$5,000" },
      { key: "terms", label: "Payment terms", placeholder: "50% upfront, 50% on delivery" },
      { key: "law", label: "Governing law", placeholder: "State of Delaware, USA" },
    ],
    body: (v) =>
      [
        heading("Services Agreement"),
        partiesLine(v, "provider", "client", "Provider", "Client"),
        p(`<strong>1. Deliverables.</strong> ${val(v, "scope")}`),
        p(`<strong>2. Fees.</strong> ${val(v, "fee")}.`),
        p(`<strong>3. Payments.</strong> ${val(v, "terms")}.`),
        p(`<strong>4. Ownership.</strong> Deliverables become Client property upon receipt of full payment.`),
        p(`<strong>5. Termination.</strong> Either party may terminate with 15 days written notice.`),
        governingLaw(v),
      ].join(""),
  },
  {
    id: "safe-note",
    name: "SAFE Investment Summary",
    description: "Simple Agreement for Future Equity term summary for early-stage rounds.",
    category: "Investment",
    defaultTitle: "SAFE — Simple Agreement for Future Equity",
    defaultSigners: [
      { name: "", role: "Company" },
      { name: "", role: "Investor" },
    ],
    fields: [
      { key: "company", label: "Company" },
      { key: "investor", label: "Investor" },
      { key: "date", label: "Date", type: "date" },
      { key: "amount", label: "Purchase amount", placeholder: "US$100,000" },
      { key: "cap", label: "Valuation cap", placeholder: "US$8,000,000" },
      { key: "discount", label: "Discount rate", placeholder: "20%" },
      { key: "law", label: "Governing law", placeholder: "State of Delaware, USA" },
    ],
    body: (v) =>
      [
        heading("Simple Agreement for Future Equity"),
        partiesLine(v, "company", "investor", "Company", "Investor"),
        p(
          `<strong>1. Investment.</strong> The Investor pays ${val(
            v,
            "amount",
          )} to the Company in exchange for the right to certain shares of capital stock, subject to the terms below.`,
        ),
        p(`<strong>2. Valuation cap.</strong> ${val(v, "cap")}.`),
        p(`<strong>3. Discount rate.</strong> ${val(v, "discount")}.`),
        p(
          `<strong>4. Conversion.</strong> This instrument converts automatically upon a qualifying equity financing, at the lower of the valuation cap price or the discounted price per share.`,
        ),
        p(
          `<strong>5. Liquidity / dissolution.</strong> Upon a liquidity or dissolution event prior to conversion, the Investor is entitled to the purchase amount or the as-converted proceeds, whichever is greater.`,
        ),
        p(`<strong>6. No shareholder rights.</strong> This instrument grants no voting rights prior to conversion.`),
        governingLaw(v),
      ].join(""),
  },
  {
    id: "founders-agreement",
    name: "Founders Agreement",
    description: "Equity split, roles, vesting and decision-making between co-founders.",
    category: "Corporate",
    defaultTitle: "Founders Agreement",
    defaultSigners: [
      { name: "", role: "Founder" },
      { name: "", role: "Co-Founder" },
    ],
    fields: [
      { key: "company", label: "Company" },
      { key: "date", label: "Date", type: "date" },
      { key: "split", label: "Equity split (one per line)", type: "textarea", placeholder: "Jane Doe — 60%" },
      { key: "vesting", label: "Vesting", placeholder: "4 years, 1-year cliff", defaultValue: "4 years, 1-year cliff" },
      { key: "roles", label: "Roles and responsibilities", type: "textarea" },
      { key: "decisions", label: "Decision-making rules", type: "textarea" },
    ],
    body: (v) =>
      [
        heading("Founders Agreement"),
        p(
          `Entered into on ${val(v, "date")} by the founders of <strong>${val(v, "company")}</strong> (the "Company").`,
        ),
        p(`<strong>1. Equity split.</strong>`),
        list(v.split || ""),
        p(`<strong>2. Vesting.</strong> Founder equity vests over ${val(v, "vesting")}.`),
        p(`<strong>3. Roles.</strong>`),
        list(v.roles || ""),
        p(`<strong>4. Decision-making.</strong>`),
        list(v.decisions || ""),
        p(
          `<strong>5. Intellectual property.</strong> Each founder assigns to the Company all IP created in connection with the business.`,
        ),
        p(
          `<strong>6. Departure.</strong> Unvested equity is forfeited upon voluntary departure or termination for cause.`,
        ),
      ].join(""),
  },
  {
    id: "employment-offer",
    name: "Employment Offer Letter",
    description: "Formal offer with role, compensation, benefits and start date.",
    category: "Talent",
    defaultTitle: "Employment Offer Letter",
    defaultSigners: [
      { name: "", role: "Company" },
      { name: "", role: "Employee" },
    ],
    fields: [
      { key: "company", label: "Company" },
      { key: "employee", label: "Candidate name" },
      { key: "role", label: "Position", placeholder: "Senior Software Engineer" },
      { key: "date", label: "Start date", type: "date" },
      { key: "salary", label: "Annual salary", placeholder: "US$120,000" },
      { key: "equity", label: "Equity / bonus", placeholder: "10,000 options, 4-year vesting" },
      { key: "benefits", label: "Benefits (one per line)", type: "textarea" },
    ],
    body: (v) =>
      [
        heading("Employment Offer Letter"),
        p(`Dear ${val(v, "employee")},`),
        p(
          `<strong>${val(v, "company")}</strong> is pleased to offer you the position of <strong>${val(
            v,
            "role",
          )}</strong>, starting on ${val(v, "date")}.`,
        ),
        p(`<strong>1. Compensation.</strong> ${val(v, "salary")} per year, paid according to Company payroll policy.`),
        p(`<strong>2. Equity / bonus.</strong> ${val(v, "equity")}.`),
        p(`<strong>3. Benefits.</strong>`),
        list(v.benefits || ""),
        p(
          `<strong>4. Confidentiality and IP.</strong> Employment is conditioned upon signing the Company confidentiality and invention assignment agreement.`,
        ),
        p(`<strong>5. At-will employment.</strong> Employment may be terminated by either party at any time.`),
        p("We look forward to working with you."),
      ].join(""),
  },
  {
    id: "contractor-agreement",
    name: "Independent Contractor Agreement",
    description: "Freelance engagement with scope, rate and IP assignment.",
    category: "Talent",
    defaultTitle: "Independent Contractor Agreement",
    defaultSigners: [
      { name: "", role: "Company" },
      { name: "", role: "Contractor" },
    ],
    fields: [
      { key: "company", label: "Company" },
      { key: "contractor", label: "Contractor" },
      { key: "date", label: "Start date", type: "date" },
      { key: "scope", label: "Scope of work", type: "textarea" },
      { key: "rate", label: "Rate", placeholder: "US$75 / hour" },
      { key: "invoice", label: "Invoicing", placeholder: "Monthly, net 15" },
    ],
    body: (v) =>
      [
        heading("Independent Contractor Agreement"),
        partiesLine(v, "company", "contractor", "Company", "Contractor"),
        p(`<strong>1. Scope of work.</strong> ${val(v, "scope")}`),
        p(`<strong>2. Rate.</strong> ${val(v, "rate")}.`),
        p(`<strong>3. Invoicing.</strong> ${val(v, "invoice")}.`),
        p(
          `<strong>4. Independent contractor status.</strong> The Contractor is not an employee and is responsible for its own taxes, insurance and equipment.`,
        ),
        p(`<strong>5. IP assignment.</strong> All work product is assigned to the Company upon payment.`),
        p(`<strong>6. Termination.</strong> Either party may terminate with 10 days written notice.`),
      ].join(""),
  },
  {
    id: "mou",
    name: "Memorandum of Understanding",
    description: "Framework of collaboration between two organizations.",
    category: "Partnerships",
    defaultTitle: "Memorandum of Understanding",
    defaultSigners: [
      { name: "", role: "Organization A" },
      { name: "", role: "Organization B" },
    ],
    fields: [
      { key: "partyA", label: "Organization A" },
      { key: "partyB", label: "Organization B" },
      { key: "date", label: "Date", type: "date" },
      { key: "objective", label: "Objective", type: "textarea" },
      { key: "contributions", label: "Contributions of each party (one per line)", type: "textarea" },
      { key: "term", label: "Term", placeholder: "12 months, renewable" },
    ],
    body: (v) =>
      [
        heading("Memorandum of Understanding"),
        partiesLine(v, "partyA", "partyB", "Party A", "Party B"),
        p(`<strong>1. Objective.</strong> ${val(v, "objective")}`),
        p(`<strong>2. Contributions.</strong>`),
        list(v.contributions || ""),
        p(`<strong>3. Term.</strong> ${val(v, "term")}.`),
        p(
          `<strong>4. Nature of the MOU.</strong> This memorandum expresses the intent of the parties and does not create financial or legally binding obligations, except for confidentiality.`,
        ),
      ].join(""),
  },
  {
    id: "partnership-agreement",
    name: "Strategic Partnership Agreement",
    description: "Commercial partnership with responsibilities and revenue share.",
    category: "Partnerships",
    defaultTitle: "Strategic Partnership Agreement",
    defaultSigners: [
      { name: "", role: "Partner A" },
      { name: "", role: "Partner B" },
    ],
    fields: [
      { key: "partyA", label: "Partner A" },
      { key: "partyB", label: "Partner B" },
      { key: "date", label: "Effective date", type: "date" },
      { key: "scope", label: "Scope of the partnership", type: "textarea" },
      { key: "responsibilities", label: "Responsibilities (one per line)", type: "textarea" },
      { key: "revenue", label: "Revenue share", placeholder: "70% / 30%" },
      { key: "term", label: "Term", placeholder: "24 months" },
    ],
    body: (v) =>
      [
        heading("Strategic Partnership Agreement"),
        partiesLine(v, "partyA", "partyB", "Partner A", "Partner B"),
        p(`<strong>1. Scope.</strong> ${val(v, "scope")}`),
        p(`<strong>2. Responsibilities.</strong>`),
        list(v.responsibilities || ""),
        p(`<strong>3. Revenue share.</strong> ${val(v, "revenue")}.`),
        p(`<strong>4. Term.</strong> ${val(v, "term")}, renewable by written agreement.`),
        p(`<strong>5. Brand use.</strong> Each party may use the other's marks solely for approved joint activities.`),
      ].join(""),
  },
  {
    id: "sow",
    name: "Statement of Work (SOW)",
    description: "Detailed project scope, milestones and acceptance criteria.",
    category: "Commercial",
    defaultTitle: "Statement of Work",
    defaultSigners: [
      { name: "", role: "Provider" },
      { name: "", role: "Client" },
    ],
    fields: [
      { key: "provider", label: "Provider" },
      { key: "client", label: "Client" },
      { key: "date", label: "Date", type: "date" },
      { key: "project", label: "Project name" },
      { key: "milestones", label: "Milestones (one per line)", type: "textarea" },
      { key: "acceptance", label: "Acceptance criteria", type: "textarea" },
      { key: "budget", label: "Budget", placeholder: "US$25,000" },
    ],
    body: (v) =>
      [
        heading("Statement of Work"),
        subheading(v.project?.trim() || "Project"),
        partiesLine(v, "provider", "client", "Provider", "Client"),
        p(`<strong>1. Milestones.</strong>`),
        list(v.milestones || ""),
        p(`<strong>2. Acceptance criteria.</strong> ${val(v, "acceptance")}`),
        p(`<strong>3. Budget.</strong> ${val(v, "budget")}.`),
        p(
          `<strong>4. Change control.</strong> Any change in scope requires a written amendment signed by both parties.`,
        ),
      ].join(""),
  },
  {
    id: "consulting-proposal",
    name: "Consulting Proposal",
    description: "Client-ready proposal with approach, timeline and investment.",
    category: "Commercial",
    defaultTitle: "Consulting Proposal",
    defaultSigners: [
      { name: "", role: "Consultant" },
      { name: "", role: "Client — Approved by" },
    ],
    fields: [
      { key: "consultant", label: "Consultant / Firm" },
      { key: "client", label: "Client" },
      { key: "date", label: "Date", type: "date" },
      { key: "challenge", label: "Client challenge", type: "textarea" },
      { key: "approach", label: "Proposed approach (one per line)", type: "textarea" },
      { key: "timeline", label: "Timeline", placeholder: "8 weeks" },
      { key: "investment", label: "Investment", placeholder: "US$18,000" },
    ],
    body: (v) =>
      [
        heading("Consulting Proposal"),
        subheading(`Prepared for ${v.client?.trim() || "the Client"}`),
        p(`Date: ${val(v, "date")} — Prepared by <strong>${val(v, "consultant")}</strong>.`),
        p(`<strong>1. Challenge.</strong> ${val(v, "challenge")}`),
        p(`<strong>2. Approach.</strong>`),
        list(v.approach || ""),
        p(`<strong>3. Timeline.</strong> ${val(v, "timeline")}.`),
        p(`<strong>4. Investment.</strong> ${val(v, "investment")}.`),
        p(`<strong>5. Acceptance.</strong> Signature below constitutes approval to proceed.`),
      ].join(""),
  },
  {
    id: "equity-vesting",
    name: "Equity Vesting Agreement",
    description: "Stock grant with vesting schedule, cliff and acceleration.",
    category: "Corporate",
    defaultTitle: "Equity Vesting Agreement",
    defaultSigners: [
      { name: "", role: "Company" },
      { name: "", role: "Grantee" },
    ],
    fields: [
      { key: "company", label: "Company" },
      { key: "grantee", label: "Grantee" },
      { key: "date", label: "Grant date", type: "date" },
      { key: "shares", label: "Shares / options granted", placeholder: "50,000 options" },
      { key: "price", label: "Exercise price", placeholder: "US$0.10 per share" },
      { key: "schedule", label: "Vesting schedule", placeholder: "4 years monthly, 1-year cliff" },
      { key: "acceleration", label: "Acceleration", placeholder: "Double-trigger on change of control" },
    ],
    body: (v) =>
      [
        heading("Equity Vesting Agreement"),
        partiesLine(v, "company", "grantee", "Company", "Grantee"),
        p(`<strong>1. Grant.</strong> The Company grants ${val(v, "shares")} to the Grantee.`),
        p(`<strong>2. Exercise price.</strong> ${val(v, "price")}.`),
        p(`<strong>3. Vesting schedule.</strong> ${val(v, "schedule")}.`),
        p(`<strong>4. Acceleration.</strong> ${val(v, "acceleration")}.`),
        p(`<strong>5. Forfeiture.</strong> Unvested shares are forfeited upon termination of service.`),
        p(`<strong>6. Transfer restrictions.</strong> Shares may not be transferred without Board approval.`),
      ].join(""),
  },
  {
    id: "convertible-note",
    name: "Convertible Note Summary",
    description: "Debt instrument converting into equity, with interest and maturity.",
    category: "Investment",
    defaultTitle: "Convertible Promissory Note",
    defaultSigners: [
      { name: "", role: "Company" },
      { name: "", role: "Noteholder" },
    ],
    fields: [
      { key: "company", label: "Company" },
      { key: "investor", label: "Noteholder" },
      { key: "date", label: "Issue date", type: "date" },
      { key: "principal", label: "Principal", placeholder: "US$150,000" },
      { key: "interest", label: "Interest rate", placeholder: "6% simple, annual" },
      { key: "maturity", label: "Maturity date", type: "date" },
      { key: "cap", label: "Valuation cap / discount", placeholder: "US$10M cap, 20% discount" },
    ],
    body: (v) =>
      [
        heading("Convertible Promissory Note"),
        partiesLine(v, "company", "investor", "Company", "Noteholder"),
        p(`<strong>1. Principal.</strong> ${val(v, "principal")}.`),
        p(`<strong>2. Interest.</strong> ${val(v, "interest")}, accruing from the issue date.`),
        p(`<strong>3. Maturity.</strong> ${val(v, "maturity")}.`),
        p(`<strong>4. Conversion terms.</strong> ${val(v, "cap")}.`),
        p(
          `<strong>5. Qualified financing.</strong> Outstanding principal and interest convert automatically upon the next qualified equity financing.`,
        ),
        p(`<strong>6. Prepayment.</strong> No prepayment without the Noteholder's written consent.`),
      ].join(""),
  },
  {
    id: "shareholder-resolution",
    name: "Written Shareholder Resolution",
    description: "Unanimous written consent of shareholders in lieu of a meeting.",
    category: "Corporate",
    defaultTitle: "Written Consent of Shareholders",
    defaultSigners: [{ name: "", role: "Shareholder" }],
    fields: [
      { key: "company", label: "Company" },
      { key: "date", label: "Date", type: "date" },
      { key: "resolutions", label: "Resolutions (one per line)", type: "textarea" },
      { key: "effective", label: "Effective date", type: "date" },
    ],
    body: (v) =>
      [
        heading("Written Consent of Shareholders in Lieu of a Meeting"),
        subheading(v.company?.trim() || "The Company"),
        p(
          `The undersigned, being the holders of the outstanding voting shares of <strong>${val(
            v,
            "company",
          )}</strong>, hereby adopt the following resolutions as of ${val(v, "date")}:`,
        ),
        list(v.resolutions || ""),
        p(`<strong>Effective date.</strong> These resolutions take effect on ${val(v, "effective")}.`),
        p(
          `This consent may be executed in counterparts, including electronic signatures, each of which is deemed an original.`,
        ),
      ].join(""),
  },
  {
    id: "license-agreement",
    name: "Software License Agreement",
    description: "License grant, restrictions, support and fees.",
    category: "Legal",
    defaultTitle: "Software License Agreement",
    defaultSigners: [
      { name: "", role: "Licensor" },
      { name: "", role: "Licensee" },
    ],
    fields: [
      { key: "licensor", label: "Licensor" },
      { key: "licensee", label: "Licensee" },
      { key: "date", label: "Effective date", type: "date" },
      { key: "product", label: "Licensed product" },
      { key: "scope", label: "License scope", placeholder: "Non-exclusive, worldwide, non-transferable" },
      { key: "fee", label: "License fee", placeholder: "US$1,200 / year" },
      { key: "support", label: "Support & updates", placeholder: "Email support, business hours" },
    ],
    body: (v) =>
      [
        heading("Software License Agreement"),
        partiesLine(v, "licensor", "licensee", "Licensor", "Licensee"),
        p(
          `<strong>1. License grant.</strong> The Licensor grants a ${val(
            v,
            "scope",
            "non-exclusive",
          )} license to use <strong>${val(v, "product")}</strong>.`,
        ),
        p(
          `<strong>2. Restrictions.</strong> The Licensee shall not reverse engineer, resell or sublicense the software without written consent.`,
        ),
        p(`<strong>3. Fees.</strong> ${val(v, "fee")}.`),
        p(`<strong>4. Support.</strong> ${val(v, "support")}.`),
        p(
          `<strong>5. Warranty disclaimer.</strong> The software is provided "as is" without warranties of any kind to the maximum extent permitted by law.`,
        ),
        p(`<strong>6. Termination.</strong> The license terminates upon material breach not cured within 15 days.`),
      ].join(""),
  },
  {
    id: "ip-assignment",
    name: "IP Assignment Agreement",
    description: "Transfer of intellectual property rights to the company.",
    category: "Legal",
    defaultTitle: "Intellectual Property Assignment Agreement",
    defaultSigners: [
      { name: "", role: "Assignor" },
      { name: "", role: "Assignee" },
    ],
    fields: [
      { key: "assignor", label: "Assignor" },
      { key: "assignee", label: "Assignee (Company)" },
      { key: "date", label: "Date", type: "date" },
      { key: "ip", label: "Assigned intellectual property", type: "textarea" },
      { key: "consideration", label: "Consideration", placeholder: "US$1 and other good consideration" },
    ],
    body: (v) =>
      [
        heading("Intellectual Property Assignment Agreement"),
        partiesLine(v, "assignor", "assignee", "Assignor", "Assignee"),
        p(`<strong>1. Assigned IP.</strong> ${val(v, "ip")}`),
        p(
          `<strong>2. Assignment.</strong> The Assignor irrevocably assigns to the Assignee all right, title and interest, worldwide and in perpetuity, in the Assigned IP.`,
        ),
        p(`<strong>3. Consideration.</strong> ${val(v, "consideration")}.`),
        p(
          `<strong>4. Further assurances.</strong> The Assignor will execute any documents reasonably required to perfect the assignment.`,
        ),
        p(
          `<strong>5. Warranty.</strong> The Assignor warrants it is the sole owner of the Assigned IP and that it is free of encumbrances.`,
        ),
      ].join(""),
  },
  {
    id: "mentorship-agreement",
    name: "Mentorship Agreement",
    description: "Program mentorship terms: hours, expectations and confidentiality.",
    category: "Programs",
    defaultTitle: "Mentorship Agreement",
    defaultSigners: [
      { name: "", role: "Mentor" },
      { name: "", role: "Startup" },
    ],
    fields: [
      { key: "mentor", label: "Mentor" },
      { key: "startup", label: "Startup" },
      { key: "date", label: "Start date", type: "date" },
      { key: "hours", label: "Total hours", placeholder: "10 hours", defaultValue: "10 hours" },
      { key: "focus", label: "Focus areas (one per line)", type: "textarea" },
      { key: "comp", label: "Compensation / recognition", placeholder: "Pro bono" },
    ],
    body: (v) =>
      [
        heading("Mentorship Agreement"),
        partiesLine(v, "mentor", "startup", "Mentor", "Startup"),
        p(`<strong>1. Commitment.</strong> The Mentor will deliver ${val(v, "hours", "10 hours")} of mentorship.`),
        p(`<strong>2. Focus areas.</strong>`),
        list(v.focus || ""),
        p(`<strong>3. Compensation.</strong> ${val(v, "comp", "Pro bono")}.`),
        p(
          `<strong>4. Confidentiality.</strong> The Mentor will keep all Startup information confidential and disclose any conflicts of interest.`,
        ),
        p(
          `<strong>5. No investment advice.</strong> Mentorship is guidance only and does not constitute legal, tax or investment advice.`,
        ),
      ].join(""),
  },
  {
    id: "accelerator-participation",
    name: "Accelerator Participation Agreement",
    description: "Batch participation terms: program, fee and obligations.",
    category: "Programs",
    defaultTitle: "Accelerator Participation Agreement",
    defaultSigners: [
      { name: "", role: "Program Operator" },
      { name: "", role: "Startup Founder" },
    ],
    fields: [
      { key: "operator", label: "Program operator", defaultValue: "Startup Factory Hub" },
      { key: "startup", label: "Startup" },
      { key: "batch", label: "Batch", placeholder: "Batch 2026-01" },
      { key: "date", label: "Start date", type: "date" },
      { key: "duration", label: "Duration", placeholder: "12 weeks" },
      { key: "fee", label: "Program fee", placeholder: "US$5,000" },
      { key: "obligations", label: "Startup obligations (one per line)", type: "textarea" },
    ],
    body: (v) =>
      [
        heading("Accelerator Participation Agreement"),
        subheading(val(v, "batch", "Program Batch")),
        partiesLine(v, "operator", "startup", "Operator", "Startup"),
        p(`<strong>1. Program.</strong> Duration of ${val(v, "duration")}, including mentorship, workshops and demo day.`),
        p(`<strong>2. Program fee.</strong> ${val(v, "fee")}.`),
        p(`<strong>3. Startup obligations.</strong>`),
        list(v.obligations || ""),
        p(
          `<strong>4. Media and branding.</strong> The Startup authorizes use of its name and logo in program communications.`,
        ),
        p(
          `<strong>5. Removal.</strong> The Operator may remove a participant for inactivity or breach of the program code of conduct.`,
        ),
      ].join(""),
  },
  {
    id: "sponsorship-agreement",
    name: "Event Sponsorship Agreement",
    description: "Sponsor tier, benefits, deliverables and payment schedule.",
    category: "Partnerships",
    defaultTitle: "Event Sponsorship Agreement",
    defaultSigners: [
      { name: "", role: "Organizer" },
      { name: "", role: "Sponsor" },
    ],
    fields: [
      { key: "organizer", label: "Organizer" },
      { key: "sponsor", label: "Sponsor" },
      { key: "event", label: "Event name" },
      { key: "date", label: "Event date", type: "date" },
      { key: "tier", label: "Sponsorship tier", placeholder: "Gold" },
      { key: "amount", label: "Sponsorship amount", placeholder: "US$10,000" },
      { key: "benefits", label: "Sponsor benefits (one per line)", type: "textarea" },
    ],
    body: (v) =>
      [
        heading("Event Sponsorship Agreement"),
        subheading(v.event?.trim() || "Event"),
        partiesLine(v, "organizer", "sponsor", "Organizer", "Sponsor"),
        p(`<strong>1. Tier.</strong> ${val(v, "tier")} sponsorship for ${val(v, "amount")}.`),
        p(`<strong>2. Benefits.</strong>`),
        list(v.benefits || ""),
        p(`<strong>3. Payment.</strong> 50% upon signature and 50% no later than 7 days before the event.`),
        p(
          `<strong>4. Cancellation.</strong> If the event is cancelled, the Organizer will offer a credit for a future event or a pro-rata refund.`,
        ),
      ].join(""),
  },
  {
    id: "photo-release",
    name: "Photo & Media Release",
    description: "Consent to use image, voice and likeness in communications.",
    category: "Legal",
    defaultTitle: "Photo and Media Release",
    defaultSigners: [{ name: "", role: "Participant" }],
    fields: [
      { key: "company", label: "Organization", defaultValue: "Startup Factory Hub" },
      { key: "participant", label: "Participant" },
      { key: "date", label: "Date", type: "date" },
      { key: "event", label: "Event / production" },
      { key: "usage", label: "Permitted usage", placeholder: "Website, social media, press" },
    ],
    body: (v) =>
      [
        heading("Photo and Media Release"),
        p(
          `On ${val(v, "date")}, <strong>${val(
            v,
            "participant",
          )}</strong> grants <strong>${val(v, "company")}</strong> permission to record, photograph and use their image, voice and likeness captured at ${val(
            v,
            "event",
          )}.`,
        ),
        p(`<strong>1. Permitted usage.</strong> ${val(v, "usage", "Website, social media, press")}.`),
        p(
          `<strong>2. No compensation.</strong> The participant waives any right to inspect or approve the finished materials and to any compensation.`,
        ),
        p(
          `<strong>3. Release.</strong> The participant releases the organization from any claim related to the authorized use of the materials.`,
        ),
      ].join(""),
  },
  {
    id: "referral-agreement",
    name: "Referral Commission Agreement",
    description: "Referral terms, qualified lead definition and commission.",
    category: "Commercial",
    defaultTitle: "Referral Agreement",
    defaultSigners: [
      { name: "", role: "Company" },
      { name: "", role: "Referrer" },
    ],
    fields: [
      { key: "company", label: "Company" },
      { key: "referrer", label: "Referrer" },
      { key: "date", label: "Effective date", type: "date" },
      { key: "commission", label: "Commission", placeholder: "10% of first-year revenue" },
      { key: "qualified", label: "Qualified referral definition", type: "textarea" },
      { key: "payment", label: "Payment terms", placeholder: "Within 30 days of collection" },
    ],
    body: (v) =>
      [
        heading("Referral Agreement"),
        partiesLine(v, "company", "referrer", "Company", "Referrer"),
        p(`<strong>1. Qualified referral.</strong> ${val(v, "qualified")}`),
        p(`<strong>2. Commission.</strong> ${val(v, "commission")}.`),
        p(`<strong>3. Payment.</strong> ${val(v, "payment")}.`),
        p(
          `<strong>4. No authority.</strong> The Referrer may not negotiate, sign or make representations on behalf of the Company.`,
        ),
        p(`<strong>5. Term.</strong> Either party may terminate with written notice; accrued commissions survive.`),
      ].join(""),
  },
  {
    id: "loan-agreement",
    name: "Simple Loan Agreement",
    description: "Principal, interest, repayment schedule and default terms.",
    category: "Finance",
    defaultTitle: "Loan Agreement",
    defaultSigners: [
      { name: "", role: "Lender" },
      { name: "", role: "Borrower" },
    ],
    fields: [
      { key: "lender", label: "Lender" },
      { key: "borrower", label: "Borrower" },
      { key: "date", label: "Date", type: "date" },
      { key: "principal", label: "Principal", placeholder: "US$20,000" },
      { key: "interest", label: "Interest", placeholder: "5% annual" },
      { key: "schedule", label: "Repayment schedule", placeholder: "12 monthly installments" },
    ],
    body: (v) =>
      [
        heading("Loan Agreement"),
        partiesLine(v, "lender", "borrower", "Lender", "Borrower"),
        p(`<strong>1. Principal.</strong> The Lender lends ${val(v, "principal")} to the Borrower.`),
        p(`<strong>2. Interest.</strong> ${val(v, "interest")}.`),
        p(`<strong>3. Repayment.</strong> ${val(v, "schedule")}.`),
        p(
          `<strong>4. Default.</strong> Failure to pay within 15 days of a due date constitutes default, and the full outstanding balance becomes immediately due.`,
        ),
        p(`<strong>5. Prepayment.</strong> The Borrower may prepay at any time without penalty.`),
      ].join(""),
  },
  {
    id: "termination-letter",
    name: "Contract Termination Letter",
    description: "Formal notice of termination with effective date and wind-down.",
    category: "Legal",
    defaultTitle: "Notice of Contract Termination",
    defaultSigners: [
      { name: "", role: "Terminating Party" },
      { name: "", role: "Acknowledged by" },
    ],
    fields: [
      { key: "sender", label: "Sending party" },
      { key: "recipient", label: "Receiving party" },
      { key: "contract", label: "Contract being terminated", placeholder: "Services Agreement dated..." },
      { key: "date", label: "Notice date", type: "date" },
      { key: "effective", label: "Effective termination date", type: "date" },
      { key: "reason", label: "Reason", type: "textarea" },
    ],
    body: (v) =>
      [
        heading("Notice of Contract Termination"),
        p(`Date: ${val(v, "date")}`),
        p(
          `<strong>${val(v, "sender")}</strong> hereby notifies <strong>${val(
            v,
            "recipient",
          )}</strong> of the termination of ${val(v, "contract")}, effective ${val(v, "effective")}.`,
        ),
        p(`<strong>1. Reason.</strong> ${val(v, "reason")}`),
        p(
          `<strong>2. Wind-down.</strong> Both parties will settle outstanding invoices and return confidential materials within 15 days of the effective date.`,
        ),
        p(`<strong>3. Surviving clauses.</strong> Confidentiality and IP provisions survive termination.`),
      ].join(""),
  },
  {
    id: "blank",
    name: "Blank document",
    description: "Write your own text and add only the signature blocks.",
    category: "Free-form",
    defaultTitle: "Document for signature",
    defaultSigners: [{ name: "", role: "" }],
    fields: [{ key: "content", label: "Document content", type: "textarea" }],
    body: (v) =>
      (v.content || "")
        .split(/\n{2,}/)
        .map((block) => p(esc(block).replace(/\n/g, "<br/>")))
        .join(""),
  },
];

export const renderTemplate = (
  template: SignTemplate,
  values: Record<string, string>,
  signers: TemplateSigner[],
) =>
  `<div style="font-family:Georgia,'Times New Roman',serif;color:#111827">${template.body(values)}${buildSignatureBlocks(
    signers,
  )}</div>`;

/* ---------- Saved (reusable) templates ---------- */

export interface SavedTemplate {
  id: string;
  name: string;
  baseTemplateId: string;
  values: Record<string, string>;
  signers: TemplateSigner[];
  title: string;
  savedAt: string;
}

const SAVED_KEY = "sfh_sign_templates_v1";

export const loadSavedTemplates = (): SavedTemplate[] => {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as SavedTemplate[]) : [];
  } catch {
    return [];
  }
};

export const persistSavedTemplates = (list: SavedTemplate[]) => {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  } catch {
    /* quota — ignore */
  }
};

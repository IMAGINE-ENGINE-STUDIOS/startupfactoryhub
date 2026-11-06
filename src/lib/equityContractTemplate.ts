/**
 * Startup Factory Hub — Accelerator Program Participation Agreement
 * (founder-approved final version, 2026-11-05 — converted from Jim Stuber's
 * memo of the Nov 3 conversation; replaces the Strategic Accelerator and
 * Venture Building Agreement in the Contracts tab).
 *
 * Structure: admission at IES's sole discretion; an unconditional,
 * irrevocable founder's-equity-equivalent right (default 2.0%, custom per
 * company); Program Phases One/Two/Three + subsequent phases, each running
 * until the company raises that phase's financing amount on top of prior
 * raises (default $250,000 per phase); FLAT Phase Compensation (default
 * $12,500 per phase) that accrues at phase commencement and is payable only
 * at that phase's financing closing — the fee is a fixed amount and is never
 * stated as a percentage of, or tied to, any amount raised; a flat
 * Graduation Compensation (default $100,000) payable at the Graduation
 * Financing Event (the first closing of a pre-seed, seed, or Series A round,
 * whichever occurs first), when accrued phase compensation also comes due
 * and participation terminates; and an optional Unlimited Office Access
 * add-on at $950/month, billed monthly in advance, not contingent on
 * financing milestones.
 *
 * Every per-company figure lives in Schedule A and is supplied per startup
 * when the contract is created (Contracts tab form, or the company's room in
 * Admin → Startups) — nothing per-company is hardcoded here beyond the
 * program defaults in DEFAULT_EQUITY_CONTRACT.
 *
 * Renders print-ready HTML used by the admin Equity Contracts section, the
 * company room's Contract tab, and the public signing page (`/sign/:token`).
 * Underscore runs become signature fields automatically
 * (see `src/lib/signatureFields.ts`).
 *
 * Storage compatibility: `profitPercent` and `termMonths` remain in
 * EquityContractValues because drafts saved under earlier templates carry
 * them; this agreement does not use them.
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
  /** Company notice email (Schedule A: "Company address / notice email"). */
  companyNoticeEmail: string;
  equityPercent: string;
  profitPercent: string;
  termMonths: string;
  companySignerName: string;
  companySignerTitle: string;
  acceleratorSignerName: string;
  acceleratorSignerTitle: string;
  /** Total the company had raised before admission — the Section 3 baseline
   *  every phase financing amount is measured on top of. */
  totalRaised: string;
  phase1Financing: string;
  phase1Compensation: string;
  phase2Financing: string;
  phase2Compensation: string;
  phase3Financing: string;
  phase3Compensation: string;
  subsequentFinancing: string;
  subsequentCompensation: string;
  graduationCompensation: string;
  paymentMethod: string;
  customPaymentTerms: string;
  /** "yes" when the company elects the Section 6 add-on, otherwise "no". */
  officeAddonElected: string;
  officeAddonStart: string;
  customClauses?: EquityContractClause[];
}

export const DEFAULT_EQUITY_CONTRACT: EquityContractValues = {
  effectiveDate: "",
  companyName: "",
  jurisdiction: "",
  companyAddress: "",
  companyNoticeEmail: "",
  equityPercent: "2",
  profitPercent: "5",
  termMonths: "3",
  companySignerName: "",
  companySignerTitle: "",
  acceleratorSignerName: "Khalia Padilla",
  acceleratorSignerTitle: "Managing Partner",
  totalRaised: "",
  phase1Financing: "250000",
  phase1Compensation: "12500",
  phase2Financing: "250000",
  phase2Compensation: "12500",
  phase3Financing: "250000",
  phase3Compensation: "12500",
  subsequentFinancing: "250000",
  subsequentCompensation: "12500",
  graduationCompensation: "100000",
  paymentMethod: "",
  customPaymentTerms: "",
  officeAddonElected: "no",
  officeAddonStart: "",
  customClauses: [],
};

export const SFH_FOUNDERS = [
  { name: "Khalia Padilla", role: "Managing Partner & Founder" },
  { name: "Ricardo Font", role: "Managing Partner & Founder" },
];

export const PARTNERS_URL = "https://startupfactoryhub.com/forpartners";

export const IES_NOTICE =
  "Imagine Engine Studios Corp d/b/a Startup Factory Hub, 6900 Tavistock Lakes Blvd, Suite 400, Orlando, FL 32827 / info@startupfactoryhub.com";

/** Marker used to embed the source values inside a saved contract's HTML so
 *  drafts can be re-opened for editing. Shared by the Contracts tab and the
 *  company room — keep the format identical everywhere. */
export const CONTRACT_VALUES_MARKER = "SFH_CONTRACT_VALUES:";

export const embedContractValues = (html: string, values: EquityContractValues) =>
  `${html}\n<!--${CONTRACT_VALUES_MARKER}${encodeURIComponent(JSON.stringify(values))}-->`;

export const extractContractValues = (html: string | null): EquityContractValues | null => {
  if (!html) return null;
  const m = html.match(new RegExp(`<!--${CONTRACT_VALUES_MARKER}([^>]*)-->`));
  if (!m) return null;
  try {
    return { ...DEFAULT_EQUITY_CONTRACT, ...JSON.parse(decodeURIComponent(m[1])) };
  } catch {
    return null;
  }
};

const esc = (s: string) =>
  (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const blank = (v: string, width = 28) => (v?.trim() ? esc(v.trim()) : "_".repeat(width));

const h = (n: string, t: string) =>
  `<h3 style="font-size:15px;margin:26px 0 10px;letter-spacing:.4px">${n}. ${t}</h3>`;

const p = (html: string) => `<p style="margin:0 0 12px;line-height:1.75">${html}</p>`;

/** "$250,000" from "250000" ($ and commas in the input are tolerated);
 *  a non-numeric value is kept as typed; blank → underscores. */
const money = (v: string, width = 14) => {
  const t = (v || "").trim();
  if (!t) return "_".repeat(width);
  const plain = t.replace(/^\$/, "").replace(/,/g, "");
  if (/^[0-9]+(\.[0-9]+)?$/.test(plain)) {
    return "$" + Number(plain).toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return esc(t);
};

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

const intWords = (n: number): string => {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
  if (n < 1000)
    return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + intWords(n % 100) : "");
  return String(n);
};

/** "two" from "2", "two point five" from "2.5" — for the Section 2 equity line. */
export const percentWords = (v: string): string => {
  const n = Number((v || "").trim());
  if (!Number.isFinite(n)) return (v || "").trim();
  const whole = Math.floor(n);
  const frac = (v || "").trim().split(".")[1];
  let out = intWords(whole);
  if (frac && Number(frac) > 0) {
    out += " point " + frac.split("").map((d) => ONES[Number(d)]).join(" ");
  }
  return out;
};

/** "2.0" from "2", "2.5" from "2.5" — the numeric form shown beside the words. */
export const percentDisplay = (v: string): string => {
  const n = Number((v || "").trim());
  if (!Number.isFinite(n)) return (v || "").trim();
  return Number.isInteger(n) ? `${n}.0` : String(n);
};

export function buildEquityContractHtml(v: EquityContractValues): string {
  const eqWords = esc(percentWords(v.equityPercent || "2"));
  const eqNum = esc(percentDisplay(v.equityPercent || "2"));
  const addon = v.officeAddonElected === "yes";
  const row = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:7px 10px;border:1px solid #d1d5db;${bold ? "font-weight:700" : ""}">${esc(
      label
    )}</td><td style="padding:7px 10px;border:1px solid #d1d5db;${bold ? "font-weight:700" : ""}">${value}</td></tr>`;

  return `
<div style="font-family:Georgia,'Times New Roman',serif;color:#111827;font-size:14px">
  <h2 style="text-align:center;font-size:20px;margin:0 0 4px">ACCELERATOR PROGRAM PARTICIPATION AGREEMENT</h2>
  <p style="text-align:center;font-size:12px;color:#6b7280;margin:0 0 24px">
    Imagine Engine Studios Corp d/b/a Startup Factory Hub · Orlando, Florida ·
    <a href="${PARTNERS_URL}" style="color:#0ea270">Learn more about us</a>
  </p>

  ${p(
    `This Accelerator Program Participation Agreement (this "<strong>Agreement</strong>") is entered into as of the date set forth in Schedule A (the "<strong>Effective Date</strong>"), by and between <strong>Imagine Engine Studios Corp</strong>, a Florida corporation, doing business as <strong>Startup Factory Hub</strong> ("<strong>IES</strong>" or "<strong>SFH</strong>"), and the company identified in Schedule A (the "<strong>Company</strong>"). IES and the Company are each a "Party" and collectively the "Parties."`
  )}

  <h3 style="font-size:15px;margin:26px 0 10px;letter-spacing:.4px">Recitals</h3>
  ${p(
    `IES operates the Startup Factory Hub accelerator program (the "<strong>Program</strong>"), under which IES provides accelerator services to early-stage companies admitted to the Program. The Company wishes to participate in the Program, and IES has agreed to admit the Company to the Program, on the terms set forth in this Agreement.`
  )}

  ${h("1", "Admission to the Program")}
  ${p(
    `<strong>1.1 Admission.</strong> Admission to the Program is in the sole discretion of IES, pursuant to procedures established by IES from time to time. The Company's participation in the Program commences on the Effective Date.`
  )}
  ${p(
    `<strong>1.2 Program Services.</strong> During the Company's participation in the Program, IES will provide the accelerator services made available under the Program, as the Program may be amended from time to time (collectively, the "<strong>Services</strong>"). The Services may include, as applicable to the Company's phase of participation: mentorship and advisory support, venture-building and product support, investor readiness and introductions, platform and community access, events and demo opportunities, and partner benefits made available through the Program.`
  )}
  ${p(
    `<strong>1.3 No Guarantee of Financing.</strong> The Company acknowledges that IES does not guarantee that the Company will raise any financing, and that no provision of this Agreement is a commitment by IES or any third party to invest in or lend to the Company.`
  )}

  ${h("2", "Initial Consideration — Equity")}
  ${p(
    `<strong>2.1 Equity Right.</strong> As consideration for the Company's admission to the Program, the Company shall issue to IES an unconditional and irrevocable right to an equity interest in the Company equivalent to founder's equity, in a quantity resulting in a <strong>${eqWords} percent (${eqNum}%)</strong> ownership by IES of all the equity interests (or equivalent interests) of the Company outstanding post-issuance of the IES interest.`
  )}
  ${p(
    `<strong>2.2 Documentation.</strong> The Company shall execute and deliver such documents as IES reasonably requests to evidence and give effect to the right granted under Section 2.1, promptly upon admission and in any event within fifteen (15) days of IES's request.`
  )}

  ${h("3", "Program Phases")}
  ${p(
    `<strong>3.1 Phase One.</strong> Phase One commences upon the Company's admission to the Program and continues until such time as the Company has raised the Phase One Financing Amount set forth in Schedule A (the "<strong>Phase One Financing</strong>"), in equity, debt, or any other form, in addition to any financing raised by the Company prior to the date of the Company's admission to the Program.`
  )}
  ${p(
    `<strong>3.2 Phase Two.</strong> Phase Two commences, and Phase One terminates, upon the closing of the Phase One Financing, and continues until such time as the Company has raised the Phase Two Financing Amount set forth in Schedule A (the "<strong>Phase Two Financing</strong>"), in equity, debt, or any other form, in addition to the Phase One Financing.`
  )}
  ${p(
    `<strong>3.3 Phase Three.</strong> Phase Three commences, and Phase Two terminates, upon the closing of the Phase Two Financing, and continues until such time as the Company has raised the Phase Three Financing Amount set forth in Schedule A (the "<strong>Phase Three Financing</strong>"), in equity, debt, or any other form, in addition to the Phase Two Financing.`
  )}
  ${p(
    `<strong>3.4 Subsequent Phases.</strong> The participation of the Company in the Program, the provision of Services by IES, and compensation for such Services by the Company, shall continue in subsequent phases on like terms — each subsequent phase commencing upon the closing of the prior phase's financing and continuing until the Company has raised the Subsequent Phase Financing Amount set forth in Schedule A in addition to all prior phase financings — until the earlier of (i) the initial closing of a pre-seed, seed, or Series A round of financing by the Company, whichever occurs first (the "<strong>Graduation Financing Event</strong>") or (ii) the termination of the Company's participation in the Program, in the sole discretion of IES.`
  )}
  ${p(
    `<strong>3.5 Services by Phase.</strong> During each phase, IES will provide the Services applicable to that phase under the Program, as it may be amended from time to time (the Phase One Services, Phase Two Services and Phase Three Services, as applicable).`
  )}

  ${h("4", "Compensation and Payment Terms")}
  ${p(
    `<strong>4.1 Phase Compensation.</strong> As consideration for the Services provided in each phase, the Company shall pay to IES the compensation for that phase set forth in Schedule A (each, the "<strong>Phase Compensation</strong>"):`
  )}
  ${p(
    `(a) <strong>Phase One Compensation.</strong> As consideration for the provision of the Phase One Services by IES to the Company, the Company will pay to IES the Phase One Compensation set forth in Schedule A; provided, however, that the Phase One Compensation will accrue as an obligation on the books of the Company immediately upon the commencement of Phase One, but become payable only upon the closing of the Phase One Financing.`
  )}
  ${p(
    `(b) <strong>Phase Two Compensation.</strong> As consideration for the provision of the Phase Two Services by IES to the Company, the Company will pay to IES the Phase Two Compensation set forth in Schedule A; provided, however, that the Phase Two Compensation will accrue as an obligation on the books of the Company immediately upon the commencement of Phase Two, but become payable only upon the closing of the Phase Two Financing.`
  )}
  ${p(
    `(c) <strong>Phase Three and Subsequent Phase Compensation.</strong> As consideration for the provision of the Phase Three Services, and the services of each subsequent phase, by IES to the Company, the Company will pay to IES the compensation for that phase set forth in Schedule A; provided, however, that such compensation will accrue as an obligation on the books of the Company immediately upon the commencement of that phase, but become payable only upon the closing of that phase's financing.`
  )}
  ${p(
    `<strong>4.2 Custom Payment Terms.</strong> The amounts, milestones and payment terms in Schedule A are set individually for each Company. Where Schedule A states custom payment terms for the Company (including installment arrangements, deferred amounts, or alternative milestones), those custom terms control over the defaults in this Section 4.`
  )}
  ${p(
    `<strong>4.3 Manner of Payment.</strong> All amounts payable under this Agreement shall be paid in U.S. dollars by wire transfer or other method specified in Schedule A, without setoff or deduction, within ten (10) business days after the closing that makes the amount payable, unless Schedule A provides otherwise.`
  )}
  ${p(
    `<strong>4.4 Taxes.</strong> Amounts payable under this Agreement are exclusive of any applicable taxes, which shall be borne by the Company except for taxes based on IES's net income.`
  )}

  ${h("5", "Graduation and Final Compensation")}
  ${p(
    `<strong>5.1 Graduation Compensation.</strong> Upon the occurrence of the Graduation Financing Event, as additional consideration for all services provided by IES to the Company during the Company's participation in the Program, the Company shall pay to IES final compensation in the amount set forth in Schedule A (the "<strong>Graduation Compensation</strong>") and the Company's participation in the Program shall terminate.`
  )}
  ${p(
    `<strong>5.2 Accrued Amounts Survive.</strong> Any Phase Compensation that has accrued but not yet become payable as of the Graduation Financing Event becomes payable in full at the initial closing of the Graduation Financing Event, in addition to the Graduation Compensation.`
  )}

  ${h("6", "Unlimited Office Access (Optional Add-On)")}
  ${p(
    `<strong>6.1 Election.</strong> If the Company elects the Unlimited Office Access add-on in Schedule A, IES shall provide the Company with unlimited access to the office space made available through the Program for the duration of the Company's participation, subject to the reasonable rules of the applicable workspace.`
  )}
  ${p(
    `<strong>6.2 Add-On Fee.</strong> The fee for Unlimited Office Access is <strong>Nine Hundred Fifty Dollars ($950) per month</strong>, billed monthly in advance, commencing on the election date stated in Schedule A and continuing month to month until the earlier of (i) termination of the Company's participation in the Program or (ii) the Company's written cancellation of the add-on, effective at the end of the then-current monthly period.`
  )}
  ${p(
    `<strong>6.3 Not Contingent on Financing.</strong> The add-on fee under this Section 6 is a monthly subscription fee and is <strong>not</strong> contingent on, and does not accrue pending, any financing milestone, unless Schedule A expressly provides otherwise for the Company.`
  )}

  ${h("7", "Term and Termination")}
  ${p(
    `<strong>7.1 Term.</strong> This Agreement commences on the Effective Date and continues until the Company's participation in the Program terminates in accordance with this Agreement.`
  )}
  ${p(
    `<strong>7.2 Termination by IES.</strong> IES may terminate the Company's participation in the Program at any time, in its sole discretion, upon written notice to the Company.`
  )}
  ${p(
    `<strong>7.3 Effect of Termination.</strong> Upon termination for any reason: (a) the equity right granted under Section 2 is irrevocable and survives; (b) any Phase Compensation that has accrued on the books of the Company prior to termination remains an obligation of the Company and becomes payable upon the closing of the financing milestone for the phase in which it accrued, or upon a Graduation Financing Event, whichever occurs first; and (c) Sections 2, 4, 5 (as to amounts accrued), 8, 9 and 10 survive.`
  )}

  ${h("8", "Confidentiality")}
  ${p(
    `Each Party agrees to hold in confidence the other Party's non-public information disclosed in connection with the Program and not to disclose it except to its representatives with a need to know, or as required by law. The Company acknowledges that IES may identify the Company as a Program participant in Program materials.`
  )}

  ${h("9", "Intellectual Property; No License")}
  ${p(
    `Each Party retains all right, title and interest in and to its own intellectual property. Nothing in this Agreement transfers ownership of any intellectual property of the Company to IES, other than the equity right granted under Section 2, or grants any license except as expressly stated.`
  )}

  ${h("10", "General Provisions")}
  ${p(
    `<strong>10.1 Independent Parties.</strong> The Parties are independent contractors. Nothing in this Agreement creates a partnership, joint venture, agency, or employment relationship between the Parties.`
  )}
  ${p(
    `<strong>10.2 Governing Law.</strong> This Agreement is governed by the laws of the State of Florida, without regard to its conflict-of-laws principles.`
  )}
  ${p(
    `<strong>10.3 Entire Agreement; Amendments.</strong> This Agreement (including Schedule A and any add-on election) is the entire agreement between the Parties regarding the Company's participation in the Program and supersedes all prior or contemporaneous understandings. It may be amended only in a writing signed by both Parties.`
  )}
  ${p(
    `<strong>10.4 Severability; Waiver.</strong> If any provision of this Agreement is held unenforceable, the remaining provisions continue in full effect. No waiver of any provision is effective unless in writing, and no waiver waives any other provision or instance.`
  )}
  ${p(
    `<strong>10.5 Assignment.</strong> The Company may not assign this Agreement or any of its rights or obligations under it without the prior written consent of IES. IES may assign this Agreement in connection with a sale of all or substantially all of its business.`
  )}
  ${p(
    `<strong>10.6 Notices.</strong> Notices under this Agreement must be in writing and are deemed given when delivered by email (with confirmation of receipt) or three (3) business days after mailing, to the addresses set forth in Schedule A.`
  )}
  ${p(
    `<strong>10.7 Counterparts; Electronic Signatures.</strong> This Agreement may be executed in counterparts, each of which is an original. Electronic and PDF signatures are binding to the same extent as handwritten signatures.`
  )}
  ${(v.customClauses || [])
    .filter((c) => (c.title || "").trim() || (c.body || "").trim())
    .map(
      (c, i) =>
        `${h(String(11 + i), (c.title || "ADDITIONAL TERMS").toUpperCase())}${(c.body || "")
          .split(/\n{1,}/)
          .filter((line) => line.trim())
          .map((line) => p(esc(line.trim())))
          .join("")}`
    )
    .join("")}

  <h3 style="font-size:15px;margin:32px 0 12px">SCHEDULE A — CUSTOM TERMS FOR THE COMPANY</h3>
  <table style="border-collapse:collapse;width:100%;font-size:13.5px">
    ${row("Company (legal name)", blank(v.companyName, 30))}
    ${row(
      "Company address / notice email",
      `${blank(v.companyAddress, 30)}${v.companyNoticeEmail?.trim() ? ` / ${esc(v.companyNoticeEmail.trim())}` : ""}`
    )}
    ${row(
      "Company signatory (name / title)",
      `${blank(v.companySignerName, 20)}${v.companySignerTitle?.trim() ? ` / ${esc(v.companySignerTitle.trim())}` : ""}`
    )}
    ${row("IES notice address / email", esc(IES_NOTICE))}
    ${row("Effective Date (admission date)", blank(v.effectiveDate, 20))}
    ${row("Equity right (Section 2)", `${eqWords} percent (${eqNum}%) post-issuance founder's-equity-equivalent interest`)}
    ${row("Total raised by the Company prior to admission", money(v.totalRaised))}
    ${row("Phase One Financing Amount", money(v.phase1Financing))}
    ${row("Phase One Compensation", money(v.phase1Compensation), true)}
    ${row("Phase Two Financing Amount", money(v.phase2Financing))}
    ${row("Phase Two Compensation", money(v.phase2Compensation), true)}
    ${row("Phase Three Financing Amount", money(v.phase3Financing))}
    ${row("Phase Three Compensation", money(v.phase3Compensation), true)}
    ${row("Subsequent Phase Financing Amount (each)", money(v.subsequentFinancing))}
    ${row("Subsequent Phase Compensation (each)", money(v.subsequentCompensation), true)}
    ${row(
      "Graduation Compensation (at the Graduation Financing Event — the first of a pre-seed, seed, or Series A closing)",
      money(v.graduationCompensation),
      true
    )}
    ${row("Payment method / wire instructions", blank(v.paymentMethod, 30))}
    ${row(
      "Custom payment terms for this Company",
      v.customPaymentTerms?.trim() ? esc(v.customPaymentTerms.trim()) : "None — standard terms apply"
    )}
    ${row(
      "Unlimited Office Access add-on (Section 6)",
      addon
        ? `☑ Elected — $950 per month, starting: ${blank(v.officeAddonStart, 14)} &nbsp; ☐ Not elected`
        : `☐ Elected — $950 per month &nbsp; ☑ Not elected`,
      true
    )}
  </table>

  <h3 style="font-size:15px;margin:32px 0 12px">AGREED AND ACCEPTED:</h3>

  <p style="margin:0 0 6px;font-weight:600">Imagine Engine Studios Corp d/b/a Startup Factory Hub</p>
  ${p(`By: ______________________________`)}
  ${p(`Name: ${blank(v.acceleratorSignerName, 22)}`)}
  ${p(`Title: ${blank(v.acceleratorSignerTitle, 22)}`)}
  ${p(`Date: ______________________________`)}

  <p style="margin:24px 0 6px;font-weight:600">The Company: ${blank(v.companyName, 26)}</p>
  ${p(`By: ______________________________`)}
  ${p(`Name: ${blank(v.companySignerName, 22)}`)}
  ${p(`Title: ${blank(v.companySignerTitle, 22)}`)}
  ${p(`Date: ______________________________`)}
</div>`.trim();
}

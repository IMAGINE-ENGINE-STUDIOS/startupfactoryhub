/**
 * Startup Factory Hub — Accelerator Program Participation Agreement
 * (founder-approved final version, 2026-11-05 — converted from Jim Stuber's
 * memo of the Nov 3 conversation; replaces the Strategic Accelerator and
 * Venture Building Agreement in the Contracts tab).
 *
 * Structure (simplified by the founder, 2026-11-06 — ONE MILESTONE PER
 * AGREEMENT): admission at IES's sole discretion; an unconditional,
 * irrevocable founder's-equity-equivalent right at the IES Equity
 * Percentage set individually for each company in Schedule A — there is no
 * standard or default percentage; a single Phase One that runs until the
 * company raises its Phase 1 Fundraising Goal on top of prior raises;
 * a FLAT Phase One Compensation that accrues at commencement and is
 * payable only at the closing of that milestone financing — the fee is a
 * fixed amount and is never stated as a percentage of, or tied to, any
 * amount raised (the Contracts forms compute it automatically at the
 * standing ratio from the goal the company enters); any further raise is
 * covered by a new agreement; and an optional Unlimited Office Access
 * add-on at $950/month, billed monthly in advance, not contingent on
 * financing milestones, starting on the Monday after the company signs.
 * The phase2/phase3/subsequent/graduation value fields remain in
 * EquityContractValues only so drafts saved under the earlier multi-phase
 * template still parse — this agreement does not use them.
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
  /** Which agreement this contract is built from: "accelerator" (Accelerator
   *  Program Participation Agreement) or "international" (International Equity
   *  Partnership & Acceleration Agreement). Absent in older drafts = accelerator. */
  contractType: string;
  /** International template: name of the Delaware U.S. Parent, if already chosen. */
  usParentName: string;
  /** Referral (both templates): "yes" when a referrer introduced the company. */
  referred: string;
  referrerName: string;
  /** "standard" = standard partner (20% commission); "advisor" = official advisor (25%). */
  referrerType: string;
  referrerEquityPercent: string;
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
  contractType: "accelerator",
  usParentName: "",
  referred: "no",
  referrerName: "",
  referrerType: "advisor",
  referrerEquityPercent: "",
  effectiveDate: "",
  companyName: "",
  jurisdiction: "",
  companyAddress: "",
  companyNoticeEmail: "",
  equityPercent: "",
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

/** Referral (founder, 2026-11-23): standard partner = 20% commission,
 *  official advisor = 25% commission. */
export const referrerRate = (t: string): string => (t === "standard" ? "20" : "25");
export const referrerTypeLabel = (t: string): string =>
  t === "standard" ? "standard partner" : "official advisor";

/** One-line referral summary used in Schedule A, in the founder's format:
 *  "Referral — Spacely (Chile), official advisor: 2% + 25% of the first
 *  payment (one time)". The referrer's equity is carved out of SFH's equity
 *  share, and the percentage commission applies to the FIRST PAYMENT ONLY —
 *  one time, never monthly or recurring (founder corrections, 2026-11-23). */
export const referralSummary = (v: EquityContractValues): string => {
  const parts: string[] = [];
  if (v.referrerEquityPercent?.trim())
    parts.push(`${percentDisplay(v.referrerEquityPercent)}% equity (carved from SFH's share)`);
  parts.push(`${referrerRate(v.referrerType)}% of the first payment (one time)`);
  return `Referral — ${v.referrerName?.trim() || "____________"}, ${referrerTypeLabel(
    v.referrerType
  )}: ${parts.join(" + ")}`;
};

/** The generated referral clause body (both templates). `equityOf` names what
 *  the referrer's equity percentage is an interest in — "the Company" for the
 *  accelerator agreement, "the U.S. Parent" for the international agreement. */
const referralClauseParas = (v: EquityContractValues, equityOf: string, party = "IES"): string[] => {
  const total = Number(v.equityPercent);
  const refPct = Number(v.referrerEquityPercent);
  const allocation =
    Number.isFinite(total) && Number.isFinite(refPct) && total >= refPct
      ? ` Of the ${esc(percentDisplay(v.equityPercent))}% ${
          v.contractType === "international"
            ? `share of the U.S. Parent held by ${party} under Section 1.3`
            : "equity granted under Section 2"
        }, ${esc(percentDisplay(v.referrerEquityPercent))}% is allocated to the Referrer and ${esc(
          percentDisplay(String(total - refPct))
        )}% to ${party}.`
      : "";
  return [
  `<strong>Referrer.</strong> The Company was introduced to ${party} by ${blank(
    v.referrerName,
    24
  )} (the "<strong>Referrer</strong>"), acting as ${referrerTypeLabel(v.referrerType)}.`,
  `<strong>Referral compensation.</strong> In consideration of the introduction, the Referrer is entitled to (i) an equity interest of ${
    v.referrerEquityPercent?.trim() ? `${esc(percentDisplay(v.referrerEquityPercent))}%` : "______%"
  } in ${equityOf}, <strong>carved out of the equity share of ${party} under this Agreement</strong> — the Referrer's interest comes out of ${party}'s share and does not increase the total equity issued under this Agreement — and (ii) a one-time commission equal to ${referrerRate(
    v.referrerType
  )}% (the ${referrerTypeLabel(v.referrerType)} commission rate) of the Company's <strong>first payment</strong> under this Agreement. The commission is payable one time only, on that first payment; it is not a monthly or recurring commission.${allocation} The referral terms are summarized in Schedule A.`,
  `<strong>Entire referral terms.</strong> This Section and Schedule A state the entire referral compensation for this introduction; no other referral fee, commission or equity is owed in connection with the Company's admission.`,
  ];
};

export function buildEquityContractHtml(v: EquityContractValues): string {
  if (v.contractType === "international") return buildInternationalContractHtml(v);
  const eqNum = esc(percentDisplay(v.equityPercent || ""));
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
    `<strong>1.2 Program Services.</strong> During the Company's participation in the Program, IES will provide the accelerator services made available under the Program, as the Program may be amended from time to time (collectively, the "<strong>Services</strong>"). The Services include, as applicable to the Company: Technology Development; Test Customers; Customer Discovery; Mentors; Market Competition; Validation Decision; Commercialization; Validation and Attraction; and Go to Market — together with investor readiness and introductions, platform and community access, events and demo opportunities, and partner benefits made available through the Program.`
  )}
  ${p(
    `<strong>1.3 No Guarantee of Financing.</strong> The Company acknowledges that IES does not guarantee that the Company will raise any financing, and that no provision of this Agreement is a commitment by IES or any third party to invest in or lend to the Company.`
  )}

  ${h("2", "Initial Consideration — Equity")}
  ${p(
    `<strong>2.1 Equity Right.</strong> As consideration for the Company's admission to the Program, the Company shall issue to IES an unconditional and irrevocable right to an equity interest in the Company equivalent to founder's equity, in a quantity resulting in the percentage ownership by IES set forth in Schedule A (the "<strong>IES Equity Percentage</strong>") of all the equity interests (or equivalent interests) of the Company outstanding post-issuance of the IES interest. The IES Equity Percentage is set individually for each Company in Schedule A; there is no standard or default percentage.`
  )}
  ${p(
    `<strong>2.2 Documentation.</strong> The Company shall execute and deliver such documents as IES reasonably requests to evidence and give effect to the right granted under Section 2.1, promptly upon admission and in any event within fifteen (15) days of IES's request.`
  )}

  ${h("3", "Phase One — The Milestone")}
  ${p(
    `<strong>3.1 Phase One.</strong> Phase One commences upon the Company's admission to the Program and continues until such time as the Company has raised the Phase 1 Fundraising Goal set forth in Schedule A (the "<strong>Milestone Financing</strong>"), in equity, debt, or any other form, in addition to any financing raised by the Company prior to the date of the Company's admission to the Program.`
  )}
  ${p(
    `<strong>3.2 One Milestone Per Agreement.</strong> This Agreement covers Phase One only — a single financing milestone. The Company's participation in any further financing milestone after Phase One shall be under a new agreement between the Parties.`
  )}
  ${p(
    `<strong>3.3 Services.</strong> During Phase One, IES will provide the Services under the Program, as it may be amended from time to time (the "<strong>Phase One Services</strong>").`
  )}

  ${h("4", "Compensation and Payment Terms")}
  ${p(
    `<strong>4.1 Phase One Compensation.</strong> As consideration for the provision of the Phase One Services by IES to the Company, the Company will pay to IES the Phase One Compensation set forth in Schedule A; provided, however, that the Phase One Compensation will accrue as an obligation on the books of the Company immediately upon the commencement of Phase One, but become payable only upon the closing of the Milestone Financing.`
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

  ${h("5", "Conclusion of Phase One")}
  ${p(
    `<strong>5.1 Conclusion.</strong> Upon the closing of the Milestone Financing and the payment of the Phase One Compensation, the Services under this Agreement conclude and the Company's participation in the Program under this Agreement terminates. Termination of participation under this Section does not affect the equity right granted under Section 2, which is unconditional and irrevocable, or any amount accrued under this Agreement.`
  )}
  ${p(
    `<strong>5.2 Accrued Amounts Survive.</strong> Any Phase One Compensation that has accrued but not yet been paid remains an obligation of the Company, payable in accordance with Section 4.`
  )}

  ${h("6", "Unlimited Office Access (Optional Add-On)")}
  ${p(
    `<strong>6.1 Election.</strong> If the Company elects the Unlimited Office Access add-on in Schedule A, IES shall provide the Company with unlimited access to the office space made available through the Program for the duration of the Company's participation, subject to the reasonable rules of the applicable workspace.`
  )}
  ${p(
    `<strong>6.2 Add-On Fee.</strong> The fee for Unlimited Office Access is <strong>Nine Hundred Fifty Dollars ($950) per month</strong>, billed monthly in advance, commencing on the start date stated in Schedule A — the Monday following the date the Company signs this Agreement — and continuing month to month until the earlier of (i) termination of the Company's participation in the Program or (ii) the Company's written cancellation of the add-on, effective at the end of the then-current monthly period.`
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
    `<strong>7.3 Effect of Termination.</strong> Upon termination for any reason: (a) the equity right granted under Section 2 is irrevocable and survives; (b) any Phase One Compensation that has accrued on the books of the Company prior to termination remains an obligation of the Company and becomes payable upon the closing of the Milestone Financing; and (c) Sections 2, 4, 5 (as to amounts accrued), 8, 9 and 10 survive.`
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
  ${
    v.referred === "yes"
      ? `${h(
          String(
            11 +
              (v.customClauses || []).filter(
                (c) => (c.title || "").trim() || (c.body || "").trim()
              ).length
          ),
          "REFERRAL"
        )}${referralClauseParas(v, "the Company").map((t) => p(t)).join("")}`
      : ""
  }

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
    ${row(
      "Equity right (Section 2) — IES Equity Percentage (CUSTOM per Company, no default)",
      `${v.equityPercent?.trim() ? `${eqNum}%` : "______%"} post-issuance founder's-equity-equivalent interest`
    )}
    ${row("Total raised by the Company prior to admission", money(v.totalRaised))}
    ${row("Phase 1 Fundraising Goal (the Milestone Financing)", money(v.phase1Financing))}
    ${row("Phase One Compensation", money(v.phase1Compensation), true)}
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
    ${v.referred === "yes" ? row("Referral", esc(referralSummary(v)), true) : ""}
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

/**
 * International Equity Partnership & Acceleration Agreement (founder-approved
 * draft v1, 2026-11-23): a Delaware U.S. Parent is created as parent company
 * (empresa matriz); the founder's local company becomes its 100%-owned
 * subsidiary (share exchange / flip, YC international model); ownership of
 * the U.S. Parent is split per startup in Schedule A — NO fixed percentage;
 * NO grants section and NO equity earn-in (both removed by the founder).
 * Field mapping: companyName = Local Company legal name; jurisdiction =
 * country of incorporation; companySignerName = the founder; equityPercent =
 * SFH's percentage of the U.S. Parent per Schedule A (blank = to be agreed
 * in Schedule A, never a template default).
 */
export function buildInternationalContractHtml(v: EquityContractValues): string {
  const row = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:7px 10px;border:1px solid #d1d5db;${bold ? "font-weight:700" : ""}">${esc(
      label
    )}</td><td style="padding:7px 10px;border:1px solid #d1d5db;${bold ? "font-weight:700" : ""}">${value}</td></tr>`;
  const sfhPct = v.equityPercent?.trim() ? Number(v.equityPercent) : NaN;
  const foundersPct = Number.isFinite(sfhPct) ? 100 - sfhPct : NaN;
  const splitText = Number.isFinite(sfhPct)
    ? `SFH ${esc(percentDisplay(v.equityPercent))}% / Founders ${esc(
        percentDisplay(String(foundersPct))
      )}% of the U.S. Parent`
    : "As agreed in writing in Schedule A before formation (no fixed percentage)";
  const customCount = (v.customClauses || []).filter(
    (c) => (c.title || "").trim() || (c.body || "").trim()
  ).length;

  return `
<div style="font-family:Georgia,'Times New Roman',serif;color:#111827;font-size:14px">
  <h2 style="text-align:center;font-size:20px;margin:0 0 4px">INTERNATIONAL EQUITY PARTNERSHIP &amp; ACCELERATION AGREEMENT</h2>
  <p style="text-align:center;font-size:12px;color:#6b7280;margin:0 0 24px">
    Imagine Engine Studios Corp d/b/a Startup Factory Hub · Orlando, Florida ·
    <a href="${PARTNERS_URL}" style="color:#0ea270">Learn more about us</a>
  </p>

  ${p(
    `This International Equity Partnership &amp; Acceleration Agreement (this "<strong>Agreement</strong>") is entered into as of the date set forth in Schedule A (the "<strong>Effective Date</strong>"), by and between <strong>Imagine Engine Studios Corp</strong>, a Florida corporation, doing business as <strong>Startup Factory Hub</strong> ("<strong>SFH</strong>"), and ${blank(
      v.companySignerName,
      24
    )} and <strong>${blank(v.companyName, 30)}</strong> (the "<strong>Local Company</strong>"), incorporated in ${blank(
      v.jurisdiction,
      18
    )} (together, the "<strong>Founders</strong>"). SFH and the Founders are each a "Party" and collectively the "Parties."`
  )}
  ${p(
    `The Founders wish to expand into the United States. SFH will act as the Founders' United States partner and accelerator under the structure below.`
  )}

  ${h("1", "Formation of the U.S. Parent Company")}
  ${p(
    `<strong>1.1 Formation.</strong> The Parties will form a new corporation in the United States (Delaware)${v.usParentName?.trim() ? `, named <strong>${esc(v.usParentName.trim())}</strong>,` : ""} (the "<strong>U.S. Parent</strong>").`
  )}
  ${p(
    `<strong>1.2 Parent company.</strong> The U.S. Parent is the parent company (empresa matriz) of the group. The Local Company becomes its local operating company and subsidiary.`
  )}
  ${p(
    `<strong>1.3 Ownership.</strong> Ownership of the U.S. Parent at formation: SFH (or its designee) and the Founders hold shares as equity partners — <strong>${splitText}</strong>. The percentage varies by startup and is <strong>not</strong> fixed in this Agreement; the split for each company is agreed in writing in its Schedule A before formation.`
  )}

  ${h("2", "The Local Company as Subsidiary")}
  ${p(
    `<strong>2.1 Share exchange (flip).</strong> The Founders will transfer one hundred percent (100%) of the shares of the Local Company to the U.S. Parent (share exchange / "flip"), so the U.S. Parent owns the Local Company in full.`
  )}
  ${p(
    `<strong>2.2 Local operations.</strong> The Local Company keeps operating in its home country, with its local team, contracts and obligations, as the group's local company.`
  )}
  ${p(
    `<strong>2.3 Intellectual property.</strong> The group's intellectual property is held under the U.S. Parent as ultimate owner, or remains in the Local Company with an exclusive license to the U.S. Parent, at the Founders' election recorded in writing.`
  )}

  ${h("3", "United States Expansion")}
  ${p(
    `<strong>3.1 U.S. vehicle.</strong> The U.S. Parent is the vehicle for the group's United States operations and fundraising.`
  )}
  ${p(
    `<strong>3.2 U.S. partner.</strong> SFH, as the U.S. equity partner, provides its U.S. presence, network and support for that expansion.`
  )}

  ${h("4", "Acceleration Services")}
  ${p(
    `<strong>4.1 Services.</strong> SFH provides the U.S. Parent and the Local Company its acceleration and venture-building services: company building, fundraising preparation, investor and partner introductions, and access to the Startup Factory Hub platform and programs.`
  )}

  ${h("5", "Governance")}
  ${p(
    `<strong>5.1 Board and major decisions.</strong> Board representation follows the ownership split agreed in Schedule A. Major decisions — sale of the company, new share issuance, debt above an agreed threshold, and changes to this structure — require both partners' consent.`
  )}
  ${p(
    `<strong>5.2 Day-to-day operations.</strong> Day-to-day operations of the Local Company remain led by the Founders.`
  )}

  ${h("6", "Term and Exit")}
  ${p(
    `<strong>6.1 Term.</strong> This Agreement takes effect on signing and remains in force while both partners hold shares in the U.S. Parent.`
  )}
  ${p(
    `<strong>6.2 Transfer restriction.</strong> Neither partner may sell or transfer U.S. Parent shares to a third party without the other partner's written consent (right of first refusal).`
  )}

  ${h("7", "General Provisions")}
  ${p(
    `<strong>7.1 Independent parties.</strong> Except for the equity partnership in the U.S. Parent expressly created by this Agreement, nothing in this Agreement creates an employment or agency relationship between the Parties.`
  )}
  ${p(
    `<strong>7.2 Governing law.</strong> This Agreement is governed by the laws of the State of Florida, without regard to its conflict-of-laws principles.`
  )}
  ${p(
    `<strong>7.3 Entire agreement; amendments.</strong> This Agreement (including Schedule A) is the entire agreement between the Parties regarding the structure described here and supersedes all prior or contemporaneous understandings. It may be amended only in a writing signed by both Parties.`
  )}
  ${p(
    `<strong>7.4 Notices.</strong> Notices under this Agreement must be in writing and are deemed given when delivered by email (with confirmation of receipt) or three (3) business days after mailing, to the addresses set forth in Schedule A.`
  )}
  ${p(
    `<strong>7.5 Counterparts; electronic signatures.</strong> This Agreement may be executed in counterparts, each of which is an original. Electronic and PDF signatures are binding to the same extent as handwritten signatures.`
  )}
  ${(v.customClauses || [])
    .filter((c) => (c.title || "").trim() || (c.body || "").trim())
    .map(
      (c, i) =>
        `${h(String(8 + i), (c.title || "ADDITIONAL TERMS").toUpperCase())}${(c.body || "")
          .split(/\n{1,}/)
          .filter((line) => line.trim())
          .map((line) => p(esc(line.trim())))
          .join("")}`
    )
    .join("")}
  ${
    v.referred === "yes"
      ? `${h(String(8 + customCount), "REFERRAL")}${referralClauseParas(v, "the U.S. Parent", "SFH")
          .map((t) => p(t))
          .join("")}`
      : ""
  }

  <h3 style="font-size:15px;margin:32px 0 12px">SCHEDULE A — TERMS FOR THE COMPANY</h3>
  <table style="border-collapse:collapse;width:100%;font-size:13.5px">
    ${row("Local Company (legal name)", blank(v.companyName, 30))}
    ${row("Country of incorporation", blank(v.jurisdiction, 20))}
    ${row("Founder", blank(v.companySignerName, 24))}
    ${row(
      "Company address / notice email",
      `${blank(v.companyAddress, 30)}${v.companyNoticeEmail?.trim() ? ` / ${esc(v.companyNoticeEmail.trim())}` : ""}`
    )}
    ${row(
      "Company signatory (name / title)",
      `${blank(v.companySignerName, 20)}${v.companySignerTitle?.trim() ? ` / ${esc(v.companySignerTitle.trim())}` : ""}`
    )}
    ${row("IES notice address / email", esc(IES_NOTICE))}
    ${row("Effective Date", blank(v.effectiveDate, 20))}
    ${row("U.S. Parent (Delaware)", v.usParentName?.trim() ? esc(v.usParentName.trim()) : "To be formed")}
    ${row("Ownership of the U.S. Parent (Section 1.3)", splitText, true)}
    ${row("Local Company ownership after the flip", "100% owned by the U.S. Parent")}
    ${v.referred === "yes" ? row("Referral", esc(referralSummary(v)), true) : ""}
  </table>

  <h3 style="font-size:15px;margin:32px 0 12px">AGREED AND ACCEPTED:</h3>

  <p style="margin:0 0 6px;font-weight:600">Imagine Engine Studios Corp d/b/a Startup Factory Hub</p>
  ${p(`By: ______________________________`)}
  ${p(`Name: ${blank(v.acceleratorSignerName, 22)}`)}
  ${p(`Title: ${blank(v.acceleratorSignerTitle, 22)}`)}
  ${p(`Date: ______________________________`)}

  <p style="margin:24px 0 6px;font-weight:600">The Founders — ${blank(v.companyName, 26)}</p>
  ${p(`By: ______________________________`)}
  ${p(`Name: ${blank(v.companySignerName, 22)}`)}
  ${p(`Title: ${blank(v.companySignerTitle, 22)}`)}
  ${p(`Date: ______________________________`)}
</div>`.trim();
}

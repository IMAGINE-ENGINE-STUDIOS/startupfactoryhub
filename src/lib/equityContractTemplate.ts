/**
 * Startup Factory Hub — Strategic Accelerator and Venture Building Agreement
 * (REVISED, signable version — replaces the former equity + profit
 * participation template on 2026-11-02 at the founder's direction).
 *
 * Key terms: 1% equity vesting monthly over a 3-month Active Period,
 * limited anti-dilution until the earlier of 18 months or a $1M+ Qualified
 * Financing, a 5% fundraising success fee payable only on Covered Investors
 * (written introductions acknowledged by the Company, 18-month tail, and
 * only to the extent lawful), 12 months of complimentary platform access,
 * alumni benefits while the Accelerator holds at least 0.5%, and optional
 * office space at $950/month under a separate addendum.
 *
 * Renders print-ready HTML used by the admin Equity Contracts section and by
 * the public signing page (`/sign/:token`). Underscore runs become signature
 * fields automatically (see `src/lib/signatureFields.ts`).
 *
 * Note: `profitPercent` in EquityContractValues is retained for storage
 * compatibility with drafts saved under the former template; in this revised
 * agreement its value is used as the fundraising SUCCESS FEE percent.
 * There is no profit participation in this version.
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
  equityPercent: "1",
  profitPercent: "5",
  termMonths: "3",
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
  const fee = blank(v.profitPercent, 4);
  const term = v.termMonths?.trim() || "3";

  const founders = SFH_FOUNDERS.map(
    (f) =>
      `<li><strong>${esc(f.name)}</strong> — ${esc(f.role)}</li>`
  ).join("");

  return `
<div style="font-family:Georgia,'Times New Roman',serif;color:#111827;font-size:14px">
  <h2 style="text-align:center;font-size:20px;margin:0 0 4px">STRATEGIC ACCELERATOR AND VENTURE BUILDING AGREEMENT</h2>
  <p style="text-align:center;font-size:12px;color:#6b7280;margin:0 0 24px">
    Imagine Engine Studios Corp d/b/a Startup Factory Hub · Lake Nona Center, Orlando, Florida ·
    <a href="${PARTNERS_URL}" style="color:#0ea270">Learn more about us</a>
  </p>

  ${p(
    `This Strategic Accelerator and Venture Building Agreement ("Agreement") is entered into as of ${blank(
      v.effectiveDate,
      20
    )} (the "Effective Date") by and between:`
  )}
  ${p(
    `<strong>Imagine Engine Studios Corp</strong>, a Florida corporation, doing business as <strong>Startup Factory Hub</strong>, with its principal place of business at 6900 Tavistock Lakes Boulevard SE, Suite 400, Lake Nona Center, Orlando, Florida 32827, hereinafter referred to as "Imagine Engine", "Startup Factory Hub" or the "Service Provider",`
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
  ${p('Each a "Party" and collectively the "Parties."')}

  ${h("1", "PURPOSE AND ENGAGEMENT")}
  ${p(
    `The Company engages the Service Provider as its strategic accelerator and venture-building partner for an initial period of ${esc(
      term
    )} (${esc(
      term
    )}) months from the Effective Date (the "Active Period"), on the equity-compensation track described in this Agreement. This Agreement is separate from the Service Provider's paid subscription and Accelerator-as-a-Service offerings; no cash program fee is due for the services in Section 2 except for the success fee in Section 4, expenses in Section 8, and any optional office arrangement in Section 7.`
  )}
  ${p(
    "At or promptly after the Effective Date, the Parties will agree in writing (email sufficient) on a kickoff plan identifying the Company's lead contact, the lead advisor, priority objectives, and scheduled check-ins for the Active Period."
  )}

  ${h("2", "SCOPE OF SERVICES")}
  ${p(
    "During the Active Period, the Service Provider will provide the following services on a commercially reasonable efforts basis, subject to scheduling and availability. No service in this Section guarantees any business, product, or fundraising outcome."
  )}
  ${group("2.1 Advising and Mentorship", [
    "Weekly or bi-weekly one-on-one mentorship with a lead advisor",
    "Access to a network of founders, operators, executives, and investors, by introduction where appropriate",
    "Office hours, strategic sessions, and accountability check-ins",
    "Guidance on product-market fit, business development, scaling, and fundraising readiness",
  ])}
  ${group("2.2 Human Capital Support", [
    "Access to a vetted talent network, including developers, designers, marketers, sales professionals, and other specialists",
    "Assistance with recruiting, interviewing, and onboarding initial employees and interns",
    "Advisory on team structure, organizational development, and workforce planning",
  ])}
  ${p("Recruitment fees, salaries, and third-party employment expenses are excluded unless separately agreed in writing.")}
  ${group("2.3 MVP Development Support", [
    "Product scoping, roadmap development, and sprint planning",
    "Technical advisory and architecture review",
    "Introductions to development agencies, technical partners, and internal development resources",
    "Quality assurance and product launch-readiness review",
  ])}
  ${p("Software engineering, development labor, hosting, and third-party development expenses are excluded unless separately agreed in writing, including under a separate AI Credits or development agreement.")}
  ${group("2.4 Fractional C-Suite Executive Support", [
    "Access to shared, part-time executive advisory resources (which may include CTO, CMO, and CFO functions), each for up to five (5) hours of advisory support per month during the Active Period, subject to availability and scheduling",
    "These services are advisory only and do not constitute full-time employment or dedicated executive placement",
  ])}
  ${group("2.5 Business Consulting and Venture Building", [
    "Business planning: business plan preparation and review, market analysis, competitive and commercialization strategy",
    "Revenue models: monetization and pricing strategy, unit economics, LTV and CAC analysis",
    "Business strategy: go-to-market, growth, and market expansion strategy",
    "Capitalization table: cap table modeling, financing scenario and dilution planning",
    "Financial projections: three-to-five-year projections, including P&L, cash flow, and balance sheet projections, based on information and assumptions provided by the Company",
    "Investor reporting: investor-ready reporting templates, KPI dashboard, and monthly investor update templates",
    "Pitch deck: deck review and restructuring, investment narrative development, design guidance, and pitch coaching",
  ])}
  ${group("2.6 Investor Relations and Fundraising Support", [
    "Fundraising strategy and capital planning",
    "Investor identification and pipeline development",
    "Introductions to investors in accordance with Section 4",
    "Investor relationship coordination, meeting preparation, and follow-up support",
    "Investment positioning and fundraising materials support",
  ])}
  ${p("All fundraising activities will be conducted in compliance with applicable securities laws, as provided in Section 4.4.")}
  ${group("2.7 Company Obligations", [
    "Designate one lead contact and ensure its founders or senior team attend scheduled sessions or give reasonable notice of rescheduling",
    "Provide timely, accurate, and complete information reasonably requested by the Service Provider, and make decisions within agreed timeframes",
    "Remain solely responsible for its business, product, legal, tax, accounting, and financing decisions",
  ])}

  ${h("3", "EQUITY COMPENSATION")}
  ${p(
    `In consideration of the services and strategic partnership under this Agreement, the Company will grant the Service Provider an equity interest equal to ${equity}% of the Company's fully diluted capitalization, as calculated immediately following the issuance (the "Equity").`
  )}
  ${p(
    "<strong>3.1 Instrument and Issuance.</strong> The Equity will be issued as restricted common stock (or, if the Company does not have common stock, the closest equivalent ownership interest; or, if both Parties agree in writing, another instrument such as a SAFE that converts into or represents the percentage above). The Company will, within fifteen (15) business days after the Effective Date, complete all corporate approvals, issue the Equity, deliver the issuance documents and an updated capitalization table reflecting the Equity, and record the Service Provider in its ownership records. The issuance will be made in compliance with applicable securities laws under an available exemption from registration. The Service Provider represents that it is acquiring the Equity for investment purposes for its own account and understands the Equity is restricted and illiquid. The Company will provide issuance documents in sufficient time for the Service Provider to consider a timely Section 83(b) election, if applicable, and the Service Provider is solely responsible for its own tax decisions and filings."
  )}
  ${p(
    "<strong>3.2 Vesting; Effect of Termination of Services.</strong> The Equity will vest in three (3) equal monthly installments over the Active Period, the first installment vesting at the end of the first full month after the Effective Date. Equity that has vested is permanent and will not be forfeited, cancelled, or repurchased by reason of expiration of the Active Period, termination of services, or any later change in the Parties' relationship. If the Company terminates the service engagement under Section 9 for the Service Provider's material breach that remains uncured after the notice-and-cure period in Section 9, any then-unvested Equity will be automatically forfeited (or, if already issued, repurchased by the Company at its original issue price or par value, as applicable) and will be cancelled. In all other cases of early termination, including termination by the Company without cause, the full Equity will vest as of the termination date."
  )}
  ${p(
    "<strong>3.3 Limited Anti-Dilution Protection; Pro-Rata Right.</strong> Until the earlier of (a) eighteen (18) months after the Effective Date and (b) the closing of the Company's first priced equity financing raising at least US $1,000,000 in gross proceeds (a \"Qualified Financing\"), the Company will issue the Service Provider such additional equity as is necessary to maintain the Service Provider's ownership at the percentage in this Section 3, excluding issuances under a board-approved employee and advisor equity pool of up to fifteen percent (15%) and equity issued on conversion of SAFEs or convertible notes outstanding and disclosed to the Service Provider as of the Effective Date. After that period ends, the Service Provider's ownership will dilute in the ordinary course with other holders of the same class. Subject to the rights of the Company's major investors and applicable financing documents, the Service Provider will have a pro-rata right to participate in future equity financings up to its then-current ownership percentage, on the same terms as other investors in that financing."
  )}
  ${p(
    "<strong>3.4 Rights of the Equity.</strong> The Equity will carry the same economic rights as the Company's common stock (or equivalent), and will be subject to the Company's charter, bylaws or operating agreement, and any generally applicable stockholder agreements in effect at issuance that are provided to the Service Provider. This Agreement does not grant the Service Provider board, observer, veto, or management rights."
  )}

  ${h("4", "FUNDRAISING SUCCESS FEE")}
  ${p(
    `<strong>4.1 Covered Investors and Fee.</strong> The Company will pay the Service Provider a success fee equal to ${fee}% of the gross cash proceeds actually received by the Company from a Covered Investor in a Covered Financing, subject to Section 4.4. A "Covered Investor" is an investor that (i) was first introduced to the Company in writing by the Service Provider, (ii) is recorded on a written Covered Investor list maintained by the Parties, and (iii) is acknowledged in writing (email sufficient) by the Company as a Covered Investor. A "Covered Financing" is the first equity, SAFE, or convertible note financing in which a Covered Investor invests and that closes during the Active Period or within eighteen (18) months after the date that Covered Investor was first introduced (the "Tail Period"), including later tranches of that same financing closing within six (6) months after its first closing.`
  )}
  ${p(
    "<strong>4.2 Exclusions.</strong> No success fee is due on: (a) investors with whom the Company or its founders had a substantive pre-existing relationship, documented before the introduction; (b) investors who contact the Company independently without the Service Provider's introduction or material involvement; (c) grants, bank or venture debt, revenue, or customer payments; or (d) financings closing after the applicable Tail Period, including later rounds led by a Covered Investor after its Covered Financing."
  )}
  ${p(
    "<strong>4.3 Payment Terms.</strong> The fee is calculated on gross cash proceeds actually received and is due within five (5) business days after the Company receives those proceeds. For proceeds received in installments within a Covered Financing, the fee is payable proportionally as each installment is received. The Company will notify the Service Provider within five (5) business days after each closing with a Covered Investor, whether or not the Service Provider participated in that closing."
  )}
  ${p(
    "<strong>4.4 Regulatory Compliance.</strong> The Parties acknowledge that transaction-based compensation for securities activities may be subject to broker-dealer registration and other regulatory requirements. No cash success fee will be payable under this Section 4 to the extent its payment would violate applicable law. If the Parties' counsel determines that a fee cannot lawfully be paid in cash as structured, the Parties will negotiate in good faith a lawful alternative arrangement of comparable value (which may include an advisory equity fee or a fee payable through a registered broker-dealer), and neither Party is required to agree to an arrangement its counsel advises is unlawful."
  )}

  ${h("5", "ALUMNI BENEFITS")}
  ${p(
    "After the Active Period, and for so long as the Service Provider holds at least 0.5% of the Company's fully diluted capitalization, the Company will be eligible for the following alumni benefits, in each case subject to availability, program capacity, and the Service Provider's then-current program terms. The Service Provider may modify or discontinue alumni benefits prospectively on ninety (90) days' written notice after the fifth anniversary of the Effective Date."
  )}
  ${ul([
    "Business advisory: one quarterly strategic consultation of up to thirty (30) minutes; access to the Startup Factory Hub alumni community",
    "Website and digital advisory: one website audit per year and website strategy advisory; access to preferred website development rates. Development, hosting, and third-party costs are excluded unless separately agreed",
    "Partnership development and networking: introductions to strategic partners, vendors, potential customers, and commercial partners where appropriate; invitations to selected demo days, investor networking, and founder events, subject to event requirements",
    "Technology and infrastructure: access to selected development templates and boilerplates, introductions to technology providers, and access to available SaaS credits and partner programs (including programs offered through third parties), subject to those providers' terms. No ownership of the Service Provider's proprietary intellectual property is transferred",
    "Professional development: access to selected workshops, educational resources, and certification programs, subject to provider terms and costs",
    "Corporate infrastructure support: guidance on corporate governance, introductions to legal, accounting, banking, and payroll providers, and access to selected corporate templates. The Service Provider does not provide legal, tax, or accounting advice",
    "Fundraising advisory: ongoing fundraising strategy guidance, investor pipeline updates, strategic introductions subject to availability, term sheet commercial feedback, and future-round capital strategy. Any success fee remains governed solely by Section 4",
  ])}

  ${h("6", "STARTUP FACTORY HUB PLATFORM ACCESS")}
  ${p(
    "The Company will receive twelve (12) months of complimentary access to the Startup Factory Hub digital platform, beginning on the Effective Date, at the standard founder platform tier then generally offered, subject to the platform's terms of use and privacy policy. The Service Provider may suspend access for material breach of those terms after notice and a reasonable opportunity to cure. After the complimentary period, continued access is subject to the subscription plans and pricing then offered, unless otherwise agreed in writing."
  )}

  ${h("7", "OPTIONAL OFFICE SPACE")}
  ${p(
    "The Company may elect office space offered by the Service Provider at US $950 per month, subject to availability. No office occupancy will begin until the Parties sign a separate written office addendum identifying the location, space, included services, access, and facility rules; that addendum will state whether the arrangement is a license or a sublease. The office arrangement is month-to-month and either Party may cancel it on thirty (30) days' written notice. Cancellation or absence of office space does not affect the Company's accelerator participation, the Equity (subject to Section 3.2), alumni benefits, platform access (subject to Section 6), or any other rights under this Agreement."
  )}

  ${h("8", "ADDITIONAL EXPENSES")}
  ${p(
    "Unless otherwise agreed in writing, the following are excluded and are the Company's responsibility: software development and engineering labor, advertising and paid marketing, employee and contractor compensation, legal and accounting fees, third-party software and licenses, government filing fees, and travel and extraordinary expenses. Any additional expenditure to be charged to the Company must be approved by the Company in writing before it is incurred."
  )}

  ${h("9", "TERM, PERFORMANCE, AND TERMINATION")}
  ${p(
    `The Active Period is ${esc(term)} (${esc(
      term
    )}) months from the Effective Date. The Service Provider will provide the services in a commercially reasonable and professional manner. If either Party materially breaches this Agreement, the other Party will give written notice identifying the breach, and the breaching Party will have fifteen (15) days to cure it. If it is not cured, the non-breaching Party may terminate the service engagement by written notice. Either Party may also terminate the service engagement without cause on thirty (30) days' written notice. The Parties may mutually agree in writing to modify or discontinue services.`
  )}
  ${p(
    "On termination or expiration of the service engagement: (a) future accelerator services cease at the end of any applicable notice period; (b) vesting is governed by Section 3.2 and vested Equity is unaffected; (c) success fees for Covered Financings that close during the applicable Tail Period remain payable under Section 4, including where the Covered Investor was introduced before termination; (d) alumni benefits continue under Section 5; (e) platform access continues for the remainder of the twelve-month complimentary period, subject to Section 6; and (f) any office arrangement continues to be governed by Section 7 and its addendum."
  )}

  ${h("10", "CONFIDENTIALITY AND INTELLECTUAL PROPERTY")}
  ${p(
    "Each Party will keep confidential all non-public business, financial, technical, and operational information of the other Party that is identified as confidential or that, by its nature, should reasonably be treated as confidential, and will use it only to perform or receive services under this Agreement. This obligation does not apply to information that is or becomes public without fault, was already known, is received from a third party without a confidentiality duty, or is independently developed. A Party may disclose confidential information as required by law after, where legally permitted, giving the other Party prompt notice. Confidentiality obligations survive for three (3) years after disclosure of the information concerned."
  )}
  ${p(
    "Each Party retains ownership of its pre-existing intellectual property, technology, software, methodologies, and proprietary materials. Company-specific work product created specifically for the Company under this Agreement belongs to the Company, subject to third-party rights and any separate written intellectual property agreement. The Service Provider retains ownership of its accelerator methodologies, venture-building frameworks, software, platform, templates, and proprietary resources, and receives a non-exclusive, royalty-free license to use Company feedback and anonymized, aggregated program data to operate and improve its programs. Any other transfer or license of intellectual property requires a separate written agreement."
  )}

  ${h("11", "RELATIONSHIP; NON-EXCLUSIVITY; LIABILITY")}
  ${p(
    "The Service Provider is an independent contractor. Nothing in this Agreement creates an employment, partnership, joint venture, or agency relationship, and neither Party may bind the other without prior written authorization. This engagement is non-exclusive: the Service Provider may provide services to other companies, including companies in similar fields, subject to Section 10, and the Company may engage other advisors and accelerators."
  )}
  ${p(
    "To the maximum extent permitted by law, neither Party will be liable for indirect, incidental, special, consequential, or punitive damages, or lost profits, and each Party's total aggregate liability under this Agreement will not exceed US $50,000. These limitations do not apply to a Party's obligations to issue the Equity or pay a success fee lawfully due, breach of Section 10, infringement of intellectual property rights, or fraud or willful misconduct."
  )}

  ${h("12", "GOVERNING LAW AND DISPUTES")}
  ${p(
    "This Agreement is governed by the laws of the State of Florida, without regard to conflict-of-law principles. The Parties will first attempt to resolve any dispute through good-faith negotiations between senior representatives for fifteen (15) days. Any unresolved dispute will be submitted exclusively to the state or federal courts located in Orange County, Florida, and the Parties consent to personal jurisdiction and venue there."
  )}

  ${h("13", "GENERAL PROVISIONS")}
  ${ul([
    "Entire Agreement. This Agreement, including its exhibits, is the entire agreement between the Parties on its subject matter and supersedes all prior discussions and understandings on that subject",
    "Amendments. Any amendment must be in writing and signed by both Parties",
    "Severability. If any provision is found unenforceable, it will be modified to the minimum extent necessary to make it enforceable, or if that is not possible, severed, and the remaining provisions will remain in full force and effect",
    "Assignment. Neither Party may assign this Agreement or its obligations without the other Party's prior written consent, except that the Service Provider may assign it to a successor in connection with a sale of all or substantially all of its business or assets, on notice to the Company",
    "Notices. Notices under this Agreement must be in writing (email with confirmation of receipt is sufficient) to the addresses or email addresses in the signature blocks or later updated in writing",
    "Counterparts; Electronic Signatures. This Agreement may be executed electronically and in counterparts, each of which is an original",
    "Survival. Sections 3 (as to vested Equity and any limited protection period then running), 4 (as to Covered Financings within the Tail Period), 5, 8, 10, 11, 12, and 13 survive expiration or termination as provided in those Sections",
  ])}
  ${(v.customClauses || [])
    .filter((c) => (c.title || "").trim() || (c.body || "").trim())
    .map(
      (c, i) =>
        `${h(String(14 + i), (c.title || "ADDITIONAL TERMS").toUpperCase())}${(c.body || "")
          .split(/\n{1,}/)
          .filter((line) => line.trim())
          .map((line) => p(esc(line.trim())))
          .join("")}`
    )
    .join("")}

  <h3 style="font-size:15px;margin:32px 0 12px">SIGNATURES</h3>


  <p style="margin:0 0 6px;font-weight:600">Imagine Engine Studios Corp d/b/a Startup Factory Hub</p>
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

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

/** Signature lines rendered at the end of every generated document. */
export const buildSignatureBlocks = (signers: TemplateSigner[]) => {
  const rows = signers
    .map((s, i) => {
      const name = esc(s.name?.trim() || `Firmante ${i + 1}`);
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
          <div style="font-size:13px;margin-top:6px">Fecha</div>
        </td>
      </tr>`;
    })
    .join("");

  return `
  <div style="margin-top:36px">
    <p style="font-weight:700;margin:0 0 4px">Firmas</p>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
  </div>`;
};

export const SIGN_TEMPLATES: SignTemplate[] = [
  {
    id: "board-minutes",
    name: "Acta de Junta Directiva",
    description: "Minuta formal de reunión de directores con quórum y acuerdos.",
    category: "Corporativo",
    defaultTitle: "Minutes of the Board of Directors Meeting",
    defaultSigners: [
      { name: "", role: "Secretario" },
      { name: "", role: "Chairperson" },
    ],
    fields: [
      { key: "company", label: "Empresa", placeholder: "Malla Net" },
      { key: "date", label: "Fecha de la reunión", type: "date" },
      { key: "time", label: "Hora", placeholder: "2:30 PM" },
      { key: "location", label: "Lugar", placeholder: "Virtual", defaultValue: "Virtual" },
      { key: "purpose", label: "Propósito", placeholder: "Actualización de roles corporativos" },
      { key: "directors", label: "Directores presentes (uno por línea)", type: "textarea" },
      { key: "previous", label: "Minuta previa aprobada (fecha)", type: "date" },
      { key: "next", label: "Próxima reunión", type: "text", placeholder: "4 de septiembre, 4:00 PM" },
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
        subheading(`Directores de ${v.company?.trim() || "la compañía"}`),
        p(
          `Una reunión ordinaria de la Junta Directiva de la corporación arriba mencionada se celebró el ${val(
            v,
            "date",
          )} a las ${val(v, "time")} en ${val(v, "location", "Virtual")}.`,
        ),
        p(`El propósito de la reunión: ${val(v, "purpose")}`),
        p(
          `<strong>Quórum.</strong> Se declaró la existencia de quórum con la presencia de los siguientes directores:`,
        ),
        directors,
        p(
          `<strong>Revisión/Aprobación de la minuta anterior.</strong> La minuta de la reunión del ${val(
            v,
            "previous",
          )} fue aprobada.`,
        ),
        p(
          `<strong>Adopción de documentos/planes.</strong> El documento adjunto (${val(
            v,
            "purpose",
          )}) fue adoptado por voto de los directores.`,
        ),
        p(`<strong>Próxima reunión.</strong> La próxima reunión se celebrará el ${val(v, "next")}.`),
        p("No habiendo más asuntos que tratar, la reunión se dio por concluida."),
      ].join("");
    },
  },
  {
    id: "nda",
    name: "Acuerdo de Confidencialidad (NDA)",
    description: "NDA mutuo estándar con vigencia configurable.",
    category: "Legal",
    defaultTitle: "Acuerdo de Confidencialidad",
    defaultSigners: [
      { name: "", role: "Parte Divulgante" },
      { name: "", role: "Parte Receptora" },
    ],
    fields: [
      { key: "partyA", label: "Parte A", placeholder: "Startup Factory Hub LLC" },
      { key: "partyB", label: "Parte B", placeholder: "Contraparte" },
      { key: "date", label: "Fecha efectiva", type: "date" },
      { key: "term", label: "Vigencia", placeholder: "3 años", defaultValue: "3 años" },
      { key: "purpose", label: "Propósito de la divulgación", type: "textarea" },
    ],
    body: (v) =>
      [
        heading("Acuerdo de Confidencialidad"),
        p(
          `Este Acuerdo se celebra el ${val(v, "date")} entre <strong>${val(
            v,
            "partyA",
          )}</strong> y <strong>${val(v, "partyB")}</strong> (las "Partes").`,
        ),
        p(`<strong>1. Propósito.</strong> ${val(v, "purpose")}`),
        p(
          `<strong>2. Información Confidencial.</strong> Toda información técnica, comercial, financiera o de producto compartida entre las Partes, en cualquier formato, será tratada como confidencial.`,
        ),
        p(
          `<strong>3. Obligaciones.</strong> La Parte receptora se obliga a no divulgar la Información Confidencial a terceros sin autorización escrita, y a utilizarla exclusivamente para el Propósito.`,
        ),
        p(
          `<strong>4. Vigencia.</strong> Las obligaciones de confidencialidad permanecerán vigentes por ${val(
            v,
            "term",
            "3 años",
          )} contados desde la fecha efectiva.`,
        ),
        p(
          `<strong>5. Devolución.</strong> A solicitud, la Parte receptora devolverá o destruirá toda la Información Confidencial recibida.`,
        ),
      ].join(""),
  },
  {
    id: "advisor-agreement",
    name: "Acuerdo de Asesoría",
    description: "Contrato de advisor con dedicación, plazo y compensación.",
    category: "Talento",
    defaultTitle: "Acuerdo de Asesoría",
    defaultSigners: [
      { name: "", role: "Compañía" },
      { name: "", role: "Asesor" },
    ],
    fields: [
      { key: "company", label: "Compañía" },
      { key: "advisor", label: "Asesor" },
      { key: "date", label: "Fecha de inicio", type: "date" },
      { key: "hours", label: "Dedicación", placeholder: "4 horas / mes" },
      { key: "term", label: "Plazo", placeholder: "12 meses" },
      { key: "comp", label: "Compensación", placeholder: "0.25% en equity con vesting a 24 meses" },
      { key: "scope", label: "Alcance de la asesoría", type: "textarea" },
    ],
    body: (v) =>
      [
        heading("Acuerdo de Asesoría"),
        p(
          `Celebrado el ${val(v, "date")} entre <strong>${val(v, "company")}</strong> (la "Compañía") y <strong>${val(
            v,
            "advisor",
          )}</strong> (el "Asesor").`,
        ),
        p(`<strong>1. Servicios.</strong> ${val(v, "scope")}`),
        p(`<strong>2. Dedicación.</strong> El Asesor dedicará aproximadamente ${val(v, "hours")}.`),
        p(`<strong>3. Plazo.</strong> ${val(v, "term")}, renovable por acuerdo escrito de las partes.`),
        p(`<strong>4. Compensación.</strong> ${val(v, "comp")}.`),
        p(
          `<strong>5. Propiedad intelectual.</strong> Todo entregable creado en el marco de este acuerdo pertenece a la Compañía.`,
        ),
        p(`<strong>6. Confidencialidad.</strong> El Asesor mantendrá confidencial toda información de la Compañía.`),
      ].join(""),
  },
  {
    id: "loi",
    name: "Carta de Intención (LOI)",
    description: "Términos no vinculantes para una inversión o alianza.",
    category: "Inversión",
    defaultTitle: "Carta de Intención",
    defaultSigners: [
      { name: "", role: "Inversionista" },
      { name: "", role: "Compañía" },
    ],
    fields: [
      { key: "investor", label: "Inversionista / Socio" },
      { key: "company", label: "Compañía" },
      { key: "amount", label: "Monto / alcance", placeholder: "US$250,000" },
      { key: "valuation", label: "Valoración / condiciones", placeholder: "US$5M pre-money" },
      { key: "date", label: "Fecha", type: "date" },
      { key: "conditions", label: "Condiciones principales", type: "textarea" },
    ],
    body: (v) =>
      [
        heading("Carta de Intención"),
        p(`Fecha: ${val(v, "date")}`),
        p(
          `<strong>${val(v, "investor")}</strong> manifiesta su intención de participar en <strong>${val(
            v,
            "company",
          )}</strong> por un monto de ${val(v, "amount")} bajo condiciones de ${val(v, "valuation")}.`,
        ),
        p(`<strong>Condiciones principales.</strong> ${val(v, "conditions")}`),
        p(
          `<strong>Debida diligencia.</strong> La operación queda sujeta a la culminación satisfactoria de la debida diligencia legal, financiera y técnica.`,
        ),
        p(
          `<strong>Carácter no vinculante.</strong> Salvo las cláusulas de confidencialidad y exclusividad, esta carta no genera obligaciones vinculantes hasta la firma de los documentos definitivos.`,
        ),
      ].join(""),
  },
  {
    id: "service-agreement",
    name: "Acuerdo de Servicios",
    description: "Contrato de prestación de servicios con entregables y pagos.",
    category: "Comercial",
    defaultTitle: "Acuerdo de Servicios",
    defaultSigners: [
      { name: "", role: "Proveedor" },
      { name: "", role: "Cliente" },
    ],
    fields: [
      { key: "provider", label: "Proveedor" },
      { key: "client", label: "Cliente" },
      { key: "date", label: "Fecha de inicio", type: "date" },
      { key: "scope", label: "Entregables", type: "textarea" },
      { key: "fee", label: "Honorarios", placeholder: "US$5,000" },
      { key: "terms", label: "Condiciones de pago", placeholder: "50% al inicio, 50% a la entrega" },
    ],
    body: (v) =>
      [
        heading("Acuerdo de Servicios"),
        p(
          `Celebrado el ${val(v, "date")} entre <strong>${val(v, "provider")}</strong> (el "Proveedor") y <strong>${val(
            v,
            "client",
          )}</strong> (el "Cliente").`,
        ),
        p(`<strong>1. Entregables.</strong> ${val(v, "scope")}`),
        p(`<strong>2. Honorarios.</strong> ${val(v, "fee")}.`),
        p(`<strong>3. Pagos.</strong> ${val(v, "terms")}.`),
        p(
          `<strong>4. Propiedad.</strong> Los entregables serán propiedad del Cliente una vez recibido el pago total.`,
        ),
        p(`<strong>5. Terminación.</strong> Cualquiera de las partes puede terminar con 15 días de aviso escrito.`),
      ].join(""),
  },
  {
    id: "blank",
    name: "Documento en blanco",
    description: "Redacta tu propio texto y agrega solo los espacios de firma.",
    category: "Libre",
    defaultTitle: "Documento para firma",
    defaultSigners: [{ name: "", role: "" }],
    fields: [{ key: "content", label: "Contenido del documento", type: "textarea" }],
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

/**
 * Auto signature fields.
 *
 * Long runs of underscores ("__________") in a document are the universal way of
 * marking "sign here". This module finds them, highlights them in blue and lets
 * a signature be dropped straight into the line.
 *
 * Only class names are used (no data-* attributes) so the markup survives the
 * HTML sanitizer used on public signing links.
 */

export const SIGN_FIELD_CLASS = "sfh-sign-field";
export const SIGN_FIELD_SIGNED_CLASS = "sfh-sign-field--signed";
export const SIGN_FIELD_SELECTOR = `.${SIGN_FIELD_CLASS}:not(.${SIGN_FIELD_SIGNED_CLASS})`;

/** At least 6 underscores in a row = a signature line. */
const UNDERSCORE_RUN = /_{6,}/g;

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "CODE", "PRE"]);

function shouldSkip(node: Node): boolean {
  let el: HTMLElement | null =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : (node.parentElement as HTMLElement | null);
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.classList?.contains(SIGN_FIELD_CLASS)) return true;
    if (el.classList?.contains("signature-element")) return true;
    el = el.parentElement;
  }
  return false;
}

/**
 * Wrap every underscore run inside `root` in a clickable signature field.
 * Returns how many new fields were created.
 */
export function markSignatureFields(root: HTMLElement | null): number {
  if (!root) return 0;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const text = node.nodeValue || "";
      if (!text.includes("__")) return NodeFilter.FILTER_REJECT;
      UNDERSCORE_RUN.lastIndex = 0;
      if (!UNDERSCORE_RUN.test(text)) return NodeFilter.FILTER_REJECT;
      if (shouldSkip(node)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const targets: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    targets.push(current as Text);
    current = walker.nextNode();
  }

  let created = 0;
  for (const textNode of targets) {
    const text = textNode.nodeValue || "";
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    UNDERSCORE_RUN.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = UNDERSCORE_RUN.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const span = document.createElement("span");
      span.className = SIGN_FIELD_CLASS;
      span.setAttribute("title", "Click to sign here");
      span.textContent = match[0];
      fragment.appendChild(span);
      lastIndex = match.index + match[0].length;
      created++;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
    textNode.parentNode?.replaceChild(fragment, textNode);
  }

  return created;
}

/** Returns the signature field the event happened on, if any (and unsigned). */
export function signatureFieldFromEvent(e: Event): HTMLElement | null {
  const target = e.target as HTMLElement | null;
  const field = target?.closest?.(`.${SIGN_FIELD_CLASS}`) as HTMLElement | null;
  if (!field) return null;
  if (field.classList.contains(SIGN_FIELD_SIGNED_CLASS)) return null;
  return field;
}

export interface SignatureFill {
  /** PNG data URL for a drawn signature, or plain text for a typed one. */
  type: "draw" | "text";
  data: string;
  /** Optional signer name printed under the line. */
  name?: string;
}

/** Drop a signature into a detected field, keeping the line's width. */
export function fillSignatureField(field: HTMLElement, fill: SignatureFill): void {
  const width = Math.max(120, Math.round(field.getBoundingClientRect().width) || 180);

  field.textContent = "";
  field.classList.add(SIGN_FIELD_SIGNED_CLASS);
  field.setAttribute("title", fill.name ? `Signed by ${fill.name}` : "Signed");
  field.setAttribute("contenteditable", "false");
  field.style.display = "inline-block";
  field.style.minWidth = `${width}px`;
  field.style.textAlign = "center";
  field.style.verticalAlign = "bottom";

  if (fill.type === "draw") {
    const img = document.createElement("img");
    img.src = fill.data;
    img.alt = fill.name ? `Signature of ${fill.name}` : "Signature";
    img.style.cssText = "display:block; height:38px; width:auto; margin:0 auto; pointer-events:none;";
    field.appendChild(img);
  } else {
    const span = document.createElement("span");
    span.textContent = fill.data;
    span.style.cssText =
      "display:block; font-family:'Brush Script MT', cursive; font-size:22px; line-height:38px; color:#111827;";
    field.appendChild(span);
  }

  if (fill.name) {
    const caption = document.createElement("small");
    caption.textContent = fill.name;
    caption.style.cssText =
      "display:block; font-size:9pt; color:#6b7280; border-top:1px solid #9ca3af; margin-top:2px;";
    field.appendChild(caption);
  }
}

/** Count of fields still waiting for a signature. */
export function countOpenSignatureFields(root: HTMLElement | null): number {
  if (!root) return 0;
  return root.querySelectorAll(SIGN_FIELD_SELECTOR).length;
}

/** First unsigned field, scrolled into view. */
export function focusFirstOpenField(root: HTMLElement | null): HTMLElement | null {
  const field = root?.querySelector(SIGN_FIELD_SELECTOR) as HTMLElement | null;
  field?.scrollIntoView({ behavior: "smooth", block: "center" });
  return field ?? null;
}

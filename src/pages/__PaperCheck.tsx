import { useState } from "react";
import PaperDocumentView from "@/components/sign/PaperDocumentView";
import { buildEquityContractHtml, DEFAULT_EQUITY_CONTRACT } from "@/lib/equityContractTemplate";

export default function PaperCheck() {
  const [pages, setPages] = useState(0);
  return (
    <div className="p-6 bg-muted/40">
      <p data-testid="page-count">Pages: {pages}</p>
      <PaperDocumentView html={buildEquityContractHtml(DEFAULT_EQUITY_CONTRACT)} onPageCount={setPages} />
    </div>
  );
}

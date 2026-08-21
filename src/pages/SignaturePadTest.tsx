import { useState } from "react";
import SignaturePad from "@/components/sign/SignaturePad";

export default function SignaturePadTest() {
  const [signature, setSignature] = useState<string | null>(null);
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-xl font-bold">Signature Pad Test</h1>
        <SignaturePad onChange={setSignature} />
        {signature && (
          <div className="space-y-2">
            <p className="text-sm">Signature created:</p>
            <img src={signature} alt="Signature" className="border rounded bg-white" />
          </div>
        )}
      </div>
    </div>
  );
}

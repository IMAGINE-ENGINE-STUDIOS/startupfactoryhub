import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    
    if (!filePath) {
      throw new Error('File path is required');
    }

    console.log('Parsing document:', filePath);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('temp-uploads')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    console.log('File downloaded, size:', fileData.size);

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();
    const fileExtension = filePath.split('.').pop()?.toLowerCase();

    let htmlContent = '';

    // Parse based on file type
    if (fileExtension === 'pdf') {
      htmlContent = await parsePDF(arrayBuffer);
    } else if (fileExtension === 'docx') {
      htmlContent = await parseDOCX(arrayBuffer);
    } else if (fileExtension === 'doc') {
      htmlContent = await parseDOC(arrayBuffer);
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    console.log('Document parsed successfully, content length:', htmlContent.length);

    // Clean up: Delete temporary file
    const { error: deleteError } = await supabase.storage
      .from('temp-uploads')
      .remove([filePath]);

    if (deleteError) {
      console.error('Failed to delete temp file:', deleteError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: htmlContent,
        fileName: filePath.split('/').pop()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-document function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// PDF Parser using pdf-parse (Deno-compatible)
async function parsePDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Use the specific subpath that works in Deno
    const pdfParse = (await import('npm:pdf-parse@1.1.1/lib/pdf-parse.js')).default;
    
    console.log('Parsing PDF with pdf-parse...');
    const data = await pdfParse(arrayBuffer);
    
    if (data.text && data.text.trim().length > 0) {
      console.log('PDF parsed successfully, text length:', data.text.length);
      
      // Convert plain text to HTML with paragraph formatting
      const paragraphs = data.text
        .split(/\n\n+/)
        .map(para => para.trim())
        .filter(para => para.length > 0)
        .map(para => `<p style="margin: 0.5rem 0;">${escapeHtml(para)}</p>`)
        .join('');
      
      return `<div class="pdf-document">${paragraphs}</div>`;
    }
  } catch (err) {
    console.error('PDF parsing failed:', err);
    console.error('Error details:', err.message);
  }
  
  return `
    <div style="padding: 2rem; background: #fef3c7; border-left: 4px solid #f59e0b; margin: 1rem 0; border-radius: 0.5rem;">
      <h3 style="color: #92400e; margin-bottom: 0.5rem; font-weight: bold;">⚠️ Unable to Parse PDF</h3>
      <p style="color: #78350f; margin-bottom: 1rem;">
        This PDF could not be parsed. It may be image-based, scanned, or use an unsupported format.
      </p>
      <p style="color: #78350f;">
        <strong>Tip:</strong> If this is a scanned PDF, try using OCR software to convert it to a searchable PDF first.
      </p>
    </div>
  `;
}

// DOCX Parser using mammoth
async function parseDOCX(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Parsing .docx with mammoth...');
    const mammoth = await import('https://esm.sh/mammoth@1.8.0');
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      { 
        styleMap: [
          "p[style-name='Heading 1'] => h1",
          "p[style-name='Heading 2'] => h2",
          "p[style-name='Heading 3'] => h3",
        ]
      }
    );

    if (result.messages.length > 0) {
      console.log('Mammoth warnings:', result.messages);
    }

    if (result.value && result.value.trim().length > 0) {
      console.log('.docx parsed successfully, content length:', result.value.length);
      return result.value;
    }
  } catch (err) {
    console.error('Mammoth failed for .docx:', err);
  }
  
  return '<p>Unable to parse Word document.</p>';
}

// DOC Parser - legacy format not supported, show clear message
async function parseDOC(arrayBuffer: ArrayBuffer): Promise<string> {
  console.log('Legacy .doc file detected - cannot parse binary format properly');
  
  // .doc files use Microsoft's proprietary binary format (OLE2/Compound File)
  // Parsing them correctly requires Windows COM libraries or complex binary parsers
  // that don't work in Deno edge runtime
  
  // Show clear message to convert to .docx
  return `
    <div style="padding: 2rem; background: #fef3c7; border-left: 4px solid #f59e0b; margin: 1rem 0; border-radius: 0.5rem;">
      <h3 style="color: #92400e; margin-bottom: 0.5rem; font-weight: bold;">⚠️ Legacy .doc Format Not Supported</h3>
      <p style="color: #78350f; margin-bottom: 1rem;">
        Legacy .doc files use a proprietary binary format that cannot be reliably parsed in web environments.
      </p>
      <p style="color: #78350f; margin-bottom: 0.5rem;">
        <strong>Please convert to .docx format:</strong>
      </p>
      <ol style="color: #78350f; padding-left: 1.5rem; margin-bottom: 1rem;">
        <li>Open this file in Microsoft Word</li>
        <li>Click "File" → "Save As"</li>
        <li>Choose "Word Document (.docx)" format</li>
        <li>Upload the converted .docx file here</li>
      </ol>
      <p style="color: #78350f; font-size: 0.875rem;">
        <strong>Why?</strong> Modern .docx files use XML-based format that's easy to parse, while old .doc files use binary format that requires specialized libraries.
      </p>
    </div>
  `;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

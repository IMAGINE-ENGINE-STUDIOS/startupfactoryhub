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

// PDF Parser using pdfjs-dist
async function parsePDF(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import('https://esm.sh/pdfjs-dist@4.0.379');
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = 
    'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs';

  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  let htmlContent = '<div class="pdf-document">';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    htmlContent += `<div class="pdf-page" data-page="${pageNum}">`;
    htmlContent += `<h3 style="font-weight: bold; margin: 1rem 0;">Page ${pageNum}</h3>`;
    
    // Group text items by their vertical position
    const lines: { [key: number]: string[] } = {};
    textContent.items.forEach((item: any) => {
      const y = Math.round(item.transform[5]);
      if (!lines[y]) lines[y] = [];
      lines[y].push(item.str);
    });

    Object.keys(lines).sort((a, b) => Number(b) - Number(a)).forEach(y => {
      const text = lines[Number(y)].join(' ').trim();
      if (text) {
        htmlContent += `<p style="margin: 0.5rem 0;">${escapeHtml(text)}</p>`;
      }
    });

    htmlContent += '</div>';
  }

  htmlContent += '</div>';
  return htmlContent;
}

// DOCX Parser using mammoth
async function parseDOCX(arrayBuffer: ArrayBuffer): Promise<string> {
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

  return result.value || '<p>Word document loaded but no content found.</p>';
}

// DOC Parser with fallback
async function parseDOC(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const mammoth = await import('https://esm.sh/mammoth@1.8.0');
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    if (result.value && result.value.trim().length > 0) {
      return result.value;
    }
  } catch (err) {
    console.error('Mammoth failed for .doc file:', err);
  }

  // Improved fallback: Extract only readable text sequences
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const rawText = decoder.decode(arrayBuffer);
  
  // Extract text sequences (4+ consecutive readable characters)
  const textPattern = /[\x20-\x7E\u00A0-\uFFFF]{4,}/g;
  const textMatches = rawText.match(textPattern) || [];
  
  // Filter out XML metadata and file structure patterns
  const filteredText = textMatches
    .filter(text => {
      // Remove XML metadata
      if (text.includes('<?xml') || text.includes('<ds:') || text.includes('xmlns:')) return false;
      // Remove Office metadata tags
      if (text.includes('FormTemplates') || text.includes('datastoreItem')) return false;
      // Remove file format markers
      if (text.includes('mso-contentType') || text.includes('schemas.microsoft.com')) return false;
      // Remove schema references
      if (text.includes('schemas.openxmlformats.org')) return false;
      // Remove very short fragments (likely noise)
      if (text.trim().length < 10) return false;
      
      return true;
    })
    .map(text => text.trim())
    .filter(text => text.length > 0);
  
  if (filteredText.length > 5) {
    // Join with paragraph breaks
    const htmlContent = filteredText
      .map(text => `<p style="margin: 0.5rem 0;">${escapeHtml(text)}</p>`)
      .join('');
    
    return `<div class="doc-content">${htmlContent}</div>`;
  }

  // If we couldn't extract quality content, show helpful message
  return `
    <div style="padding: 2rem; background: #fef3c7; border-left: 4px solid #f59e0b; margin: 1rem 0; border-radius: 0.5rem;">
      <h3 style="color: #92400e; margin-bottom: 0.5rem; font-weight: bold;">⚠️ Legacy Document Format</h3>
      <p style="color: #78350f; margin-bottom: 1rem;">
        This .doc file uses an older format that's difficult to parse accurately.
      </p>
      <p style="color: #78350f; margin-bottom: 0.5rem;">
        <strong>To edit this document, please:</strong>
      </p>
      <ol style="color: #78350f; padding-left: 1.5rem; margin-bottom: 0;">
        <li>Open the file in Microsoft Word</li>
        <li>Click "File" → "Save As"</li>
        <li>Choose format: "Word Document (.docx)"</li>
        <li>Upload the new .docx file here</li>
      </ol>
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

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

  // Fallback: Extract raw text
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const text = decoder.decode(arrayBuffer);
  
  const cleanText = text
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanText.length > 100) {
    return `<div class="doc-content"><p>${escapeHtml(cleanText)}</p></div>`;
  }

  return '<p>Unable to parse .doc file. Please save as .docx for better compatibility.</p>';
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

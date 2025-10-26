import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { PDFDocument, rgb, StandardFonts } from "https://cdn.skypack.dev/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PDFOperation {
  type: 'add_text' | 'edit_text' | 'add_rectangle' | 'add_circle' | 'delete_content' | 'add_image' | 'fill_form';
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  data?: any; // Legacy support
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get and validate auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    
    // Handle test requests
    if (body.test) {
      console.log('🧪 Test request received from user:', user.id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Edge function is working!',
          timestamp: new Date().toISOString(),
          userId: user.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { sessionId, operations, pdfUrl } = body;
    
    // Validate required fields
    if (!sessionId || !operations || !pdfUrl) {
      throw new Error(`Missing required fields: ${!sessionId ? 'sessionId' : ''} ${!operations ? 'operations' : ''} ${!pdfUrl ? 'pdfUrl' : ''}`);
    }

    console.log('📝 PDF Manipulation Request [' + new Date().toISOString() + ']:', {
      sessionId,
      operationCount: operations?.length || 0,
      pdfUrl: pdfUrl?.substring(0, 50) + '...',
      userId: user.id,
      timestamp: Date.now(),
    });

    // Handle both URL and path formats
    let pdfBytes: ArrayBuffer;
    if (pdfUrl.startsWith('http')) {
      // Legacy: Direct URL
      const pdfResponse = await fetch(pdfUrl);
      pdfBytes = await pdfResponse.arrayBuffer();
    } else {
      // New: Storage path - create signed URL and download
      const { data: signedData, error: signedError } = await supabase.storage
        .from('pdf-documents')
        .createSignedUrl(pdfUrl, 3600); // 1 hour temp access
      
      if (signedError) throw signedError;
      
      const pdfResponse = await fetch(signedData.signedUrl);
      pdfBytes = await pdfResponse.arrayBuffer();
    }
    
    // Load PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Apply operations
    for (const op of operations as PDFOperation[]) {
      const page = pages[op.page];
      
      switch (op.type) {
        case 'add_text': {
          // Support both new format (op.text) and legacy format (op.data.text)
          const text = op.text || op.data?.text || '';
          const fontSize = op.fontSize || op.data?.fontSize || 12;
          const fillColor = op.fill || op.data?.color || '#000000';
          const opacity = op.opacity !== undefined ? op.opacity : (op.data?.opacity !== undefined ? op.data.opacity : 1);
          
          // Choose font based on fontWeight and fontStyle
          let fontType = StandardFonts.Helvetica;
          if (op.fontWeight === 'bold' && op.fontStyle === 'italic') {
            fontType = StandardFonts.HelveticaBoldOblique;
          } else if (op.fontWeight === 'bold') {
            fontType = StandardFonts.HelveticaBold;
          } else if (op.fontStyle === 'italic') {
            fontType = StandardFonts.HelveticaOblique;
          }
          
          const font = await pdfDoc.embedFont(fontType);
          
          // Convert hex color to RGB
          const rgb_color = rgb(
            parseInt(fillColor.slice(1, 3), 16) / 255,
            parseInt(fillColor.slice(3, 5), 16) / 255,
            parseInt(fillColor.slice(5, 7), 16) / 255
          );
          
          page.drawText(text, {
            x: op.x,
            y: op.y, // Already converted from Fabric to PDF coordinates
            size: fontSize,
            font: font,
            color: rgb_color,
            opacity: opacity,
          });
          break;
        }
        
        case 'add_rectangle': {
          // Support both new format and legacy format
          const width = op.width || op.data?.width || 100;
          const height = op.height || op.data?.height || 100;
          const fillColor = op.fill || op.data?.color || '#000000';
          const strokeColor = op.stroke || op.data?.borderColor || '#000000';
          const strokeWidth = op.strokeWidth !== undefined ? op.strokeWidth : (op.data?.borderWidth || 0);
          const opacity = op.opacity !== undefined ? op.opacity : (op.data?.opacity !== undefined ? op.data.opacity : 1);
          
          const fill_rgb = rgb(
            parseInt(fillColor.slice(1, 3), 16) / 255,
            parseInt(fillColor.slice(3, 5), 16) / 255,
            parseInt(fillColor.slice(5, 7), 16) / 255
          );
          
          page.drawRectangle({
            x: op.x,
            y: op.y - height, // Adjust Y for bottom-left origin
            width: width,
            height: height,
            color: fill_rgb,
            opacity: opacity,
            borderWidth: strokeWidth,
            borderColor: strokeWidth > 0 ? rgb(
              parseInt(strokeColor.slice(1, 3), 16) / 255,
              parseInt(strokeColor.slice(3, 5), 16) / 255,
              parseInt(strokeColor.slice(5, 7), 16) / 255
            ) : undefined,
          });
          break;
        }
        
        case 'add_circle': {
          // Support both new format and legacy format
          const radius = op.radius || op.data?.radius || 50;
          const fillColor = op.fill || op.data?.color || '#000000';
          const strokeColor = op.stroke || op.data?.borderColor || '#000000';
          const strokeWidth = op.strokeWidth !== undefined ? op.strokeWidth : (op.data?.borderWidth || 0);
          const opacity = op.opacity !== undefined ? op.opacity : (op.data?.opacity !== undefined ? op.data.opacity : 1);
          
          const fill_rgb = rgb(
            parseInt(fillColor.slice(1, 3), 16) / 255,
            parseInt(fillColor.slice(3, 5), 16) / 255,
            parseInt(fillColor.slice(5, 7), 16) / 255
          );
          
          page.drawCircle({
            x: op.x + radius, // Adjust for center
            y: op.y - radius, // Adjust for center and bottom-left origin
            size: radius,
            color: fill_rgb,
            opacity: opacity,
            borderWidth: strokeWidth,
            borderColor: strokeWidth > 0 ? rgb(
              parseInt(strokeColor.slice(1, 3), 16) / 255,
              parseInt(strokeColor.slice(3, 5), 16) / 255,
              parseInt(strokeColor.slice(5, 7), 16) / 255
            ) : undefined,
          });
          break;
        }
        
        case 'add_image': {
          const { imageUrl, width, height } = op.data;
          const imageResponse = await fetch(imageUrl);
          const imageBytes = await imageResponse.arrayBuffer();
          
          let embeddedImage;
          if (imageUrl.endsWith('.png')) {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
          } else {
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
          }
          
          page.drawImage(embeddedImage, {
            x: op.x,
            y: page.getHeight() - op.y - height,
            width,
            height,
          });
          break;
        }
        
        case 'edit_text': {
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const { text, fontSize = 12, color = { r: 0, g: 0, b: 0 }, oldText, width, height } = op.data;
          
          // Delete old text by drawing white rectangle
          if (width && height) {
            page.drawRectangle({
              x: op.x,
              y: page.getHeight() - op.y - height,
              width,
              height,
              color: rgb(1, 1, 1),
            });
          }
          
          // Draw new text
          page.drawText(text, {
            x: op.x,
            y: page.getHeight() - op.y,
            size: fontSize,
            font,
            color: rgb(color.r, color.g, color.b),
          });
          break;
        }
        
        case 'delete_content': {
          // For delete, we draw a white rectangle over the area
          const { width, height } = op.data;
          page.drawRectangle({
            x: op.x,
            y: page.getHeight() - op.y - height,
            width,
            height,
            color: rgb(1, 1, 1),
          });
          break;
        }
        
        case 'fill_form': {
          const { fieldName, fieldValue } = op.data;
          const form = pdfDoc.getForm();
          
          try {
            const field = form.getTextField(fieldName);
            field.setText(fieldValue);
          } catch (e) {
            try {
              const checkbox = form.getCheckBox(fieldName);
              if (fieldValue === 'true') {
                checkbox.check();
              } else {
                checkbox.uncheck();
              }
            } catch (err) {
              console.warn(`Field ${fieldName} not found or unsupported type`);
            }
          }
          break;
        }
      }
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    // Upload to storage - CRITICAL: Must use user.id to match RLS policy at folder index [2]
    const fileName = `pdf-sessions/${user.id}/${Date.now()}.pdf`;
    console.log('📤 Uploading to:', fileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pdf-documents')
      .upload(fileName, modifiedPdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw uploadError;
    }
    console.log('✅ Upload successful:', uploadData);

    // Create signed URL (7 days expiry for edited PDFs)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('pdf-documents')
      .createSignedUrl(fileName, 604800); // 7 days

    if (signedError) {
      console.error('Signed URL error:', signedError);
      throw signedError;
    }
    
    const signedUrl = signedData.signedUrl;

    // Update session with new version (store path, not URL)
    const { error: updateError } = await supabase
      .from('pdf_editing_sessions')
      .update({ current_version_url: fileName })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    // Save operations to history
    const { error: historyError } = await supabase
      .from('pdf_operation_history')
      .insert(operations.map((op: PDFOperation, index: number) => ({
        session_id: sessionId,
        user_id: user.id,
        operation_type: op.type,
        operation_data: op,
        version_number: index + 1,
      })));

    if (historyError) {
      console.error('History error:', historyError);
    }

    console.log('✅ PDF saved successfully:', {
      fileName,
      operationsApplied: operations.length,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        path: fileName,
        url: signedUrl, // Return signed URL for download
        message: `Applied ${operations.length} operations successfully` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

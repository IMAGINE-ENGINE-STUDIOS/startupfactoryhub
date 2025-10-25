import { supabase } from '@/integrations/supabase/client';

export async function uploadImageToStorage(file: File): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Generate unique filename
  const fileName = `pdf-images/${Date.now()}_${file.name}`;
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('pdf-documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Image upload error:', error);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('pdf-documents')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function compressImage(file: File, maxWidth: number = 1024): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name, { type: file.type }));
        } else {
          reject(new Error('Image compression failed'));
        }
      }, file.type, 0.85);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

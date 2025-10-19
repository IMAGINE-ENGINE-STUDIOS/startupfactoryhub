import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - The HTML content to sanitize
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'span', 'div', 'mark'
    ],
    ALLOWED_ATTR: ['href', 'style', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitizes user input for search queries
 * @param input - The search query
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(input: string): string {
  return input
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .trim()
    .slice(0, 200); // Limit length
}

/**
 * Validates and sanitizes URL
 * @param url - The URL to validate
 * @returns Valid URL or null
 */
export function sanitizeURL(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validates file type and size
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns Error message or null if valid
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSize: number
): string | null {
  if (!allowedTypes.includes(file.type)) {
    return `Invalid file type. Allowed: ${allowedTypes.join(', ')}`;
  }
  
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return `File size must be less than ${maxMB}MB`;
  }
  
  return null;
}

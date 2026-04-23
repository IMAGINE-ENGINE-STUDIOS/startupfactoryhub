import { z } from 'zod';

// Auth validation schemas
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
});

export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  fullName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  role: z.enum(['startup', 'advisor', 'investor', 'student', 'mentor', 'accelerator', 'member'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
});

// Message validation
export const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message must be less than 5000 characters'),
  receiver_id: z.string().uuid('Invalid receiver ID'),
});

// Post validation
export const postSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Post content cannot be empty')
    .max(5000, 'Post must be less than 5000 characters'),
  post_type: z.enum(['update', 'milestone', 'question', 'resource', 'internship']),
  media_urls: z.array(z.string().url('Invalid media URL')).optional(),
});

// Comment validation
export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters'),
  post_id: z.string().uuid('Invalid post ID'),
});

// Profile validation
export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  bio: z
    .string()
    .trim()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  location: z
    .string()
    .trim()
    .max(100, 'Location must be less than 100 characters')
    .optional(),
  website: z
    .string()
    .trim()
    .url('Invalid website URL')
    .max(255, 'Website URL must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  linkedin_url: z
    .string()
    .trim()
    .url('Invalid LinkedIn URL')
    .max(255, 'LinkedIn URL must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  twitter_url: z
    .string()
    .trim()
    .url('Invalid Twitter URL')
    .max(255, 'Twitter URL must be less than 255 characters')
    .optional()
    .or(z.literal('')),
});

// Company validation
export const companySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  industry: z
    .string()
    .trim()
    .min(2, 'Industry is required')
    .max(100, 'Industry must be less than 100 characters'),
  website: z
    .string()
    .trim()
    .url('Invalid website URL')
    .max(255, 'Website URL must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .trim()
    .max(100, 'Location must be less than 100 characters')
    .optional(),
});

// Event validation
export const eventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Event title must be at least 3 characters')
    .max(200, 'Event title must be less than 200 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  start_date: z.date({
    required_error: 'Start date is required',
    invalid_type_error: 'Invalid start date',
  }),
  end_date: z.date({
    required_error: 'End date is required',
    invalid_type_error: 'Invalid end date',
  }),
  location: z
    .string()
    .trim()
    .max(200, 'Location must be less than 200 characters')
    .optional(),
}).refine(
  (data) => data.end_date >= data.start_date,
  {
    message: 'End date must be after start date',
    path: ['end_date'],
  }
);

// Search query validation
export const searchQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, 'Search query cannot be empty')
    .max(200, 'Search query must be less than 200 characters'),
});

// Helper function to sanitize HTML/XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Helper function to encode for URLs
export const encodeForUrl = (input: string): string => {
  return encodeURIComponent(input);
};

// Type exports
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

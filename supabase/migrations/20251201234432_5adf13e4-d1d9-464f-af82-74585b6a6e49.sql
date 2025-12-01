-- Add contact emails to Nasdaq resource
UPDATE resources 
SET 
  contact_email = 'media@theCenter.nasdaq.org',
  description = CONCAT(
    COALESCE(description, 'The NASDAQ Entrepreneurial Center empowers entrepreneurs and startup businesses through mentorship, education, markets, and technology.'),
    E'\n\n**Contact Information:**\n',
    '📧 Media Inquiries: media@theCenter.nasdaq.org\n',
    '🤝 Partnership Opportunities: partners@theCenter.nasdaq.org\n',
    '📅 Event Inquiries: events@theCenter.nasdaq.org'
  )
WHERE title = 'Nasdaq Interns Match';
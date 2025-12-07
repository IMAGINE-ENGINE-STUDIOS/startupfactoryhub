import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsArticle {
  title: string;
  text: string;
  url: string;
  site: string;
  published: string;
  author: string;
  language: string;
  category: string;
  image?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category, size = 10 } = await req.json();
    const WEBZ_TOKEN = Deno.env.get('WEBZ_API_TOKEN');
    
    if (!WEBZ_TOKEN) {
      console.error('WEBZ_API_TOKEN not configured');
      throw new Error('News API not configured');
    }

    console.log(`Fetching news for query: ${query}, category: ${category}`);

    // Build search query based on category
    let searchQuery = query || 'startup technology venture capital';
    if (category && category !== 'all') {
      const categoryQueries: Record<string, string> = {
        startups: 'startup OR "venture capital" OR "seed funding" OR "series A"',
        fintech: 'fintech OR "digital banking" OR cryptocurrency OR blockchain',
        ai: '"artificial intelligence" OR "machine learning" OR "AI startup"',
        healthtech: 'healthtech OR "digital health" OR biotech OR "medical technology"',
        climate: 'climatetech OR "clean energy" OR sustainability OR "green technology"',
        enterprise: 'enterprise OR SaaS OR "B2B" OR "business software"',
      };
      searchQuery = categoryQueries[category] || searchQuery;
    }

    // Build Webz.io API URL
    const encodedQuery = encodeURIComponent(`site_type:(news OR blogs) is_first:true ${searchQuery}`);
    const apiUrl = `https://api.webz.io/filterWebContent?token=${WEBZ_TOKEN}&q=${encodedQuery}&format=json&size=${size}&sort=crawled`;

    console.log('Calling Webz.io API...');
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error(`Webz.io API error: ${response.status}`);
      throw new Error(`News API returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`Received ${data.posts?.length || 0} articles`);

    // Transform and return articles
    const articles: NewsArticle[] = data.posts?.map((post: any) => ({
      title: post.title || 'Untitled',
      text: post.text?.substring(0, 300) + (post.text?.length > 300 ? '...' : '') || '',
      url: post.url,
      site: post.site || new URL(post.url).hostname,
      published: post.published,
      author: post.author || 'Unknown',
      language: post.language || 'en',
      category: category || 'general',
      image: post.thread?.main_image || null,
    })) || [];

    return new Response(
      JSON.stringify({ 
        articles, 
        total: data.totalResults || 0,
        requestsLeft: data.requestsLeft 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error fetching news:', error);
    return new Response(
      JSON.stringify({ error: error.message, articles: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

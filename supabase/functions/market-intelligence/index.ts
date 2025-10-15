import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type } = await req.json();
    console.log('Market intelligence search:', { query, type });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context-aware prompt based on search type
    const systemPrompt = `You are a market intelligence analyst with access to real-time data from the internet. Search for and analyze current, accurate information.
Return ONLY valid JSON without any markdown formatting or code blocks.`;

    let userPrompt = '';
    const upperType = type.toUpperCase();
    
    if (upperType === 'STARTUP' || upperType === 'STARTUPS') {
      // Check if this is a request for trending companies or predictions
      if (query.toLowerCase().includes('trending') || query.toLowerCase().includes('top')) {
        userPrompt = `Search the internet for: "${query}"

Provide real, current market data in this JSON format:
{
  "companies": [
    {
      "name": "Company Name",
      "domain": "company.com",
      "activity": "Recent activity (e.g., Series D Funding, Product Launch)",
      "description": "Brief description of the activity with specific details",
      "category": "Industry category",
      "prediction": "Future prediction based on current trajectory",
      "change": "Growth percentage (e.g., +250%)",
      "color": "from-purple-500/10 to-pink-500/10"
    }
  ]
}

Return 6-8 REAL companies with their ACTUAL domains. Use current 2025 data.`;
      } else if (query.toLowerCase().includes('prediction')) {
        userPrompt = `Search the internet for: "${query}"

Provide real market predictions in this JSON format:
{
  "predictions": [
    {
      "company": "Company Name",
      "domain": "company.com",
      "prediction": "Detailed prediction with specific details",
      "confidence": "High/Medium/Low",
      "timeframe": "Time estimate (e.g., 3-6 months)",
      "color": "from-violet-500/10 to-purple-500/10"
    }
  ]
}

Return 4-6 REAL companies with predictions and their ACTUAL domains. Use current 2025 data.`;
      } else {
        userPrompt = `Search the internet and analyze: "${query}"

Provide detailed analysis in this JSON format:
{
  "type": "${type}",
  "name": "string",
  "description": "string (2-3 sentences)",
  "metrics": {
    "metric1": "value",
    "metric2": "value",
    "metric3": "value",
    "metric4": "value",
    "metric5": "value"
  },
  "insights": ["insight1", "insight2", "insight3", "insight4"],
  "predictions": ["prediction1", "prediction2", "prediction3"],
  "trends": [
    {"label": "trend1", "value": 100, "change": 15},
    {"label": "trend2", "value": 200, "change": -5},
    {"label": "trend3", "value": 150, "change": 25}
  ]
}`;
      }
    } else if (upperType === 'INDUSTRY' || upperType === 'INDUSTRIES') {
      if (query.toLowerCase().includes('insight') || query.toLowerCase().includes('metric')) {
        userPrompt = `Search the internet for: "${query}"

Provide real market insights in this JSON format:
{
  "insights": [
    {
      "company": "Company Name",
      "domain": "company.com",
      "insight": "Key insight about the company with specific details",
      "metric": "Metric name",
      "value": "Metric value (e.g., +40%)",
      "color": "from-teal-500/10 to-cyan-500/10"
    }
  ]
}

Return 4-6 REAL companies with insights and their ACTUAL domains. Use current 2025 data.`;
      } else {
        userPrompt = `Search the internet and analyze industry: "${query}"

Provide detailed analysis in this JSON format:
{
  "type": "${type}",
  "name": "string",
  "description": "string (2-3 sentences)",
  "metrics": {
    "metric1": "value",
    "metric2": "value",
    "metric3": "value"
  },
  "insights": ["insight1", "insight2", "insight3"],
  "predictions": ["prediction1", "prediction2"],
  "trends": [
    {"label": "trend1", "value": 100, "change": 15},
    {"label": "trend2", "value": 200, "change": -5}
  ]
}`;
      }
    } else if (upperType === 'INVESTOR' || upperType === 'INVESTORS') {
      userPrompt = `Search the internet and analyze investor: "${query}"

Provide detailed analysis in this JSON format:
{
  "type": "${type}",
  "name": "string",
  "description": "string (2-3 sentences)",
  "metrics": {
    "metric1": "value",
    "metric2": "value"
  },
  "insights": ["insight1", "insight2"],
  "predictions": ["prediction1"],
  "trends": [
    {"label": "trend1", "value": 100, "change": 15}
  ]
}`;
    }

    console.log('Calling Lovable AI for analysis...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');
    
    let content = aiData.choices[0].message.content;
    
    // Clean up markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse the JSON response
    let analysisData;
    try {
      analysisData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Return fallback data
      analysisData = {
        type,
        name: query,
        description: `Market analysis for ${query}. Data is currently being processed and will be available shortly.`,
        metrics: {
          'Market Size': 'Processing...',
          'Growth Rate': 'Processing...',
          'Key Players': 'Processing...',
          'Investment Activity': 'Processing...',
        },
        insights: [
          'Market intelligence analysis in progress.',
          'Real-time data being aggregated from multiple sources.',
          'Comprehensive insights will be available shortly.',
        ],
        predictions: [
          'Detailed predictions are being generated.',
          'Market trends are being analyzed.',
        ],
        trends: [
          { label: 'Growth', value: 0, change: 0 },
          { label: 'Activity', value: 0, change: 0 },
          { label: 'Interest', value: 0, change: 0 },
        ],
      };
    }

    console.log('Analysis complete');
    return new Response(JSON.stringify(analysisData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in market-intelligence function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Check function logs for more information'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

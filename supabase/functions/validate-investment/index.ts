import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, investmentAmount, investmentRound } = await req.json();

    console.log('Validating investment:', { companyName, investmentAmount, investmentRound });

    // Check if Crunchbase API key is configured
    const crunchbaseApiKey = Deno.env.get('CRUNCHBASE_API_KEY');
    
    if (!crunchbaseApiKey) {
      console.log('Crunchbase API key not configured');
      return new Response(
        JSON.stringify({
          verified: false,
          message: 'External verification service not configured. Please add CRUNCHBASE_API_KEY to enable verification.',
          data: null
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Search for company in Crunchbase
    const searchUrl = `https://api.crunchbase.com/api/v4/autocompletes?query=${encodeURIComponent(companyName)}&collection_ids=organizations&limit=5`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'X-cb-user-key': crunchbaseApiKey
      }
    });

    if (!searchResponse.ok) {
      console.error('Crunchbase search failed:', searchResponse.status);
      return new Response(
        JSON.stringify({
          verified: false,
          message: 'External API request failed. Investment recorded as unverified.',
          data: null
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    const searchData = await searchResponse.json();
    const entities = searchData.entities || [];

    if (entities.length === 0) {
      return new Response(
        JSON.stringify({
          verified: false,
          message: 'Company not found in Crunchbase database.',
          data: null
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Find best match
    const bestMatch = entities.find(
      (e: any) => e.identifier.value.toLowerCase() === companyName.toLowerCase()
    ) || entities[0];

    // Get detailed company info including funding rounds
    const companyPermalink = bestMatch.identifier.permalink;
    const detailUrl = `https://api.crunchbase.com/api/v4/entities/organizations/${companyPermalink}?field_ids=funding_total,last_funding_type,num_funding_rounds,short_description,categories`;
    
    const detailResponse = await fetch(detailUrl, {
      headers: {
        'X-cb-user-key': crunchbaseApiKey
      }
    });

    let companyDetails = null;
    if (detailResponse.ok) {
      const detailData = await detailResponse.json();
      companyDetails = detailData.properties;
    }

    // Basic verification logic
    // In a real implementation, you'd compare funding rounds, amounts, etc.
    const verified = bestMatch !== null;

    return new Response(
      JSON.stringify({
        verified,
        message: verified 
          ? 'Company found in Crunchbase. Investment data can be cross-referenced.' 
          : 'Could not verify company data.',
        data: {
          matchedCompany: bestMatch.identifier.value,
          permalink: companyPermalink,
          fundingTotal: companyDetails?.funding_total?.value_usd || null,
          lastFundingType: companyDetails?.last_funding_type || null,
          description: companyDetails?.short_description || null,
          categories: companyDetails?.categories?.map((c: any) => c.value) || []
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in validate-investment:', error);
    return new Response(
      JSON.stringify({
        verified: false,
        message: 'Verification service encountered an error.',
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});

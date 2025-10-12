import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dataType, industry } = await req.json();

    let result;

    switch (dataType) {
      case "census":
        result = await fetchCensusData(industry);
        break;
      case "bea":
        result = await fetchBEAData(industry);
        break;
      case "sec":
        result = await fetchSECData(industry);
        break;
      default:
        throw new Error("Invalid data type");
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Government data error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function fetchCensusData(industry: string) {
  // US Census Bureau Business Patterns API
  // https://www.census.gov/data/developers/data-sets/cbp-nonemp-zbp.html
  try {
    const response = await fetch(
      `https://api.census.gov/data/2021/cbp?get=ESTAB,EMP,PAYANN&for=us:*&NAICS2017=${getIndustryNAICS(industry)}`
    );
    
    if (!response.ok) {
      return { error: "Census data unavailable", establishments: "N/A", employees: "N/A" };
    }

    const data = await response.json();
    
    return {
      source: "US Census Bureau - County Business Patterns",
      establishments: data[1]?.[0] || "N/A",
      employees: data[1]?.[1] || "N/A",
      annual_payroll: data[1]?.[2] || "N/A",
      industry_code: getIndustryNAICS(industry),
    };
  } catch (error) {
    console.error("Census API error:", error);
    return { error: "Census data fetch failed" };
  }
}

async function fetchBEAData(industry: string) {
  // Bureau of Economic Analysis - GDP by Industry
  // Note: BEA requires API key registration at https://apps.bea.gov/api/signup/
  try {
    const BEA_API_KEY = Deno.env.get("BEA_API_KEY");
    
    if (!BEA_API_KEY) {
      return {
        message: "BEA API key not configured",
        note: "Register for free at https://apps.bea.gov/api/signup/",
      };
    }

    const response = await fetch(
      `https://apps.bea.gov/api/data/?UserID=${BEA_API_KEY}&method=GetData&datasetname=GDPbyIndustry&TableName=ALL&Frequency=A&Year=LAST5&ResultFormat=JSON`
    );
    
    if (!response.ok) {
      return { error: "BEA data unavailable" };
    }

    const data = await response.json();
    
    return {
      source: "Bureau of Economic Analysis - GDP by Industry",
      data: data.BEAAPI?.Results?.Data || [],
      industry: industry,
    };
  } catch (error) {
    console.error("BEA API error:", error);
    return { error: "BEA data fetch failed" };
  }
}

async function fetchSECData(industry: string) {
  // SEC EDGAR API - Company filings
  // https://www.sec.gov/edgar/sec-api-documentation
  try {
    const response = await fetch(
      `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&SIC=${getIndustrySIC(industry)}&owner=exclude&count=10&output=json`,
      {
        headers: {
          "User-Agent": "Startup Analytics Platform (contact@example.com)",
        },
      }
    );
    
    if (!response.ok) {
      return { error: "SEC data unavailable" };
    }

    const data = await response.json();
    
    return {
      source: "SEC EDGAR Database",
      sic_code: getIndustrySIC(industry),
      companies: data.companies || [],
      industry: industry,
    };
  } catch (error) {
    console.error("SEC API error:", error);
    return { error: "SEC data fetch failed" };
  }
}

function getIndustryNAICS(industry: string): string {
  // Map common industries to NAICS codes
  const naicsMap: Record<string, string> = {
    "Technology": "51",
    "FinTech": "52",
    "Healthcare": "62",
    "E-commerce": "45",
    "SaaS": "51",
    "AI/ML": "51",
    "Biotech": "54171",
    "CleanTech": "22",
    "EdTech": "61",
    "Retail": "44-45",
  };
  
  return naicsMap[industry] || "51"; // Default to Information sector
}

function getIndustrySIC(industry: string): string {
  // Map common industries to SIC codes
  const sicMap: Record<string, string> = {
    "Technology": "7370",
    "FinTech": "6200",
    "Healthcare": "8000",
    "E-commerce": "5961",
    "SaaS": "7372",
    "AI/ML": "7373",
    "Biotech": "2836",
    "CleanTech": "4911",
    "EdTech": "8200",
    "Retail": "5200",
  };
  
  return sicMap[industry] || "7370"; // Default to Computer Programming
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEMO_PASSWORD = "Demo123!";

const demoAccounts = [
  {
    email: "demo-startup@startupfactoryhub.com",
    role: "startup",
    fullName: "Demo Startup User",
    companyName: "Demo Tech Inc"
  },
  {
    email: "demo-investor@startupfactoryhub.com",
    role: "investor",
    fullName: "Demo Investor User"
  },
  {
    email: "demo-mentor@startupfactoryhub.com",
    role: "mentor",
    fullName: "Demo Mentor User"
  },
  {
    email: "demo-advisor@startupfactoryhub.com",
    role: "advisor",
    fullName: "Demo Advisor User"
  },
  {
    email: "demo-student@startupfactoryhub.com",
    role: "student",
    fullName: "Demo Student User"
  },
  {
    email: "demo-accelerator@startupfactoryhub.com",
    role: "accelerator",
    fullName: "Demo Accelerator User",
    organizationName: "Demo Accelerator Program"
  },
  {
    email: "demo-admin@startupfactoryhub.com",
    role: "admin",
    fullName: "Demo Admin User"
  },
  {
    email: "fosstheory@gmail.com",
    role: "admin",
    fullName: "Ricardo Font",
    customPassword: "12345678"
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results: any[] = [];

    for (const account of demoAccounts) {
      try {
        // Check if user already exists by listing with larger page
        const { data: existingUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existingUser = existingUsers?.users?.find(u => u.email === account.email);

        if (existingUser) {
          // Update password for existing user
          const pw = account.customPassword || DEMO_PASSWORD;
          await supabase.auth.admin.updateUserById(existingUser.id, {
            password: pw
          });
          results.push({ email: account.email, status: "updated", role: account.role });
          continue;
        }

        const pw = account.customPassword || DEMO_PASSWORD;
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: account.email,
          password: pw,
          email_confirm: true,
          user_metadata: {
            full_name: account.fullName,
            role: account.role
          }
        });

        if (authError) {
          results.push({ email: account.email, status: "error", error: authError.message });
          continue;
        }

        const userId = authData.user.id;

        // Create profile
        await supabase.from("profiles").upsert({
          user_id: userId,
          email: account.email,
          full_name: account.fullName,
          bio: `Demo ${account.role} account for platform exploration`
        });

        // Assign role
        await supabase.from("user_roles").upsert({
          user_id: userId,
          role: account.role
        }, { onConflict: "user_id,role" });

        // Create role-specific profile if needed
        if (account.role === "investor") {
          await supabase.from("investor_profiles").upsert({
            user_id: userId,
            investment_focus: ["Technology", "Healthcare"],
            preferred_stages: ["seed", "series_a"]
          }, { onConflict: "user_id" });
        } else if (account.role === "mentor") {
          await supabase.from("mentor_profiles").upsert({
            user_id: userId,
            expertise_areas: ["Business Strategy", "Product Development"],
            years_of_experience: 10
          }, { onConflict: "user_id" });
        } else if (account.role === "accelerator") {
          await supabase.from("accelerator_profiles").upsert({
            user_id: userId,
            organization_name: account.organizationName || "Demo Accelerator",
            description: "Demo accelerator program for platform exploration",
            program_duration: "3 months",
            funding_offered: 50000,
            equity_percentage: 5
          }, { onConflict: "user_id" });
        } else if (account.role === "startup") {
          await supabase.from("companies").upsert({
            user_id: userId,
            name: account.companyName || "Demo Startup",
            description: "Demo startup company for platform exploration",
            industry: "Technology",
            stage: "seed"
          }, { onConflict: "user_id" });
        }

        results.push({ email: account.email, status: "created", role: account.role });
      } catch (err) {
        results.push({ email: account.email, status: "error", error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demo accounts processed",
        password: DEMO_PASSWORD,
        accounts: results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

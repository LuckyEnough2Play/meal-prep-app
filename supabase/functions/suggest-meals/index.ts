import { serve } from "https://deno.land/std@0.165.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { matchRecipes } from "./helpers.ts";

interface SuggestRequest {
  user_id: string;
  deals: Array<{ item: string; price: number }>;
  profile: {
    diet?: string;
    allergies?: string;
    budget: number;
    portionSize: number;
  };
}

// Initialize Supabase client (Edge runtime provides environment)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    const { user_id, deals, profile } = (await req.json()) as SuggestRequest;

    // Load recipes from Supabase
    const { data: recipes, error } = await supabase
      .from("recipes")
      .select("*");
    if (error) throw error;

    // Match and score recipes based on deals & profile
    const plan = matchRecipes(recipes, deals, profile);

    return new Response(JSON.stringify({ plan }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

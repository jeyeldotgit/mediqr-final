import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load .env file from server directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
// Use service role key for backend operations (bypasses RLS)
// IMPORTANT: Must use the actual service_role key, not the anon key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  const missing = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!supabaseServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}\n\n` +
      "Please create a .env file in the server directory with the following:\n" +
      "SUPABASE_URL=https://your-project.supabase.co\n" +
      "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n\n" +
      "You can find these values in your Supabase dashboard:\n" +
      "1. Go to https://app.supabase.com\n" +
      "2. Select your project\n" +
      "3. Go to Settings → API\n" +
      "4. Copy the Project URL and service_role key\n\n" +
      "See .env.example for a template."
  );
}

// Warn if using anon key (which won't bypass RLS)
if (supabaseServiceKey.includes("anon") || supabaseServiceKey.includes("eyJ")) {
  console.warn(
    "WARNING: It looks like you might be using an anon key instead of the service role key. " +
      "The service role key should start with 'eyJ' but should be different from the anon key. " +
      "Check your SUPABASE_SERVICE_ROLE_KEY environment variable."
  );
}

// Create client with service role key - this bypasses RLS
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-client-info": "mediqr-server",
      },
    },
  }
);

export const testConnection = async () => {
  // Test connection by checking if we can query profiles table
  const { error } = await supabase.from("profiles").select("id").limit(1);
  if (error) {
    console.warn("Connection test warning:", error.message);
    // Don't throw - table might not exist yet
  } else {
    console.log("Connection to Supabase OK");
  }
};

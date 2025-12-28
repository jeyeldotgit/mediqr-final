import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableDefaultKey =
  process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabasePublishableDefaultKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_PUBLISHABLE_DEFAULT_KEY must be set in the environment variables"
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableDefaultKey
);

export const testConnection = async () => {
  const { data, error } = await supabase.from("instruments").select("*");
  if (error) {
    throw new Error("Failed to test connection to Supabase");
  }
  console.log("Connection to Supabase OK");
};

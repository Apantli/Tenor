import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };

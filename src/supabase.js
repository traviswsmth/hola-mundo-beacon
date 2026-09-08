try { process.loadEnvFile(); } catch {}
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[Supabase] Cliente inicializado:', supabaseUrl);
} else {
  console.warn('[Supabase] WARN: SUPABASE_URL o SUPABASE_ANON_KEY no configurados. El logging quedará deshabilitado (modo mock).');
  console.warn('         Crea un archivo .env basado en .env.example');
}

module.exports = supabase;

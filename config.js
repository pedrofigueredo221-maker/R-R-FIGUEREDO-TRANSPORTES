
/* Supabase - R&R Figueredo Transportes */

window.SUPABASE_URL =
  "https://feevzqkqruyzoskowxrw.supabase.co";

window.SUPABASE_ANON_KEY =
  "sb_publishable_jXoGdEwcHd2VYaca2nPKKg_4_OUztoN";

if (!window.supabase) {
  throw new Error(
    "A biblioteca JavaScript do Supabase não foi carregada."
  );
}

window.supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

console.info("Configuração do Supabase carregada.");

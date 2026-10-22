/* Compatibilidade com verificações e páginas antigas.
   A configuração oficial está em banco-de-dados/supabase/config.js. */
if (typeof window !== "undefined" && !window.APP_CONFIG && typeof document !== "undefined") {
  document.write('<script src="banco-de-dados/supabase/config.js?v=13"><\\/script>');
}

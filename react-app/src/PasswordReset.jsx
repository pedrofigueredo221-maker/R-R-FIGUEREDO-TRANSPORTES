import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const config = window.APP_CONFIG || {};
const supabase = config.SUPABASE_URL && config.SUPABASE_ANON_KEY
  ? createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export default function PasswordReset() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Validando o link de recuperação…");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;

    async function initialize() {
      if (!supabase) throw new Error("Configuração do Supabase não encontrada.");

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const type = url.searchParams.get("type");
      const hash = new URLSearchParams(window.location.hash.slice(1));

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
      } else if (hash.get("error_description")) {
        throw new Error(hash.get("error_description").replace(/\+/g, " "));
      } else if (hash.get("access_token") && hash.get("refresh_token")) {
        const { error } = await supabase.auth.setSession({
          access_token: hash.get("access_token"),
          refresh_token: hash.get("refresh_token")
        });
        if (error) throw error;
      }

      if (type && type !== "recovery") {
        throw new Error("Este link não é de recuperação de senha.");
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session) {
        throw new Error("Link inválido ou expirado. Solicite um novo e-mail de recuperação.");
      }

      if (active) {
        setReady(true);
        setMessage("Link validado. Escolha sua nova senha.");
      }
    }

    initialize().catch((error) => {
      if (active) {
        setReady(false);
        setMessage(error?.message || "Não foi possível validar o link.");
      }
    });

    return () => { active = false; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!ready || !supabase) return;

    if (password.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setBusy(true);
    setMessage("Salvando nova senha...");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSaved(true);
      setReady(false);
      setMessage("Senha alterada com sucesso. Você já pode voltar ao login.");
    } catch (error) {
      setMessage(error?.message || "Não foi possível salvar a nova senha.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card reset-card">
        <img className="login-logo" src="./imagens/logo-rr-figueredo-transportes.png" alt="R&R Figueredo Transportes" />
        <p className="eyebrow">SEGURANÇA DA CONTA</p>
        <h1>Definir nova senha</h1>
        <p className="muted">Cadastre uma nova senha para acessar o sistema R&R Figueredo Transportes.</p>
        <p className={ready || saved ? "reset-message" : "error-message"} role="status" aria-live="polite">{message}</p>
        {!saved && ready && (
          <form onSubmit={submit}>
            <label htmlFor="new-password">Nova senha</label>
            <input id="new-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} />
            <label htmlFor="confirm-password">Confirme a nova senha</label>
            <input id="confirm-password" type="password" autoComplete="new-password" minLength={6} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            <button className="primary-button login-submit" type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar nova senha"}</button>
          </form>
        )}
        <a className="reset-back-link" href="./index.html">Voltar ao login</a>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  LayoutDashboard,
  CreditCard,
  Target,
  LineChart,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const FEATURES = [
  { icon: LayoutDashboard, text: "Dashboard com fluxo de caixa dos últimos 6 meses" },
  { icon: CreditCard, text: "Controle de faturas e parcelamentos automático" },
  { icon: Target, text: "Metas financeiras com progresso visual" },
  { icon: LineChart, text: "Carteira de investimentos com rentabilidade estimada" },
];

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 48 48" width="16" height="16" {...props}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 34.9 27 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C39.9 37.5 44 31.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithPassword, signUp, signInWithGoogle, resetPassword } = useAuth();

  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!email || !password) return;
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signInWithPassword(email, password);
        if (error) throw error;
        router.replace("/dashboard");
      } else {
        const { error, data } = await signUp(email, password);
        if (error) throw error;
        if (data?.session) {
          router.replace("/dashboard");
        } else {
          setNotice("Conta criada! Confira seu e-mail para confirmar o cadastro antes de entrar.");
          setMode("signin");
        }
      }
    } catch (err) {
      setError(traduzErro(err?.message));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setNotice("");
    setGoogleBusy(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // O Supabase redireciona a página para o Google; se cair aqui é porque falhou.
    } catch (err) {
      setError(traduzErro(err?.message));
      setGoogleBusy(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setNotice("");
    if (!email) {
      setError("Digite seu e-mail acima para receber o link de redefinição.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setNotice("Enviamos um link de redefinição de senha para o seu e-mail.");
    } catch (err) {
      setError(traduzErro(err?.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dark min-h-screen bg-base text-ink font-body relative overflow-hidden flex">
      {/* fundo com grid + glow, igual ao clima visual do painel */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(#1e2740 1px, transparent 1px), linear-gradient(90deg, #1e2740 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage: "radial-gradient(ellipse 80% 60% at 20% 20%, black 40%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 20% 20%, black 40%, transparent 90%)",
        }}
      />
      <div className="pointer-events-none absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-brand/25 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-[420px] h-[420px] rounded-full bg-brand-deep/20 blur-[120px]" />

      {/* painel esquerdo — marketing */}
      <div className="relative hidden lg:flex flex-1 flex-col justify-between p-12 xl:p-16">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand" />
          <span className="font-display font-bold text-xl">FinFlow</span>
        </div>

        <div className="max-w-lg">
          <div className="flex items-center gap-2 mb-5 text-brand-soft">
            <span className="w-6 h-px bg-brand-soft/60" />
            <span className="text-[11px] font-semibold uppercase tracking-widest">Gestão financeira pessoal</span>
          </div>
          <h1 className="font-display font-bold text-4xl xl:text-5xl leading-tight text-white">
            Controle total <br />
            do seu <span className="italic text-brand-soft">dinheiro</span>
          </h1>
          <p className="mt-5 text-ink-muted text-[15px] leading-relaxed">
            Gerencie transações, cartões, metas e investimentos em um único lugar. Dados sincronizados
            em tempo real, seguros e sempre disponíveis.
          </p>

          <div className="mt-9 flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-base-card border border-base-border text-brand-soft shrink-0">
                  <Icon size={16} />
                </span>
                <span className="text-sm text-ink-muted">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-ink-faint">
          © {new Date().getFullYear()} FinFlow · Dados protegidos com criptografia de ponta a ponta
        </p>
      </div>

      {/* painel direito — formulário */}
      <div className="relative flex-1 flex items-center justify-center p-6 sm:p-10 border-l border-base-border/60 bg-base-soft/40">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <span className="w-2 h-2 rounded-full bg-brand" />
            <span className="font-display font-bold text-xl text-white">FinFlow</span>
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-base-card border border-base-border mb-7">
            {[
              { id: "signin", label: "Entrar" },
              { id: "signup", label: "Criar conta" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setMode(t.id);
                  setError("");
                  setNotice("");
                }}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === t.id ? "bg-brand text-white shadow-glow" : "text-ink-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            {mode === "signin" ? (
              <>
                Bem-vindo de volta <span aria-hidden>👋</span>
              </>
            ) : (
              "Crie sua conta grátis"
            )}
          </h2>
          <p className="mt-1.5 text-sm text-ink-muted">
            {mode === "signin"
              ? "Entre com sua conta para acessar seu painel financeiro."
              : "Leva menos de um minuto para começar a organizar suas finanças."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="label-eyebrow !px-0 block mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type="email"
                  autoComplete="email"
                  className="input !pl-9 !bg-base-soft"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label-eyebrow !px-0">Senha</label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-brand-soft hover:text-brand transition-colors"
                  >
                    Esqueci a senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="input !pl-9 !pr-9 !bg-base-soft"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error ? (
              <p className="text-xs text-negative bg-negative/10 border border-negative/30 rounded-lg px-3 py-2">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="text-xs text-positive bg-positive/10 border border-positive/30 rounded-lg px-3 py-2">
                {notice}
              </p>
            ) : null}

            <button type="submit" disabled={busy} className="btn-primary mt-1 justify-center disabled:opacity-60">
              {busy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Entrar na conta" : "Criar minha conta"}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <span className="h-px flex-1 bg-base-border" />
            <span className="text-[11px] text-ink-faint uppercase tracking-wide">ou continue com</span>
            <span className="h-px flex-1 bg-base-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleBusy}
            className="btn-ghost w-full justify-center !bg-base-soft disabled:opacity-60"
          >
            {googleBusy ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
            Continuar com Google
          </button>

          <p className="text-center text-sm text-ink-muted mt-7">
            {mode === "signin" ? (
              <>
                Não tem conta?{" "}
                <button type="button" onClick={() => setMode("signup")} className="text-brand-soft hover:text-brand font-medium">
                  Criar agora — é grátis
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button type="button" onClick={() => setMode("signin")} className="text-brand-soft hover:text-brand font-medium">
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function traduzErro(msg) {
  if (!msg) return "Algo deu errado. Tente novamente.";
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("user already registered")) return "Já existe uma conta com esse e-mail.";
  if (m.includes("password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).";
  return msg;
}

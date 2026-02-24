/**
 * Login Page — Zenite (Google OAuth only)
 *
 * Full-page centered login with Zenite branding.
 * Navy/cloud palette, DM Sans, pill buttons.
 */

import { useAuth, IS_PREVIEW } from "./auth-context";
import { motion } from "motion/react";
import { GoogleLogo, ShieldCheck, ArrowRight, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ZeniteLogo from "../../imports/Camada1";

const ff = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

export function LoginPage() {
  const { signInWithGoogle, loading, session, authError } = useAuth();
  const navigate = useNavigate();
  const [localError, setLocalError] = useState<string | null>(null);

  // In preview (iframe) mode, skip login entirely — RequireAuth already bypasses
  // Also redirect if already authenticated
  useEffect(() => {
    if (IS_PREVIEW || (!loading && session)) {
      navigate("/price", { replace: true });
    }
  }, [loading, session, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#122232] relative overflow-hidden">
      {/* Background decorative elements */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 80%, rgba(7,171,222,0.15) 0%, transparent 60%), " +
            "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(140,140,212,0.12) 0%, transparent 60%), " +
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(234,194,61,0.06) 0%, transparent 60%)",
        }}
      />

      {/* Floating grid dots pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #f6f7f9 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 flex flex-col items-center w-full max-w-[420px] mx-[24px]"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-col items-center mb-[40px]"
        >
          {/* Zenite logo from Figma */}
          <div className="relative w-[200px] h-[54px] mb-[12px]">
            <ZeniteLogo />
          </div>
          <span
            className="text-[#4e6987] mt-[4px]"
            style={{
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: -0.3,
              ...ff,
            }}
          >
            Plataforma interna HTZ
          </span>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="w-full bg-white rounded-[20px] p-[32px] shadow-[0_12px_48px_rgba(0,0,0,0.25)]"
        >
          <h2
            className="text-[#28415c] text-center mb-[6px]"
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: -0.5,
              lineHeight: "26px",
              ...ff,
            }}
          >
            Bem-vindo de volta
          </h2>
          <p
            className="text-[#4e6987] text-center mb-[28px]"
            style={{
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: -0.3,
              lineHeight: "20px",
              ...ff,
            }}
          >
            Faça login com sua conta Google corporativa para acessar o Zenite.
          </p>

          {/* Google Sign-in button */}
          <button
            onClick={async () => {
              setLocalError(null);
              try {
                await signInWithGoogle();
              } catch (err) {
                console.error("[Zenite Login] Button click error:", err);
                setLocalError(`Erro ao iniciar login: ${String(err)}`);
              }
            }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-[10px] h-[48px] rounded-[500px] bg-[#28415c] text-white hover:bg-[#1a2d40] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            style={{
              boxShadow: "0 2px 8px rgba(18,34,50,0.3)",
            }}
          >
            <GoogleLogo size={20} weight="bold" />
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: -0.3,
                ...ff,
              }}
            >
              Entrar com Google
            </span>
            <ArrowRight size={16} weight="bold" className="ml-[4px]" />
          </button>

          {/* Domain error message */}
          {(authError || localError) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-[10px] px-[14px] py-[12px] rounded-[12px] bg-[#fef2f2] border border-[#fecaca] mt-[16px]"
            >
              <WarningCircle
                size={18}
                weight="duotone"
                className="text-[#ef4444] shrink-0 mt-[1px]"
              />
              <span
                className="text-[#991b1b]"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  lineHeight: "17px",
                  ...ff,
                }}
              >
                {authError || localError}
              </span>
            </motion.div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-[12px] my-[20px]">
            <div className="flex-1 h-[1px] bg-[#ebedf0]" />
            <span
              className="text-[#c8cfdb]"
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                ...ff,
              }}
            >
              Acesso restrito
            </span>
            <div className="flex-1 h-[1px] bg-[#ebedf0]" />
          </div>

          {/* Info */}
          <div className="flex items-start gap-[10px] px-[14px] py-[12px] rounded-[12px] bg-[#f6f7f9]">
            <ShieldCheck
              size={18}
              weight="duotone"
              className="text-[#07abde] shrink-0 mt-[1px]"
            />
            <div className="flex flex-col gap-[2px]">
              <span
                className="text-[#4e6987]"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: -0.2,
                  ...ff,
                }}
              >
                Login corporativo
              </span>
              <span
                className="text-[#98989d]"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  lineHeight: "16px",
                  ...ff,
                }}
              >
                Apenas contas Google autorizadas pela HTZ podem acessar esta
                plataforma.
              </span>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-[#4e6987] mt-[24px] text-center"
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: -0.2,
            ...ff,
          }}
        >
          HTZ Agencia Digital &copy; {new Date().getFullYear()}
        </motion.p>
      </motion.div>
    </div>
  );
}
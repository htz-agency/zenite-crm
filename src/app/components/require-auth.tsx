/**
 * RequireAuth — Route protection wrapper
 */
import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router";
import { useAuth, IS_PREVIEW } from "./auth-context";
import { motion } from "motion/react";

const ff = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

function LoadingScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#122232]">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-[16px]">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="flex items-center justify-center size-[48px] rounded-[14px] bg-[#28415c]">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><path d="M4 8L14 4L24 8V20L14 24L4 20V8Z" stroke="#07ABDE" strokeWidth="2" strokeLinejoin="round" fill="none" /><path d="M14 4V24" stroke="#07ABDE" strokeWidth="1.5" strokeLinecap="round" /><path d="M4 8L14 14L24 8" stroke="#07ABDE" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </motion.div>
        <span className="text-[#4e6987]" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>Verificando autentica\u00e7\u00e3o...</span>
      </motion.div>
    </div>
  );
}

export function RequireAuth() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (IS_PREVIEW) return;
    if (!loading && !session) navigate("/login", { replace: true });
  }, [loading, session, navigate]);
  if (IS_PREVIEW) return <Outlet />;
  if (loading || !session) return <LoadingScreen />;
  return <Outlet />;
}

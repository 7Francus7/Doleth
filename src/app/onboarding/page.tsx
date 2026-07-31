import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "../../components/auth/AuthShell";
import {
  FirstAccountStep,
  PreferencesStep,
  StepIndicator,
  WelcomeStep,
} from "../../components/auth/OnboardingSteps";
import { requireUser } from "../../lib/auth/guards";
import { todayInArgentina } from "../../lib/finance/domain";
import { backToStepAction } from "./actions";
import styles from "../../components/auth/auth.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Configuración inicial · Doleth",
  robots: { index: false },
};

const COPY = {
  1: { eyebrow: "Bienvenida", title: "Empecemos por lo tuyo", intro: undefined },
  2: {
    eyebrow: "Configuración inicial",
    title: "Tu moneda y tu hora",
    intro: "Con esto los importes y las fechas se muestran como los usás todos los días.",
  },
  3: {
    eyebrow: "Configuración inicial",
    title: "Tu primera cuenta",
    intro: "Cargá el saldo real que tenés hoy. Es el punto de partida de todo lo demás.",
  },
} as const;

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");
  if (user.onboardingCompletedAt) redirect("/ahora");

  const step = user.onboardingStep <= 0 ? 1 : user.onboardingStep === 1 ? 2 : 3;
  const copy = COPY[step];

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      {...(copy.intro ? { intro: copy.intro } : {})}
    >
      <StepIndicator current={step} />

      {step === 1 ? <WelcomeStep /> : null}
      {step === 2 ? (
        <PreferencesStep
          defaults={{
            primaryCurrency: user.primaryCurrency,
            timeZone: user.timeZone,
            locale: user.locale,
          }}
        />
      ) : null}
      {step === 3 ? <FirstAccountStep currency={user.primaryCurrency} today={todayInArgentina()} /> : null}

      {step > 1 ? (
        <form action={backToStepAction}>
          <input name="step" type="hidden" value={step - 2} />
          <button className={styles.link} type="submit">
            Volver al paso anterior
          </button>
        </form>
      ) : null}
    </AuthShell>
  );
}

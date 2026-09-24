import { getTranslations } from "@/lib/i18n";

// Split layout for sign-in pages: brand panel on the left, the form on the right.
export async function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { t } = await getTranslations();

  return (
    <main id="main-content" className="auth">
      <aside className="auth-brand">
        <img src="/casla-logo-white-compact.svg" alt="Casla" width={150} height={48} />
        <div className="auth-pitch">
          <span className="tag">TS-IT-0001</span>
          <h2>{t("auth.pitchTitle")}</h2>
          <p>{t("auth.pitchText")}</p>
        </div>
        <span className="auth-foot">{t("app.name")}</span>
      </aside>
      <section className="auth-panel">
        <div className="auth-card">
          <img className="auth-card-logo" src="/casla-logo-white-compact.svg" alt="Casla" width={120} height={38} />
          <div className="auth-card-head">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

import { Logo } from "@/components/logo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ButtonLink } from "@/components/ui/button";
import { APP_HOME } from "@/lib/nav";

/** En-tête de l'accueil public : logo, deux ancres, thème et « Entrer ». */
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4 md:px-6 lg:px-8">
        <Logo href="/" />
        <nav aria-label="Sections de la page" className="hidden md:block">
          <ul className="flex items-center gap-1 text-[15px] font-medium text-ink-2">
            <li>
              <a href="#fonctionnalites" className="flex h-11 items-center rounded-control px-3.5 transition-colors duration-150 hover:bg-surface-2 hover:text-ink">
                Fonctionnalités
              </a>
            </li>
            <li>
              <a href="#agent" className="flex h-11 items-center rounded-control px-3.5 transition-colors duration-150 hover:bg-surface-2 hover:text-ink">
                L&apos;agent
              </a>
            </li>
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <ThemeSwitcher />
          <ButtonLink href={APP_HOME} prefetch={false} variant="primary">
            Entrer
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

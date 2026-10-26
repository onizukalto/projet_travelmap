import { AccountButton } from "@/components/account-button";
import { Logo } from "@/components/logo";
import { MainNav } from "@/components/main-nav";
import { SearchField } from "@/components/search-field";
import { ThemeSwitcher } from "@/components/theme-switcher";

/** En-tête commun : logo et navigation à gauche, recherche, thème et compte à droite. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4 md:px-6 lg:px-8">
        <Logo />
        <MainNav />
        <div className="ml-auto flex items-center gap-1 md:gap-3">
          <SearchField />
          <ThemeSwitcher />
          <AccountButton />
        </div>
      </div>
    </header>
  );
}

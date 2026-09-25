import Image from "next/image";
import { site } from "@/lib/site";
import { Doodle } from "./Doodle";

type HeaderProps = {
  menuOpen: boolean;
  onLogo: () => void;
  onToggle: () => void;
};

export function Header({ menuOpen, onLogo, onToggle }: HeaderProps) {
  const toggleLabel = menuOpen ? "Close" : "Menu";

  return (
    <header className="o-header">
      <div className="hide-first">
        <button type="button" className="o-header__logo" onClick={onLogo} aria-label={`${site.fullName}, home`}>
          <Image src="/logo.svg" alt="" width={1000} height={650} loading="eager" />
        </button>
        <button
          type="button"
          className={`a-h1 o-header__toggle a-menuToggle${menuOpen ? " -open" : ""}`}
          onClick={onToggle}
          aria-haspopup="true"
          aria-controls="o-menu"
          aria-expanded={menuOpen}
        >
          <span className="a-menuToggle__icon" aria-hidden="true">
            <Doodle name={menuOpen ? "x" : "plus"} className="a-menuToggle__doodle" />
          </span>
          <span>{toggleLabel}</span>
        </button>
      </div>
    </header>
  );
}

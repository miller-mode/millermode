"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useMountEffect } from "@/hooks/useMountEffect";
import { Gallery } from "@/lib/gallery/Gallery";
import type { HoverTarget } from "@/lib/gallery/Gallery";
import { drawFrame, hideFrame, moveFrame } from "@/lib/hoverFrame";
import type { Project } from "@/lib/projects";
import { Cursor } from "./Cursor";
import type { CursorHandle } from "./Cursor";
import { Header } from "./Header";
import { HoverFrame } from "./HoverFrame";
import { Loader } from "./Loader";
import { Menu } from "./Menu";
import { ProjectView } from "./ProjectView";

const MOBILE_BREAKPOINT = 768;
const PROJECT_PATH = "/projects/";

let introPlayed = false;

export function Home({ projects }: { projects: Project[] }) {
  const galleryContainer = useRef<HTMLDivElement>(null);
  const loadProgress = useRef(0);
  const galleryReady = useRef(false);
  const cursor = useRef<CursorHandle>(null);
  const hoverFrame = useRef<SVGSVGElement>(null);
  const gallery = useRef<Gallery | null>(null);
  const openedHere = useRef(false);
  const pathname = usePathname();

  const [revealed, setRevealed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const openSlug = pathname.startsWith(PROJECT_PATH) ? pathname.slice(PROJECT_PATH.length) : null;
  const project = projects.find((candidate) => candidate.slug === openSlug) ?? null;

  const isHome = revealed && !menuOpen && !project;

  function reveal() {
    introPlayed = true;
    setRevealed(true);
    document.documentElement.classList.add("-initialized");
    gallery.current?.start();
  }

  function showHover(target: HoverTarget | null) {
    cursor.current?.setHover(target?.project.title ?? null);
    galleryContainer.current?.classList.toggle("-hovering", target !== null);
    if (!hoverFrame.current) return;
    if (target) drawFrame(hoverFrame.current, target.rect);
    else hideFrame(hoverFrame.current);
  }

  function pauseGallery() {
    gallery.current?.setActive(false);
  }

  function resumeGallery() {
    gallery.current?.setActive(true);
    gallery.current?.setVisible(true);
  }

  function hideGallery() {
    pauseGallery();
    if (window.innerWidth >= MOBILE_BREAKPOINT) gallery.current?.setVisible(false);
  }

  function openProject(next: Project) {
    hideGallery();
    setMenuOpen(false);
    openedHere.current = true;
    window.history.pushState(null, "", `${PROJECT_PATH}${next.slug}`);
  }

  function closeProject() {
    if (openedHere.current) {
      openedHere.current = false;
      window.history.back();
    } else {
      window.history.pushState(null, "", "/");
    }
    if (!menuOpen) resumeGallery();
  }

  function toggleMenu() {
    if (menuOpen) {
      setMenuOpen(false);
      if (!project) resumeGallery();
      return;
    }
    pauseGallery();
    setMenuOpen(true);
  }

  function goHome() {
    setMenuOpen(false);
    if (project) closeProject();
    else resumeGallery();
  }

  useMountEffect(() => {
    if (!galleryContainer.current) return;

    const instance = new Gallery(galleryContainer.current, projects, {
      onProgress: (percent) => {
        loadProgress.current = percent;
      },
      onReady: () => {
        galleryReady.current = true;
      },
      onHover: showHover,
      onHoverMove: (rect) => {
        if (hoverFrame.current) moveFrame(hoverFrame.current, rect);
      },
      onSelect: openProject,
    });
    gallery.current = instance;

    function syncWithHistory() {
      if (window.location.pathname.startsWith(PROJECT_PATH)) {
        hideGallery();
        return;
      }
      openedHere.current = false;
      resumeGallery();
    }

    window.addEventListener("popstate", syncWithHistory);

    return () => {
      window.removeEventListener("popstate", syncWithHistory);
      instance.destroy();
      gallery.current = null;
      document.documentElement.classList.remove("-initialized");
    };
  });

  return (
    <>
      <Loader progress={loadProgress} ready={galleryReady} onReveal={reveal} quick={introPlayed} />
      <main className="t-home">
        <Header menuOpen={menuOpen} onLogo={goHome} onToggle={toggleMenu} />
        <Menu open={menuOpen} />
        <div ref={galleryContainer} className="o-gallery" aria-label="Projects gallery" role="region" />
        <HoverFrame ref={hoverFrame} />
        {project && <ProjectView key={project.slug} project={project} onClose={closeProject} />}
      </main>
      <Cursor ref={cursor} home={isHome} />
    </>
  );
}

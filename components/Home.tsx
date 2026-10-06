"use client";

import { useRef, useState } from "react";
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

export function Home({ projects }: { projects: Project[] }) {
  const galleryContainer = useRef<HTMLDivElement>(null);
  const loadProgress = useRef(0);
  const galleryReady = useRef(false);
  const cursor = useRef<CursorHandle>(null);
  const hoverFrame = useRef<SVGSVGElement>(null);
  const gallery = useRef<Gallery | null>(null);

  const [revealed, setRevealed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);

  const isHome = revealed && !menuOpen && !project;

  function reveal() {
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

  function openProject(next: Project) {
    pauseGallery();
    if (window.innerWidth >= MOBILE_BREAKPOINT) gallery.current?.setVisible(false);
    setMenuOpen(false);
    setProject(next);
  }

  function closeProject() {
    setProject(null);
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
    setProject(null);
    resumeGallery();
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

    return () => {
      instance.destroy();
      gallery.current = null;
      document.documentElement.classList.remove("-initialized");
    };
  });

  return (
    <>
      <Loader progress={loadProgress} ready={galleryReady} onReveal={reveal} />
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

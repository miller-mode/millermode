"use client";

import { useRef, useState } from "react";
import { useMountEffect } from "@/hooks/useMountEffect";
import { Gallery, IDLE_LABEL } from "@/lib/gallery/Gallery";
import type { Project } from "@/lib/projects";
import { Cursor } from "./Cursor";
import { Header } from "./Header";
import { Loader } from "./Loader";
import { Menu } from "./Menu";
import { ProjectView } from "./ProjectView";

const MOBILE_BREAKPOINT = 768;

export function Home({ projects }: { projects: Project[] }) {
  const galleryContainer = useRef<HTMLDivElement>(null);
  const loadProgress = useRef(0);
  const galleryReady = useRef(false);
  const cursorLabel = useRef<HTMLParagraphElement>(null);
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
      onLabel: (label) => {
        if (cursorLabel.current) cursorLabel.current.textContent = label;
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
        {project && <ProjectView key={project.slug} project={project} onClose={closeProject} />}
      </main>
      <Cursor home={isHome} labelRef={cursorLabel} label={IDLE_LABEL} />
    </>
  );
}

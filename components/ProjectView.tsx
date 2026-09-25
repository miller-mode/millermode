"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent, UIEvent } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useMountEffect } from "@/hooks/useMountEffect";
import type { Project } from "@/lib/projects";

gsap.registerPlugin(useGSAP);

type ProjectViewProps = {
  project: Project;
  onClose: () => void;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function ProjectView({ project, onClose }: ProjectViewProps) {
  const root = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [current, setCurrent] = useState(1);

  useGSAP(
    () => {
      gsap.from(root.current, { yPercent: 100, duration: 1, ease: "power4.inOut" });
    },
    { scope: root },
  );

  useMountEffect(() => {
    closeButton.current?.focus({ preventScroll: true });
  });

  function close() {
    gsap.to(root.current, { yPercent: 100, duration: 0.8, ease: "power4.inOut", onComplete: onClose });
  }

  function trackCurrent(event: UIEvent<HTMLDivElement>) {
    const container = event.currentTarget;
    const midpoint = container.scrollTop + container.clientHeight / 2;
    const images = Array.from(container.querySelectorAll<HTMLElement>(".m-project__image"));
    const index = images.findLastIndex((image) => image.offsetTop <= midpoint);
    setCurrent(Math.max(index, 0) + 1);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") close();
  }

  return (
    <div ref={root} className="m-project" role="dialog" aria-modal="true" aria-labelledby="m-project-title" onKeyDown={onKeyDown}>
      <div className="m-project__scroll" onScroll={trackCurrent}>
        <header className="m-project__header">
          <h1 id="m-project-title" className="a-h1 m-project__title">
            <span>{project.title}</span>
          </h1>
          {project.category && (
            <p className="a-p m-project__category">
              <span>{project.category}</span>
            </p>
          )}
        </header>
        <div className="m-project__images">
          {project.images.map((image, index) => (
            <Image
              key={image.src}
              className="m-project__image"
              src={image.src}
              alt={`${project.title}${project.category ? ` for ${project.category}` : ""}, image ${index + 1}`}
              width={image.width}
              height={image.height}
              sizes="(min-width: 1025px) 600px, 100vw"
              loading={index < 2 ? "eager" : "lazy"}
            />
          ))}
        </div>
      </div>
      <p className="a-p m-project__counter" aria-live="polite">
        {pad(current)} / {pad(project.images.length)}
      </p>
      <button ref={closeButton} type="button" className="a-p m-project__close" onClick={close}>
        Close
      </button>
    </div>
  );
}

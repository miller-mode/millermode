"use client";

import { useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, UIEvent, WheelEvent } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useMountEffect } from "@/hooks/useMountEffect";
import type { Project } from "@/lib/projects";

gsap.registerPlugin(useGSAP);

const WHEEL_MULTIPLIER = 1.4;
const STAGGER_LIMIT = 24;

type ProjectViewProps = {
  project: Project;
  onClose: () => void;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function stagger(index: number): CSSProperties {
  return { "--i": Math.min(index, STAGGER_LIMIT) } as CSSProperties;
}

export function ProjectView({ project, onClose }: ProjectViewProps) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const sheetButton = useRef<HTMLButtonElement>(null);
  const scrollTarget = useRef(0);
  const [current, setCurrent] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  const total = project.images.length;
  const credit = `${project.title}${project.category ? ` for ${project.category}` : ""}`;

  useGSAP(
    () => {
      gsap.from(root.current, { yPercent: 100, duration: 1, ease: "power4.inOut" });
    },
    { scope: root },
  );

  useMountEffect(() => {
    root.current?.focus({ preventScroll: true });
  });

  function close() {
    gsap.to(root.current, { yPercent: 100, duration: 0.8, ease: "power4.inOut", onComplete: onClose });
  }

  function frames() {
    return Array.from(track.current?.querySelectorAll<HTMLElement>(".m-project__image") ?? []);
  }

  function scrollTo(left: number, duration: number) {
    const element = track.current;
    if (!element) return;
    scrollTarget.current = gsap.utils.clamp(0, element.scrollWidth - element.clientWidth, left);
    gsap.to(element, { scrollLeft: scrollTarget.current, duration, ease: "power3.out", overwrite: true });
  }

  function centerOn(index: number, duration = 0.9) {
    const element = track.current;
    const frame = frames()[index];
    if (!element || !frame) return;
    scrollTo(frame.offsetLeft - (element.clientWidth - frame.offsetWidth) / 2, duration);
  }

  function step(direction: number) {
    centerOn(gsap.utils.clamp(0, total - 1, current + direction));
  }

  function scrollWithWheel(event: WheelEvent<HTMLDivElement>) {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    const element = event.currentTarget;
    const origin = gsap.isTweening(element) ? scrollTarget.current : element.scrollLeft;
    scrollTo(origin + event.deltaY * WHEEL_MULTIPLIER, 0.8);
  }

  function trackCurrent(event: UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const center = element.scrollLeft + element.clientWidth / 2;
    const distances = frames().map((frame) => Math.abs(frame.offsetLeft + frame.offsetWidth / 2 - center));
    setCurrent(distances.indexOf(Math.min(...distances)));
  }

  function openFrame(index: number) {
    centerOn(index, 0);
    setCurrent(index);
    setSheetOpen(false);
    sheetButton.current?.focus({ preventScroll: true });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      if (sheetOpen) setSheetOpen(false);
      else close();
    }
    if (sheetOpen) return;
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  }

  return (
    <div
      ref={root}
      className={`m-project${sheetOpen ? " -sheet" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="m-project-title"
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <div ref={track} className="m-project__track" onWheel={scrollWithWheel} onScroll={trackCurrent}>
        {project.images.map((image, index) => (
          <Image
            key={image.src}
            className="m-project__image"
            src={image.src}
            alt={`${credit}, image ${index + 1}`}
            width={image.width}
            height={image.height}
            loading={index < 3 ? "eager" : "lazy"}
          />
        ))}
      </div>

      <div className="m-project__sheet" aria-hidden={!sheetOpen} inert={!sheetOpen}>
        <ol className="m-project__grid">
          {project.images.map((image, index) => (
            <li key={image.src} style={stagger(index)}>
              <button
                type="button"
                className={`m-project__frame${index === current ? " -current" : ""}`}
                onClick={() => openFrame(index)}
                aria-label={`Show image ${index + 1}`}
              >
                <span className="m-project__thumbWrap">
                  <Image className="m-project__thumb" src={image.src} alt="" width={image.width} height={image.height} loading="lazy" />
                </span>
                <span className="a-hand m-project__frameNumber">{pad(index + 1)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <footer className="m-project__bar">
        <div className="m-project__info">
          <h1 id="m-project-title" className="a-h1 m-project__title">
            <span>{project.title}</span>
          </h1>
          {project.category && (
            <p className="a-p m-project__category">
              <span>{project.category}</span>
            </p>
          )}
        </div>
        <p className="a-p m-project__counter" aria-live="polite">
          {pad(current + 1)} / {pad(total)}
        </p>
        <div className="m-project__actions">
          <button
            ref={sheetButton}
            type="button"
            className="a-p m-project__action"
            onClick={() => setSheetOpen(!sheetOpen)}
            aria-pressed={sheetOpen}
          >
            {sheetOpen ? "Filmstrip" : "Contact sheet"}
          </button>
          <button type="button" className="a-p m-project__action" onClick={close}>
            Close
          </button>
        </div>
      </footer>
    </div>
  );
}

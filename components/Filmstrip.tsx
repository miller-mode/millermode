"use client";

import { useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode, SyntheticEvent, UIEvent, WheelEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useMountEffect } from "@/hooks/useMountEffect";
import { drawFrameAround, hideFrame } from "@/lib/hoverFrame";
import type { ProjectImage } from "@/lib/projects";
import { site } from "@/lib/site";
import { Cursor } from "./Cursor";
import type { CursorHandle } from "./Cursor";
import { HoverFrame } from "./HoverFrame";

gsap.registerPlugin(useGSAP);

const WHEEL_MULTIPLIER = 1.4;
const STAGGER_LIMIT = 24;

export type FilmstripItem = {
  key: string;
  image: ProjectImage;
  alt: string;
  href?: string;
  name?: string;
  framed?: boolean;
};

type FilmstripProps = {
  title: string;
  note?: string;
  items: FilmstripItem[];
  panels?: { key: string; content: ReactNode }[];
  contactSheet?: boolean;
  contact?: boolean;
  onClose?: () => void;
  standalone?: boolean;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function stagger(index: number): CSSProperties {
  return { "--i": Math.min(index, STAGGER_LIMIT) } as CSSProperties;
}

export function Filmstrip({
  title,
  note,
  items,
  panels = [],
  contactSheet = true,
  contact = false,
  onClose,
  standalone = false,
}: FilmstripProps) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const sheetButton = useRef<HTMLButtonElement>(null);
  const cursor = useRef<CursorHandle>(null);
  const scrollTarget = useRef(0);
  const slideMarks = useRef<(SVGSVGElement | null)[]>([]);
  const sheetMarks = useRef<(SVGSVGElement | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  const total = items.length + panels.length;
  const hasLinks = items.some((item) => item.href);
  const showSheet = contactSheet && items.length > 1;

  useGSAP(
    () => {
      if (!standalone) gsap.from(root.current, { yPercent: 100, duration: 1, ease: "power4.inOut" });
    },
    { scope: root },
  );

  useMountEffect(() => {
    root.current?.focus({ preventScroll: true });
  });

  function close() {
    if (!onClose) return;
    if (standalone) {
      onClose();
      return;
    }
    gsap.to(root.current, { yPercent: 100, duration: 0.8, ease: "power4.inOut", onComplete: onClose });
  }

  function slides() {
    return Array.from(track.current?.querySelectorAll<HTMLElement>(".m-project__slide") ?? []);
  }

  function scrollTo(left: number, duration: number) {
    const element = track.current;
    if (!element) return;
    scrollTarget.current = gsap.utils.clamp(0, element.scrollWidth - element.clientWidth, left);
    gsap.to(element, { scrollLeft: scrollTarget.current, duration, ease: "power3.out", overwrite: true });
  }

  function centerOn(index: number, duration = 0.9) {
    const element = track.current;
    const slide = slides()[index];
    if (!element || !slide) return;
    scrollTo(slide.offsetLeft - (element.clientWidth - slide.offsetWidth) / 2, duration);
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
    const distances = slides().map((slide) => Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center));
    setCurrent(distances.indexOf(Math.min(...distances)));
  }

  function markSlide(index: number) {
    const mark = slideMarks.current[index];
    const image = mark?.parentElement?.querySelector("img");
    if (mark && image) drawFrameAround(mark, image);
  }

  function enterSlide(item: FilmstripItem, index: number) {
    if (!item.href) return;
    markSlide(index);
    cursor.current?.setHover(item.name ?? null);
    root.current?.classList.add("-hovering");
  }

  function leaveSlide(item: FilmstripItem, index: number) {
    if (!item.href) return;
    const mark = slideMarks.current[index];
    if (mark) hideFrame(mark);
    cursor.current?.setHover(null);
    root.current?.classList.remove("-hovering");
  }

  function frameOnLoad(item: FilmstripItem, index: number, event: SyntheticEvent<HTMLImageElement>) {
    const mark = slideMarks.current[index];
    if (item.framed && mark) drawFrameAround(mark, event.currentTarget);
  }

  function markSheet(index: number) {
    const mark = sheetMarks.current[index];
    const thumb = mark?.parentElement?.querySelector("img");
    if (mark && thumb) drawFrameAround(mark, thumb);
  }

  function unmarkSheet(index: number) {
    const mark = sheetMarks.current[index];
    if (mark && index !== current) hideFrame(mark);
  }

  function toggleSheet() {
    if (sheetOpen) {
      setSheetOpen(false);
      return;
    }
    sheetMarks.current.forEach((mark) => mark && hideFrame(mark));
    setSheetOpen(true);
    window.requestAnimationFrame(() => markSheet(current));
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

  function renderSlide(item: FilmstripItem, index: number) {
    const image = (
      <>
        <Image
          className="m-project__image"
          src={item.image.src}
          alt={item.href ? "" : item.alt}
          width={item.image.width}
          height={item.image.height}
          loading={index < 3 ? "eager" : "lazy"}
          onLoad={(event) => frameOnLoad(item, index, event)}
        />
        <HoverFrame
          ref={(mark) => {
            slideMarks.current[index] = mark;
          }}
          className="-inline"
        />
      </>
    );

    if (!item.href) {
      return (
        <span key={item.key} className="m-project__slide">
          {image}
        </span>
      );
    }

    return (
      <Link
        key={item.key}
        href={item.href}
        className="m-project__slide -link"
        aria-label={item.alt}
        onMouseEnter={() => enterSlide(item, index)}
        onMouseLeave={() => leaveSlide(item, index)}
        onFocus={() => markSlide(index)}
        onBlur={() => leaveSlide(item, index)}
      >
        {image}
      </Link>
    );
  }

  return (
    <div
      ref={root}
      className={`m-project${sheetOpen ? " -sheet" : ""}${standalone ? " -standalone" : ""}`}
      role={standalone ? "region" : "dialog"}
      aria-modal={standalone ? undefined : true}
      aria-labelledby="m-project-title"
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <div ref={track} className="m-project__track" onWheel={scrollWithWheel} onScroll={trackCurrent}>
        {items.map(renderSlide)}
        {panels.map((panel) => (
          <section key={panel.key} className="m-project__slide m-project__panel">
            {panel.content}
          </section>
        ))}
      </div>

      {showSheet && (
        <div className="m-project__sheet" aria-hidden={!sheetOpen} inert={!sheetOpen}>
          <ol className="m-project__grid">
            {items.map((item, index) => (
              <li key={item.key} style={stagger(index)}>
                <button
                  type="button"
                  className={`m-project__frame${index === current ? " -current" : ""}`}
                  onClick={() => openFrame(index)}
                  onMouseEnter={() => markSheet(index)}
                  onMouseLeave={() => unmarkSheet(index)}
                  onFocus={() => markSheet(index)}
                  onBlur={() => unmarkSheet(index)}
                  aria-label={`Show ${item.name ?? `image ${index + 1}`}`}
                >
                  <span className="m-project__thumbWrap">
                    <Image
                      className="m-project__thumb"
                      src={item.image.src}
                      alt=""
                      width={item.image.width}
                      height={item.image.height}
                      loading="lazy"
                    />
                    <HoverFrame
                      ref={(mark) => {
                        sheetMarks.current[index] = mark;
                      }}
                      className="-inline"
                    />
                  </span>
                  <span className="a-hand m-project__frameNumber">{pad(index + 1)}</span>
                  {item.name && <span className="a-p m-project__frameName">{item.name}</span>}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <footer className="m-project__bar">
        <div className="m-project__info">
          <h1 id="m-project-title" className="a-h1 m-project__title">
            <span>{title}</span>
          </h1>
          {note && (
            <p className="a-hand m-project__category">
              <span>{note}</span>
            </p>
          )}
        </div>
        <p className="a-p m-project__counter" aria-live="polite">
          {pad(current + 1)} / {pad(total)}
        </p>
        <div className="m-project__actions">
          {showSheet && (
            <button
              ref={sheetButton}
              type="button"
              className="a-p m-project__action"
              onClick={toggleSheet}
              aria-pressed={sheetOpen}
            >
              {sheetOpen ? "Filmstrip" : "Contact sheet"}
            </button>
          )}
          {contact && (
            <a className="a-p m-project__action" href={`mailto:${site.email}`}>
              Contact
            </a>
          )}
          {onClose && (
            <button type="button" className="a-p m-project__action" onClick={close}>
              Close
            </button>
          )}
        </div>
      </footer>

      {hasLinks && <Cursor ref={cursor} home={!sheetOpen} quiet />}
    </div>
  );
}

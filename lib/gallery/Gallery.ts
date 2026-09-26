import gsap from "gsap";
import VirtualScroll from "virtual-scroll";
import type { VirtualScrollEvent } from "virtual-scroll";
import { Camera, Plane, Raycast, Renderer, Transform, Vec2 } from "ogl";
import type { Mesh, OGLRenderingContext } from "ogl";
import type { Project } from "@/lib/projects";
import { Tile } from "./Tile";
import type { Size } from "./Tile";

export type GalleryEvents = {
  onProgress: (percent: number) => void;
  onReady: () => void;
  onLabel: (label: string) => void;
  onSelect: (project: Project) => void;
};

type Axis = { delta: number; target: number; position: number; velocity: number };

export const IDLE_LABEL = "Scroll or drag";

const MIN_COLUMNS = 8;
const COVERAGE_WIDTH = 1.75;
const COVERAGE_HEIGHT = 1.5;
const SPARE_ROWS = 2;
const AVERAGE_RATIO = 1.1;
const PADDING = 0;
const MOBILE_BREAKPOINT = 768;
const ROW_WIDTH: [number, number][] = [
  [0, 0.46],
  [580, 0.34],
  [840, 0.24],
  [1500, 0.17],
  [2000, 0.15],
  [3000, 0.11],
];
const DRAG_MULTIPLIER = 2.8;
const SCROLL_MULTIPLIER = 0.5;
const DRAG_RELEASE_DELAY = 500;
const RESIZE_DELAY = 100;
const REVEAL_DURATION = 1.3;
const REVEAL_SPREAD = 1.1;

function responsiveRowWidth(screenWidth: number) {
  return ROW_WIDTH.reduce((value, [breakpoint, width]) => (breakpoint < screenWidth ? width : value), 1);
}

function gridFor(screen: Size) {
  const width = screen.width * responsiveRowWidth(screen.width);
  const columns = Math.max(MIN_COLUMNS, Math.ceil(COVERAGE_WIDTH / responsiveRowWidth(screen.width)));
  const rows = Math.ceil((screen.height * COVERAGE_HEIGHT) / (width * AVERAGE_RATIO)) + SPARE_ROWS;
  return { width, columns, tiles: columns * rows };
}

function axisDirection(delta: number) {
  if (delta > 0) return -1;
  if (delta < 0) return 1;
  return 0;
}

function createAxis(): Axis {
  return { delta: 0, target: 0, position: 0, velocity: 0 };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export class Gallery {
  private container: HTMLElement;
  private projects: Project[];
  private events: GalleryEvents;

  private renderer: Renderer;
  private gl: OGLRenderingContext;
  private camera: Camera;
  private scene = new Transform();
  private geometry: Plane;
  private raycast: Raycast;
  private mouse = new Vec2();
  private tiles: Tile[] = [];
  private covers: HTMLImageElement[] = [];
  private hits: Mesh[] = [];

  private screen: Size = { width: 0, height: 0 };
  private viewport: Size = { width: 0, height: 0 };
  private isMobile = false;

  private active = false;
  private destroyed = false;
  private frame = 0;
  private scroller: VirtualScroll | null = null;
  private dragRelease = 0;
  private resizeTimeout = 0;

  private pointer = {
    down: false,
    dragging: true,
    start: { x: 0, y: 0 },
    friction: 0.2 + 0.05 * Math.random(),
    easing: 0.2 + 0.065 * Math.random(),
    x: createAxis(),
    y: createAxis(),
  };

  constructor(container: HTMLElement, projects: Project[], events: GalleryEvents) {
    this.container = container;
    this.projects = projects;
    this.events = events;

    this.renderer = new Renderer({ alpha: true, dpr: Math.min(window.devicePixelRatio, 2) });
    this.gl = this.renderer.gl;
    this.gl.canvas.classList.add("a-galleryCanvas");
    this.container.appendChild(this.gl.canvas);

    this.camera = new Camera(this.gl, { fov: 45 });
    this.camera.position.z = 5;
    this.geometry = new Plane(this.gl, { widthSegments: 2, heightSegments: 2 });
    this.raycast = new Raycast();

    this.update = this.update.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onClick = this.onClick.bind(this);

    this.load();
  }

  start() {
    if (this.destroyed) return;

    this.revealTiles();
    this.pointer.dragging = false;
    this.active = true;
    this.addEventListeners();
    this.frame = window.requestAnimationFrame(this.update);
  }

  setActive(active: boolean) {
    this.active = active;
    if (active) return;
    this.hits = [];
    this.tiles.forEach((tile) => tile.leave());
    this.events.onLabel(IDLE_LABEL);
  }

  setVisible(visible: boolean) {
    this.container.style.opacity = visible ? "1" : "0";
  }

  destroy() {
    this.destroyed = true;
    window.cancelAnimationFrame(this.frame);
    window.clearTimeout(this.dragRelease);
    window.clearTimeout(this.resizeTimeout);
    this.tiles.forEach((tile) => gsap.killTweensOf(tile.reveal));
    this.removeEventListeners();
    this.tiles.forEach((tile) => tile.dispose());
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
    this.gl.canvas.remove();
  }

  private async load() {
    const covers = this.projects.map((project) => project.images[0].src);
    let loaded = 0;

    const images = await Promise.all(
      covers.map((src) =>
        loadImage(src).then((image) => {
          loaded += 1;
          this.events.onProgress(Math.round((loaded / covers.length) * 100));
          return image;
        }),
      ),
    );

    if (this.destroyed) return;

    this.isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    this.covers = images;
    this.onResize();
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.events.onReady();
  }

  private ensureTiles(count: number) {
    const total = Math.max(count, this.projects.length);

    for (let index = this.tiles.length; index < total; index += 1) {
      const projectIndex = index % this.projects.length;
      const tile = new Tile({
        gl: this.gl,
        geometry: this.geometry,
        scene: this.scene,
        project: this.projects[projectIndex],
        cover: this.covers[projectIndex],
      });
      if (!this.isMobile) tile.loadHover();
      this.tiles.push(tile);
    }
  }

  private onResize() {
    this.screen = { width: window.innerWidth, height: window.innerHeight };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({ aspect: this.gl.canvas.width / this.gl.canvas.height });

    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    this.viewport = { width: height * this.camera.aspect, height };
    this.camera.position.x = this.viewport.width / 2;
    this.camera.position.y = -this.viewport.height / 2;

    const grid = gridFor(this.screen);
    const { width, columns } = grid;
    const columnHeights: number[] = [];

    this.ensureTiles(grid.tiles);

    this.tiles.forEach((tile, index) => {
      tile.column = index % columns;
      tile.layout({
        screen: this.screen,
        viewport: this.viewport,
        width,
        top: columnHeights[tile.column] ?? 0,
        padding: PADDING,
      });
      columnHeights[tile.column] = (columnHeights[tile.column] ?? 0) + tile.tileHeight + PADDING;
    });

    const totalWidth = width * columns + PADDING * columns;
    this.tiles.forEach((tile) => tile.setLimits({ width: totalWidth, height: columnHeights[tile.column] }));
  }

  private addEventListeners() {
    window.addEventListener("resize", this.onDebouncedResize);
    this.scroller = new VirtualScroll({ el: this.gl.canvas, passive: false, useKeyboard: true, useTouch: false });
    this.scroller.on(this.onScroll);
    window.addEventListener("click", this.onClick);
    window.addEventListener("mousedown", this.onPointerDown);
    window.addEventListener("mousemove", this.onPointerMove);
    window.addEventListener("mouseup", this.onPointerUp);
    window.addEventListener("mouseleave", this.onPointerUp);
    window.addEventListener("touchstart", this.onPointerDown, { passive: true });
    window.addEventListener("touchmove", this.onPointerMove, { passive: true });
    window.addEventListener("touchend", this.onPointerUp);
  }

  private removeEventListeners() {
    window.removeEventListener("resize", this.onDebouncedResize);
    this.scroller?.destroy();
    this.scroller = null;
    window.removeEventListener("click", this.onClick);
    window.removeEventListener("mousedown", this.onPointerDown);
    window.removeEventListener("mousemove", this.onPointerMove);
    window.removeEventListener("mouseup", this.onPointerUp);
    window.removeEventListener("mouseleave", this.onPointerUp);
    window.removeEventListener("touchstart", this.onPointerDown);
    window.removeEventListener("touchmove", this.onPointerMove);
    window.removeEventListener("touchend", this.onPointerUp);
  }

  private onDebouncedResize = () => {
    window.clearTimeout(this.resizeTimeout);
    this.resizeTimeout = window.setTimeout(this.onResize, RESIZE_DELAY);
  };

  private revealTiles() {
    const centerX = this.screen.width / 2;
    const centerY = this.screen.height / 2;
    const reach = Math.hypot(centerX, centerY);

    this.tiles.forEach((tile) => {
      const { x, y } = tile.screenCenter;
      const distance = Math.min(Math.hypot(x - centerX, y - centerY) / reach, 1.4);
      gsap.to(tile.reveal, {
        value: 1,
        duration: REVEAL_DURATION,
        delay: distance * REVEAL_SPREAD,
        ease: "power3.out",
      });
    });
  }

  private releaseDrag() {
    window.clearTimeout(this.dragRelease);
    this.dragRelease = window.setTimeout(() => {
      this.pointer.dragging = false;
    }, DRAG_RELEASE_DELAY);
  }

  private onScroll(event: VirtualScrollEvent) {
    if (!this.active) return;
    this.pointer.x.target += SCROLL_MULTIPLIER * event.deltaX;
    this.pointer.y.target += SCROLL_MULTIPLIER * event.deltaY;
    this.pointer.dragging = true;
    this.releaseDrag();
  }

  private onPointerDown(event: MouseEvent | TouchEvent) {
    if (event.target !== this.gl.canvas) return;
    const { clientX, clientY } = "touches" in event ? event.touches[0] : event;
    this.pointer.down = true;
    this.pointer.start = { x: clientX, y: clientY };
  }

  private onPointerUp() {
    this.pointer.down = false;
    this.releaseDrag();
  }

  private onPointerMove(event: MouseEvent | TouchEvent) {
    if (!this.active || event.target !== this.gl.canvas) return;
    const { clientX, clientY } = "touches" in event ? event.touches[0] : event;

    if (!this.pointer.down) this.updateHits(clientX, clientY);

    if (this.pointer.down) {
      this.pointer.dragging = true;
      this.pointer.x.target += DRAG_MULTIPLIER * (clientX - this.pointer.start.x);
      this.pointer.y.target += DRAG_MULTIPLIER * (clientY - this.pointer.start.y);
    }

    this.pointer.start = { x: clientX, y: clientY };
  }

  private updateHits(clientX: number, clientY: number) {
    this.mouse.set((clientX / this.screen.width) * 2 - 1, (1 - clientY / this.screen.height) * 2 - 1);
    this.raycast.castMouse(this.camera, this.mouse);
    this.hits = this.raycast.intersectBounds(this.tiles.map((tile) => tile.mesh));

    if (window.innerWidth <= MOBILE_BREAKPOINT) return;

    const hovered = this.tiles.find((tile) => tile.mesh === this.hits[0]);
    this.tiles.forEach((tile) => (tile === hovered ? tile.enter() : tile.leave()));
    this.events.onLabel(hovered ? hovered.project.title : IDLE_LABEL);
  }

  private onClick(event: MouseEvent) {
    if (event.target !== this.gl.canvas || !this.active || this.pointer.dragging) return;
    this.updateHits(event.clientX, event.clientY);
    const tile = this.tiles.find((candidate) => candidate.mesh === this.hits[0]);
    if (tile) this.events.onSelect(tile.project);
  }

  private ease(axis: Axis) {
    axis.delta = axis.target - axis.position;
    axis.velocity += axis.delta * this.pointer.easing;
    axis.velocity *= this.pointer.friction;
    axis.position += axis.velocity;
  }

  private update() {
    this.ease(this.pointer.x);
    this.ease(this.pointer.y);

    const motion = {
      x: this.pointer.x.position,
      y: this.pointer.y.position,
      direction: {
        horizontal: axisDirection(this.pointer.x.delta),
        vertical: axisDirection(this.pointer.y.delta),
      },
    };

    this.tiles.forEach((tile) => tile.move(motion));
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.frame = window.requestAnimationFrame(this.update);
  }
}

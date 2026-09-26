import { Mesh, Program, Texture, Transform } from "ogl";
import type { OGLRenderingContext, Plane } from "ogl";
import type { Project } from "@/lib/projects";
import { fragment, vertex } from "./shaders";

export type Size = { width: number; height: number };

export type Motion = {
  x: number;
  y: number;
  direction: { horizontal: number; vertical: number };
};

type TileOptions = {
  gl: OGLRenderingContext;
  geometry: Plane;
  scene: Transform;
  project: Project;
  cover: HTMLImageElement;
};

type Layout = {
  screen: Size;
  viewport: Size;
  width: number;
  top: number;
  padding: number;
};

const REVEAL_START_SCALE = 0.82;
const HOVER_DELAY = 50;

export class Tile {
  readonly project: Project;
  column = 0;
  readonly mesh: Mesh;
  entered = false;
  readonly reveal = { value: 0 };

  private gl: OGLRenderingContext;
  private container = new Transform();
  private program: Program;
  private ratio: number;
  private hoverReady = false;
  private hoverTimeout = 0;

  private screen: Size = { width: 0, height: 0 };
  private viewport: Size = { width: 0, height: 0 };
  private limits: Size = { width: 0, height: 0 };
  private width = 0;
  private height = 0;
  private left = 0;
  private top = 0;
  private x = 0;
  private y = 0;
  private oldX = 0;
  private oldY = 0;

  constructor({ gl, geometry, scene, project, cover }: TileOptions) {
    this.gl = gl;
    this.project = project;
    this.ratio = cover.naturalHeight / cover.naturalWidth;

    const coverTexture = new Texture(gl, { image: cover, generateMipmaps: false });
    const coverSize = [cover.naturalWidth, cover.naturalHeight];

    this.program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      uniforms: {
        tMap: { value: coverTexture },
        tHoverMap: { value: coverTexture },
        uImageSizes: { value: coverSize },
        uHoverSizes: { value: coverSize },
        uPlaneSizes: { value: [0, 0] },
        uProgress: { value: 0 },
        uReveal: { value: 0 },
      },
    });

    this.mesh = new Mesh(gl, { geometry, program: this.program });
    this.mesh.setParent(this.container);
    this.container.setParent(scene);
  }

  get tileHeight() {
    return this.height;
  }

  get screenCenter() {
    return {
      x: this.left + this.x + this.width / 2,
      y: this.top + this.y + this.height / 2,
    };
  }

  loadHover() {
    const src = this.project.images[1]?.src;
    if (!src) return;

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      this.program.uniforms.tHoverMap.value = new Texture(this.gl, { image, generateMipmaps: false });
      this.program.uniforms.uHoverSizes.value = [image.naturalWidth, image.naturalHeight];
      this.hoverReady = true;
      if (this.entered) this.program.uniforms.uProgress.value = 1;
    };
    image.src = src;
  }

  layout({ screen, viewport, width, top, padding }: Layout) {
    this.screen = screen;
    this.viewport = viewport;
    this.width = width;
    this.height = width * this.ratio;
    this.left = this.column * (width + padding);
    this.top = top;
    this.x = 0;
    this.y = 0;

    this.mesh.scale.x = (this.width / screen.width) * viewport.width;
    this.mesh.scale.y = this.mesh.scale.x * this.ratio;

    this.program.uniforms.uPlaneSizes.value = [this.mesh.scale.x, this.mesh.scale.y];

    this.place();
  }

  setLimits(limits: Size) {
    this.limits = limits;
  }

  move({ x, y, direction }: Motion) {
    let deltaX = x - this.oldX;
    let deltaY = y - this.oldY;

    deltaX = this.wrap(deltaX, direction.horizontal, this.screen.width / 4, "width", this.left + this.x);
    deltaY = this.wrap(deltaY, direction.vertical, this.screen.height / 4, "height", this.top + this.y);

    this.x += deltaX;
    this.y += deltaY;
    this.oldX = x;
    this.oldY = y;
    this.place();
  }

  enter() {
    if (this.entered) return;
    this.entered = true;
    window.clearTimeout(this.hoverTimeout);
    this.hoverTimeout = window.setTimeout(() => {
      if (this.hoverReady) this.program.uniforms.uProgress.value = 1;
    }, HOVER_DELAY);
  }

  leave() {
    window.clearTimeout(this.hoverTimeout);
    if (!this.entered) return;
    this.entered = false;
    this.program.uniforms.uProgress.value = 0;
  }

  dispose() {
    window.clearTimeout(this.hoverTimeout);
  }

  private wrap(delta: number, direction: number, margin: number, size: keyof Size, position: number) {
    const extent = size === "width" ? this.width : this.height;
    if (direction === 1 && position + extent < -margin) return delta + this.limits[size];
    if (direction === -1 && position > this.limits[size] - extent - margin) return delta - this.limits[size];
    return delta;
  }

  private place() {
    const scale = REVEAL_START_SCALE + (1 - REVEAL_START_SCALE) * this.reveal.value;
    this.container.scale.set(scale, scale, 1);
    this.program.uniforms.uReveal.value = this.reveal.value;
    this.container.position.x = this.mesh.scale.x / 2 + ((this.left + this.x) / this.screen.width) * this.viewport.width;
    this.container.position.y = -this.mesh.scale.y / 2 - ((this.top + this.y) / this.screen.height) * this.viewport.height;
  }
}

declare module "virtual-scroll" {
  export type VirtualScrollEvent = {
    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
    originalEvent: Event;
  };

  export type VirtualScrollOptions = {
    el?: EventTarget;
    mouseMultiplier?: number;
    touchMultiplier?: number;
    firefoxMultiplier?: number;
    keyStep?: number;
    preventTouch?: boolean;
    passive?: boolean;
    useKeyboard?: boolean;
    useTouch?: boolean;
  };

  export default class VirtualScroll {
    constructor(options?: VirtualScrollOptions);
    on(callback: (event: VirtualScrollEvent) => void): void;
    off(callback: (event: VirtualScrollEvent) => void): void;
    destroy(): void;
  }
}

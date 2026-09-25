export const doodles = {
  comma: { src: "/doodles/comma.svg", width: 108, height: 138 },
  devil: { src: "/doodles/devil.svg", width: 353, height: 576 },
  hearts: { src: "/doodles/hearts.svg", width: 629, height: 671 },
  monogram: { src: "/doodles/monogram.svg", width: 693, height: 528 },
  plus: { src: "/doodles/plus.svg", width: 296, height: 281 },
  pentagram: { src: "/doodles/pentagram.svg", width: 539, height: 617 },
  x: { src: "/doodles/x.svg", width: 186, height: 244 },
  xxx: { src: "/doodles/xxx.svg", width: 668, height: 396 },
} as const;

export type DoodleName = keyof typeof doodles;

import Image from "next/image";
import { doodles } from "@/lib/doodles";
import type { DoodleName } from "@/lib/doodles";

type DoodleProps = {
  name: DoodleName;
  className?: string;
};

export function Doodle({ name, className }: DoodleProps) {
  const { src, width, height } = doodles[name];
  return <Image className={className} src={src} alt="" width={width} height={height} aria-hidden="true" />;
}

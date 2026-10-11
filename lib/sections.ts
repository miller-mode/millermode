export type SectionId = "editorial" | "costume-design" | "red-carpet";

export type Section = {
  id: SectionId;
  label: string;
};

export const sections: Section[] = [
  { id: "editorial", label: "Editorial" },
  { id: "costume-design", label: "Costume Design" },
  { id: "red-carpet", label: "Red Carpet" },
];

export function findSection(id: string) {
  return sections.find((section) => section.id === id);
}

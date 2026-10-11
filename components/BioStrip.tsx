import { Filmstrip } from "./Filmstrip";
import { portrait } from "@/lib/projects";
import { site } from "@/lib/site";

const NAMES_PER_COLUMN = 14;

const GROUPS = [
  { title: "Talent", names: site.talent },
  { title: "Editorial", names: site.editorial },
  { title: "Clients", names: site.clients },
];

function columns(names: string[]) {
  return Array.from({ length: Math.ceil(names.length / NAMES_PER_COLUMN) }, (_, index) =>
    names.slice(index * NAMES_PER_COLUMN, (index + 1) * NAMES_PER_COLUMN),
  );
}

export function BioStrip() {
  return (
    <Filmstrip
      title={site.fullName}
      note={site.role}
      items={[{ key: "portrait", image: portrait, alt: `${site.fullName}, with his own red marker doodles`, framed: true }]}
      panels={GROUPS.map(({ title, names }) => ({
        key: title,
        content: (
          <>
            <h2 className="a-hand m-project__panelHeading">{title}</h2>
            {site.bio && title === "Talent" && <p className="m-project__panelStatement">{site.bio}</p>}
            <div className="m-project__panelColumns">
              {columns(names).map((column) => (
                <ul key={column[0]} className="m-project__panelColumn">
                  {column.map((name) => (
                    <li key={name} className="a-h1">
                      {name}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </>
        ),
      }))}
      contact
      standalone
    />
  );
}

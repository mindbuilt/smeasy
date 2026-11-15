// Header photo for each guide: /guides/<slug>.jpg (1400×781) plus a 480px
// /guides/<slug>-thumb.jpg for lists. Generated images, house look in DESIGN.md.

export const GUIDE_IMAGE = { width: 1400, height: 781 } as const;

const ALT: Record<string, string> = {
  "how-to-create-a-roster": "Overhead view of hands holding a phone on a café table beside a flat white, keys and a notebook",
  "share-roster-with-staff": "A hand pinning a printed roster to a cork noticeboard in a café's back room",
  "managing-time-off-requests": "A staff member with a backpack walking out of a café onto a sunny footpath",
  "export-to-payroll": "A café owner working on a laptop at the counter after dark, chairs up on the tables",
  "mobile-rostering-tips": "A homewares shop owner checking her phone behind the counter, seen through shelves of ceramics",
  "shift-scheduling-best-practices": "A small restaurant kitchen team plating dishes during a busy service",
  "staff-shift-swaps": "Two bartenders laughing as one hands the other a bar towel at shift change",
  "why-smeasy-vs-spreadsheets": "A crumpled paper roster with crossings-out, a sticky note and a coffee ring",
};

export const guideImage = (slug: string) => ({
  src: `/guides/${slug}.jpg`,
  thumb: `/guides/${slug}-thumb.jpg`,
  alt: ALT[slug] ?? "",
});

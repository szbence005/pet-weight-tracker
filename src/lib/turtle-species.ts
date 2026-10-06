// Suggestions for the "Fajta" field when the animal is a turtle. This is only a list of
// suggestions: the field stays free text, so a species that is missing can still be typed.
// Names are Hungarian common names; `latin` is shown as the secondary label.

type TurtleSpecies = { name: string; latin: string };

// The most commonly kept species come first, in this order.
const COMMON: TurtleSpecies[] = [
	{ name: 'Vörösfülű ékszerteknős', latin: 'Trachemys scripta elegans' },
	{ name: 'Sárgafülű ékszerteknős', latin: 'Trachemys scripta scripta' },
	{ name: 'Cumberland-ékszerteknős', latin: 'Trachemys scripta troostii' },
	{ name: 'Mocsári teknős', latin: 'Emys orbicularis' },
	{ name: 'Görög teknős', latin: 'Testudo hermanni' },
	{ name: 'Mór teknős', latin: 'Testudo graeca' },
	{ name: 'Szegélyes teknős', latin: 'Testudo marginata' },
	{ name: 'Közép-ázsiai teknős', latin: 'Testudo horsfieldii' }
];

// Everything else, sorted alphabetically (Hungarian collation) below the common ones.
const OTHER: TurtleSpecies[] = [
	{ name: 'Aldabrai óriásteknős', latin: 'Aldabrachelys gigantea' },
	{ name: 'Csattanóteknős', latin: 'Chelydra serpentina' },
	{ name: 'Festett teknős', latin: 'Chrysemys picta' },
	{ name: 'Galápagosi óriásteknős', latin: 'Chelonoidis niger' },
	{ name: 'Indiai csillagteknős', latin: 'Geochelone elegans' },
	{ name: 'Karolinai dobozteknős', latin: 'Terrapene carolina' },
	{ name: 'Kínai lágyhéjú teknős', latin: 'Pelodiscus sinensis' },
	{ name: 'Leopárdteknős', latin: 'Stigmochelys pardalis' },
	{ name: 'Palacsintateknős', latin: 'Malacochersus tornieri' },
	{ name: 'Pettyes teknős', latin: 'Clemmys guttata' },
	{ name: 'Pézsmateknős', latin: 'Sternotherus odoratus' },
	{ name: 'Sarkantyús teknős', latin: 'Centrochelys sulcata' },
	{ name: 'Sugarasteknős', latin: 'Astrochelys radiata' },
	{ name: 'Vöröslábú teknős', latin: 'Chelonoidis carbonarius' }
].sort((a, b) => a.name.localeCompare(b.name, 'hu'));

export const TURTLE_SPECIES: readonly TurtleSpecies[] = [...COMMON, ...OTHER];
export const COMMON_TURTLE_COUNT = COMMON.length;

// Represent one polygon part: exterior ring (shell) and optional inner rings (holes).
export type ZonePart = {
  // GeoJSON Position is an array of numbers (e.g. [lng, lat]).
  // Using GeoJSON.Position improves compatibility with existing map code.
  shell: GeoJSON.Position[];
  holes?: GeoJSON.Position[][];
};

export type Zone = {
  name: string;
  // zones is an array of arrays of parts (matches backend shape: Array<Array<{ shell, holes }>>)
  zones: ZonePart[][];
};

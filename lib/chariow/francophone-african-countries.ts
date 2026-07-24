// Curated list of Francophone African countries (CEDEAO/ECOWAS Francophone
// members, Central Africa, and broader Francophone Africa), with correct
// ISO 3166-1 alpha-2 codes. A free-text code field let students type an
// easily-confused code (e.g. "TO" = Tonga, not Togo) which Chariow's phone
// validation then rejected — a select list removes that entire error class.
export const FRANCOPHONE_AFRICAN_COUNTRIES = [
  { code: "DZ", name: "Algérie" },
  { code: "BJ", name: "Bénin" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "CM", name: "Cameroun" },
  { code: "KM", name: "Comores" },
  { code: "CG", name: "Congo (Brazzaville)" },
  { code: "CD", name: "Congo (RDC)" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "DJ", name: "Djibouti" },
  { code: "GA", name: "Gabon" },
  { code: "GN", name: "Guinée" },
  { code: "GQ", name: "Guinée équatoriale" },
  { code: "GW", name: "Guinée-Bissau" },
  { code: "MG", name: "Madagascar" },
  { code: "ML", name: "Mali" },
  { code: "MA", name: "Maroc" },
  { code: "MR", name: "Mauritanie" },
  { code: "NE", name: "Niger" },
  { code: "CF", name: "République centrafricaine" },
  { code: "RW", name: "Rwanda" },
  { code: "SN", name: "Sénégal" },
  { code: "TD", name: "Tchad" },
  { code: "TG", name: "Togo" },
  { code: "TN", name: "Tunisie" },
] as const;

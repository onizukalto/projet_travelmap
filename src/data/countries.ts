/**
 * Les pays et territoires de la carte.
 *
 * Une ligne par entité de world-atlas (110m), plus les 28 petits États membres
 * de l'ONU trop petits pour y figurer : ils sont placés sur la carte par un point.
 *
 * Format d'une ligne : clé|alpha-2|nom|préposition|continent|ONU|rattachement|alias|point
 * - clé : code ISO numérique de world-atlas (ou x-… pour les entités sans code)
 * - préposition : pour « Planifier un voyage au Japon / en France / aux Fidji »
 * - ONU : 1 si membre des 193, 0 sinon
 * - rattachement : alpha-2 de l'État pour lequel compte un territoire dépendant
 * - alias : autres noms acceptés par la recherche, séparés par ;
 * - point : longitude,latitude des petits États sans contour
 */

export type ContinentCode = "EU" | "AS" | "AF" | "NA" | "SA" | "OC";

export const CONTINENTS: Record<ContinentCode, string> = {
  EU: "Europe",
  AS: "Asie",
  AF: "Afrique",
  NA: "Amérique du Nord",
  SA: "Amérique du Sud",
  OC: "Océanie",
};

export const CONTINENT_CODES = Object.keys(CONTINENTS) as ContinentCode[];

/** Nombre de membres de l'ONU : le dénominateur du compteur. */
export const UN_MEMBER_COUNT = 193;

export type Country = {
  key: string;
  numeric: string | null;
  alpha2: string | null;
  name: string;
  prep: string;
  continent: ContinentCode;
  un: boolean;
  parent: string | null;
  aliases: string[];
  point: [number, number] | null;
};

const ROWS = `
242|FJ|Fidji|aux|OC|1
834|TZ|Tanzanie|en|AF|1
732|EH|Sahara occidental|au|AF|0
124|CA|Canada|au|NA|1
840|US|États-Unis|aux|NA|1||USA;Amérique
398|KZ|Kazakhstan|au|AS|1
860|UZ|Ouzbékistan|en|AS|1
598|PG|Papouasie-Nouvelle-Guinée|en|OC|1
360|ID|Indonésie|en|AS|1||Bali
032|AR|Argentine|en|SA|1
152|CL|Chili|au|SA|1
180|CD|République démocratique du Congo|en|AF|1||RDC;Congo-Kinshasa
706|SO|Somalie|en|AF|1
404|KE|Kenya|au|AF|1
729|SD|Soudan|au|AF|1
148|TD|Tchad|au|AF|1
332|HT|Haïti|en|NA|1
214|DO|République dominicaine|en|NA|1
643|RU|Russie|en|EU|1
044|BS|Bahamas|aux|NA|1
238|FK|Malouines|aux|SA|0|GB|Falkland
578|NO|Norvège|en|EU|1
304|GL|Groenland|au|NA|0|DK
260|TF|Terres australes françaises|aux|AF|0|FR|Kerguelen
626|TL|Timor oriental|au|AS|1||Timor-Leste
710|ZA|Afrique du Sud|en|AF|1
426|LS|Lesotho|au|AF|1
484|MX|Mexique|au|NA|1
858|UY|Uruguay|en|SA|1
076|BR|Brésil|au|SA|1
068|BO|Bolivie|en|SA|1
604|PE|Pérou|au|SA|1
170|CO|Colombie|en|SA|1
591|PA|Panama|au|NA|1
188|CR|Costa Rica|au|NA|1
558|NI|Nicaragua|au|NA|1
340|HN|Honduras|au|NA|1
222|SV|Salvador|au|NA|1
320|GT|Guatemala|au|NA|1
084|BZ|Belize|au|NA|1
862|VE|Venezuela|au|SA|1
328|GY|Guyana|au|SA|1
740|SR|Suriname|au|SA|1
250|FR|France|en|EU|1
218|EC|Équateur|en|SA|1
630|PR|Porto Rico|à|NA|0|US
388|JM|Jamaïque|en|NA|1
192|CU|Cuba|à|NA|1
716|ZW|Zimbabwe|au|AF|1
072|BW|Botswana|au|AF|1
516|NA|Namibie|en|AF|1
686|SN|Sénégal|au|AF|1
466|ML|Mali|au|AF|1
478|MR|Mauritanie|en|AF|1
204|BJ|Bénin|au|AF|1
562|NE|Niger|au|AF|1
566|NG|Nigeria|au|AF|1
120|CM|Cameroun|au|AF|1
768|TG|Togo|au|AF|1
288|GH|Ghana|au|AF|1
384|CI|Côte d'Ivoire|en|AF|1
324|GN|Guinée|en|AF|1
624|GW|Guinée-Bissau|en|AF|1
430|LR|Liberia|au|AF|1
694|SL|Sierra Leone|en|AF|1
854|BF|Burkina Faso|au|AF|1
140|CF|Centrafrique|en|AF|1||République centrafricaine
178|CG|Congo|au|AF|1||Congo-Brazzaville
266|GA|Gabon|au|AF|1
226|GQ|Guinée équatoriale|en|AF|1
894|ZM|Zambie|en|AF|1
454|MW|Malawi|au|AF|1
508|MZ|Mozambique|au|AF|1
748|SZ|Eswatini|en|AF|1||Swaziland
024|AO|Angola|en|AF|1
108|BI|Burundi|au|AF|1
376|IL|Israël|en|AS|1
422|LB|Liban|au|AS|1
450|MG|Madagascar|à|AF|1
275|PS|Palestine|en|AS|0
270|GM|Gambie|en|AF|1
788|TN|Tunisie|en|AF|1
012|DZ|Algérie|en|AF|1
400|JO|Jordanie|en|AS|1
784|AE|Émirats arabes unis|aux|AS|1||Dubaï;EAU
634|QA|Qatar|au|AS|1
414|KW|Koweït|au|AS|1
368|IQ|Irak|en|AS|1
512|OM|Oman|à|AS|1
548|VU|Vanuatu|au|OC|1
116|KH|Cambodge|au|AS|1
764|TH|Thaïlande|en|AS|1
418|LA|Laos|au|AS|1
104|MM|Birmanie|en|AS|1||Myanmar
704|VN|Viêt Nam|au|AS|1||Vietnam
408|KP|Corée du Nord|en|AS|1
410|KR|Corée du Sud|en|AS|1
496|MN|Mongolie|en|AS|1
356|IN|Inde|en|AS|1
050|BD|Bangladesh|au|AS|1
064|BT|Bhoutan|au|AS|1
524|NP|Népal|au|AS|1
586|PK|Pakistan|au|AS|1
004|AF|Afghanistan|en|AS|1
762|TJ|Tadjikistan|au|AS|1
417|KG|Kirghizistan|au|AS|1
795|TM|Turkménistan|au|AS|1
364|IR|Iran|en|AS|1
760|SY|Syrie|en|AS|1
051|AM|Arménie|en|AS|1
752|SE|Suède|en|EU|1
112|BY|Biélorussie|en|EU|1||Belarus
804|UA|Ukraine|en|EU|1
616|PL|Pologne|en|EU|1
040|AT|Autriche|en|EU|1
348|HU|Hongrie|en|EU|1
498|MD|Moldavie|en|EU|1
642|RO|Roumanie|en|EU|1
440|LT|Lituanie|en|EU|1
428|LV|Lettonie|en|EU|1
233|EE|Estonie|en|EU|1
276|DE|Allemagne|en|EU|1
100|BG|Bulgarie|en|EU|1
300|GR|Grèce|en|EU|1
792|TR|Turquie|en|AS|1
008|AL|Albanie|en|EU|1
191|HR|Croatie|en|EU|1
756|CH|Suisse|en|EU|1
442|LU|Luxembourg|au|EU|1
056|BE|Belgique|en|EU|1
528|NL|Pays-Bas|aux|EU|1||Hollande
620|PT|Portugal|au|EU|1
724|ES|Espagne|en|EU|1
372|IE|Irlande|en|EU|1
540|NC|Nouvelle-Calédonie|en|OC|0|FR
090|SB|Îles Salomon|aux|OC|1
554|NZ|Nouvelle-Zélande|en|OC|1
036|AU|Australie|en|OC|1
144|LK|Sri Lanka|au|AS|1
156|CN|Chine|en|AS|1
158|TW|Taïwan|à|AS|0
380|IT|Italie|en|EU|1
208|DK|Danemark|au|EU|1
826|GB|Royaume-Uni|au|EU|1||Angleterre;Écosse;Pays de Galles;Grande-Bretagne
352|IS|Islande|en|EU|1
031|AZ|Azerbaïdjan|en|AS|1
268|GE|Géorgie|en|AS|1
608|PH|Philippines|aux|AS|1
458|MY|Malaisie|en|AS|1
096|BN|Brunei|à|AS|1
705|SI|Slovénie|en|EU|1
246|FI|Finlande|en|EU|1
703|SK|Slovaquie|en|EU|1
203|CZ|Tchéquie|en|EU|1||République tchèque
232|ER|Érythrée|en|AF|1
392|JP|Japon|au|AS|1
600|PY|Paraguay|au|SA|1
887|YE|Yémen|au|AS|1
682|SA|Arabie saoudite|en|AS|1
x-chypre-nord||Chypre du Nord|à|EU|0|CY
196|CY|Chypre|à|EU|1
504|MA|Maroc|au|AF|1
818|EG|Égypte|en|AF|1
434|LY|Libye|en|AF|1
231|ET|Éthiopie|en|AF|1
262|DJ|Djibouti|à|AF|1
x-somaliland||Somaliland|au|AF|0|SO
800|UG|Ouganda|en|AF|1
646|RW|Rwanda|au|AF|1
070|BA|Bosnie-Herzégovine|en|EU|1
807|MK|Macédoine du Nord|en|EU|1||Macédoine
688|RS|Serbie|en|EU|1
499|ME|Monténégro|au|EU|1
x-kosovo|XK|Kosovo|au|EU|0
780|TT|Trinité-et-Tobago|à|NA|1
728|SS|Soudan du Sud|au|AF|1
020|AD|Andorre|en|EU|1|||1.52,42.51
028|AG|Antigua-et-Barbuda|à|NA|1|||-61.8,17.08
048|BH|Bahreïn|à|AS|1|||50.56,26.07
052|BB|Barbade|à la|NA|1|||-59.54,13.19
132|CV|Cap-Vert|au|AF|1|||-23.6,15.1
174|KM|Comores|aux|AF|1|||43.87,-11.88
212|DM|Dominique|à la|NA|1|||-61.37,15.41
308|GD|Grenade|à la|NA|1|||-61.68,12.12
296|KI|Kiribati|aux|OC|1|||173.0,1.4
438|LI|Liechtenstein|au|EU|1|||9.55,47.16
462|MV|Maldives|aux|AS|1|||73.5,3.2
470|MT|Malte|à|EU|1|||14.4,35.9
584|MH|Îles Marshall|aux|OC|1|||171.2,7.1
480|MU|Maurice|à|AF|1||Île Maurice|57.55,-20.3
583|FM|Micronésie|en|OC|1|||158.2,6.9
492|MC|Monaco|à|EU|1|||7.42,43.74
520|NR|Nauru|à|OC|1|||166.93,-0.53
585|PW|Palaos|aux|OC|1||Palau|134.58,7.5
659|KN|Saint-Christophe-et-Niévès|à|NA|1||Saint-Kitts|-62.75,17.3
662|LC|Sainte-Lucie|à|NA|1|||-60.98,13.9
670|VC|Saint-Vincent-et-les-Grenadines|à|NA|1|||-61.2,13.25
882|WS|Samoa|aux|OC|1|||-172.1,-13.76
674|SM|Saint-Marin|à|EU|1|||12.46,43.94
678|ST|Sao Tomé-et-Principe|à|AF|1|||6.6,0.3
690|SC|Seychelles|aux|AF|1|||55.45,-4.6
702|SG|Singapour|à|AS|1|||103.82,1.35
776|TO|Tonga|aux|OC|1|||-175.2,-21.2
798|TV|Tuvalu|aux|OC|1|||179.2,-8.5
`;

/** Clés des entités world-atlas qui n'ont pas de code ISO numérique. */
export const UNCODED_FEATURES: Record<string, string> = {
  Kosovo: "x-kosovo",
  "N. Cyprus": "x-chypre-nord",
  Somaliland: "x-somaliland",
};

/** « lon,lat » → [lon, lat], ou null si la valeur n'est pas une paire de nombres valides. */
function parsePoint(value: string | undefined): [number, number] | null {
  if (!value) return null;
  const numbers = value.split(",").map(Number);
  if (numbers.length !== 2 || !numbers.every(Number.isFinite)) return null;
  return [numbers[0], numbers[1]];
}

export const COUNTRIES: Country[] = ROWS.trim()
  .split("\n")
  .map((line) => {
    const [key, alpha2, name, prep, continent, un, parent, aliases, point] = line.split("|");
    return {
      key,
      numeric: key.startsWith("x-") ? null : key,
      alpha2: alpha2 || null,
      name,
      prep,
      continent: continent as ContinentCode,
      un: un === "1",
      parent: parent || null,
      aliases: aliases ? aliases.split(";") : [],
      point: parsePoint(point),
    };
  });

export const COUNTRY_BY_KEY = new Map(COUNTRIES.map((country) => [country.key, country]));
const COUNTRY_BY_ALPHA2 = new Map(
  COUNTRIES.filter((country) => country.alpha2).map((country) => [country.alpha2!, country]),
);

/** État membre de l'ONU pour lequel compte une entité (elle-même, ou son État de rattachement). */
export function countingState(country: Country): string | null {
  if (country.un) return country.alpha2;
  return country.parent;
}

export function countryByAlpha2(alpha2: string) {
  return COUNTRY_BY_ALPHA2.get(alpha2);
}

/** Code à passer au planificateur : le sien, ou celui de son État de rattachement. */
export function plannerCode(country: Country) {
  return country.alpha2 ?? country.parent ?? "";
}

/** Minuscules, sans accents ni ponctuation : « Côte d'Ivoire » → « cote d ivoire ». */
export function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const SEARCH_INDEX = COUNTRIES.map((country) => ({
  country,
  names: [country.name, ...country.aliases].map(normalize),
}));

/** Recherche sur les noms français (et quelques alias), insensible aux accents. */
export function searchCountries(query: string, limit = 8): Country[] {
  const q = normalize(query);
  if (!q) return [];
  const results: { country: Country; score: number }[] = [];
  for (const { country, names } of SEARCH_INDEX) {
    let best = Infinity;
    for (const [index, name] of names.entries()) {
      // Le nom principal passe avant les alias, le début du nom avant le milieu.
      const penalty = index === 0 ? 0 : 0.5;
      if (name.startsWith(q)) best = Math.min(best, 0 + penalty);
      else if (name.split(" ").some((word) => word.startsWith(q))) best = Math.min(best, 1 + penalty);
      else if (name.includes(q)) best = Math.min(best, 2 + penalty);
    }
    if (best < Infinity) results.push({ country, score: best });
  }
  return results
    .sort((a, b) => a.score - b.score || a.country.name.localeCompare(b.country.name, "fr"))
    .slice(0, limit)
    .map((result) => result.country);
}

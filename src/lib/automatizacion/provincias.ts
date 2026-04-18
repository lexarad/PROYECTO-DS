// Mapa de variantes → valor oficial tal como aparece en los selects del MJ
// El Ministerio de Justicia usa nombres con mayúsculas y acentos en sus formularios.

const PROVINCIAS_OFICIALES: Record<string, string> = {
  // Álava / Araba
  'alava': 'Álava',
  'álava': 'Álava',
  'araba': 'Álava',
  // Albacete
  'albacete': 'Albacete',
  // Alicante
  'alicante': 'Alicante/Alacant',
  'alacant': 'Alicante/Alacant',
  'alicante/alacant': 'Alicante/Alacant',
  // Almería
  'almeria': 'Almería',
  'almería': 'Almería',
  // Asturias
  'asturias': 'Asturias',
  // Ávila
  'avila': 'Ávila',
  'ávila': 'Ávila',
  // Badajoz
  'badajoz': 'Badajoz',
  // Islas Baleares
  'baleares': 'Islas Baleares',
  'illes balears': 'Islas Baleares',
  'islas baleares': 'Islas Baleares',
  // Barcelona
  'barcelona': 'Barcelona',
  // Burgos
  'burgos': 'Burgos',
  // Cáceres
  'caceres': 'Cáceres',
  'cáceres': 'Cáceres',
  // Cádiz
  'cadiz': 'Cádiz',
  'cádiz': 'Cádiz',
  // Cantabria
  'cantabria': 'Cantabria',
  // Castellón
  'castellon': 'Castellón/Castelló',
  'castellón': 'Castellón/Castelló',
  'castello': 'Castellón/Castelló',
  'castelló': 'Castellón/Castelló',
  // Ceuta
  'ceuta': 'Ceuta',
  // Ciudad Real
  'ciudad real': 'Ciudad Real',
  // Córdoba
  'cordoba': 'Córdoba',
  'córdoba': 'Córdoba',
  // La Coruña / A Coruña
  'coruña': 'A Coruña',
  'a coruña': 'A Coruña',
  'la coruña': 'A Coruña',
  // Cuenca
  'cuenca': 'Cuenca',
  // Girona
  'girona': 'Girona',
  'gerona': 'Girona',
  // Granada
  'granada': 'Granada',
  // Guadalajara
  'guadalajara': 'Guadalajara',
  // Gipuzkoa
  'guipuzcoa': 'Gipuzkoa',
  'guipúzcoa': 'Gipuzkoa',
  'gipuzkoa': 'Gipuzkoa',
  // Huelva
  'huelva': 'Huelva',
  // Huesca
  'huesca': 'Huesca',
  // Jaén
  'jaen': 'Jaén',
  'jaén': 'Jaén',
  // León
  'leon': 'León',
  'león': 'León',
  // Lleida
  'lleida': 'Lleida',
  'lerida': 'Lleida',
  'lérida': 'Lleida',
  // Lugo
  'lugo': 'Lugo',
  // Madrid
  'madrid': 'Madrid',
  // Málaga
  'malaga': 'Málaga',
  'málaga': 'Málaga',
  // Melilla
  'melilla': 'Melilla',
  // Murcia
  'murcia': 'Murcia',
  // Navarra
  'navarra': 'Navarra',
  'nafarroa': 'Navarra',
  // Ourense
  'ourense': 'Ourense',
  'orense': 'Ourense',
  // Palencia
  'palencia': 'Palencia',
  // Las Palmas
  'las palmas': 'Las Palmas',
  'palmas': 'Las Palmas',
  // Pontevedra
  'pontevedra': 'Pontevedra',
  // La Rioja
  'rioja': 'La Rioja',
  'la rioja': 'La Rioja',
  // Salamanca
  'salamanca': 'Salamanca',
  // Santa Cruz de Tenerife
  'tenerife': 'Santa Cruz de Tenerife',
  'santa cruz de tenerife': 'Santa Cruz de Tenerife',
  // Segovia
  'segovia': 'Segovia',
  // Sevilla
  'sevilla': 'Sevilla',
  // Soria
  'soria': 'Soria',
  // Tarragona
  'tarragona': 'Tarragona',
  // Teruel
  'teruel': 'Teruel',
  // Toledo
  'toledo': 'Toledo',
  // Valencia
  'valencia': 'Valencia/València',
  'valència': 'Valencia/València',
  'valencia/valència': 'Valencia/València',
  // Valladolid
  'valladolid': 'Valladolid',
  // Bizkaia
  'vizcaya': 'Bizkaia',
  'bizkaia': 'Bizkaia',
  // Zamora
  'zamora': 'Zamora',
  // Zaragoza
  'zaragoza': 'Zaragoza',
}

/** Normaliza el nombre de provincia al texto oficial usado en los selects de la sede MJ */
export function normalizarProvincia(input: string): string {
  const key = input.toLowerCase().trim()
  return PROVINCIAS_OFICIALES[key] ?? input
}

/* mySMOOZIZ — données : allergènes, ingrédients, recettes */

/* Les 14 allergènes de l'annexe II du règlement (UE) n° 1169/2011, les 8 fruits à coque
   étant listés un par un, plus quelques entrées complémentaires. */
var NUT_KEYS = ['amande', 'noisette', 'noix', 'cajou', 'pecan', 'bresil', 'pistache', 'macadamia'];

var ALLERGENS = [
  { key: 'amande', label: 'Amande', group: 'coque' },
  { key: 'noisette', label: 'Noisette', group: 'coque' },
  { key: 'noix', label: 'Noix', group: 'coque' },
  { key: 'cajou', label: 'Noix de cajou', group: 'coque' },
  { key: 'pecan', label: 'Noix de pécan', group: 'coque' },
  { key: 'bresil', label: 'Noix du Brésil', group: 'coque' },
  { key: 'pistache', label: 'Pistache', group: 'coque' },
  { key: 'macadamia', label: 'Noix de macadamia', group: 'coque' },
  { key: 'arachide', label: 'Arachide (cacahuète)', group: 'autre' },
  { key: 'lait', label: 'Lait et produits laitiers', group: 'autre' },
  { key: 'soja', label: 'Soja', group: 'autre' },
  { key: 'gluten', label: 'Gluten (blé, avoine…)', group: 'autre' },
  { key: 'celeri', label: 'Céleri', group: 'autre' },
  { key: 'sesame', label: 'Sésame', group: 'autre' },
  { key: 'sulfites', label: 'Sulfites', group: 'autre' },
  { key: 'oeufs', label: 'Œufs', group: 'autre' },
  { key: 'poisson', label: 'Poisson', group: 'autre' },
  { key: 'crustaces', label: 'Crustacés', group: 'autre' },
  { key: 'mollusques', label: 'Mollusques', group: 'autre' },
  { key: 'moutarde', label: 'Moutarde', group: 'autre' },
  { key: 'lupin', label: 'Lupin', group: 'autre' },
  { key: 'coco', label: 'Noix de coco', group: 'autre' },
  { key: 'latex', label: 'Latex (exclut banane, kiwi, avocat)', group: 'autre' }
];

/* Allergies croisées fréquentes : exclusion automatique des deux côtés. */
var LINKED = { cajou: 'pistache', pistache: 'cajou', noix: 'pecan', pecan: 'noix' };

var CATEGORIES = [
  { key: 'fruit', label: 'Fruits', one: 'Fruit' },
  { key: 'legume', label: 'Légumes', one: 'Légume' },
  { key: 'oleagineux', label: 'Oléagineux et graines', one: 'Oléagineux ou graine' },
  { key: 'base', label: 'Laits et bases', one: 'Lait ou base liquide' },
  { key: 'option', label: 'Options', one: 'Option' }
];

/*
  id, name, cat, color
  season  : clé dans SEASONS (absente = pas de donnée)
  frozen  : existe couramment en surgelé
  contains: allergènes présents ou possibles
  family  : allergène ajouté quand on coche l'ingrédient lui-même
  w, cap  : poids relatif et maximum (g pour 33 cl) pour les fruits et légumes
  acid    : mélange acide (peut faire cailler le lait)
  citrus  : agrume
*/
function F(id, name, color, extra) { return Object.assign({ id: id, name: name, cat: 'fruit', color: color, w: 1, cap: 150 }, extra || {}); }
function V(id, name, color, extra) { return Object.assign({ id: id, name: name, cat: 'legume', color: color, w: 0.6, cap: 80 }, extra || {}); }
function N(id, name, color, extra) { return Object.assign({ id: id, name: name, cat: 'oleagineux', color: color, per: 12, cap: 15 }, extra || {}); }
function B(id, name, color, extra) { return Object.assign({ id: id, name: name, cat: 'base', color: color, label: true }, extra || {}); }
function O(id, name, color, per, unit, extra) { return Object.assign({ id: id, name: name, cat: 'option', color: color, per: per, unit: unit }, extra || {}); }

var INGREDIENTS = [
  F('abricot', 'Abricot', '#ff9f2e', { season: 'abricot' }),
  F('ananas', 'Ananas', '#ffd62e', { season: 'ananas', frozen: true }),
  F('avocat', 'Avocat', '#a9cf5a', { season: 'avocat', w: 0.5, cap: 50 }),
  F('banane', 'Banane', '#ffe58a', { season: 'banane', w: 0.9, cap: 110 }),
  F('cassis', 'Cassis', '#6b2a7a', { season: 'cassis', frozen: true, w: 0.45, cap: 60, acid: true, berry: true }),
  F('cerise', 'Cerise', '#b3123f', { season: 'cerise', frozen: true }),
  F('citron', 'Citron (jus)', '#fff04d', { season: 'citron', w: 0.15, cap: 18, acid: true, citrus: true, label: true }),
  F('citron-vert', 'Citron vert (jus)', '#b6f23c', { w: 0.15, cap: 15, acid: true, citrus: true, label: true }),
  F('datte', 'Datte', '#8a5326', { season: 'datte', w: 0.2, cap: 25, contains: ['sulfites'], label: true }),
  F('figue', 'Figue', '#a5456b', { season: 'figue', w: 0.8, cap: 100 }),
  F('fraise', 'Fraise', '#ff3b4e', { season: 'fraise', frozen: true, berry: true }),
  F('framboise', 'Framboise', '#e8276a', { season: 'framboise', frozen: true, w: 0.8, cap: 110, acid: true, berry: true }),
  F('passion', 'Fruit de la passion', '#f2b705', { season: 'fruitdelapassion', w: 0.35, cap: 45, acid: true }),
  F('grenade', 'Grenade', '#c4163c', { season: 'grenade', w: 0.6, cap: 90, acid: true }),
  F('groseille', 'Groseille', '#e0203a', { season: 'groseille', frozen: true, w: 0.4, cap: 50, acid: true, berry: true }),
  F('kaki', 'Kaki', '#f57a1f', { season: 'kaki' }),
  F('kiwi', 'Kiwi', '#7ec82f', { season: 'kiwi', w: 0.8, cap: 110, acid: true }),
  F('litchi', 'Litchi', '#f7d5d9', { w: 0.7, cap: 100 }),
  F('mandarine', 'Mandarine', '#ff8c1a', { season: 'mandarine', acid: true, citrus: true }),
  F('mangue', 'Mangue', '#ffab12', { season: 'mangue', frozen: true }),
  F('melon', 'Melon', '#ffb866', { season: 'melon', cap: 170 }),
  F('mure', 'Mûre', '#46184f', { season: 'mure', frozen: true, w: 0.7, cap: 100, berry: true }),
  F('myrtille', 'Myrtille', '#4b4fb8', { season: 'myrtille', frozen: true, w: 0.7, cap: 100, berry: true }),
  F('nectarine', 'Nectarine', '#ff7f4d', { season: 'nectarine' }),
  F('coco', 'Noix de coco (chair)', '#f4f1e8', { season: 'noixdecoco', w: 0.25, cap: 30, contains: ['coco'], family: 'coco' }),
  F('orange', 'Orange', '#f87217', { season: 'orange', acid: true, citrus: true }),
  F('pamplemousse', 'Pamplemousse', '#ff6f7d', { season: 'pamplemousse', w: 0.7, cap: 110, acid: true, citrus: true }),
  F('papaye', 'Papaye', '#ff8552'),
  F('pasteque', 'Pastèque', '#ff4d5e', { season: 'pasteque', cap: 200 }),
  F('peche', 'Pêche', '#ffa072', { season: 'peche' }),
  F('poire', 'Poire', '#d5e36b', { season: 'poire' }),
  F('pomme', 'Pomme', '#9fe03a', { season: 'pomme' }),
  F('prune', 'Prune', '#8e3a8c', { season: 'prune', w: 0.8, cap: 120 }),
  F('raisin', 'Raisin', '#a77bd1', { season: 'raisin' }),

  V('betterave', 'Betterave cuite', '#a3124f', { season: 'betterave', cap: 60, label: true }),
  V('carotte', 'Carotte', '#ff7a00', { season: 'carotte', cap: 80 }),
  V('celeri', 'Céleri', '#c5e68a', { season: 'celeri', w: 0.35, cap: 40, contains: ['celeri'], family: 'celeri' }),
  V('kale', 'Chou kale', '#2f7d46', { w: 0.2, cap: 20 }),
  V('concombre', 'Concombre', '#8fe0a0', { season: 'concombre', w: 0.8, cap: 110 }),
  V('courgette', 'Courgette', '#b9d977', { season: 'courgette', w: 0.5, cap: 70 }),
  V('epinard', 'Pousses d’épinard', '#2e9e3f', { season: 'epinard', frozen: true, w: 0.2, cap: 25 }),
  V('fenouil', 'Fenouil', '#dcefc4', { season: 'fenouil', w: 0.35, cap: 45 }),
  V('laitue', 'Laitue', '#7fd15a', { season: 'laitue', w: 0.2, cap: 25 }),
  V('tomate', 'Tomate', '#ef3b2c', { season: 'tomate', cap: 100 }),

  N('amande', 'Amande', '#d9a066', { contains: ['amande'], family: 'amande', label: true }),
  N('cacahuete', 'Cacahuète', '#c98a45', { contains: ['arachide'], family: 'arachide', label: true }),
  N('chia', 'Graines de chia', '#8d8f94', { per: 7, cap: 8, label: true }),
  N('noisette', 'Noisette', '#b5773c', { season: 'noisette', contains: ['noisette'], family: 'noisette', label: true }),
  N('noix', 'Noix', '#a97c50', { season: 'noix', contains: ['noix'], family: 'noix', label: true }),
  N('bresil', 'Noix du Brésil', '#caa57a', { per: 4, cap: 4, contains: ['bresil'], family: 'bresil', label: true }),
  N('cajou', 'Noix de cajou', '#ecca8f', { contains: ['cajou'], family: 'cajou', label: true }),
  N('macadamia', 'Noix de macadamia', '#efdcb4', { contains: ['macadamia'], family: 'macadamia', label: true }),
  N('pecan', 'Noix de pécan', '#9c5f33', { contains: ['pecan'], family: 'pecan', label: true }),
  N('pistache', 'Pistache', '#a8c46a', { contains: ['pistache'], family: 'pistache', label: true }),

  B('eau', 'Eau fraîche', '#bfefff', { label: false }),
  B('eau-coco', 'Eau de coco', '#dff6f0', { contains: ['coco'], family: 'coco' }),
  B('fromage-blanc', 'Fromage blanc', '#fbfaf4', { contains: ['lait'], family: 'lait', thick: true }),
  B('lait-vache', 'Lait de vache', '#f6f4ea', { contains: ['lait'], family: 'lait' }),
  B('lait-amande', 'Lait d’amande', '#efe3cc', { contains: ['amande'], family: 'amande' }),
  B('lait-avoine', 'Lait d’avoine', '#e9dcbc', { contains: ['gluten', 'avoine'], family: 'avoine' }),
  B('lait-coco', 'Lait de coco (boisson)', '#fdfbf0', { contains: ['coco'], family: 'coco' }),
  B('lait-noisette', 'Lait de noisette', '#dfc6a4', { contains: ['noisette'], family: 'noisette' }),
  B('lait-riz', 'Lait de riz', '#f3efe0', { contains: ['riz'], family: 'riz' }),
  B('lait-soja', 'Lait de soja', '#efe6c8', { contains: ['soja'], family: 'soja' }),
  B('yaourt', 'Yaourt nature', '#fffdf5', { contains: ['lait'], family: 'lait', thick: true }),
  B('yaourt-soja', 'Yaourt au soja', '#f4edd2', { contains: ['soja'], family: 'soja', thick: true }),

  O('basilic', 'Basilic frais', '#3fae4a', 4, 'feuille'),
  O('cacao', 'Cacao en poudre non sucré', '#6e3b22', 6, 'g', { contains: ['cacao'], family: 'cacao', traces: true, label: true }),
  O('cafe', 'Café refroidi', '#4a2c1d', 50, 'ml', { label: true }),
  O('cannelle', 'Cannelle', '#b4622a', 1, 'pincee', { label: true }),
  O('chocolat', 'Chocolat noir', '#4b2415', 10, 'g', { contains: ['cacao', 'lait', 'soja'], family: 'cacao', traces: true, label: true }),
  O('curcuma', 'Curcuma', '#f0a500', 1, 'pincee', { label: true }),
  O('avoine', 'Flocons d’avoine', '#d8bd85', 12, 'g', { contains: ['gluten', 'avoine'], family: 'avoine', label: true }),
  O('gingembre', 'Gingembre frais', '#e8c66a', 3, 'g'),
  O('menthe', 'Menthe fraîche', '#35c76b', 5, 'feuille'),
  O('miel', 'Miel', '#f5b52a', 7, 'g', { label: true }),
  O('vanille', 'Extrait de vanille', '#c9a37a', 3, 'goutte', { label: true })
];

/* r(nom, fruits et légumes, oléagineux, base, options) */
function r(name, produce, nuts, base, options) { return { name: name, produce: produce, nuts: nuts, base: base, options: options }; }

var RECIPES = [
  r('Soleil du matin', ['mangue', 'orange', 'banane'], [], 'eau', []),
  r('Orange mécanique douce', ['orange', 'carotte', 'pomme'], [], 'eau', ['gingembre']),
  r('Mandarine givrée', ['mandarine', 'banane'], [], 'lait-riz', ['cannelle']),
  r('Rouge velours', ['fraise', 'framboise', 'banane'], [], 'yaourt', []),
  r('Vert pétillant', ['pomme', 'kiwi', 'epinard'], [], 'eau', ['menthe']),
  r('Lagon', ['ananas', 'banane'], [], 'lait-coco', ['citron-vert']),
  r('Poire cocooning', ['poire', 'banane'], ['noix'], 'lait-avoine', ['cannelle']),
  r('Kaki doudou', ['kaki', 'banane'], [], 'lait-amande', ['vanille']),
  r('Kiwi tonique', ['kiwi', 'poire'], [], 'eau', ['menthe']),
  r('Pomme-betterave rubis', ['pomme', 'betterave', 'orange'], [], 'eau', ['gingembre']),
  r('Grenade éclatante', ['grenade', 'orange', 'banane'], [], 'eau', []),
  r('Pamplemousse rosé', ['pamplemousse', 'poire', 'banane'], [], 'eau', ['menthe']),
  r('Jardin croquant', ['concombre', 'pomme', 'fenouil'], [], 'eau', ['citron']),
  r('Carotte des tropiques', ['carotte', 'mangue', 'orange'], [], 'eau-coco', ['curcuma']),
  r('Choco-banane', ['banane'], ['noisette'], 'lait-vache', ['cacao']),
  r('Moka réveil', ['banane', 'datte'], ['amande'], 'lait-amande', ['cafe', 'cacao']),
  r('Brownie à boire', ['banane', 'cerise'], [], 'lait-soja', ['chocolat']),
  r('Myrtille nuage', ['myrtille', 'banane'], ['chia'], 'fromage-blanc', []),
  r('Mûre sauvage', ['mure', 'pomme', 'banane'], [], 'yaourt-soja', []),
  r('Cassis punch', ['cassis', 'poire', 'banane'], [], 'eau', []),
  r('Pêche melba', ['peche', 'framboise'], ['amande'], 'yaourt', ['vanille']),
  r('Abricot soleil', ['abricot', 'nectarine'], [], 'yaourt', ['basilic']),
  r('Cerise gourmande', ['cerise', 'banane'], ['pistache'], 'lait-riz', ['vanille']),
  r('Pastèque fraîcheur', ['pasteque', 'fraise'], [], 'eau', ['menthe', 'citron-vert']),
  r('Melon menthol', ['melon', 'concombre'], [], 'eau', ['menthe', 'citron-vert']),
  r('Figue et miel', ['figue', 'poire'], ['noix'], 'yaourt', ['miel']),
  r('Raisin d’automne', ['raisin', 'pomme', 'banane'], ['pecan'], 'eau', ['cannelle']),
  r('Prune épicée', ['prune', 'banane'], [], 'lait-avoine', ['cannelle', 'gingembre']),
  r('Passion exotique', ['passion', 'mangue', 'banane'], [], 'eau-coco', []),
  r('Litchi rosé', ['litchi', 'framboise', 'banane'], [], 'lait-riz', []),
  r('Papaye vitaminée', ['papaye', 'ananas'], [], 'eau', ['citron-vert', 'gingembre']),
  r('Avocat velouté', ['avocat', 'banane', 'epinard'], ['cajou'], 'lait-amande', []),
  r('Kale tropical', ['kale', 'ananas', 'mangue'], [], 'eau', ['citron-vert']),
  r('Gazpacho à boire', ['tomate', 'concombre'], [], 'eau', ['basilic', 'citron']),
  r('Petit-déj complet', ['banane', 'pomme'], ['cacahuete'], 'lait-soja', ['avoine']),
  r('Coco-fraise', ['fraise', 'banane', 'coco'], [], 'lait-coco', []),
  r('Rose fruitée', ['fraise', 'melon'], [], 'eau', ['basilic']),
  r('Agrumes en fête', ['orange', 'mandarine', 'ananas'], [], 'eau', ['gingembre']),
  r('Courgette incognito', ['courgette', 'banane', 'mangue'], [], 'lait-riz', []),
  r('Douceur macadamia', ['mangue', 'banane'], ['macadamia'], 'lait-riz', ['vanille']),
  r('Brésil chocolaté', ['banane', 'poire'], ['bresil'], 'lait-riz', ['cacao'])
];

/* Affinités de goût utilisées par « Surprends-moi ! » */
var PAIRS = {
  abricot: ['peche', 'framboise', 'nectarine', 'amande', 'basilic', 'vanille', 'orange', 'pistache'],
  ananas: ['mangue', 'banane', 'coco', 'passion', 'concombre', 'menthe', 'gingembre', 'citron-vert', 'epinard', 'basilic'],
  avocat: ['banane', 'citron-vert', 'mangue', 'cacao', 'epinard', 'ananas', 'concombre'],
  banane: ['fraise', 'mangue', 'cacao', 'cacahuete', 'noisette', 'cafe', 'cannelle', 'kiwi', 'myrtille', 'datte'],
  cassis: ['poire', 'banane', 'pomme', 'vanille', 'myrtille'],
  cerise: ['banane', 'cacao', 'amande', 'vanille', 'pistache', 'framboise', 'chocolat'],
  figue: ['poire', 'miel', 'noix', 'framboise', 'cannelle', 'orange'],
  fraise: ['banane', 'basilic', 'menthe', 'pasteque', 'betterave', 'vanille', 'coco', 'melon'],
  framboise: ['peche', 'litchi', 'betterave', 'cacao', 'pistache', 'banane', 'pomme', 'menthe'],
  grenade: ['orange', 'betterave', 'pomme', 'framboise', 'gingembre', 'banane'],
  kaki: ['banane', 'cannelle', 'orange', 'vanille', 'poire', 'gingembre', 'noix'],
  kiwi: ['pomme', 'banane', 'epinard', 'menthe', 'concombre', 'poire', 'ananas'],
  litchi: ['framboise', 'citron-vert', 'menthe', 'concombre', 'fraise'],
  mandarine: ['banane', 'carotte', 'cannelle', 'gingembre', 'grenade', 'kaki', 'vanille', 'cacao'],
  mangue: ['passion', 'carotte', 'coco', 'curcuma', 'citron-vert', 'banane', 'cajou', 'tomate'],
  melon: ['concombre', 'menthe', 'basilic', 'peche', 'citron-vert', 'gingembre', 'fraise'],
  mure: ['pomme', 'banane', 'vanille', 'poire', 'noisette'],
  myrtille: ['banane', 'amande', 'cannelle', 'avoine', 'citron', 'pomme', 'epinard'],
  nectarine: ['peche', 'framboise', 'basilic', 'amande', 'gingembre'],
  orange: ['carotte', 'gingembre', 'mangue', 'betterave', 'cannelle', 'cacao', 'fenouil', 'banane', 'cafe'],
  pamplemousse: ['poire', 'menthe', 'fraise', 'banane', 'fenouil', 'miel'],
  papaye: ['ananas', 'citron-vert', 'banane', 'gingembre', 'orange'],
  pasteque: ['fraise', 'menthe', 'concombre', 'citron-vert', 'basilic', 'tomate'],
  peche: ['framboise', 'basilic', 'vanille', 'amande', 'melon', 'gingembre'],
  poire: ['noisette', 'cacao', 'gingembre', 'cannelle', 'fenouil', 'kiwi', 'pecan', 'cassis'],
  pomme: ['carotte', 'celeri', 'betterave', 'cannelle', 'kiwi', 'epinard', 'noix', 'fenouil', 'concombre', 'gingembre'],
  prune: ['cannelle', 'banane', 'vanille', 'noix', 'gingembre'],
  raisin: ['pomme', 'noix', 'poire', 'cannelle', 'fenouil']
};

/* Pour l'estimation « personnes allergiques » : mots-clés cherchés dans le nom
   d'un ingrédient ajouté à la main (comparaison sans accents). */
var KEYWORDS = {
  lait: ['lait', 'yaourt', 'yoghourt', 'yogourt', 'fromage', 'creme', 'beurre', 'lactose', 'lactoserum', 'whey', 'skyr', 'kefir', 'petit suisse', 'glace', 'mascarpone', 'ricotta', 'nutella', 'pate a tartiner', 'caramel'],
  arachide: ['arachide', 'cacahuete', 'cacahouete', 'cacahouette', 'peanut'],
  soja: ['soja', 'soya', 'tofu', 'edamame', 'nutella', 'pate a tartiner'],
  gluten: ['gluten', 'ble', 'avoine', 'orge', 'seigle', 'epeautre', 'kamut', 'muesli', 'granola', 'biscuit', 'speculoos', 'cereale', 'malt'],
  avoine: ['avoine', 'muesli', 'granola'],
  riz: ['riz'],
  amande: ['amande', 'praline', 'frangipane', 'amaretto', 'orgeat'],
  noisette: ['noisette', 'praline', 'nutella', 'pate a tartiner', 'gianduja'],
  noix: ['noix(?! de (?:coco|cajou|pecan|macadamia|muscade))'],
  cajou: ['cajou'],
  pecan: ['pecan'],
  bresil: ['bresil', 'amazonie'],
  pistache: ['pistache'],
  macadamia: ['macadamia', 'queensland'],
  coco: ['coco'],
  cacao: ['cacao', 'chocolat', 'nutella', 'pate a tartiner'],
  celeri: ['celeri'],
  sesame: ['sesame', 'tahin', 'tahini', 'halva'],
  sulfites: ['sulfite', 'vin', 'fruits secs', 'abricot sec'],
  oeufs: ['oeuf'],
  poisson: ['poisson'],
  crustaces: ['crustace', 'crevette', 'crabe'],
  mollusques: ['mollusque', 'huitre', 'moule'],
  moutarde: ['moutarde'],
  lupin: ['lupin'],
  latex: []
};

if (typeof module !== 'undefined') {
  module.exports = { NUT_KEYS: NUT_KEYS, ALLERGENS: ALLERGENS, LINKED: LINKED, CATEGORIES: CATEGORIES, INGREDIENTS: INGREDIENTS, RECIPES: RECIPES, PAIRS: PAIRS, KEYWORDS: KEYWORDS };
}

/* mySMOOZIZ — règles : allergies, goûts, proportions, suggestions.
   Aucune dépendance à l'écran, pour pouvoir être testé séparément. */
var Engine = (function (D) {
  'use strict';

  var SIZES = [
    { ml: 330, label: 'Petit', detail: '33 cl' },
    { ml: 600, label: 'Moyen', detail: '60 cl' },
    { ml: 1000, label: 'Grand', detail: '1 L' }
  ];
  var LIMITS = { produce: 4, nuts: 2, options: 2 };
  var LATEX_ITEMS = ['banane', 'kiwi', 'avocat'];
  var UNSPECIFIED_NUT = 'coque';

  var builtin = {};
  D.INGREDIENTS.forEach(function (i) { builtin[i.id] = i; });

  var allergenLabel = {};
  D.ALLERGENS.forEach(function (a) { allergenLabel[a.key] = a.label; });
  allergenLabel[UNSPECIFIED_NUT] = 'Fruit à coque non précisé';
  allergenLabel.avoine = 'Avoine';
  allergenLabel.riz = 'Riz';
  allergenLabel.cacao = 'Cacao';

  var KNOWN_KEYS = Object.keys(allergenLabel);

  function has(list, x) { return list.indexOf(x) !== -1; }
  function add(list, x) { if (!has(list, x)) list.push(x); }

  /* ---------- profil ---------- */

  function defaultProfile() {
    return { version: 1, confirmed: false, allergens: [], items: [], caution: true,
      likes: [], dislikes: [], hidden: [], custom: [], size: 330, nextId: 1 };
  }

  function isStrings(a) { return Array.isArray(a) && a.every(function (s) { return typeof s === 'string'; }); }

  /* Renvoie le profil s'il est entièrement lisible, sinon null (on redemande alors les allergies). */
  function validateProfile(p) {
    if (!p || typeof p !== 'object' || p.version !== 1) return null;
    if (typeof p.confirmed !== 'boolean' || typeof p.caution !== 'boolean') return null;
    var lists = ['allergens', 'items', 'likes', 'dislikes', 'hidden'];
    for (var i = 0; i < lists.length; i++) if (!isStrings(p[lists[i]])) return null;
    if (!p.allergens.every(function (k) { return has(KNOWN_KEYS, k); })) return null;
    if (!Array.isArray(p.custom)) return null;
    var okCustom = p.custom.every(function (c) {
      return c && typeof c.id === 'string' && typeof c.name === 'string' && c.custom === true &&
        D.CATEGORIES.some(function (k) { return k.key === c.cat; }) &&
        isStrings(c.contains) && isStrings(c.madeOf) && isStrings(c.verified) &&
        typeof c.color === 'string';
    });
    if (!okCustom) return null;
    p.custom.forEach(function (c) {
      if ('kcal' in c && !(typeof c.kcal === 'number' && c.kcal >= 0 && c.kcal <= 900)) delete c.kcal;
    });
    var ids = {};
    D.INGREDIENTS.forEach(function (g) { ids[g.id] = true; });
    p.custom.forEach(function (c) { ids[c.id] = true; });
    if (!p.items.every(function (id) { return ids[id]; })) return null;
    if (!SIZES.some(function (s) { return s.ml === p.size; })) p.size = 330;
    if (typeof p.nextId !== 'number') p.nextId = p.custom.length + 1;
    return p;
  }

  function find(id, profile) {
    if (builtin[id]) return builtin[id];
    var c = profile.custom;
    for (var i = 0; i < c.length; i++) if (c[i].id === id) return c[i];
    return null;
  }

  function everyIngredient(profile) { return D.INGREDIENTS.concat(profile.custom); }

  /* ---------- allergies ---------- */

  /* Ensemble complet de ce qui doit être écarté : choix de la personne,
     famille de chaque ingrédient coché, allergies croisées, latex. */
  function exclusions(profile) {
    var keys = profile.allergens.slice();
    var items = profile.items.slice();
    profile.items.forEach(function (id) {
      var ing = find(id, profile);
      if (!ing) return;
      if (ing.family) add(keys, ing.family);
      /* Ingrédient ajouté à la main et coché : par prudence, ses allergènes déclarés sont exclus aussi. */
      if (ing.custom) ing.contains.forEach(function (k) {
        (k === UNSPECIFIED_NUT ? D.NUT_KEYS : [k]).forEach(function (n) { add(keys, n); });
      });
    });
    keys.slice().forEach(function (k) { if (D.LINKED[k]) add(keys, D.LINKED[k]); });
    if (has(keys, 'latex')) LATEX_ITEMS.forEach(function (id) { add(items, id); });
    var nutRisk = keys.some(function (k) { return k === 'arachide' || has(D.NUT_KEYS, k); });
    return { keys: keys, items: items, nutRisk: nutRisk, active: keys.length + items.length > 0 };
  }

  function signature(profile) {
    var e = exclusions(profile);
    return e.keys.map(function (k) { return 'a:' + k; }).concat(e.items.map(function (i) { return 'i:' + i; }));
  }

  function normalize(s) {
    return String(s).toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function nameHas(name, word) {
    return new RegExp('(^| )' + word.split(' ').join('s? ') + '(s|x)?( |$)').test(name);
  }

  function labelOf(keys) {
    return keys.map(function (k) { return (allergenLabel[k] || k).replace(/ \(.*\)/, '').toLowerCase(); }).join(', ');
  }

  /* Raison d'exclusion pour allergie, ou null. */
  function allergyReason(ing, profile, ex) {
    ex = ex || exclusions(profile);
    if (!ex.active) return null;
    if (has(ex.items, ing.id)) return 'allergie';
    var contains = ing.contains || [];
    var hit = contains.filter(function (k) { return has(ex.keys, k); });
    if (hit.length) return 'allergie : ' + labelOf(hit);

    if (ing.custom) {
      if (has(contains, UNSPECIFIED_NUT) && ex.keys.some(function (k) { return has(D.NUT_KEYS, k); })) {
        return 'allergie : fruit à coque';
      }
      if (ing.madeOf.some(function (id) {
        var part = find(id, profile);
        return has(ex.items, id) || (part && (part.contains || []).some(function (k) { return has(ex.keys, k); }));
      })) return 'allergie : un de ses composants';
      var name = normalize(ing.name);
      var byName = ex.keys.some(function (k) {
        return (D.KEYWORDS[k] || []).some(function (w) { return nameHas(name, w); });
      }) || ex.items.some(function (id) {
        var other = find(id, profile);
        if (!other) return false;
        var word = other.custom ? normalize(other.name) : normalize(id);
        return word && nameHas(name, word);
      });
      if (byName) return 'allergie : d’après son nom';
    }

    if (profile.caution && ex.nutRisk) {
      var nutLike = (ing.cat === 'oleagineux' && ing.id !== 'chia') || ing.traces ||
        contains.some(function (k) { return k === 'arachide' || k === UNSPECIFIED_NUT || has(D.NUT_KEYS, k); }) ||
        (ing.custom && /(^| )(muesli|granola|praline|nougat|noix(?! de coco))/.test(normalize(ing.name)));
      if (nutLike) return 'prudence : risque de traces';
    }

    if (ing.custom) {
      var unchecked = signature(profile).some(function (s) { return !has(ing.verified, s); });
      if (unchecked) return 'à revérifier pour vos allergies';
    }
    return null;
  }

  function status(ing, profile, ex) {
    var a = allergyReason(ing, profile, ex);
    if (a) return { ok: false, kind: 'allergy', reason: a };
    if (has(profile.hidden, ing.id)) return { ok: false, kind: 'hidden', reason: 'retiré' };
    if (has(profile.dislikes, ing.id)) return { ok: false, kind: 'dislike', reason: 'pas pour moi' };
    return { ok: true, kind: null, reason: null };
  }

  function usable(id, profile, ex) {
    var ing = find(id, profile);
    return !!ing && status(ing, profile, ex).ok;
  }

  function idsOf(sel) {
    return sel.produce.concat(sel.nuts, sel.base ? [sel.base] : [], sel.options);
  }

  function allowed(sel, profile, ex) {
    ex = ex || exclusions(profile);
    return idsOf(sel).every(function (id) { return usable(id, profile, ex); });
  }

  /* Dernier contrôle avant affichage d'une recette. */
  function assertSafe(recipe, profile) {
    if (!profile.confirmed) return false;
    var ex = exclusions(profile);
    return recipe.items.every(function (it) { return usable(it.id, profile, ex); });
  }

  /* ---------- proportions ---------- */

  function shareProduce(list, target) {
    var out = {}, active = list.slice(), left = target;
    while (active.length) {
      var sum = active.reduce(function (t, i) { return t + (i.w || 0.7); }, 0);
      var capped = active.filter(function (i) { return left * (i.w || 0.7) / sum > (i.cap || 100); });
      if (!capped.length) {
        active.forEach(function (i) { out[i.id] = left * (i.w || 0.7) / sum; });
        break;
      }
      capped.forEach(function (i) { out[i.id] = i.cap || 100; left -= out[i.id]; });
      active = active.filter(function (i) { return !has(capped, i); });
    }
    return out;
  }

  function round(v) {
    if (v >= 100) return Math.round(v / 10) * 10;
    if (v >= 20) return Math.round(v / 5) * 5;
    return Math.max(1, Math.round(v));
  }

  function build(sel, size, profile, name) {
    if (!profile.confirmed) throw new Error('profil non confirmé');
    if (!sel.base || !sel.produce.length) throw new Error('sélection incomplète');
    var ex = exclusions(profile);
    if (!allowed(sel, profile, ex)) throw new Error('ingrédient exclu');
    var get = function (id) { return find(id, profile); };
    var produce = sel.produce.map(get), nuts = sel.nuts.map(get), options = sel.options.map(get);
    var f = size / 330;

    var nutItems = nuts.map(function (n) {
      return { id: n.id, unit: 'g', base: Math.min((n.per || 12) / nuts.length, n.cap || 15) };
    });
    var optItems = options.map(function (o) {
      return { id: o.id, unit: o.unit || 'g', base: o.per || 5 };
    });
    var extra = nutItems.concat(optItems).reduce(function (t, i) {
      return t + (i.unit === 'g' || i.unit === 'ml' ? i.base : 0);
    }, 0);

    var shares = shareProduce(produce, 180);
    var fruitTotal = produce.reduce(function (t, p) { return t + shares[p.id]; }, 0);
    var shrink = fruitTotal + extra > 230 ? (230 - extra) / fruitTotal : 1;
    var produceItems = produce.map(function (p) { return { id: p.id, unit: 'g', base: shares[p.id] * shrink }; });
    var solid = fruitTotal * shrink + extra;
    var liquid = Math.max(100, 330 - solid);

    var base = get(sel.base);
    var baseItems;
    if (base.thick && usable('eau', profile, ex)) {
      baseItems = [{ id: base.id, unit: 'g', base: liquid * 2 / 3 }, { id: 'eau', unit: 'ml', base: liquid / 3 }];
    } else {
      baseItems = [{ id: base.id, unit: base.thick ? 'g' : 'ml', base: liquid }];
    }

    var items = baseItems.concat(produceItems, nutItems, optItems).map(function (i) {
      var counted = i.unit !== 'g' && i.unit !== 'ml';
      var qty = counted ? Math.max(1, Math.round(i.base * f)) : round(i.base * f);
      return { id: i.id, unit: i.unit, qty: qty, vol: counted ? 0 : qty };
    });

    return { name: name, size: size, items: items,
      sel: { produce: sel.produce.slice(), nuts: sel.nuts.slice(), base: sel.base, options: sel.options.slice() } };
  }

  /* Total indicatif en kcal : quantité (g, ou ml compté pour 1 g) x valeur pour 100 g.
     Les pincées, feuilles et gouttes ne sont pas comptées. S'il manque une seule valeur,
     aucun total n'est donné. */
  function calories(recipe, profile, table) {
    var total = 0, missing = [];
    recipe.items.forEach(function (item) {
      if (item.unit !== 'g' && item.unit !== 'ml') return;
      var ing = find(item.id, profile);
      var value = ing.custom ? ing.kcal : (Object.prototype.hasOwnProperty.call(table, item.id) ? table[item.id] : null);
      if (typeof value !== 'number') missing.push(ing.name);
      else total += item.qty * value / 100;
    });
    return { kcal: missing.length ? null : total, missing: missing };
  }

  /* Saisie d'une valeur « kcal pour 100 g » : null si vide, NaN si invalide. */
  function parseKcal(text) {
    var t = String(text == null ? '' : text).trim().replace(',', '.');
    if (!t) return null;
    if (!/^\d+(\.\d+)?$/.test(t)) return NaN;
    var n = Number(t);
    return n <= 900 ? n : NaN;
  }

  function formatQty(item) {
    var q = item.qty;
    if (item.unit === 'g') return q + ' g';
    if (item.unit === 'ml') return q + ' ml';
    var words = { pincee: 'pincée', feuille: 'feuille', goutte: 'goutte' };
    return q + ' ' + words[item.unit] + (q > 1 ? 's' : '');
  }

  /* ---------- choix de la base ---------- */

  var BASES_ACID = ['eau-coco', 'eau', 'yaourt-soja', 'yaourt', 'lait-riz', 'lait-amande'];
  var BASES_SOFT = ['lait-amande', 'lait-riz', 'lait-avoine', 'lait-soja', 'lait-vache', 'yaourt', 'lait-noisette', 'lait-coco', 'yaourt-soja', 'fromage-blanc', 'eau-coco', 'eau'];

  var CURDLES = ['lait-vache', 'lait-soja'];

  function isAcid(produce, profile) {
    return produce.some(function (id) { var i = find(id, profile); return i && i.acid; });
  }

  function baseChoices(produce, profile) {
    var ex = exclusions(profile);
    var order = isAcid(produce, profile) ? BASES_ACID : BASES_SOFT;
    var mine = profile.custom.filter(function (c) { return c.cat === 'base'; }).map(function (c) { return c.id; });
    var all = order.concat(BASES_SOFT.filter(function (b) { return !has(order, b); }), mine);
    var ok = all.filter(function (id) { return usable(id, profile, ex); });
    var liked = ok.filter(function (id) { return has(profile.likes, id); });
    var sorted = liked.concat(ok.filter(function (id) { return !has(liked, id); }));
    if (!isAcid(produce, profile)) return sorted;
    /* Avec un fruit acide, les laits qui peuvent cailler passent en dernier. */
    var curdles = function (id) { return has(CURDLES, id); };
    return sorted.filter(function (id) { return !curdles(id); }).concat(sorted.filter(curdles));
  }

  function compose(sel, size, profile) {
    var base = sel.base && sel.base !== 'auto' ? sel.base : baseChoices(sel.produce, profile)[0];
    if (!base) return null;
    var full = { produce: sel.produce, nuts: sel.nuts, base: base, options: sel.options };
    return build(full, size, profile, 'Mon mélange');
  }

  /* ---------- saisons ---------- */

  function inSeason(ing, month, seasons) {
    if (!ing.season || !seasons[ing.season]) return null;
    return has(seasons[ing.season], month);
  }

  function recipeInSeason(recipe, month, profile, seasons) {
    var known = recipe.produce.map(function (id) { return inSeason(find(id, profile), month, seasons); });
    return known.every(function (v) { return v !== false; }) && known.some(function (v) { return v === true; });
  }

  /* ---------- idées ---------- */

  function ideas(profile) {
    var ex = exclusions(profile);
    if (!profile.confirmed) return [];
    return D.RECIPES.filter(function (rc) { return allowed(rc, profile, ex); });
  }

  /* Filtres de la page Idées. Ils trient l'affichage et ne remplacent pas les allergies. */
  function hasMilk(sel, profile) {
    return idsOf(sel).some(function (id) { return has(find(id, profile).contains || [], 'lait'); });
  }

  function hasNuts(sel, profile) {
    return idsOf(sel).some(function (id) {
      var i = find(id, profile);
      return i.cat === 'oleagineux' || (i.contains || []).some(function (k) { return k === 'arachide' || has(D.NUT_KEYS, k); });
    });
  }

  function filterRecipes(list, f, profile, month, seasons) {
    return list.filter(function (rc) {
      var ids = idsOf(rc);
      return f.with.every(function (id) { return has(ids, id); }) &&
        !(f.noMilk && hasMilk(rc, profile)) &&
        !(f.noNuts && hasNuts(rc, profile)) &&
        !(f.season && !recipeInSeason(rc, month, profile, seasons));
    });
  }

  /* ---------- énergie : toujours pour un verre de 33 cl ---------- */

  var ENERGY = [
    { level: 1, max: 120, label: 'Peu calorique' },
    { level: 2, max: 300, label: 'Moyennement calorique' },
    { level: 3, max: 500, label: 'Calorique' },
    { level: 4, max: Infinity, label: 'Très calorique' }
  ];

  /* Classement sur la valeur arrondie à la dizaine, la même que celle affichée. */
  function energyOf(kcal) {
    var shown = Math.round(kcal / 10) * 10;
    return ENERGY.filter(function (e) { return shown <= e.max; })[0];
  }

  function energy(sel, profile, table) {
    var c = calories(build(sel, 330, profile, ''), profile, table);
    return c.kcal === null ? null : Object.assign({ kcal: c.kcal }, energyOf(c.kcal));
  }

  /* ---------- surprise ---------- */

  var CHOCO_OPTIONS = ['cacao', 'chocolat', 'cafe'];
  var WATERY = ['pasteque', 'melon'];
  var FRESH_BASES = ['eau', 'eau-coco', 'yaourt', 'yaourt-soja'];

  /* Un fruit ou légume peut rejoindre le mélange si chaque duo a été relevé dans une recette,
     avec un seul ingrédient original et un seul légume au plus. Les citrons restent à part. */
  function canJoin(id, produce) {
    var i = builtin[id];
    if (!i || !/fruit|legume/.test(i.cat) || has(produce, id) || id === 'citron' || id === 'citron-vert') return false;
    if (!produce.every(function (p) { return has(D.DUOS[id] || [], p); })) return false;
    var original = function (x) { return !has(D.COMMONS, x); };
    if (original(id) && produce.some(original)) return false;
    return !(i.cat === 'legume' && produce.some(function (p) { return builtin[p].cat === 'legume'; }));
  }

  var PREFIXES = ['Tornade', 'Comète', 'Pépite', 'Étincelle', 'Vague', 'Fanfare', 'Éclipse', 'Boussole', 'Pirouette', 'Escapade'];

  function shortName(ing) {
    var s = { passion: 'passion', epinard: 'épinard', kale: 'kale', coco: 'coco', betterave: 'betterave' }[ing.id];
    return s || ing.name.replace(/\s*\(.*\)/, '').toLowerCase();
  }

  function pickWeighted(list, weight, rand) {
    var total = list.reduce(function (t, x) { return t + weight(x); }, 0);
    var r = rand() * total;
    for (var i = 0; i < list.length; i++) { r -= weight(list[i]); if (r < 0) return list[i]; }
    return list[list.length - 1];
  }

  function partners(id) {
    var out = (D.PAIRS[id] || []).slice();
    Object.keys(D.PAIRS).forEach(function (k) { if (has(D.PAIRS[k], id)) add(out, k); });
    return out;
  }

  function keyOf(s) { return s.produce.concat(s.options).sort().join('+'); }

  function surprise(profile, month, seasons, rand, previous) {
    rand = rand || Math.random;
    if (!profile.confirmed) return null;
    var ex = exclusions(profile);
    var ok = function (id) { return builtin[id] && usable(id, profile, ex); };
    var mains = D.INGREDIENTS.filter(function (i) { return i.cat === 'fruit' && i.w >= 0.7 && ok(i.id); });
    if (!mains.length) mains = D.INGREDIENTS.filter(function (i) { return (i.cat === 'fruit' || i.cat === 'legume') && ok(i.id); });
    if (!mains.length) return null;
    var weight = function (id) {
      var i = builtin[id], s = inSeason(i, month, seasons);
      var w = s === true ? 3 : (s === false ? (i.frozen ? 1 : 0.15) : 1);
      return has(profile.likes, id) ? w * 4 : w;
    };
    var known = {};
    D.RECIPES.forEach(function (rc) { known[keyOf(rc)] = true; });

    var best = null;
    for (var attempt = 0; attempt < 60; attempt++) {
      var main = pickWeighted(mains.map(function (i) { return i.id; }), weight, rand);
      var produce = [main];
      var wanted = rand() < 0.5 ? 2 : 3;
      while (produce.length < wanted) {
        var pool = (D.DUOS[main] || []).filter(function (id) { return ok(id) && canJoin(id, produce); });
        if (!pool.length) break;
        produce.push(pickWeighted(pool, weight, rand));
      }
      var choco = produce.every(function (p) { return has(D.CHOCO_FRUITS, p); });
      var twists = partners(main).filter(function (id) {
        return ok(id) && builtin[id].cat === 'option' && (choco || !has(CHOCO_OPTIONS, id));
      });
      var options = twists.length ? [twists[Math.floor(rand() * twists.length)]] : [];
      var nutPool = partners(main).filter(function (id) { return ok(id) && builtin[id].cat === 'oleagineux'; });
      var nuts = nutPool.length && rand() < 0.4 ? [nutPool[Math.floor(rand() * nutPool.length)]] : [];
      var bases = baseChoices(produce, profile);
      if (isAcid(produce, profile)) bases = bases.filter(function (id) { return !has(CURDLES, id); });
      /* Fruits très aqueux et légumes : bases fraîches. */
      if (produce.some(function (p) { return builtin[p].cat === 'legume' || has(WATERY, p); })) {
        bases = bases.filter(function (id) { return has(FRESH_BASES, id); });
      }
      if (!bases.length) continue;
      var base = bases[Math.floor(rand() * Math.min(4, bases.length))];
      var sel = { produce: produce, nuts: nuts, base: base, options: options };
      var key = keyOf(sel);
      if (!best || sel.produce.length >= best.produce.length) best = sel;
      if (produce.length > 1 && !known[key] && key !== previous) { best = sel; break; }
    }
    if (!best) return null;
    var words = best.produce.slice(0, 2).map(function (id) { return shortName(builtin[id]); });
    var title = PREFIXES[Math.floor(rand() * PREFIXES.length)] + ' ' + words.join('-');
    var recipe = build(best, profile.size, profile, title);
    recipe.key = keyOf(best);
    return recipe;
  }

  return {
    SIZES: SIZES, LIMITS: LIMITS, UNSPECIFIED_NUT: UNSPECIFIED_NUT, allergenLabel: allergenLabel,
    defaultProfile: defaultProfile, validateProfile: validateProfile, find: find,
    everyIngredient: everyIngredient, exclusions: exclusions, signature: signature,
    allergyReason: allergyReason, status: status, usable: usable, idsOf: idsOf, allowed: allowed,
    assertSafe: assertSafe, build: build, compose: compose, formatQty: formatQty, calories: calories, parseKcal: parseKcal,
    baseChoices: baseChoices, isAcid: isAcid, inSeason: inSeason, recipeInSeason: recipeInSeason,
    ideas: ideas, filterRecipes: filterRecipes, energy: energy, energyOf: energyOf, ENERGY: ENERGY, surprise: surprise, normalize: normalize
  };
})(typeof module !== 'undefined' ? require('./data.js') : {
  NUT_KEYS: NUT_KEYS, ALLERGENS: ALLERGENS, LINKED: LINKED, CATEGORIES: CATEGORIES,
  INGREDIENTS: INGREDIENTS, RECIPES: RECIPES, PAIRS: PAIRS, DUOS: DUOS, COMMONS: COMMONS, CHOCO_FRUITS: CHOCO_FRUITS, KEYWORDS: KEYWORDS
});

if (typeof module !== 'undefined') module.exports = Engine;

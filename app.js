/* mySMOOZIZ — écrans et interactions */
(function () {
  'use strict';

  var KEY = 'mysmooziz:profil:v1';
  var VERSION = 'version 1.1';
  var PAGE = 30;
  var MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var SWATCHES = ['#f87217', '#4de800', '#d61e33', '#3ddff3', '#6495ed', '#ffd62e', '#a77bd1', '#e9dcbc'];
  /* Mois du téléphone, relu à chaque affichage. */
  var MONTH = new Date().getMonth();

  var storageNote = null;
  var profile = load();
  var ui = {
    pick: { produce: [], nuts: [], base: 'auto', options: [] },
    composeSort: 'alpha',
    ideas: { with: [], query: '', season: false, noMilk: false, noPlant: false, noNuts: false, energy: [], shown: PAGE, scroll: null },
    ing: { sort: 'alpha', month: null, cat: 'fruit', citrus: false },
    form: null,
    recipe: null,
    surprise: null,
    pour: false,
    open: {},
    onboard: { choice: null, draft: null },
    notice: null
  };

  /* ---------- stockage local ---------- */

  function load() {
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); }
    catch (e) {
      storageNote = 'Ce navigateur ne permet pas d’enregistrer vos réglages. Vos allergies vous seront redemandées à chaque ouverture.';
      return Engine.defaultProfile();
    }
    if (raw === null) return Engine.defaultProfile();
    var parsed = null;
    try { parsed = Engine.validateProfile(JSON.parse(raw)); } catch (e) { parsed = null; }
    if (!parsed) {
      storageNote = 'Vos réglages enregistrés sont illisibles. Par sécurité, indiquez à nouveau vos allergies.';
      return Engine.defaultProfile();
    }
    return parsed;
  }

  function save() {
    try {
      var text = JSON.stringify(profile);
      window.localStorage.setItem(KEY, text);
      if (window.localStorage.getItem(KEY) !== text) throw new Error('non enregistré');
    } catch (e) {
      storageNote = 'Vos réglages n’ont pas pu être enregistrés. Ils seront perdus à la fermeture.';
    }
  }

  /* ---------- petits outils d'affichage ---------- */

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function append(el, children) {
    children.forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      if (Array.isArray(c)) append(el, c);
      else el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
    });
  }

  function h(tag, attrs) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'checked' || k === 'value') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    append(el, Array.prototype.slice.call(arguments, 2));
    return el;
  }

  function s(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    append(el, Array.prototype.slice.call(arguments, 2));
    return el;
  }

  function button(label, cls, onclick, extra) {
    return h('button', Object.assign({ type: 'button', class: cls, onclick: onclick }, extra || {}), label);
  }

  function dot(color) {
    var d = h('span', { class: 'dot', 'aria-hidden': 'true' });
    d.style.background = color;
    return d;
  }

  function ing(id) { return Engine.find(id, profile); }
  function has(list, x) { return list.indexOf(x) !== -1; }
  function toggle(list, x) { var i = list.indexOf(x); if (i === -1) list.push(x); else list.splice(i, 1); }
  function byName(a, b) { return a.name.localeCompare(b.name, 'fr'); }
  function de(word) { return (/^[aeiouyéèêàâîïôûh]/i.test(word) ? 'd’' : 'de ') + word; }

  function go(route) {
    if (location.hash === '#/' + route) { render(); window.scrollTo(0, 0); }
    else location.hash = '#/' + route;
  }

  function route() { return location.hash.replace(/^#\//, '') || 'accueil'; }

  /* ---------- verre : chaque couche est un ingrédient, à sa proportion ---------- */

  var glassCount = 0;

  function glass(recipe, cls, animate) {
    var id = 'verre' + (++glassCount);
    var order = { base: 0, oleagineux: 1, option: 2, legume: 3, fruit: 4 };
    var layers = recipe.items.filter(function (i) { return i.vol > 0; }).slice().sort(function (a, b) {
      return order[ing(a.id).cat] - order[ing(b.id).cat];
    });
    var total = layers.reduce(function (t, i) { return t + i.vol; }, 0);
    var top = 34, bottom = 188, y = bottom;
    var heights = layers.map(function (i) { return Math.max(4, (bottom - top) * i.vol / total); });
    var sum = heights.reduce(function (a, b) { return a + b; }, 0);
    var g = s('g', { 'clip-path': 'url(#' + id + ')' });
    layers.forEach(function (item, n) {
      var hh = heights[n] * (bottom - top) / sum;
      y -= hh;
      var rect = s('rect', { x: 0, y: y.toFixed(1), width: 120, height: (hh + 0.6).toFixed(1), fill: ing(item.id).color });
      if (animate) { rect.setAttribute('class', 'pour'); rect.style.animationDelay = (n * 0.16) + 's'; }
      g.appendChild(rect);
    });
    var shape = 'M14 18 H106 L93 186 Q92 192 85 192 H35 Q28 192 27 186 Z';
    return s('svg', { viewBox: '0 0 120 200', class: 'glass ' + (cls || ''), 'aria-hidden': 'true', focusable: 'false' },
      s('defs', {}, s('clipPath', { id: id }, s('path', { d: shape }))),
      s('path', { d: 'M70 70 L92 2', class: 'straw' }),
      s('path', { d: shape, class: 'glass-back' }),
      g,
      s('path', { d: 'M27 40 L36 170', class: 'shine' }),
      s('path', { d: shape, class: 'glass-line' }));
  }

  /* ---------- éléments partagés ---------- */

  var NAV = [
    { r: 'composer', label: 'Composer', icon: 'M5 4h14l-2 16H7L5 4zm1.5 6h11' },
    { r: 'idees', label: 'Recettes', icon: 'M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.5 10.9c.4.3.5.7.5 1.1h6c0-.4.1-.8.5-1.1A6 6 0 0 0 12 3z' },
    { r: 'surprise', label: 'Surprise', icon: 'M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z' },
    { r: 'ingredients', label: 'Ingrédients', icon: 'M12 8c-5-3-9 1-7.5 6.5C6 20 9 22 12 20c3 2 6 0 7.5-5.5C21 9 17 5 12 8zm0 0c0-3 1.500-5 4-5.500' },
    { r: 'profil', label: 'Profil', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9c1-5 4-6.500 8-6.500s7 1.500 8 6.500' }
  ];

  function nav(current) {
    return h('nav', { class: 'tabs', 'aria-label': 'Menu principal' }, NAV.map(function (n) {
      return h('a', { href: '#/' + n.r, class: 'tab', 'aria-current': current === n.r ? 'page' : null,
        onclick: n.r === 'surprise' ? function (e) { e.preventDefault(); surpriseMe(); } : null },
        s('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, s('path', { d: n.icon })),
        h('span', {}, n.label));
    }));
  }

  function logo() {
    var colors = ['c-orange', 'c-green', 'c-cyan', 'c-red', 'c-blue', 'c-orange', 'c-green'];
    return h('a', { href: '#/accueil', class: 'logo', 'aria-label': 'mySMOOZIZ, accueil' },
      h('span', { class: 'logo-my', 'aria-hidden': 'true' }, 'my'),
      'SMOOZIZ'.split('').map(function (c, i) { return h('span', { class: colors[i], 'aria-hidden': 'true' }, c); }));
  }

  function exclusionNames() {
    var e = Engine.exclusions(profile);
    var names = e.keys.filter(function (k) { return k !== 'latex'; }).map(function (k) {
      return Engine.allergenLabel[k].replace(/ \(.*\)/, '');
    });
    if (has(e.keys, 'latex')) names.push('Latex');
    e.items.forEach(function (id) {
      var i = ing(id);
      if (i && !(i.family && has(e.keys, i.family))) names.push(i.name);
    });
    return names.filter(function (n, i) { return names.indexOf(n) === i; });
  }

  function allergyBanner() {
    var names = exclusionNames();
    var e = Engine.exclusions(profile);
    if (!names.length) {
      return h('a', { href: '#/profil', class: 'banner banner-none' }, 'Aucune allergie déclarée. Modifier');
    }
    return h('a', { href: '#/profil', class: 'banner banner-allergy' },
      h('strong', {}, 'Allergies exclues : '), names.map(function (n) { return n.charAt(0).toLowerCase() + n.slice(1); }).join(', ') + '.',
      e.nutRisk && profile.caution ? ' Mode prudence actif.' : null);
  }

  function segmented(label, options, value, onpick) {
    return h('div', { class: 'segmented', role: 'group', 'aria-label': label }, options.map(function (o) {
      return button([h('span', {}, o.label), o.detail ? h('small', {}, o.detail) : null], 'seg', function () { onpick(o.value); },
        { 'aria-pressed': String(o.value === value), 'data-key': label + o.value });
    }));
  }

  function sizePicker() {
    return segmented('Format', Engine.SIZES.map(function (z) { return { value: z.ml, label: z.label, detail: z.detail }; }),
      profile.size, function (v) {
        profile.size = v; save();
        [ 'recipe', 'surprise' ].forEach(function (k) {
          var r = ui[k];
          if (r && Engine.assertSafe(r, profile)) {
            var key = r.key;
            ui[k] = Engine.build(r.sel, v, profile, r.name);
            ui[k].key = key;
          }
        });
        render();
      });
  }

  function details(key, summary) {
    var el = h('details', { open: ui.open[key] ? true : null }, h('summary', { 'data-key': 'sum' + key }, summary),
      Array.prototype.slice.call(arguments, 2));
    el.addEventListener('toggle', function () { ui.open[key] = el.open; });
    return el;
  }

  /* Section repliée tant que rien n'y est coché ; ouverte d'office sinon. */
  function detailsOpenIf(count, key, summary, content) {
    if (ui.open[key] === undefined && count) ui.open[key] = true;
    return details(key, summary + (count ? ' (' + count + ' coché' + (count > 1 ? 's' : '') + ')' : ''), content);
  }

  function link(url, label) { return h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, label); }

  /* ---------- recette ---------- */

  function advice(recipe) {
    var e = Engine.exclusions(profile);
    var items = recipe.items.map(function (i) { return ing(i.id); });
    var ids = items.map(function (i) { return i.id; });
    var out = [];
    if (e.active) {
      var labels = items.filter(function (i) { return i.label || i.custom; }).map(function (i) { return i.name.toLowerCase(); });
      var frozen = items.filter(function (i) { return i.frozen; }).map(function (i) { return i.name.toLowerCase(); });
      out.push({ strong: true, text: 'Lisez l’étiquette de chaque produit acheté, traces comprises' +
        (labels.length ? ' : ' + labels.join(', ') : '') + (frozen.length ? ' (et, si vous les prenez surgelés : ' + frozen.join(', ') + ')' : '') +
        '. Rincez le blender avant de préparer.' });
    }
    if (has(ids, 'pamplemousse')) out.push({ strong: true, text: 'Pamplemousse : il peut interagir dangereusement avec certains médicaments. En cas de traitement, vérifiez la notice ou demandez à votre pharmacien.' });
    if (items.some(function (i) { return i.berry && i.frozen; })) out.push({ text: 'Fruits rouges surgelés : la congélation n’élimine pas les virus. Pour une personne fragile, faites-les cuire avant de les mixer.' });
    if (has(ids, 'miel')) out.push({ text: 'Miel : jamais pour un enfant de moins d’un an.' });
    if (has(ids, 'bresil')) out.push({ text: 'Noix du Brésil : très riches en sélénium, ne dépassez pas la quantité indiquée.' });
    if ((has(ids, 'lait-vache') || has(ids, 'lait-soja')) && Engine.isAcid(recipe.sel.produce.concat(recipe.sel.options), profile)) out.push({ text: 'Fruits acides avec du lait de vache ou de soja : le mélange peut cailler. Buvez-le aussitôt ou changez de base.' });
    return out;
  }

  function steps(recipe) {
    var items = recipe.items.map(function (i) { return ing(i.id); });
    var ids = items.map(function (i) { return i.id; });
    var list = ['Lavez, épluchez et coupez les fruits et légumes. Retirez noyaux, pépins et tiges.'];
    if (has(ids, 'chia')) list.push('Laissez gonfler les graines de chia 10 minutes dans une partie du liquide.');
    if (has(ids, 'cafe')) list.push('Préparez le café à l’avance et laissez-le refroidir.');
    list.push('Versez d’abord le liquide dans le blender, puis ajoutez le reste.');
    list.push('Mixez 45 à 60 secondes. Trop épais : ajoutez un peu d’eau. Pour plus de fraîcheur : quelques glaçons.');
    return list;
  }

  function calorieLine(recipe, detail) {
    var c = Engine.calories(recipe, profile, table());
    if (c.kcal === null) {
      return h('p', { class: 'kcal kcal-missing', 'aria-live': 'polite' },
        'Calories non calculées : pas de valeur pour ' + c.missing.join(', ').toLowerCase() + '.');
    }
    var n = Math.round(c.kcal / 10) * 10;
    return h('p', { class: 'kcal', 'aria-live': 'polite' },
      h('span', { class: 'kcal-value' }, 'Environ ' + n.toLocaleString('fr-FR') + ' kcal'), ' pour ' + detail);
  }

  function table() { return typeof CALORIES === 'undefined' ? {} : CALORIES; }

  var BOLT = 'M13 2L4 14h6l-1 8 9-12h-6l1-8z';

  function bolts(level) {
    var list = [];
    for (var i = 0; i < level; i++) list.push(s('svg', { viewBox: '0 0 24 24', class: 'bolt', 'aria-hidden': 'true', focusable: 'false' }, s('path', { d: BOLT })));
    return h('span', { class: 'bolts' }, list);
  }

  /* note : précision affichée sous la catégorie quand le format choisi n'est pas 33 cl. */
  function energyBadge(sel, note) {
    var e = Engine.energy(sel, profile, table());
    if (!e) return null;
    return h('span', { class: 'energy', 'data-level': e.level }, bolts(e.level), h('span', {}, e.label),
      note ? h('small', {}, note) : null);
  }

  function recipeView(recipe, animate) {
    if (!Engine.assertSafe(recipe, profile)) {
      return h('div', { class: 'empty', role: 'alert' },
        h('h2', {}, 'Cette recette n’est plus compatible'),
        h('p', {}, 'Elle contient un ingrédient exclu par vos allergies, vos goûts ou votre liste.'),
        button('Voir les idées compatibles', 'btn btn-cyan', function () { go('idees'); }));
    }
    var warnings = advice(recipe);
    var volume = Engine.SIZES.filter(function (z) { return z.ml === recipe.size; })[0];
    return h('article', { class: 'recipe' },
      h('h1', {}, recipe.name),
      sizePicker(),
      calorieLine(recipe, volume.detail),
      h('p', { class: 'energy-line' }, energyBadge(recipe.sel, recipe.size === 330 ? null : 'Catégorie établie pour un verre de 33 cl')),
      h('div', { class: 'recipe-body' },
        glass(recipe, 'glass-' + recipe.size, animate),
        h('ul', { class: 'quantities', 'aria-label': 'Ingrédients pour ' + volume.detail }, recipe.items.map(function (item) {
          var i = ing(item.id);
          var inS = Engine.inSeason(i, MONTH, SEASONS);
          return h('li', {}, dot(i.color),
            h('span', { class: 'q-name' }, i.name, inS === false ? h('small', {}, i.frozen ? 'hors saison, à prendre surgelé' : 'hors saison') : null),
            h('span', { class: 'q-val' }, Engine.formatQty(item)));
        }))),
      recipe.size === 1000 ? h('p', { class: 'hint' }, 'Le grand format correspond à environ 3 verres de 33 cl : à partager ou à répartir.') : null,
      warnings.length ? h('section', { class: 'warnings' }, h('h2', {}, 'Avant de mixer'),
        h('ul', {}, warnings.map(function (w) { return h('li', { class: w.strong ? 'strong' : null }, w.text); }))) : null,
      h('section', {}, h('h2', {}, 'Préparation'), h('ol', { class: 'steps' }, steps(recipe).map(function (t) { return h('li', {}, t); }))),
      h('p', { class: 'hint' }, 'Proportions indicatives. Vous préparez pour quelqu’un d’autre ? Vos réglages ne couvrent que les allergies saisies sur ce téléphone.'));
  }

  function backButton() {
    return button([s('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' }, s('path', { d: 'M15 5l-7 7 7 7' })), h('span', {}, 'Retour')],
      'back', function () { window.history.back(); }, { 'data-key': 'back' });
  }

  /* ---------- accueil ---------- */

  function homeView() {
    var inSeason = Engine.everyIngredient(profile).filter(function (i) {
      return (i.cat === 'fruit' || i.cat === 'legume') && Engine.inSeason(i, MONTH, SEASONS) === true &&
        Engine.status(i, profile).ok && SEASONS[i.season].length < 12;
    }).sort(byName);
    return h('div', { class: 'home' },
      h('h1', {}, 'On mixe quoi aujourd’hui ?'),
      button([h('span', { class: 'big-title' }, 'Composer mon mélange'), h('span', {}, 'Je choisis, l’appli dose')], 'door door-compose', function () { go('composer'); }),
      button([h('span', { class: 'big-title' }, 'Des idées recettes'), h('span', {}, 'Prêtes à mixer')], 'door door-ideas', function () { go('idees'); }),
      button([h('span', { class: 'big-title' }, 'Surprends-moi !'), h('span', {}, 'Une idée inattendue, rien que pour vous')], 'door door-surprise', surpriseMe),
      inSeason.length ? h('section', { class: 'season-strip' },
        h('h2', {}, 'De saison en ' + MONTHS[MONTH]),
        h('ul', {}, inSeason.map(function (i) { return h('li', {}, dot(i.color), i.name); }))) : null);
  }

  /* ---------- composer ---------- */

  function purgePick() {
    ['produce', 'nuts', 'options'].forEach(function (k) {
      ui.pick[k] = ui.pick[k].filter(function (id) { return Engine.usable(id, profile); });
    });
    if (ui.pick.base !== 'auto' && !Engine.usable(ui.pick.base, profile)) ui.pick.base = 'auto';
  }

  function chip(i, selected, full, onclick) {
    var st = Engine.status(i, profile);
    var note = null, cls = 'chip';
    if (!st.ok) { note = st.kind === 'allergy' ? st.reason : st.reason; cls += ' chip-' + st.kind; }
    else {
      var season = Engine.inSeason(i, MONTH, SEASONS);
      if (season === true) note = 'de saison';
      else if (season === false) note = i.frozen ? 'surgelé' : 'hors saison';
      if (season === true) cls += ' chip-season';
    }
    return button([dot(i.color), h('span', {}, i.name, note ? h('small', {}, note) : null)], cls, onclick,
      { 'aria-pressed': String(selected), disabled: !st.ok || (full && !selected), 'data-key': 'chip' + i.id });
  }

  function composeView() {
    purgePick();
    var all = Engine.everyIngredient(profile).filter(function (i) { return !has(profile.hidden, i.id); });
    function group(title, test, key, help) {
      var list = all.filter(test).sort(byName);
      if (!list.length) return null;
      if (ui.composeSort === 'season') {
        var rank = function (i) { var v = Engine.inSeason(i, MONTH, SEASONS); return v === true ? 0 : (v === false && i.frozen ? 1 : (v === null ? 2 : 3)); };
        list.sort(function (a, b) { return rank(a) - rank(b) || byName(a, b); });
      }
      var chosen = ui.pick[key];
      var full = chosen.length >= Engine.LIMITS[key];
      return h('section', {}, h('h2', {}, title), help ? h('p', { class: 'hint' }, help + ' ' + chosen.length + ' sur ' + Engine.LIMITS[key] + '.') : null,
        h('div', { class: 'chips' }, list.map(function (i) {
          return chip(i, has(chosen, i.id), full, function () { toggle(chosen, i.id); render(); });
        })));
    }
    function cat(key) { return function (i) { return i.cat === key; }; }
    var picked = ui.pick.produce.length + ui.pick.nuts.length + ui.pick.options.length + (ui.pick.base !== 'auto' ? 1 : 0);
    var bases = all.filter(function (i) { return i.cat === 'base'; }).sort(byName);
    var ready = ui.pick.produce.length > 0;
    var hasBase = Engine.baseChoices(ui.pick.produce, profile).length > 0;
    return h('div', {},
      h('h1', {}, 'Composer mon mélange'),
      segmented('Tri', [{ value: 'alpha', label: 'De A à Z' }, { value: 'season', label: 'Par saison' }], ui.composeSort, function (v) { ui.composeSort = v; render(); }),
      h('p', { class: 'counter', role: 'status' }, 'Fruits, agrumes et légumes : ' + ui.pick.produce.length + ' sur ' + Engine.LIMITS.produce + ' (au moins 1).'),
      group('Fruits', function (i) { return i.cat === 'fruit' && !i.citrus; }, 'produce'),
      group('Agrumes', function (i) { return i.cat === 'fruit' && i.citrus; }, 'produce'),
      group('Légumes', cat('legume'), 'produce'),
      group('Oléagineux et graines', cat('oleagineux'), 'nuts', 'Facultatif.'),
      h('section', {}, h('h2', {}, 'Lait ou base'),
        h('div', { class: 'chips' },
          button([dot('#3ddff3'), h('span', {}, 'L’appli choisit')], 'chip', function () { ui.pick.base = 'auto'; render(); }, { 'aria-pressed': String(ui.pick.base === 'auto'), 'data-key': 'auto' }),
          bases.map(function (i) { return chip(i, ui.pick.base === i.id, false, function () { ui.pick.base = i.id; render(); }); }))),
      group('Options', cat('option'), 'options', 'Facultatif.'),
      h('div', { class: 'sticky compose-bar' },
        picked ? button('Tout désélectionner', 'btn-clear', function () { ui.pick = { produce: [], nuts: [], base: 'auto', options: [] }; render(); }, { 'data-key': 'clearpick' }) : null,
        button(!hasBase ? 'Aucune base disponible' : (ready ? 'Voir mon mélange' : 'Choisissez un fruit ou un légume'), 'btn btn-green btn-wide', function () {
          var r = Engine.compose(ui.pick, profile.size, profile);
          if (!r) return;
          var names = r.sel.produce.slice(0, 2).map(function (id) { return ing(id).name.replace(/ \(.*\)/, '').toLowerCase(); });
          r.name = 'Mon mélange ' + de(names.join('-'));
          ui.recipe = r; go('recette');
        }, { disabled: !ready || !hasBase })));
  }

  /* ---------- idées ---------- */

  function shortList(sel) {
    return Engine.idsOf(sel).map(function (id) { return ing(id).name.replace(/ \(.*\)/, '').toLowerCase(); });
  }

  function ideaCard(r) {
    var liked = Engine.idsOf(r).some(function (id) { return has(profile.likes, id); });
    var built = Engine.build(r, profile.size, profile, r.name);
    return h('li', {}, button([glass(built, 'glass-mini'),
      h('span', {}, h('strong', {}, r.name), h('span', {}, shortList(r).join(', ')),
        energyBadge(r),
        liked ? h('small', { class: 'c-orange' }, 'avec ce que vous aimez') : (Engine.recipeInSeason(r, MONTH, profile, SEASONS) ? h('small', { class: 'c-green' }, 'de saison') : null))],
      'card', function () { ui.ideas.scroll = window.scrollY; ui.recipe = built; go('recette'); }, { 'data-key': 'r' + r.name }));
  }

  /* Ingrédients présents dans les recettes compatibles et pas encore choisis. */
  function suggestions(list) {
    var q = Engine.normalize(ui.ideas.query);
    if (!q) return [];
    var count = {};
    list.forEach(function (r) { Engine.idsOf(r).forEach(function (id) { count[id] = (count[id] || 0) + 1; }); });
    return Object.keys(count).map(ing).filter(function (i) {
      return !has(ui.ideas.with, i.id) && (' ' + Engine.normalize(i.name)).indexOf(' ' + q) !== -1;
    }).sort(byName).slice(0, 8).map(function (i) { return { ing: i, count: count[i.id] }; });
  }

  function ideasView() {
    var f = ui.ideas;
    var list = Engine.ideas(profile);
    f.with = f.with.filter(function (id) { return Engine.usable(id, profile); });
    function changed() { f.shown = PAGE; render(); }
    var filtered = Engine.filterRecipes(list, f, profile, MONTH, SEASONS, table());
    var score = function (r) {
      return Engine.idsOf(r).filter(function (id) { return has(profile.likes, id); }).length * 2 +
        (Engine.recipeInSeason(r, MONTH, profile, SEASONS) ? 1 : 0);
    };
    filtered = filtered.slice().sort(function (a, b) { return score(b) - score(a) || byName(a, b); });
    var hidden = RECIPES.length - list.length;
    var narrowed = f.with.length || f.season || f.noMilk || f.noPlant || f.noNuts || f.energy.length;

    var found = h('div', { class: 'chips suggestions', 'aria-live': 'polite' });
    function fill() {
      var matches = suggestions(Engine.filterRecipes(list, f, profile, MONTH, SEASONS, table()));
      found.replaceChildren();
      append(found, matches.map(function (m) {
        return button([dot(m.ing.color), h('span', {}, m.ing.name, h('small', {}, m.count + (m.count > 1 ? ' recettes' : ' recette')))], 'chip', function () {
          f.with.push(m.ing.id); f.query = ''; changed();
          var field = document.querySelector('[data-key="search"]');
          if (field) field.focus({ preventScroll: true });
        }, { 'data-key': 'add' + m.ing.id });
      }));
      if (f.query.trim() && !matches.length) found.appendChild(h('p', { class: 'hint' }, 'Aucun ingrédient de ce nom dans les recettes affichées.'));
    }
    fill();

    function box(key, label) {
      return h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: f[key], 'data-key': key, onchange: function (e) { f[key] = e.target.checked; changed(); } }),
        h('span', {}, label));
    }

    function energyButton(group, label, spoken) {
      return button([bolts(group), h('span', {}, label)], 'ebtn', function () { toggle(f.energy, group); changed(); },
        { 'aria-pressed': String(has(f.energy, group)), 'aria-label': spoken, 'data-key': 'energy' + group });
    }

    return h('div', {},
      h('h1', {}, 'Des idées recettes'),
      h('label', { class: 'field' }, 'Chercher un ingrédient',
        h('input', { type: 'search', maxlength: 40, value: f.query, placeholder: 'Ananas, poire, cacao…', autocomplete: 'off', 'data-key': 'search',
          oninput: function (e) { f.query = e.target.value; fill(); } })),
      found,
      f.with.length ? h('div', { class: 'picked' }, h('p', { class: 'hint' }, 'Recettes qui contiennent' + (f.with.length > 1 ? ' à la fois :' : ' :')),
        h('div', { class: 'chips' }, f.with.map(function (id) {
          return button([ing(id).name, h('span', { 'aria-hidden': 'true' }, ' ×')], 'achip picked-chip', function () { toggle(f.with, id); changed(); }, { 'aria-label': 'Ne plus filtrer sur ' + ing(id).name, 'data-key': 'drop' + id });
        }))) : null,
      segmented('Filtre', [{ value: false, label: 'Toutes' }, { value: true, label: 'De saison en ' + MONTHS[MONTH] }], f.season, function (v) { f.season = v; changed(); }),
      h('div', { class: 'checks' }, box('noMilk', 'Sans lait'), box('noPlant', 'Sans laits végétaux'), box('noNuts', 'Sans oléagineux')),
      f.noMilk || f.noPlant || f.noNuts ? h('p', { class: 'hint' }, 'Ces cases ne remplacent pas vos réglages d’allergies.') : null,
      h('p', { class: 'legend' }, 'Énergie pour 1 verre de 33 cl : de 1 ', bolts(1), ' (très peu calorique) à 4 ', bolts(1), ' (très calorique)'),
      h('div', { class: 'efilter', role: 'group', 'aria-label': 'Filtrer par énergie' },
        energyButton(1, 'Peu', 'Très peu calorique, un éclair'),
        energyButton(2, 'Moyen', 'Moyennement calorique, deux éclairs'),
        energyButton(3, 'Beaucoup', 'Calorique et très calorique, trois éclairs ou plus')),
      h('p', { class: 'hint', role: 'status' }, filtered.length + (filtered.length > 1 ? ' recettes' : ' recette') +
        (hidden ? '. ' + hidden + (hidden > 1 ? ' masquées' : ' masquée') + ' selon vos allergies, vos goûts ou vos ingrédients retirés.' : '.')),
      narrowed ? button('Effacer les filtres', 'link-btn', function () { f.with = []; f.query = ''; f.season = false; f.noMilk = false; f.noPlant = false; f.noNuts = false; f.energy = []; changed(); }, { 'data-key': 'reset' }) : null,
      filtered.length ? h('ul', { class: 'cards' }, filtered.slice(0, f.shown).map(ideaCard)) :
        h('div', { class: 'empty' }, h('p', {}, 'Aucune recette ne réunit ces critères. Retirez un filtre ou composez votre mélange.'),
          button('Composer mon mélange', 'btn btn-green', function () { go('composer'); })),
      filtered.length > f.shown ? button('Afficher plus de recettes (' + (filtered.length - f.shown) + ' restantes)', 'btn btn-cyan btn-wide', function () { f.shown += PAGE; render(); }, { 'data-key': 'more' }) : null);
  }

  /* ---------- surprise ---------- */

  function surpriseMe() {
    if (!profile.confirmed) return;
    ui.surprise = Engine.surprise(profile, MONTH, SEASONS, Math.random, ui.surprise && ui.surprise.key);
    ui.pour = true;
    go('surprise');
  }

  function surpriseView() {
    if (!ui.surprise || !Engine.assertSafe(ui.surprise, profile)) {
      ui.surprise = Engine.surprise(profile, MONTH, SEASONS);
    }
    if (!ui.surprise) {
      return h('div', { class: 'empty' }, h('h1', {}, 'Pas de surprise possible'),
        h('p', {}, 'Trop d’ingrédients sont exclus pour proposer un mélange. Vérifiez vos goûts et vos ingrédients retirés.'),
        button('Voir les ingrédients', 'btn btn-blue', function () { go('ingredients'); }));
    }
    var animate = ui.pour; ui.pour = false;
    return h('div', {}, recipeView(ui.surprise, animate),
      h('div', { class: 'sticky' }, button('Surprends-moi encore !', 'btn btn-orange btn-wide', surpriseMe)));
  }

  /* ---------- ingrédients ---------- */

  function setAllergy(i, on) {
    if (!on && !window.confirm('Retirer « ' + i.name + ' » de vos allergies ?')) { render(); return; }
    if (on) { if (!has(profile.items, i.id)) profile.items.push(i.id); }
    else {
      profile.items = profile.items.filter(function (x) { return x !== i.id; });
    }
    save(); render();
  }

  function prefer(i, list, other) {
    toggle(profile[list], i.id);
    profile[other] = profile[other].filter(function (x) { return x !== i.id; });
    save(); render();
  }

  function ingMonth() { return ui.ing.month === null ? MONTH : ui.ing.month; }

  function ingredientRow(i) {
    var st = Engine.status(i, profile);
    var month = ingMonth();
    var season = Engine.inSeason(i, month, SEASONS);
    var info = [];
    if (season === true) info.push(SEASONS[i.season].length === 12 ? 'toute l’année' : 'de saison en ' + MONTHS[month]);
    else if (season === false) info.push('hors saison en ' + MONTHS[month]);
    if (i.frozen) info.push('existe en surgelé');
    if (i.citrus) info.push('agrume');
    if (i.custom) info.push('ajouté par vous');
    var checked = has(profile.items, i.id);
    var byFamily = !checked && st.kind === 'allergy';
    var recheck = i.custom && st.reason === 'à revérifier pour vos allergies';
    var box = h('input', { type: 'checkbox', checked: checked, 'data-key': 'al' + i.id, onchange: function (e) { setAllergy(i, e.target.checked); } });
    return h('li', { class: 'row' + (st.kind === 'allergy' ? ' row-allergy' : '') },
      h('div', { class: 'row-head' }, dot(i.color),
        h('span', { class: 'row-name' }, i.name, info.length ? h('small', {}, info.join(', ')) : null),
        button('Retirer', 'link-btn', function () {
          if (i.custom) {
            if (!window.confirm('Supprimer définitivement « ' + i.name + ' » ?')) return;
            profile.custom = profile.custom.filter(function (c) { return c.id !== i.id; });
            ['items', 'likes', 'dislikes', 'hidden'].forEach(function (k) { profile[k] = profile[k].filter(function (x) { return x !== i.id; }); });
          } else profile.hidden.push(i.id);
          save(); render();
        }, { 'aria-label': 'Retirer ' + i.name, 'data-key': 'rm' + i.id })),
      byFamily ? h('p', { class: 'row-reason' }, 'Exclu, ' + st.reason + '.') : null,
      h('div', { class: 'row-actions' },
        button('J’aime', 'toggle toggle-like', function () { prefer(i, 'likes', 'dislikes'); }, { 'aria-pressed': String(has(profile.likes, i.id)), 'data-key': 'li' + i.id }),
        button('Pas pour moi', 'toggle toggle-dislike', function () { prefer(i, 'dislikes', 'likes'); }, { 'aria-pressed': String(has(profile.dislikes, i.id)), 'data-key': 'di' + i.id }),
        h('label', { class: 'toggle toggle-allergy' + (checked ? ' on' : '') }, box, 'Allergie'),
        recheck ? button('Revérifier', 'toggle toggle-recheck', function () { openForm(i); }) : null,
        i.custom && !recheck ? button('Modifier', 'toggle', function () { openForm(i); }) : null));
  }

  function openForm(existing) {
    delete ui.open.rareform;
    ui.form = existing ? { id: existing.id, name: existing.name, cat: existing.cat, color: existing.color,
      contains: existing.contains.slice(), madeOf: existing.madeOf.slice(), per: existing.per || 5, unit: existing.unit || 'g', kcal: typeof existing.kcal === 'number' ? String(existing.kcal).replace('.', ',') : '', sure: false, error: null }
      : { id: null, name: '', cat: ui.ing.cat, color: SWATCHES[0], contains: [], madeOf: [], per: 5, unit: 'g', kcal: '', sure: false, error: null };
    go('ajouter');
  }

  function checkList(options, selected, onchange) {
    return h('div', { class: 'checks' }, options.map(function (o) {
      return h('label', { class: 'check' },
        h('input', { type: 'checkbox', checked: has(selected, o.value), 'data-key': 'ck' + o.value, onchange: function () { toggle(selected, o.value); if (onchange) onchange(); } }),
        h('span', {}, o.label));
    }));
  }

  function formView() {
    var f = ui.form;
    if (!f) { openForm(null); return h('div'); }
    function dirty() { f.sure = false; render(); }
    var toCheck = function (a) { return { value: a.key, label: a.label }; };
    var keys = ALLERGENS.filter(function (a) { return a.key !== 'latex' && !a.rare; }).map(toCheck);
    keys.splice(8, 0, { value: Engine.UNSPECIFIED_NUT, label: 'Fruit à coque non précisé' });
    var rareKeys = ALLERGENS.filter(function (a) { return a.rare; }).map(toCheck);
    var rareChecked = rareKeys.filter(function (o) { return has(f.contains, o.value); }).length;
    var parts = INGREDIENTS.slice().sort(byName).map(function (i) { return { value: i.id, label: i.name }; });
    return h('form', { class: 'form', onsubmit: function (e) {
        e.preventDefault();
        var name = f.name.trim();
        if (!name) { f.error = 'Donnez un nom à l’ingrédient.'; render(); return; }
        if (Engine.everyIngredient(profile).some(function (i) { return i.id !== f.id && Engine.normalize(i.name) === Engine.normalize(name); })) {
          f.error = 'Un ingrédient porte déjà ce nom (regardez aussi les ingrédients retirés).'; render(); return;
        }
        var counted = f.cat === 'option' && f.unit === 'pincee';
        var kcal = counted ? null : Engine.parseKcal(f.kcal);
        if (kcal !== null && isNaN(kcal)) { f.error = 'Calories : indiquez un nombre entre 0 et 900, ou laissez vide.'; render(); return; }
        if (!f.sure) { f.error = 'Cochez la confirmation après avoir vérifié l’étiquette.'; render(); return; }
        var id = f.id || 'perso-' + (profile.nextId++);
        var item = { id: id, name: name, cat: f.cat, color: f.color, custom: true, contains: f.contains.slice(), madeOf: f.madeOf.slice(), verified: [] };
        if (f.cat === 'fruit' || f.cat === 'legume') { item.w = 0.6; item.cap = 80; }
        if (f.cat === 'oleagineux') { item.per = 10; item.cap = 12; }
        if (f.cat === 'option') { item.per = Math.min(Math.max(Number(f.per) || 1, 1), 50); item.unit = f.unit; }
        if (kcal !== null) item.kcal = kcal;
        var at = profile.custom.map(function (c) { return c.id; }).indexOf(id);
        if (at === -1) profile.custom.push(item); else profile.custom[at] = item;
        item.verified = Engine.signature(profile);
        save();
        ui.ing.cat = f.cat; ui.form = null;
        ui.notice = '« ' + name + ' » est enregistré.' + (Engine.allergyReason(item, profile) ? ' Il est exclu de vos recettes à cause de vos allergies.' : '');
        go('ingredients');
      } },
      h('h1', {}, f.id ? 'Vérifier l’ingrédient' : 'Ajouter un ingrédient'),
      h('label', { class: 'field' }, 'Nom', h('input', { type: 'text', maxlength: 40, value: f.name, 'data-key': 'fname', oninput: function (e) { f.name = e.target.value; f.sure = false; var c = document.getElementById('sure'); if (c) c.checked = false; } })),
      h('label', { class: 'field' }, 'Famille', h('select', { 'data-key': 'fcat', onchange: function (e) { f.cat = e.target.value; render(); } },
        CATEGORIES.map(function (c) { return h('option', { value: c.key, selected: c.key === f.cat }, c.one); }))),
      f.cat === 'option' ? h('div', { class: 'field-pair' },
        h('label', { class: 'field' }, 'Dose pour 33 cl', h('input', { type: 'number', min: 1, max: 50, value: f.per, inputmode: 'numeric', 'data-key': 'fper', oninput: function (e) { f.per = e.target.value; } })),
        h('label', { class: 'field' }, 'Unité', h('select', { 'data-key': 'funit', onchange: function (e) { f.unit = e.target.value; render(); } },
          [['g', 'grammes'], ['ml', 'millilitres'], ['pincee', 'pincées']].map(function (u) { return h('option', { value: u[0], selected: u[0] === f.unit }, u[1]); })))) : null,
      f.cat === 'option' && f.unit === 'pincee' ? null : h('label', { class: 'field' }, 'Calories pour 100 g ou 100 ml (facultatif)',
        h('input', { type: 'text', maxlength: 6, inputmode: 'decimal', value: f.kcal, 'data-key': 'fkcal', oninput: function (e) { f.kcal = e.target.value; } }),
        h('small', {}, 'Valeur en kcal lue sur l’étiquette. Sans elle, les calories des recettes qui l’utilisent ne sont pas calculées.')),
      h('fieldset', {}, h('legend', {}, 'Couleur dans le verre'), h('div', { class: 'swatches' }, SWATCHES.map(function (c, n) {
        var b = button('', 'swatch', function () { f.color = c; render(); }, { 'aria-pressed': String(f.color === c), 'aria-label': 'Couleur ' + (n + 1), 'data-key': 'sw' + n });
        b.style.background = c; return b;
      }))),
      h('fieldset', { class: 'allergen-box' }, h('legend', {}, 'Contient ou peut contenir'),
        h('p', { class: 'hint' }, 'Lisez l’étiquette, y compris la mention « traces ». Ne cochez rien seulement si aucun de ces allergènes n’y figure.'),
        checkList(keys, f.contains, dirty),
        detailsOpenIf(rareChecked, 'rareform', 'Autres allergènes', checkList(rareKeys, f.contains, dirty)),
        details('madeof', 'Composé aussi d’un ingrédient de la liste', checkList(parts, f.madeOf, dirty))),
      h('label', { class: 'check confirm' },
        h('input', { type: 'checkbox', id: 'sure', checked: f.sure, 'data-key': 'fsure', onchange: function (e) { f.sure = e.target.checked; if (f.error) { f.error = null; render(); } } }),
        h('span', {}, 'J’ai vérifié la composition : ce qui est coché est complet, y compris pour mes allergies.')),
      f.error ? h('p', { class: 'error', role: 'alert' }, f.error) : null,
      h('button', { type: 'submit', class: 'btn btn-green btn-wide' }, 'Enregistrer l’ingrédient'),
      button('Annuler', 'link-btn center', function () { ui.form = null; go('ingredients'); }));
  }

  function ingredientsView() {
    var all = Engine.everyIngredient(profile);
    var visible = all.filter(function (i) { return !has(profile.hidden, i.id) && i.cat === ui.ing.cat && (!ui.ing.citrus || ui.ing.cat !== 'fruit' || i.citrus); }).sort(byName);
    var body;
    if (ui.ing.sort === 'season' && (ui.ing.cat === 'fruit' || ui.ing.cat === 'legume' || ui.ing.cat === 'oleagineux')) {
      var m = ingMonth();
      var groups = [
        ['De saison en ' + MONTHS[m], function (i) { var v = Engine.inSeason(i, m, SEASONS); return v === true && SEASONS[i.season].length < 12; }],
        ['Disponibles toute l’année', function (i) { return Engine.inSeason(i, m, SEASONS) === true && SEASONS[i.season].length === 12; }],
        ['Hors saison, mais en surgelé', function (i) { return Engine.inSeason(i, m, SEASONS) === false && i.frozen; }],
        ['Hors saison', function (i) { return Engine.inSeason(i, m, SEASONS) === false && !i.frozen; }],
        ['Sans donnée de saison', function (i) { return Engine.inSeason(i, m, SEASONS) === null; }]
      ];
      body = groups.map(function (g) {
        var list = visible.filter(g[1]);
        return list.length ? h('section', {}, h('h2', {}, g[0]), h('ul', { class: 'rows' }, list.map(ingredientRow))) : null;
      });
    } else body = h('ul', { class: 'rows' }, visible.map(ingredientRow));

    var removed = all.filter(function (i) { return has(profile.hidden, i.id); }).sort(byName);
    var notice = ui.notice; ui.notice = null;
    return h('div', {},
      h('h1', {}, 'Mes ingrédients'),
      notice ? h('p', { class: 'notice', role: 'status' }, notice) : null,
      button('Ajouter un ingrédient', 'btn btn-blue btn-wide', function () { openForm(null); }),
      h('div', { class: 'cat-tabs', role: 'group', 'aria-label': 'Famille' }, CATEGORIES.map(function (c) {
        return button(c.label, 'cat', function () { ui.ing.cat = c.key; render(); }, { 'aria-pressed': String(ui.ing.cat === c.key), 'data-key': 'cat' + c.key });
      })),
      segmented('Tri', [{ value: 'alpha', label: 'De A à Z' }, { value: 'season', label: 'Par saison' }], ui.ing.sort, function (v) { ui.ing.sort = v; render(); }),
      ui.ing.sort === 'season' ? h('label', { class: 'field inline' }, 'Mois', h('select', { 'data-key': 'month', onchange: function (e) { var v = Number(e.target.value); ui.ing.month = v === MONTH ? null : v; render(); } },
        MONTHS.map(function (n, i) { return h('option', { value: i, selected: i === ingMonth() }, n); }))) : null,
      ui.ing.cat === 'fruit' ? h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: ui.ing.citrus, 'data-key': 'citrus', onchange: function (e) { ui.ing.citrus = e.target.checked; render(); } }), h('span', {}, 'Agrumes seulement')) : null,
      body,
      removed.length ? details('removed', 'Ingrédients retirés (' + removed.length + ')', h('ul', { class: 'removed' }, removed.map(function (i) {
        return h('li', {}, h('span', {}, i.name), button('Remettre', 'link-btn', function () { profile.hidden = profile.hidden.filter(function (x) { return x !== i.id; }); save(); render(); }));
      }))) : null);
  }

  /* ---------- allergies et profil ---------- */

  function allergenPicker(target, persist) {
    function chipFor(a) {
      var on = has(target.allergens, a.key);
      var linked = !on && LINKED[a.key] && has(target.allergens, LINKED[a.key]);
      return button([h('span', {}, a.label, linked ? h('small', {}, 'exclu aussi (allergie croisée)') : null)],
        'achip' + (linked ? ' linked' : ''), function () {
          if (on && persist && !window.confirm('Retirer « ' + a.label + ' » de vos allergies ?')) return;
          toggle(target.allergens, a.key); if (persist) save(); render();
        }, { 'aria-pressed': String(on), 'data-key': 'a' + a.key });
    }
    var nuts = ALLERGENS.filter(function (a) { return a.group === 'coque'; });
    var others = ALLERGENS.filter(function (a) { return a.group === 'autre' && !a.rare; });
    var rare = ALLERGENS.filter(function (a) { return a.rare; });
    var rareOn = rare.filter(function (a) { return has(target.allergens, a.key); }).length;
    var allNuts = nuts.every(function (a) { return has(target.allergens, a.key); });
    var parts = Engine.everyIngredient(target.custom ? target : profile).slice().sort(byName);
    return h('div', {},
      h('h3', {}, 'Fruits à coque'),
      h('div', { class: 'chips' },
        button('Tous les fruits à coque', 'achip achip-all', function () {
          if (allNuts && persist && !window.confirm('Retirer tous les fruits à coque de vos allergies ?')) return;
          nuts.forEach(function (a) { if (allNuts) target.allergens = target.allergens.filter(function (k) { return k !== a.key; }); else if (!has(target.allergens, a.key)) target.allergens.push(a.key); });
          if (persist) save(); render();
        }, { 'aria-pressed': String(allNuts), 'data-key': 'allnuts' }),
        nuts.map(chipFor)),
      h('h3', {}, 'Lait, arachide, soja, gluten…'),
      h('div', { class: 'chips' }, others.map(chipFor)),
      detailsOpenIf(rareOn, 'rare', 'Autres allergènes', h('div', {},
        h('p', { class: 'hint' }, 'Absents des ingrédients fournis. À cocher pour qu’ils soient écartés des ingrédients que vous ajoutez.'),
        h('div', { class: 'chips' }, rare.map(chipFor)))),
      details('precise', 'Un fruit, un légume ou un autre ingrédient précis' + (target.items.length ? ' (' + target.items.length + ' coché' + (target.items.length > 1 ? 's' : '') + ')' : ''),
        h('div', { class: 'checks' }, parts.map(function (i) {
          return h('label', { class: 'check' },
            h('input', { type: 'checkbox', checked: has(target.items, i.id), 'data-key': 'p' + i.id, onchange: function (e) {
              if (!e.target.checked && persist && !window.confirm('Retirer « ' + i.name + ' » de vos allergies ?')) { render(); return; }
              toggle(target.items, i.id); if (persist) save(); render();
            } }), h('span', {}, i.name));
        }))),
      h('p', { class: 'hint' }, 'Votre allergène n’apparaît nulle part ? L’application ne peut pas le prendre en compte : ne vous fiez pas à ses propositions pour celui-là.'));
  }

  function onboardingView() {
    var o = ui.onboard;
    if (!o.draft) o.draft = { allergens: profile.allergens.slice(), items: profile.items.slice(), custom: profile.custom };
    var count = o.draft.allergens.length + o.draft.items.length;
    function finish() {
      profile.allergens = o.choice === 'yes' ? o.draft.allergens : [];
      profile.items = o.choice === 'yes' ? o.draft.items : [];
      profile.confirmed = true; storageNote = null; save();
      ui.onboard = { choice: null, draft: null }; ui.open = {};
      go('accueil');
    }
    return h('div', { class: 'onboarding' },
      storageNote ? h('p', { class: 'error', role: 'alert' }, storageNote) : null,
      h('h1', {}, 'D’abord, vos allergies'),
      h('p', {}, 'Elles sont exclues de toutes les propositions. Elles restent sur ce téléphone et ne sont envoyées à personne.'),
      h('div', { class: 'choices', role: 'group', 'aria-label': 'Avez-vous des allergies ?' },
        button('J’ai une ou plusieurs allergies', 'choice choice-yes', function () { o.choice = 'yes'; render(); }, { 'aria-pressed': String(o.choice === 'yes'), 'data-key': 'yes' }),
        button('Je n’ai aucune allergie connue', 'choice', function () { o.choice = 'no'; render(); }, { 'aria-pressed': String(o.choice === 'no'), 'data-key': 'no' })),
      o.choice === 'yes' ? allergenPicker(o.draft, false) : null,
      o.choice ? h('div', { class: 'safety' },
        h('p', {}, 'L’application ne remplace ni un avis médical ni la lecture des étiquettes. Une trace peut suffire à provoquer une réaction grave.'),
        button(o.choice === 'no' ? 'Confirmer : aucune allergie' : (count ? 'Enregistrer mes allergies' : 'Cochez au moins une allergie'),
          'btn btn-green btn-wide', finish, { disabled: o.choice === 'yes' && !count })) : null);
  }

  function installHelp() {
    return h('div', {},
      h('h3', {}, 'iPhone (Safari)'),
      h('ol', {}, h('li', {}, 'Ouvrez le lien dans Safari.'), h('li', {}, 'Touchez le bouton Partager.'), h('li', {}, 'Choisissez « Sur l’écran d’accueil », puis « Ajouter ».')),
      h('p', { class: 'hint' }, 'Sur iPhone, l’icône ajoutée peut avoir sa propre mémoire : saisissez vos allergies depuis cette icône et vérifiez le bandeau en haut de l’écran.'),
      h('h3', {}, 'Android (Chrome)'),
      h('ol', {}, h('li', {}, 'Ouvrez le lien dans Chrome.'), h('li', {}, 'Touchez le menu à trois points.'), h('li', {}, 'Choisissez « Ajouter à l’écran d’accueil » ou « Installer l’application ».')));
  }

  function profileView() {
    var e = Engine.exclusions(profile);
    function tasteList(key, empty) {
      var list = profile[key].map(ing).filter(Boolean).sort(byName);
      if (!list.length) return h('p', { class: 'hint' }, empty);
      return h('div', { class: 'chips' }, list.map(function (i) {
        return button([i.name, h('span', { 'aria-hidden': 'true' }, ' ×')], 'achip', function () { toggle(profile[key], i.id); save(); render(); }, { 'aria-label': 'Retirer ' + i.name });
      }));
    }
    var cross = [];
    if (has(e.keys, 'cajou') || has(e.keys, 'pistache')) cross.push('Noix de cajou et pistache sont exclues ensemble.');
    if (has(e.keys, 'noix') || has(e.keys, 'pecan')) cross.push('Noix et noix de pécan sont exclues ensemble.');
    if (has(e.keys, 'latex') || ['banane', 'kiwi', 'avocat'].some(function (x) { return has(profile.items, x); })) cross.push('Latex, banane, kiwi et avocat peuvent se croiser. Cochez ceux qui vous concernent après avis de votre allergologue.');

    return h('div', {},
      h('h1', {}, 'Mon profil'),
      h('section', { class: 'allergy-zone' }, h('h2', {}, 'Mes allergies'),
        allergenPicker(profile, true),
        e.nutRisk ? h('label', { class: 'check confirm' },
          h('input', { type: 'checkbox', checked: profile.caution, 'data-key': 'caution', onchange: function (ev) {
            if (!ev.target.checked && !window.confirm('Désactiver le mode prudence ? Des oléagineux susceptibles de contenir des traces pourront être proposés.')) { render(); return; }
            profile.caution = ev.target.checked; save(); render();
          } }),
          h('span', {}, h('strong', {}, 'Mode prudence'), ' : en cas d’allergie à l’arachide ou à un fruit à coque, exclure aussi tous les autres fruits à coque, la cacahuète, leurs laits, le chocolat et le cacao (risque de traces). Les graines de chia restent proposées.')) : null,
        cross.length ? h('ul', { class: 'cross' }, cross.map(function (t) { return h('li', {}, t); })) : null,
        details('pollen', 'Allergie au pollen de bouleau ?', h('p', {}, 'Elle s’accompagne parfois de réactions à la pomme, l’amande, la carotte, le céleri, la cerise, la noisette, le kiwi, la pêche, la poire et la prune. L’application ne les exclut pas d’office : cochez ceux qui vous concernent.')),
        h('div', { class: 'emergency' }, h('strong', {}, 'Réaction grave ? '), 'Utilisez l’adrénaline auto-injectable si elle vous est prescrite et appelez le ',
          h('a', { href: 'tel:15' }, '15'), ' ou le ', h('a', { href: 'tel:112' }, '112'), '.')),
      h('section', {}, h('h2', {}, 'Mes goûts'),
        h('h3', {}, 'J’aime'), tasteList('likes', 'Rien pour l’instant. Les favoris sont proposés en priorité.'),
        h('h3', {}, 'Pas pour moi'), tasteList('dislikes', 'Rien pour l’instant. Ces ingrédients ne sont jamais proposés.'),
        button('Régler dans la liste des ingrédients', 'btn btn-blue', function () { go('ingredients'); })),
      h('section', {}, details('install', 'Mettre mySMOOZIZ sur l’écran d’accueil', installHelp()),
        details('privacy', 'Mes données', h('p', {}, 'Allergies, goûts et ingrédients ajoutés sont enregistrés uniquement dans ce navigateur. Chaque personne a les siens. Ils ne se synchronisent pas entre appareils et disparaissent si vous effacez les données du navigateur.'),
          h('p', {}, 'Le site est hébergé par GitHub, qui enregistre l’adresse IP des visiteurs pour des raisons de sécurité. Vos allergies ne lui sont pas transmises.')),
        details('sources', 'Sources', h('ul', {},
          h('li', {}, 'Calories : Anses. 2025. Table de composition nutritionnelle des aliments Ciqual 2025. ', link('https://doi.org/10.57745/RDMHWY', 'https://doi.org/10.57745/RDMHWY'), '.'),
          h('li', {}, 'Le total est indicatif, arrondi à la dizaine et calculé sur les quantités affichées (1 ml compté pour 1 g). Les pincées, feuilles et gouttes ne sont pas comptées. La valeur réelle varie selon la maturité des fruits et les marques.'),
          h('li', {}, 'Valeurs retenues : lait de vache demi-écrémé, fromage blanc à 2-3 % de matière grasse, boisson à la noix de coco (et non le lait de coco de cuisine), chocolat noir à 70 % de cacao, noix de cajou et pistaches grillées sans sel. Lait de noisette, absent de la table Ciqual : moyenne indicative de 50 kcal pour 100 ml (les étiquettes varient selon les marques, d’environ 29 à 69 kcal).'),
          h('li', {}, 'Catégories d’énergie, pour un verre de 33 cl : jusqu’à 120 kcal très peu calorique, jusqu’à 300 moyennement calorique, jusqu’à 500 calorique, au-delà très calorique (sur la valeur arrondie à la dizaine). Ce sont des repères propres à cette application.'),
          h('li', {}, 'Recettes : noms et dosages propres à mySMOOZIZ, recettes non goûtées. Les associations de fruits et légumes ont été relevées le 25/11/2026 sur des recettes publiées, notamment ', link('https://www.750g.com/recettes-boissons/smoothies/fruits/', '750g'), ', ', link('https://www.demotivateur.fr/food/recettes/categorie/smoothie', 'Demotivateur'), ' et ', link('https://www.vorwerk.com/fr/fr/c/vorwerk/astuces-recettes/blog/thermomix/recettes-quotidien/recette-de-smoothie', 'Vorwerk'), '. La liste complète est dans le fichier SOURCES.md.'),
          h('li', {}, 'Saisons : ADEME, ', link('https://github.com/incubateur-ademe/impactco2', 'projet Impact CO2'), ' (version de novembre 2026).'),
          h('li', {}, 'Allergènes : ', link('https://www.efsa.europa.eu/luFR/safe2eat/food-allergens', 'EFSA, les 14 allergènes de l’UE'), '.'),
          h('li', {}, 'Fruits à coque : ', link('https://www.larevuedupraticien.fr/article/allergies-aux-fruits-coque', 'La Revue du praticien'), '.'),
          h('li', {}, 'Allergies croisées : ', link('https://www.msdmanuals.com/fr/accueil/troubles-immunitaires/r%C3%A9actions-allergiques-et-autres-troubles-d-hypersensibilit%C3%A9/allergie-alimentaire', 'Manuel MSD'), '.'),
          h('li', {}, 'Pamplemousse : ', link('https://www.sante.fr/decryptage/nos-reponses/faut-il-vraiment-eviter-le-pamplemousse-lorsquon-prend-des-medicaments', 'Santé.fr'), '.'),
          h('li', {}, 'Urgence : ', link('https://www.has-sante.fr/jcms/c_1695744/', 'Haute Autorité de santé'), '.')))),
      button('Effacer toutes mes données', 'btn btn-red', function () {
        if (!window.confirm('Effacer allergies, goûts et ingrédients ajoutés sur ce téléphone ?')) return;
        try { window.localStorage.removeItem(KEY); } catch (err) { /* rien à effacer */ }
        location.hash = ''; location.reload();
      }),
      h('p', { class: 'hint' }, 'mySMOOZIZ, ' + VERSION));
  }

  /* ---------- rendu ---------- */

  var VIEWS = {
    accueil: homeView, composer: composeView, idees: ideasView, surprise: surpriseView,
    ingredients: ingredientsView, ajouter: formView, profil: profileView,
    recette: function () {
      if (!ui.recipe) return ideasView();
      return h('div', {}, backButton(), recipeView(ui.recipe, false));
    }
  };

  function render() {
    var app = document.getElementById('app');
    var focus = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-key');
    var y = window.scrollY;
    MONTH = new Date().getMonth();
    var r = route();
    if (!VIEWS[r]) r = 'accueil';
    var content, chrome = profile.confirmed;
    try { content = chrome ? VIEWS[r]() : onboardingView(); }
    catch (err) {
      console.error(err);
      content = h('div', { class: 'empty', role: 'alert' }, h('h1', {}, 'Affichage impossible'),
        h('p', {}, 'Par sécurité, aucune recette n’est montrée. Fermez puis rouvrez l’application.'));
    }
    app.replaceChildren(
      h('header', { class: 'top' }, logo()),
      chrome && storageNote ? h('p', { class: 'error', role: 'alert' }, storageNote) : '',
      chrome ? allergyBanner() : '',
      h('main', {}, content),
      chrome ? nav(r) : '');
    window.scrollTo(0, y);
    if (focus) {
      var el = app.querySelector('[data-key="' + focus + '"]');
      if (el) el.focus({ preventScroll: true });
    }
  }

  window.addEventListener('hashchange', function () {
    render();
    /* Retour d'une recette : on revient à l'endroit de la liste. */
    var back = route() === 'idees' ? ui.ideas.scroll : null;
    if (route() !== 'recette') ui.ideas.scroll = null;
    window.scrollTo(0, back || 0);
  });
  /* Appli restée ouverte d'un mois sur l'autre : mise à jour au retour à l'écran. */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && new Date().getMonth() !== MONTH) render();
  });
  window.addEventListener('storage', function (e) {
    if (e.key === KEY || e.key === null) { profile = load(); render(); }
  });

  render();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* l'appli reste utilisable en ligne */ });
  }
})();

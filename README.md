# mySMOOZIZ 1.3

Application de recettes de smoothies qui tient compte des goûts et des allergies.
Les réglages de chaque personne restent dans son navigateur.

## Mettre en ligne sur GitHub Pages

À faire de préférence depuis un ordinateur.

1. Décompresser `mySMOOZIZ-1.3.zip`.
2. Sur github.com, créer un dépôt public nommé `mysmooziz`.
3. Dans le dépôt : « Add file », puis « Upload files ». Déposer tous les fichiers du dossier (pas le dossier lui-même, pas le zip). Valider avec « Commit changes ».
4. Ouvrir « Settings », puis « Pages ». Dans « Build and deployment », choisir « Deploy from a branch », branche `main`, dossier `/ (root)`, puis « Save ».
5. Patienter quelques minutes. L'adresse est `https://VOTRE-PSEUDO.github.io/mysmooziz/`.

## Mettre à jour

Déposer les fichiers modifiés par-dessus les anciens. Depuis la version 1.2, `chewy.woff2` et `patrickhand.woff2` ne servent plus et peuvent être supprimés. Les réglages enregistrés sur les téléphones sont conservés.

## Ajouter sur l'écran d'accueil

- iPhone : ouvrir le lien dans Safari, bouton Partager, « Sur l'écran d'accueil ». Saisir ensuite les allergies depuis l'icône.
- Android : ouvrir le lien dans Chrome, menu à trois points, « Ajouter à l'écran d'accueil » ou « Installer l'application ».

## Contenu

| Fichier | Rôle |
|---|---|
| index.html, style.css | Page et apparence |
| app.js | Écrans |
| engine.js | Allergies, goûts, proportions, surprise |
| data.js | Ingrédients, allergènes, recettes, associations |
| season.js | Mois de saison (ADEME, Impact CO2) |
| calories.js | Calories pour 100 g (Anses, table Ciqual 2025 ; lait de noisette hors table) |
| sw.js, manifest.webmanifest, icon-*.png | Installation et usage hors connexion |
| *.woff2, LICENCES.txt | Polices et licences |
| SOURCES.md | Pages consultées pour les associations de saveurs |

## Limites

L'application ne remplace ni un avis médical ni la lecture des étiquettes.
Les recettes n'ont pas été goûtées.
Les proportions sont des repères culinaires, sans validation nutritionnelle.
Les mélanges sans base n'ont pas été testés au blender.
Les catégories d'énergie sont des seuils de comparaison, pas des catégories nutritionnelles officielles.
Les calories sont une indication : elles varient selon la maturité des fruits et les marques.

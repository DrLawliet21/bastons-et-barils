# Bastons & Barils — Site de Guilde WoW

## Structure des fichiers

```
bastons-site/
├── index.html                     ← Le site principal
├── netlify.toml                   ← Config Netlify
├── netlify/
│   └── functions/
│       └── blizzard.js            ← Proxy API Blizzard (sécurisé)
└── README.md
```

## Déploiement sur Netlify

### 1. Créer un repo GitHub
1. Va sur github.com → New repository → "bastons-barils-site"
2. Upload tous les fichiers (glisse-dépose dans l'interface web)
3. Commit

### 2. Connecter Netlify
1. Va sur app.netlify.com
2. "Add new site" → "Import an existing project" → GitHub
3. Sélectionne ton repo
4. Clique Deploy

### 3. ⚠️ Ajouter les variables d'environnement (OBLIGATOIRE)
Dans Netlify : **Site configuration → Environment variables → Add variable**

| Clé | Valeur |
|-----|--------|
| `BLIZZARD_CLIENT_ID` | `7ba2f4bcdd51463eb11a6c44a78f5b66` |
| `BLIZZARD_CLIENT_SECRET` | `mxC2BVYkfcBhpJbIez28r0MEEORgWClV` |

⚠️ Ne mets JAMAIS ces clés directement dans le code HTML — elles doivent rester dans les variables d'environnement Netlify.

### 4. Redéployer
Après avoir ajouté les variables : **Deploys → Trigger deploy → Deploy site**

## Ce que l'API récupère automatiquement
- ✅ Roster complet de la guilde (membres, classes, rangs)
- ✅ iLvl équipé de chaque membre
- ✅ Achievements récents de la guilde
- ✅ Nombre total de membres (affiché dans le hero)
- ✅ iLvl moyen de la guilde

## Personnalisation
- **Calendrier** : modifie le tableau `events` dans index.html
- **Besoins recrutement** : modifie le tableau `needs` dans index.html
- **Galerie** : remplace les placeholders par de vraies balises `<img src="...">`
- **Texte de présentation** : modifie directement le HTML de la section `#presentation`

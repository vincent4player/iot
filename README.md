# Météo France Dashboard

Un tableau de bord météorologique interactif affichant les données météorologiques en temps réel pour la France.

![Capture d'écran du dashboard](/screenshot.png)

## Fonctionnalités

- **Carte interactive de la France** avec des marqueurs pour les principales villes
- **Données en temps réel** de température et d'humidité
- **Prévisions météorologiques** sur 24 heures
- **Graphiques historiques** des températures et de l'humidité
- **Design responsive** adapté aux mobiles, tablettes et ordinateurs
- **Mise à jour automatique** des données

## Technologies utilisées

- **Frontend:**
  - React.js
  - TailwindCSS pour le style
  - Leaflet.js pour la carte interactive
  - Chart.js pour les graphiques de données
  - Socket.io pour les mises à jour en temps réel

- **API:**
  - API OpenWeatherMap pour les prévisions météorologiques (à configurer)
  - API de capteurs (simulée pour le moment)

## Installation

1. Clonez ce dépôt :
```bash
git clone https://github.com/votre-username/meteo-france-dashboard.git
cd meteo-france-dashboard
```

2. Installez les dépendances :
```bash
npm install
```

3. Démarrez l'application en mode développement :
```bash
npm start
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## Configuration pour la production

Pour utiliser de vraies données météorologiques, vous devez obtenir une clé API d'OpenWeatherMap :

1. Créez un compte sur [OpenWeatherMap](https://openweathermap.org/)
2. Obtenez une clé API
3. Créez un fichier `.env` à la racine du projet avec le contenu suivant :
```
REACT_APP_OPENWEATHER_API_KEY=votre_clé_api
```

## Déploiement

Pour construire l'application pour la production :

```bash
npm run build
```

Cela créera un dossier `build` avec les fichiers optimisés prêts à être déployés.

## Développement futur

- Ajout de plus de villes et de données météorologiques
- Intégration avec des capteurs IoT réels
- Alertes météo
- Mode sombre
- Support multilingue

## Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Auteur

Créé par [Votre Nom] 
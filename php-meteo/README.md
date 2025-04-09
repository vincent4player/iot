# Station Météo Interactive

Application web qui affiche des données météorologiques en temps réel à partir d'un broker MQTT et de l'API OpenWeatherMap.

## Fonctionnalités

- Affichage en temps réel des données de température et d'humidité via MQTT
- Carte interactive OpenStreetMap avec cercles colorés pour représenter les stations
- Affichage de la température dans les cercles (vert pour normale, rouge pour élevée)
- Graphiques de température et d'humidité avec historique
- Stockage local des données dans IndexedDB
- Possibilité de personnaliser le nom de votre station météo

## Configuration

L'application est configurée pour se connecter au broker MQTT suivant :
- Host: broker.emqx.io
- Port: 8083 (WebSocket)
- Topic: ynovbdxb2/meteo

Les données météo des villes suivantes sont affichées sur la carte :
- Paris
- Lyon
- Nantes
- Marseille
- Toulouse
- Bourges
- Nancy

## Format des messages MQTT

L'application attend des messages MQTT au format JSON suivant :
```json
{
  "temperature": 24.80,
  "humidity": 35.00
}
```

## Utilisation

1. Ouvrez le fichier `index.html` dans votre navigateur
2. L'application se connectera automatiquement au broker MQTT
3. Les données reçues s'afficheront dans la section "Ma Station Météo"
4. Vous pouvez modifier le nom de votre station en saisissant un nouveau nom et en cliquant sur "Enregistrer"
5. Les graphiques se mettront à jour automatiquement avec les données reçues
6. Sur la carte, les cercles sont verts pour des températures normales et rouges lorsqu'elles dépassent 25°C

## Sécurité

Notez que cette application utilise IndexedDB pour stocker les données localement dans votre navigateur. Aucune donnée n'est envoyée à un serveur externe, à l'exception des requêtes à l'API OpenWeatherMap pour récupérer les données météorologiques des villes.

## Technologies utilisées

- HTML5, CSS3, JavaScript
- Leaflet.js pour la carte OpenStreetMap
- MQTT.js pour la communication MQTT
- Chart.js pour les graphiques
- IndexedDB (via idb) pour le stockage local
- API OpenWeatherMap pour les données météo des villes

## Personnalisation

Pour modifier la position par défaut de votre station météo, éditez la variable `stationPosition` dans le fichier `app.js`.

```javascript
let stationPosition = { name: 'Ma Station', lat: 44.8378, lon: -0.5792 }; // Position par défaut (Bordeaux)
```

Pour modifier le seuil de température à partir duquel les cercles deviennent rouges, ajustez la propriété `tempThreshold` dans la configuration :

```javascript
tempThreshold: 25 // Seuil de température (en °C) à partir duquel le cercle devient rouge
``` 
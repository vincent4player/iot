# Station Météo MQTT

Une application web PHP qui affiche les données de température et d'humidité reçues via MQTT, avec une carte OpenStreetMap et des graphiques historiques.

## Fonctionnalités

- Affichage des données météo en temps réel via MQTT
- Carte interactive avec marqueurs pour les grandes villes françaises (via OpenWeatherMap)
- Graphiques d'historique pour la température et l'humidité
- Stockage des données dans une base SQLite
- Personnalisation de la station MQTT (nom et ville)
- Lancement automatique du client MQTT en arrière-plan

## Prérequis

- PHP 7.4 ou supérieur
- Extension SQLite pour PHP
- Extension cURL pour PHP
- Serveur web (Apache, Nginx, etc.)
- Un broker MQTT en ligne (HiveMQ, EMQ X, etc.)

## Installation

1. Clonez ou téléchargez ce dépôt dans votre répertoire web :
   ```
   git clone https://github.com/votre-utilisateur/station-meteo-mqtt.git
   ```

2. Assurez-vous que les dossiers `db` et `logs` sont accessibles en écriture par le serveur web :
   ```
   chmod 777 db logs
   ```

3. Modifiez les fichiers de configuration pour vos paramètres :
   - `includes/config.php` : Remplacez les paramètres MQTT et votre clé API OpenWeatherMap
   - `js/config.js` : Modifiez les paramètres MQTT pour le client WebSocket

4. Ouvrez l'application dans votre navigateur :
   ```
   http://localhost/php-meteo/
   ```

## Configuration MQTT

### Où modifier les paramètres MQTT

Les paramètres de connexion MQTT doivent être configurés à deux endroits :

1. **Côté serveur** : dans le fichier `includes/config.php`
   ```php
   define('MQTT_HOST', 'broker.emqx.io');          // Adresse du broker MQTT
   define('MQTT_PORT', 1883);                       // Port du broker MQTT (généralement 1883)
   define('MQTT_CLIENT_ID', 'mqttx_f6c62fdf');     // ID client unique
   define('MQTT_TOPIC', 'ynovbdxb2/meteo');        // Topic à écouter
   ```

2. **Côté client** : dans le fichier `js/config.js`
   ```javascript
   mqtt: {
       host: 'broker.emqx.io',                        // Adresse du broker MQTT
       port: 8083,                                     // Port WebSocket (généralement 8083)
       clientId: 'web_' + Math.random().toString(16).substr(2, 8), // ID client aléatoire
       topic: 'ynovbdxb2/meteo'                        // Topic à écouter
   }
   ```

> **Important** : Assurez-vous que le `topic` est identique dans les deux fichiers.

### Client MQTT automatique

Le client MQTT PHP est lancé automatiquement en arrière-plan lorsque vous chargez la page `index.php`. Vous n'avez pas besoin de le démarrer manuellement. Les logs du client MQTT sont enregistrés dans le fichier `logs/mqtt.log`.

### Configuration de l'API météo

Pour obtenir les données météo des villes françaises, vous devez créer un compte sur [OpenWeatherMap](https://openweathermap.org/) et obtenir une clé API gratuite. Ensuite, mettez à jour le fichier `includes/config.php` avec votre clé API.

## Utilisation

### Interface utilisateur

L'interface utilisateur est divisée en plusieurs parties :

1. **Carte** : Affiche les marqueurs pour les grandes villes françaises avec leurs données météo, ainsi qu'un marqueur spécial pour la station MQTT.
2. **Station MQTT** : Affiche les dernières données reçues via MQTT et permet de configurer le nom et la ville de la station.
3. **Graphiques** : Affichent l'historique de température et d'humidité des dernières 24 heures.

## Structure du projet

```
php-meteo/
│
├── css/
│   └── style.css               # Styles CSS
│
├── db/
│   └── meteo.db                # Base de données SQLite (créée automatiquement)
│
├── includes/
│   ├── ajax_handler.php        # Gestionnaire de requêtes AJAX
│   ├── config.php              # Configuration de l'application
│   ├── functions.php           # Fonctions utilitaires
│   └── mqtt_client.php         # Client MQTT pour PHP
│
├── js/
│   ├── app.js                  # Application principale JavaScript
│   ├── charts.js               # Gestion des graphiques
│   ├── config.js               # Configuration côté client
│   ├── map.js                  # Gestion de la carte
│   └── mqtt.js                 # Client MQTT pour le navigateur
│
├── logs/                       # Répertoire pour les logs (créé automatiquement)
│
├── index.php                   # Page principale et démarrage du client MQTT
├── mqtt_listener.php           # Script d'écoute MQTT utilisé en arrière-plan
└── README.md                   # Ce fichier
```

## Format des données MQTT

L'application attend des messages MQTT au format JSON avec la structure suivante :

```json
{
  "temperature": 24.80,
  "humidity": 35.00
}
```

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails. 
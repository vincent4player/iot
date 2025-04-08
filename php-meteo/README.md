# Station Météo MQTT

Une application web PHP qui affiche les données de température et d'humidité reçues via MQTT, avec une carte OpenStreetMap et des graphiques historiques.

## Fonctionnalités

- Affichage des données météo en temps réel via MQTT
- Carte interactive avec marqueurs pour les grandes villes françaises (via OpenWeatherMap)
- Graphiques d'historique pour la température et l'humidité
- Stockage des données dans une base SQLite
- Personnalisation de la station MQTT (nom et ville)

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

2. Assurez-vous que le dossier `db` est accessible en écriture par le serveur web :
   ```
   chmod 777 db
   ```

3. Modifiez le fichier `includes/config.php` pour configurer vos paramètres :
   - Remplacez `VOTRE_CLE_API` par votre clé API OpenWeatherMap
   - Ajustez les paramètres MQTT si nécessaire

4. Ouvrez l'application dans votre navigateur :
   ```
   http://localhost/php-meteo/
   ```

## Configuration

### Configuration MQTT

Par défaut, l'application est configurée pour se connecter au broker MQTT public `broker.emqx.io` et s'abonner au topic `ynovbdxb2/meteo`. Vous pouvez modifier ces paramètres dans les fichiers :

- `includes/config.php` (côté serveur)
- `js/config.js` (côté client)

### Configuration de l'API météo

Pour obtenir les données météo des villes françaises, vous devez créer un compte sur [OpenWeatherMap](https://openweathermap.org/) et obtenir une clé API gratuite. Ensuite, mettez à jour le fichier `includes/config.php` avec votre clé API.

## Utilisation

### Interface utilisateur

L'interface utilisateur est divisée en plusieurs parties :

1. **Carte** : Affiche les marqueurs pour les grandes villes françaises avec leurs données météo, ainsi qu'un marqueur spécial pour la station MQTT.
2. **Station MQTT** : Affiche les dernières données reçues via MQTT et permet de configurer le nom et la ville de la station.
3. **Graphiques** : Affichent l'historique de température et d'humidité des dernières 24 heures.

### Script d'écoute MQTT

Un script PHP est inclus pour écouter en permanence le broker MQTT et stocker les données dans la base de données. Pour le lancer en arrière-plan :

```
php mqtt_listener.php > mqtt.log 2>&1 &
```

Pour Windows (ligne de commande) :

```
start /B php mqtt_listener.php > mqtt.log
```

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
├── index.php                   # Page principale
├── mqtt_listener.php           # Script d'écoute MQTT en arrière-plan
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
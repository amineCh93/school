# Notification Service

Microservice Node.js + Express dédié à la création et à la consultation de notifications.

## Fonctionnalités

- `GET /` : point de santé du service
- `GET /notifications` : liste les notifications
- `POST /notifications` : crée une notification

## Variables d'environnement

- `PORT` : port HTTP du service (défaut : `4000`)
- `MONGODB_URI` : chaîne de connexion MongoDB
- `CORS_ORIGIN` : origines autorisées, séparées par des virgules

## Démarrage

1. Copier `.env.example` vers `.env`
2. Installer les dépendances avec `npm install`
3. Lancer le service avec `npm start`

## Structure

- `app.js` est un point d'entrée de compatibilité vers `src/app.js`
- `src/domain` contient les règles métier
- `src/application` contient les cas d'usage
- `src/infrastructure` contient les adaptateurs (repositories)
- `src/routes` et `src/middleware` exposent l'interface HTTP
- `config/env.js` centralise la configuration d'environnement

## Tests

- Exécuter `npm test`

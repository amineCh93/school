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

## Tests

- Exécuter `npm test`

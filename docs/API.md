# API — Endpoints

Base : `http://localhost:4000/api/v1` (proxy frontend : `/api` → port 4000).
Auth : `Authorization: Bearer <token>`.
Tous les prix sont en **centimes**.

## AUTH
| Méthode | Endpoint            | Description                          |
|---------|---------------------|--------------------------------------|
| POST    | /auth/register      | Créer un compte (roles: CUSTOMER ou SELLER) |
| POST    | /auth/login         | Connexion → token + user             |
| GET     | /auth/me            | Profil courant                        |
| PUT     | /auth/me            | Mettre à jour profil                  |

## CATÉGORIES
| Méthode | Endpoint            | Description                          |
|---------|---------------------|--------------------------------------|
| GET     | /categories         | Lister les catégories                |
| POST    | /categories         | Créer (admin)                        |
| PUT     | /categories/:id     | Modifier (admin)                     |
| DELETE  | /categories/:id     | Supprimer (admin)                    |

## PRODUITS (public)
| Méthode | Endpoint            | Description                          |
|---------|---------------------|--------------------------------------|
| GET     | /products           | Recherche/filtres (q, category, priceMin, priceMax, store, sort, page) |
| GET     | /products/:slug     | Détail + avis                        |
| GET     | /products/store/:storeId | Produits d'une boutique           |
| GET     | /products/featured  | Mise en avant                        |

## PRODUITS (vendeur, son compte)
| Méthode | Endpoint            | Description                          |
|---------|---------------------|--------------------------------------|
| POST    | /seller/products    | Créer un produit                     |
| PUT     | /seller/products/:id | Modifier                            |
| DELETE  | /seller/products/:id | Supprimer (désactiver)              |
| PATCH   | /seller/products/:id/stock | Mettre à jour le stock          |

## BOUTIQUES
| Méthode | Endpoint            | Description                          |
|---------|---------------------|--------------------------------------|
| POST    | /stores             | Demander la création (SELLER)        |
| GET     | /stores/me          | Boutique du vendeur courant + stats    |
| GET     | /stores/:slug       | Boutique publique                    |
| PUT     | /stores/me          | Modifier la boutique (SELLER)        |

## PANIER
| Méthode | Endpoint            | Description                          |
|---------|---------------------|--------------------------------------|
| GET     | /cart               | Contenu du panier                    |
| POST    | /cart/items         | Ajouter `{productId, quantity}`      |
| PATCH   | /cart/items/:productId | Changer la quantité               |
| DELETE  | /cart/items/:productId | Retirer                           |
| DELETE  | /cart               | Vider                               |

## COMMANDES
| Méthode | Endpoint            | Description                          |
|---------|---------------------|--------------------------------------|
| POST    | /orders             | Créer une commande `{items, shippingAddress, paymentMethod}` |
| GET     | /orders/my          | Historique du client                 |
| GET     | /orders/:id         | Détail + statut + suivi              |
| POST    | /orders/:id/cancel  | Annuler (si PENDING/PAID)           |

## PAIEMENT MOBILE MONEY
| Méthode | Endpoint            | Description                          |
|---------|---------------------|--------------------------------------|
| POST    | /payments/momo/initiate | Initier paiement `{orderId, phone}` |
| GET     | /payments/momo/status/:ref | Statut du paiement            |
| POST    | /payments/webhook/momo | Webhook fournisseur (sandbox)     |

## AVIS
| Méthode | Endpoint            | Description                          |
|---------|---------------------|--------------------------------------|
| POST    | /products/:slug/reviews | Déposer un avis (client ayant acheté)|
| GET     | /products/:slug/reviews | Récupérer les avis                |

## NOTIFICATIONS
| Méthode | Endpoint            | Description                          |
|---------|---------------------|--------------------------------------|
| GET     | /notifications      | Notifications du user courant        |
| PATCH   | /notifications/:id  | Marquer comme lue                    |
| PATCH   | /notifications/read-all | Tout marquer lu                  |

## SELLER (dashboard)
| Méthode | Endpoint            | Description                          |
|---------|---------------------|--------------------------------------|
| GET     | /seller/stats       | Revenus, commandes, produits         |
| GET     | /seller/orders      | Commandes de la boutique             |
| PATCH   | /seller/orders/:orderItemId | Mettre à jour statut (SHIPPED/DELIVERED) |
| GET     | /seller/payouts     | Historique des versions vendeur      |
| GET     | /seller/products    | Produits de la boutique (avec stock) |

## ADMIN
| Méthode | Endpoint            | Description                          |
|---------|---------------------|--------------------------------------|
| GET     | /admin/stats        | Chiffres clés + commission cumulée   |
| GET     | /admin/sales        | Toutes les ventes (+filtres date)    |
| GET     | /admin/stores       | Boutiques + statut                   |
| PATCH   | /admin/stores/:id/validate | Approuver / rejeter / suspendre |
| GET     | /admin/users        | Utilisateurs (rôle vendeur notamment)|
| PATCH   | /admin/users/:id/status | Activer / suspendre               |
| GET     | /admin/products     | Tous les produits                    |
| PATCH   | /admin/products/:id/status | Activer / désactiver un produit  |
| GET     | /admin/payouts/pending | Payouts en attente                |
| POST    | /admin/payouts/:id/process | Traiter un payout               |
| POST    | /admin/payouts/auto | Déclencher les payouts automatiques  |

## Erreurs
Format uniforme :
```json
{ "error": { "message": "...", "details": [...] } }
```
Codes : 400 (validation), 401 (non authentifié), 403 (rôle insuffisant), 404, 409 (conflit), 422, 500.
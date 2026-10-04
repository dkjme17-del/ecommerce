# Base de données (PostgreSQL)

Modèle défini dans `backend/prisma/schema.prisma` (Prisma ORM).
Les montants sont stockés en **centimes (Int)**.

## Entités

### User
Compte utilisateur de la plateforme. Un utilisateur peut cumuler les rôles client
et vendeur (`roles` est un tableau d'enum).

| Champ        | Type          | Note                          |
|--------------|---------------|-------------------------------|
| id           | String (uuid) |                               |
| name         | String        |                               |
| email        | String        | unique, lowercase             |
| phone        | String        | unique, ex. `0600000001`   |
| password     | String        | hash bcrypt                   |
| roles        | Role[]        | CUSTOMER, SELLER, ADMIN       |
| status       | String        | ACTIVE, SUSPENDED             |
| avatar       | String?       |                               |
| createdAt    | DateTime      |                               |

### Store (boutique du vendeur)
| Champ            | Type    | Note                                  |
|------------------|---------|---------------------------------------|
| id               | String  |                                       |
| ownerId          | FK User |                                       |
| name / slug      | String  | slug unique                          |
| description      | String? |                                       |
| logo / banner    | String? |                                       |
| status           | String  | PENDING → APPROVED / REJECTED / SUSPENDED |
| commissionRate   | Float   | 0.01                                       |
| balance          | Int     | solde net à payer (centimes)         |
| totalEarned      | Int     | cumul net                             |
| payoutInfo       | Json?   | opérateur + numéro mobile money      |
| activatedAt      | DateTime? | date de validation admin           |

### Category
`id, name, slug, description?, icon?, parentId?` (catégories imbriquées possibles).

### Product
| Champ        | Type          | Note                        |
|--------------|---------------|-----------------------------|
| id           | String        |                             |
| storeId      | FK Store      |                             |
| categoryId   | FK Category   |                             |
| name / slug  | String        |                             |
| description  | Text?         |                             |
| price        | Int           | centimes                   |
| compareAtPrice | Int?       | prix baré                  |
| stock        | Int           | quantité dispo              |
| images       | String[]      | URLs                        |
| status       | String        | DRAFT, ACTIVE, ARCHIVED    |
| rating       | Float         | moyenne avis (0)            |
| numReviews   | Int           |                             |
| salesCount   | Int           | compteur ventes             |
| enabled      | Boolean       | false si stock à 0 auto     |

### Cart / CartItem
Panier par utilisateur, `CartItem.productId + cartId` unique.

### Order (commande client)
| Champ        | Type   | Note                              |
|--------------|--------|-----------------------------------|
| id           | String |                                   |
| userId       | FK     | client                            |
| number       | String | ex. `ORD-20241231-0001`           |
| status       | String | PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED |
| paymentMethod| String | WAVE, ORANGE_MONEY, MTN_MOMO      |
| paymentStatus| String | UNPAID, PAID, FAILED              |
| subtotal, shippingFee, total | Int | centimes                |
| address      | Json   | livreur                           |
| transactionRef | String? | ref paiement API mobile money |
| createdAt    | DateTime |                                   |
| paidAt       | DateTime? |                                  |

### OrderItem (ligne, rattachée à une boutique)
| Champ       | Type   | Note                              |
|-------------|--------|-----------------------------------|
| id          | String |                                   |
| orderId     | FK Order |                                 |
| storeId     | FK Store | la boutique qui vend            |
| productId   | FK     |                                   |
| quantity    | Int    |                                   |
| unitPrice   | Int    | centimes                          |
| subtotal    | Int    | quantity × unitPrice              |
| commission  | Int    | 1 % de subtotal (centimes)        |
| netAmount   | Int    | subtotal - commission             |

### Transaction
Traçabilité financière : `PAYMENT`, `COMMISSION`, `PAYOUT`, `REFUND`.

### Payout (versement au vendeur)
| Champ       | Type   | Note                              |
|-------------|--------|-----------------------------------|
| id          | String |                                   |
| storeId     | FK     |                                   |
| amount      | Int    | net versé                         |
| commission  | Int    | commission prélevée               |
| status      | String | PENDING, SUCCESS, FAILED          |
| method      | String | WAVE / ORANGE_MONEY / MTN_MOMO    |
| reference   | String? | ref fournisseur                  |

### Review (avis client)
`productId+userId` unique, `rating 1..5`, `comment?`.

### Notification
`userId, type, title, message, read, metadata?`.

## Relations clés

```
User 1───0..1 Store (owner)
Store 1───* Product
Category 1───* Product
User 1───* Order (en tant que client)
Order 1───* OrderItem
Store 1───* OrderItem
Store 1───* Payout
Product 1───* Review
User 1───* CartItem
User 1───* Notification
```

## Index

- `Product` : index sur `storeId`, `categoryId`, `status`, trigramme sur name pour la recherche (`pg_trgm`).
- `OrderItem` : index sur `storeId`, `orderId`.
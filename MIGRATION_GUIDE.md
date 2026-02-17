# Database Migration Guide

## Initial Setup

After setting up the project, initialize Flask-Migrate:

```bash
# With Docker
docker-compose exec app flask db init

# Without Docker (local development)
flask db init
```

This creates a `migrations/` directory.

## Create Initial Migration

Generate the initial migration from the models:

```bash
# With Docker
docker-compose exec app flask db migrate -m "Initial migration"

# Without Docker
flask db migrate -m "Initial migration"
```

This creates a migration file in `migrations/versions/`.

## Apply Migrations

Run migrations to create/update the database schema:

```bash
# With Docker
docker-compose exec app flask db upgrade

# Without Docker
flask db upgrade
```

## Future Migrations

When you modify models:

1. **Generate migration**:
   ```bash
   flask db migrate -m "Description of changes"
   ```

2. **Review the migration file** in `migrations/versions/` to ensure it's correct

3. **Apply migration**:
   ```bash
   flask db upgrade
   ```

## Rollback Migration

If needed, rollback to previous version:

```bash
flask db downgrade
```

## Database Schema

The initial migration will create the following tables:

- `users` - User accounts
- `password_reset_tokens` - Password reset tokens
- `email_verification_tokens` - Email verification tokens
- `wallets` - User wallets
- `wallet_transactions` - Wallet transactions
- `service_requests` - Service requests
- `shop_categories` - Shop categories
- `shop_products` - Shop products
- `orders` - Orders
- `payments` - Payment transactions
- `notifications` - User notifications
- `emails` - Email queue

## Notes

- Always backup your database before running migrations in production
- Review migration files before applying them
- Test migrations in a development environment first


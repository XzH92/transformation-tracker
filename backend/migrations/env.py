from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os
import sys

# Ajouter le chemin du projet au path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Importer les modèles
from models import Base

# Cette ligne est nécessaire pour que Alembic trouve les modèles
target_metadata = Base.metadata

# Configurer le logging
config = context.config
fileConfig(config.config_file_name)

# Intercepter le processus de migration pour utiliser notre propre configuration
def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = "sqlite:///./transformation.db"
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

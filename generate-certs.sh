#!/usr/bin/env bash
# Génère des certificats SSL auto-signés pour le développement local (HTTPS).
# Les certificats sont créés dans le dossier certs/ à la racine du projet.
# Ils sont valides 365 jours pour localhost / 127.0.0.1.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CERTS_DIR="$SCRIPT_DIR/certs"

mkdir -p "$CERTS_DIR"

openssl req -x509 \
  -newkey rsa:2048 \
  -keyout "$CERTS_DIR/key.pem" \
  -out "$CERTS_DIR/cert.pem" \
  -days 365 \
  -nodes \
  -subj "/C=FR/ST=France/L=Paris/O=TransformationTracker/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo ""
echo "Certificats générés dans $CERTS_DIR :"
echo "  - $CERTS_DIR/cert.pem  (certificat)"
echo "  - $CERTS_DIR/key.pem   (clé privée)"
echo ""
echo "Le frontend (Vite) et le backend (Uvicorn) les détecteront automatiquement."

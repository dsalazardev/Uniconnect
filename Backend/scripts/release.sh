#!/usr/bin/env bash
# CA6 — Publica una nueva versión SemVer comprometiendo openapi.json actualizado.
#
# Uso (desde Backend/):
#   bash scripts/release.sh <patch|minor|major>
#
# El script:
#   1. Bumps la versión en Backend/package.json (npm version)
#   2. Regenera openapi.json con la versión nueva embebida en info.version
#   3. Archiva el spec en openspec/versions/<vX.Y.Z>/openapi.json
#   4. Crea el commit y el tag git

set -e

BUMP=${1:-patch}

# Ubicamos la raíz del monorepo (un nivel arriba de Backend/)
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$BACKEND_DIR"

NEW_VERSION=$(npm version "$BUMP" --no-git-tag-version)
echo "Nueva versión: $NEW_VERSION"

# Regenerar spec — npm_package_version se inyecta automáticamente
npm run generate:openapi

# Archivar la versión exacta para recuperación histórica (CA6)
SPEC_DIR="$REPO_ROOT/openspec/versions/${NEW_VERSION}"
mkdir -p "$SPEC_DIR"
cp openapi.json "$SPEC_DIR/openapi.json"
echo "Spec archivado en openspec/versions/${NEW_VERSION}/openapi.json"

# Commit y tag desde la raíz del repo
cd "$REPO_ROOT"
git add \
  "Backend/package.json" \
  "Backend/openapi.json" \
  "openspec/openapi.json" \
  "openspec/versions/${NEW_VERSION}/openapi.json"

git commit -m "chore(release): ${NEW_VERSION} -- openapi.json versionado"
git tag "$NEW_VERSION"

echo ""
echo "Release ${NEW_VERSION} listo."
echo "Para publicar: git push origin HEAD --tags"
echo "Para recuperar el contrato de esta version:"
echo "  git show ${NEW_VERSION}:openspec/versions/${NEW_VERSION}/openapi.json"

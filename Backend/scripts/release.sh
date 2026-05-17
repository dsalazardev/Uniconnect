#!/usr/bin/env bash
# CA6 — Publica una nueva versión SemVer comprometiendo openapi.json actualizado.
#
# Uso:
#   bash scripts/release.sh <patch|minor|major>
#
# El script:
#   1. Bumps la versión en package.json (npm version)
#   2. Regenera openapi.json con la nueva versión
#   3. Copia el spec a openspec/versions/<X.Y.Z>/openapi.json para historial
#   4. Crea el commit + tag de git

set -e

BUMP=${1:-patch}
NEW_VERSION=$(npm version "$BUMP" --no-git-tag-version)
echo "Versión nueva: $NEW_VERSION"

# Regenerar spec con la versión actualizada
npm run generate:openapi

# Archivar la versión exacta (CA6 — recuperar contrato histórico)
SPEC_DIR="../openspec/versions/${NEW_VERSION}"
mkdir -p "$SPEC_DIR"
cp openapi.json "$SPEC_DIR/openapi.json"

# Commit
git add package.json openapi.json "../openspec/versions/${NEW_VERSION}/openapi.json"
git commit -m "chore(release): ${NEW_VERSION} — openapi.json versionado"
git tag "$NEW_VERSION"

echo "✅  Release ${NEW_VERSION} listo. Para subir: git push origin main --tags"

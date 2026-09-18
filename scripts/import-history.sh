#!/usr/bin/env bash
# One-time import of clean source histories. Run from an empty TCC repository.
set -euo pipefail
nav='../..//SENAI/Navegacao-indoor'
shopping='../..//SENAI/Shopping-3d'
test -z "$(git -C "$nav" status --porcelain)"
test -z "$(git -C "$shopping" status --porcelain)"
git add AGENTS.md .gitignore scripts/import-history.sh
git commit -m 'Initialize TCC monorepo for history-preserving imports'
mkdir -p .work
git clone --no-local --no-checkout "$nav" .work/navigation-history
git -C .work/navigation-history sparse-checkout set backend mobile admin-panel
git -C .work/navigation-history checkout
for mapping in 'backend services/api' 'mobile apps/visitor' 'admin-panel apps/admin'; do
  read -r source destination <<< "$mapping"
  revision=$(git -C .work/navigation-history subtree split --prefix="$source" HEAD)
  git -C .work/navigation-history branch "import-$source" "$revision"
  git subtree add --prefix="$destination" .work/navigation-history "import-$source"
done
git subtree add --prefix=packages/shopping-3d "$shopping" HEAD
git log --oneline -8

#!/usr/bin/env bash
# Alleen voor een schone, tijdelijke GitHub Actions-checkout van de standaardbranch.
set -euo pipefail

if [[ "${GITHUB_ACTIONS:-}" != 'true' ]]; then
  echo 'Dit script mag alleen in een tijdelijke GitHub Actions-checkout draaien.' >&2
  exit 1
fi
TARGET_BRANCH="${1:?Geef de standaardbranch op}"
git check-ref-format --branch "$TARGET_BRANCH" >/dev/null
if [[ "$(git symbolic-ref --quiet --short HEAD || true)" != "$TARGET_BRANCH" ]]; then
  echo 'De checkout staat niet op de opgegeven standaardbranch.' >&2
  exit 1
fi
if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
  echo 'De checkout is niet schoon; bestaande wijzigingen worden niet overschreven.' >&2
  exit 1
fi

git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'

# Bij een gelijktijdige push opnieuw ophalen en genereren; nooit force-pushen.
for attempt in 1 2 3; do
  git fetch --prune origin '+refs/heads/*:refs/remotes/origin/*'
  target_ref="refs/remotes/origin/$TARGET_BRANCH"
  # Een aanvankelijk verouderde checkout mag alleen worden gefast-forward.
  # Vanaf poging 2 is HEAD hoogstens onze eigen, niet gepushte CSV-commit.
  if [[ "$attempt" == '1' ]] && ! git merge-base --is-ancestor HEAD "$target_ref"; then
    echo 'De checkout bevat lokale commits die niet op de standaardbranch staan.' >&2
    exit 1
  fi
  git reset --hard "$target_ref"
  node scripts/file-inventory.mjs --branch "$TARGET_BRANCH"
  git add -- docs/bestandenoverzicht.csv
  if git diff --cached --quiet -- docs/bestandenoverzicht.csv; then
    echo 'Het overzicht is al actueel.'
    exit 0
  fi
  git commit -m 'chore: update file inventory'
  if git push origin "HEAD:refs/heads/$TARGET_BRANCH"; then
    exit 0
  fi
  echo "Push mislukt (poging $attempt/3); probeer opnieuw met de nieuwste refs."
done

echo 'Publiceren mislukt. Controleer branchbeveiliging en Actions-schrijfrechten.' >&2
exit 1

# Audio asset provenance and license

The canonical v7.3 production audio set is the 21 files listed in
`assets/audio/v73-audio-build-audit.json` and registered in
`assets/manifests/assets.json`.

This directory now contains **mixed provenance**. A blanket CC0 statement no
longer applies to every MP3 after the direct production-audio replacements.

## Project-original procedural / CC0-1.0

The following unchanged binaries retain the repository's original procedural
synthesis provenance and CC0-1.0 declaration:

- `danger-besednice.mp3`
- `danger-nesmen.mp3`
- `danger-slavia.mp3`
- `ui-click.mp3`
- `ui-close.mp3`
- `ui-open.mp3`
- `ui-result.mp3`

## User-supplied production replacements / NOASSERTION

The following canonical binaries were supplied as production replacements. The
repository records their exact bytes and SHA-256 for integrity, but does **not**
assert an upstream license or origin for them. The release owner must confirm
that the project has the right to redistribute/use them before publishing the
release:

- `ambient-besednice.mp3`
- `ambient-chlum.mp3`
- `ambient-nesmen.mp3`
- `ambient-slavia.mp3`
- `danger-caught.mp3`
- `danger-chlum.mp3`
- `dig-impact-hard.mp3`
- `dig-impact-stone.mp3`
- `dig-impact-wet.mp3`
- `dig-miss.mp3`
- `dig-perfect.mp3`
- `finding-a.mp3`
- `finding-b.mp3`
- `finding-c.mp3`

Canonical production payload: **2361176 bytes**, below the project-wide 5 MB
audio ceiling.

Technical codec/bitrate/duration fields are asserted only for binaries whose
`technical_metadata_verified` field is `true` in the audit. Replaced binaries
remain integrity-verified by byte size and SHA-256 until their technical audio
metadata is independently measured.

## Unregistered alternates

`ambient-nesmen2.mp3` and `ambient-slavia2.mp3` are currently unregistered
alternates. They are not part of the canonical 21-file manifest/offline set and
no license assertion is made for them here.

Manual speaker/headphones listen-through remains mandatory before release.

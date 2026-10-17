# Project Manifest Release 1: HCS byte binding

This directory holds the exact MIT payload of
[Release 1](https://github.com/jefahnierocks/project-manifest/releases/tag/release-1)
from `jefahnierocks/project-manifest`, source revision
`56e3920089726e585eaa0fd7f4dc94e6938a1e0c`. The HCS consumer is independently
written in `scripts/ci/project-manifest.py`; it does not import an installed
package or use a sibling checkout. The release's candidate-named files and
diagnostic strings remain unchanged as part of its closed byte contract.

| Binding | SHA-256 |
| --- | --- |
| Release archive | `d13ab1777f8bc8e70aff9f349c6fe7d37e041bbc10baa52ad6aa7d27b074516e` |
| `bootstrap.py` | `2ccf58e0da97bbbd9dae173d1cca047d465c4a2d950ee6e56052309a9689cf4f` |
| Exact canonical `release-1/release.json` | `6248b77fe8cecd3557b727760c2f0ea187bf52b96a0f49b798ff450b7fb78287` |
| Domain-separated table | `f7ff9dd0972af5d3a6a3348c3e092de1a6acd97fa3975e13e522cf80ce5e7df2` |

The last digest is SHA-256 of `b"project-manifest-release-table-v1\0"` followed
by the exact canonical table bytes. Its release format is
`project-manifest-release-1`, release ID `1`, spec version `"1"`, observation
protocol `project-manifest-git-observation-1`. The table binds all 20 payload
files; it is the 21st leaf of `release-1`. The separately bound bootstrap is
outside that closed namespace. Do not add files inside `release-1`.

The [MIT license](release-1/LICENSE) is retained verbatim. Git attributes disable
text/filter/encoding transformations on the bound unit. Biome excludes only
the compact authenticated table from formatting; the consumer verifies its
canonical bytes and all payload hashes. No vendored file is reformatted.

Contract byte immutability is distinct from GitHub's release-settings flag.
HCS's owner-approved release selection and declaration verdict are separate
from the producer's nested `not_checked` diagnostics, operational acceptance,
runtime readiness and substrate admission. See the
[HCS adoption contract](../../docs/host-capability-substrate/project-manifest-adoption.md).

The separate CI Git-preparation helper records its public-safe Dicee source and
original public project-manifest source in its own header. It downloads Git
2.56.0 only in the macOS CI job, verifies the fixed official HTTPS SHA-256,
and builds inside an owned temporary prefix. No Git tar signature is claimed.
Neither this directory nor the declaration gate installs or prepares tools.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..')
const sourceDir = '/home/bates/Pictures/RCIS/Exemplars/IMG'
const targetDir = join(repoRoot, 'public', 'posters')

function buildCatalog(fromDir) {
  const entries = readdirSync(fromDir).sort()
  const manifests = []

  for (const entry of entries) {
    if (!entry.endsWith('.json') || entry === 'catalog.json') {
      continue
    }

    const manifest = JSON.parse(readFileSync(join(fromDir, entry), 'utf8'))
    manifests.push({
      ...manifest,
      image_path: `posters/${manifest.image_filename}`,
      manifest_path: `posters/${entry}`,
    })
  }

  manifests.sort((a, b) => a.project_number.localeCompare(b.project_number))
  writeFileSync(join(targetDir, 'catalog.json'), `${JSON.stringify(manifests, null, 2)}\n`, 'utf8')
  return manifests.length
}

if (existsSync(sourceDir)) {
  rmSync(targetDir, { recursive: true, force: true })
  mkdirSync(targetDir, { recursive: true })

  const entries = readdirSync(sourceDir).sort()

  for (const entry of entries) {
    cpSync(join(sourceDir, entry), join(targetDir, entry))
  }

  const count = buildCatalog(targetDir)
  console.log(`Synced ${count} poster manifests into ${targetDir}`)
} else if (existsSync(targetDir)) {
  const count = buildCatalog(targetDir)
  console.log(`Source asset directory not found; reused ${count} committed poster manifests from ${targetDir}`)
} else {
  throw new Error(`Source asset directory not found: ${sourceDir}`)
}

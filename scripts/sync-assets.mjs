import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const sourceDir = '/home/bates/Pictures/RCIS/Exemplars/IMG'
const targetDir = '/home/bates/GitHub/Exemplars/public/posters'

if (!existsSync(sourceDir)) {
  throw new Error(`Source asset directory not found: ${sourceDir}`)
}

rmSync(targetDir, { recursive: true, force: true })
mkdirSync(targetDir, { recursive: true })

const entries = readdirSync(sourceDir).sort()
const manifests = []

for (const entry of entries) {
  cpSync(join(sourceDir, entry), join(targetDir, entry))
  if (!entry.endsWith('.json')) {
    continue
  }

  const manifest = JSON.parse(readFileSync(join(sourceDir, entry), 'utf8'))
  manifests.push({
    ...manifest,
    image_path: `posters/${manifest.image_filename}`,
    manifest_path: `posters/${entry}`,
  })
}

manifests.sort((a, b) => a.project_number.localeCompare(b.project_number))
writeFileSync(join(targetDir, 'catalog.json'), `${JSON.stringify(manifests, null, 2)}\n`, 'utf8')

console.log(`Synced ${manifests.length} poster manifests into ${targetDir}`)

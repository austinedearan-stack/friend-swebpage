// Usage: npm run hash -- "my new passphrase"
// Prints the SHA-256 hash to paste into src/config/site-config.json -> admin.passphraseHash
// (You can also change it from the admin "publish" tab in the studio.)
import { createHash } from 'node:crypto'

const pass = process.argv.slice(2).join(' ')
if (!pass) {
  console.error('Usage: npm run hash -- "your passphrase"')
  process.exit(1)
}
console.log(createHash('sha256').update(pass).digest('hex'))

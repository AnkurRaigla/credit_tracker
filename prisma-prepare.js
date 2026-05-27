const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

const currentProviderMatch = schema.match(/provider\s*=\s*"([^"]+)"/);
const currentProvider = currentProviderMatch ? currentProviderMatch[1] : '';

const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

if (currentProvider !== targetProvider) {
  console.log(`[prisma-prepare] Switching database provider from "${currentProvider}" to "${targetProvider}"`);
  schema = schema.replace(/provider\s*=\s*"[^"]+"/, `provider = "${targetProvider}"`);
  fs.writeFileSync(schemaPath, schema, 'utf8');
} else {
  console.log(`[prisma-prepare] Database provider is already "${targetProvider}"`);
}

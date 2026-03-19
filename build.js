const fs = require('fs');

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';

if (!url || !key) {
  console.warn('⚠️  SUPABASE_URL e SUPABASE_ANON_KEY não definidas! Verifique as variáveis de ambiente.');
}

const content = `// Gerado automaticamente pelo build
const MFIT_CONFIG = {
  SUPABASE_URL: '${url}',
  SUPABASE_ANON_KEY: '${key}'
};
`;

fs.writeFileSync('js/config.js', content);
console.log('✅ js/config.js gerado com sucesso!');

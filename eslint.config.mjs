import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    rules: {}, // Tidak ada rule yang aktif
  },
];

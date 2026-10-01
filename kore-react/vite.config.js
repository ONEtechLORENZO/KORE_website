import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  /* Il percorso d'acquisto vive in una sottocartella del sito, cosi' il
     bottone Continua del configuratore ci arriva con un indirizzo relativo. */
  base: '/acquista/',
  plugins: [react()],
  server: { port: 4020 },
  build: { outDir: 'dist', assetsInlineLimit: 0 },
})

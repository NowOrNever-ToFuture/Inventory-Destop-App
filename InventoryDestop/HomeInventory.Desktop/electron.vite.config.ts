import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

function copyMigrationsPlugin() {
  return {
    name: 'copy-migrations',
    closeBundle() {
      const src = resolve('src/infrastructure/database/migrations')
      const dest = resolve('out/main/migrations')
      if (!existsSync(src)) return
      if (!existsSync(dest)) mkdirSync(dest, { recursive: true })
      for (const file of readdirSync(src)) {
        copyFileSync(join(src, file), join(dest, file))
      }
      console.log('[copy-migrations] Migrations copied to out/main/migrations')
    }
  }
}

export default defineConfig({
  main: {
    plugins: [copyMigrationsPlugin()],
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@shared': resolve('src/shared'),
        '@core': resolve('src/core'),
        '@infrastructure': resolve('src/infrastructure')
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@preload': resolve('src/preload'),
        '@shared': resolve('src/shared'),
        '@core': resolve('src/core'),
        '@infrastructure': resolve('src/infrastructure')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
        '@core': resolve('src/core')
      }
    },
    plugins: [react()]
  }
})

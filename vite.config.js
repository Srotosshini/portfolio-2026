import { defineConfig, normalizePath } from 'vite'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = import.meta.dirname
const publicDir = resolve(root, 'public')
const VIRTUAL = 'virtual:public-files'

// Every file under a folder, as forward-slash paths relative to it.
function listFiles(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) listFiles(full, base, out)
    else if (!entry.name.startsWith('.')) out.push(normalizePath(relative(base, full)))
  }
  return out.sort()
}

// Glue between the artwork folder and the site:
//  - `virtual:public-files` lists what is in /public, so the scene can use a
//    real scan when it exists and a labelled placeholder when it does not.
//  - list.html is baked from src/data/projects.js, so it needs no JavaScript.
//  - dropping, replacing or removing a file in /public reloads the page.
function shoebox() {
  let config
  const pages = (server) =>
    server
      ? server.ssrLoadModule('/src/lib/pages.js')
      : import(pathToFileURL(resolve(root, 'src/lib/pages.js')).href)

  return {
    name: 'shoebox',
    configResolved(resolved) {
      config = resolved
    },
    resolveId(id) {
      if (id === VIRTUAL) return '\0' + VIRTUAL
    },
    load(id) {
      if (id === '\0' + VIRTUAL) return `export default ${JSON.stringify(listFiles(publicDir))}`
    },
    configureServer(server) {
      const refresh = (file) => {
        if (!normalizePath(file).startsWith(normalizePath(publicDir) + '/')) return
        const mod = server.moduleGraph.getModuleById('\0' + VIRTUAL)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh).on('unlink', refresh).on('change', refresh)
    },
    handleHotUpdate({ file, server }) {
      // list.html has no scripts of its own, so tell it when the content changed
      if (/\/src\/(data\/|lib\/pages)/.test(normalizePath(file))) server.ws.send({ type: 'full-reload' })
    },
    transformIndexHtml: {
      order: 'post',
      async handler(html, ctx) {
        const { fillPage } = await pages(ctx.server)
        return fillPage(html, { files: listFiles(publicDir), list: ctx.filename.endsWith('list.html') })
      },
    },
    async closeBundle() {
      if (config.command !== 'build') return
      const out = resolve(config.root, config.build.outDir)
      // Everything a first visit to the shelf downloads. Clips, process shots,
      // room drawings and room code only load once a box is opened.
      const later = /^(clips|photos|process|builds|sketches|cards|design)\/|^drawings\/(?!label-|shelf-)|^assets\/(arcade|about|photography|creative-coding|design|market-ui|scraps)-|\.pdf$|^list\.html$/
      const landing = listFiles(out)
        .filter((f) => !later.test(f))
        .reduce((sum, f) => sum + statSync(join(out, f)).size, 0)
      const { countTodos } = await pages()
      const mb = (landing / 1024 / 1024).toFixed(2)
      console.log(`\n  shelf landing: ${mb} MB of the 3 MB budget${landing > 3 * 1024 * 1024 ? '  <-- over budget' : ''}`)
      console.log(`  placeholder texts left in src/data (projects.js, sketches.js, design.js): ${countTodos()}\n`)
    },
  }
}

export default defineConfig({
  base: './', // relative paths, so the site works at any GitHub Pages address
  plugins: [shoebox()],
  server: { port: 5173 },
  build: {
    // three.js alone is most of the main bundle (about 160 kB once gzipped), so the default 500 kB warning always fires
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      input: { index: resolve(root, 'index.html'), list: resolve(root, 'list.html') },
    },
  },
})

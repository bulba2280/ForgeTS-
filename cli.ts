import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const DIR = join(homedir(), '.forgets')
const FILE = join(DIR, 'config.json')

interface Config { server: string; token?: string; user?: string }

function cfg(): Config {
  if (!existsSync(FILE)) return { server: 'http://localhost:3000' }
  return JSON.parse(readFileSync(FILE, 'utf8'))
}
function save(c: Config) {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true })
  writeFileSync(FILE, JSON.stringify(c, null, 2))
}

async function api(p: string, m = 'GET', b?: any) {
  const c = cfg()
  const opts: any = { method: m, headers: { 'Content-Type': 'application/json' } }
  if (c.token) opts.headers.Authorization = c.token
  if (b) opts.body = JSON.stringify(b)
  return (await fetch(`${c.server}${p}`, opts)).json()
}

const [cmd, ...args] = process.argv.slice(2)

async function main() {
  switch (cmd) {
    case 'register': {
      const [u, e, p] = args
      const r = await api('/api/register', 'POST', { username: u, email: e, password: p })
      console.log(r.success ? `User ${u} created` : r.error)
      break
    }
    case 'login': {
      const [u, p] = args
      const r = await api('/api/login', 'POST', { username: u, password: p })
      if (r.success) { const c = cfg(); c.token = r.data.token; c.user = u; save(c); console.log(`Logged as ${u}`) }
      else console.log(r.error)
      break
    }
    case 'init': {
      const n = args[0] || 'repo', d = args[1] || ''
      const r = await api('/api/repos', 'POST', { name: n, description: d })
      console.log(r.success ? `Repo ${n} created` : r.error)
      break
    }
    case 'list': {
      const r = await api('/api/repos')
      if (r.success) r.data.forEach((x: any) => console.log(`${x.owner}/${x.name} - ${x.description || ''}`))
      else console.log(r.error)
      break
    }
    case 'files': {
      const r = await api(`/api/repos/${args[0]}/files`)
      if (r.success) r.data.forEach((f: any) => console.log(f.name))
      else console.log(r.error)
      break
    }
    case 'file': {
      const [repo, path] = args
      const r = await api(`/api/repos/${repo}/file?path=${encodeURIComponent(path)}`)
      console.log(r.success ? r.data.content : r.error)
      break
    }
    default: console.log('Commands: register | login | init | list | files | file')
  }
}
main()

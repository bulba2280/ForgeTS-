import express from 'express'
import crypto from 'crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const app = express()
app.use(express.json())

// Типы
interface User {
  id: string; username: string; email: string
  passwordHash: string; token?: string; createdAt: string
}
interface Repo {
  id: string; name: string; description: string
  owner: string; isPrivate: boolean; stars: number
  createdAt: string; updatedAt: string
}
interface APIResponse<T = any> { success: boolean; data?: T; error?: string }

// База
const DATA = join(__dirname, 'data')
if (!existsSync(DATA)) mkdirSync(DATA, { recursive: true })

function readDB<T>(f: string): T[] {
  const p = join(DATA, f)
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : []
}
function writeDB<T>(f: string, d: T[]) { writeFileSync(join(DATA, f), JSON.stringify(d, null, 2)) }

// Регистрация
app.post('/api/register', (req, res) => {
  const { username, password, email } = req.body
  if (!username || !password) return res.json({ success: false, error: 'Fields required' })
  const users = readDB<User>('users.json')
  if (users.find(u => u.username === username)) return res.json({ success: false, error: 'Taken' })
  users.push({
    id: crypto.randomUUID(), username, email: email || '',
    passwordHash: crypto.createHash('sha256').update(password).digest('hex'),
    createdAt: new Date().toISOString()
  })
  writeDB('users.json', users)
  res.json({ success: true, data: { username } })
})

// Логин
app.post('/api/login', (req, res) => {
  const { username, password } = req.body
  const users = readDB<User>('users.json')
  const hash = crypto.createHash('sha256').update(password || '').digest('hex')
  const user = users.find(u => u.username === username && u.passwordHash === hash)
  if (!user) return res.json({ success: false, error: 'Invalid' })
  user.token = crypto.randomBytes(32).toString('hex')
  writeDB('users.json', users)
  res.json({ success: true, data: { token: user.token, username } })
})

// Список репозиториев
app.get('/api/repos', (req, res) => {
  res.json({ success: true, data: readDB<Repo>('repos.json') })
})

// Создание репозитория 
app.post('/api/repos', (req, res) => {
  const { name, description, isPrivate } = req.body
  const token = req.headers.authorization
  if (!token) return res.json({ success: false, error: 'Auth required' })
  const user = readDB<User>('users.json').find(u => u.token === token)
  if (!user) return res.json({ success: false, error: 'Invalid token' })
  if (!name) return res.json({ success: false, error: 'Name required' })
  const repos = readDB<Repo>('repos.json')
  if (repos.find(r => r.name === name)) return res.json({ success: false, error: 'Exists' })
  const repo: Repo = {
    id: crypto.randomUUID(), name, description: description || '',
    owner: user.username, isPrivate: isPrivate || false, stars: 0,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  }
  repos.push(repo)
  writeDB('repos.json', repos)
  res.json({ success: true, data: repo })
})

// Файлы репозитория
app.get('/api/repos/:name/files', (req, res) => {
  const gitPath = join(DATA, 'repos', `${req.params.name}.git`)
  if (!existsSync(gitPath)) return res.json({ success: true, data: [] })
  try {
    const out = require('child_process').execSync(
      `cd "${gitPath}" && git ls-tree --name-only HEAD 2>/dev/null || echo ""`,
      { encoding: 'utf8' }
    )
    const files = out.trim().split('\n').filter(Boolean).map(name => ({ name, path: name }))
    res.json({ success: true, data: files })
  } catch { res.json({ success: true, data: [] }) }
})

// Содержимое файла
app.get('/api/repos/:name/file', (req, res) => {
  const gitPath = join(DATA, 'repos', `${req.params.name}.git`)
  const fp = req.query.path as string
  if (!fp) return res.json({ success: false, error: 'Path required' })
  try {
    const content = require('child_process').execSync(
      `cd "${gitPath}" && git show HEAD:"${fp}" 2>/dev/null`,
      { encoding: 'utf8' }
    )
    res.json({ success: true, data: { path: fp, content } })
  } catch { res.json({ success: false, error: 'Not found' }) }
})

// Старт
app.listen(3000, () => console.log('FTS: http://localhost:3000'))

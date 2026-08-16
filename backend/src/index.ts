import { serve } from '@hono/node-server'
import { cors } from "hono/cors"
import { Hono } from 'hono'
import users from './routes/users'

const app = new Hono()

app.use(
  "*",
  cors({
    origin: "http://localhost:3000",
  })
)

app.route('/users', users)

serve({
  fetch: app.fetch,
  port: 3001,
})

console.log('Server running on http://localhost:3001')

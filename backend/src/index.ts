import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import users from './routes/users'

const app = new Hono()

app.route('/users', users)

serve({
  fetch: app.fetch,
  port: 3000,
})

console.log('Server running on http://localhost:3000')

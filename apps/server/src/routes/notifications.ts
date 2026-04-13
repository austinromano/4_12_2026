import { Hono } from 'hono';
import { db } from '../db/index.js';
import { notifications } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware, type AuthUser } from '../middleware/auth.js';

const notificationRoutes = new Hono();
notificationRoutes.use('*', authMiddleware);

// Get unread notifications
notificationRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthUser;

  const results = await db.select()
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)))
    .orderBy(desc(notifications.createdAt))
    .limit(50)
    .all();

  return c.json({ success: true, data: results });
});

// Send a notification to another user (e.g. loop sent)
notificationRoutes.post('/send', async (c) => {
  const user = c.get('user') as AuthUser;
  const { toUserId, message, type } = await c.req.json();

  if (!toUserId || !message) {
    return c.json({ success: false, error: 'toUserId and message required' }, 400);
  }

  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    userId: toUserId,
    type: type || 'loop',
    message,
    read: false,
    createdAt: new Date().toISOString(),
  }).run();

  return c.json({ success: true });
});

// Mark all as read
notificationRoutes.post('/read', async (c) => {
  const user = c.get('user') as AuthUser;

  await db.update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)))
    .run();

  return c.json({ success: true });
});

export default notificationRoutes;

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { query } from './db.js';
import { optionalAuth, requireAdmin, requireAuth } from './middleware/auth.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function signUser(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, gender: user.gender },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, gender } = req.body;

  if (!name || !email || !password || !gender) {
    return res.status(400).json({ message: 'Заполните имя, email, пароль и пол' });
  }

  if (!['female', 'male'].includes(gender)) {
    return res.status(400).json({ message: 'Выберите пол из списка' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, gender)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, gender`,
      [name, email.toLowerCase(), passwordHash, gender],
    );
    const user = rows[0];
    return res.status(201).json({ user, token: signUser(user) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Пользователь с таким email уже есть' });
    }
    return res.status(500).json({ message: 'Не удалось зарегистрироваться' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await query(
    'SELECT id, name, email, role, gender, password_hash FROM users WHERE email = $1',
    [email?.toLowerCase()],
  );

  const user = rows[0];
  if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  const publicUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    gender: user.gender,
  };

  return res.json({ user: publicUser, token: signUser(publicUser) });
});

app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.role, u.gender, u.created_at,
       COALESCE(
         json_agg(
           json_build_object('id', c.id, 'title', c.title)
           ORDER BY c.title
         ) FILTER (WHERE c.id IS NOT NULL),
         '[]'
       ) AS circles
     FROM users u
     LEFT JOIN circle_members cm ON cm.user_id = u.id
     LEFT JOIN circles c ON c.id = cm.circle_id
     GROUP BY u.id
     ORDER BY u.created_at DESC, u.name ASC`,
  );

  res.json(rows);
});

app.get('/api/events', async (req, res) => {
  const { rows } = await query('SELECT * FROM events ORDER BY event_date ASC');
  res.json(rows);
});

app.post('/api/events', requireAuth, requireAdmin, async (req, res) => {
  const { title, description, imageUrl, eventDate } = req.body;
  const { rows } = await query(
    `INSERT INTO events (title, description, image_url, event_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, description, imageUrl, eventDate],
  );
  res.status(201).json(rows[0]);
});

app.put('/api/events/:id', requireAuth, requireAdmin, async (req, res) => {
  const { title, description, imageUrl, eventDate } = req.body;
  const { rows } = await query(
    `UPDATE events
     SET title = $1, description = $2, image_url = $3, event_date = $4
     WHERE id = $5
     RETURNING *`,
    [title, description, imageUrl, eventDate, req.params.id],
  );

  if (!rows[0]) {
    return res.status(404).json({ message: 'Мероприятие не найдено' });
  }

  return res.json(rows[0]);
});

app.delete('/api/events/:id', requireAuth, requireAdmin, async (req, res) => {
  await query('DELETE FROM events WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

app.get('/api/circles', optionalAuth, async (req, res) => {
  const userId = req.user?.id;
  const { rows } = await query(
    `SELECT c.*,
      CASE WHEN cm.id IS NULL THEN false ELSE true END AS is_joined
     FROM circles c
     LEFT JOIN circle_members cm ON cm.circle_id = c.id AND cm.user_id = $1
     WHERE c.is_active = true
     ORDER BY c.title ASC`,
    [userId || null],
  );
  res.json(rows);
});

app.post('/api/circles', requireAuth, requireAdmin, async (req, res) => {
  const { title, description, imageUrl, teacherName, ageGroup } = req.body;
  const { rows } = await query(
    `INSERT INTO circles (title, description, image_url, teacher_name, age_group)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, description, imageUrl, teacherName, ageGroup],
  );
  res.status(201).json(rows[0]);
});

app.put('/api/circles/:id', requireAuth, requireAdmin, async (req, res) => {
  const { title, description, imageUrl, teacherName, ageGroup, isActive = true } = req.body;
  const { rows } = await query(
    `UPDATE circles
     SET title = $1, description = $2, image_url = $3, teacher_name = $4, age_group = $5, is_active = $6
     WHERE id = $7
     RETURNING *`,
    [title, description, imageUrl, teacherName, ageGroup, isActive, req.params.id],
  );

  if (!rows[0]) {
    return res.status(404).json({ message: 'Кружок не найден' });
  }

  return res.json(rows[0]);
});

app.delete('/api/circles/:id', requireAuth, requireAdmin, async (req, res) => {
  await query('DELETE FROM circles WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

app.post('/api/circles/:id/join', requireAuth, async (req, res) => {
  await query(
    `INSERT INTO circle_members (user_id, circle_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, circle_id) DO NOTHING`,
    [req.user.id, req.params.id],
  );
  res.status(201).json({ message: 'Вы записаны на кружок' });
});

app.delete('/api/circles/:id/join', requireAuth, async (req, res) => {
  await query('DELETE FROM circle_members WHERE user_id = $1 AND circle_id = $2', [
    req.user.id,
    req.params.id,
  ]);
  res.status(204).end();
});

app.get('/api/lessons/my', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT l.*, c.title AS circle_title, la.status AS attendance_status
     FROM lessons l
     JOIN circles c ON c.id = l.circle_id
     JOIN circle_members cm ON cm.circle_id = c.id AND cm.user_id = $1
     LEFT JOIN lesson_attendance la ON la.lesson_id = l.id AND la.user_id = $1
     WHERE l.lesson_date >= CURRENT_DATE
       AND l.lesson_date < CURRENT_DATE + INTERVAL '60 days'
     ORDER BY l.lesson_date ASC, l.start_time ASC`,
    [req.user.id],
  );
  res.json(rows);
});

app.get('/api/lessons', requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await query(
    `SELECT l.*, c.title AS circle_title,
       COUNT(cm.id)::int AS members_count,
       COUNT(CASE WHEN la.status = 'attending' THEN 1 END)::int AS attending_count,
       COUNT(CASE WHEN la.status = 'absent' THEN 1 END)::int AS absent_count,
       COUNT(CASE WHEN cm.id IS NOT NULL AND la.status IS NULL THEN 1 END)::int AS unmarked_count
     FROM lessons l
     JOIN circles c ON c.id = l.circle_id
     LEFT JOIN circle_members cm ON cm.circle_id = l.circle_id
     LEFT JOIN lesson_attendance la ON la.lesson_id = l.id AND la.user_id = cm.user_id
     GROUP BY l.id, c.title
     ORDER BY l.lesson_date ASC, l.start_time ASC`,
  );
  res.json(rows);
});

app.post('/api/lessons', requireAuth, requireAdmin, async (req, res) => {
  const { circleId, title, description, lessonDate, startTime, endTime, location } = req.body;

  if (!circleId || !lessonDate || !startTime || !endTime) {
    return res.status(400).json({ message: 'Выберите кружок, дату и время занятия' });
  }

  const circle = await query('SELECT title FROM circles WHERE id = $1', [circleId]);
  if (!circle.rows[0]) {
    return res.status(404).json({ message: 'Кружок не найден' });
  }

  const lessonTitle = title?.trim() || circle.rows[0].title;
  const { rows } = await query(
    `INSERT INTO lessons (circle_id, title, description, lesson_date, start_time, end_time, location)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      circleId,
      lessonTitle,
      description?.trim() || null,
      lessonDate,
      startTime,
      endTime,
      location?.trim() || null,
    ],
  );
  res.status(201).json(rows[0]);
});

app.put('/api/lessons/:id', requireAuth, requireAdmin, async (req, res) => {
  const { circleId, title, description, lessonDate, startTime, endTime, location } = req.body;

  if (!circleId || !lessonDate || !startTime || !endTime) {
    return res.status(400).json({ message: 'Выберите кружок, дату и время занятия' });
  }

  const circle = await query('SELECT title FROM circles WHERE id = $1', [circleId]);
  if (!circle.rows[0]) {
    return res.status(404).json({ message: 'Кружок не найден' });
  }

  const lessonTitle = title?.trim() || circle.rows[0].title;
  const { rows } = await query(
    `UPDATE lessons
     SET circle_id = $1, title = $2, description = $3, lesson_date = $4, start_time = $5, end_time = $6, location = $7
     WHERE id = $8
     RETURNING *`,
    [
      circleId,
      lessonTitle,
      description?.trim() || null,
      lessonDate,
      startTime,
      endTime,
      location?.trim() || null,
      req.params.id,
    ],
  );

  if (!rows[0]) {
    return res.status(404).json({ message: 'Занятие не найдено' });
  }

  return res.json(rows[0]);
});

app.delete('/api/lessons/:id', requireAuth, requireAdmin, async (req, res) => {
  await query('DELETE FROM lessons WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

app.post('/api/lessons/:id/attendance', requireAuth, async (req, res) => {
  const { status } = req.body;

  if (!['attending', 'absent'].includes(status)) {
    return res.status(400).json({ message: 'Некорректный статус' });
  }

  const { rows } = await query(
    `INSERT INTO lesson_attendance (user_id, lesson_id, status)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, lesson_id)
     DO UPDATE SET status = EXCLUDED.status, updated_at = now()
     RETURNING *`,
    [req.user.id, req.params.id, status],
  );

  res.json(rows[0]);
});

app.get('/api/lessons/:id/attendance', requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, la.status
     FROM lessons l
     JOIN circle_members cm ON cm.circle_id = l.circle_id
     JOIN users u ON u.id = cm.user_id
     LEFT JOIN lesson_attendance la ON la.lesson_id = l.id AND la.user_id = u.id
     WHERE l.id = $1
     ORDER BY la.status ASC NULLS FIRST, u.name ASC`,
    [req.params.id],
  );

  res.json(rows);
});

app.listen(port, () => {
  console.log(`Backend started on http://localhost:${port}`);
});

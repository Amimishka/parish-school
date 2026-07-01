INSERT INTO events (title, description, image_url, event_date)
SELECT
  'Пасхальная встреча',
  'Общее занятие, чаепитие и подготовка творческих работ детей.',
  'https://images.unsplash.com/photo-1528357136257-0c25517acfea?auto=format&fit=crop&w=1200&q=80',
  CURRENT_DATE + INTERVAL '10 days'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Пасхальная встреча');

INSERT INTO events (title, description, image_url, event_date)
SELECT
  'День семьи',
  'Небольшой праздник для учеников, родителей и преподавателей школы.',
  'https://images.unsplash.com/photo-1504151932400-72d4384f04b3?auto=format&fit=crop&w=1200&q=80',
  CURRENT_DATE + INTERVAL '24 days'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'День семьи');

INSERT INTO events (title, description, image_url, event_date)
SELECT
  'Творческая мастерская',
  'Занятие по росписи и небольшая выставка детских работ после встречи.',
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
  CURRENT_DATE + INTERVAL '32 days'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Творческая мастерская');

INSERT INTO circles (title, description, teacher_name, age_group)
SELECT 'Хор', 'Занятия церковным пением, дыханием и внимательным слушанием.', 'Елена Викторовна', '7+'
WHERE NOT EXISTS (SELECT 1 FROM circles WHERE title = 'Хор');

INSERT INTO circles (title, description, teacher_name, age_group)
SELECT 'Лепка', 'Творческие занятия для детей с простыми сезонными работами.', 'Мария Сергеевна', '6-12'
WHERE NOT EXISTS (SELECT 1 FROM circles WHERE title = 'Лепка');

INSERT INTO circles (title, description, teacher_name, age_group)
SELECT 'Рисование', 'Основы композиции, цвета и аккуратной работы с материалами.', 'Анна Павловна', '8+'
WHERE NOT EXISTS (SELECT 1 FROM circles WHERE title = 'Рисование');

INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Администратор',
  'admin@hram.local',
  '$2a$10$MHkvSem6pVaWnwfdRqsxMOYuK1BCUrLpJM7JadAdemhdnLS3nu93S',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

UPDATE lessons
SET lesson_date = CURRENT_DATE + INTERVAL '2 days', start_time = '16:00', end_time = '17:00'
WHERE title = 'Распевка и песнопения';

UPDATE lessons
SET lesson_date = CURRENT_DATE + INTERVAL '4 days', start_time = '15:30', end_time = '16:30'
WHERE title = 'Пасхальная композиция';

UPDATE lessons
SET lesson_date = CURRENT_DATE + INTERVAL '7 days', start_time = '12:00', end_time = '13:00'
WHERE title = 'Общее занятие хора';

INSERT INTO lessons (circle_id, title, description, lesson_date, start_time, end_time, location)
SELECT id, 'Распевка и песнопения', 'Занятие хора для учеников приходской школы.', CURRENT_DATE + INTERVAL '1 day', '16:00', '17:00', 'Класс 2'
FROM circles
WHERE title = 'Хор'
  AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Распевка и песнопения');

INSERT INTO lessons (circle_id, title, description, lesson_date, start_time, end_time, location)
SELECT id, 'Пасхальная композиция', 'Творческая работа для детей младшей и средней группы.', CURRENT_DATE + INTERVAL '3 days', '15:30', '16:30', 'Мастерская'
FROM circles
WHERE title = 'Лепка'
  AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Пасхальная композиция');

INSERT INTO lessons (circle_id, title, description, lesson_date, start_time, end_time, location)
SELECT id, 'Общее занятие хора', 'Повторение песнопений перед воскресной встречей.', CURRENT_DATE + INTERVAL '6 days', '12:00', '13:00', 'Приходской дом'
FROM circles
WHERE title = 'Хор'
  AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Общее занятие хора');

INSERT INTO lessons (circle_id, title, description, lesson_date, start_time, end_time, location)
SELECT id, 'Основы рисунка', 'Работа с композицией и цветом для средней группы.', CURRENT_DATE + INTERVAL '5 days', '14:00', '15:00', 'Класс творчества'
FROM circles
WHERE title = 'Рисование'
  AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Основы рисунка');

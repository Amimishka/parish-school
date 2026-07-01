# Приходская школа при храме

Веб-приложение для расписания, кружков и отметок присутствия в небольшой приходской школе.

## Структура

- `frontend` - React/Vite интерфейс.
- `backend` - Node.js/Express API.
- `backend/db/schema.sql` - схема PostgreSQL.
- `docs/project-spec.md` - описание проекта и логики.

## Быстрый старт

```bash
npm install
```

Создайте файл `backend/.env` по примеру:

```bash
cp backend/.env.example backend/.env
```

Примените схему к базе `hram`:

```bash
psql -d hram -f backend/db/schema.sql
```

При желании добавьте демо-данные:

```bash
psql -d hram -f backend/db/seed.sql
```

Демо-администратор:

```text
email: admin@hram.local
password: admin123
```

Запуск фронта:

```bash
npm run dev:frontend
```

Запуск backend:

```bash
npm run dev:backend
```

## Что уже заложено

- роли: гость, пользователь, администратор;
- главная страница с мероприятиями;
- страница кружков;
- персональное расписание;
- отметки "буду" / "не буду";
- базовая панель администратора;
- API для авторизации, мероприятий, кружков, занятий и посещаемости;
- PostgreSQL-схема с таблицами пользователей, кружков, занятий и отметок.

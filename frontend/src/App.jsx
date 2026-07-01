import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Church,
  Clock3,
  ClipboardList,
  LogIn,
  LogOut,
  Palette,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { apiRequest } from './api';

const heroImage = '/assets/church-interior.jpg';
const fallbackEventImage = '/assets/church-ceiling.jpg';
const eventImages = [
  '/assets/church-ceiling.jpg',
  '/assets/church-service.jpg',
  '/assets/church-book.jpg',
  '/assets/church-interior.jpg',
];
const homeSchedule = [
  {
    id: 'choir',
    date: 'суббота, 15 июня - 11:00',
    title: 'Хор',
    text: 'Распевка и подготовка к воскресной встрече',
  },
  {
    id: 'clay',
    date: 'суббота, 15 июня - 13:00',
    title: 'Лепка',
    text: 'Творческое занятие для младшей группы',
  },
  {
    id: 'art',
    date: 'воскресенье, 16 июня - 12:00',
    title: 'Рисование',
    text: 'Композиция и работа с цветом',
  },
];
const schoolDirections = [
  {
    id: 'singing',
    title: 'Церковное пение',
    text: 'Дети знакомятся с основами распевки, учатся слушать друг друга и участвовать в общих приходских встречах.',
    image: '/assets/church-book.jpg',
  },
  {
    id: 'creative',
    title: 'Творческие занятия',
    text: 'Лепка, рисование и сезонные работы помогают спокойно раскрывать внимание, терпение и аккуратность.',
    image: '/assets/church-ceiling.jpg',
  },
  {
    id: 'community',
    title: 'Приходские события',
    text: 'Праздники, встречи и совместные занятия объединяют учеников, родителей и преподавателей школы.',
    image: '/assets/church-service.jpg',
  },
];
const workflowSteps = [
  {
    title: 'Запись на кружок',
    text: 'Родитель или ученик выбирает кружок, после чего занятия появляются в личном расписании.',
  },
  {
    title: 'Личное расписание',
    text: 'Показываются только выбранные направления, поэтому страница остается простой и понятной.',
  },
  {
    title: 'Отметка присутствия',
    text: 'Перед занятием можно отметить, будет человек присутствовать или нет.',
  },
];
const fallbackEvents = [
  {
    id: 'fallback-easter',
    title: 'Пасхальная встреча',
    description: 'Общее занятие, чаепитие и подготовка творческих работ детей.',
    image_url: fallbackEventImage,
    event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fallback-family',
    title: 'День семьи',
    description: 'Небольшой праздник для учеников, родителей и преподавателей школы.',
    image_url: '/assets/church-service.jpg',
    event_date: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fallback-workshop',
    title: 'Творческая мастерская',
    description: 'Занятие по росписи и небольшая выставка детских работ после встречи.',
    image_url: '/assets/church-book.jpg',
    event_date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
const fallbackCircles = [
  {
    id: 'fallback-choir',
    title: 'Хор',
    description: 'Занятия церковным пением, дыханием и внимательным слушанием.',
    image_url: '/assets/church-book.jpg',
    teacher_name: 'Елена Викторовна',
    age_group: '7+',
    is_joined: false,
  },
  {
    id: 'fallback-clay',
    title: 'Лепка',
    description: 'Творческие занятия для детей с простыми сезонными работами.',
    image_url: '/assets/church-ceiling.jpg',
    teacher_name: 'Мария Сергеевна',
    age_group: '6-12',
    is_joined: false,
  },
  {
    id: 'fallback-art',
    title: 'Рисование',
    description: 'Основы композиции, цвета и аккуратной работы с материалами.',
    image_url: '/assets/church-service.jpg',
    teacher_name: 'Анна Павловна',
    age_group: '8+',
    is_joined: false,
  },
];

const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' });
const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long' });

export default function App() {
  const [page, setPage] = useState('home');
  const [user, setUser] = useState(() => readStoredUser());
  const [events, setEvents] = useState([]);
  const [circles, setCircles] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isGuest = !user;
  const isAdmin = user?.role === 'admin';

  const loadEvents = useCallback(async () => {
    const data = await apiRequest('/events');
    setEvents(data.length > 0 ? withFallbackEvents(data) : fallbackEvents);
  }, []);

  const loadCircles = useCallback(async () => {
    const data = await apiRequest('/circles');
    setCircles(data.length > 0 ? data : fallbackCircles);
  }, []);

  const loadLessons = useCallback(async () => {
    if (!user) {
      setLessons([]);
      return;
    }

    const data = await apiRequest('/lessons/my');
    setLessons(data);
  }, [user]);

  useEffect(() => {
    loadEvents().catch((error) => {
      setEvents(fallbackEvents);
      setMessage(error.message);
    });
  }, [loadEvents]);

  useEffect(() => {
    loadCircles().catch((error) => {
      setCircles(fallbackCircles);
      setMessage(error.message);
    });
  }, [loadCircles, user]);

  useEffect(() => {
    loadLessons().catch((error) => setMessage(error.message));
  }, [loadLessons]);

  function handleAuthSuccess(data) {
    localStorage.setItem('hram_token', data.token);
    localStorage.setItem('hram_user', JSON.stringify(data.user));
    setUser(data.user);
    setPage('schedule');
    setMessage('Вы вошли в аккаунт');
  }

  function logout() {
    localStorage.removeItem('hram_token');
    localStorage.removeItem('hram_user');
    setUser(null);
    setLessons([]);
    setPage('home');
    setMessage('Вы вышли из аккаунта');
  }

  async function joinCircle(circleId) {
    if (!user) {
      setPage('profile');
      return;
    }

    setLoading(true);
    try {
      await apiRequest(`/circles/${circleId}/join`, { method: 'POST' });
      await Promise.all([loadCircles(), loadLessons()]);
      setMessage('Вы записаны на кружок');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function leaveCircle(circleId) {
    setLoading(true);
    try {
      await apiRequest(`/circles/${circleId}/join`, { method: 'DELETE' });
      await Promise.all([loadCircles(), loadLessons()]);
      setMessage('Запись на кружок отменена');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function setAttendance(lessonId, status) {
    setLessons((current) =>
      current.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, attendance_status: status } : lesson,
      ),
    );

    try {
      await apiRequest(`/lessons/${lessonId}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      setMessage(error.message);
      loadLessons().catch(() => {});
    }
  }

  const visibleNav = [
    { id: 'home', label: 'Главная' },
    { id: 'circles', label: 'Кружки' },
    ...(!isGuest ? [{ id: 'schedule', label: 'Расписание' }] : []),
    { id: 'profile', label: isGuest ? 'Вход' : 'Профиль' },
    ...(isAdmin ? [{ id: 'admin', label: 'Админ' }] : []),
  ];

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setPage('home')}>
          <span className="brand-mark">
            <Church size={22} />
          </span>
          <span>
            <strong>Приходская школа</strong>
            <small>при храме</small>
          </span>
        </button>

        <nav className="nav">
          {visibleNav.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? 'active' : ''}
              onClick={() => setPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="account-chip">
          {user ? (
            <>
              <span>{user.name}</span>
              <button className="icon-button" onClick={logout} title="Выйти">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button className="login-chip" onClick={() => setPage('profile')}>
              <LogIn size={18} />
              Войти
            </button>
          )}
        </div>
      </header>

      {message && (
        <button className="toast" onClick={() => setMessage('')}>
          {message}
        </button>
      )}

      <main>
        {page === 'home' && <Home events={events} setPage={setPage} />}
        {page === 'circles' && (
          <Circles
            circles={circles}
            isGuest={isGuest}
            loading={loading}
            joinCircle={joinCircle}
            leaveCircle={leaveCircle}
            setPage={setPage}
          />
        )}
        {page === 'schedule' && !isGuest && (
          <Schedule lessons={lessons} setAttendance={setAttendance} />
        )}
        {page === 'profile' && (
          <Profile
            user={user}
            circles={circles}
            onAuthSuccess={handleAuthSuccess}
            setMessage={setMessage}
            setPage={setPage}
          />
        )}
        {page === 'admin' && isAdmin && (
          <Admin
            events={events}
            circles={circles}
            refreshEvents={loadEvents}
            refreshCircles={loadCircles}
            refreshLessons={loadLessons}
            setMessage={setMessage}
          />
        )}
      </main>
    </div>
  );
}

function Home({ events, setPage }) {
  return (
    <>
      <section className="home-hero surface">
        <div className="home-hero-grid">
          <div className="home-hero-title">
            <p>Приходская школа</p>
            <h1>Храмовая школа для детей и родителей</h1>
            <span>
              Воскресные занятия, творческие мастерские и семейные встречи при храме.
            </span>
            <div className="hero-actions">
              <button onClick={() => setPage('circles')}>Выбрать кружок</button>
              <button className="secondary" onClick={() => setPage('profile')}>
                Личное расписание
              </button>
            </div>
          </div>
          <img className="home-hero-image" src={heroImage} alt="Интерьер православного храма" />
        </div>

        <section className="directions-strip">
          <button onClick={() => setPage('circles')}>
            <UsersRound size={26} />
            <span>
              <strong>Кружки</strong>
              <small>Хор, творчество и занятия для детей</small>
            </span>
          </button>
          <button onClick={() => setPage('profile')}>
            <CalendarDays size={26} />
            <span>
              <strong>Расписание</strong>
              <small>Личный календарь после входа</small>
            </span>
          </button>
          <button onClick={() => scrollToEvents()}>
            <Church size={26} />
            <span>
              <strong>Мероприятия</strong>
              <small>Ближайшие встречи при храме</small>
            </span>
          </button>
        </section>
      </section>

      <section className="section about-section surface">
        <div className="split-heading">
          <h2>О приходской школе</h2>
          <p>
            Небольшое пространство для занятий, творчества и общения после службы.
            Здесь дети знакомятся с церковной традицией через пение, ручную работу
            и общие приходские встречи.
          </p>
        </div>
        <div className="about-grid">
          <article>
            <Church size={24} />
            <h3>Спокойная среда</h3>
            <p>Информация подана бережно и без перегруза, чтобы сайтом было удобно пользоваться всей семье.</p>
          </article>
          <article>
            <Palette size={24} />
            <h3>Творчество</h3>
            <p>Кружки помогают детям заниматься пением, ручной работой и художественными заданиями.</p>
          </article>
          <article>
            <ClipboardList size={24} />
            <h3>Порядок</h3>
            <p>Записи на кружки и отметки посещения собираются в одном понятном расписании.</p>
          </article>
        </div>
      </section>

      <section className="section directions-section">
        <div className="section-title centered">
          <p className="eyebrow">Направления</p>
          <h2>Чем занимается школа</h2>
        </div>
        <div className="direction-cards">
          {schoolDirections.map((direction) => (
            <article key={direction.id}>
              <img src={direction.image} alt="" />
              <div>
                <h3>{direction.title}</h3>
                <p>{direction.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section home-schedule surface">
        <div className="split-heading centered-heading">
          <h2>Расписание занятий</h2>
          <p>
            Ближайшие встречи и занятия кружков на этой неделе.
          </p>
        </div>
        <div className="schedule-preview">
          {homeSchedule.map((item) => (
            <article key={item.id}>
              <span>{item.date}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
        <div className="center-action">
          <button onClick={() => setPage('profile')}>Открыть личное расписание</button>
        </div>
      </section>

      <section className="section workflow-section surface">
        <div className="split-heading">
          <h2>Как все устроено</h2>
          <p>
            Выберите кружок, откройте расписание и следите за ближайшими встречами.
            Для семьи это один понятный маршрут без лишних страниц.
          </p>
        </div>
        <div className="workflow-grid">
          {workflowSteps.map((step, index) => (
            <article key={step.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section news-section surface" id="events">
        <div className="split-heading centered-heading">
          <h2>Новости и события</h2>
          <p>
            Ближайшие праздники, мастерские и встречи школы.
          </p>
        </div>
        {events.length === 0 ? (
          <EmptyState title="Мероприятий пока нет" text="Администратор сможет добавить их позже." />
        ) : (
          <div className="event-grid">
            {events.map((event, index) => (
              <article className="event-card" key={event.id}>
                <img src={event.image_url || eventImages[index % eventImages.length]} alt="" />
                <div>
                  <span>{formatDate(event.event_date)}</span>
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section closing-section">
        <div>
          <p className="eyebrow">Приходская жизнь</p>
          <h2>Место для занятий и доброго общения</h2>
          <p>
            После занятий дети показывают работы, родители знакомятся с расписанием,
            а школа постепенно собирает вокруг себя семьи прихода.
          </p>
        </div>
        <button onClick={() => setPage('circles')}>Посмотреть кружки</button>
      </section>
    </>
  );
}

function Circles({ circles, isGuest, loading, joinCircle, leaveCircle, setPage }) {
  return (
    <section className="section">
      <div className="section-title">
        <p className="eyebrow">Направления</p>
        <h2>Кружки школы</h2>
      </div>
      {circles.length === 0 ? (
        <EmptyState title="Кружки пока не добавлены" text="После добавления они появятся здесь." />
      ) : (
        <div className="circle-grid">
          {circles.map((circle) => (
            <article className="circle-card" key={circle.id}>
              <img
                className="circle-image"
                src={circle.image_url || fallbackEventImage}
                alt=""
              />
              <div className="circle-content">
                <div className="circle-heading">
                  <div className="circle-icon">
                    <UsersRound size={21} />
                  </div>
                  <h3>{circle.title}</h3>
                </div>
                <p>{circle.description}</p>
                <div className="meta">
                  {circle.teacher_name && <span>{circle.teacher_name}</span>}
                  {circle.age_group && <span>{circle.age_group}</span>}
                </div>
                {isGuest ? (
                  <button className="wide secondary" onClick={() => setPage('profile')}>
                    <LogIn size={18} />
                    Войти для записи
                  </button>
                ) : circle.is_joined ? (
                  <button
                    className="wide muted"
                    disabled={loading}
                    onClick={() => leaveCircle(circle.id)}
                  >
                    Вы записаны
                  </button>
                ) : (
                  <button className="wide" disabled={loading} onClick={() => joinCircle(circle.id)}>
                    Записаться
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Schedule({ lessons, setAttendance }) {
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const activeDays = useMemo(
    () => new Set(lessons.map((lesson) => toDateKey(lesson.lesson_date))),
    [lessons],
  );
  const absentDays = useMemo(
    () =>
      new Set(
        Object.entries(groupLessonsByDate(lessons))
          .filter(([, dayLessons]) =>
            dayLessons.every((lesson) => lesson.attendance_status === 'absent'),
          )
          .map(([dateKey]) => dateKey),
      ),
    [lessons],
  );
  const monthDate = lessons[0]?.lesson_date ? new Date(lessons[0].lesson_date) : new Date();
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const selectedLessons = lessons.filter((lesson) => toDateKey(lesson.lesson_date) === selectedDateKey);

  async function markDay(status) {
    await Promise.all(selectedLessons.map((lesson) => setAttendance(lesson.id, status)));
  }

  return (
    <section className="section schedule-layout">
      <div>
        <div className="section-title">
          <p className="eyebrow">Личное расписание</p>
          <h2>Занятия на неделю</h2>
        </div>
        {lessons.length === 0 ? (
          <EmptyState
            title="В расписании пока пусто"
            text="Запишитесь на кружок, и занятия появятся здесь."
          />
        ) : (
          <div className="lesson-list">
            {lessons.map((lesson) => (
              <article className="lesson-card" key={lesson.id}>
                <div className="lesson-date">
                  <strong>{capitalize(weekdayFormatter.format(new Date(lesson.lesson_date)))}</strong>
                  <span>{formatDate(lesson.lesson_date)}</span>
                </div>
                <div className="lesson-main">
                  <h3>{lesson.title}</h3>
                  <p>{lesson.circle_title}</p>
                  <div className="meta">
                    <span>
                      <Clock3 size={16} />
                      {formatTimeRange(lesson.start_time, lesson.end_time)}
                    </span>
                    {lesson.location && <span>{lesson.location}</span>}
                  </div>
                </div>
                <div className="attendance">
                  <button
                    className={lesson.attendance_status === 'attending' ? 'selected' : ''}
                    onClick={() => setAttendance(lesson.id, 'attending')}
                  >
                    Буду
                  </button>
                  <button
                    className={
                      lesson.attendance_status === 'absent' ? 'danger selected' : 'danger'
                    }
                    onClick={() => setAttendance(lesson.id, 'absent')}
                  >
                    Не буду
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <aside className="calendar-panel">
        <div className="panel-title">
          <CalendarDays size={20} />
          <h3>{capitalize(monthFormatter.format(monthDate))}</h3>
        </div>
        <div className="calendar-grid">
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
            const dateKey = toDateKey(date);
            const absent = absentDays.has(dateKey);
            const active = activeDays.has(dateKey);
            const selected = selectedDateKey === dateKey;
            return (
              <button
                key={day}
                className={`${active ? 'has-lesson' : ''} ${absent ? 'absent' : ''} ${selected ? 'selected-day' : ''}`}
                onClick={() => setSelectedDateKey(dateKey)}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="day-panel">
          <h4>{formatSelectedDate(selectedDateKey)}</h4>
          {selectedLessons.length === 0 ? (
            <p>На этот день занятий нет.</p>
          ) : (
            <>
              <p>{selectedLessons.length} занятие(я) в расписании.</p>
              <div className="day-actions">
                <button onClick={() => markDay('attending')}>Буду весь день</button>
                <button className="danger" onClick={() => markDay('absent')}>
                  Не буду весь день
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </section>
  );
}

function Profile({ user, circles, onAuthSuccess, setMessage, setPage }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const joinedCircles = circles.filter((circle) => circle.is_joined);

  async function submit(event) {
    event.preventDefault();
    const path = mode === 'login' ? '/auth/login' : '/auth/register';
    const body =
      mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

    try {
      const data = await apiRequest(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      onAuthSuccess(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!user) {
    return (
      <section className="section auth-panel">
        <UserRound size={40} />
        <h2>{mode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}</h2>
        <p>После входа появится личное расписание и запись на кружки.</p>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <label>
              Имя
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              minLength={6}
              required
            />
          </label>
          <div className="hero-actions">
            <button type="submit">{mode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
            <button
              type="button"
              className="secondary"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Регистрация' : 'Уже есть аккаунт'}
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="section profile-grid">
      <div className="profile-main">
        <div className="avatar">{user.name[0]}</div>
        <h2>{user.name}</h2>
        <p>{user.role === 'admin' ? 'Администратор сайта' : 'Ученик приходской школы'}</p>
        <button onClick={() => setPage('schedule')}>Открыть расписание</button>
      </div>
      <div className="profile-main">
        <h3>Мои кружки</h3>
        {joinedCircles.length === 0 ? (
          <p>Вы пока не записаны на кружки.</p>
        ) : (
          <ul className="plain-list">
            {joinedCircles.map((circle) => (
              <li key={circle.id}>{circle.title}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Admin({ events, circles, refreshEvents, refreshCircles, refreshLessons, setMessage }) {
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    eventDate: '',
  });
  const [circleForm, setCircleForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    teacherName: '',
    ageGroup: '',
  });
  const [lessonForm, setLessonForm] = useState({
    circleId: circles[0]?.id || '',
    title: '',
    description: '',
    lessonDate: '',
    startTime: '',
    endTime: '',
    location: '',
  });
  const [editingEventId, setEditingEventId] = useState('');
  const [editingCircleId, setEditingCircleId] = useState('');
  const [editingLessonId, setEditingLessonId] = useState('');
  const [adminLessons, setAdminLessons] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState('');

  const loadAdminLessons = useCallback(async () => {
    const data = await apiRequest('/lessons');
    setAdminLessons(data);
  }, []);

  useEffect(() => {
    loadAdminLessons().catch((error) => setMessage(error.message));
  }, [loadAdminLessons, setMessage]);

  useEffect(() => {
    if (!lessonForm.circleId && circles[0]?.id) {
      setLessonForm((current) => ({ ...current, circleId: circles[0].id }));
    }
  }, [circles, lessonForm.circleId]);

  async function createEvent(event) {
    event.preventDefault();
    const isEditing = Boolean(editingEventId);
    try {
      await apiRequest(editingEventId ? `/events/${editingEventId}` : '/events', {
        method: editingEventId ? 'PUT' : 'POST',
        body: JSON.stringify(eventForm),
      });
      setEditingEventId('');
      setEventForm({ title: '', description: '', imageUrl: '', eventDate: '' });
      await refreshEvents();
      setMessage(isEditing ? 'Мероприятие обновлено' : 'Мероприятие добавлено');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function createCircle(event) {
    event.preventDefault();
    const isEditing = Boolean(editingCircleId);
    try {
      await apiRequest(editingCircleId ? `/circles/${editingCircleId}` : '/circles', {
        method: editingCircleId ? 'PUT' : 'POST',
        body: JSON.stringify(circleForm),
      });
      setEditingCircleId('');
      setCircleForm({ title: '', description: '', imageUrl: '', teacherName: '', ageGroup: '' });
      await refreshCircles();
      setMessage(isEditing ? 'Кружок обновлен' : 'Кружок добавлен');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function createLesson(event) {
    event.preventDefault();
    const isEditing = Boolean(editingLessonId);
    try {
      await apiRequest(editingLessonId ? `/lessons/${editingLessonId}` : '/lessons', {
        method: editingLessonId ? 'PUT' : 'POST',
        body: JSON.stringify(lessonForm),
      });
      setEditingLessonId('');
      setLessonForm((current) => ({
        circleId: current.circleId,
        title: '',
        description: '',
        lessonDate: '',
        startTime: '',
        endTime: '',
        location: '',
      }));
      await refreshLessons();
      await loadAdminLessons();
      setMessage(isEditing ? 'Занятие обновлено' : 'Занятие добавлено');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteEvent(id) {
    try {
      await apiRequest(`/events/${id}`, { method: 'DELETE' });
      await refreshEvents();
      setMessage('Мероприятие удалено');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteCircle(id) {
    try {
      await apiRequest(`/circles/${id}`, { method: 'DELETE' });
      await Promise.all([refreshCircles(), refreshLessons(), loadAdminLessons()]);
      setMessage('Кружок удален');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteLesson(id) {
    try {
      await apiRequest(`/lessons/${id}`, { method: 'DELETE' });
      await Promise.all([refreshLessons(), loadAdminLessons()]);
      if (selectedLesson === id) {
        setSelectedLesson('');
        setAttendance([]);
      }
      setMessage('Занятие удалено');
    } catch (error) {
      setMessage(error.message);
    }
  }

  function editEvent(item) {
    setEditingEventId(item.id);
    setEventForm({
      title: item.title,
      description: item.description,
      imageUrl: item.image_url || '',
      eventDate: toDateInput(item.event_date),
    });
  }

  function editCircle(item) {
    setEditingCircleId(item.id);
    setCircleForm({
      title: item.title,
      description: item.description,
      imageUrl: item.image_url || '',
      teacherName: item.teacher_name || '',
      ageGroup: item.age_group || '',
    });
  }

  function editLesson(item) {
    setEditingLessonId(item.id);
    setLessonForm({
      circleId: item.circle_id,
      title: item.title,
      description: item.description || '',
      lessonDate: toDateInput(item.lesson_date),
      startTime: String(item.start_time).slice(0, 5),
      endTime: String(item.end_time).slice(0, 5),
      location: item.location || '',
    });
  }

  async function loadAttendance(lessonId) {
    setSelectedLesson(lessonId);
    try {
      const data = await apiRequest(`/lessons/${lessonId}/attendance`);
      setAttendance(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="section admin-section">
      <div className="admin-hero">
        <div>
          <p className="eyebrow">Управление</p>
          <h2>Панель администратора</h2>
          <p>Добавляйте кружки, занятия и мероприятия, а также смотрите посещаемость.</p>
        </div>
        <div className="admin-stats">
          <article>
            <strong>{events.length}</strong>
            <span>мероприятий</span>
          </article>
          <article>
            <strong>{circles.length}</strong>
            <span>кружков</span>
          </article>
          <article>
            <strong>{adminLessons.length}</strong>
            <span>занятий</span>
          </article>
        </div>
      </div>

      <div className="admin-workspace">
        <form className="admin-card admin-form" onSubmit={createEvent}>
          <div className="admin-card-title">
            <h3>{editingEventId ? 'Редактирование мероприятия' : 'Новое мероприятие'}</h3>
            {editingEventId && <span>режим правки</span>}
          </div>
          <input
            placeholder="Название"
            value={eventForm.title}
            onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })}
            required
          />
          <textarea
            placeholder="Описание"
            value={eventForm.description}
            onChange={(event) => setEventForm({ ...eventForm, description: event.target.value })}
            required
          />
          <input
            placeholder="Ссылка на изображение"
            value={eventForm.imageUrl}
            onChange={(event) => setEventForm({ ...eventForm, imageUrl: event.target.value })}
          />
          <input
            type="date"
            value={eventForm.eventDate}
            onChange={(event) => setEventForm({ ...eventForm, eventDate: event.target.value })}
            required
          />
          <button>{editingEventId ? 'Сохранить мероприятие' : 'Добавить мероприятие'}</button>
        </form>

        <form className="admin-card admin-form" onSubmit={createCircle}>
          <div className="admin-card-title">
            <h3>{editingCircleId ? 'Редактирование кружка' : 'Новый кружок'}</h3>
            {editingCircleId && <span>режим правки</span>}
          </div>
          <input
            placeholder="Название"
            value={circleForm.title}
            onChange={(event) => setCircleForm({ ...circleForm, title: event.target.value })}
            required
          />
          <textarea
            placeholder="Описание"
            value={circleForm.description}
            onChange={(event) => setCircleForm({ ...circleForm, description: event.target.value })}
            required
          />
          <input
            placeholder="Ссылка на изображение"
            value={circleForm.imageUrl}
            onChange={(event) => setCircleForm({ ...circleForm, imageUrl: event.target.value })}
          />
          <input
            placeholder="Преподаватель"
            value={circleForm.teacherName}
            onChange={(event) =>
              setCircleForm({ ...circleForm, teacherName: event.target.value })
            }
          />
          <input
            placeholder="Возраст"
            value={circleForm.ageGroup}
            onChange={(event) => setCircleForm({ ...circleForm, ageGroup: event.target.value })}
          />
          <button>{editingCircleId ? 'Сохранить кружок' : 'Добавить кружок'}</button>
        </form>

        <form className="admin-card admin-form" onSubmit={createLesson}>
          <div className="admin-card-title">
            <h3>{editingLessonId ? 'Редактирование занятия' : 'Новое занятие'}</h3>
            {editingLessonId && <span>режим правки</span>}
          </div>
          <select
            value={lessonForm.circleId}
            onChange={(event) => setLessonForm({ ...lessonForm, circleId: event.target.value })}
            required
          >
            <option value="">Выберите кружок</option>
            {circles.map((circle) => (
              <option key={circle.id} value={circle.id}>
                {circle.title}
              </option>
            ))}
          </select>
          <input
            placeholder="Название"
            value={lessonForm.title}
            onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })}
            required
          />
          <textarea
            placeholder="Описание"
            value={lessonForm.description}
            onChange={(event) =>
              setLessonForm({ ...lessonForm, description: event.target.value })
            }
          />
          <input
            type="date"
            value={lessonForm.lessonDate}
            onChange={(event) =>
              setLessonForm({ ...lessonForm, lessonDate: event.target.value })
            }
            required
          />
          <div className="form-row">
            <input
              type="time"
              value={lessonForm.startTime}
              onChange={(event) =>
                setLessonForm({ ...lessonForm, startTime: event.target.value })
              }
              required
            />
            <input
              type="time"
              value={lessonForm.endTime}
              onChange={(event) => setLessonForm({ ...lessonForm, endTime: event.target.value })}
              required
            />
          </div>
          <input
            placeholder="Место"
            value={lessonForm.location}
            onChange={(event) => setLessonForm({ ...lessonForm, location: event.target.value })}
          />
          <button>{editingLessonId ? 'Сохранить занятие' : 'Добавить занятие'}</button>
        </form>

        <div className="admin-card admin-table">
          <h3>Материалы сайта</h3>
          <div className="admin-columns">
            <AdminList
              title="Мероприятия"
              items={events}
              getSubtitle={(item) => formatDate(item.event_date)}
              onEdit={editEvent}
              onDelete={deleteEvent}
            />
            <AdminList
              title="Кружки"
              items={circles}
              getSubtitle={(item) => item.teacher_name || 'Преподаватель не указан'}
              onEdit={editCircle}
              onDelete={deleteCircle}
            />
          </div>
        </div>

        <div className="admin-card admin-table">
          <h3>Посещаемость</h3>
          {adminLessons.length === 0 ? (
            <p>Занятий пока нет.</p>
          ) : (
            <div className="lesson-admin-list">
              {adminLessons.map((lesson) => (
                <div className="admin-list-row lesson-management-row" key={lesson.id}>
                  <button
                    className={selectedLesson === lesson.id ? 'selected-row' : 'lesson-row'}
                    onClick={() => loadAttendance(lesson.id)}
                  >
                    <span>
                      <strong>{lesson.title}</strong>
                      <small>{lesson.circle_title} - {formatDate(lesson.lesson_date)}</small>
                    </span>
                    <span>{lesson.attending_count}/{lesson.members_count}</span>
                  </button>
                  <div className="row-actions">
                    <button className="secondary" onClick={() => editLesson(lesson)}>
                      Изменить
                    </button>
                    <button className="danger-button" onClick={() => deleteLesson(lesson.id)}>
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {attendance.length > 0 && (
            <div className="attendance-list">
              {attendance.map((person) => (
                <div key={person.id}>
                  <span>{person.name}</span>
                  <strong>{person.status === 'absent' ? 'не будет' : 'будет'}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AdminList({ title, items, getSubtitle, onEdit, onDelete }) {
  return (
    <div className="admin-list">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p>Пока пусто.</p>
      ) : (
        items.map((item) => (
          <div className="admin-list-row" key={item.id}>
            <span>
              <strong>{item.title}</strong>
              <small>{getSubtitle(item)}</small>
            </span>
            <div className="row-actions">
              <button className="secondary" onClick={() => onEdit(item)}>Изменить</button>
              <button className="danger-button" onClick={() => onDelete(item.id)}>Удалить</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('hram_user'));
  } catch {
    return null;
  }
}

function withFallbackEvents(items) {
  const existingTitles = new Set(items.map((event) => event.title));
  const additions = fallbackEvents.filter((event) => !existingTitles.has(event.title));
  return [...items, ...additions].slice(0, Math.max(items.length, 3));
}

function scrollToEvents() {
  document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
}

function formatDate(value) {
  return dateFormatter.format(new Date(value));
}

function formatSelectedDate(value) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date(`${value}T00:00:00`));
}

function toDateInput(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function toDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function groupLessonsByDate(items) {
  return items.reduce((acc, lesson) => {
    const key = toDateKey(lesson.lesson_date);
    acc[key] = [...(acc[key] || []), lesson];
    return acc;
  }, {});
}

function formatTimeRange(start, end) {
  return `${String(start).slice(0, 5)}-${String(end).slice(0, 5)}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

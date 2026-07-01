import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Требуется вход в аккаунт' });
  }

  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Сессия недействительна' });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    req.user = null;
  }

  return next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Недостаточно прав' });
  }

  return next();
}

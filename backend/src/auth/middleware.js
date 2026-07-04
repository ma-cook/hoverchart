import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = header.slice(7);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    try {
      req.guest = jwt.verify(token, process.env.JWT_GUEST_SECRET);
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      try {
        req.guest = jwt.verify(token, process.env.JWT_GUEST_SECRET);
      } catch {
        // No valid token — continue without auth
      }
    }
  }
  next();
}

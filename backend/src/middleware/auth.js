const DEFAULT_USER_ID = 'default-user';

export function requireAuth(req, res, next) {
  req.userId = DEFAULT_USER_ID;
  next();
}

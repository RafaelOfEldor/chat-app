import { AuthenticationRouter } from './AuthenticationRouter.js';
import { UsersRouter } from './UsersRouter.js';
import { ChatRouter } from './ChatRouter.js';

export function setupRoutes(app, db) {
  app.use('/api/auth', AuthenticationRouter(db));
  app.use('/api/users', UsersRouter(db));
  app.use('/api/chats', ChatRouter(db));
}

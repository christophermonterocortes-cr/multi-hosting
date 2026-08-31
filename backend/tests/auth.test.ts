import { AuthService } from '../src/services/auth.service';
import { db, initDatabase } from '../src/config/database';

describe('AuthService & Security Policy Tests', () => {
  beforeAll(() => {
    initDatabase();
  });

  beforeEach(() => {
    db.prepare('DELETE FROM users WHERE username != \'admin\'').run();
  });

  it('should register a new regular user', async () => {
    const user = await AuthService.register('user1@example.com', 'user1', 'Password123!', 'USER');
    expect(user.id).toBeDefined();
    expect(user.username).toBe('user1');
    expect(user.role).toBe('USER');
  });

  it('should authenticate user and generate valid JWT token', async () => {
    const user = await AuthService.register('user2@example.com', 'user2', 'Password123!', 'USER');
    const { user: loggedIn, token } = await AuthService.login('user2', 'Password123!');

    expect(loggedIn.id).toBe(user.id);
    expect(token).toBeDefined();

    const decoded = AuthService.verifyToken(token);
    expect(decoded.userId).toBe(user.id);
    expect(decoded.username).toBe('user2');
  });

  it('should lock user account after repeated failed login attempts', async () => {
    await AuthService.register('target@example.com', 'targetuser', 'CorrectPass123!', 'USER');

    // Fail 4 times
    for (let i = 0; i < 4; i++) {
      await expect(AuthService.login('targetuser', 'WrongPass')).rejects.toThrow('Invalid credentials');
    }

    // 5th failed attempt should trigger lockout
    await expect(AuthService.login('targetuser', 'WrongPass')).rejects.toThrow(/Account has been locked/);

    // Subsequent login with correct password should still be blocked while locked
    await expect(AuthService.login('targetuser', 'CorrectPass123!')).rejects.toThrow(/temporarily locked/);
  });
});

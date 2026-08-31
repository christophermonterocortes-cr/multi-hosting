import { encrypt, decrypt, generateSecurePassword, maskSensitiveData } from '../src/utils/crypto';
import { DatabaseService } from '../src/services/database.service';
import { db, initDatabase } from '../src/config/database';

describe('Database & Cryptography Tests', () => {
  beforeAll(() => {
    initDatabase();
  });

  it('should securely encrypt and decrypt database passwords with AES-256-GCM', () => {
    const rawSecret = 'super_secret_db_pass_123!@#$';
    const { encryptedText, iv, authTag } = encrypt(rawSecret);

    expect(encryptedText).not.toBe(rawSecret);
    expect(iv).toBeDefined();
    expect(authTag).toBeDefined();

    const decrypted = decrypt(encryptedText, iv, authTag);
    expect(decrypted).toBe(rawSecret);
  });

  it('should fail decryption if authTag is tampered with', () => {
    const rawSecret = 'sensitive_data';
    const { encryptedText, iv } = encrypt(rawSecret);
    const fakeAuthTag = '0123456789abcdef0123456789abcdef';

    expect(() => {
      decrypt(encryptedText, iv, fakeAuthTag);
    }).toThrow();
  });

  it('should generate high entropy secure passwords of requested length', () => {
    const pass1 = generateSecurePassword(32);
    const pass2 = generateSecurePassword(32);

    expect(pass1.length).toBe(32);
    expect(pass2.length).toBe(32);
    expect(pass1).not.toBe(pass2);
  });

  it('should redact sensitive secrets in object data masks', () => {
    const rawLog = {
      action: 'LOGIN',
      username: 'alice',
      password: 'mypassword',
      nested: {
        token: 'secret_token_123',
        safeProperty: 'hello'
      }
    };

    const masked = maskSensitiveData(rawLog);
    expect(masked.password).toBe('***REDACTED***');
    expect(masked.nested.token).toBe('***REDACTED***');
    expect(masked.username).toBe('alice');
    expect(masked.nested.safeProperty).toBe('hello');
  });
});

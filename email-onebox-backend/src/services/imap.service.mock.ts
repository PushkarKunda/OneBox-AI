/**
 * Mock IMAP service to replace the broken node-imap dependency
 * This provides a placeholder implementation until IMAP is properly configured
 */

interface EmailAccount {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  tlsOptions: { rejectUnauthorized: boolean };
}

export const connectToImap = (config: EmailAccount): void => {
  console.log(`📧 Mock IMAP connection for ${config.user}`);
  console.log(
    '⚠️ IMAP service is currently mocked. Configure proper IMAP integration to sync emails.',
  );

  // Simulate connection success
  setTimeout(() => {
    console.log(`✅ Mock IMAP connection ready for ${config.user}`);
  }, 1000);
};

import { JwtService } from '@nestjs/jwt';

export const QA_JWT_SECRET = 'uniconnect-test-key';

const _jwtService = new JwtService({ secret: QA_JWT_SECRET });

export function signTestJwt(
  userId: number,
  roleName = 'student',
  permissions: string[] = [],
): string {
  return _jwtService.sign({ sub: userId, permissions, roleName });
}

export function createConfigServiceMock() {
  return {
    get: (key: string) => {
      switch (key) {
        case 'JWT_SECRET': return QA_JWT_SECRET;
        case 'AWS_REGION': return 'us-east-1';
        case 'AWS_S3_BUCKET_NAME': return 'test-bucket';
        case 'AWS_ACCESS_KEY_ID': return 'test-key';
        case 'AWS_SECRET_ACCESS_KEY': return 'test-secret';
        case 'AUTH0_DOMAIN': return 'test.auth0.com';
        case 'AUTH0_CLIENT_ID': return 'test-client-id';
        case 'AUTH0_CLIENT_SECRET': return 'test-client-secret';
        case 'AUTH0_AUDIENCE': return 'test-audience';
        default: return undefined;
      }
    },
  };
}

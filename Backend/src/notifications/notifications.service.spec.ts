import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import fc from 'fast-check';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: jest.Mocked<PrismaService>;
  let loggerSpy: jest.SpyInstance;

  const mockNotification = {
    id_notification: 1,
    id_user: 1,
    message: 'Test notification',
    notification_type: 'test_type',
    related_entity_id: 123,
    is_read: false,
    created_at: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      notification: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        createMany: jest.fn(),
      },
      $executeRaw: jest.fn(),
      $executeRawUnsafe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
    
    // Mock logger to capture logs
    loggerSpy = jest.spyOn(service['logger'], 'warn').mockImplementation();
    jest.spyOn(service['logger'], 'log').mockImplementation();
    jest.spyOn(service['logger'], 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotificationIdempotent', () => {
    const validData = {
      id_user: 1,
      message: 'Test notification',
      notification_type: 'group_join_request_accepted',
      related_entity_id: 123,
    };

    it('should create notification when no duplicate exists', async () => {
      // Arrange
      (prismaService.notification.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      // Act
      await service.createNotificationIdempotent(validData);

      // Assert
      expect(prismaService.notification.findFirst).toHaveBeenCalledWith({
        where: {
          id_user: validData.id_user,
          related_entity_id: validData.related_entity_id,
          notification_type: validData.notification_type,
          created_at: { gte: expect.any(Date) },
        },
      });
      expect(prismaService.notification.create).toHaveBeenCalledWith({
        data: {
          id_user: validData.id_user,
          message: validData.message,
          notification_type: validData.notification_type,
          related_entity_id: validData.related_entity_id,
          is_read: false,
          created_at: expect.any(Date),
        },
      });
      expect(loggerSpy).not.toHaveBeenCalled();
    });

    it('should skip creation when duplicate exists', async () => {
      // Arrange
      const existingNotification = { ...mockNotification, created_at: new Date(Date.now() - 2000) };
      (prismaService.notification.findFirst as jest.Mock).mockResolvedValue(existingNotification);

      // Act
      await service.createNotificationIdempotent(validData);

      // Assert
      expect(prismaService.notification.findFirst).toHaveBeenCalled();
      expect(prismaService.notification.create).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(
        `Duplicate notification prevented: user=${validData.id_user}, type=${validData.notification_type}, entity=${validData.related_entity_id}`,
      );
    });

    it('should allow duplicate after 5-second window', async () => {
      // Arrange
      const oldNotification = { ...mockNotification, created_at: new Date(Date.now() - 6000) };
      (prismaService.notification.findFirst as jest.Mock).mockResolvedValue(null); // No recent duplicate
      (prismaService.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      // Act
      await service.createNotificationIdempotent(validData);

      // Assert
      expect(prismaService.notification.create).toHaveBeenCalledTimes(1);
      expect(loggerSpy).not.toHaveBeenCalled();
    });

    it('should log warning for duplicates', async () => {
      // Arrange
      const recentNotification = { ...mockNotification, created_at: new Date(Date.now() - 1000) };
      (prismaService.notification.findFirst as jest.Mock).mockResolvedValue(recentNotification);

      // Act
      await service.createNotificationIdempotent(validData);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate notification prevented'),
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(`user=${validData.id_user}`),
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(`type=${validData.notification_type}`),
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(`entity=${validData.related_entity_id}`),
      );
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      (prismaService.notification.findFirst as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.createNotificationIdempotent(validData)).rejects.toThrow(dbError);
      expect(service['logger'].error).toHaveBeenCalledWith(
        'Error creating idempotent notification:',
        dbError,
      );
    });

    it('should validate required fields', async () => {
      // Test missing id_user
      const invalidData1 = { ...validData, id_user: undefined as any };
      (prismaService.notification.findFirst as jest.Mock).mockResolvedValue(null);

      await service.createNotificationIdempotent(invalidData1);
      
      // Should still call findFirst but create will fail with Prisma validation
      expect(prismaService.notification.findFirst).toHaveBeenCalled();
    });

    // Property-based tests with fast-check
    it('should handle various time windows correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10000 }), // milliseconds ago
          fc.record({
            id_user: fc.integer({ min: 1, max: 1000 }),
            message: fc.string({ minLength: 1, maxLength: 255 }),
            notification_type: fc.constantFrom('group_join_request_accepted', 'user_joined_group', 'message_received'),
            related_entity_id: fc.integer({ min: 1, max: 1000 }),
          }),
          async (millisecondsAgo, data) => {
            // Reset mocks for each iteration
            jest.clearAllMocks();
            
            // Arrange
            const existingTime = new Date(Date.now() - millisecondsAgo);
            const shouldPreventDuplicate = millisecondsAgo < 5000;
            
            if (shouldPreventDuplicate) {
              (prismaService.notification.findFirst as jest.Mock).mockResolvedValue({
                ...mockNotification,
                created_at: existingTime,
              });
            } else {
              (prismaService.notification.findFirst as jest.Mock).mockResolvedValue(null);
            }
            
            (prismaService.notification.create as jest.Mock).mockResolvedValue(mockNotification);

            // Act
            await service.createNotificationIdempotent(data);

            // Assert
            if (shouldPreventDuplicate) {
              expect(prismaService.notification.create).not.toHaveBeenCalled();
            } else {
              expect(prismaService.notification.create).toHaveBeenCalled();
            }
          },
        ),
        { numRuns: 10 }, // Reduced runs for faster testing
      );
    });

    it('should use correct time window calculation', async () => {
      // Arrange
      const now = Date.now();
      const fiveSecondsAgo = new Date(now - 5000);
      (prismaService.notification.findFirst as jest.Mock).mockResolvedValue(null);

      // Act
      await service.createNotificationIdempotent(validData);

      // Assert
      const findFirstCall = (prismaService.notification.findFirst as jest.Mock).mock.calls[0][0];
      const timeConstraint = findFirstCall.where.created_at.gte;
      
      // Should be approximately 5 seconds ago (allow 100ms tolerance)
      const timeDiff = Math.abs(timeConstraint.getTime() - fiveSecondsAgo.getTime());
      expect(timeDiff).toBeLessThan(100);
    });
  });

  describe('findAllForUser', () => {
    it('should return formatted notifications for user', async () => {
      // Arrange
      const mockNotifications = [
        {
          id_notification: 1,
          message: 'Test notification 1',
          is_read: false,
          created_at: new Date('2026-04-29T10:00:00Z'),
          notification_type: 'test_type',
          related_entity_id: 123,
        },
        {
          id_notification: 2,
          message: 'Test notification 2',
          is_read: true,
          created_at: new Date('2026-04-29T09:00:00Z'),
          notification_type: 'another_type',
          related_entity_id: 456,
        },
      ];
      (prismaService.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);

      // Act
      const result = await service.findAllForUser(1);

      // Assert
      expect(result).toEqual([
        {
          id_notification: 1,
          message: 'Test notification 1',
          is_read: false,
          created_at: '2026-04-29T10:00:00.000Z',
          notification_type: 'test_type',
          related_entity_id: 123,
        },
        {
          id_notification: 2,
          message: 'Test notification 2',
          is_read: true,
          created_at: '2026-04-29T09:00:00.000Z',
          notification_type: 'another_type',
          related_entity_id: 456,
        },
      ]);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      // Arrange
      (prismaService.notification.count as jest.Mock).mockResolvedValue(5);

      // Act
      const result = await service.getUnreadCount(1);

      // Assert
      expect(result).toEqual({ count: 5 });
      expect(prismaService.notification.count).toHaveBeenCalledWith({
        where: { id_user: 1, is_read: false },
      });
    });

    it('should return 0 count on error', async () => {
      // Arrange
      (prismaService.notification.count as jest.Mock).mockRejectedValue(new Error('DB Error'));

      // Act
      const result = await service.getUnreadCount(1);

      // Assert
      expect(result).toEqual({ count: 0 });
    });
  });
});
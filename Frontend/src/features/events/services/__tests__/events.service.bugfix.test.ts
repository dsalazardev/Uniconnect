/**
 * Bug Condition Exploration Tests - EventsService updateEvent Method
 *
 * **Validates: Requirements 1.4, 2.8**
 *
 * CRITICAL: These tests MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the tests or code when they fail
 * NOTE: These tests encode the expected behavior - they will validate the fix when they pass after implementation
 * OBJECTIVE: Expose counterexamples that demonstrate the bug exists
 *
 * Expected Counterexamples: "updateEvent method does not exist in EventsService"
 */

import { EventsService } from '../events.service';
import { EventType } from '../../types/event.types';
import { api } from '@/src/constants/api';

jest.mock('@/src/constants/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockPutResponse = {
  data: {
    success: true,
    data: {
      id_event: 123,
      title: 'Updated Event',
      description: 'Updated Description',
      date: '2024-12-31',
      time: '10:00',
      location: 'Updated Location',
      type: EventType.CONFERENCIA,
      created_by: 5,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    error: null,
    metadata: {
      total: 1,
      page: 1,
      pageSize: 20,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  },
};

describe('Bug Condition Exploration - EventsService updateEvent', () => {
  let service: EventsService;

  beforeEach(() => {
    service = new EventsService();
    jest.clearAllMocks();
  });

  /**
   * Property 1: Fault Condition - updateEvent Method Exists
   *
   * The EventsService SHALL have an updateEvent method
   */
  it('should have updateEvent method', () => {
    // This WILL FAIL because updateEvent doesn't exist yet
    // Expected counterexample: "updateEvent is not a function"
    expect(typeof service.updateEvent).toBe('function');
  });

  /**
   * Property 2: Fault Condition - updateEvent Method Signature
   *
   * The updateEvent method SHALL accept (id: number, payload: UpdateEventPayload)
   * and return Promise<FENResponse<Event>>
   */
  it('should have correct updateEvent method signature', async () => {
    (api.put as jest.Mock).mockResolvedValue(mockPutResponse);

    const mockPayload = {
      title: 'Updated Event',
      description: 'Updated Description',
      date: '2024-12-31',
      time: '10:00',
      location: 'Updated Location',
      type: EventType.CONFERENCIA,
    };

    expect(service.updateEvent).toBeDefined();

    const result = service.updateEvent(123, mockPayload);
    expect(result).toBeInstanceOf(Promise);

    await result;
  });

  /**
   * Property 3: Fault Condition - updateEvent Calls Correct Endpoint
   *
   * The updateEvent method SHALL call PUT /events/:id endpoint
   */
  it('should call PUT /events/:id endpoint', async () => {
    (api.put as jest.Mock).mockResolvedValue(mockPutResponse);

    const mockPayload = {
      title: 'Updated Event',
      description: 'Updated Description',
      date: '2024-12-31',
      time: '10:00',
      location: 'Updated Location',
      type: EventType.CONFERENCIA,
    };

    await expect(service.updateEvent(123, mockPayload)).resolves.not.toThrow();

    expect(api.put).toHaveBeenCalledWith(
      expect.stringContaining('123'),
      mockPayload,
    );
  });
});

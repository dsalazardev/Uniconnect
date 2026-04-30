/**
 * Preservation Tests - EventsStore Existing Behaviors
 * 
 * **Validates: Requirements 3.5, 3.7**
 * 
 * IMPORTANT: Follow observation-first methodology
 * - Observe behavior in UNFIXED code for non-buggy inputs
 * - Write property-based tests capturing observed behavior patterns
 * 
 * EXPECTED RESULT: Tests PASS (confirms baseline behavior to preserve)
 * 
 * Behaviors to observe and capture:
 * 1. loadEvents() works correctly
 * 2. Creating event refreshes list automatically
 */

import * as fc from 'fast-check';
import { EventsStore } from '../events.store';
import { Event, EventType, CreateEventPayload } from '../../types/event.types';
import { EventsService } from '../../services/events.service';

describe('Preservation Tests - EventsStore Existing Behaviors', () => {
  /**
   * Property 1: Preservation - loadEvents() Works Correctly
   * 
   * OBSERVATION: eventsStore.loadEvents() successfully fetches events from API
   * and updates the store state
   * 
   * PRESERVATION: After adding edit functionality, loadEvents() should continue working
   * 
   * For any valid API response, loadEvents() SHALL update events array and metadata
   */
  describe('Property 1: loadEvents() works correctly', () => {
    it('should load events and update store state', async () => {
      // Mock service
      const mockEvents: Event[] = [
        {
          id_event: 1,
          title: 'Event 1',
          description: 'Description 1',
          date: '2024-12-31',
          time: '10:00',
          location: 'Location 1',
          type: EventType.CONFERENCIA,
          created_by: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const mockService = {
        getEvents: jest.fn().mockResolvedValue({
          success: true,
          data: mockEvents,
          metadata: { total: 1, page: 1, limit: 10 },
        }),
      } as unknown as EventsService;

      const store = new EventsStore(mockService);

      // OBSERVATION: loadEvents() updates store state
      await store.loadEvents();

      // Verify current behavior
      expect(store.events).toEqual(mockEvents);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(mockService.getEvents).toHaveBeenCalledTimes(1);
    });

    it('property-based: loadEvents() handles various API responses', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random event arrays
          fc.array(
            fc.record({
              id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 1, maxLength: 500 }),
              date: fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }).filter(d => !isNaN(d.getTime())).map(d => d.toISOString().split('T')[0]),
              time: fc.string({ minLength: 5, maxLength: 5 }),
              location: fc.string({ minLength: 1, maxLength: 100 }),
              type: fc.constantFrom(...Object.values(EventType)),
              created_by: fc.integer({ min: 1, max: 1000 }),
              createdAt: fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }).filter(d => !isNaN(d.getTime())).map(d => d.toISOString()),
              updatedAt: fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }).filter(d => !isNaN(d.getTime())).map(d => d.toISOString()),
            }),
            { minLength: 0, maxLength: 50 }
          ),
          async (eventsData) => {
            const mockEvents: Event[] = eventsData;

            const mockService = {
              getEvents: jest.fn().mockResolvedValue({
                success: true,
                data: mockEvents,
                metadata: { total: mockEvents.length, page: 1, limit: 10 },
              }),
            } as unknown as EventsService;

            const store = new EventsStore(mockService);

            // OBSERVATION: loadEvents() correctly updates state for any valid response
            await store.loadEvents();

            expect(store.events).toEqual(mockEvents);
            expect(store.loading).toBe(false);
            expect(store.error).toBeNull();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 2: Preservation - Creating Event Refreshes List Automatically
   * 
   * OBSERVATION: After successful event creation, eventsStore.createEvent()
   * automatically calls loadEvents() to refresh the list
   * 
   * PRESERVATION: This auto-refresh behavior should continue after adding edit functionality
   * 
   * For any successful event creation, createEvent() SHALL call loadEvents()
   */
  describe('Property 2: Creating event refreshes list automatically', () => {
    it('should call loadEvents() after successful event creation', async () => {
      const mockCreatedEvent: Event = {
        id_event: 999,
        title: 'New Event',
        description: 'New Description',
        date: '2024-12-31',
        time: '10:00',
        location: 'New Location',
        type: EventType.CONFERENCIA,
        created_by: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockService = {
        createEvent: jest.fn().mockResolvedValue({
          success: true,
          data: mockCreatedEvent,
        }),
        getEvents: jest.fn().mockResolvedValue({
          success: true,
          data: [mockCreatedEvent],
          metadata: { total: 1, page: 1, limit: 10 },
        }),
      } as unknown as EventsService;

      const store = new EventsStore(mockService);

      const payload: CreateEventPayload = {
        title: 'New Event',
        description: 'New Description',
        date: '2024-12-31',
        time: '10:00',
        location: 'New Location',
        type: EventType.CONFERENCIA,
      };

      // OBSERVATION: createEvent() calls loadEvents() after success
      await store.createEvent(payload);

      // Verify auto-refresh behavior
      expect(mockService.createEvent).toHaveBeenCalledTimes(1);
      expect(mockService.getEvents).toHaveBeenCalledTimes(1); // loadEvents() was called
      expect(store.events).toEqual([mockCreatedEvent]);
    });

    it('property-based: auto-refresh works for any valid event creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random event payloads
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
            date: fc.date().map(d => d.toISOString().split('T')[0]),
            time: fc.string({ minLength: 5, maxLength: 5 }),
            location: fc.string({ minLength: 1, maxLength: 100 }),
            type: fc.constantFrom(...Object.values(EventType)),
          }),
          async (payloadData) => {
            const payload: CreateEventPayload = payloadData;

            const mockCreatedEvent: Event = {
              id_event: 1000,
              ...payload,
              created_by: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            const mockService = {
              createEvent: jest.fn().mockResolvedValue({
                success: true,
                data: mockCreatedEvent,
              }),
              getEvents: jest.fn().mockResolvedValue({
                success: true,
                data: [mockCreatedEvent],
                metadata: { total: 1, page: 1, limit: 10 },
              }),
            } as unknown as EventsService;

            const store = new EventsStore(mockService);

            // OBSERVATION: Auto-refresh happens for any successful creation
            await store.createEvent(payload);

            expect(mockService.getEvents).toHaveBeenCalled(); // loadEvents() was called
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});

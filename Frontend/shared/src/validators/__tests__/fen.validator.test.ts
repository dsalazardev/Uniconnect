import { z } from 'zod';
import {
  createFENResponseSchema,
  BaseFENResponseSchema,
  validateFENResponse,
  safeFENResponseValidation,
} from '../fen.validator';

describe('FEN Validator', () => {
  describe('BaseFENResponseSchema', () => {
    it('should validate a valid FEN response with data', () => {
      const validResponse = {
        success: true,
        data: { id: 1, name: 'Test' },
        error: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      const result = BaseFENResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should validate a valid FEN response with null data', () => {
      const validResponse = {
        success: false,
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      const result = BaseFENResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should reject response without success field', () => {
      const invalidResponse = {
        data: { id: 1 },
        error: null,
      };

      const result = BaseFENResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject response with invalid success type', () => {
      const invalidResponse = {
        success: 'true', // should be boolean
        data: { id: 1 },
        error: null,
      };

      const result = BaseFENResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should accept response without metadata', () => {
      const validResponse = {
        success: true,
        data: { id: 1 },
        error: null,
      };

      const result = BaseFENResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('createFENResponseSchema', () => {
    const TestDataSchema = z.object({
      id: z.number(),
      name: z.string(),
    });

    const TestFENSchema = createFENResponseSchema(TestDataSchema);

    it('should validate response with correct data structure', () => {
      const validResponse = {
        success: true,
        data: { id: 1, name: 'Test' },
        error: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      const result = TestFENSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should reject response with incorrect data structure', () => {
      const invalidResponse = {
        success: true,
        data: { id: 'not-a-number', name: 'Test' }, // id should be number
        error: null,
      };

      const result = TestFENSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should accept null data when success is false', () => {
      const validResponse = {
        success: false,
        data: null,
        error: {
          code: 'ERROR',
          message: 'Something went wrong',
        },
      };

      const result = TestFENSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('validateFENResponse', () => {
    it('should validate basic FEN structure without data schema', () => {
      const response = {
        success: true,
        data: { anything: 'goes' },
        error: null,
      };

      expect(() => validateFENResponse(response)).not.toThrow();
    });

    it('should validate FEN structure with data schema', () => {
      const TestSchema = z.object({ id: z.number() });
      const response = {
        success: true,
        data: { id: 1 },
        error: null,
      };

      expect(() => validateFENResponse(response, TestSchema)).not.toThrow();
    });

    it('should throw ZodError for invalid structure', () => {
      const invalidResponse = {
        success: 'not-boolean',
        data: null,
      };

      expect(() => validateFENResponse(invalidResponse)).toThrow(z.ZodError);
    });

    it('should throw ZodError for invalid data when schema provided', () => {
      const TestSchema = z.object({ id: z.number() });
      const response = {
        success: true,
        data: { id: 'not-a-number' },
        error: null,
      };

      expect(() => validateFENResponse(response, TestSchema)).toThrow(z.ZodError);
    });
  });

  describe('safeFENResponseValidation', () => {
    it('should return success object for valid response', () => {
      const response = {
        success: true,
        data: { id: 1 },
        error: null,
      };

      const result = safeFENResponseValidation(response);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(response);
      }
    });

    it('should return error object for invalid response', () => {
      const invalidResponse = {
        success: 'not-boolean',
        data: null,
      };

      const result = safeFENResponseValidation(invalidResponse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
      }
    });

    it('should validate with data schema', () => {
      const TestSchema = z.object({ id: z.number() });
      const response = {
        success: true,
        data: { id: 1 },
        error: null,
      };

      const result = safeFENResponseValidation(response, TestSchema);
      expect(result.success).toBe(true);
    });

    it('should return error for invalid data with schema', () => {
      const TestSchema = z.object({ id: z.number() });
      const response = {
        success: true,
        data: { id: 'not-a-number' },
        error: null,
      };

      const result = safeFENResponseValidation(response, TestSchema);
      expect(result.success).toBe(false);
    });
  });

  describe('FEN Metadata Schema', () => {
    it('should validate pagination metadata', () => {
      const response = {
        success: true,
        data: [],
        error: null,
        metadata: {
          total: 100,
          page: 1,
          pageSize: 10,
          hasNextPage: true,
          hasPreviousPage: false,
          timestamp: new Date().toISOString(),
        },
      };

      const result = BaseFENResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('should accept partial metadata', () => {
      const response = {
        success: true,
        data: [],
        error: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      const result = BaseFENResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe('FEN Error Schema', () => {
    it('should validate error object', () => {
      const response = {
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
        },
      };

      const result = BaseFENResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('should accept null error', () => {
      const response = {
        success: true,
        data: { id: 1 },
        error: null,
      };

      const result = BaseFENResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('should reject error without code', () => {
      const response = {
        success: false,
        data: null,
        error: {
          message: 'Error message',
        },
      };

      const result = BaseFENResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });

    it('should reject error without message', () => {
      const response = {
        success: false,
        data: null,
        error: {
          code: 'ERROR_CODE',
        },
      };

      const result = BaseFENResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });
});

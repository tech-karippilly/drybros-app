/**
 * Validation utilities
 */

// UUID validation regex - centralized to avoid duplication
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID format
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Validates multiple UUIDs and returns invalid ones
 */
export function validateUUIDs(ids: string[]): string[] {
  return ids.filter((id) => !isValidUUID(id));
}

/**
 * Validates a single UUID and throws an error if invalid
 */
export function requireValidUUID(id: string | string[] | undefined, fieldName: string = "ID"): void {
  if (!id || Array.isArray(id)) {
    const error: any = new Error(`Invalid ${fieldName} format. Expected UUID.`);
    error.statusCode = 400;
    throw error;
  }
  
  if (!isValidUUID(id)) {
    const error: any = new Error(`Invalid ${fieldName} format. Expected UUID.`);
    error.statusCode = 400;
    throw error;
  }
}

/**
 * Validates a UUID and returns it as a string, or throws an error if invalid
 */
export function validateAndGetUUID(id: string | string[] | undefined, fieldName: string = "ID"): string {
  if (!id || Array.isArray(id)) {
    const error: any = new Error(`Invalid ${fieldName} format. Expected UUID.`);
    error.statusCode = 400;
    throw error;
  }
  
  if (!isValidUUID(id)) {
    const error: any = new Error(`Invalid ${fieldName} format. Expected UUID.`);
    error.statusCode = 400;
    throw error;
  }
  
  return id;
}

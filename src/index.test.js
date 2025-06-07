// Import the function we want to test
import { isDatePage } from './index';

// Describe what we're testing
describe('isDatePage', () => {
  // Test case 1: Valid date format
  test('should return true for valid date format', () => {
    expect(isDatePage('January 1st, 2024')).toBe(true);
    expect(isDatePage('December 25th, 2023')).toBe(true);
  });

  // Test case 2: Invalid date format
  test('should return false for invalid date format', () => {
    expect(isDatePage('Not a date')).toBe(false);
    expect(isDatePage('2024-01-01')).toBe(false);
  });
}); 
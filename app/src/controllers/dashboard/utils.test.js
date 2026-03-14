import { DEFAULT_SORTING } from './constants';
import { sanitizeDashboardSorting, tryParseConfig } from './utils';

describe('dashboard/utils', () => {
  describe('tryParseConfig', () => {
    test('should parse valid config', () => {
      expect(tryParseConfig('{"name":"demo"}')).toEqual({ name: 'demo' });
    });

    test('should return null for invalid config', () => {
      expect(tryParseConfig('{bad-json')).toBeNull();
    });
  });

  describe('sanitizeDashboardSorting', () => {
    test('should keep supported dashboard sorting', () => {
      expect(sanitizeDashboardSorting('name,ASC')).toBe('name,ASC');
      expect(sanitizeDashboardSorting('creationDate,DESC')).toBe('creationDate,DESC');
    });

    test('should reset unsupported dashboard sorting to default', () => {
      expect(sanitizeDashboardSorting('locked,ASC')).toBe(DEFAULT_SORTING);
      expect(sanitizeDashboardSorting('locked,creationDate,DESC')).toBe(DEFAULT_SORTING);
    });

    test('should fall back to default sorting when no fields are present', () => {
      expect(sanitizeDashboardSorting('')).toBe(DEFAULT_SORTING);
      expect(sanitizeDashboardSorting('DESC')).toBe(DEFAULT_SORTING);
    });
  });
});
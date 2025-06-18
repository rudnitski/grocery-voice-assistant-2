import { formatGroceryListForExport } from './grocery-utils';
import { GroceryItemWithMeasurement, WeightUnit, VolumeUnit } from '../types/grocery-types';

describe('grocery-utils', () => {
  describe('formatGroceryListForExport', () => {
    it('should return empty string for empty array', () => {
      expect(formatGroceryListForExport([])).toBe('');
    });

    it('should return empty string for null or undefined input', () => {
      expect(formatGroceryListForExport(null as any)).toBe('');
      expect(formatGroceryListForExport(undefined as any)).toBe('');
    });

    it('should format items with quantity only', () => {
      const items: GroceryItemWithMeasurement[] = [
        { item: 'apples', quantity: 2 },
        { item: 'bananas', quantity: 3 }
      ];

      const expected = 'Grocery List\n\n- apples (2)\n- bananas (3)';
      expect(formatGroceryListForExport(items)).toBe(expected);
    });

    it('should format items with measurements', () => {
      const items: GroceryItemWithMeasurement[] = [
        { 
          item: 'flour', 
          quantity: 1, 
          measurement: { value: 500, unit: WeightUnit.GRAM }
        },
        { 
          item: 'milk', 
          quantity: 1, 
          measurement: { value: 1, unit: VolumeUnit.LITER }
        }
      ];

      // Note: The exact formatting of measurements depends on the formatMeasurement function
      // This test assumes that formatMeasurement returns "500g" and "1L" based on the example
      const expected = 'Grocery List\n\n- flour (500g)\n- milk (1L)';
      expect(formatGroceryListForExport(items)).toBe(expected);
    });

    it('should handle mixed items with and without measurements', () => {
      const items: GroceryItemWithMeasurement[] = [
        { item: 'apples', quantity: 2 },
        { 
          item: 'flour', 
          quantity: 1, 
          measurement: { value: 500, unit: WeightUnit.GRAM }
        }
      ];

      const expected = 'Grocery List\n\n- apples (2)\n- flour (500g)';
      expect(formatGroceryListForExport(items)).toBe(expected);
    });

    it('should handle decimal quantities correctly', () => {
      const items: GroceryItemWithMeasurement[] = [
        { item: 'onions', quantity: 0.5 },
        { item: 'sugar', quantity: 1.5 }
      ];

      const expected = 'Grocery List\n\n- onions (0.5)\n- sugar (1.5)';
      expect(formatGroceryListForExport(items)).toBe(expected);
    });

    it('should format with custom title if provided', () => {
      const items: GroceryItemWithMeasurement[] = [
        { item: 'apples', quantity: 2 },
        { item: 'bananas', quantity: 3 }
      ];

      const expected = 'My Shopping List\n\n- apples (2)\n- bananas (3)';
      expect(formatGroceryListForExport(items, { title: 'My Shopping List' })).toBe(expected);
    });

    it('should not include title if includeTitle is false', () => {
      const items: GroceryItemWithMeasurement[] = [
        { item: 'apples', quantity: 2 },
        { item: 'bananas', quantity: 3 }
      ];

      const expected = '- apples (2)\n- bananas (3)';
      expect(formatGroceryListForExport(items, { includeTitle: false })).toBe(expected);
    });
  });
});

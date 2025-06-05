import {
  parseMeasurement,
  normalizeUnit,
  formatMeasurement,
  normalizeMeasurement,
  combineMeasurements,
  convertToGrams,
  convertToMilliliters
} from '../measurement-utils';
import {
  WeightUnit,
  VolumeUnit,
  MeasurementType
} from '../../types/grocery-types';

describe('Measurement Utils', () => {
  describe('parseMeasurement', () => {
    it('should parse simple measurements', () => {
      expect(parseMeasurement('500g')).toEqual({
        value: 500,
        unit: 'g',
        type: MeasurementType.WEIGHT
      });
      
      expect(parseMeasurement('2L')).toEqual({
        value: 2,
        unit: 'L',
        type: MeasurementType.VOLUME
      });
    });
    
    it('should parse measurements with spaces', () => {
      expect(parseMeasurement('500 g')).toEqual({
        value: 500,
        unit: 'g',
        type: MeasurementType.WEIGHT
      });
      
      expect(parseMeasurement('2 L')).toEqual({
        value: 2,
        unit: 'L',
        type: MeasurementType.VOLUME
      });
    });
    
    it('should parse fractions', () => {
      expect(parseMeasurement('1/2 cup')).toEqual({
        value: 0.5,
        unit: 'cup',
        type: MeasurementType.VOLUME
      });
    });
    
    it('should return null for invalid inputs', () => {
      expect(parseMeasurement('')).toBeNull();
      expect(parseMeasurement('abc')).toBeNull();
      expect(parseMeasurement('123')).toBeNull();
      expect(parseMeasurement('xyz kg')).toBeNull();
    });
  });
  
  describe('normalizeUnit', () => {
    it('should normalize common unit variations', () => {
      expect(normalizeUnit('gram')).toBe('g');
      expect(normalizeUnit('grams')).toBe('g');
      expect(normalizeUnit('g')).toBe('g');
      
      expect(normalizeUnit('kilogram')).toBe('kg');
      expect(normalizeUnit('kilograms')).toBe('kg');
      expect(normalizeUnit('kg')).toBe('kg');
      
      expect(normalizeUnit('liter')).toBe('L');
      expect(normalizeUnit('liters')).toBe('L');
      expect(normalizeUnit('L')).toBe('L');
      
      expect(normalizeUnit('milliliter')).toBe('mL');
      expect(normalizeUnit('milliliters')).toBe('mL');
      expect(normalizeUnit('ml')).toBe('mL');
    });
    
    it('should handle case insensitivity', () => {
      expect(normalizeUnit('GRAM')).toBe('g');
      expect(normalizeUnit('Kilogram')).toBe('kg');
      expect(normalizeUnit('Ml')).toBe('mL');
    });
    
    it('should return null for unrecognized units', () => {
      expect(normalizeUnit('')).toBeNull();
      expect(normalizeUnit('xyz')).toBeNull();
      expect(normalizeUnit('123')).toBeNull();
    });
  });
  
  describe('formatMeasurement', () => {
    it('should format measurements correctly', () => {
      expect(formatMeasurement({
        value: 500,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      })).toBe('500g');
      
      expect(formatMeasurement({
        value: 2,
        unit: VolumeUnit.LITER,
        type: MeasurementType.VOLUME
      })).toBe('2L');
      
      expect(formatMeasurement({
        value: 1.5,
        unit: WeightUnit.KILOGRAM,
        type: MeasurementType.WEIGHT
      })).toBe('1.5kg');
    });
    
    it('should handle decimal places correctly', () => {
      expect(formatMeasurement({
        value: 1.5,
        unit: WeightUnit.KILOGRAM,
        type: MeasurementType.WEIGHT
      })).toBe('1.5kg');
      
      expect(formatMeasurement({
        value: 1.0,
        unit: WeightUnit.KILOGRAM,
        type: MeasurementType.WEIGHT
      })).toBe('1kg');
      
      expect(formatMeasurement({
        value: 1.50,
        unit: WeightUnit.KILOGRAM,
        type: MeasurementType.WEIGHT
      })).toBe('1.5kg');
    });
    
    it('should return empty string for invalid inputs', () => {
      expect(formatMeasurement(null as any)).toBe('');
      expect(formatMeasurement({} as any)).toBe('');
      expect(formatMeasurement({ value: 1 } as any)).toBe('');
    });
  });
  
  describe('normalizeMeasurement', () => {
    it('should convert 1000g to 1kg', () => {
      const result = normalizeMeasurement({
        value: 1000,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      });
      
      expect(result).toEqual({
        value: 1,
        unit: WeightUnit.KILOGRAM,
        type: MeasurementType.WEIGHT
      });
    });
    
    it('should convert 1000mL to 1L', () => {
      const result = normalizeMeasurement({
        value: 1000,
        unit: VolumeUnit.MILLILITER,
        type: MeasurementType.VOLUME
      });
      
      expect(result).toEqual({
        value: 1,
        unit: VolumeUnit.LITER,
        type: MeasurementType.VOLUME
      });
    });
    
    it('should not normalize values below threshold', () => {
      const measurement = {
        value: 999,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      };
      
      expect(normalizeMeasurement(measurement)).toEqual(measurement);
    });
    
    it('should return the original measurement for non-normalizable units', () => {
      const measurement = {
        value: 16,
        unit: WeightUnit.OUNCE,
        type: MeasurementType.WEIGHT
      };
      
      expect(normalizeMeasurement(measurement)).toEqual(measurement);
    });
  });
  
  describe('combineMeasurements', () => {
    it('should combine measurements with the same unit', () => {
      const m1 = {
        value: 500,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      };
      
      const m2 = {
        value: 250,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      };
      
      expect(combineMeasurements(m1, m2)).toEqual({
        value: 750,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      });
    });
    
    it('should normalize combined measurements when appropriate', () => {
      const m1 = {
        value: 500,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      };
      
      const m2 = {
        value: 500,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      };
      
      expect(combineMeasurements(m1, m2)).toEqual({
        value: 1,
        unit: WeightUnit.KILOGRAM,
        type: MeasurementType.WEIGHT
      });
    });
    
    it('should handle null inputs', () => {
      const m1 = {
        value: 500,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      };
      
      expect(combineMeasurements(m1, null as any)).toEqual(m1);
      expect(combineMeasurements(null as any, m1)).toEqual(m1);
      expect(combineMeasurements(null as any, null as any)).toBeNull();
    });
    
    it('should return null when combining incompatible measurement types', () => {
      const m1 = {
        value: 500,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      };
      
      const m2 = {
        value: 1,
        unit: VolumeUnit.LITER,
        type: MeasurementType.VOLUME
      };
      
      expect(combineMeasurements(m1, m2)).toBeNull();
    });
  });

  describe('Weight unit conversions', () => {
    it('should combine measurements with different weight units', () => {
      // This indirectly tests the convertToGrams function
      const m1 = {
        value: 1,
        unit: WeightUnit.KILOGRAM,
        type: MeasurementType.WEIGHT
      };
      
      const m2 = {
        value: 500,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      };
      
      expect(combineMeasurements(m1, m2)).toEqual({
        value: 1.5,
        unit: WeightUnit.KILOGRAM,
        type: MeasurementType.WEIGHT
      });
    });
    
    it('should combine pounds with grams', () => {
      const m1 = {
        value: 1,
        unit: WeightUnit.POUND,
        type: MeasurementType.WEIGHT
      };
      
      const m2 = {
        value: 453.592,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      };
      
      // 1 pound + 453.592g = 907.184g (approximately)
      const result = combineMeasurements(m1, m2);
      expect(result?.unit).toBe(WeightUnit.GRAM);
      expect(result?.value).toBeCloseTo(907.184, 1); // Close to 907.184 with 1 decimal precision
    });
    
    it('should combine ounces with grams', () => {
      const m1 = {
        value: 1,
        unit: WeightUnit.OUNCE,
        type: MeasurementType.WEIGHT
      };
      
      const m2 = {
        value: 28.3495,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      };
      
      // 1 oz + 28.3495g = 56.699g (approximately)
      const result = combineMeasurements(m1, m2);
      expect(result?.unit).toBe(WeightUnit.GRAM);
      expect(result?.value).toBeCloseTo(56.699, 1); // Close to 56.699 with 1 decimal precision
    });
    
    it('should not combine weight with non-weight measurements', () => {
      const m1 = {
        value: 500,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      };
      
      const m2 = {
        value: 1,
        unit: VolumeUnit.LITER,
        type: MeasurementType.VOLUME
      };
      
      expect(combineMeasurements(m1, m2)).toBeNull();
    });
  });

  describe('Volume unit conversions', () => {
    it('should combine measurements with different volume units', () => {
      // This indirectly tests the convertToMilliliters function
      const m1 = {
        value: 1,
        unit: VolumeUnit.LITER,
        type: MeasurementType.VOLUME
      };
      
      const m2 = {
        value: 500,
        unit: VolumeUnit.MILLILITER,
        type: MeasurementType.VOLUME
      };
      
      expect(combineMeasurements(m1, m2)).toEqual({
        value: 1.5,
        unit: VolumeUnit.LITER,
        type: MeasurementType.VOLUME
      });
    });
    
    it('should combine fluid ounces with milliliters', () => {
      const m1 = {
        value: 1,
        unit: VolumeUnit.FLUID_OUNCE,
        type: MeasurementType.VOLUME
      };
      
      const m2 = {
        value: 29.5735,
        unit: VolumeUnit.MILLILITER,
        type: MeasurementType.VOLUME
      };
      
      // 1 fl oz + 29.5735mL = 59.147mL (approximately)
      const result = combineMeasurements(m1, m2);
      expect(result?.unit).toBe(VolumeUnit.MILLILITER);
      expect(result?.value).toBeCloseTo(59.147, 1); // Close to 59.147 with 1 decimal precision
    });
    
    it('should combine cups with milliliters', () => {
      const m1 = {
        value: 1,
        unit: VolumeUnit.CUP,
        type: MeasurementType.VOLUME
      };
      
      const m2 = {
        value: 236.588,
        unit: VolumeUnit.MILLILITER,
        type: MeasurementType.VOLUME
      };
      
      // 1 cup + 236.588mL = 473.176mL (approximately)
      const result = combineMeasurements(m1, m2);
      expect(result?.unit).toBe(VolumeUnit.MILLILITER);
      expect(result?.value).toBeCloseTo(473.176, 1); // Close to 473.176 with 1 decimal precision
    });
    
    it('should not combine volume with non-volume measurements', () => {
      const m1 = {
        value: 500,
        unit: VolumeUnit.MILLILITER,
        type: MeasurementType.VOLUME
      };
      
      const m2 = {
        value: 1,
        unit: WeightUnit.KILOGRAM,
        type: MeasurementType.WEIGHT
      };
      
      expect(combineMeasurements(m1, m2)).toBeNull();
    });
  });

  describe('convertToGrams', () => {
    it('should convert kg to grams', () => {
      const result = convertToGrams({
        value: 1.5,
        unit: WeightUnit.KILOGRAM,
        type: MeasurementType.WEIGHT
      });
      
      expect(result).toEqual({
        value: 1500,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      });
    });
    
    it('should convert pounds to grams', () => {
      const result = convertToGrams({
        value: 2,
        unit: WeightUnit.POUND,
        type: MeasurementType.WEIGHT
      });
      
      expect(result).toEqual({
        value: 907.184,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      });
    });
    
    it('should convert ounces to grams', () => {
      const result = convertToGrams({
        value: 16,
        unit: WeightUnit.OUNCE,
        type: MeasurementType.WEIGHT
      });
      
      expect(result).toEqual({
        value: 453.592,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      });
    });
    
    it('should return null for non-weight measurements', () => {
      const result = convertToGrams({
        value: 1,
        unit: VolumeUnit.LITER,
        type: MeasurementType.VOLUME
      });
      
      expect(result).toBeNull();
    });
  });
  
  describe('convertToMilliliters', () => {
    it('should convert liters to milliliters', () => {
      const result = convertToMilliliters({
        value: 1.5,
        unit: VolumeUnit.LITER,
        type: MeasurementType.VOLUME
      });
      
      expect(result).toEqual({
        value: 1500,
        unit: VolumeUnit.MILLILITER,
        type: MeasurementType.VOLUME
      });
    });
    
    it('should convert fluid ounces to milliliters', () => {
      const result = convertToMilliliters({
        value: 8,
        unit: VolumeUnit.FLUID_OUNCE,
        type: MeasurementType.VOLUME
      });
      
      expect(result).toEqual({
        value: 236.588,
        unit: VolumeUnit.MILLILITER,
        type: MeasurementType.VOLUME
      });
    });
    
    it('should convert cups to milliliters', () => {
      const result = convertToMilliliters({
        value: 2,
        unit: VolumeUnit.CUP,
        type: MeasurementType.VOLUME
      });
      
      expect(result).toEqual({
        value: 473.176,
        unit: VolumeUnit.MILLILITER,
        type: MeasurementType.VOLUME
      });
    });
    
    it('should return null for non-volume measurements', () => {
      const result = convertToMilliliters({
        value: 1,
        unit: WeightUnit.GRAM,
        type: MeasurementType.WEIGHT
      });
      
      expect(result).toBeNull();
    });
  });
});

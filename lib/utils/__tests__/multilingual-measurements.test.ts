import {
  parseMeasurement,
  normalizeUnit,
  formatMeasurement
} from '../measurement-utils';
import {
  WeightUnit,
  VolumeUnit,
  MeasurementType
} from '../../types/grocery-types';

describe('Multilingual Measurement Tests', () => {
  describe('Non-English measurement parsing', () => {
    it('should parse metric measurements in different languages', () => {
      // Spanish
      expect(parseMeasurement('500 gramos')).toEqual({
        value: 500,
        unit: 'g',
        type: MeasurementType.WEIGHT
      });
      expect(parseMeasurement('2 kilogramos')).toEqual({
        value: 2,
        unit: 'kg',
        type: MeasurementType.WEIGHT
      });
      expect(parseMeasurement('3 litros')).toEqual({
        value: 3,
        unit: 'L',
        type: MeasurementType.VOLUME
      });
      
      // French
      expect(parseMeasurement('250 gramme')).toEqual({
        value: 250,
        unit: 'g',
        type: MeasurementType.WEIGHT
      });
      expect(parseMeasurement('1,5 kilogramme')).toEqual({
        value: 1.5,
        unit: 'kg',
        type: MeasurementType.WEIGHT
      });
      expect(parseMeasurement('750 millilitre')).toEqual({
        value: 750,
        unit: 'mL',
        type: MeasurementType.VOLUME
      });
      
      // German
      expect(parseMeasurement('250 gramm')).toEqual({
        value: 250,
        unit: 'g',
        type: MeasurementType.WEIGHT
      });
      expect(parseMeasurement('2 kilogramm')).toEqual({
        value: 2,
        unit: 'kg',
        type: MeasurementType.WEIGHT
      });
      expect(parseMeasurement('0,5 liter')).toEqual({
        value: 0.5,
        unit: 'L',
        type: MeasurementType.VOLUME
      });
      
      // Italian
      expect(parseMeasurement('1 chilogrammo')).toEqual({
        value: 1,
        unit: 'kg',
        type: MeasurementType.WEIGHT
      });
      expect(parseMeasurement('100 grammi')).toEqual({
        value: 100,
        unit: 'g',
        type: MeasurementType.WEIGHT
      });

      expect(parseMeasurement('2 litri')).toEqual({
        value: 2,
        unit: 'L',
        type: MeasurementType.VOLUME
      });
      
      // With language suffixes
      expect(parseMeasurement('1 liter_de')).toEqual({
        value: 1,
        unit: 'L',
        type: MeasurementType.VOLUME
      });

      expect(parseMeasurement('500 grammes_fr')).toEqual({
        value: 500,
        unit: 'g',
        type: MeasurementType.WEIGHT
      });
    });
    
    it('should parse imperial measurements in different languages', () => {
      // Spanish
      expect(parseMeasurement('2 libras')).toEqual({
        value: 2,
        unit: 'lb',
        type: MeasurementType.WEIGHT
      });
      expect(parseMeasurement('3 onzas')).toEqual({
        value: 3,
        unit: 'oz',
        type: MeasurementType.WEIGHT
      });
      
      // French
      expect(parseMeasurement('1 livre')).toEqual({
        value: 1,
        unit: 'lb',
        type: MeasurementType.WEIGHT
      });
      expect(parseMeasurement('2 onces')).toEqual({
        value: 2,
        unit: 'oz',
        type: MeasurementType.WEIGHT
      });
      
      // Italian
      expect(parseMeasurement('3 oncia')).toEqual({
        value: 3,
        unit: 'oz',
        type: MeasurementType.WEIGHT
      });
    });
    
    it('should parse measurements with non-Latin numerals', () => {
      // Arabic numerals
      expect(parseMeasurement('٥٠٠ غرام')).toBeNull(); // Not supported yet
      
      // Chinese/Japanese numerals
      expect(parseMeasurement('五百克')).toBeNull(); // Not supported yet
    });
    
    it('should parse measurements with different decimal separators', () => {
      // European style (comma as decimal separator)
      expect(parseMeasurement('1,5 kg')).toEqual({
        value: 1.5,
        unit: 'kg',
        type: MeasurementType.WEIGHT
      });
      
      expect(parseMeasurement('0,5 L')).toEqual({
        value: 0.5,
        unit: 'L',
        type: MeasurementType.VOLUME
      });
    });
  });
  
  describe('Unit normalization across languages', () => {
    it('should normalize units from different languages', () => {
      // We'll test with the actual unit names in our normalization map
      // Spanish
      expect(normalizeUnit('gramos')).toBe('g');
      expect(normalizeUnit('kilogramos')).toBe('kg');
      expect(normalizeUnit('litro')).toBe('L');
      
      // French - with language suffixes
      expect(normalizeUnit('gramme')).toBe('g');
      expect(normalizeUnit('kilogramme')).toBe('kg');
      expect(normalizeUnit('litre_fr')).toBe('L');
      
      // German - with language suffixes
      expect(normalizeUnit('gramm')).toBe('g');
      expect(normalizeUnit('kilogramm')).toBe('kg');
      expect(normalizeUnit('liter_de')).toBe('L');
      
      // Italian
      expect(normalizeUnit('chilogrammo')).toBe('kg');
      expect(normalizeUnit('oncia')).toBe('oz');
    });
    
    it('should handle case variations in different languages', () => {
      expect(normalizeUnit('Gramos')).toBe('g');
      expect(normalizeUnit('LITRO')).toBe('L');
      expect(normalizeUnit('Kilogramo')).toBe('kg');
    });
  });
  
  describe('Edge cases with special characters', () => {
    it('should handle measurements with special characters', () => {
      // Measurements with spaces and special characters
      expect(parseMeasurement('2 1/2 cups')).toEqual({
        value: 2.5,
        unit: 'cup',
        type: MeasurementType.VOLUME
      });
      
      expect(parseMeasurement('1 1/4 kg')).toEqual({
        value: 1.25,
        unit: 'kg',
        type: MeasurementType.WEIGHT
      });
    });
    
    it('should handle fractional measurements in different languages', () => {
      // Spanish
      expect(parseMeasurement('1 1/2 kilogramos')).toEqual({
        value: 1.5,
        unit: 'kg',
        type: MeasurementType.WEIGHT
      });
      
      // French
      expect(parseMeasurement('2 1/4 litres')).toEqual({
        value: 2.25,
        unit: 'L',
        type: MeasurementType.VOLUME
      });
    });
  });
  
  describe('Mixed units and complex expressions', () => {
    it('should parse mixed units when possible', () => {
      // Mixed units (currently not fully supported, but testing behavior)
      expect(parseMeasurement('1 lb 4 oz')).toBeNull(); // Not supported yet
      
      // Complex expressions
      expect(parseMeasurement('about 500g')).toEqual({
        value: 500,
        unit: 'g',
        type: MeasurementType.WEIGHT
      });
      
      expect(parseMeasurement('approximately 2 liters')).toEqual({
        value: 2,
        unit: 'L',
        type: MeasurementType.VOLUME
      });
    });
    
    it('should handle unusual but valid unit formats', () => {
      // Units with unusual formatting
      expect(parseMeasurement('500-g')).toEqual({
        value: 500,
        unit: 'g',
        type: MeasurementType.WEIGHT
      });
      
      expect(parseMeasurement('2.L')).toEqual({
        value: 2,
        unit: 'L',
        type: MeasurementType.VOLUME
      });
      
      // Units with text in between
      expect(parseMeasurement('2 large cups')).toEqual({
        value: 2,
        unit: 'cup',
        type: MeasurementType.VOLUME
      });
    });
  });
});

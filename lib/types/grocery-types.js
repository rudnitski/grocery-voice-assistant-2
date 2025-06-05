"use strict";
/**
 * Grocery Types - Measurement Support
 *
 * This file defines types and interfaces for grocery items with measurement support.
 * It includes definitions for various measurement units (weight, volume, count) and
 * the enhanced GroceryItemWithAction interface.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEASUREMENT_DISPLAY_FORMAT = exports.UNIT_NORMALIZATION_MAP = exports.UNIT_TO_TYPE_MAP = exports.CountUnit = exports.VolumeUnit = exports.WeightUnit = exports.MeasurementType = void 0;
/**
 * Measurement types supported by the application
 */
var MeasurementType;
(function (MeasurementType) {
    MeasurementType["WEIGHT"] = "weight";
    MeasurementType["VOLUME"] = "volume";
    MeasurementType["COUNT"] = "count";
})(MeasurementType || (exports.MeasurementType = MeasurementType = {}));
/**
 * Weight units supported by the application
 */
var WeightUnit;
(function (WeightUnit) {
    WeightUnit["GRAM"] = "g";
    WeightUnit["KILOGRAM"] = "kg";
    WeightUnit["POUND"] = "lb";
    WeightUnit["OUNCE"] = "oz";
})(WeightUnit || (exports.WeightUnit = WeightUnit = {}));
/**
 * Volume units supported by the application
 */
var VolumeUnit;
(function (VolumeUnit) {
    VolumeUnit["MILLILITER"] = "mL";
    VolumeUnit["LITER"] = "L";
    VolumeUnit["FLUID_OUNCE"] = "fl oz";
    VolumeUnit["CUP"] = "cup";
})(VolumeUnit || (exports.VolumeUnit = VolumeUnit = {}));
/**
 * Count units (default when no measurement is specified)
 */
var CountUnit;
(function (CountUnit) {
    CountUnit["PIECE"] = "piece";
    CountUnit["UNIT"] = "unit";
})(CountUnit || (exports.CountUnit = CountUnit = {}));
/**
 * Map of units to their measurement types for easy lookup
 */
exports.UNIT_TO_TYPE_MAP = {
    // Weight units
    [WeightUnit.GRAM]: MeasurementType.WEIGHT,
    [WeightUnit.KILOGRAM]: MeasurementType.WEIGHT,
    [WeightUnit.POUND]: MeasurementType.WEIGHT,
    [WeightUnit.OUNCE]: MeasurementType.WEIGHT,
    // Volume units
    [VolumeUnit.MILLILITER]: MeasurementType.VOLUME,
    [VolumeUnit.LITER]: MeasurementType.VOLUME,
    [VolumeUnit.FLUID_OUNCE]: MeasurementType.VOLUME,
    [VolumeUnit.CUP]: MeasurementType.VOLUME,
    // Count units
    [CountUnit.PIECE]: MeasurementType.COUNT,
    [CountUnit.UNIT]: MeasurementType.COUNT
};
/**
 * Map of common unit variations to their standardized form
 * This helps normalize units from user input
 */
exports.UNIT_NORMALIZATION_MAP = {
    // Weight unit variations
    'gram': WeightUnit.GRAM,
    'grams': WeightUnit.GRAM,
    'g': WeightUnit.GRAM,
    'gr': WeightUnit.GRAM,
    'kilogram': WeightUnit.KILOGRAM,
    'kilograms': WeightUnit.KILOGRAM,
    'kilo': WeightUnit.KILOGRAM,
    'kilos': WeightUnit.KILOGRAM,
    'kg': WeightUnit.KILOGRAM,
    'pound': WeightUnit.POUND,
    'pounds': WeightUnit.POUND,
    'lb': WeightUnit.POUND,
    'lbs': WeightUnit.POUND,
    'ounce': WeightUnit.OUNCE,
    'ounces': WeightUnit.OUNCE,
    'oz': WeightUnit.OUNCE,
    // Volume unit variations
    'milliliter': VolumeUnit.MILLILITER,
    'milliliters': VolumeUnit.MILLILITER,
    'millilitre': VolumeUnit.MILLILITER,
    'millilitres': VolumeUnit.MILLILITER,
    'ml': VolumeUnit.MILLILITER,
    'mL': VolumeUnit.MILLILITER,
    'liter': VolumeUnit.LITER,
    'liters': VolumeUnit.LITER,
    'litre': VolumeUnit.LITER,
    'litres': VolumeUnit.LITER,
    'l': VolumeUnit.LITER,
    'L': VolumeUnit.LITER,
    'fluid ounce': VolumeUnit.FLUID_OUNCE,
    'fluid ounces': VolumeUnit.FLUID_OUNCE,
    'fl oz': VolumeUnit.FLUID_OUNCE,
    'floz': VolumeUnit.FLUID_OUNCE,
    'cup': VolumeUnit.CUP,
    'cups': VolumeUnit.CUP,
    // Count unit variations
    'piece': CountUnit.PIECE,
    'pieces': CountUnit.PIECE,
    'pc': CountUnit.PIECE,
    'pcs': CountUnit.PIECE,
    'unit': CountUnit.UNIT,
    'units': CountUnit.UNIT
};
/**
 * Display formats for different measurement units
 * This determines how measurements are formatted in the UI
 */
exports.MEASUREMENT_DISPLAY_FORMAT = {
    // Weight units
    [WeightUnit.GRAM]: '{value}g',
    [WeightUnit.KILOGRAM]: '{value}kg',
    [WeightUnit.POUND]: '{value}lb',
    [WeightUnit.OUNCE]: '{value}oz',
    // Volume units
    [VolumeUnit.MILLILITER]: '{value}mL',
    [VolumeUnit.LITER]: '{value}L',
    [VolumeUnit.FLUID_OUNCE]: '{value}fl oz',
    [VolumeUnit.CUP]: '{value} cup',
    // Count units - typically not displayed as they're the default
    [CountUnit.PIECE]: '{value}',
    [CountUnit.UNIT]: '{value}'
};

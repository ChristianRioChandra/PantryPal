import { describe, it, expect } from 'vitest'
import {
  cleanPantryItemName,
  resolveToMealDbIngredient,
  pickMealDbIngredientQueries,
  scoreMealAgainstPantry,
} from '../mealRecommendationService'

const SAMPLE_MEALDB_INGREDIENTS = [
  'Chicken',
  'Chicken Breast',
  'Milk',
  'Egg',
  'Rice',
  'Tomato',
  'Onion',
  'Beef',
  'Salmon',
  'Flour',
]

describe('mealRecommendationService', () => {
  describe('cleanPantryItemName', () => {
    it('strips brand and size suffixes', () => {
      expect(cleanPantryItemName('UltraMilk · 500ml Original')).toBe('ultramilk')
      expect(cleanPantryItemName('Eggs (6 pack)')).toBe('eggs')
    })
  })

  describe('resolveToMealDbIngredient', () => {
    it('maps branded milk to milk', () => {
      expect(resolveToMealDbIngredient('UltraMilk · 500ml', SAMPLE_MEALDB_INGREDIENTS)).toBe('milk')
    })

    it('maps chicken breast variants', () => {
      expect(resolveToMealDbIngredient('Chicken Breast', SAMPLE_MEALDB_INGREDIENTS)).toBe(
        'chicken_breast',
      )
    })

    it('maps eggs to egg', () => {
      expect(resolveToMealDbIngredient('Eggs', SAMPLE_MEALDB_INGREDIENTS)).toBe('egg')
    })
  })

  describe('pickMealDbIngredientQueries', () => {
    it('prioritizes expiring inventory and deduplicates', () => {
      const queries = pickMealDbIngredientQueries(
        {
          date: '2026-05-21',
          inventory: [
            {
              id: '1',
              name: 'Rice',
              location: 'Pantry',
              expiry: '1 Jun 2026',
            },
            {
              id: '2',
              name: 'UltraMilk · 500ml',
              location: 'Fridge',
              expiry: '6 Apr 2026',
              warning: true,
            },
          ],
        },
        SAMPLE_MEALDB_INGREDIENTS,
      )

      expect(queries).toContain('milk')
      expect(queries.indexOf('milk')).toBeLessThan(queries.indexOf('rice'))
    })
  })

  describe('scoreMealAgainstPantry', () => {
    it('scores meals higher when more pantry items match', () => {
      const pantry = ['eggs', 'milk', 'flour']
      const pancake = scoreMealAgainstPantry(
        ['Egg', 'Milk', 'Flour', 'Sugar', 'Butter'],
        pantry,
      )
      const plain = scoreMealAgainstPantry(['Chicken', 'Salt'], pantry)

      expect(pancake.score).toBeGreaterThan(plain.score)
      expect(pancake.matched).toEqual(expect.arrayContaining(['Egg', 'Milk', 'Flour']))
    })
  })
})

import { auth } from '@/firebase'

export interface MealRecommendationRequestItem {
  id: string
  name: string
  location: string
  expiry: string
  warning?: boolean
}

export interface MealRecommendation {
  id: number
  icon: string
  name: string
  uses: string
  imageUrl?: string
  matchedIngredients?: string[]
}

interface MealRecommendationApiItem {
  id?: string | number
  icon?: string
  emoji?: string
  name?: string
  title?: string
  uses?: string | string[]
  ingredients?: string | string[]
}

interface MealRecommendationApiResponse {
  recommendations?: MealRecommendationApiItem[]
  meals?: MealRecommendationApiItem[]
  data?: MealRecommendationApiItem[]
}

export interface FetchMealRecommendationsPayload {
  date: string
  inventory: MealRecommendationRequestItem[]
  selectedIngredients?: string[]
}

const API_URL = import.meta.env.VITE_MEAL_RECOMMENDATIONS_API_URL as string | undefined
const MEALDB_API_BASE = import.meta.env.VITE_MEALDB_API_BASE as string | undefined
const MAX_INGREDIENT_QUERIES = 6
const MAX_RECOMMENDATIONS = 3
const MEALDB_INGREDIENT_CACHE_TTL_MS = 1000 * 60 * 60 * 24

interface MealDbFilterMeal {
  idMeal: string
  strMeal: string
  strMealThumb?: string
}

interface MealDbFilterResponse {
  meals: MealDbFilterMeal[] | null
}

interface MealDbLookupMeal {
  idMeal: string
  strMeal: string
  strMealThumb?: string
  strCategory?: string
  strArea?: string
  [key: string]: string | undefined
}

interface MealDbLookupResponse {
  meals: MealDbLookupMeal[] | null
}

interface MealDbIngredientListItem {
  strIngredient: string
}

interface MealDbIngredientListResponse {
  meals: MealDbIngredientListItem[] | null
}

let cachedMealDbIngredients: string[] | null = null
let mealDbIngredientsLoadedAt = 0

/** Strip brand/size suffixes from pantry display names. */
export function cleanPantryItemName(name: string): string {
  return name
    .split(/[·,(]/)[0]!
    .replace(/\d+\s*(g|kg|ml|l|oz|pcs?|pieces?|pack|packs|bottle|bottles)\b/gi, '')
    .trim()
    .toLowerCase()
}

const PANTRY_ALIASES: Record<string, string> = {
  ultramilk: 'milk',
  'whole milk': 'milk',
  'skim milk': 'milk',
  yoghurt: 'yogurt',
  yogurt: 'yogurt',
  egg: 'egg',
  eggs: 'egg',
  tomato: 'tomato',
  tomatoes: 'tomato',
  potato: 'potato',
  potatoes: 'potato',
  onion: 'onion',
  onions: 'onion',
  chicken: 'chicken',
  'chicken breast': 'chicken_breast',
  beef: 'beef',
  pork: 'pork',
  salmon: 'salmon',
  rice: 'rice',
  pasta: 'pasta',
  noodle: 'noodles',
  noodles: 'noodles',
  bread: 'bread',
  cheese: 'cheese',
  butter: 'butter',
  flour: 'flour',
  garlic: 'garlic',
  carrot: 'carrot',
  carrots: 'carrot',
  broccoli: 'broccoli',
  spinach: 'spinach',
  mushroom: 'mushrooms',
  mushrooms: 'mushrooms',
  shrimp: 'prawns',
  prawn: 'prawns',
  prawns: 'prawns',
}

function toMealDbFilterKey(ingredient: string): string {
  return ingredient.trim().toLowerCase().replace(/\s+/g, '_')
}

function normalizeUses(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ')
  return value ?? ''
}

function normalizeResponse(payload: MealRecommendationApiResponse): MealRecommendation[] {
  const rawItems = payload.recommendations ?? payload.meals ?? payload.data ?? []

  return rawItems
    .map((item, index) => {
      const name = item.name ?? item.title
      const uses = normalizeUses(item.uses ?? item.ingredients)
      if (!name || !uses) return null

      return {
        id: Number(item.id ?? index + 1),
        icon: item.icon ?? item.emoji ?? '🍽️',
        name,
        uses,
      }
    })
    .filter((item): item is MealRecommendation => item !== null)
}

function getMealDbUrl(path: string, params: Record<string, string>) {
  const base = (MEALDB_API_BASE ?? 'https://www.themealdb.com/api/json/v1/1').replace(/\/$/, '')
  const url = new URL(`${base}/${path}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return url.toString()
}

async function fetchMealDbJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`TheMealDB request failed with ${response.status}`)
  }
  return (await response.json()) as T
}

export async function loadMealDbIngredientList(): Promise<string[]> {
  if (
    cachedMealDbIngredients &&
    Date.now() - mealDbIngredientsLoadedAt < MEALDB_INGREDIENT_CACHE_TTL_MS
  ) {
    return cachedMealDbIngredients
  }

  const data = await fetchMealDbJson<MealDbIngredientListResponse>(
    getMealDbUrl('list.php', { i: 'list' }),
  )
  const ingredients = (data.meals ?? [])
    .map((item) => item.strIngredient?.trim())
    .filter((name): name is string => Boolean(name))

  cachedMealDbIngredients = ingredients
  mealDbIngredientsLoadedAt = Date.now()
  return ingredients
}

/** Map a pantry item name to a TheMealDB filter ingredient (e.g. chicken_breast). */
export function resolveToMealDbIngredient(
  pantryName: string,
  mealDbIngredients: string[],
): string | null {
  const cleaned = cleanPantryItemName(pantryName)
  if (!cleaned) return null

  const aliasTarget = PANTRY_ALIASES[cleaned]
  if (aliasTarget) return aliasTarget

  const indexed = mealDbIngredients.map((ingredient) => ({
    raw: ingredient,
    key: toMealDbFilterKey(ingredient),
    words: ingredient.toLowerCase().split(/\s+/),
  }))

  const exact = indexed.find((item) => item.key === toMealDbFilterKey(cleaned))
  if (exact) return exact.key

  const contains = indexed.find(
    (item) => cleaned.includes(item.key) || item.key.includes(cleaned.replace(/\s+/g, '_')),
  )
  if (contains) return contains.key

  const words = cleaned.split(/\s+/).filter((word) => word.length > 2)
  for (const word of words) {
    const alias = PANTRY_ALIASES[word]
    if (alias) return alias

    const wordMatch = indexed.find(
      (item) =>
        item.key === toMealDbFilterKey(word) ||
        item.words.some((w) => w === word || word.includes(w) || w.includes(word)),
    )
    if (wordMatch) return wordMatch.key
  }

  const lastWord = words[words.length - 1]
  if (lastWord) {
    const lastMatch = indexed.find(
      (item) => item.key.includes(lastWord) || lastWord.includes(item.key.replace(/_/g, '')),
    )
    if (lastMatch) return lastMatch.key
  }

  return null
}

export function pickMealDbIngredientQueries(
  payload: FetchMealRecommendationsPayload,
  mealDbIngredients: string[],
): string[] {
  const selectedNames = payload.selectedIngredients ?? []
  const sortedInventory = [...payload.inventory].sort((a, b) => {
    if (a.warning && !b.warning) return -1
    if (!a.warning && b.warning) return 1
    return a.name.localeCompare(b.name)
  })

  const namesToResolve = [
    ...selectedNames,
    ...sortedInventory.map((item) => item.name),
  ]

  const resolved = namesToResolve
    .map((name) => resolveToMealDbIngredient(name, mealDbIngredients))
    .filter((ingredient): ingredient is string => Boolean(ingredient))

  return Array.from(new Set(resolved)).slice(0, MAX_INGREDIENT_QUERIES)
}

function getMealDbIngredients(meal: MealDbLookupMeal) {
  const ingredients: string[] = []

  for (let index = 1; index <= 20; index += 1) {
    const ingredient = meal[`strIngredient${index}`]?.trim()
    if (ingredient) ingredients.push(ingredient)
  }

  return ingredients
}

function pantryNamesForMatching(payload: FetchMealRecommendationsPayload): string[] {
  const names = [
    ...(payload.selectedIngredients ?? []),
    ...payload.inventory.map((item) => item.name),
  ]
  return names.map(cleanPantryItemName).filter(Boolean)
}

function ingredientMatchesPantry(mealIngredient: string, pantryNames: string[]): boolean {
  const normalized = mealIngredient.toLowerCase()
  const filterKey = toMealDbFilterKey(mealIngredient)

  return pantryNames.some((pantry) => {
    if (!pantry) return false
    if (pantry === normalized || pantry === filterKey) return true
    if (normalized.includes(pantry) || pantry.includes(normalized)) return true
    if (filterKey.includes(pantry.replace(/\s+/g, '_')) || pantry.includes(filterKey)) return true
    const alias = PANTRY_ALIASES[pantry]
    if (alias && (filterKey === alias || normalized.includes(alias.replace(/_/g, ' ')))) return true
    return false
  })
}

export function scoreMealAgainstPantry(
  mealIngredients: string[],
  pantryNames: string[],
): { score: number; matched: string[] } {
  const matched = mealIngredients.filter((ingredient) =>
    ingredientMatchesPantry(ingredient, pantryNames),
  )
  return { score: matched.length, matched }
}

function mealCategoryEmoji(category?: string): string {
  const value = (category ?? '').toLowerCase()
  if (value.includes('dessert') || value.includes('sweet')) return '🍰'
  if (value.includes('seafood') || value.includes('fish')) return '🐟'
  if (value.includes('beef') || value.includes('pork') || value.includes('chicken')) return '🍖'
  if (value.includes('vegetarian') || value.includes('vegan')) return '🥗'
  if (value.includes('breakfast')) return '🥞'
  return '🍽️'
}

async function fetchTheMealDbRecommendations(
  payload: FetchMealRecommendationsPayload,
): Promise<MealRecommendation[] | null> {
  const mealDbIngredients = await loadMealDbIngredientList()
  const queries = pickMealDbIngredientQueries(payload, mealDbIngredients)

  if (!queries.length) return null

  const pantryNames = pantryNamesForMatching(payload)

  const filterResults = await Promise.all(
    queries.map((ingredient) =>
      fetchMealDbJson<MealDbFilterResponse>(
        getMealDbUrl('filter.php', { i: ingredient }),
      ).catch(() => ({ meals: null })),
    ),
  )

  const mealSummaries = new Map<
    string,
    { idMeal: string; strMeal: string; strMealThumb?: string; queryHits: number }
  >()

  filterResults.forEach((result, queryIndex) => {
    const query = queries[queryIndex]
    ;(result.meals ?? []).forEach((meal) => {
      const existing = mealSummaries.get(meal.idMeal)
      if (existing) {
        existing.queryHits += 1
      } else {
        mealSummaries.set(meal.idMeal, {
          idMeal: meal.idMeal,
          strMeal: meal.strMeal,
          strMealThumb: meal.strMealThumb,
          queryHits: query ? 1 : 0,
        })
      }
    })
  })

  const rankedIds = Array.from(mealSummaries.values())
    .sort((a, b) => b.queryHits - a.queryHits)
    .slice(0, MAX_RECOMMENDATIONS * 2)
    .map((meal) => meal.idMeal)

  if (!rankedIds.length) return null

  const lookupResults = await Promise.all(
    rankedIds.map((id) =>
      fetchMealDbJson<MealDbLookupResponse>(getMealDbUrl('lookup.php', { i: id })).catch(() => ({
        meals: null,
      })),
    ),
  )

  const recommendations = lookupResults
    .flatMap((result) => result.meals ?? [])
    .map((meal) => {
      const mealIngredients = getMealDbIngredients(meal)
      const { score, matched } = scoreMealAgainstPantry(mealIngredients, pantryNames)
      const summary = mealSummaries.get(meal.idMeal)
      const pantryBoost = score * 2 + (summary?.queryHits ?? 0)

      if (!meal.strMeal || !mealIngredients.length) return null

      const usesFromPantry = matched.length
        ? matched
        : mealIngredients.filter((ingredient) =>
            queries.some(
              (query) =>
                toMealDbFilterKey(ingredient) === query ||
                ingredient.toLowerCase().includes(query.replace(/_/g, ' ')),
            ),
          )

      const usesList = (usesFromPantry.length ? usesFromPantry : mealIngredients).slice(0, 6)

      return {
        meal,
        pantryBoost,
        matched,
        usesList,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => b.pantryBoost - a.pantryBoost)
    .slice(0, MAX_RECOMMENDATIONS)
    .map(({ meal, matched, usesList }) => ({
      id: Number(meal.idMeal),
      icon: mealCategoryEmoji(meal.strCategory),
      name: meal.strMeal,
      uses: usesList.join(', '),
      imageUrl: meal.strMealThumb,
      matchedIngredients: matched,
    }))

  return recommendations.length ? recommendations : null
}

export async function fetchMealRecommendations(
  payload: FetchMealRecommendationsPayload,
): Promise<MealRecommendation[] | null> {
  try {
    const mealDbRecommendations = await fetchTheMealDbRecommendations(payload)
    if (mealDbRecommendations?.length) return mealDbRecommendations
  } catch (error) {
    console.error('TheMealDB recommendations failed:', error)
    throw error
  }

  if (!API_URL) return null

  const token = await auth.currentUser?.getIdToken().catch(() => null)
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Recommendations API failed with ${response.status}`)
  }

  const data = (await response.json()) as MealRecommendationApiResponse
  return normalizeResponse(data)
}

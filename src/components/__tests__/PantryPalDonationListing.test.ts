// src/tests/components/PantryPalDonationListing.test.ts
import { describe, it, expect, beforeEach } from 'vitest'

// ─── Types (mirrored from component) ─────────────────────────────────────────

interface Tag {
  label: string
  variant?: 'green' | 'warn' | ''
}

interface DonationItem {
  id: number
  title: string
  tags: Tag[]
  description: string
  expiryDays?: number
}

// ─── Filter Logic (extracted from filteredListings computed) ──────────────────
// This mirrors exactly what the component does in filteredListings.
// Testing it as a pure function means no component mounting needed — fast & simple.

function filterListings(
  items: DonationItem[],
  options: {
    searchQuery?: string
    filterPickupLocation?: string
    filterCategory?: string
    filterExpiryDays?: number | null
    currentFilter?: 'all' | 'near-expiry'
    currentSort?: 'name' | 'expiry'
  }
): DonationItem[] {
  const {
    searchQuery = '',
    filterPickupLocation = '',
    filterCategory = '',
    filterExpiryDays = null,
    currentFilter = 'all',
    currentSort = 'name',
  } = options

  let result = [...items]

  // Search query
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.label.toLowerCase().includes(q)),
    )
  }

  // Near-expiry quick filter
  if (currentFilter === 'near-expiry') {
    result = result.filter((item) => (item.expiryDays ?? 999) <= 3)
  }

  // Location filter
  if (filterPickupLocation) {
    result = result.filter((item) =>
      item.description.toLowerCase().includes(`pickup ${filterPickupLocation.toLowerCase()}`),
    )
  }

  // Category filter
  if (filterCategory) {
    result = result.filter((item) => item.tags.some((tag) => tag.label === filterCategory))
  }

  // Expiry days filter
  if (filterExpiryDays !== null) {
    result = result.filter((item) => (item.expiryDays ?? 999) <= filterExpiryDays!)
  }

  // Sort
  result.sort((a, b) => {
    if (currentSort === 'expiry') {
      return (a.expiryDays ?? 999) - (b.expiryDays ?? 999)
    }
    return a.title.localeCompare(b.title)
  })

  return result
}

// ─── Mock Listings (same data as the component) ───────────────────────────────

const mockListings: DonationItem[] = [
  {
    id: 3,
    title: 'Susu UltraMilk · 500ml Original',
    tags: [
      { label: 'Exp: 6 Apr', variant: 'warn' },
      { label: 'Dairy' },
      { label: 'Active', variant: 'green' },
    ],
    description: 'Unopened, pickup Kerobokan. Available 8am–12pm.',
    expiryDays: 2,
  },
  {
    id: 4,
    title: 'Susu UltraMilk · 500ml Original',
    tags: [
      { label: 'Dairy' },
      { label: '2d left', variant: 'warn' },
      { label: 'Active', variant: 'green' },
    ],
    description: '3 cartons. Contact via WhatsApp for pickup schedule.',
    expiryDays: 2,
  },
  {
    id: 5,
    title: 'Telur Kampung · 1 Dozen',
    tags: [
      { label: 'Fresh', variant: 'green' },
      { label: 'Protein' },
      { label: 'Active', variant: 'green' },
    ],
    description: 'Farm fresh eggs, pickup Ubud area only.',
    expiryDays: 7,
  },
  {
    id: 6,
    title: 'Roti Tawar · 1 Loaf',
    tags: [{ label: 'Exp: Today', variant: 'warn' }, { label: 'Bread' }],
    description: 'Half loaf remaining. Free, please take today.',
    expiryDays: 0,
  },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PantryPalDonationListing — filteredListings', () => {

  // ── No filters ─────────────────────────────────────────────────────────────

  describe('no filters applied', () => {
    it('returns all listings when no filters are set', () => {
      const result = filterListings(mockListings, {})
      expect(result).toHaveLength(4)
    })

    it('returns empty array when listings are empty', () => {
      const result = filterListings([], {})
      expect(result).toHaveLength(0)
    })
  })

  // ── Pickup Location filter ──────────────────────────────────────────────────

  describe('filterPickupLocation', () => {
    it('returns only listings matching pickup Kerobokan', () => {
      const result = filterListings(mockListings, { filterPickupLocation: 'Kerobokan' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(3)
    })

    it('returns only listings matching pickup Ubud', () => {
      const result = filterListings(mockListings, { filterPickupLocation: 'Ubud' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(5)
      expect(result[0].title).toBe('Telur Kampung · 1 Dozen')
    })

    it('returns empty array when no listings match location', () => {
      const result = filterListings(mockListings, { filterPickupLocation: 'Seminyak' })
      expect(result).toHaveLength(0)
    })

    it('is case-insensitive for location filter', () => {
      const result = filterListings(mockListings, { filterPickupLocation: 'kerobokan' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(3)
    })

    it('returns all listings when location filter is empty string', () => {
      const result = filterListings(mockListings, { filterPickupLocation: '' })
      expect(result).toHaveLength(4)
    })
  })

  // ── Category filter ─────────────────────────────────────────────────────────

  describe('filterCategory', () => {
    it('returns only Dairy listings', () => {
      const result = filterListings(mockListings, { filterCategory: 'Dairy' })
      expect(result).toHaveLength(2)
      result.forEach((item) => {
        expect(item.tags.some((tag) => tag.label === 'Dairy')).toBe(true)
      })
    })

    it('returns only Protein listings', () => {
      const result = filterListings(mockListings, { filterCategory: 'Protein' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(5)
    })

    it('returns only Bread listings', () => {
      const result = filterListings(mockListings, { filterCategory: 'Bread' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(6)
      expect(result[0].title).toBe('Roti Tawar · 1 Loaf')
    })

    it('returns empty array when category does not exist', () => {
      const result = filterListings(mockListings, { filterCategory: 'Seafood' })
      expect(result).toHaveLength(0)
    })

    it('returns all listings when category filter is empty string', () => {
      const result = filterListings(mockListings, { filterCategory: '' })
      expect(result).toHaveLength(4)
    })
  })

  // ── Expiry Days filter ──────────────────────────────────────────────────────

  describe('filterExpiryDays', () => {
    it('returns only listings expiring today (0 days)', () => {
      const result = filterListings(mockListings, { filterExpiryDays: 0 })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(6)
      expect(result[0].title).toBe('Roti Tawar · 1 Loaf')
    })

    it('returns listings expiring within 2 days', () => {
      const result = filterListings(mockListings, { filterExpiryDays: 2 })
      expect(result).toHaveLength(3) // ids 3, 4 (2 days), 6 (0 days)
      result.forEach((item) => {
        expect(item.expiryDays).toBeLessThanOrEqual(2)
      })
    })

    it('returns listings expiring within 3 days', () => {
      const result = filterListings(mockListings, { filterExpiryDays: 3 })
      expect(result).toHaveLength(3) // ids 3, 4, 6
    })

    it('returns listings expiring within 7 days', () => {
      const result = filterListings(mockListings, { filterExpiryDays: 7 })
      expect(result).toHaveLength(4) // all listings
    })

    it('returns all listings when filterExpiryDays is null', () => {
      const result = filterListings(mockListings, { filterExpiryDays: null })
      expect(result).toHaveLength(4)
    })
  })

  // ── Combined filters ────────────────────────────────────────────────────────

  describe('combined filters', () => {
    it('filters by location AND category together', () => {
      const result = filterListings(mockListings, {
        filterPickupLocation: 'Kerobokan',
        filterCategory: 'Dairy',
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(3)
    })

    it('filters by category AND expiry days together', () => {
      const result = filterListings(mockListings, {
        filterCategory: 'Dairy',
        filterExpiryDays: 2,
      })
      expect(result).toHaveLength(2) // both UltraMilk listings (expiryDays: 2)
      result.forEach((item) => {
        expect(item.tags.some((t) => t.label === 'Dairy')).toBe(true)
        expect(item.expiryDays).toBeLessThanOrEqual(2)
      })
    })

    it('returns empty when location and category combination matches nothing', () => {
      const result = filterListings(mockListings, {
        filterPickupLocation: 'Ubud',
        filterCategory: 'Dairy', // Ubud listing is Protein, not Dairy
      })
      expect(result).toHaveLength(0)
    })

    it('filters by all three: location, category, and expiry', () => {
      const result = filterListings(mockListings, {
        filterPickupLocation: 'Kerobokan',
        filterCategory: 'Dairy',
        filterExpiryDays: 3,
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(3)
    })
  })

  // ── Search query ────────────────────────────────────────────────────────────

  describe('searchQuery', () => {
    it('filters by title keyword', () => {
      const result = filterListings(mockListings, { searchQuery: 'Telur' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(5)
    })

    it('filters by description keyword', () => {
      const result = filterListings(mockListings, { searchQuery: 'WhatsApp' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(4)
    })

    it('filters by tag keyword', () => {
      const result = filterListings(mockListings, { searchQuery: 'Protein' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(5)
    })

    it('is case-insensitive', () => {
      const result = filterListings(mockListings, { searchQuery: 'roti' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(6)
    })

    it('returns empty when search matches nothing', () => {
      const result = filterListings(mockListings, { searchQuery: 'xyz-no-match' })
      expect(result).toHaveLength(0)
    })
  })

  // ── Sorting ─────────────────────────────────────────────────────────────────

  describe('sorting', () => {
    it('sorts by name (alphabetical) by default', () => {
      const result = filterListings(mockListings, { currentSort: 'name' })
      const titles = result.map((i) => i.title)
      expect(titles).toEqual([...titles].sort())
    })

    it('sorts by expiry days ascending', () => {
      const result = filterListings(mockListings, { currentSort: 'expiry' })
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].expiryDays ?? 999).toBeLessThanOrEqual(result[i + 1].expiryDays ?? 999)
      }
    })

    it('near-expiry quick filter shows only items expiring within 3 days', () => {
      const result = filterListings(mockListings, { currentFilter: 'near-expiry' })
      expect(result).toHaveLength(3) // ids 3, 4, 6
      result.forEach((item) => {
        expect(item.expiryDays).toBeLessThanOrEqual(3)
      })
    })
  })
})

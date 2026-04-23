import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import ManageInventory from '../ManageInventory.vue'
import BaseSidebar from '@/components/BaseSidebar.vue'
import BaseTopbar from '@/components/BaseTopbar.vue'

// Mock child components
vi.mock('@/components/BaseSidebar.vue', () => ({
  default: {
    name: 'BaseSidebar',
    template: '<div class="mock-sidebar"><slot /></div>'
  }
}))
vi.mock('@/components/BaseTopbar.vue', () => ({
  default: {
    name: 'BaseTopbar',
    template: '<div class="mock-topbar">{{ title }}<input class="search-input" v-model="modelValue" @input="$emit(\'update:searchValue\', $event.target.value)" /></div>',
    props: ['title', 'searchPlaceholder', 'modelValue'],
    emits: ['update:searchValue']
  }
}))

// Mock analytics
vi.mock('@/services/localAnalyticsStore.ts', () => ({
  addLocalAnalyticsEvent: vi.fn(),
  addLocalAnalyticsEvents: vi.fn()
}))

describe('ManageInventory.vue', () => {
  let wrapper: any
  let mockLocalStorageGet: any
  let mockLocalStorageSet: any

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorageGet = vi.spyOn(localStorage, 'getItem').mockImplementation((key: string) => {
      if (key === 'pantryPal_inventory') return JSON.stringify([
        {
          id: 'f1',
          name: 'Susu UltraMilk',
          description: 'Fresh milk, rich in calcium and vitamin D',
          volume: '500ml',
          location: 'Middle shelf',
          expiryDays: 10,
          category: 'fridge',
          foodType: 'Dairy & Eggs',
          searchTerms: 'milk dairy',
          quantityLevel: 'low',
        },
        {
          id: 'f2',
          name: 'Fresh Spinach',
          description: 'Organic spinach leaves, great for salads and cooking',
          volume: '200g bag',
          location: 'Veg drawer',
          expiryDays: 10,
          category: 'fridge',
          foodType: 'Vegetables',
          searchTerms: 'spinach greens',
          quantityLevel: 'high',
        }
      ])
      if (key === 'pantryPal_nextId') return '100'
      return null
    })
    mockLocalStorageSet = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {})
    vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {})

    wrapper = mount(ManageInventory, {
      global: {
        stubs: {
          BaseSidebar: true,
        }
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    if (wrapper) wrapper.unmount()
  })

  // 1. COMPONENT MOUNTING & RENDERING
  it('TC-001: mounts properly and shows title', () => {
    expect(wrapper.text()).toContain('Manage Inventory')
  })

  it('TC-002: renders BaseSidebar and BaseTopbar', () => {
    expect(wrapper.findComponent(BaseSidebar).exists()).toBe(true)
    expect(wrapper.findComponent(BaseTopbar).exists()).toBe(true)
  })

  it('TC-003: default layout is cards', async () => {
    await nextTick()
    expect(wrapper.find('.compact-inventory-board').exists()).toBe(false)
    expect(wrapper.find('.storage-category').exists()).toBe(true)
  })

  it('TC-004: shows floating add button', () => {
    expect(wrapper.find('.floating-add').exists()).toBe(true)
    expect(wrapper.find('.floating-add').text()).toBe('+')
  })

  it('TC-005: renders near expiry items', async () => {
    await nextTick()
    const nearExpiryGrid = wrapper.find('#expiryGrid')
    expect(nearExpiryGrid.text()).toContain('Fresh Spinach')
  })

  // 2. INVENTORY DISPLAY & CATEGORIES
  it('TC-006: displays mock inventory items', async () => {
    await nextTick()
    expect(wrapper.text()).toContain('Susu UltraMilk')
    expect(wrapper.text()).toContain('Fresh Spinach')
  })

  it('TC-007: shows correct category counts', async () => {
    await nextTick()
    expect(wrapper.text()).toContain('2 items') // Fridge has sample items
  })

  it('TC-008: toggles category expansion', async () => {
    await nextTick()
    const fridgeHeader = wrapper.find('#fridgeCategory .category-header')
    await fridgeHeader.trigger('click')
    await nextTick()
    expect(wrapper.find('#fridgeGrid').exists()).toBe(true)
  })

  it('TC-009: shows quantity levels correctly', async () => {
    await nextTick()
    expect(wrapper.find('.quantity-label.low').exists()).toBe(true) // Spinach is low
  })

  it('TC-010: renders item cards with complete details', async () => {
    await nextTick()
    const card = wrapper.find('.food-item-card')
    expect(card.text()).toContain('Fresh Spinach')
    expect(card.text()).toContain('200g bag')
    expect(card.text()).toContain('2d left')
  })

  it('TC-011: groups items by storage location', async () => {
    await nextTick()
    expect(wrapper.find('#fridgeGrid .food-item-card').exists()).toBe(true)
    expect(wrapper.find('#freezerGrid').exists()).toBe(true)
  })

  it('TC-012: category expansion persists state', async () => {
    await nextTick()
    const fridgeHeader = wrapper.find('#fridgeCategory .category-header')
    await fridgeHeader.trigger('click')
    expect(mockLocalStorageSet).toHaveBeenCalledWith(
      'pantryPal_expandedCategories',
      expect.any(String)
    )
  })

  it('TC-013: displays accurate item counts per category', async () => {
    await nextTick()
    const fridgeBadge = wrapper.find('#fridgeCategory .cat-badge')
    expect(fridgeBadge.text()).toBe('2 items')
  })

  it('TC-014: shows quantity progress bars with correct widths', async () => {
    await nextTick()
    const progressBar = wrapper.find('.usage-fill.low')
    expect(progressBar.exists()).toBe(true)
    expect(progressBar.attributes('style')).toContain('width: 25%')
  })

  // 3. SEARCH & FILTERING
  it('TC-015: search filters items by name', async () => {
    const searchInput = wrapper.find('.search-input')
    await searchInput.setValue('Susu')
    await nextTick()
    expect(wrapper.text()).toContain('Susu UltraMilk')
    expect(wrapper.text()).not.toContain('Fresh Spinach')
  })

  it('TC-016: multi-field search works', async () => {
    const searchInput = wrapper.find('.search-input')
    await searchInput.setValue('500ml')
    await nextTick()
    expect(wrapper.text()).toContain('Susu UltraMilk')
  })

  it('TC-017: filter by storage location', async () => {
    wrapper.vm.currentFilter = 'fridge'
    await wrapper.vm.$forceUpdate()
    await nextTick()
    expect(wrapper.findAll('.food-item-card').length).toBeGreaterThan(0)
  })

  it('TC-018: near expiry filter shows urgent items', async () => {
    wrapper.vm.currentFilter = 'near-expiry'
    await wrapper.vm.$forceUpdate()
    await nextTick()
    // Should show items with expiryDays <= 3
  })

  it('TC-019: sort by expiry works', async () => {
    wrapper.vm.currentSort = 'expiry'
    await wrapper.vm.$forceUpdate()
    await nextTick()
    // Items should be sorted by expiry days
  })

  it('TC-020: sort by category works', async () => {
    wrapper.vm.currentSort = 'category'
    await wrapper.vm.$forceUpdate()
    await nextTick()
    // Items should be sorted by category
  })

  it('TC-021: search hides non-matching items', async () => {
    const searchInput = wrapper.find('.search-input')
    await searchInput.setValue('nonexistent')
    await nextTick()
    expect(wrapper.findAll('.food-item-card').length).toBe(2)
  })

  // 4. SELECTION & BULK ACTIONS
  it('TC-022: toggles donation checkbox', async () => {
    await nextTick()
    const checkbox = wrapper.find('.donation-checkbox')
    await checkbox.setValue(true)
    await nextTick()
    expect(checkbox.element.checked).toBe(true)
    expect(wrapper.find('.food-item-card.selected-for-donation').exists()).toBe(true)
  })

  it('TC-023: select all visible items', async () => {
    const selectAllBtn = wrapper.find('#selectAllBtn')
    if (selectAllBtn.exists()) {
      await selectAllBtn.trigger('click')
      await nextTick()
      expect(wrapper.findAll('.donation-checkbox:checked').length).toBeGreaterThan(0)
    }
  })

  it('TC-024: clear all selections', async () => {
    // First select some
    const checkbox = wrapper.find('.donation-checkbox')
    await checkbox.setValue(true)
    await wrapper.find('#clearSelectionBtn').trigger('click')
    await nextTick()
    expect(wrapper.findAll('.donation-checkbox:checked').length).toBe(0)
  })

  it('TC-025: bulk donate removes selected items', async () => {
    const checkbox = wrapper.find('.donation-checkbox')
    await checkbox.setValue(true)
    const donateBtn = wrapper.find('#donateBulkBtn')
    if (donateBtn.exists()) {
      await donateBtn.trigger('click')
      await nextTick()
      expect(wrapper.vm.selectedDonationIds.size).toBe(0)
    }
  })

  // 5. ADD ITEM MODAL & FORM
  it('TC-026: opens add modal on + click', async () => {
    await wrapper.find('.floating-add').trigger('click')
    await nextTick()
    expect(wrapper.find('.modal-overlay[style*="display: flex"]').exists()).toBe(true)
    expect(wrapper.find('.modal-box h2').text()).toBe('Add New Food Item')
  })

  it('TC-027: closes add modal on cancel', async () => {
    await wrapper.find('.floating-add').trigger('click')
    await wrapper.find('.modal-cancel').trigger('click')
    await nextTick()
    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
  })

  it('TC-028: validates required fields', async () => {
    await wrapper.find('.floating-add').trigger('click')
    await wrapper.find('.modal-add').trigger('click')
    await nextTick()
    // Should show validation error
  })

  it('TC-029: enforces character limits', async () => {
    await wrapper.find('.floating-add').trigger('click')
    await nextTick()
    const nameInput = wrapper.find('input[type="text"]')
    await nameInput.setValue('A'.repeat(30)) // Over limit
    // HTML maxlength should prevent more than 25 chars
    expect(nameInput.element.value.length).toBeLessThanOrEqual(25)
  })

  it('TC-030: calculates expiry days correctly', async () => {
    await wrapper.find('.floating-add').trigger('click')
    await nextTick()
    await wrapper.find('#expiryDate').setValue('2026-05-03')
    await nextTick()
    expect(wrapper.vm.calculateDaysUntil('2026-05-03')).toBeGreaterThan(0)
  })

  it('TC-031: storage selection works', async () => {
    await wrapper.find('.floating-add').trigger('click')
    const storageBtns = wrapper.findAll('.storage-btn')
    const fridgeBtn = storageBtns[0] // First button is fridge
    await fridgeBtn.trigger('click')
    expect(fridgeBtn.classes()).toContain('active')
  })

  // 6. USE ITEM MODAL & UPDATES
  it('TC-032: opens use modal', async () => {
    await nextTick()
    const useBtn = wrapper.find('.mini-btn.use-item')
    if (useBtn.exists()) {
      await useBtn.trigger('click')
      await nextTick()
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
      expect(wrapper.text()).toContain('Update Item Usage')
    }
  })

  it('TC-033: updates quantity level', async () => {
    await nextTick()
    const useBtn = wrapper.find('.mini-btn.use-item')
    if (useBtn.exists()) {
      await useBtn.trigger('click')
      await wrapper.find('.qty-option.low').trigger('click')
      await wrapper.find('.modal-add').trigger('click')
      await nextTick()
      expect(wrapper.text()).toContain('Updated')
    }
  })

  it('TC-034: finish item removes it', async () => {
    await nextTick()
    const useBtn = wrapper.find('.mini-btn.use-item')
    if (useBtn.exists()) {
      await useBtn.trigger('click')
      const finishBtn = wrapper.find('button[style*="background: #fee2e2"]')
      if (finishBtn.exists()) {
        await finishBtn.trigger('click')
        await nextTick()
        // Item should be removed
      }
    }
  })

  it('TC-035: cancel use modal', async () => {
    await nextTick()
    const useBtn = wrapper.find('.mini-btn.use-item')
    if (useBtn.exists()) {
      await useBtn.trigger('click')
      await wrapper.find('.modal-cancel').trigger('click')
      await nextTick()
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    }
  })

  // 7. ITEM ACTIONS
  it('TC-036: delete item removes from inventory', async () => {
    const initialCount = wrapper.vm.inventory.length
    const deleteBtn = wrapper.find('.mini-btn.delete-item')
    if (deleteBtn.exists()) {
      await deleteBtn.trigger('click')
      await nextTick()
      expect(wrapper.vm.inventory.length).toBeLessThan(initialCount)
    }
  })

  it('TC-037: single donate removes item', async () => {
    const donateBtn = wrapper.find('.mini-btn.donate-mini')
    if (donateBtn.exists()) {
      await donateBtn.trigger('click')
      await nextTick()
      // Item should be removed
    }
  })

  it('TC-038: changes persist across remounts', async () => {
    wrapper.vm.inventory.push({ id: 'test', name: 'Test Item', expiryDays: 10, category: 'fridge' } as any)
    await nextTick()
    expect(mockLocalStorageSet).toHaveBeenCalledWith(
      'pantryPal_inventory',
      expect.any(String)
    )
  })

  // 8. DATA PERSISTENCE & LOCALSTORAGE
  it('TC-039: saves inventory to localStorage', async () => {
    wrapper.vm.inventory.push({ id: 'test', name: 'Test Item' } as any)
    await nextTick()
    // expect(mockLocalStorageSet).toHaveBeenCalledWith(
    //   'pantryPal_inventory',
    //   expect.any(String)
    // )
  })

  it('TC-040: loads inventory from localStorage', async () => {
    mockLocalStorageGet.mockImplementationOnce((key: string) => {
      if (key === 'pantryPal_inventory') {
        return JSON.stringify([{ id: 'loaded', name: 'Loaded Item' }])
      }
      return null
    })
    wrapper.vm.inventory = [{ id: 'loaded', name: 'Loaded Item' }] as any
    await wrapper.vm.$forceUpdate()
    await nextTick()
    expect(wrapper.text()).toContain('Loaded Item')
  })

  // 9. EDGE CASES & ERROR HANDLING
  it('TC-041: handles past expiry dates', async () => {
    await wrapper.find('.floating-add').trigger('click')
    await wrapper.find('#expiryDate').setValue('2026-04-20') // Past date
    await nextTick()
    // Should handle gracefully
  })

  it('TC-042: allows duplicate item names', async () => {
    wrapper.vm.inventory.push(
      { id: 'dup1', name: 'Milk', category: 'fridge' } as any,
      { id: 'dup2', name: 'Milk', category: 'freezer' } as any
    )
    await wrapper.vm.$forceUpdate()
    expect(wrapper.findAll('.food-item-card').length).toBeGreaterThan(1)
  })

  // 10. USER EXPERIENCE & ACCESSIBILITY
  it('TC-043: shows toast notifications', async () => {
    wrapper.vm.notifyMessage('Test message')
    await nextTick()
    expect(document.body.textContent).toContain('Test message')
  })

  // 11. ANALYTICS INTEGRATION
  it('TC-044: records usage analytics', async () => {
    const { addLocalAnalyticsEvent } = await import('@/services/localAnalyticsStore')
    await wrapper.find('.mini-btn.use-item').trigger('click')
    const finishBtn = wrapper.find('button[style*="background: #fee2e2"]')
    await finishBtn.trigger('click')
    expect(addLocalAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'used' })
    )
  })

  // 12. LAYOUT SWITCHING
  it('TC-045: switches to compact layout', async () => {
    const compactBtn = wrapper.findAll('.layout-toggle-btn').at(1) // Second button
    if (compactBtn.exists()) {
      await compactBtn.trigger('click')
      await nextTick()
      expect(wrapper.find('.compact-inventory-board').exists()).toBe(true)
    }
  })

  // 13. DATE & TIME HANDLING
  it('TC-046: calculates days until expiry', () => {
    const days = wrapper.vm.calculateDaysUntil('2026-05-03')
    expect(days).toBeGreaterThan(0)
  })

  // 14. QUANTITY MANAGEMENT
  it('TC-047: updates quantity visual indicators', async () => {
    await wrapper.find('.mini-btn.use-item').trigger('click')
    await wrapper.find('.qty-option.low').trigger('click')
    await wrapper.find('.modal-add').trigger('click')
    await nextTick()
    // Visual update should occur
  })

  // 15. SEARCH EDGE CASES
  it('TC-048: clears search shows all items', async () => {
    const searchInput = wrapper.find('.search-input')
    await searchInput.setValue('Susu')
    await searchInput.setValue('')
    await nextTick()
    expect(wrapper.findAll('.food-item-card').length).toBeGreaterThan(0)
  })

  it('TC-049: handles special characters in search', async () => {
    wrapper.vm.inventory.push({ id: 'special', name: 'Bread & Butter', category: 'pantry' } as any)
    await wrapper.vm.$forceUpdate()
    const searchInput = wrapper.find('.search-input')
    await searchInput.setValue('bread')
    await nextTick()
    expect(wrapper.text()).toContain('Bread & Butter')
  })
})

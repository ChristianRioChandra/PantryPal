<template>
  <div class="manage-inventory-page">
    <!-- Topbar handles its own notification popup internally now -->

    <!-- USE MODAL -->
    <Transition name="premium-modal">
      <div v-if="useModalOpen" class="modal-overlay" @click.self="closeUseModal">
        <div class="modal-box">
          <h2>Update Item Usage</h2>
          <p style="font-weight: 600; text-align: center">{{ useItemName }}</p>
          <p style="font-size: 0.85rem; margin-top: 10px">Update remaining quantity:</p>

          <div class="quantity-selector" id="useQtySelector">
            <div
              class="qty-option low"
              :class="{ selected: selectedUseQuantity === 'low' }"
              data-level="low"
              @click="selectedUseQuantity = 'low'"
            >
              Low
            </div>
            <div
              class="qty-option half"
              :class="{ selected: selectedUseQuantity === 'half' }"
              data-level="half"
              @click="selectedUseQuantity = 'half'"
            >
              Half
            </div>
            <div
              class="qty-option high"
              :class="{ selected: selectedUseQuantity === 'high' }"
              data-level="high"
              @click="selectedUseQuantity = 'high'"
            >
              High
            </div>
            <div
              class="qty-option full"
              :class="{ selected: selectedUseQuantity === 'full' }"
              data-level="full"
              @click="selectedUseQuantity = 'full'"
            >
              Full
            </div>
          </div>

          <button
            @click="requestFinishItem"
            style="
              margin-top: 10px;
              background: #fee2e2;
              color: #b91c1c;
              border: none;
              padding: 10px;
              border-radius: 14px;
              font-weight: 600;
              cursor: pointer;
            "
          >
            Finish Item (Remove)
          </button>

          <div class="modal-actions">
            <button @click="closeUseModal" class="modal-cancel">Cancel</button>
            <button @click="confirmUse" class="modal-add">Save</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="premium-modal">
      <div
        v-if="confirmationModalOpen"
        class="modal-overlay confirmation-overlay"
        @click.self="closeConfirmationModal"
      >
        <div class="modal-box confirmation-modal">
          <h2>{{ confirmationConfig.title }}</h2>
          <p class="confirmation-copy">
            {{ confirmationConfig.message }}
            <strong>{{ confirmationItemName }}</strong
            >?
          </p>

          <div class="modal-actions">
            <button type="button" @click="closeConfirmationModal" class="modal-cancel">
              Cancel
            </button>
            <button type="button" @click="confirmPendingAction" class="modal-add modal-danger">
              {{ confirmationConfig.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ADD ITEM MODAL -->
    <Transition name="premium-modal">
      <div v-if="addModalOpen" class="modal-overlay" @click.self="closeAddModal">
        <div class="modal-box">
          <h2>Add New Food Item</h2>

          <div class="form-section">
            <label class="field-label"
              >Food Item Title <span class="char-count">({{ newItem.name.length }}/20)</span></label
            >
            <input
              type="text"
              v-model="newItem.name"
              placeholder="Enter food item name"
              maxlength="20"
              class="form-input"
            />
          </div>

          <div class="form-section">
            <label class="field-label"
              >Short Description
              <span class="char-count">({{ newItem.description.length }}/180)</span></label
            >
            <textarea
              v-model="newItem.description"
              placeholder="Brief description of the food item"
              maxlength="180"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="form-row expiry-row">
            <div class="form-section">
              <label class="field-label">Expiry Date</label>
              <input
                id="expiryDate"
                v-model="newItem.expiryDate"
                class="date-input"
                :class="{ 'has-date': !!newItem.expiryDate }"
                type="date"
                :min="todayDate"
              />
            </div>
            <div
              class="expiry-preview expiry-summary"
              :class="{
                empty: !newItem.expiryDate,
                urgent: newItemExpiryDays !== null && newItemExpiryDays <= 3,
              }"
            >
              {{ newItemExpiryLabel }}
            </div>
          </div>

          <div class="form-row">
            <div class="form-section">
              <label class="field-label">Food Type</label>
              <select v-model="newItem.foodType" class="form-input">
                <option v-for="type in foodTypeOptions" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>
            <div class="form-section">
              <label class="field-label"
                >Volume/Quantity
                <span class="char-count">({{ newItem.volume.length }}/7)</span></label
              >
              <input
                type="text"
                v-model="newItem.volume"
                placeholder="e.g., 500ml, 1kg, 12 pieces"
                maxlength="7"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-section">
            <label class="field-label">Storage Location</label>
            <div class="storage-select">
              <button
                class="storage-btn"
                :class="{ active: selectedStorage === 'fridge' }"
                @click="selectedStorage = 'fridge'"
              >
                <i class="bi bi-thermometer-low"></i> Fridge
              </button>
              <button
                class="storage-btn"
                :class="{ active: selectedStorage === 'freezer' }"
                @click="selectedStorage = 'freezer'"
              >
                <i class="bi bi-snow"></i> Freezer
              </button>
              <button
                class="storage-btn"
                :class="{ active: selectedStorage === 'pantry' }"
                @click="selectedStorage = 'pantry'"
              >
                <i class="bi bi-bookshelf"></i> Pantry
              </button>
              <button
                class="storage-btn"
                :class="{ active: selectedStorage === 'countertop' }"
                @click="selectedStorage = 'countertop'"
              >
                <i class="bi bi-cup-hot"></i> Countertop
              </button>
            </div>
          </div>

          <div class="form-section">
            <label class="field-label">Quantity Level</label>
            <div class="qty-progress-wrapper">
              <div class="qty-progress-bar">
                <div
                  class="qty-progress-fill"
                  :style="{ width: qtyProgress.percent, background: qtyProgress.color }"
                ></div>
              </div>
              <div class="qty-progress-label">{{ qtyProgress.label }}</div>
            </div>

            <div class="quantity-selector" id="modalQtySelector">
              <div
                class="qty-option low"
                :class="{ selected: selectedQuantityLevel === 'low' }"
                @click="setQuantityLevel('low')"
              >
                Low
              </div>
              <div
                class="qty-option half"
                :class="{ selected: selectedQuantityLevel === 'half' }"
                @click="setQuantityLevel('half')"
              >
                Half
              </div>
              <div
                class="qty-option high"
                :class="{ selected: selectedQuantityLevel === 'high' }"
                @click="setQuantityLevel('high')"
              >
                High
              </div>
              <div
                class="qty-option full"
                :class="{ selected: selectedQuantityLevel === 'full' }"
                @click="setQuantityLevel('full')"
              >
                Full
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="closeAddModal" class="modal-cancel" :disabled="addModalSubmitting">
              Cancel
            </button>
            <button @click="confirmAdd" class="modal-add" :disabled="addModalSubmitting">
              {{ addModalSubmitting ? 'Adding...' : 'Add Item' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- DONATE ITEM MODAL -->
    <Transition name="premium-modal">
      <div v-if="donateModalOpen" class="modal-overlay" @click.self="closeDonateModal">
        <div class="modal-box">
          <h2>{{ isBulkDonation ? 'Donate Selected Items' : 'Donate Food Item' }}</h2>
          <p v-if="!isBulkDonation" style="font-weight: 600; text-align: center; color: #2c7a4d; margin-bottom: 12px;">{{ donateForm.title }}</p>

          <div v-if="!isBulkDonation" class="form-section">
            <label class="field-label">Donation Title</label>
            <input
              type="text"
              v-model="donateForm.title"
              placeholder="Enter item title for donation"
              class="form-input"
            />
          </div>

          <div v-if="!isBulkDonation" class="form-section">
            <label class="field-label">Donation Description</label>
            <textarea
              v-model="donateForm.description"
              placeholder="Brief details about pickup, freshness, packaging etc."
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="form-row">
            <div v-if="!isBulkDonation" class="form-section">
              <label class="field-label">Quantity</label>
              <input
                type="number"
                v-model.number="donateForm.quantity"
                min="1"
                class="form-input"
              />
            </div>
            <div v-if="!isBulkDonation" class="form-section">
              <label class="field-label">Expiry Date</label>
              <input
                type="date"
                v-model="donateForm.expiryDate"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-section">
            <label class="field-label">Pickup Location</label>
            <input
              type="text"
              v-model="donateForm.pickupLocation"
              placeholder="e.g. Main Lobby, PantryPal Hub, Apartment 4B"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-section">
              <label class="field-label">Available From</label>
              <input
                type="text"
                v-model="donateForm.availabilityStart"
                placeholder="e.g. 09:00 AM"
                class="form-input"
              />
            </div>
            <div class="form-section">
              <label class="field-label">Available Until</label>
              <input
                type="text"
                v-model="donateForm.availabilityEnd"
                placeholder="e.g. 05:00 PM"
                class="form-input"
              />
            </div>
          </div>

          <div class="modal-actions">
            <button @click="closeDonateModal" class="modal-cancel">
              Cancel
            </button>
            <button @click="submitDonation" class="modal-add" id="submitDonationBtn">
              Publish Donation
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="premium-modal">
      <div
        v-if="mobileFilterModalOpen"
        class="modal-overlay mobile-filter-overlay"
        @click.self="closeMobileFilterModal"
      >
        <div class="modal-box mobile-filter-box">
          <div class="mobile-filter-header">
            <div>
              <h2>Refine Inventory</h2>
              <p>Choose a storage filter and sorting mode.</p>
            </div>
            <button type="button" class="mobile-filter-close" @click="closeMobileFilterModal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="mobile-filter-group">
            <span class="mobile-filter-label">Storage</span>
            <div class="mobile-filter-grid">
              <button
                v-for="mode in filterModes"
                :key="mode"
                type="button"
                class="mobile-filter-chip"
                :class="{ active: isFilterActive(mode) }"
                @click="toggleMobileFilter(mode)"
              >
                {{ getFilterLabel(mode) }}
                <i v-if="isFilterActive(mode)" class="bi bi-check-circle-fill"></i>
              </button>
            </div>
          </div>

          <div class="mobile-filter-group">
            <span class="mobile-filter-label">Sort By</span>
            <div class="mobile-filter-grid sort-grid">
              <button
                v-for="mode in sortModes"
                :key="mode"
                type="button"
                class="mobile-filter-chip"
                :class="{ active: currentSort === mode }"
                @click="currentSort = mode"
              >
                {{ getSortLabel(mode) }}
              </button>
            </div>
          </div>

          <div class="mobile-filter-actions">
            <button type="button" class="modal-cancel" @click="resetMobileFilters">Reset</button>
            <button type="button" class="modal-add" @click="closeMobileFilterModal">Apply</button>
          </div>
        </div>
      </div>
    </Transition>

    <div class="dashboard">
      <BaseSidebar :nav-items="navItems" />

      <div class="main-content">
        <section class="mobile-top-shell">
          <div class="mobile-header-row">
            <button type="button" class="mobile-back-btn" @click="goBack">
              <i class="bi bi-arrow-left"></i>
            </button>
            <h1>Manage Inventory</h1>
            <div class="mobile-header-actions">
              <div class="notif-bell-container" @click="topbarRef?.openNotifications()">
                <i class="bi bi-bell clickable" title="Notifications"></i>
                <span v-if="notificationsStore.unreadCount > 0" class="notif-badge">
                  {{ notificationsStore.unreadCount > 9 ? '9+' : notificationsStore.unreadCount }}
                </span>
              </div>
              <i class="bi bi-box-arrow-right clickable" @click="handleLogout" title="Logout"></i>
            </div>
          </div>

          <div class="mobile-search-row">
            <div class="mobile-search-shell">
              <i class="bi bi-search"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search inventory"
                aria-label="Search inventory"
              />
            </div>
            <button type="button" class="mobile-icon-btn" @click="cycleSortMode">
              <i class="bi bi-arrow-down-up"></i>
              <span>{{ getSortLabel(currentSort) }}</span>
            </button>
          </div>

          <div class="mobile-chip-row" aria-label="Inventory quick filters">
            <button
              v-for="mode in mobileQuickFilters"
              :key="mode"
              type="button"
              class="mobile-quick-chip"
              :class="{ active: isFilterActive(mode) }"
              @click="toggleMobileFilter(mode)"
            >
              {{ getFilterLabel(mode) }}
            </button>
            <button type="button" class="mobile-filter-trigger" @click="openMobileFilterModal">
              <i class="bi bi-sliders2"></i>
            </button>
          </div>
        </section>

        <div class="topbar-sticky-wrap desktop-topbar">
          <BaseTopbar
            ref="topbarRef"
            title="Manage Inventory"
            search-placeholder="Search food, donations, meals..."
            v-model:search-value="searchQuery"
          />
        </div>

        <div class="layout-toggle-bar" aria-label="Inventory layout selector">
          <div class="layout-toggle" role="group" aria-label="Choose inventory layout">
            <button
              type="button"
              class="layout-toggle-btn"
              :class="{ active: inventoryLayout === 'cards' }"
              :aria-pressed="inventoryLayout === 'cards'"
              @click="setInventoryLayout('cards')"
            >
              <i class="bi bi-grid"></i>
              Detailed
            </button>
            <button
              type="button"
              class="layout-toggle-btn"
              :class="{ active: inventoryLayout === 'compact' }"
              :aria-pressed="inventoryLayout === 'compact'"
              @click="setInventoryLayout('compact')"
            >
              <i class="bi bi-columns-gap"></i>
              Compact
            </button>
          </div>
        </div>

        <div v-if="inventoryLayout === 'cards'">
          <!-- ALL ITEMS VIEW -->
          <div
            class="storage-category"
            :class="{ expanded: expandedCategories.all }"
            id="allCategory"
          >
            <div class="category-header" @click="toggleCategory('all')">
              <div class="cat-title">
                <i class="bi bi-box"></i>
                <h2>All Items</h2>
                <div class="cat-badge">{{ getCategoryCount('all') }} items</div>
              </div>
              <div class="expand-cat-icon"><i class="bi bi-chevron-down"></i></div>
            </div>
            <div class="category-items">
              <div class="food-grid" data-category="all" id="allGrid">
                <div
                  v-for="item in getFilteredAndSortedItems('all')"
                  :key="item.id"
                  class="food-item-card"
                  :class="{
                    'selected-for-donation': selectedDonationIds.has(item.id),
                    'hidden-by-search': isHiddenBySearch(item),
                  }"
                  :data-food-id="item.id"
                  :data-category="item.category"
                >
                  <div class="checkbox-overlay">
                    <input
                      type="checkbox"
                      class="donation-checkbox"
                      :checked="selectedDonationIds.has(item.id)"
                      @change="toggleDonationSelection(item.id)"
                    />
                  </div>
                  <div class="card-header">
                    <div class="card-title-section">
                      <h3 class="food-title">{{ escapeHtml(item.name) }}</h3>
                      <div class="row3">
                        <span v-if="item.isExpired" class="expiry-badge expired"
                          ><i class="bi bi-x-circle"></i> Expired</span
                        >
                        <span v-else-if="item.expiryDays <= 3" class="expiry-badge urgent"
                          ><i class="bi bi-exclamation-triangle"></i> expires in
                          {{ item.expiryDays }}d</span
                        >
                        <span v-else class="expiry-badge"
                          ><i class="bi bi-clock"></i> {{ item.expiryDays }}d left</span
                        >
                      </div>
                      <div class="row5">
                        <span class="tag storage-tag">{{ item.category }}</span>
                        <span class="tag type-tag">{{ item.foodType }}</span>
                        <span class="volume-badge">{{ item.volume }}</span>
                      </div>
                    </div>
                  </div>
                  <p class="food-description">{{ item.description }}</p>
                  <div class="card-meta"><div class="storage-tags"></div></div>
                  <div class="row2">
                    <div class="quantity-level-label-wrapper">
                      <span class="quantity-label" :class="item.quantityLevel || 'high'">{{
                        quantityLabels[item.quantityLevel as keyof typeof quantityLabels] ||
                        quantityLabels.high
                      }}</span>
                    </div>
                    <div class="quantity-level-label-wrapper">
                      <div class="usage-bar">
                        <div
                          class="usage-fill"
                          :class="item.quantityLevel || 'high'"
                          :style="{
                            width:
                              quantityWidths[item.quantityLevel as keyof typeof quantityWidths] ||
                              quantityWidths.high,
                          }"
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div class="food-extra-actions">
                    <button class="mini-btn delete-item" @click="requestDeleteItem(item.id)">
                      <i class="bi bi-trash"></i> Delete
                    </button>
                    <button class="mini-btn use-item" @click="openUseModal(item.id)">
                      <i class="bi bi-check"></i> Use
                    </button>
                    <button class="mini-btn donate-mini" @click="singleDonate(item.id)">
                      <i class="bi bi-gift"></i> Donate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- LOCATION SECTIONS -->
          <template
            v-for="loc in [
              { key: 'fridge', label: 'Fridge', icon: 'bi bi-thermometer-low' },
              { key: 'pantry', label: 'Pantry', icon: 'bi bi-bookshelf' },
              { key: 'freezer', label: 'Freezer', icon: 'bi bi-snow' },
              { key: 'countertop', label: 'Countertop', icon: 'bi bi-cup-hot' },
            ]"
            :key="loc.key"
          >
            <div
              v-if="visibleLocations.includes(loc.key)"
              class="storage-category"
              :class="{ expanded: expandedCategories[loc.key as keyof typeof expandedCategories] }"
              :id="loc.key + 'Category'"
            >
              <div
                class="category-header"
                @click="toggleCategory(loc.key as keyof typeof expandedCategories)"
              >
                <div class="cat-title">
                  <i :class="loc.icon"></i>
                  <h2>{{ loc.label }}</h2>
                  <div class="cat-badge">{{ getLocationSectionItems(loc.key).length }} items</div>
                </div>
                <div class="expand-cat-icon"><i class="bi bi-chevron-down"></i></div>
              </div>
              <div class="category-items">
                <div class="food-grid" :data-category="loc.key" :id="loc.key + 'Grid'">
                  <div
                    v-for="item in getLocationSectionItems(loc.key)"
                    :key="item.id"
                    class="food-item-card"
                    :class="{
                      'selected-for-donation': selectedDonationIds.has(item.id),
                      'hidden-by-search': isHiddenBySearch(item),
                    }"
                    :data-food-id="item.id"
                    :data-category="item.category"
                  >
                    <div class="checkbox-overlay">
                      <input
                        type="checkbox"
                        class="donation-checkbox"
                        :checked="selectedDonationIds.has(item.id)"
                        @change="toggleDonationSelection(item.id)"
                      />
                    </div>
                    <div class="card-header">
                      <div class="card-title-section">
                        <h3 class="food-title">{{ escapeHtml(item.name) }}</h3>
                        <div class="row3">
                          <span v-if="item.isExpired" class="expiry-badge expired"
                            ><i class="bi bi-x-circle"></i> Expired</span
                          >
                          <span v-else-if="item.expiryDays <= 3" class="expiry-badge urgent"
                            ><i class="bi bi-exclamation-triangle"></i> expires in
                            {{ item.expiryDays }}d</span
                          >
                          <span v-else class="expiry-badge"
                            ><i class="bi bi-clock"></i> {{ item.expiryDays }}d left</span
                          >
                        </div>
                        <div class="row5">
                          <span class="tag storage-tag">{{ item.category }}</span>
                          <span class="tag type-tag">{{ item.foodType }}</span>
                          <span class="volume-badge">{{ item.volume }}</span>
                        </div>
                      </div>
                    </div>
                    <p class="food-description">{{ item.description }}</p>
                    <div class="card-meta"><div class="storage-tags"></div></div>
                    <div class="row2">
                      <div class="quantity-level-label-wrapper">
                        <span class="quantity-label" :class="item.quantityLevel || 'high'">{{
                          quantityLabels[item.quantityLevel as keyof typeof quantityLabels] ||
                          quantityLabels.high
                        }}</span>
                      </div>
                      <div class="quantity-level-label-wrapper">
                        <div class="usage-bar">
                          <div
                            class="usage-fill"
                            :class="item.quantityLevel || 'high'"
                            :style="{
                              width:
                                quantityWidths[item.quantityLevel as keyof typeof quantityWidths] ||
                                quantityWidths.high,
                            }"
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div class="food-extra-actions">
                      <button class="mini-btn delete-item" @click="requestDeleteItem(item.id)">
                        <i class="bi bi-trash"></i> Delete
                      </button>
                      <button class="mini-btn use-item" @click="openUseModal(item.id)">
                        <i class="bi bi-check"></i> Use
                      </button>
                      <button class="mini-btn donate-mini" @click="singleDonate(item.id)">
                        <i class="bi bi-gift"></i> Donate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- NEAR EXPIRY (shown when Near Expiry filter is OFF) -->
          <div
            v-if="!activeNearExpiry"
            class="storage-category"
            :class="{ expanded: expandedCategories.expiry }"
            id="expiryCategory"
          >
            <div class="category-header" @click="toggleCategory('expiry')">
              <div class="cat-title">
                <i class="bi bi-exclamation-triangle"></i>
                <h2>Near Expiry</h2>
                <div class="cat-badge">{{ getNearExpiryCount() }} items</div>
              </div>
              <div class="expand-cat-icon"><i class="bi bi-chevron-down"></i></div>
            </div>
            <div class="category-items">
              <div class="food-grid" id="expiryGrid">
                <div
                  v-for="item in getNearExpiryItems()"
                  :key="item.id"
                  class="food-item-card"
                  :class="{ 'selected-for-donation': selectedDonationIds.has(item.id) }"
                  :data-food-id="item.id"
                >
                  <div class="checkbox-overlay">
                    <input
                      type="checkbox"
                      class="donation-checkbox"
                      :checked="selectedDonationIds.has(item.id)"
                      @change="toggleDonationSelection(item.id)"
                    />
                  </div>
                  <div class="card-header">
                    <div class="card-title-section">
                      <h3 class="food-title">{{ escapeHtml(item.name) }}</h3>
                      <div class="row3">
                        <span v-if="item.isExpired" class="expiry-badge expired"
                          ><i class="bi bi-x-circle"></i> Expired</span
                        >
                        <span v-else class="expiry-badge urgent"
                          ><i class="bi bi-exclamation-triangle"></i> expires in
                          {{ item.expiryDays }}d</span
                        >
                      </div>
                      <div class="row5">
                        <span class="tag storage-tag">{{ item.category }}</span>
                        <span class="tag type-tag">{{ item.foodType }}</span>
                        <span class="volume-badge">{{ item.volume }}</span>
                      </div>
                    </div>
                  </div>
                  <p class="food-description">{{ item.description }}</p>
                  <div class="row2">
                    <div class="quantity-level-label-wrapper">
                      <span class="quantity-label" :class="item.quantityLevel || 'high'">{{
                        quantityLabels[item.quantityLevel as keyof typeof quantityLabels] ||
                        quantityLabels.high
                      }}</span>
                    </div>
                    <div class="quantity-level-label-wrapper">
                      <div class="usage-bar">
                        <div
                          class="usage-fill"
                          :class="item.quantityLevel || 'high'"
                          :style="{
                            width:
                              quantityWidths[item.quantityLevel as keyof typeof quantityWidths] ||
                              quantityWidths.high,
                          }"
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div class="food-extra-actions">
                    <button class="mini-btn delete-item" @click="requestDeleteItem(item.id)">
                      <i class="bi bi-trash"></i> Delete
                    </button>
                    <button class="mini-btn use-item" @click="openUseModal(item.id)">
                      <i class="bi bi-check"></i> Use
                    </button>
                    <button class="mini-btn donate-mini" @click="singleDonate(item.id)">
                      <i class="bi bi-gift"></i> Donate
                    </button>
                  </div>
                </div>
                <div
                  v-if="getNearExpiryItems().length === 0"
                  style="padding: 20px; text-align: center; color: #7e95b0"
                >
                  No items near expiry! Keep up the good work.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="compact-inventory-board" aria-label="Compact storage inventory">
          <section
            v-for="column in compactStorageColumns"
            :key="column.key"
            class="compact-storage-column"
          >
            <div class="compact-column-header">
              <h3><i :class="column.icon"></i> {{ column.label }}</h3>
            </div>

            <div class="compact-column-list">
              <div
                v-for="item in getFilteredAndSortedItems(column.key)"
                :key="item.id"
                class="compact-food-item"
                :class="{
                  'selected-for-donation': selectedDonationIds.has(item.id),
                  urgent: item.expiryDays <= 3,
                }"
                :title="`${item.name} - ${item.volume}`"
              >
                <button class="compact-food-main" type="button" @click="openUseModal(item.id)">
                  <span class="compact-food-topline">
                    <span class="compact-food-name">{{ item.name }}</span>
                  </span>
                  <span class="compact-food-meta">
                    <span :class="{ urgent: item.isExpired || item.expiryDays <= 3 }">
                      <i
                        :class="
                          item.isExpired
                            ? 'bi bi-x-circle'
                            : item.expiryDays <= 3
                              ? 'bi bi-exclamation-triangle'
                              : 'bi bi-clock'
                        "
                      ></i>
                      {{ item.isExpired ? 'Expired' : item.expiryDays + 'd left' }}
                    </span>

                    <span :class="['compact-quantity', item.quantityLevel || 'high']">
                      {{
                        quantityLabels[item.quantityLevel as keyof typeof quantityLabels] ||
                        quantityLabels.high
                      }}
                    </span>
                  </span>
                </button>
              </div>

              <div v-if="getFilteredAndSortedItems(column.key).length === 0" class="compact-empty">
                No items
              </div>
            </div>
          </section>
        </div>
      </div>

      <aside class="right-sidebar">
        <div class="right-box">
          <div class="bulk-select-controls">
            <span class="selection-count" id="selectionCount"
              >{{ selectedDonationIds.size }} selected</span
            >
            <button class="right-btn" id="selectAllBtn" @click="selectAllVisible">
              <i class="bi bi-check2-all"></i> Select All
            </button>
            <button class="right-btn" id="clearSelectionBtn" @click="clearAllSelections">
              <i class="bi bi-x"></i> Clear
            </button>
          </div>
          <button class="right-btn" id="sortBtn" @click="cycleSortMode">
            <i class="bi bi-arrow-down-up"></i> Sort: {{ getSortLabel(currentSort) }}
          </button>
        </div>

        <div class="right-box filters-dropdown-wrap">
          <button
            class="filter-dropdown-trigger"
            @click="filtersOpen = !filtersOpen"
            :class="{ active: hasActiveFilters }"
          >
            <div class="trigger-left">
              <i class="bi bi-funnel-fill"></i>
              <span>Filters</span>
              <div v-if="activeFilterCount > 0" class="filter-count-badge">
                {{ activeFilterCount }}
              </div>
            </div>
            <i class="bi" :class="filtersOpen ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
          </button>

          <Transition name="fade-slide">
            <div v-if="filtersOpen" class="filter-dropdown-menu">
              <div class="filter-panel-header">
                <span class="filter-panel-title">Refine Results</span>
                <button v-if="hasActiveFilters" class="filter-clear-btn" @click="clearAllFilters">
                  <i class="bi bi-arrow-counterclockwise"></i> Reset
                </button>
              </div>

              <div class="filter-group">
                <div class="filter-group-label">Status</div>
                <button
                  class="filter-chip"
                  :class="{ active: activeNearExpiry }"
                  @click="activeNearExpiry = !activeNearExpiry"
                >
                  <i class="bi bi-exclamation-triangle"></i> Near Expiry
                </button>
              </div>

              <div class="filter-group">
                <div class="filter-group-label">Storage Location</div>
                <div class="filter-chip-grid">
                  <button
                    v-for="loc in [
                      { key: 'fridge', label: 'Fridge', icon: 'bi bi-thermometer-low' },
                      { key: 'freezer', label: 'Freezer', icon: 'bi bi-snow' },
                      { key: 'pantry', label: 'Pantry', icon: 'bi bi-bookshelf' },
                      { key: 'countertop', label: 'Counter', icon: 'bi bi-cup-hot' },
                    ]"
                    :key="loc.key"
                    class="filter-chip"
                    :class="{ active: activeLocations.has(loc.key) }"
                    @click="toggleLocationFilter(loc.key)"
                  >
                    <i :class="loc.icon"></i> {{ loc.label }}
                  </button>
                </div>
              </div>

              <div class="filter-group">
                <div class="filter-group-label">Food Type</div>
                <div class="filter-chip-grid">
                  <button
                    v-for="type in foodTypeOptions"
                    :key="type"
                    class="filter-chip"
                    :class="{ active: activeFoodTypes.has(type) }"
                    @click="toggleFoodTypeFilter(type)"
                  >
                    {{ type }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <div class="right-box">
          <button
            class="donate-bulk-btn"
            id="donateBulkBtn"
            :disabled="selectedDonationIds.size === 0"
            @click="bulkDonateAction"
          >
            <i class="bi bi-gift"></i> Donate Selected
          </button>
        </div>
        <div class="right-box">
          <button class="right-btn"><i class="bi bi-lightning"></i> Meal Plan</button>
        </div>
        <div class="floating-add" id="addRight" @click="openAddModal">+</div>
      </aside>
    </div>

    <button v-if="selectedDonationIds.size === 0" type="button" class="mobile-floating-add" @click="openAddModal" aria-label="Add item">
      <i class="bi bi-plus-lg"></i>
    </button>

    <!-- Mobile Bulk Action Bar -->
    <div v-if="selectedDonationIds.size > 0" class="mobile-bulk-action-bar">
      <div class="mobile-bulk-controls">
        <span class="bulk-selection-count">{{ selectedDonationIds.size }} selected</span>
        <button class="bulk-action-btn clear-btn" @click="clearAllSelections" title="Clear selection">
          <i class="bi bi-x"></i>
        </button>
      </div>
      <div class="mobile-bulk-actions">
        <button class="bulk-action-btn select-all-btn" @click="selectAllVisible" title="Select all items">
          <i class="bi bi-check2-all"></i> All
        </button>
        <button class="bulk-action-btn donate-btn" @click="bulkDonateAction" title="Donate selected items">
          <i class="bi bi-gift"></i> Donate
        </button>
      </div>
    </div>

    <nav class="mobile-bottom-nav" aria-label="Primary navigation">
      <button
        v-for="item in mobileNavItems"
        :key="item.route"
        type="button"
        class="mobile-nav-item"
        :class="{ active: isRouteActive(item.route) }"
        @click="navigateTo(item.route)"
      >
        <i v-if="item.icon" :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <!-- Success Popup -->
    <Transition name="premium-popup">
      <div
        v-if="showSuccessPopup"
        class="success-popup-overlay"
        @click.self="showSuccessPopup = false"
      >
        <div class="success-popup-card">
          <div class="success-icon-wrap">
            <div class="checkmark-circle">
              <i class="bi bi-check-lg"></i>
            </div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
          </div>
          <div class="success-text">
            <h3>Awesome!</h3>
            <p>
              <strong>{{ lastAddedItemName }}</strong> has been added to your inventory.
            </p>
          </div>
          <button class="success-close-btn" @click="showSuccessPopup = false">Got it</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { NavItem } from '@/components/BaseSidebar.vue'
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseSidebar from '@/components/BaseSidebar.vue'
import BaseTopbar from '@/components/BaseTopbar.vue'
import { auth, db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import {
  addFoodItem,
  deleteFoodItem,
  logFoodAction,
  FoodActionKind,
  markFoodAsDonated,
  markFoodAsUsed,
  updateFoodItem,
  type FoodItem,
} from '@/services/foodService'
import { createDonationListing } from '@/services/donationService'
import { addLocalAnalyticsEvent, addLocalAnalyticsEvents } from '@/services/localAnalyticsStore'
import { dispatchAnalyticsUpdated } from '@/utils/analyticsEvents'
import {
  getInventoryUiPrefs,
  updateInventoryUiPrefs,
  type InventoryUiPrefs,
} from '@/services/authService'
import { useNotificationsStore } from '@/stores/notifications'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const notificationsStore = useNotificationsStore()
const authStore = useAuthStore()
const topbarRef = ref<any>(null)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}

// Navigation items
const navItems: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'bi bi-graph-up' },
  { label: 'Inventory', route: '/inventory', icon: 'bi bi-box-seam' },
  { label: 'Meal Plan', route: '/meal-plan', icon: 'bi bi-calendar' },
  { label: 'Donation', route: '/donations', icon: 'bi bi-heart' },
  { label: 'Analytics', route: '/analytics', icon: 'bi bi-pie-chart' },
  { label: 'Settings', route: '/settings', icon: 'bi bi-gear' },
]

// ---------- Inventory Data & Logic (converted from Options API) ----------
interface InventoryItem {
  id: string
  name: string
  description: string
  volume: string
  location: string
  expiryDays: number
  isExpired: boolean
  expiryDate: string
  category: string
  foodType: string
  searchTerms: string
  quantityLevel: string
}

const inventory = ref<InventoryItem[]>([])
const currentUid = ref<string | null>(auth.currentUser?.uid ?? null)

const currentFilter = ref('all')
const currentSort = ref('name')
const filterModes = ['all', 'near-expiry', 'fridge', 'pantry', 'freezer', 'countertop']
const sortModes = ['name', 'expiry', 'category']

// --- Multi-select filter state ---
const activeLocations = ref<Set<string>>(new Set())
const activeFoodTypes = ref<Set<string>>(new Set())
const activeNearExpiry = ref(false)

const allLocations = ['fridge', 'pantry', 'freezer', 'countertop']

function toggleLocationFilter(loc: string) {
  const s = new Set(activeLocations.value)
  if (s.has(loc)) {
    s.delete(loc)
  } else {
    s.add(loc)
  }
  activeLocations.value = s
}

function toggleFoodTypeFilter(type: string) {
  const s = new Set(activeFoodTypes.value)
  if (s.has(type)) {
    s.delete(type)
  } else {
    s.add(type)
  }
  activeFoodTypes.value = s
}

function clearAllFilters() {
  activeLocations.value = new Set()
  activeFoodTypes.value = new Set()
  activeNearExpiry.value = false
  currentFilter.value = 'all'
}

const hasActiveFilters = computed(
  () => activeLocations.value.size > 0 || activeFoodTypes.value.size > 0 || activeNearExpiry.value,
)

const filtersOpen = ref(false)
const activeFilterCount = computed(() => {
  let count = 0
  if (activeNearExpiry.value) count++
  count += activeLocations.value.size
  count += activeFoodTypes.value.size
  return count
})

// Which location sections to render
const visibleLocations = computed(() =>
  activeLocations.value.size > 0 ? [...activeLocations.value] : allLocations,
)
type InventoryLayout = 'cards' | 'compact'
const inventoryLayout = ref<InventoryLayout>('cards')
const compactStorageColumns = [
  { key: 'pantry', label: 'Pantry', icon: 'bi bi-bookshelf' },
  { key: 'fridge', label: 'Fridge', icon: 'bi bi-thermometer-low' },
  { key: 'freezer', label: 'Freezer', icon: 'bi bi-snow' },
  { key: 'countertop', label: 'Countertop', icon: 'bi bi-cup-hot' },
] as const

const searchQuery = ref('')

const selectedDonationIds = ref<Set<string>>(new Set())
const mobileFilterModalOpen = ref(false)

const expandedCategories = ref({
  all: false,
  fridge: true,
  pantry: false,
  freezer: false,
  countertop: false,
  expiry: false,
})

const uiPrefsLoaded = ref(false)
let uiPrefsSaveTimer: number | undefined

function buildUiPrefsPayload(): InventoryUiPrefs {
  return {
    layout: inventoryLayout.value,
    filter: currentFilter.value,
    sort: currentSort.value,
    expanded_categories: { ...expandedCategories.value },
  }
}

function scheduleSaveUiPrefs() {
  const uid = currentUid.value
  if (!uid) return
  if (!uiPrefsLoaded.value) return

  if (uiPrefsSaveTimer) window.clearTimeout(uiPrefsSaveTimer)
  uiPrefsSaveTimer = window.setTimeout(() => {
    updateInventoryUiPrefs(uid, buildUiPrefsPayload()).catch((error) => {
      console.error('Failed to save inventory UI prefs:', error)
    })
  }, 600)
}

let unsubscribeInventory: (() => void) | null = null

function subscribeInventory(uid: string) {
  if (unsubscribeInventory) unsubscribeInventory()

  const q = query(
    collection(db, 'food'),
    where('user_id', '==', uid),
    orderBy('expiry_date', 'asc'),
  )

  unsubscribeInventory = onSnapshot(
    q,
    (snap) => {
      const raw = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
      inventory.value = raw
        .filter((r) => (r as Record<string, unknown>)['status'] === 'available')
        .map((r) => mapFoodToInventoryItem(r as FoodItem))
    },
    (error) => {
      console.error('Inventory snapshot failed:', error)
      const msg =
        (error as { code?: string; message?: string })?.message || 'Failed to load inventory.'
      notifyMessage(msg)
    },
  )
}

const addModalOpen = ref(false)
const addModalSubmitting = ref(false)
const showSuccessPopup = ref(false)
const lastAddedItemName = ref('')
const useModalOpen = ref(false)
const confirmationModalOpen = ref(false)
const currentUseItemId = ref<string | null>(null)
const confirmationItemId = ref<string | null>(null)
const confirmationAction = ref<'delete' | 'finish' | null>(null)
const selectedUseQuantity = ref('high')
const selectedStorage = ref('fridge')

const donateModalOpen = ref(false)
const isBulkDonation = ref(false)
const donatingItem = ref<InventoryItem | null>(null)
const donateForm = ref({
  title: '',
  description: '',
  quantity: 1,
  expiryDate: '',
  pickupLocation: '',
  availabilityStart: '09:00',
  availabilityEnd: '17:00',
})

const newItem = ref({
  name: '',
  description: '',
  expiryDate: '',
  category: 'fridge',
  volume: '',
  foodType: 'Other',
})

const confirmationItemName = computed(() => {
  if (!confirmationItemId.value) return 'this item'
  return inventory.value.find((item) => item.id === confirmationItemId.value)?.name || 'this item'
})

const confirmationConfig = computed(() => {
  if (confirmationAction.value === 'finish') {
    return {
      title: 'Finish Food Item',
      message: 'Are you sure you want to mark',
      confirmLabel: 'Finish Item',
    }
  }

  return {
    title: 'Delete Food Item',
    message: 'Are you sure you want to delete',
    confirmLabel: 'Delete Item',
  }
})

const foodTypeOptions = [
  'Fruits',
  'Vegetables',
  'Proteins',
  'Dairy & Eggs',
  'Bakery & Grains',
  'Dry Goods',
  'Canned goods',
  'Spices & Seasonings',
  'Frozen Foods',
  'Beverages',
  'Condiments & Snacks',
  'Meals',
  'Other',
]

const quantityWidths = { low: '25%', half: '50%', high: '75%', full: '100%' }
const quantityLabels = { low: 'Low', half: 'Half', high: 'High', full: 'Full' }

// Define the union type for quantity levels
type QuantityLevel = 'low' | 'half' | 'high' | 'full'

// Use the type in ref
const selectedQuantityLevel = ref<QuantityLevel>('full')

const qtyMap: Record<QuantityLevel, { percent: string; color: string; label: string }> = {
  low: { percent: '25%', color: '#dc2626', label: 'Low (25%)' },
  half: { percent: '50%', color: '#d97706', label: 'Half (50%)' },
  high: { percent: '75%', color: '#16a34a', label: 'High (75%)' },
  full: { percent: '100%', color: '#6b7280', label: 'Full (100%)' },
}

const FIRESTORE_WRITE_TIMEOUT_MS = 10000

function getVolumeQuantity(volume: string): number {
  const match = volume.match(/[\d.]+/)
  if (!match) return 1

  const quantity = Number(match[0])
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1
}

function getVolumeUnit(volume: string): string {
  const match = volume.match(/[\d.]+\s*([a-zA-Z]+)/)
  return match?.[1] || 'item'
}

function parseVolumeInput(volume: string): { quantity: number; unit: string } {
  const quantity = getVolumeQuantity(volume)
  const unit = getVolumeUnit(volume)
  return { quantity, unit }
}

function mapQuantityLevelFromDb(level?: string): QuantityLevel {
  if (level === 'low' || level === 'high' || level === 'full') return level
  if (level === 'medium') return 'half'
  return 'full'
}

function mapQuantityLevelToDb(level: QuantityLevel): 'low' | 'medium' | 'high' | 'full' {
  if (level === 'half') return 'medium'
  return level
}

function mapFoodToInventoryItem(item: FoodItem): InventoryItem {
  const quantity = typeof item.quantity === 'number' ? item.quantity : 1
  const unit = item.unit ? String(item.unit).trim() : 'item'
  const volume = `${quantity}${unit ? ` ${unit}` : ''}`.trim()
  const category = item.type || 'fridge'
  const rawItem = item as unknown as Record<string, unknown>
  const notes = rawItem['notes']
  const storageLocation = rawItem['storage_location']
  const expiryDate = rawItem['expiry_date']
  const foodType = rawItem['food_type']
  const locationByCategory: Record<string, string> = {
    fridge: 'Fridge',
    pantry: 'Pantry',
    freezer: 'Freezer',
    countertop: 'Countertop',
  }

  const rawExpiryDate =
    typeof expiryDate === 'string' ? expiryDate : new Date().toISOString().slice(0, 10)
  const days = calculateDaysUntil(rawExpiryDate)
  return {
    id: item.id,
    name: item.name || 'Unnamed Item',
    description: typeof notes === 'string' ? notes : '',
    volume,
    location:
      typeof storageLocation === 'string'
        ? storageLocation
        : locationByCategory[category] || 'Storage',
    expiryDays: days,
    isExpired: days < 0,
    expiryDate: rawExpiryDate,
    category,
    foodType: typeof foodType === 'string' ? foodType : 'Other',
    searchTerms: String(item.name || '').toLowerCase(),
    quantityLevel: mapQuantityLevelFromDb(item.quantity_level),
  }
}

function recordInventoryAnalytics(item: InventoryItem, kind: 'used' | 'donated') {
  addLocalAnalyticsEvent({
    kind,
    name: item.name,
    category: item.category,
    foodType: item.foodType,
    quantity: getVolumeQuantity(item.volume),
    unit: getVolumeUnit(item.volume),
  })
  dispatchAnalyticsUpdated()
}

// ---------- Computed ----------

const qtyProgress = computed(() => qtyMap[selectedQuantityLevel.value])
const mobileQuickFilters = computed(() => filterModes.slice(0, 4))
const mobileNavItems = computed(() => navItems.slice(0, 5))

const todayDate = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const newItemExpiryDays = computed(() => {
  if (!newItem.value.expiryDate) return null
  return calculateDaysUntil(newItem.value.expiryDate)
})

const newItemExpiryLabel = computed(() => {
  if (!newItem.value.expiryDate) return 'Pick a date and we will calculate the days left.'
  const daysLeft = newItemExpiryDays.value
  const readableDate = formatDisplayDate(newItem.value.expiryDate)
  if (daysLeft === null) return `Expires on ${readableDate}`
  if (daysLeft === 0) return `Expires today, ${readableDate}.`
  if (daysLeft === 1) return `1 day left until ${readableDate}.`
  return `${daysLeft} days left until ${readableDate}.`
})

const useItemName = computed(() => {
  const item = inventory.value.find((i) => i.id === currentUseItemId.value)
  return item ? item.name : ''
})

// ---------- Helper Functions ----------
function applyFilters(items: InventoryItem[]): InventoryItem[] {
  if (activeFoodTypes.value.size > 0)
    items = items.filter((i) => activeFoodTypes.value.has(i.foodType))
  if (activeNearExpiry.value) items = items.filter((i) => i.expiryDays <= 3)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    items = items.filter((i) =>
      ` ${i.name} ${i.volume} ${i.foodType} ${i.description} ${i.searchTerms || ''} `
        .toLowerCase()
        .includes(q),
    )
  }
  items.sort((a, b) => {
    if (currentSort.value === 'expiry') return a.expiryDays - b.expiryDays
    if (currentSort.value === 'category') return a.category.localeCompare(b.category)
    return a.name.localeCompare(b.name)
  })
  return items
}

function getFilteredAndSortedItems(category: string): InventoryItem[] {
  let items =
    category === 'all'
      ? [...inventory.value]
      : inventory.value.filter((i) => i.category === category)
  if (activeLocations.value.size > 0)
    items = items.filter((i) => activeLocations.value.has(i.category))
  return applyFilters(items)
}

function getLocationSectionItems(location: string): InventoryItem[] {
  return applyFilters(inventory.value.filter((i) => i.category === location))
}

function getNearExpiryItems(): InventoryItem[] {
  let items = inventory.value.filter((i) => i.expiryDays <= 3)
  if (activeLocations.value.size > 0)
    items = items.filter((i) => activeLocations.value.has(i.category))
  if (activeFoodTypes.value.size > 0)
    items = items.filter((i) => activeFoodTypes.value.has(i.foodType))
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    items = items.filter((i) => ` ${i.name} ${i.volume} ${i.foodType} `.toLowerCase().includes(q))
  }
  return items
}

function getNearExpiryCount(): number {
  return getNearExpiryItems().length
}

function getCategoryCount(category: string): number {
  if (category === 'all') return getFilteredAndSortedItems('all').length
  return getLocationSectionItems(category).length
}

function isHiddenBySearch(item: InventoryItem): boolean {
  if (!searchQuery.value) return false
  const combined = `${item.name} ${item.volume} ${item.searchTerms}`.toLowerCase()
  return !combined.includes(searchQuery.value.toLowerCase())
}

function toggleCategory(cat: keyof typeof expandedCategories.value) {
  expandedCategories.value[cat] = !expandedCategories.value[cat]
}

function openMobileFilterModal() {
  mobileFilterModalOpen.value = true
}

function closeMobileFilterModal() {
  mobileFilterModalOpen.value = false
}

function resetMobileFilters() {
  clearAllFilters()
  currentFilter.value = 'all'
  currentSort.value = 'name'
}

function navigateTo(routePath: string) {
  router.push(routePath)
}

function isRouteActive(routePath: string) {
  if (routePath === '/') return route.path === '/'
  return route.path.startsWith(routePath)
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/dashboard')
}

function escapeHtml(str: string): string {
  return str.replace(
    /[&<>]/g,
    (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m as '&' | '<' | '>'] || m,
  )
}

function openConfirmationModal(action: 'delete' | 'finish', id: string) {
  confirmationAction.value = action
  confirmationItemId.value = id
  confirmationModalOpen.value = true
}

function closeConfirmationModal() {
  confirmationModalOpen.value = false
  confirmationAction.value = null
  confirmationItemId.value = null
}

function requestDeleteItem(id: string) {
  openConfirmationModal('delete', id)
}

async function deleteItem(id: string) {
  const item = inventory.value.find((i) => i.id === id)
  try {
    // Log as wasted if the item is already expired
    if (item && item.isExpired && currentUid.value) {
      await logFoodAction(currentUid.value, {
        food_id: id,
        kind: FoodActionKind.WASTED,
        name: item.name,
        category: item.category,
        food_type: item.foodType,
        quantity: getVolumeQuantity(item.volume),
        unit: getVolumeUnit(item.volume),
        expiry_date: item.expiryDate,
        was_expired: true,
      }).catch((err) => console.error('Failed to log wasted action:', err))
    }
    await deleteFoodItem(id)
    selectedDonationIds.value.delete(id)
    notifyMessage('Item removed.')
  } catch (error) {
    console.error('Failed to delete item:', error)
    notifyMessage('Failed to remove item.')
  }
}

function openUseModal(id: string) {
  const item = inventory.value.find((i) => i.id === id)
  if (!item) return
  currentUseItemId.value = id
  selectedUseQuantity.value = item.quantityLevel || 'high'
  useModalOpen.value = true
}

function closeUseModal() {
  useModalOpen.value = false
  currentUseItemId.value = null
}

function requestFinishItem() {
  if (!currentUseItemId.value) return
  openConfirmationModal('finish', currentUseItemId.value)
}

async function finishItem() {
  if (!currentUseItemId.value) return
  const item = inventory.value.find((i) => i.id === currentUseItemId.value)
  if (!item) return
  try {
    // Log to food_actions: wasted if already expired, finished if used in time
    if (currentUid.value) {
      const kind = item.isExpired ? FoodActionKind.WASTED : FoodActionKind.FINISHED
      await logFoodAction(currentUid.value, {
        food_id: item.id,
        kind,
        name: item.name,
        category: item.category,
        food_type: item.foodType,
        quantity: getVolumeQuantity(item.volume),
        unit: getVolumeUnit(item.volume),
        expiry_date: item.expiryDate,
        was_expired: item.isExpired,
      }).catch((err) => console.error('Failed to log food action:', err))
    }
    await markFoodAsUsed(item.id)
    recordInventoryAnalytics(item, 'used')
    selectedDonationIds.value.delete(currentUseItemId.value)
    closeUseModal()
    notifyMessage(`Finished "${item.name}"`)
  } catch (error) {
    console.error('Failed to mark item as used:', error)
    notifyMessage('Failed to update item.')
  }
}

async function confirmUse() {
  if (!currentUseItemId.value) return
  const item = inventory.value.find((i) => i.id === currentUseItemId.value)
  if (!item) return
  // Optimistic local update — synchronous, so tests can assert without await
  item.quantityLevel = selectedUseQuantity.value
  try {
    await updateFoodItem(currentUseItemId.value, {
      quantity_level: mapQuantityLevelToDb(selectedUseQuantity.value as QuantityLevel),
    })
    closeUseModal()
    notifyMessage(`Updated "${item.name}" usage`)
  } catch (error) {
    console.error('Failed to update usage quantity:', error)
    notifyMessage('Failed to update usage.')
  }
}

async function confirmPendingAction() {
  const itemId = confirmationItemId.value
  const action = confirmationAction.value

  if (!itemId || !action) {
    closeConfirmationModal()
    return
  }

  closeConfirmationModal()

  if (action === 'delete') {
    await deleteItem(itemId)
    return
  }

  if (currentUseItemId.value === itemId) {
    await finishItem()
  }
}

function getInitialQuantity(volume: string): number {
  const match = volume.match(/(\d+)/)
  return match ? parseInt(match[1]!) : 1
}

function openDonateModal(item: InventoryItem) {
  donatingItem.value = item
  isBulkDonation.value = false
  donateForm.value = {
    title: item.name,
    description: item.description || `Fresh ${item.name} available.`,
    quantity: getInitialQuantity(item.volume),
    expiryDate: item.expiryDate || new Date().toISOString().slice(0, 10),
    pickupLocation: localStorage.getItem('last_pickup_location') || 'Community Hub',
    availabilityStart: '09:00',
    availabilityEnd: '17:00',
  }
  donateModalOpen.value = true
}

function openBulkDonateModal() {
  isBulkDonation.value = true
  donatingItem.value = null
  donateForm.value = {
    title: `Bulk Donation (${selectedDonationIds.value.size} items)`,
    description: '',
    quantity: 1,
    expiryDate: '',
    pickupLocation: localStorage.getItem('last_pickup_location') || 'Community Hub',
    availabilityStart: '09:00',
    availabilityEnd: '17:00',
  }
  donateModalOpen.value = true
}

function closeDonateModal() {
  donateModalOpen.value = false
  donatingItem.value = null
}

async function submitDonation() {
  const uid = auth.currentUser?.uid
  if (!uid) {
    notifyMessage('You must be logged in to donate items.')
    return
  }

  try {
    if (isBulkDonation.value) {
      // Bulk Donation
      const ids = Array.from(selectedDonationIds.value)
      const selectedItems = ids
        .map((id) => inventory.value.find((i) => i.id === id))
        .filter((item): item is InventoryItem => Boolean(item))

      await Promise.all(
        selectedItems.map((item) => {
          return createDonationListing(uid, item.id, {
            title: item.name,
            description: item.description || `Fresh ${item.name} available.`,
            quantity: getInitialQuantity(item.volume),
            expiryDate: item.expiryDate || new Date().toISOString().slice(0, 10),
            pickupLocation: donateForm.value.pickupLocation,
            availabilityStart: donateForm.value.availabilityStart,
            availabilityEnd: donateForm.value.availabilityEnd,
          })
        })
      )

      addLocalAnalyticsEvents(
        selectedItems.map((item) => ({
          kind: 'donated',
          name: item.name,
          category: item.category,
          foodType: item.foodType,
          quantity: getVolumeQuantity(item.volume),
          unit: getVolumeUnit(item.volume),
        })),
      )

      selectedDonationIds.value.clear()
      notifyMessage('Selected items published for donation! Thank you for sharing! 🤝')
    } else {
      // Single Donation
      const item = donatingItem.value
      if (!item) return

      await createDonationListing(uid, item.id, {
        title: donateForm.value.title,
        description: donateForm.value.description,
        quantity: donateForm.value.quantity,
        expiryDate: donateForm.value.expiryDate,
        pickupLocation: donateForm.value.pickupLocation,
        availabilityStart: donateForm.value.availabilityStart,
        availabilityEnd: donateForm.value.availabilityEnd,
      })

      recordInventoryAnalytics(item, 'donated')
      selectedDonationIds.value.delete(item.id)
      
      // Save last used location for convenience
      localStorage.setItem('last_pickup_location', donateForm.value.pickupLocation)

      notifyMessage(`"${donateForm.value.title}" published for donation! Thank you! 🤝`)
    }
    
    closeDonateModal()
  } catch (error) {
    console.error('Failed to submit donation:', error)
    notifyMessage('Failed to publish donation. Please check your inputs.')
  }
}

function toggleDonationSelection(id: string) {
  if (selectedDonationIds.value.has(id)) {
    selectedDonationIds.value.delete(id)
  } else {
    selectedDonationIds.value.add(id)
  }
}

function selectAllVisible() {
  getFilteredAndSortedItems('all').forEach((item) => selectedDonationIds.value.add(item.id))
}

function clearAllSelections() {
  selectedDonationIds.value.clear()
}

async function singleDonate(id: string) {
  const item = inventory.value.find((i) => i.id === id)
  if (!item) return
  openDonateModal(item)
}

async function bulkDonateAction() {
  if (selectedDonationIds.value.size === 0) return
  openBulkDonateModal()
}

function getFilterLabel(filter: string): string {
  const labels: Record<string, string> = {
    'near-expiry': 'Near Expiry',
    fridge: 'Fridge',
    pantry: 'Pantry',
    freezer: 'Freezer',
    countertop: 'Countertop',
    all: 'All',
  }
  return labels[filter] || 'All'
}

function getSortLabel(sort: string): string {
  const labels: Record<string, string> = { expiry: 'Expiry', category: 'Category', name: 'Name' }
  return labels[sort] || 'Name'
}

function isFilterActive(mode: string): boolean {
  if (mode === 'all') return !hasActiveFilters.value
  if (mode === 'near-expiry') return activeNearExpiry.value
  return activeLocations.value.has(mode)
}

function toggleMobileFilter(mode: string) {
  if (mode === 'all') {
    clearAllFilters()
    return
  }
  if (mode === 'near-expiry') {
    activeNearExpiry.value = !activeNearExpiry.value
    return
  }
  toggleLocationFilter(mode)
}

function cycleSortMode() {
  const idx = (sortModes.indexOf(currentSort.value) + 1) % sortModes.length
  currentSort.value = sortModes[idx]!
  notifyMessage(`Sort set to ${getSortLabel(currentSort.value)}.`)
}

// Watch for any open modal to lock body scroll
watch(
  () => [
    addModalOpen.value,
    useModalOpen.value,
    confirmationModalOpen.value,
    mobileFilterModalOpen.value,
    showSuccessPopup.value,
  ],
  (modalStates) => {
    const isAnyModalOpen = modalStates.some((state) => state)
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = 'var(--scrollbar-width, 0px)' // Prevent layout shift if possible
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  },
)

function calculateDaysUntil(dateString: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateString}T00:00:00`)
  target.setHours(0, 0, 0, 0)
  // Allow negative values so we can detect expired items (expiryDays < 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function formatDisplayDate(dateString: string): string {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function setQuantityLevel(level: QuantityLevel) {
  selectedQuantityLevel.value = level
}

function setInventoryLayout(layout: InventoryLayout) {
  inventoryLayout.value = layout
}

function openAddModal() {
  const future = new Date()
  future.setDate(future.getDate() + 5)
  const y = future.getFullYear()
  const m = String(future.getMonth() + 1).padStart(2, '0')
  const d = String(future.getDate()).padStart(2, '0')
  newItem.value = {
    name: '',
    description: '',
    expiryDate: `${y}-${m}-${d}`,
    category: 'fridge',
    volume: '',
    foodType: 'Other',
  }
  selectedStorage.value = 'fridge'
  selectedQuantityLevel.value = 'high'
  addModalOpen.value = true
}

function closeAddModal() {
  if (addModalSubmitting.value) return
  addModalOpen.value = false
}

function clearAddActionQuery() {
  if (route.query.action === 'add') {
    const nextQuery = { ...route.query }
    delete nextQuery.action
    void router.replace({ query: nextQuery })
  }
}

function openAddModalFromQuery() {
  openAddModal()
  clearAddActionQuery()
}

// Watch for query parameter to auto-open add modal
watch(
  () => route.query.action,
  (action) => {
    if (action === 'add') {
      openAddModalFromQuery()
    }
  },
)

// Check for query parameter on mount
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    currentUid.value = user?.uid ?? null

    if (!user) {
      inventory.value = []
      uiPrefsLoaded.value = true
      return
    }

    const uid = user.uid

    // Subscribe immediately so inventory loads even if prefs fetch is slow/fails.
    subscribeInventory(uid)

    getInventoryUiPrefs(uid)
      .then((prefs) => {
        if (!prefs) return
        inventoryLayout.value = prefs.layout ?? inventoryLayout.value
        currentFilter.value = prefs.filter ?? currentFilter.value
        currentSort.value = prefs.sort ?? currentSort.value
        if (prefs.expanded_categories && typeof prefs.expanded_categories === 'object') {
          expandedCategories.value = {
            ...expandedCategories.value,
            ...prefs.expanded_categories,
          }
        }
      })
      .catch((error) => {
        console.error('Failed to load inventory UI prefs:', error)
      })
      .finally(() => {
        uiPrefsLoaded.value = true
      })
  })

  if (route.query.action === 'add') {
    openAddModalFromQuery()
  }
})

watch(inventoryLayout, scheduleSaveUiPrefs)
watch(currentFilter, scheduleSaveUiPrefs)
watch(currentSort, scheduleSaveUiPrefs)
watch(expandedCategories, scheduleSaveUiPrefs, { deep: true })

async function confirmAdd() {
  if (addModalSubmitting.value) return

  if (!newItem.value.name) {
    notifyMessage('Please enter a name')
    return
  }
  if (!newItem.value.expiryDate) {
    notifyMessage('Please select an expiry date')
    return
  }
  if (!newItem.value.volume) {
    notifyMessage('Please enter a volume/quantity')
    return
  }

  const expiryDays = calculateDaysUntil(newItem.value.expiryDate)
  const { quantity, unit } = parseVolumeInput(newItem.value.volume)
  const itemName = newItem.value.name.trim()
  const newItemData = {
    name: itemName,
    description: newItem.value.description,
    volume: `${quantity} ${unit}`,
    location:
      selectedStorage.value === 'fridge'
        ? 'Fridge'
        : selectedStorage.value === 'freezer'
          ? 'Freezer'
          : selectedStorage.value === 'pantry'
            ? 'Pantry'
            : 'Countertop',
    expiryDays,
    category: selectedStorage.value,
    foodType: newItem.value.foodType,
    searchTerms: newItem.value.name.toLowerCase(),
    quantityLevel: selectedQuantityLevel.value,
  }
  try {
    addModalSubmitting.value = true
    const uid = currentUid.value
    if (!uid) {
      notifyMessage('Please login first')
      return
    }

    await Promise.race([
      addFoodItem(uid, {
        name: itemName,
        quantity,
        unit,
        expiryDate: newItem.value.expiryDate,
        foodType: newItem.value.foodType,
        type: selectedStorage.value as 'fridge' | 'pantry' | 'freezer' | 'countertop',
        storageLocation: newItemData.location,
        notes: newItem.value.description || null,
      }),
      new Promise<never>((_, reject) => {
        window.setTimeout(() => {
          reject(new Error('Timed out waiting for Firestore to confirm the save.'))
        }, FIRESTORE_WRITE_TIMEOUT_MS)
      }),
    ])
  } catch (error) {
    console.error('Failed to add inventory item:', error)
    const code = (error as { code?: string })?.code
    const rawMessage = (error as { message?: string })?.message || 'Failed to add item.'
    const msg =
      code === 'unavailable' || rawMessage.includes('Timed out waiting for Firestore')
        ? 'Firestore is offline right now, so the item could not be confirmed in the database. Please check your connection and try again.'
        : rawMessage
    notifyMessage(msg)
    return
  } finally {
    addModalSubmitting.value = false
  }

  closeAddModal()
  dispatchAnalyticsUpdated()
  lastAddedItemName.value = itemName
  showSuccessPopup.value = true

  // Auto-hide after 4 seconds
  setTimeout(() => {
    showSuccessPopup.value = false
  }, 4000)

  // Ensure the new item is visible after add
  const visibleUnderCurrentFilter =
    currentFilter.value === 'all' ||
    currentFilter.value === newItemData.category ||
    (currentFilter.value === 'near-expiry' && newItemData.expiryDays <= 3)

  if (!visibleUnderCurrentFilter) {
    currentFilter.value = 'all'
  }

  expandedCategories.value[selectedStorage.value as keyof typeof expandedCategories.value] = true
}

function notifyMessage(msg: string) {
  const toast = document.createElement('div')
  toast.innerText = msg
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#1f2f3e',
    color: '#fff',
    padding: '12px 28px',
    borderRadius: '60px',
    fontSize: '0.85rem',
    zIndex: '10000',
    fontWeight: '500',
  })
  document.body.appendChild(toast)
  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 400)
  }, 2400)
}

// Watch searchQuery for reactivity (already covered by computed getters)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.manage-inventory-page {
  background: #eef2f8;
  font-family: 'Inter', sans-serif;
  color: #0a1c2f;
  min-height: 100vh;
  padding: 24px 20px;
  overflow-x: clip;
}

.dashboard {
  max-width: 1760px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) clamp(232px, 18vw, 276px);
  gap: clamp(18px, 2vw, 28px);
  align-items: start;
}

.dashboard > * {
  min-width: 0;
}

.dashboard > .sidebar,
.right-sidebar {
  position: sticky;
  top: 24px;
  align-self: start;
  max-height: calc(100vh - 48px);
  z-index: 1000;
}

/* SIDEBAR */
.sidebar {
  background: white;
  border-radius: 34px;
  box-shadow: 0 18px 45px rgba(31, 47, 62, 0.06);
  padding: 34px 24px 26px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 44px;
  padding-left: 6px;
}
.logo-icon {
  background: #2c7a4d;
  width: 48px;
  height: 48px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}
.logo-text {
  font-weight: 800;
  font-size: 1.55rem;
  letter-spacing: -0.5px;
  color: #1e3a2f;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  margin: 8px 0;
  border-radius: 22px;
  font-weight: 500;
  font-size: 0.98rem;
  color: #17304f;
  cursor: pointer;
  transition: 0.2s;
}
.nav-item i {
  width: 24px;
  color: #6883a8;
}
.nav-item:hover {
  background: #f5f9ff;
}

.nav-item.active {
  background: #eef6ef;
  color: #2c6e49;
}

.nav-item.active i {
  color: #2c6e49;
}

hr {
  margin: 28px 0 0;
  border-top: 1px solid #e9edf2;
}

.main-content {
  min-width: 0;
}

.topbar-sticky-wrap {
  position: sticky;
  top: 24px;
  z-index: 60;
}

.main-content :deep(.top-bar) {
  /* legacy overrides removed to avoid conflicting with BaseTopbar */
}

.main-content :deep(.top-bar-actions) {
  /* legacy overrides removed */
}

.main-content :deep(.search-wrapper) {
  /* legacy overrides removed */
}

.top-bar {
  background: white;
  border-radius: 36px;
  padding: 18px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
}
.page-title h2 {
  font-size: 2.15rem;
  font-weight: 800;
}
.top-bar-actions {
  display: flex;
  gap: 16px;
  align-items: center;
  flex: 1;
  min-width: min(100%, 420px);
  justify-content: flex-end;
}
.search-wrapper {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 60px;
  padding: 0 18px;
  gap: 10px;
  min-width: min(100%, 360px);
  min-height: 50px;
}
.search-wrapper i {
  color: #6f89ad;
  font-size: 1.25rem;
}
.search-wrapper input {
  border: none;
  background: transparent;
  font-size: 0.95rem;
  outline: none;
  width: 100%;
  font-family: 'Inter', sans-serif;
}
.action-icons {
  display: flex;
  gap: 22px;
  font-size: 1.35rem;
  color: #5f7f9e;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
}

.layout-toggle-bar {
  width: 100%;
  display: flex;
  justify-content: center;
  margin: -14px 0 24px;
}

/* Bulk bar */
.bulk-bar {
  background: white;
  border-radius: 28px;
  padding: 14px 24px;
  margin-bottom: 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.layout-toggle {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  background: white;
  border: 1px solid #dfe8f4;
  border-radius: 36px;
  padding: 6px;
  box-shadow: 0 10px 28px rgba(31, 47, 62, 0.04);
}

.layout-toggle-btn {
  border: none;
  border-radius: 30px;
  min-height: 48px;
  padding: 0 18px;
  background: transparent;
  color: #48617c;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.layout-toggle-btn:hover {
  background: #f1f5f9;
}

.layout-toggle-btn.active {
  background: #2c7a4d;
  color: white;
  box-shadow: 0 8px 18px rgba(44, 122, 77, 0.2);
}

.layout-toggle-btn:active {
  transform: scale(0.99);
}

.compact-inventory-board {
  background: transparent;
  border: 1px solid #e2eaf5;
  border-radius: 34px;
  box-shadow: 0 16px 42px rgba(31, 47, 62, 0.04);
  display: grid;
  grid-template-columns: repeat(4, minmax(170px, 1fr));
  gap: 16px;
  padding: 18px;
  box-shadow:
    #0a2f0c1a 0px 4px 12px,
    #142f0a0d 0px 2px 4px;
}

.compact-storage-column {
  min-height: min(70vh, 650px);
  background: #fbfdff;
  border: transparent;
  border-radius: 25px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    #1018271a 0px 4px 12px,
    #1018270d 0px 2px 4px;
}

.compact-column-header {
  padding: 16px 12px 14px;
  text-align: center;
  border-bottom: 1px solid #dce7f3;
  background: white;
}

.compact-column-header h3 {
  color: #101827;
  font-size: 1.28rem;
  font-weight: 800;
  margin: 4px 0 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.compact-column-header i {
  color: #2c7a4d;
  font-size: 1rem;
}

.compact-column-count {
  color: #6b7f98;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
}

.compact-column-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  overflow-y: auto;
}

.compact-food-item {
  background: white;
  border: 1px solid #d8e2ef;
  border-left: 4px solid #7aa587;
  border-radius: 8px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
  min-height: 68px;
  box-shadow: 0 6px 12px rgba(31, 47, 62, 0.03);
  min-width: max-content;
}

.compact-food-item.urgent {
  border-left-color: #e5532d;
}

.compact-food-item.selected-for-donation {
  background: #f0f9ef;
  border-color: #2c7a4d;
  border-left-color: #2c7a4d;
}

.compact-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #2c7a4d;
  cursor: pointer;
}

.compact-food-main {
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
}

.compact-food-topline,
.compact-food-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.compact-food-name {
  color: #101827;
  font-size: 0.85rem;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-food-volume {
  color: #101827;
  font-size: 0.6rem;
  font-weight: 700;
  white-space: nowrap;
}

.compact-food-meta {
  margin-top: 6px;
  color: #6b7280;
  font-size: 0.6rem;
  font-weight: 700;
}

.compact-food-meta .urgent {
  color: #e5532d;
}

.compact-quantity {
  text-transform: lowercase;
  white-space: nowrap;
  align-self: flex-end;
}

.compact-quantity.low {
  color: #dc2626;
}

.compact-quantity.half {
  color: #d97706;
}

.compact-quantity.high {
  color: #16a34a;
}

.compact-quantity.full {
  color: #6b7280;
}

.compact-item-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.compact-action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: #eef3f8;
  color: #17304f;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
}

.compact-action-btn.donate {
  background: #e0f2e9;
  color: #2a7f49;
}

.compact-action-btn.danger {
  background: #fee2e2;
  color: #b91c1c;
}

.compact-empty {
  border: 1px dashed #ccd8e7;
  border-radius: 8px;
  color: #7b8da4;
  font-size: 0.86rem;
  font-weight: 700;
  padding: 16px 10px;
  text-align: center;
}

/* Bulk bar */
.bulk-bar {
  background: white;
  border-radius: 28px;
  padding: 14px 24px;
  margin-bottom: 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}
.bulk-select-controls {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}
.select-all-btn,
.clear-selection-btn,
.right-btn {
  background: #f3f6fb;
  border: none;
  padding: 12px 16px;
  border-radius: 40px;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: flex-start;
  color: #2c3e4e;
}
.donate-bulk-btn {
  background: #2c7a4d;
  color: white;
  border: none;
  width: 100%;
  justify-content: center;
  padding: 14px 24px;
  border-radius: 40px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.donate-bulk-btn:disabled {
  background: #b9d2c4;
  cursor: not-allowed;
  opacity: 0.6;
}
.selection-count {
  background: transparent;
  padding: 8px 16px;
  border-radius: 40px;
  outline: #2a7f49 1px solid;
  font-size: 0.82rem;
  font-weight: 600;
  align-self: flex-start;

  padding: 12px 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;
}
.search-results-info {
  font-size: 0.75rem;
  color: #5f7f9e;
  min-height: 18px;
}

/* EXPANDABLE CATEGORY STYLES (unified) */
.storage-category {
  background: white;
  border-radius: 34px;
  margin-bottom: 30px;
  overflow: hidden;
  border: 1px solid #e8eef7;
  box-shadow: 0 16px 42px rgba(31, 47, 62, 0.04);
}
.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 30px;
  gap: 18px;
  cursor: pointer;
  background: white;
  transition: background 0.2s;
}
.category-header:hover {
  background: #fafdff;
}
.cat-title {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  min-width: 0;
}
.cat-title i {
  font-size: 1.85rem;
  color: #3d7d54;
}
.cat-title h2 {
  font-size: 1.35rem;
  font-weight: 800;
}
.cat-badge {
  background: #edf3ff;
  border-radius: 40px;
  padding: 7px 14px;
  font-size: 0.88rem;
  font-weight: 600;
}
.expand-cat-icon {
  font-size: 1.45rem;
  color: #6b8cae;
  transition: transform 0.3s;
}
.category-items {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition:
    max-height 0.45s cubic-bezier(0.2, 0.9, 0.4, 1.1),
    opacity 0.35s ease;
  background: #fefefe;
  border-top: 1px solid transparent;
}
.storage-category.expanded .category-items {
  max-height: 1800px;
  opacity: 1;
  padding: 12px 28px 28px;
  border-top-color: #eef2fa;
}
.storage-category.expanded .expand-cat-icon {
  transform: rotate(180deg);
}
.food-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 24px;
  margin-top: 10px;
}
.food-item-card {
  background: white;
  border-radius: 28px;
  box-shadow: 0 10px 24px rgba(31, 47, 62, 0.04);
  border: 1px solid #e7edf6;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.food-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 28px rgba(31, 47, 62, 0.07);
}
.food-item-card.selected-for-donation {
  background: #f0f9ef;
  border: 2px solid #2c7a4d;
  box-shadow: 0 6px 14px rgba(44, 122, 77, 0.1);
}
.food-item-card.hidden-by-search {
  display: none;
}
.checkbox-overlay {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1;
}

.donation-checkbox {
  width: 28px;
  height: 28px;
  cursor: pointer;
  accent-color: #2c7a4d;
}

/* NEW CARD STYLES */
.card-header {
  position: relative;
  padding: 24px 128px 16px 20px;
  border-bottom: 1px solid #f0f4f9;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
}

.card-title-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  min-height: calc(2 * 1.3em);
  min-width: 0;
}

.food-title {
  font-size: 1.19rem;
  font-weight: 800;
  margin: 0;
  color: #0a1c2f;
  line-height: 1.3;
  word-break: break-word;
  overflow-wrap: anywhere;
  min-width: 350px;
}

#fridgeGrid .food-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.expiry-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #48617c;
  width: auto;
  max-width: 100%;
}

.expiry-badge.urgent {
  color: #c2591e;
  background: #fff1e8;
  padding: 4px 10px;
  border-radius: 20px;
}

.expiry-badge.expired {
  color: #991b1b;
  background: #fee2e2;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 700;
}

.card-badges {
  position: absolute;
  top: 24px;
  right: 20px;
  display: flex;
  justify-content: flex-end;
  max-width: calc(100% - 40px);
  min-width: 0;
}

.volume-badge {
  background: #f1f5fa;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.68rem;
  font-weight: 600;
  white-space: normal;
  text-align: center;
  color: #48617c;
  overflow-wrap: anywhere;
}

.food-description {
  height: 60px;
  padding: 0 20px;
  font-size: 0.9rem;
  color: #577190;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  min-height: 42px;
  overflow-wrap: anywhere;
}

.card-meta {
  padding: 12px 20px;
}

.storage-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.55rem;
  font-weight: 600;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.storage-tag {
  background: #e6f3eb;
  color: #1f5a38;
  text-transform: capitalize;
}

.type-tag {
  background: #f0e6ff;
  color: #5a2a7f;
}

.quantity-section {
  padding: 12px 20px;
}

.quantity-level-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #16a34a;
  text-transform: uppercase;
  display: block;
  margin-bottom: 8px;
}

.food-preview {
  padding: 20px 20px 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.food-name {
  font-weight: 800;
  font-size: 1.12rem;
  line-height: 1.2;
  padding-right: 42px;
}

.food-volume {
  background: #f1f5fa;
  border-radius: 60px;
  padding: 5px 14px;
  font-size: 0.84rem;
  font-weight: 600;
  white-space: nowrap;
}
.food-details-mini {
  display: flex;
  gap: 12px;
  padding: 0 20px 12px;
  font-size: 0.9rem;
  color: #577190;
  flex-wrap: wrap;
}
.food-extra-actions {
  display: flex;
  gap: 12px;
  padding: 14px 20px 20px;
  border-top: 1px solid #eff3f8;
  margin-top: auto;
  flex-wrap: wrap;
  justify-content: center;
}
.mini-btn {
  background: #f3f6fb;
  border: none;
  border-radius: 40px;
  padding: 9px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  flex: 1 1 0;
  justify-content: center;
  min-width: 0;
  text-align: center;
}
.delete-item {
  color: #111827;
}
.use-item {
  color: #173b67;
}
.donate-mini {
  background: #e0f2e9;
  color: #2a7f49;
}
.expiry-warning {
  background: #fff0e0;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #c2591e;
}
.stat-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin: 20px 0 16px;
}
.stat-card {
  flex: 1;
  background: white;
  border-radius: 28px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.quick-add {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.plus-icon {
  background: #eef2fa;
  border-radius: 60px;
  padding: 10px 22px;
  font-weight: 500;
  display: inline-flex;
  gap: 8px;
  cursor: pointer;
}
footer {
  text-align: center;
  margin-top: 48px;
  font-size: 0.7rem;
  color: #6c86a3;
}
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
  z-index: 1;
}

.right-box {
  background: white;
  border-radius: 28px;
  padding: 18px;
  box-shadow: 0 16px 42px rgba(31, 47, 62, 0.05);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.right-btn {
  background: #f3f6fb;
  border: none;
  padding: 13px 16px;
  border-radius: 40px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
  width: 100%;
  justify-content: flex-start;
}

.right-btn:hover {
  background: #e2e8f0;
}

.right-primary {
  background: #2c7a4d;
  color: white;
}

.floating-add {
  background: #2f6f18;
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.4rem;
  border-radius: 28px;
  cursor: pointer;
  color: #f3f3f3;
  font-weight: bold;
  box-shadow: 0 18px 45px rgba(31, 47, 62, 0.08);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.floating-add:hover {
  background: #255a13; /* Darkens the green slightly */
  box-shadow: 0 12px 35px rgba(31, 47, 62, 0.12); /* Pulls the shadow in slightly tighter */
}

.floating-add:active {
  background: #255a13; /* Darker green on press */
  transform: translateY(2px) scale(0.98); /* Pushes down and shrinks slightly */
  box-shadow: 0 8px 20px rgba(31, 47, 62, 0.05); /* Flattens the shadow */
  transition: all 0.1s ease; /* Faster transition for the click action */
}

/* usage progress bar */
.usage-bar {
  width: 100%;
  height: 12px;
  background: #e6edf5;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 10px;
  margin-bottom: 6px;
}
.usage-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}
.usage-fill.low {
  background: #ef4444;
}
.usage-fill.half {
  background: #eab308;
}
.usage-fill.high {
  background: #22c55e;
}
.usage-fill.full {
  background: #8b8b8b;
}

.quantity-label {
  font-size: 0.88rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-top: 0px;
  display: inline-block;
  padding: 5px 14px;
  border-radius: 999px;
  margin-left: 20px;
  margin-bottom: 10px;
}

.quantity-label.low {
  background: #fee2e2;
  color: #dc2626;
}
.quantity-label.half {
  background: #fef3c7;
  color: #d97706;
}
.quantity-label.high {
  background: #dcfce7;
  color: #16a34a;
}
.quantity-label.full {
  background: #f3f4f6;
  color: #6b7280;
}

.quantity-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 20px 0;
}

.qty-option {
  padding: 14px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  cursor: pointer;
  font-weight: 600;
  text-align: center;
  transition: all 0.2s;
  background: white;
  font-size: 0.95rem;
}

.qty-option:hover {
  border-color: #d1d5db;
  transform: translateY(-2px);
}

.qty-option.low {
  border-color: #fca5a5;
  color: #dc2626;
}
.qty-option.low:hover {
  background: #fee2e2;
}
.qty-option.half {
  border-color: #fde047;
  color: #d97706;
}
.qty-option.half:hover {
  background: #fef3c7;
}
.qty-option.high {
  border-color: #86efac;
  color: #16a34a;
}
.qty-option.high:hover {
  background: #dcfce7;
}
.qty-option.full {
  border-color: #d1d5db;
  color: #6b7280;
}
.qty-option.full:hover {
  background: #f3f4f6;
}

.qty-option.selected {
  border-width: 2px;
  transform: scale(1.05);
}

.qty-option.low.selected {
  border-color: #dc2626;
  background: #fee2e2;
}
.qty-option.half.selected {
  border-color: #d97706;
  background: #fef3c7;
}
.qty-option.high.selected {
  border-color: #16a34a;
  background: #dcfce7;
}
.qty-option.full.selected {
  border-color: #6b7280;
  background: #f3f4f6;
}

/* MODAL */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 28, 47, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
  overflow-y: auto;
}

.modal-box {
  background: white;
  border-radius: 28px;
  padding: 30px 32px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: auto;
}

.modal-box h2 {
  text-align: center;
  font-weight: 800;
  margin-bottom: 6px;
  font-size: 1.75rem;
}

.modal-box input,
.modal-box select {
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  font-family: 'Inter';
  outline: none;
  font-size: 0.9rem;
  min-height: 44px;
}

.modal-box input:focus,
.modal-box select:focus {
  border-color: #2c7a4d;
  box-shadow: 0 0 0 3px rgba(44, 122, 77, 0.12);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e4e;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  outline: none;
  min-height: 44px;
  transition: all 0.2s;
}

.form-input:focus {
  border-color: #2c7a4d;
  box-shadow: 0 0 0 3px rgba(44, 122, 77, 0.12);
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  outline: none;
  resize: vertical;
  transition: all 0.2s;
}

.form-textarea:focus {
  border-color: #2c7a4d;
  box-shadow: 0 0 0 3px rgba(44, 122, 77, 0.12);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-row.expiry-row {
  grid-template-columns: minmax(0, 2.5fr) minmax(180px, 1fr);
  align-items: end;
}

.expiry-summary {
  min-height: 78px;
  padding: 16px 18px;
  background: #f4fbf5;
  border-radius: 18px;
  color: #1f4d25;
  font-size: 0.92rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.char-count {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.field-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e4e;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-input {
  color: #15314f;
  background: #fff;
  border-radius: 18px;
}

.date-input.has-date {
  border-color: #b8ddc7;
  background: #f8fff9;
}

.date-input::-webkit-calendar-picker-indicator {
  background: #e8f0ff;
  border-radius: 10px;
  padding: 6px;
  cursor: pointer;
}

.expiry-preview {
  min-height: 42px;
  padding: 10px 14px;
  border-radius: 14px;
  background: #f3f7fc;
  color: #48617c;
  font-size: 0.82rem;
  font-weight: 500;
  line-height: 1.35;
}

.expiry-preview.empty {
  background: #f8fafc;
  color: #7b8da4;
}

.expiry-preview.urgent {
  background: #fff1e8;
  color: #c2591e;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.row2 {
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.row3 {
  padding-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
  width: 100%;
}

.row2 > *,
.row3 > *,
.row5 > * {
  min-width: 0;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.row5 {
  padding-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 300px;
  width: 100%;
}

.row > * {
  min-width: 0;
}

.row input[type='text'] {
  grid-column: span 2;
}

.storage-select {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 10px;
}

.storage-btn {
  padding: 14px 12px;
  border-radius: 18px;
  border: 1px solid transparent;
  background: #f8fafc;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  min-height: 52px;
  transition: all 0.2s ease;
  white-space: normal;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.storage-btn:hover {
  background: #e2e8f0;
}

.storage-btn.active {
  background: #2c7a4d;
  color: white;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.modal-cancel {
  background: #eef2f8;
  border: none;
  padding: 12px 24px;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 500;
  flex: 1;
  min-height: 44px;
  transition: all 0.2s;
}

.modal-cancel:hover {
  background: #e0e7f1;
}

.modal-cancel:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.modal-add {
  background: #2c7a4d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  flex: 1;
  min-height: 44px;
  transition: all 0.2s;
}

.modal-add:hover {
  background: #1f5a38;
}

.modal-add:disabled {
  opacity: 0.75;
  cursor: wait;
}

.confirmation-overlay {
  z-index: 10001;
}

.confirmation-modal {
  max-width: 440px;
}

.confirmation-copy {
  margin: 0;
  text-align: center;
  color: #48617c;
  font-size: 0.95rem;
  line-height: 1.5;
}

.confirmation-copy strong {
  color: #15314f;
}

.modal-danger {
  background: #b91c1c;
}

.modal-danger:hover {
  background: #991b1b;
}

.qty-progress-wrapper {
  margin-bottom: 14px;
}

.qty-progress-bar {
  width: 100%;
  height: 10px;
  background: #e5e7eb;
  border-radius: 20px;
  overflow: hidden;
}

.qty-progress-fill {
  height: 100%;
  width: 25%;
  background: #dc2626;
  border-radius: 20px;
  transition: all 0.25s ease;
}

.qty-progress-label {
  margin-top: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
}

.usage-bar,
.quantity-label {
  margin-left: 20px;
}

.usage-bar {
  width: calc(100% - 40px);
  margin-left: 20px;
  margin-right: 20px;
  min-width: 0;
}

.mobile-top-shell,
.mobile-bottom-nav,
.mobile-floating-add {
  display: none;
}

.desktop-topbar {
  display: block !important;
}

.mobile-top-shell {
  background: linear-gradient(180deg, #ffffff 0%, #f7faf7 100%);
  border: 1px solid #e3ebdf;
  border-radius: 28px;
  padding: 18px;
  margin-bottom: 18px;
  box-shadow: 0 18px 32px rgba(31, 47, 62, 0.05);
}

.mobile-header-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.mobile-header-row h1 {
  font-size: 1.9rem;
  font-weight: 800;
  color: #0a1c2f;
}

.mobile-back-btn,
.mobile-icon-btn,
.mobile-filter-trigger,
.mobile-filter-close {
  border: none;
  background: #f2f5f0;
  color: #173b2d;
  border-radius: 16px;
  cursor: pointer;
}

.mobile-back-btn,
.mobile-filter-close {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex: 0 0 46px;
}

.mobile-search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  margin-bottom: 14px;
}

.mobile-search-shell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  border-radius: 18px;
  border: 1px solid #e4e9ef;
  background: #fbfcff;
  padding: 0 16px;
}

.mobile-search-shell i {
  color: #6b7e93;
}

.mobile-search-shell input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
}

.mobile-icon-btn {
  min-height: 52px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.mobile-chip-row {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.mobile-chip-row::-webkit-scrollbar {
  display: none;
}

.mobile-quick-chip,
.mobile-filter-chip {
  border: 1px solid #dce4de;
  background: #ffffff;
  color: #48617c;
  border-radius: 999px;
  padding: 10px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-quick-chip.active,
.mobile-filter-chip.active {
  background: #2c7a4d;
  border-color: #2c7a4d;
  color: #ffffff;
}

.mobile-filter-trigger {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 44px;
}

.mobile-filter-overlay {
  align-items: flex-end;
}

.mobile-filter-box {
  max-width: 620px;
  border-radius: 28px 28px 0 0;
  padding-bottom: 24px;
}

.mobile-filter-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.mobile-filter-header p {
  margin-top: 4px;
  color: #6b7e93;
  font-size: 0.92rem;
}

.mobile-filter-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-filter-label {
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #48617c;
  letter-spacing: 0.04em;
}

.mobile-filter-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.sort-grid .mobile-filter-chip {
  min-width: 96px;
  text-align: center;
}

.mobile-filter-actions {
  display: flex;
  gap: 12px;
}

.mobile-bottom-nav {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 40;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #deebe2;
  border-radius: 24px;
  box-shadow: 0 16px 44px rgba(31, 47, 62, 0.12);
  padding: 8px 10px;
  backdrop-filter: blur(16px);
}

.mobile-nav-item {
  border: none;
  background: transparent;
  color: #6b7e93;
  min-height: 58px;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
}

.mobile-nav-item i {
  font-size: 1.35rem;
}

.mobile-nav-item.active {
  color: #2c7a4d;
  background: #eef7f1;
}

.mobile-floating-add {
  position: fixed;
  right: 18px;
  bottom: 104px;
  z-index: 41;
  width: 68px;
  height: 68px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(180deg, #3b8856 0%, #2c7a4d 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 18px 38px rgba(44, 122, 77, 0.28);
  cursor: pointer;
  font-size: 1.4rem;
  display: none;
}

/* Mobile Bulk Action Bar */
.mobile-bulk-action-bar {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 78px;
  z-index: 39;
  background: white;
  border: 1px solid #e3ebdf;
  border-radius: 20px;
  padding: 12px 14px;
  box-shadow: 0 12px 32px rgba(31, 47, 62, 0.1);
  display: none;
  gap: 12px;
}

.mobile-bulk-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.mobile-bulk-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.bulk-selection-count {
  background: #eef7f1;
  color: #2c7a4d;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 18px;
  white-space: nowrap;
}

.mobile-bulk-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.bulk-action-btn {
  border: none;
  border-radius: 16px;
  padding: 10px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.bulk-action-btn i {
  font-size: 1rem;
}

.bulk-action-btn.select-all-btn {
  background: #f2f5f0;
  color: #173b2d;
}

.bulk-action-btn.select-all-btn:active {
  background: #e2e8f0;
  transform: scale(0.95);
}

.bulk-action-btn.clear-btn {
  background: #f2f5f0;
  color: #6b7e93;
  padding: 10px;
  font-size: 0.9rem;
  min-width: auto;
}

.bulk-action-btn.clear-btn:active {
  background: #e2e8f0;
  transform: scale(0.95);
}

.bulk-action-btn.donate-btn {
  background: #2c7a4d;
  color: white;
  flex-grow: 1;
  justify-content: center;
}

.bulk-action-btn.donate-btn:active {
  background: #1f5a38;
  transform: scale(0.98);
}

@media (max-width: 1320px) {
  .dashboard {
    grid-template-columns: clamp(190px, 20vw, 240px) minmax(0, 1fr);
  }

  .right-sidebar {
    grid-column: 1 / -1;
    position: sticky;
    top: 24px;
    align-self: start;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    align-items: start;
  }

  .food-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
    gap: 20px;
  }

  .compact-inventory-board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.notif-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(10, 28, 47, 0.35);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 80px 48px 0 0;
}

.notif-popup {
  background: #ffffff;
  border-radius: 20px;
  width: 360px;
  box-shadow: 0 20px 60px rgba(10, 28, 47, 0.18);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.notif-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #edf2f7;
}

.notif-popup-title {
  font-weight: 700;
  font-size: 0.95rem;
  color: #0a1c2f;
}

.mark-read-btn {
  background: none;
  border: none;
  font-size: 0.8rem;
  font-weight: 600;
  color: #2c7a4d;
  cursor: pointer;
}

.mark-read-btn:hover {
  text-decoration: underline;
}

.notif-popup-list {
  max-height: 340px;
  overflow-y: auto;
  padding: 8px 0;
}

.notif-popup-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
  transition: background 0.15s;
}

.notif-popup-item:hover {
  background: #f8fafc;
}

.notif-popup-item.unread {
  background: #f0f7ff;
}

.notif-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e8f5e9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
  border: 1.5px solid #c8e6c9;
}

.notif-item-body {
  flex: 1;
  min-width: 0;
}

.notif-item-title {
  font-weight: 600;
  font-size: 0.88rem;
  color: #0a1c2f;
  margin-bottom: 2px;
}

.notif-item-detail {
  font-size: 0.78rem;
  color: #577190;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-item-date {
  font-size: 0.72rem;
  color: #9aafc4;
}

.notif-unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2c7a4d;
  flex-shrink: 0;
  margin-top: 4px;
}

.notif-empty {
  padding: 24px;
  text-align: center;
  color: #9aafc4;
  font-size: 0.88rem;
}

.notif-view-all-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-top: 1px solid #edf2f7;
  background: #ffffff;
  font-size: 0.88rem;
  font-weight: 600;
  color: #2c7a4d;
  cursor: pointer;
  text-align: center;
  transition: background 0.15s;
}

.notif-view-all-btn:hover {
  background: #f0fdf4;
}

/* Blur the dashboard content when popup is open */
.dashboard.blurred {
  filter: blur(2px);
  pointer-events: none;
  user-select: none;
}

/* Responsive */
@media (max-width: 1120px) {
  .dashboard {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .manage-inventory-page {
    padding-bottom: 160px;
  }

  .desktop-topbar {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  .mobile-top-shell,
  .mobile-bottom-nav,
  .mobile-floating-add {
    display: block;
  }

  .mobile-bottom-nav {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .right-sidebar {
    display: none;
  }

  .layout-toggle-bar {
    justify-content: stretch;
    margin: 0 0 18px;
  }

  .layout-toggle {
    width: 100%;
  }
}

@media (max-width: 920px) {
  .sidebar,
  .right-sidebar {
    position: sticky;
    top: 24px;
    align-self: start;
    z-index: 1;
  }

  .sidebar {
    padding: 22px 18px;
  }

  .logo-area {
    margin-bottom: 24px;
  }

  .top-bar {
    border-radius: 28px;
  }

  .main-content :deep(.top-bar) {
    border-radius: 28px;
  }

  .top-bar-actions {
    width: 100%;
  }

  .main-content :deep(.top-bar-actions) {
    width: 100%;
  }

  .food-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
    gap: 18px;
  }

  .right-sidebar {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .modal-box {
    max-width: 90vw;
  }
}

@media (max-width: 780px) {
  .manage-inventory-page {
    padding: 14px 14px 112px;
  }

  .modal-overlay {
    padding: 14px;
  }

  .modal-box {
    padding: 24px;
    border-radius: 24px;
  }

  .modal-box h2 {
    font-size: 1.25rem;
  }

  .modal-box input,
  .modal-box select,
  .modal-box textarea {
    padding: 11px 14px;
    font-size: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .card-header {
    padding: 18px 112px 12px 16px;
    flex-direction: column;
    gap: 12px;
  }

  .card-title-section {
    justify-content: center;
    gap: 0.5rem;
    min-height: calc(2 * 1.3em);
    width: 100%;
  }

  .food-title {
    font-size: 1.1rem;
  }

  .food-description {
    padding: 0 16px;
    font-size: 0.85rem;
    min-height: 36px;
  }

  .card-meta {
    padding: 10px 16px;
  }

  .quantity-section {
    padding: 10px 16px;
  }

  .food-extra-actions {
    padding: 12px 16px 16px;
  }

  .dashboard {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .mobile-top-shell {
    border-radius: 24px;
    padding: 16px;
  }

  .mobile-header-row h1 {
    font-size: 1.6rem;
  }

  .mobile-search-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .mobile-icon-btn {
    width: 100%;
    justify-content: center;
  }

  .mobile-bottom-nav {
    left: 10px;
    right: 10px;
    bottom: 10px;
    border-radius: 22px;
  }

  .mobile-floating-add {
    right: 16px;
    bottom: 96px;
    width: 64px;
    height: 64px;
  }

  .food-grid {
    grid-template-columns: 1fr;
  }

  .compact-inventory-board {
    padding: 14px;
    gap: 12px;
  }

  .category-header {
    padding: 18px 20px;
    align-items: flex-start;
  }

  .storage-category.expanded .category-items {
    padding: 10px 14px 18px;
  }

  .cat-title {
    gap: 10px;
  }

  .cat-title h2 {
    font-size: 1.15rem;
  }

  .cat-badge {
    padding: 6px 12px;
    font-size: 0.78rem;
  }

  .food-item-card {
    border-radius: 22px;
  }

  .checkbox-overlay {
    top: 18px;
    right: 18px;
  }

  .donation-checkbox {
    width: 24px;
    height: 24px;
  }

  .usage-bar {
    width: calc(100% - 32px);
    margin-left: 16px;
    margin-right: 16px;
  }

  .quantity-label {
    margin-left: 16px;
    font-size: 0.8rem;
  }

  .mini-btn {
    flex: 1 1 calc(50% - 10px);
    justify-content: center;
  }

  .floating-add {
    min-height: 76px;
    font-size: 2rem;
    border-radius: 22px;
  }
}

@media (max-width: 560px) {
  .manage-inventory-page {
    padding: 12px 12px 108px;
  }

  .modal-overlay {
    padding: 12px;
  }

  .modal-box {
    padding: 20px;
    border-radius: 22px;
    gap: 12px;
  }

  .modal-box h2 {
    font-size: 1.15rem;
    margin-bottom: 8px;
  }

  .form-section {
    gap: 6px;
  }

  .modal-box input,
  .modal-box select,
  .modal-box textarea {
    padding: 11px 14px;
    font-size: 16px;
    min-height: 44px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .form-label {
    font-size: 0.85rem;
  }

  .storage-select {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-top: 8px;
  }

  .storage-btn {
    padding: 10px 8px;
    font-size: 0.8rem;
    min-height: 42px;
  }

  .quantity-selector {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin: 16px 0;
  }

  .qty-option {
    padding: 12px 10px;
    font-size: 0.9rem;
  }

  .modal-actions {
    gap: 10px;
    margin-top: 12px;
  }

  .mobile-top-shell {
    padding: 14px;
    border-radius: 22px;
    margin-bottom: 14px;
  }

  .mobile-header-row {
    gap: 10px;
    margin-bottom: 12px;
  }

  .mobile-header-row h1 {
    font-size: 1.38rem;
  }

  .mobile-back-btn,
  .mobile-filter-close {
    width: 42px;
    height: 42px;
    flex-basis: 42px;
  }

  .mobile-search-shell {
    min-height: 48px;
    padding: 0 14px;
  }

  .mobile-icon-btn {
    min-height: 46px;
    font-size: 0.82rem;
  }

  .mobile-quick-chip,
  .mobile-filter-chip {
    padding: 9px 12px;
    font-size: 0.78rem;
  }

  .mobile-filter-box {
    border-radius: 24px 24px 0 0;
    padding: 18px 18px 20px;
  }

  .mobile-filter-header p {
    font-size: 0.84rem;
  }

  .mobile-filter-actions {
    flex-direction: column;
  }

  .mobile-bottom-nav {
    padding: 8px;
  }

  .mobile-nav-item {
    min-height: 54px;
    font-size: 0.66rem;
  }

  .mobile-nav-item i {
    font-size: 1.2rem;
  }

  .mobile-floating-add {
    width: 60px;
    height: 60px;
    bottom: 92px;
  }

  .modal-cancel,
  .modal-add {
    padding: 11px 16px;
    border-radius: 35px;
    font-size: 0.95rem;
    min-height: 42px;
  }

  .card-header {
    padding: 16px 96px 10px 14px;
  }

  .card-badges {
    top: 16px;
    right: 14px;
    max-width: calc(100% - 28px);
  }

  .food-title {
    font-size: 1rem;
  }

  .expiry-badge {
    font-size: 0.8rem;
  }

  .volume-badge {
    font-size: 0.8rem;
    padding: 5px 10px;
  }

  .food-description {
    padding: 0 14px;
    font-size: 0.8rem;
    min-height: 32px;
  }

  .card-meta {
    padding: 8px 14px;
  }

  .tag {
    padding: 5px 10px;
    font-size: 0.75rem;
  }

  .quantity-section {
    padding: 8px 14px;
  }

  .quantity-level-label {
    font-size: 0.75rem;
    margin-bottom: 6px;
  }

  .usage-bar {
    height: 10px;
  }

  .food-extra-actions {
    padding: 12px 14px 14px;
    gap: 8px;
  }

  .mini-btn {
    flex: 1;
    padding: 8px 10px;
    font-size: 0.8rem;
  }

  .top-bar {
    padding: 14px;
    gap: 12px;
  }

  .page-title h2 {
    font-size: 1.45rem;
  }

  .main-content :deep(.page-title h2) {
    font-size: 1.45rem;
  }

  .top-bar-actions {
    flex-wrap: wrap;
  }

  .action-icons {
    margin-left: auto;
  }

  .compact-inventory-board {
    grid-template-columns: 1fr;
  }

  .compact-storage-column {
    min-height: 360px;
  }

  .category-header {
    padding: 16px;
  }

  .cat-title i {
    font-size: 1.45rem;
  }

  .expand-cat-icon {
    font-size: 1.2rem;
  }

  .checkbox-overlay {
    top: 14px;
    right: 14px;
  }

  .donation-checkbox {
    width: 22px;
    height: 22px;
  }

  .right-sidebar {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

.filters-dropdown-wrap {
  position: relative;
  z-index: 2000;
}

.filter-dropdown-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: white;
  border: 2px solid #f1f3f6;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  color: #1e3a2f;
}

.filter-dropdown-trigger:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.filter-dropdown-trigger.active {
  background: #f0fdf4;
  border-color: #86efac;
  color: #166534;
}

.trigger-left {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  font-size: 0.95rem;
}

.filter-count-badge {
  background: #166534;
  color: white;
  font-size: 0.7rem;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.filter-dropdown-menu {
  position: absolute;
  top: 0;
  right: calc(100% + 20px);
  width: 320px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 28px;
  box-shadow:
    -20px 20px 60px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.02);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 99999;
}

/* Arrow indicator */
.filter-dropdown-menu::after {
  content: '';
  position: absolute;
  top: 20px;
  right: -10px;
  width: 20px;
  height: 20px;
  background: white;
  transform: rotate(45deg);
  border-right: 1px solid rgba(255, 255, 255, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.6);
  z-index: -1;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}

.filter-panel-title {
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.filter-clear-btn {
  font-size: 0.72rem;
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;
  font-weight: 600;
}
.filter-clear-btn:hover {
  background: #fef2f2;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}

.filter-chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1.5px solid #f1f5f9;
  background: #f8fafc;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.filter-chip:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
  color: #1e293b;
  transform: translateY(-1px);
}

.filter-chip.active {
  background: #ecfdf5;
  border-color: #10b981;
  color: #065f46;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}

/* Success Popup Premium Styles */
.success-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 28, 47, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.success-popup-card {
  background: white;
  padding: 40px;
  border-radius: 40px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.success-icon-wrap {
  position: relative;
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.checkmark-circle {
  width: 80px;
  height: 80px;
  background: #2c7a4d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 40px;
  animation: pop-bounce 0.6s cubic-bezier(0.17, 0.67, 0.83, 1.5);
}

.success-text h3 {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 12px;
  color: #0a1c2f;
}

.success-text p {
  color: #5f7f9e;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 30px;
}

.success-close-btn {
  background: #2c7a4d;
  color: white;
  border: none;
  padding: 14px 40px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.success-close-btn:hover {
  background: #215d3a;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(44, 122, 77, 0.2);
}

/* Animations */
@keyframes pop-bounce {
  0% {
    transform: scale(0);
  }
  80% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.premium-popup-enter-active,
.premium-popup-leave-active {
  transition: opacity 0.5s ease;
}

.premium-popup-enter-active .success-popup-card,
.premium-popup-leave-active .success-popup-card {
  transition: transform 0.5s cubic-bezier(0.2, 1, 0.3, 1);
}

.premium-popup-enter-from,
.premium-popup-leave-to {
  opacity: 0;
}

.premium-popup-enter-from .success-popup-card,
.premium-popup-leave-to .success-popup-card {
  transform: scale(0.9) translateY(20px);
}

/* Modal Animations */
.premium-modal-enter-active,
.premium-modal-leave-active {
  transition: opacity 0.4s ease;
}

.premium-modal-enter-active .modal-box,
.premium-modal-leave-active .modal-box {
  transition: transform 0.5s cubic-bezier(0.2, 1, 0.3, 1);
}

.premium-modal-enter-from,
.premium-modal-leave-to {
  opacity: 0;
}

.premium-modal-enter-from .modal-box,
.premium-modal-leave-to .modal-box {
  transform: scale(0.9) translateY(30px);
}

/* Confetti mini-effect */
.confetti-piece {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  opacity: 0;
}

.checkmark-circle ~ .confetti-piece {
  animation: confetti-burst 0.8s ease-out forwards;
}

@keyframes confetti-burst {
  0% {
    transform: translate(0, 0);
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) rotate(var(--tr));
    opacity: 0;
  }
}

.confetti-piece:nth-child(2) {
  --tx: -40px;
  --ty: -40px;
  --tr: 45deg;
  background: #2c7a4d;
  left: 50%;
  top: 50%;
}
.confetti-piece:nth-child(3) {
  --tx: 40px;
  --ty: -30px;
  --tr: -30deg;
  background: #4ade80;
  left: 50%;
  top: 50%;
}
.confetti-piece:nth-child(4) {
  --tx: -30px;
  --ty: 40px;
  --tr: 120deg;
  background: #22c55e;
  left: 50%;
  top: 50%;
}
.confetti-piece:nth-child(5) {
  --tx: 50px;
  --ty: 20px;
  --tr: 80deg;
  background: #166534;
  left: 50%;
  top: 50%;
}
.confetti-piece:nth-child(6) {
  --tx: 0px;
  --ty: -60px;
  --tr: 10deg;
  background: #2c7a4d;
  left: 50%;
  top: 50%;
}

/* Mobile top navigation action additions */
.mobile-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.mobile-header-actions {
  display: flex;
  align-items: center;
  gap: 18px;
  font-size: 1.35rem;
  color: #5f7f9e;
}

.mobile-header-actions i.clickable {
  cursor: pointer;
  transition: color 0.2s ease;
}

.mobile-header-actions i.clickable:hover {
  color: #2c7a4d;
}

.notif-bell-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.notif-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  transform: translate(50%, -50%);
  background: linear-gradient(135deg, #ff4d4d, #e60000);
  color: white;
  font-size: 9px;
  font-weight: 800;
  min-width: 16px;
  height: 16px;
  padding: 0 4.5px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid white;
  pointer-events: none;
  box-shadow: 0 3px 8px rgba(230, 0, 0, 0.35);
  font-family: 'Inter', sans-serif;
  line-height: 1;
}
</style>

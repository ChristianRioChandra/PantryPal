<template>
  <div class="manage-inventory-page">
    <!-- USE MODAL -->
    <div v-if="useModalOpen" class="modal-overlay" style="display: flex">
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
          @click="finishItem"
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

    <!-- ADD ITEM MODAL -->
    <div v-if="addModalOpen" class="modal-overlay" style="display: flex">
      <div class="modal-box">
        <h2>Add New Food Item</h2>

        <div class="form-section">
          <label class="field-label"
            >Food Item Title <span class="char-count">({{ newItem.name.length }}/25)</span></label
          >
          <input
            type="text"
            v-model="newItem.name"
            placeholder="Enter food item name"
            maxlength="25"
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
              <span class="char-count">({{ newItem.volume.length }}/10)</span></label
            >
            <input
              type="text"
              v-model="newItem.volume"
              placeholder="e.g., 500ml, 1kg, 12 pieces"
              maxlength="10"
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
              :class="{ active: selectedStorage === 'counter' }"
              @click="selectedStorage = 'counter'"
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
          <button @click="closeAddModal" class="modal-cancel">Cancel</button>
          <button @click="confirmAdd" class="modal-add">Add Item</button>
        </div>
      </div>
    </div>

    <div class="dashboard">
      <BaseSidebar :nav-items="navItems" />

      <div class="main-content">
        <BaseTopbar
          title="Manage Inventory"
          search-placeholder="Search any food (milk, rice, ice cream...)"
          v-model:search-value="searchQuery"
        >
          <template #actions>
            <i class="bi bi-sliders"></i>
          </template>
        </BaseTopbar>

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
          <!-- ALL CATEGORY -->
          <div
            class="storage-category"
            :class="{ expanded: expandedCategories.all }"
            id="allCategory"
          >
            <div class="category-header" @click="toggleCategory('all')">
              <div class="cat-title">
                <i class="bi bi-box"></i>
                <h2>All Category</h2>
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
                  :data-food-name="item.name"
                  :data-search-terms="`${item.name} ${item.volume} ${item.foodType} ${item.description} ${item.searchTerms}`"
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
                        <span v-if="item.expiryDays <= 3" class="expiry-badge urgent">
                          <i class="bi bi-exclamation-triangle"></i> expires in
                          {{ item.expiryDays }}d
                        </span>

                        <span v-else class="expiry-badge">
                          <i class="bi bi-clock"></i> {{ item.expiryDays }}d left
                        </span>

                        <span class="tag storage-tag">{{ item.category }}</span>
                        <span class="tag type-tag">{{ item.foodType }}</span>
                      </div>
                    </div>
                    <div class="card-badges">
                      <span class="volume-badge">{{ item.volume }}</span>
                    </div>
                  </div>

                  <p class="food-description">{{ item.description }}</p>

                  <div class="card-meta">
                    <div class="storage-tags"></div>
                  </div>

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
                    <button class="mini-btn delete-item" @click="deleteItem(item.id)">
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

          <!-- FRIDGE CATEGORY -->
          <div
            class="storage-category"
            :class="{ expanded: expandedCategories.fridge }"
            id="fridgeCategory"
          >
            <div class="category-header" @click="toggleCategory('fridge')">
              <div class="cat-title">
                <i class="bi bi-thermometer-low"></i>
                <h2>Fridge</h2>
                <div class="cat-badge">{{ getCategoryCount('fridge') }} items</div>
              </div>
              <div class="expand-cat-icon"><i class="bi bi-chevron-down"></i></div>
            </div>
            <div class="category-items">
              <div class="food-grid" data-category="fridge" id="fridgeGrid">
                <div
                  v-for="item in getFilteredAndSortedItems('fridge')"
                  :key="item.id"
                  class="food-item-card"
                  :class="{
                    'selected-for-donation': selectedDonationIds.has(item.id),
                    'hidden-by-search': isHiddenBySearch(item),
                  }"
                  :data-food-id="item.id"
                  :data-food-name="item.name"
                  :data-search-terms="`${item.name} ${item.volume} ${item.foodType} ${item.description} ${item.searchTerms}`"
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
                        <span v-if="item.expiryDays <= 3" class="expiry-badge urgent">
                          <i class="bi bi-exclamation-triangle"></i> expires in
                          {{ item.expiryDays }}d
                        </span>

                        <span v-else class="expiry-badge">
                          <i class="bi bi-clock"></i> {{ item.expiryDays }}d left
                        </span>

                        <span class="tag storage-tag">{{ item.category }}</span>
                        <span class="tag type-tag">{{ item.foodType }}</span>
                      </div>
                    </div>
                    <div class="card-badges">
                      <span class="volume-badge">{{ item.volume }}</span>
                    </div>
                  </div>

                  <p class="food-description">{{ item.description }}</p>

                  <div class="card-meta">
                    <div class="storage-tags"></div>
                  </div>

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
                    <button class="mini-btn delete-item" @click="deleteItem(item.id)">
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

          <!-- PANTRY CATEGORY -->
          <div
            class="storage-category"
            :class="{ expanded: expandedCategories.pantry }"
            id="pantryCategory"
          >
            <div class="category-header" @click="toggleCategory('pantry')">
              <div class="cat-title">
                <i class="bi bi-bookshelf"></i>
                <h2>Pantry</h2>
                <div class="cat-badge">{{ getCategoryCount('pantry') }} items</div>
              </div>
              <div class="expand-cat-icon"><i class="bi bi-chevron-down"></i></div>
            </div>
            <div class="category-items">
              <div class="food-grid" data-category="pantry" id="pantryGrid">
                <div
                  v-for="item in getFilteredAndSortedItems('pantry')"
                  :key="item.id"
                  class="food-item-card"
                  :class="{
                    'selected-for-donation': selectedDonationIds.has(item.id),
                    'hidden-by-search': isHiddenBySearch(item),
                  }"
                  :data-food-id="item.id"
                  :data-food-name="item.name"
                  :data-search-terms="`${item.name} ${item.volume} ${item.foodType} ${item.description} ${item.searchTerms}`"
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
                        <span v-if="item.expiryDays <= 3" class="expiry-badge urgent">
                          <i class="bi bi-exclamation-triangle"></i> expires in
                          {{ item.expiryDays }}d
                        </span>

                        <span v-else class="expiry-badge">
                          <i class="bi bi-clock"></i> {{ item.expiryDays }}d left
                        </span>

                        <span class="tag storage-tag">{{ item.category }}</span>
                        <span class="tag type-tag">{{ item.foodType }}</span>
                      </div>
                    </div>
                    <div class="card-badges">
                      <span class="volume-badge">{{ item.volume }}</span>
                    </div>
                  </div>

                  <p class="food-description">{{ item.description }}</p>

                  <div class="card-meta">
                    <div class="storage-tags"></div>
                  </div>

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
                    <button class="mini-btn delete-item" @click="deleteItem(item.id)">
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

          <!-- FREEZER CATEGORY -->
          <div
            class="storage-category"
            :class="{ expanded: expandedCategories.freezer }"
            id="freezerCategory"
          >
            <div class="category-header" @click="toggleCategory('freezer')">
              <div class="cat-title">
                <i class="bi bi-snow"></i>
                <h2>Freezer</h2>
                <div class="cat-badge">{{ getCategoryCount('freezer') }} items</div>
              </div>
              <div class="expand-cat-icon"><i class="bi bi-chevron-down"></i></div>
            </div>
            <div class="category-items">
              <div class="food-grid" data-category="freezer" id="freezerGrid">
                <div
                  v-for="item in getFilteredAndSortedItems('freezer')"
                  :key="item.id"
                  class="food-item-card"
                  :class="{
                    'selected-for-donation': selectedDonationIds.has(item.id),
                    'hidden-by-search': isHiddenBySearch(item),
                  }"
                  :data-food-id="item.id"
                  :data-food-name="item.name"
                  :data-search-terms="`${item.name} ${item.volume} ${item.foodType} ${item.description} ${item.searchTerms}`"
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
                        <span v-if="item.expiryDays <= 3" class="expiry-badge urgent">
                          <i class="bi bi-exclamation-triangle"></i> expires in
                          {{ item.expiryDays }}d
                        </span>

                        <span v-else class="expiry-badge">
                          <i class="bi bi-clock"></i> {{ item.expiryDays }}d left
                        </span>

                        <span class="tag storage-tag">{{ item.category }}</span>
                        <span class="tag type-tag">{{ item.foodType }}</span>
                      </div>
                    </div>
                    <div class="card-badges">
                      <span class="volume-badge">{{ item.volume }}</span>
                    </div>
                  </div>

                  <p class="food-description">{{ item.description }}</p>

                  <div class="card-meta">
                    <div class="storage-tags"></div>
                  </div>

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
                    <button class="mini-btn delete-item" @click="deleteItem(item.id)">
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

          <!-- COUNTERTOP CATEGORY -->
          <div
            class="storage-category"
            :class="{ expanded: expandedCategories.counter }"
            id="counterCategory"
          >
            <div class="category-header" @click="toggleCategory('counter')">
              <div class="cat-title">
                <i class="bi bi-cup-hot"></i>
                <h2>Countertop</h2>
                <div class="cat-badge">{{ getCategoryCount('counter') }} items</div>
              </div>
              <div class="expand-cat-icon"><i class="bi bi-chevron-down"></i></div>
            </div>
            <div class="category-items">
              <div class="food-grid" data-category="counter" id="counterGrid">
                <div
                  v-for="item in getFilteredAndSortedItems('counter')"
                  :key="item.id"
                  class="food-item-card"
                  :class="{
                    'selected-for-donation': selectedDonationIds.has(item.id),
                    'hidden-by-search': isHiddenBySearch(item),
                  }"
                  :data-food-id="item.id"
                  :data-food-name="item.name"
                  :data-search-terms="`${item.name} ${item.volume} ${item.foodType} ${item.description} ${item.searchTerms}`"
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
                        <span v-if="item.expiryDays <= 3" class="expiry-badge urgent">
                          <i class="bi bi-exclamation-triangle"></i> expires in
                          {{ item.expiryDays }}d
                        </span>

                        <span v-else class="expiry-badge">
                          <i class="bi bi-clock"></i> {{ item.expiryDays }}d left
                        </span>

                        <span class="tag storage-tag">{{ item.category }}</span>
                        <span class="tag type-tag">{{ item.foodType }}</span>
                      </div>
                    </div>
                    <div class="card-badges">
                      <span class="volume-badge">{{ item.volume }}</span>
                    </div>
                  </div>

                  <p class="food-description">{{ item.description }}</p>

                  <div class="card-meta">
                    <div class="storage-tags"></div>
                  </div>

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
                    <button class="mini-btn delete-item" @click="deleteItem(item.id)">
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

          <!-- NEAR EXPIRY CATEGORY -->
          <div
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
                  :class="{
                    'selected-for-donation': selectedDonationIds.has(item.id),
                    'hidden-by-search': isHiddenBySearch(item),
                  }"
                  :data-food-id="item.id"
                  :data-food-name="item.name"
                  :data-search-terms="`${item.name} ${item.volume} ${item.foodType} ${item.description} ${item.searchTerms}`"
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
                        <span v-if="item.expiryDays <= 3" class="expiry-badge urgent">
                          <i class="bi bi-exclamation-triangle"></i> expires in
                          {{ item.expiryDays }}d
                        </span>

                        <span v-else class="expiry-badge">
                          <i class="bi bi-clock"></i> {{ item.expiryDays }}d left
                        </span>

                        <span class="tag storage-tag">{{ item.category }}</span>
                        <span class="tag type-tag">{{ item.foodType }}</span>
                      </div>
                    </div>
                    <div class="card-badges">
                      <span class="volume-badge">{{ item.volume }}</span>
                    </div>
                  </div>

                  <p class="food-description">{{ item.description }}</p>

                  <div class="card-meta">
                    <div class="storage-tags"></div>
                  </div>

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
                    <button class="mini-btn delete-item" @click="deleteItem(item.id)">
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
                  No items near expiry! keep up the good work managing your food.
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
                    <span :class="{ urgent: item.expiryDays <= 3 }">
                      <i
                        :class="item.expiryDays <= 3 ? 'bi bi-exclamation-triangle' : 'bi bi-clock'"
                      ></i>
                      {{ item.expiryDays }}d left
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

          <button class="right-btn" id="filterBtn" @click="cycleFilterMode">
            <i class="bi bi-funnel"></i> Filter: {{ getFilterLabel(currentFilter) }}
          </button>
          <button class="right-btn" id="sortBtn" @click="cycleSortMode">
            <i class="bi bi-arrow-down-up"></i> Sort: {{ getSortLabel(currentSort) }}
          </button>
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
  </div>
</template>

<script setup lang="ts">
import type { NavItem } from '@/components/BaseSidebar.vue'
import { ref, computed } from 'vue'
import BaseSidebar from '@/components/BaseSidebar.vue'
import BaseTopbar from '@/components/BaseTopbar.vue'

// Navigation items
const navItems: NavItem[] = [
  { label: 'Dashboard', route: '/', icon: 'bi bi-graph-up' },
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
  category: string
  foodType: string
  searchTerms: string
  quantityLevel: string
}

const inventory = ref<InventoryItem[]>([
  {
    id: 'f1',
    name: 'Susu UltraMilk',
    description: 'Fresh milk, rich in calcium and vitamin D',
    volume: '500ml',
    location: 'Middle shelf',
    expiryDays: 5,
    category: 'fridge',
    foodType: 'Dairy & Eggs',
    searchTerms: 'milk dairy',
    quantityLevel: 'high',
  },
  {
    id: 'f2',
    name: 'Fresh Spinach',
    description: 'Organic spinach leaves, great for salads and cooking',
    volume: '200g bag',
    location: 'Veg drawer',
    expiryDays: 2,
    category: 'fridge',
    foodType: 'Vegetables',
    searchTerms: 'spinach greens',
    quantityLevel: 'low',
  },
  // ... include all other items from original data ...
])

const nextId = ref(100)

const currentFilter = ref('all')
const currentSort = ref('name')
const filterModes = ['all', 'near-expiry', 'fridge', 'pantry', 'freezer', 'counter']
const sortModes = ['name', 'expiry', 'category']
type InventoryLayout = 'cards' | 'compact'
const inventoryLayout = ref<InventoryLayout>('cards')
const compactStorageColumns = [
  { key: 'pantry', label: 'Pantry', icon: 'bi bi-bookshelf' },
  { key: 'fridge', label: 'Fridge', icon: 'bi bi-thermometer-low' },
  { key: 'freezer', label: 'Freezer', icon: 'bi bi-snow' },
  { key: 'counter', label: 'Countertop', icon: 'bi bi-cup-hot' },
] as const

const searchQuery = ref('')
const selectedDonationIds = ref<Set<string>>(new Set())

const expandedCategories = ref({
  all: false,
  fridge: true,
  pantry: false,
  freezer: false,
  counter: false,
  expiry: false,
})

const addModalOpen = ref(false)
const useModalOpen = ref(false)
const currentUseItemId = ref<string | null>(null)
const selectedUseQuantity = ref('high')
// const selectedQuantityLevel = ref('low')
const selectedStorage = ref('fridge')

const newItem = ref({
  name: '',
  description: '',
  expiryDate: '',
  category: 'fridge',
  volume: '',
  foodType: 'Other',
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

// ---------- Computed ----------

const qtyProgress = computed(() => qtyMap[selectedQuantityLevel.value])

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
function getFilteredAndSortedItems(category: string): InventoryItem[] {
  let items =
    category === 'all'
      ? [...inventory.value]
      : inventory.value.filter((i) => i.category === category)

  if (currentFilter.value === 'near-expiry') {
    items = items.filter((i) => i.expiryDays <= 3)
  } else if (['fridge', 'pantry', 'freezer', 'counter'].includes(currentFilter.value)) {
    items = items.filter((i) => i.category === currentFilter.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter((item) => {
      const combined =
        `${item.name} ${item.volume} ${item.foodType} ${item.description} ${item.searchTerms || ''}`.toLowerCase()
      return combined.includes(query)
    })
  }

  items.sort((a, b) => {
    if (currentSort.value === 'expiry') return a.expiryDays - b.expiryDays
    if (currentSort.value === 'category') return a.category.localeCompare(b.category)
    return a.name.localeCompare(b.name)
  })

  return items
}

function getNearExpiryItems(): InventoryItem[] {
  return inventory.value.filter((i) => i.expiryDays <= 3)
}

function getNearExpiryCount(): number {
  return getNearExpiryItems().length
}

function getCategoryCount(category: string): number {
  if (category === 'all') {
    let items = [...inventory.value]
    if (currentFilter.value === 'near-expiry') items = items.filter((i) => i.expiryDays <= 3)
    else if (['fridge', 'pantry', 'freezer', 'counter'].includes(currentFilter.value))
      items = items.filter((i) => i.category === currentFilter.value)
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      items = items.filter((item) =>
        `${item.name} ${item.volume} ${item.foodType} ${item.description} ${item.searchTerms}`
          .toLowerCase()
          .includes(q),
      )
    }
    return items.length
  }
  return getFilteredAndSortedItems(category).length
}

function isHiddenBySearch(item: InventoryItem): boolean {
  if (!searchQuery.value) return false
  const combined = `${item.name} ${item.volume} ${item.searchTerms}`.toLowerCase()
  return !combined.includes(searchQuery.value.toLowerCase())
}

function toggleCategory(cat: keyof typeof expandedCategories.value) {
  expandedCategories.value[cat] = !expandedCategories.value[cat]
}

function escapeHtml(str: string): string {
  return str.replace(
    /[&<>]/g,
    (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m as '&' | '<' | '>'] || m,
  )
}

function deleteItem(id: string) {
  inventory.value = inventory.value.filter((i) => i.id !== id)
  selectedDonationIds.value.delete(id)
  notifyMessage('Item removed.')
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

function finishItem() {
  if (!currentUseItemId.value) return
  const item = inventory.value.find((i) => i.id === currentUseItemId.value)
  if (!item) return
  inventory.value = inventory.value.filter((i) => i.id !== currentUseItemId.value)
  selectedDonationIds.value.delete(currentUseItemId.value)
  closeUseModal()
  notifyMessage(`Finished "${item.name}"`)
}

function confirmUse() {
  if (!currentUseItemId.value) return
  const item = inventory.value.find((i) => i.id === currentUseItemId.value)
  if (!item) return
  item.quantityLevel = selectedUseQuantity.value
  closeUseModal()
  notifyMessage(`Updated "${item.name}" usage`)
}

function singleDonate(id: string) {
  inventory.value = inventory.value.filter((i) => i.id !== id)
  selectedDonationIds.value.delete(id)
  notifyMessage('Donated item. Thank you for sharing!')
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

function bulkDonateAction() {
  if (selectedDonationIds.value.size === 0) return
  const ids = Array.from(selectedDonationIds.value)
  const names = ids.map((id) => inventory.value.find((i) => i.id === id)?.name || 'item')
  inventory.value = inventory.value.filter((i) => !selectedDonationIds.value.has(i.id))
  selectedDonationIds.value.clear()
  notifyMessage(`Donated ${ids.length} item(s): ${names.join(', ')}. Thank you for reducing waste!`)
}

function getFilterLabel(filter: string): string {
  const labels: Record<string, string> = {
    'near-expiry': 'Near Expiry',
    fridge: 'Fridge',
    pantry: 'Pantry',
    freezer: 'Freezer',
    counter: 'Countertop',
    all: 'All',
  }
  return labels[filter] || 'All'
}

function getSortLabel(sort: string): string {
  const labels: Record<string, string> = { expiry: 'Expiry', category: 'Category', name: 'Name' }
  return labels[sort] || 'Name'
}

function cycleFilterMode() {
  const idx = (filterModes.indexOf(currentFilter.value) + 1) % filterModes.length
  currentFilter.value = filterModes[idx]!
  notifyMessage(`Filter set to ${getFilterLabel(currentFilter.value)}.`)
}

function cycleSortMode() {
  const idx = (sortModes.indexOf(currentSort.value) + 1) % sortModes.length
  currentSort.value = sortModes[idx]!
  notifyMessage(`Sort set to ${getSortLabel(currentSort.value)}.`)
}

function calculateDaysUntil(dateString: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateString}T00:00:00`)
  target.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000))
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
  addModalOpen.value = false
}

function confirmAdd() {
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
  const newId = `item_${nextId.value++}`
  inventory.value.push({
    id: newId,
    name: newItem.value.name,
    description: newItem.value.description,
    volume: newItem.value.volume,
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
  })
  closeAddModal()
  notifyMessage(`Added "${newItem.value.name}"`)
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
  grid-template-columns: clamp(200px, 15vw, 256px) minmax(0, 1fr) clamp(210px, 16vw, 276px);
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
  overflow-y: auto;
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

.main-content :deep(.top-bar) {
  width: 100%;
}

.main-content :deep(.top-bar-actions) {
  min-width: min(100%, 360px);
}

.main-content :deep(.search-wrapper) {
  flex: 1 1 280px;
  min-width: 0;
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
  top: 70px;
  right: 20px;
  z-index: 5;
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
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0;
  color: #0a1c2f;
  line-height: 1.3;
  word-break: break-word;
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
  font-size: 0.85rem;
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

.card-badges {
  position: absolute;
  top: 24px;
  right: 20px;
  display: flex;
  justify-content: flex-end;
  max-width: calc(100% - 40px);
}

.volume-badge {
  background: #f1f5fa;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.88rem;
  font-weight: 600;
  white-space: nowrap;
  color: #48617c;
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
  font-size: 0.82rem;
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
  margin-top: 12px;
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
  flex: 0 1 auto;
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
  background: rgba(10, 28, 47, 0.35);
  display: none;
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
  grid-template-columns: 0.1fr 1.6fr;
  gap: 10px;
}

.row3 {
  padding-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 400px;
}

.row4 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
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
  font-size: 0.9rem;
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

@media (max-width: 1120px) {
  .dashboard {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: sticky;
    top: 24px;
    align-self: start;
    z-index: 1;
  }

  .top-bar {
    padding: 18px 24px;
  }

  .main-content :deep(.top-bar) {
    padding: 18px 24px;
  }

  .top-bar-actions {
    min-width: 100%;
    justify-content: stretch;
  }

  .main-content :deep(.top-bar-actions) {
    min-width: 100%;
    justify-content: stretch;
  }

  .search-wrapper {
    flex: 1;
  }

  .main-content :deep(.search-wrapper) {
    width: 100%;
  }

  .right-sidebar {
    grid-column: 1 / -1;
    position: sticky;
    top: 24px;
    align-self: start;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    align-items: start;
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
    padding: 14px;
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

  .sidebar {
    border-radius: 26px;
    padding: 18px 16px;
  }

  .logo-icon {
    width: 42px;
    height: 42px;
    font-size: 21px;
  }

  .logo-text {
    font-size: 1.32rem;
  }

  .nav-item {
    padding: 12px 14px;
    font-size: 0.92rem;
  }

  .top-bar {
    padding: 16px 18px;
    border-radius: 24px;
  }

  .page-title h2 {
    font-size: 1.7rem;
  }

  .main-content :deep(.page-title h2) {
    font-size: 1.7rem;
  }

  .top-bar-actions {
    gap: 10px;
  }

  .layout-toggle-bar {
    justify-content: stretch;
    margin-top: -10px;
  }

  .layout-toggle {
    width: 100%;
  }

  .search-wrapper {
    min-width: 0;
    width: 100%;
    min-height: 46px;
  }

  .action-icons {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
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

  .right-sidebar {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .right-box {
    border-radius: 22px;
    padding: 16px;
  }

  .floating-add {
    min-height: 76px;
    font-size: 2rem;
    border-radius: 22px;
  }
}

@media (max-width: 560px) {
  .manage-inventory-page {
    padding: 12px;
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
</style>

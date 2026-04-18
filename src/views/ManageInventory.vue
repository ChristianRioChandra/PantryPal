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

        <input type="text" v-model="newItem.name" placeholder="Name" />
        <input type="text" v-model="newItem.desc" placeholder="Short Description" />

        <div class="row">
          <div class="field-stack">
            <label class="field-label" for="expiryDate">Expiry Date</label>
            <input
              id="expiryDate"
              v-model="newItem.expiryDate"
              class="date-input"
              :class="{ 'has-date': !!newItem.expiryDate }"
              type="date"
              :min="todayDate"
            />
            <div
              class="expiry-preview"
              :class="{
                empty: !newItem.expiryDate,
                urgent: newItemExpiryDays !== null && newItemExpiryDays <= 3,
              }"
            >
              {{ newItemExpiryLabel }}
            </div>
          </div>
          <select v-model="selectedStorage">
            <option value="fridge">Fridge</option>
            <option value="pantry">Pantry</option>
            <option value="freezer">Freezer</option>
            <option value="counter">Countertop</option>
          </select>
          <input type="text" v-model="newItem.volume" placeholder="Qty" />
        </div>

        <!-- STORAGE SELECT -->
        <div class="storage-select">
          <button
            class="storage-btn"
            :class="{ active: selectedStorage === 'freezer' }"
            data-type="freezer"
            @click="selectedStorage = 'freezer'"
          >
            Freezer
          </button>
          <button
            class="storage-btn"
            :class="{ active: selectedStorage === 'pantry' }"
            data-type="pantry"
            @click="selectedStorage = 'pantry'"
          >
            Pantry
          </button>
          <button
            class="storage-btn"
            :class="{ active: selectedStorage === 'fridge' }"
            data-type="fridge"
            @click="selectedStorage = 'fridge'"
          >
            Fridge
          </button>
          <button
            class="storage-btn"
            :class="{ active: selectedStorage === 'counter' }"
            data-type="counter"
            @click="selectedStorage = 'counter'"
          >
            Countertop
          </button>
        </div>

        <div>
          <p style="font-size: 0.85rem; font-weight: 600; margin-top: 10px">Quantity Level</p>

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
              data-level="low"
              @click="setQuantityLevel('low')"
            >
              Low
            </div>
            <div
              class="qty-option half"
              :class="{ selected: selectedQuantityLevel === 'half' }"
              data-level="half"
              @click="setQuantityLevel('half')"
            >
              Half
            </div>
            <div
              class="qty-option high"
              :class="{ selected: selectedQuantityLevel === 'high' }"
              data-level="high"
              @click="setQuantityLevel('high')"
            >
              High
            </div>
            <div
              class="qty-option full"
              :class="{ selected: selectedQuantityLevel === 'full' }"
              data-level="full"
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

        <!-- ALL CATEGORY -->
        <div
          class="storage-category"
          :class="{ expanded: expandedCategories.all }"
          id="allCategory"
        >
          <div class="category-header" @click="toggleCategory('all')">
            <div class="cat-title">
              <i class="bi bi-box"></i>
              <h2>All Storage</h2>
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
                :data-search-terms="`${item.name} ${item.volume} ${item.searchTerms}`"
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
                <div class="food-preview">
                  <span class="food-name">{{ escapeHtml(item.name) }}</span>
                  <span class="food-volume">{{ item.volume }}</span>
                </div>
                <div class="food-details-mini">
                  <span v-if="item.expiryDays <= 3" class="expiry-warning"
                    ><i class="bi bi-exclamation-triangle"></i> expires in
                    {{ item.expiryDays }}d</span
                  >
                  <span v-else><i class="bi bi-clock"></i> Exp: {{ item.expiryDays }} days</span>
                  <span><i class="bi bi-geo-alt"></i> {{ item.location }}</span>
                </div>
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
                <span class="quantity-label" :class="item.quantityLevel || 'high'">{{
                  quantityLabels[item.quantityLevel as keyof typeof quantityLabels] ||
                  quantityLabels.high
                }}</span>
                <div class="food-extra-actions">
                  <button class="mini-btn delete-item" @click="deleteItem(item.id)">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                  <button class="mini-btn use-item" @click="openUseModal(item.id)">
                    <i class="bi bi-check"></i> Use
                  </button>
                  <button class="mini-btn donate-mini" @click="singleDonate(item.id)">
                    <i class="fas fa-hand-holding-heart"></i> Donate
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
                :data-search-terms="`${item.name} ${item.volume} ${item.searchTerms}`"
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
                <div class="food-preview">
                  <span class="food-name">{{ escapeHtml(item.name) }}</span>
                  <span class="food-volume">{{ item.volume }}</span>
                </div>
                <div class="food-details-mini">
                  <span v-if="item.expiryDays <= 3" class="expiry-warning"
                    ><i class="bi bi-exclamation-triangle"></i> expires in
                    {{ item.expiryDays }}d</span
                  >
                  <span v-else><i class="bi bi-clock"></i> Exp: {{ item.expiryDays }} days</span>
                  <span><i class="bi bi-geo-alt"></i> {{ item.location }}</span>
                </div>
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
                <span class="quantity-label" :class="item.quantityLevel || 'high'">{{
                  quantityLabels[item.quantityLevel as keyof typeof quantityLabels] ||
                  quantityLabels.high
                }}</span>
                <div class="food-extra-actions">
                  <button class="mini-btn delete-item" @click="deleteItem(item.id)">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                  <button class="mini-btn use-item" @click="openUseModal(item.id)">
                    <i class="bi bi-check"></i> Use
                  </button>
                  <button class="mini-btn donate-mini" @click="singleDonate(item.id)">
                    <i class="fas fa-hand-holding-heart"></i> Donate
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
              <i class="bi bi-filing"></i>
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
                :data-search-terms="`${item.name} ${item.volume} ${item.searchTerms}`"
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
                <div class="food-preview">
                  <span class="food-name">{{ escapeHtml(item.name) }}</span>
                  <span class="food-volume">{{ item.volume }}</span>
                </div>
                <div class="food-details-mini">
                  <span v-if="item.expiryDays <= 3" class="expiry-warning"
                    ><i class="bi bi-exclamation-triangle"></i> expires in
                    {{ item.expiryDays }}d</span
                  >
                  <span v-else><i class="bi bi-clock"></i> Exp: {{ item.expiryDays }} days</span>
                  <span><i class="bi bi-geo-alt"></i> {{ item.location }}</span>
                </div>
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
                <span class="quantity-label" :class="item.quantityLevel || 'high'">{{
                  quantityLabels[item.quantityLevel as keyof typeof quantityLabels] ||
                  quantityLabels.high
                }}</span>
                <div class="food-extra-actions">
                  <button class="mini-btn delete-item" @click="deleteItem(item.id)">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                  <button class="mini-btn use-item" @click="openUseModal(item.id)">
                    <i class="bi bi-check"></i> Use
                  </button>
                  <button class="mini-btn donate-mini" @click="singleDonate(item.id)">
                    <i class="fas fa-hand-holding-heart"></i> Donate
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
                :data-search-terms="`${item.name} ${item.volume} ${item.searchTerms}`"
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
                <div class="food-preview">
                  <span class="food-name">{{ escapeHtml(item.name) }}</span>
                  <span class="food-volume">{{ item.volume }}</span>
                </div>
                <div class="food-details-mini">
                  <span v-if="item.expiryDays <= 3" class="expiry-warning"
                    ><i class="bi bi-exclamation-triangle"></i> expires in
                    {{ item.expiryDays }}d</span
                  >
                  <span v-else><i class="bi bi-clock"></i> Exp: {{ item.expiryDays }} days</span>
                  <span><i class="bi bi-geo-alt"></i> {{ item.location }}</span>
                </div>
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
                <span class="quantity-label" :class="item.quantityLevel || 'high'">{{
                  quantityLabels[item.quantityLevel as keyof typeof quantityLabels] ||
                  quantityLabels.high
                }}</span>
                <div class="food-extra-actions">
                  <button class="mini-btn delete-item" @click="deleteItem(item.id)">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                  <button class="mini-btn use-item" @click="openUseModal(item.id)">
                    <i class="bi bi-check"></i> Use
                  </button>
                  <button class="mini-btn donate-mini" @click="singleDonate(item.id)">
                    <i class="fas fa-hand-holding-heart"></i> Donate
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
              <i class="bi bi-tornado"></i>
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
                :data-search-terms="`${item.name} ${item.volume} ${item.searchTerms}`"
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
                <div class="food-preview">
                  <span class="food-name">{{ escapeHtml(item.name) }}</span>
                  <span class="food-volume">{{ item.volume }}</span>
                </div>
                <div class="food-details-mini">
                  <span v-if="item.expiryDays <= 3" class="expiry-warning"
                    ><i class="bi bi-exclamation-triangle"></i> expires in
                    {{ item.expiryDays }}d</span
                  >
                  <span v-else><i class="bi bi-clock"></i> Exp: {{ item.expiryDays }} days</span>
                  <span><i class="bi bi-geo-alt"></i> {{ item.location }}</span>
                </div>
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
                <span class="quantity-label" :class="item.quantityLevel || 'high'">{{
                  quantityLabels[item.quantityLevel as keyof typeof quantityLabels] ||
                  quantityLabels.high
                }}</span>
                <div class="food-extra-actions">
                  <button class="mini-btn delete-item" @click="deleteItem(item.id)">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                  <button class="mini-btn use-item" @click="openUseModal(item.id)">
                    <i class="bi bi-check"></i> Use
                  </button>
                  <button class="mini-btn donate-mini" @click="singleDonate(item.id)">
                    <i class="fas fa-hand-holding-heart"></i> Donate
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
              <i class="bi bi-hourglass-split"></i>
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
                :data-search-terms="`${item.name} ${item.volume} ${item.searchTerms}`"
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
                <div class="food-preview">
                  <span class="food-name">{{ escapeHtml(item.name) }}</span>
                  <span class="food-volume">{{ item.volume }}</span>
                </div>
                <div class="food-details-mini">
                  <span v-if="item.expiryDays <= 3" class="expiry-warning"
                    ><i class="bi bi-exclamation-triangle"></i> expires in
                    {{ item.expiryDays }}d</span
                  >
                  <span v-else><i class="bi bi-clock"></i> Exp: {{ item.expiryDays }} days</span>
                  <span><i class="bi bi-geo-alt"></i> {{ item.location }}</span>
                </div>
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
                <span class="quantity-label" :class="item.quantityLevel || 'high'">{{
                  quantityLabels[item.quantityLevel as keyof typeof quantityLabels] ||
                  quantityLabels.high
                }}</span>
                <div class="food-extra-actions">
                  <button class="mini-btn delete-item" @click="deleteItem(item.id)">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                  <button class="mini-btn use-item" @click="openUseModal(item.id)">
                    <i class="bi bi-check"></i> Use
                  </button>
                  <button class="mini-btn donate-mini" @click="singleDonate(item.id)">
                    <i class="fas fa-hand-holding-heart"></i> Donate
                  </button>
                </div>
              </div>
              <div
                v-if="getNearExpiryItems().length === 0"
                style="padding: 20px; text-align: center; color: #7e95b0"
              >
                ✨ No items near expiry! Great job managing food.
              </div>
            </div>
          </div>
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
            <span class="search-results-info" id="searchResultsInfo">{{ searchResultsInfo }}</span>
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
            <i class="fas fa-hand-holding-heart"></i> Donate Selected
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
import { ref, computed } from 'vue'
import BaseSidebar from '@/components/BaseSidebar.vue'
import BaseTopbar from '@/components/BaseTopbar.vue'
import type { NavItem } from '@/components/BaseSidebar.vue'

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
  volume: string
  location: string
  expiryDays: number
  category: string
  searchTerms: string
  quantityLevel: string
}

const inventory = ref<InventoryItem[]>([
  {
    id: 'f1',
    name: 'Susu UltraMilk',
    volume: '500ml',
    location: 'Middle shelf',
    expiryDays: 5,
    category: 'fridge',
    searchTerms: 'milk dairy',
    quantityLevel: 'high',
  },
  {
    id: 'f2',
    name: 'Fresh Spinach',
    volume: '200g bag',
    location: 'Veg drawer',
    expiryDays: 2,
    category: 'fridge',
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
  desc: '',
  expiryDate: '',
  category: 'fridge',
  volume: '1 item',
})

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
const searchResultsInfo = computed(() => {
  if (searchQuery.value) {
    const count = getFilteredAndSortedItems('all').length
    return `found ${count} matching`
  }
  return ''
})

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
      const combined = `${item.name} ${item.volume} ${item.searchTerms || ''}`.toLowerCase()
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
        `${item.name} ${item.volume} ${item.searchTerms}`.toLowerCase().includes(q),
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
  notifyMessage(`🧪 Filter set to ${getFilterLabel(currentFilter.value)}.`)
}

function cycleSortMode() {
  const idx = (sortModes.indexOf(currentSort.value) + 1) % sortModes.length
  currentSort.value = sortModes[idx]!
  notifyMessage(`🔃 Sort set to ${getSortLabel(currentSort.value)}.`)
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

function openAddModal() {
  const future = new Date()
  future.setDate(future.getDate() + 5)
  const y = future.getFullYear()
  const m = String(future.getMonth() + 1).padStart(2, '0')
  const d = String(future.getDate()).padStart(2, '0')
  newItem.value = {
    name: '',
    desc: '',
    expiryDate: `${y}-${m}-${d}`,
    category: 'fridge',
    volume: '1 item',
  }
  selectedStorage.value = 'fridge'
  selectedQuantityLevel.value = 'low'
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

  const expiryDays = calculateDaysUntil(newItem.value.expiryDate)
  const newId = `item_${nextId.value++}`
  inventory.value.push({
    id: newId,
    name: newItem.value.name,
    volume: newItem.value.volume || '1 item',
    location: 'Custom',
    expiryDays,
    category: selectedStorage.value,
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
}

.dashboard {
  max-width: 1760px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: clamp(220px, 16vw, 256px) minmax(0, 1fr) clamp(232px, 18vw, 276px);
  gap: clamp(18px, 2vw, 28px);
  align-items: start;
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
  background: #eef2ff;
  padding: 8px 16px;
  border-radius: 40px;
  font-size: 0.82rem;
  font-weight: 600;
  align-self: flex-start;
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
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
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
  top: 54px;
  right: 26px;
  z-index: 5;
}
.donation-checkbox {
  width: 28px;
  height: 28px;
  cursor: pointer;
  accent-color: #2c7a4d;
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
  position: sticky;
  top: 24px;
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
  font-size: 2.4rem;
  border-radius: 28px;
  cursor: pointer;
  color: #0b2742;
  font-weight: bold;
  box-shadow: 0 18px 45px rgba(31, 47, 62, 0.08);
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
  grid-template-columns: repeat(2, 1fr);
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
}

.modal-box {
  background: white;
  border-radius: 28px;
  padding: 28px;
  width: 480px;
  max-width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-box h2 {
  text-align: center;
  font-weight: 700;
  margin-bottom: 10px;
}

.modal-box input,
.modal-box select {
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  font-family: 'Inter';
  outline: none;
  font-size: 0.9rem;
}

.modal-box input:focus,
.modal-box select:focus {
  border-color: #2c7a4d;
  box-shadow: 0 0 0 3px rgba(44, 122, 77, 0.12);
}

.field-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #48617c;
}

.date-input {
  color: #15314f;
  background: #fff;
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

.row > * {
  min-width: 0;
}

.row input[type='text'] {
  grid-column: span 2;
}

.storage-select {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.storage-btn {
  flex: 1;
  padding: 10px;
  border-radius: 14px;
  border: none;
  background: #f1f5f9;
  cursor: pointer;
  font-size: 0.85rem;
}

.storage-btn.active {
  background: #2c7a4d;
  color: white;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 14px;
}

.modal-cancel {
  background: #eef2f8;
  border: none;
  padding: 10px 18px;
  border-radius: 40px;
  cursor: pointer;
}

.modal-add {
  background: #2c7a4d;
  color: white;
  border: none;
  padding: 10px 22px;
  border-radius: 40px;
  cursor: pointer;
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
  .food-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

@media (max-width: 1120px) {
  .top-bar {
    padding: 18px 24px;
  }

  .top-bar-actions {
    min-width: 100%;
    justify-content: stretch;
  }

  .search-wrapper {
    flex: 1;
  }

  .right-sidebar {
    grid-column: 1 / -1;
    position: static;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    align-items: start;
  }
}

@media (max-width: 920px) {
  .sidebar,
  .right-sidebar {
    position: static;
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

  .top-bar-actions {
    width: 100%;
  }

  .food-grid {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 18px;
  }

  .right-sidebar {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 780px) {
  .manage-inventory-page {
    padding: 14px;
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

  .top-bar-actions {
    gap: 10px;
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

  .food-preview {
    padding: 18px 18px 10px;
    flex-wrap: wrap;
  }

  .food-name {
    font-size: 1rem;
    padding-right: 0;
    width: 100%;
  }

  .food-details-mini {
    padding: 0 18px 12px;
    font-size: 0.82rem;
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
    width: calc(100% - 36px);
    margin-left: 18px;
    margin-right: 18px;
  }

  .quantity-label {
    margin-left: 18px;
  }

  .food-extra-actions {
    padding: 14px 18px 18px;
    gap: 10px;
  }

  .mini-btn {
    flex: 1 1 calc(50% - 10px);
    justify-content: center;
  }

  .food-details-mini,
  .food-extra-actions {
    font-size: 0.82rem;
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

  .top-bar {
    padding: 14px;
    gap: 12px;
  }

  .page-title h2 {
    font-size: 1.45rem;
  }

  .top-bar-actions {
    flex-wrap: wrap;
  }

  .action-icons {
    margin-left: auto;
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

  .food-preview,
  .food-details-mini,
  .food-extra-actions {
    padding-left: 16px;
    padding-right: 16px;
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
    flex-basis: 100%;
  }

  .row {
    grid-template-columns: 1fr;
  }

  .field-stack {
    grid-column: span 1;
  }

  .row input[type='text'] {
    grid-column: span 1;
  }

  .storage-select {
    flex-wrap: wrap;
  }

  .storage-btn {
    min-width: calc(50% - 5px);
  }

  .modal-box {
    padding: 20px;
  }

  .modal-actions {
    flex-direction: column;
    gap: 10px;
  }

  .modal-cancel,
  .modal-add {
    width: 100%;
  }
}
</style>

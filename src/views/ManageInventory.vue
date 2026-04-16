<template>
  <div>
    <!-- USE MODAL -->
    <div v-if="useModalOpen" class="modal-overlay" style="display: flex;">
      <div class="modal-box">
        <h2>Update Item Usage</h2>
        <p style="font-weight:600; text-align:center;">{{ useItemName }}</p>
        <p style="font-size:0.85rem; margin-top:10px;">Update remaining quantity:</p>

        <div class="quantity-selector" id="useQtySelector">
          <div
            class="qty-option low"
            :class="{ selected: selectedUseQuantity === 'low' }"
            data-level="low"
            @click="selectedUseQuantity = 'low'"
          >Low</div>
          <div
            class="qty-option half"
            :class="{ selected: selectedUseQuantity === 'half' }"
            data-level="half"
            @click="selectedUseQuantity = 'half'"
          >Half</div>
          <div
            class="qty-option high"
            :class="{ selected: selectedUseQuantity === 'high' }"
            data-level="high"
            @click="selectedUseQuantity = 'high'"
          >High</div>
          <div
            class="qty-option full"
            :class="{ selected: selectedUseQuantity === 'full' }"
            data-level="full"
            @click="selectedUseQuantity = 'full'"
          >Full</div>
        </div>

        <button @click="finishItem"
          style="margin-top:10px; background:#fee2e2; color:#b91c1c; border:none; padding:10px; border-radius:14px; font-weight:600; cursor:pointer;">
          Finish Item (Remove)
        </button>

        <div class="modal-actions">
          <button @click="closeUseModal" class="modal-cancel">Cancel</button>
          <button @click="confirmUse" class="modal-add">Save</button>
        </div>
      </div>
    </div>

    <!-- ADD ITEM MODAL -->
    <div v-if="addModalOpen" class="modal-overlay" style="display: flex;">
      <div class="modal-box">
        <h2>Add New Food Item</h2>

        <input type="text" v-model="newItem.name" placeholder="Name">
        <input type="text" v-model="newItem.desc" placeholder="Short Description">

        <div class="row">
          <input type="number" v-model.number="newItem.expiryDays" placeholder="Exp Days">
          <select v-model="newItem.category">
            <option value="fridge">Fridge</option>
            <option value="pantry">Pantry</option>
            <option value="freezer">Freezer</option>
            <option value="counter">Countertop</option>
          </select>
          <input type="text" v-model="newItem.volume" placeholder="Qty">
        </div>

        <!-- STORAGE SELECT -->
        <div class="storage-select">
          <button
            class="storage-btn"
            :class="{ active: selectedStorage === 'freezer' }"
            data-type="freezer"
            @click="selectedStorage = 'freezer'"
          >Freezer</button>
          <button
            class="storage-btn"
            :class="{ active: selectedStorage === 'pantry' }"
            data-type="pantry"
            @click="selectedStorage = 'pantry'"
          >Pantry</button>
          <button
            class="storage-btn"
            :class="{ active: selectedStorage === 'fridge' }"
            data-type="fridge"
            @click="selectedStorage = 'fridge'"
          >Fridge</button>
          <button
            class="storage-btn"
            :class="{ active: selectedStorage === 'counter' }"
            data-type="counter"
            @click="selectedStorage = 'counter'"
          >Countertop</button>
        </div>

        <div>
          <p style="font-size: 0.85rem; font-weight: 600; margin-top: 10px;">Quantity Level</p>

          <div class="qty-progress-wrapper">
            <div class="qty-progress-bar">
              <div class="qty-progress-fill" :style="{ width: qtyProgress.percent, background: qtyProgress.color }"></div>
            </div>
            <div class="qty-progress-label">{{ qtyProgress.label }}</div>
          </div>

          <div class="quantity-selector" id="modalQtySelector">
            <div
              class="qty-option low"
              :class="{ selected: selectedQuantityLevel === 'low' }"
              data-level="low"
              @click="setQuantityLevel('low')"
            >Low</div>
            <div
              class="qty-option half"
              :class="{ selected: selectedQuantityLevel === 'half' }"
              data-level="half"
              @click="setQuantityLevel('half')"
            >Half</div>
            <div
              class="qty-option high"
              :class="{ selected: selectedQuantityLevel === 'high' }"
              data-level="high"
              @click="setQuantityLevel('high')"
            >High</div>
            <div
              class="qty-option full"
              :class="{ selected: selectedQuantityLevel === 'full' }"
              data-level="full"
              @click="setQuantityLevel('full')"
            >Full</div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeAddModal" class="modal-cancel">Cancel</button>
          <button @click="confirmAdd" class="modal-add">Add Item</button>
        </div>
      </div>
    </div>

    <div class="dashboard">
      <aside class="sidebar">
        <div class="logo-area">
          <div class="logo-icon"><i class="fas fa-utensils"></i></div>
          <div class="logo-text">PantryPal</div>
        </div>

        <div class="nav-item active">
          <i class="fas fa-chart-line"></i>
          <span>Dashboard</span>
        </div>

        <div class="nav-item">
          <i class="fas fa-box-open"></i>
          <span>Inventory</span>
        </div>

        <div class="nav-item">
          <i class="fas fa-calendar-alt"></i>
          <span>Meal Plan</span>
        </div>

        <div class="nav-item donation">
          <i class="fas fa-hand-holding-heart"></i>
          <span>Donate</span>
        </div>

        <div class="nav-item">
          <i class="fas fa-chart-pie"></i>
          <span>Analytics</span>
        </div>

        <div class="nav-item">
          <i class="fas fa-cog"></i>
          <span>Settings</span>
        </div>

        <hr>
      </aside>

      <div class="main-content">
        <div class="top-bar">
          <div class="page-title"><h2>Manage Inventory</h2></div>
          <div style="display: flex; gap: 16px; align-items: center;">
            <div class="search-wrapper">
              <i class="fas fa-search"></i>
              <input type="text" v-model="searchQuery" placeholder="Search any food (milk, rice, ice cream...)" autocomplete="off">
            </div>
            <div class="action-icons"><i class="fas fa-sliders-h"></i></div>
          </div>
        </div>

        <!-- ALL CATEGORY -->
        <div class="storage-category" :class="{ expanded: expandedCategories.all }" id="allCategory">
          <div class="category-header" @click="toggleCategory('all')">
            <div class="cat-title"><i class="fas fa-boxes"></i><h2>All Storage</h2><div class="cat-badge">{{ getCategoryCount('all') }} items</div></div>
            <div class="expand-cat-icon"><i class="fas fa-chevron-down"></i></div>
          </div>
          <div class="category-items">
            <div class="food-grid" data-category="all" id="allGrid">
              <div v-for="item in getFilteredAndSortedItems('all')" :key="item.id" class="food-item-card" :class="{ 'selected-for-donation': selectedDonationIds.has(item.id), 'hidden-by-search': isHiddenBySearch(item) }" :data-food-id="item.id" :data-food-name="item.name" :data-search-terms="`${item.name} ${item.volume} ${item.searchTerms}`" :data-category="item.category">
                <div class="checkbox-overlay">
                  <input type="checkbox" class="donation-checkbox" :checked="selectedDonationIds.has(item.id)" @change="toggleDonationSelection(item.id)">
                </div>
                <div class="food-preview">
                  <span class="food-name">{{ escapeHtml(item.name) }}</span>
                  <span class="food-volume">{{ item.volume }}</span>
                </div>
                <div class="food-details-mini">
                  <span v-if="item.expiryDays <= 3" class="expiry-warning"><i class="fas fa-exclamation-triangle"></i> expires in {{ item.expiryDays }}d</span>
                  <span v-else><i class="fas fa-clock"></i> Exp: {{ item.expiryDays }} days</span>
                  <span><i class="fas fa-map-marker-alt"></i> {{ item.location }}</span>
                </div>
                <div class="usage-bar">
                  <div class="usage-fill" :class="item.quantityLevel || 'high'" :style="{ width: quantityWidths[item.quantityLevel as keyof typeof quantityWidths] || quantityWidths.high }"></div>
                </div>
                <span class="quantity-label" :class="item.quantityLevel || 'high'">{{ quantityLabels[item.quantityLevel as keyof typeof quantityLabels] || quantityLabels.high }}</span>
                <div class="food-extra-actions">
                  <button class="mini-btn delete-item" @click="deleteItem(item.id)"><i class="fas fa-trash"></i> Delete</button>
                  <button class="mini-btn use-item" @click="openUseModal(item.id)"><i class="fas fa-check"></i> Use</button>
                  <button class="mini-btn donate-mini" @click="singleDonate(item.id)"><i class="fas fa-hand-holding-heart"></i> Donate</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FRIDGE CATEGORY -->
        <div class="storage-category" :class="{ expanded: expandedCategories.fridge }" id="fridgeCategory">
          <div class="category-header" @click="toggleCategory('fridge')">
            <div class="cat-title"><i class="fas fa-temperature-low"></i><h2>Fridge</h2><div class="cat-badge">{{ getCategoryCount('fridge') }} items</div></div>
            <div class="expand-cat-icon"><i class="fas fa-chevron-down"></i></div>
          </div>
          <div class="category-items">
            <div class="food-grid" data-category="fridge" id="fridgeGrid">
              <div v-for="item in getFilteredAndSortedItems('fridge')" :key="item.id" class="food-item-card" :class="{ 'selected-for-donation': selectedDonationIds.has(item.id), 'hidden-by-search': isHiddenBySearch(item) }" :data-food-id="item.id" :data-food-name="item.name" :data-search-terms="`${item.name} ${item.volume} ${item.searchTerms}`" :data-category="item.category">
                <div class="checkbox-overlay">
                  <input type="checkbox" class="donation-checkbox" :checked="selectedDonationIds.has(item.id)" @change="toggleDonationSelection(item.id)">
                </div>
                <div class="food-preview">
                  <span class="food-name">{{ escapeHtml(item.name) }}</span>
                  <span class="food-volume">{{ item.volume }}</span>
                </div>
                <div class="food-details-mini">
                  <span v-if="item.expiryDays <= 3" class="expiry-warning"><i class="fas fa-exclamation-triangle"></i> expires in {{ item.expiryDays }}d</span>
                  <span v-else><i class="fas fa-clock"></i> Exp: {{ item.expiryDays }} days</span>
                  <span><i class="fas fa-map-marker-alt"></i> {{ item.location }}</span>
                </div>
                <div class="usage-bar">
                  <div class="usage-fill" :class="item.quantityLevel || 'high'" :style="{ width: quantityWidths[item.quantityLevel as keyof typeof quantityWidths] || quantityWidths.high }"></div>
                </div>
                <span class="quantity-label" :class="item.quantityLevel || 'high'">{{ quantityLabels[item.quantityLevel as keyof typeof quantityLabels] || quantityLabels.high }}</span>
                <div class="food-extra-actions">
                  <button class="mini-btn delete-item" @click="deleteItem(item.id)"><i class="fas fa-trash"></i> Delete</button>
                  <button class="mini-btn use-item" @click="openUseModal(item.id)"><i class="fas fa-check"></i> Use</button>
                  <button class="mini-btn donate-mini" @click="singleDonate(item.id)"><i class="fas fa-hand-holding-heart"></i> Donate</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PANTRY CATEGORY -->
        <div class="storage-category" :class="{ expanded: expandedCategories.pantry }" id="pantryCategory">
          <div class="category-header" @click="toggleCategory('pantry')">
            <div class="cat-title"><i class="fas fa-cabinet-filing"></i><h2>Pantry</h2><div class="cat-badge">{{ getCategoryCount('pantry') }} items</div></div>
            <div class="expand-cat-icon"><i class="fas fa-chevron-down"></i></div>
          </div>
          <div class="category-items">
            <div class="food-grid" data-category="pantry" id="pantryGrid">
              <div v-for="item in getFilteredAndSortedItems('pantry')" :key="item.id" class="food-item-card" :class="{ 'selected-for-donation': selectedDonationIds.has(item.id), 'hidden-by-search': isHiddenBySearch(item) }" :data-food-id="item.id" :data-food-name="item.name" :data-search-terms="`${item.name} ${item.volume} ${item.searchTerms}`" :data-category="item.category">
                <div class="checkbox-overlay">
                  <input type="checkbox" class="donation-checkbox" :checked="selectedDonationIds.has(item.id)" @change="toggleDonationSelection(item.id)">
                </div>
                <div class="food-preview">
                  <span class="food-name">{{ escapeHtml(item.name) }}</span>
                  <span class="food-volume">{{ item.volume }}</span>
                </div>
                <div class="food-details-mini">
                  <span v-if="item.expiryDays <= 3" class="expiry-warning"><i class="fas fa-exclamation-triangle"></i> expires in {{ item.expiryDays }}d</span>
                  <span v-else><i class="fas fa-clock"></i> Exp: {{ item.expiryDays }} days</span>
                  <span><i class="fas fa-map-marker-alt"></i> {{ item.location }}</span>
                </div>
                <div class="usage-bar">
                  <div class="usage-fill" :class="item.quantityLevel || 'high'" :style="{ width: quantityWidths[item.quantityLevel as keyof typeof quantityWidths] || quantityWidths.high }"></div>
                </div>
                <span class="quantity-label" :class="item.quantityLevel || 'high'">{{ quantityLabels[item.quantityLevel as keyof typeof quantityLabels] || quantityLabels.high }}</span>
                <div class="food-extra-actions">
                  <button class="mini-btn delete-item" @click="deleteItem(item.id)"><i class="fas fa-trash"></i> Delete</button>
                  <button class="mini-btn use-item" @click="openUseModal(item.id)"><i class="fas fa-check"></i> Use</button>
                  <button class="mini-btn donate-mini" @click="singleDonate(item.id)"><i class="fas fa-hand-holding-heart"></i> Donate</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FREEZER CATEGORY -->
        <div class="storage-category" :class="{ expanded: expandedCategories.freezer }" id="freezerCategory">
          <div class="category-header" @click="toggleCategory('freezer')">
            <div class="cat-title"><i class="fas fa-snowflake"></i><h2>Freezer</h2><div class="cat-badge">{{ getCategoryCount('freezer') }} items</div></div>
            <div class="expand-cat-icon"><i class="fas fa-chevron-down"></i></div>
          </div>
          <div class="category-items">
            <div class="food-grid" data-category="freezer" id="freezerGrid">
              <div v-for="item in getFilteredAndSortedItems('freezer')" :key="item.id" class="food-item-card" :class="{ 'selected-for-donation': selectedDonationIds.has(item.id), 'hidden-by-search': isHiddenBySearch(item) }" :data-food-id="item.id" :data-food-name="item.name" :data-search-terms="`${item.name} ${item.volume} ${item.searchTerms}`" :data-category="item.category">
                <div class="checkbox-overlay">
                  <input type="checkbox" class="donation-checkbox" :checked="selectedDonationIds.has(item.id)" @change="toggleDonationSelection(item.id)">
                </div>
                <div class="food-preview">
                  <span class="food-name">{{ escapeHtml(item.name) }}</span>
                  <span class="food-volume">{{ item.volume }}</span>
                </div>
                <div class="food-details-mini">
                  <span v-if="item.expiryDays <= 3" class="expiry-warning"><i class="fas fa-exclamation-triangle"></i> expires in {{ item.expiryDays }}d</span>
                  <span v-else><i class="fas fa-clock"></i> Exp: {{ item.expiryDays }} days</span>
                  <span><i class="fas fa-map-marker-alt"></i> {{ item.location }}</span>
                </div>
                <div class="usage-bar">
                  <div class="usage-fill" :class="item.quantityLevel || 'high'" :style="{ width: quantityWidths[item.quantityLevel as keyof typeof quantityWidths] || quantityWidths.high }"></div>
                </div>
                <span class="quantity-label" :class="item.quantityLevel || 'high'">{{ quantityLabels[item.quantityLevel as keyof typeof quantityLabels] || quantityLabels.high }}</span>
                <div class="food-extra-actions">
                  <button class="mini-btn delete-item" @click="deleteItem(item.id)"><i class="fas fa-trash"></i> Delete</button>
                  <button class="mini-btn use-item" @click="openUseModal(item.id)"><i class="fas fa-check"></i> Use</button>
                  <button class="mini-btn donate-mini" @click="singleDonate(item.id)"><i class="fas fa-hand-holding-heart"></i> Donate</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- COUNTERTOP CATEGORY -->
        <div class="storage-category" :class="{ expanded: expandedCategories.counter }" id="counterCategory">
          <div class="category-header" @click="toggleCategory('counter')">
            <div class="cat-title"><i class="fas fa-blender"></i><h2>Countertop</h2><div class="cat-badge">{{ getCategoryCount('counter') }} items</div></div>
            <div class="expand-cat-icon"><i class="fas fa-chevron-down"></i></div>
          </div>
          <div class="category-items">
            <div class="food-grid" data-category="counter" id="counterGrid">
              <div v-for="item in getFilteredAndSortedItems('counter')" :key="item.id" class="food-item-card" :class="{ 'selected-for-donation': selectedDonationIds.has(item.id), 'hidden-by-search': isHiddenBySearch(item) }" :data-food-id="item.id" :data-food-name="item.name" :data-search-terms="`${item.name} ${item.volume} ${item.searchTerms}`" :data-category="item.category">
                <div class="checkbox-overlay">
                  <input type="checkbox" class="donation-checkbox" :checked="selectedDonationIds.has(item.id)" @change="toggleDonationSelection(item.id)">
                </div>
                <div class="food-preview">
                  <span class="food-name">{{ escapeHtml(item.name) }}</span>
                  <span class="food-volume">{{ item.volume }}</span>
                </div>
                <div class="food-details-mini">
                  <span v-if="item.expiryDays <= 3" class="expiry-warning"><i class="fas fa-exclamation-triangle"></i> expires in {{ item.expiryDays }}d</span>
                  <span v-else><i class="fas fa-clock"></i> Exp: {{ item.expiryDays }} days</span>
                  <span><i class="fas fa-map-marker-alt"></i> {{ item.location }}</span>
                </div>
                <div class="usage-bar">
                  <div class="usage-fill" :class="item.quantityLevel || 'high'" :style="{ width: quantityWidths[item.quantityLevel as keyof typeof quantityWidths] || quantityWidths.high }"></div>
                </div>
                <span class="quantity-label" :class="item.quantityLevel || 'high'">{{ quantityLabels[item.quantityLevel as keyof typeof quantityLabels] || quantityLabels.high }}</span>
                <div class="food-extra-actions">
                  <button class="mini-btn delete-item" @click="deleteItem(item.id)"><i class="fas fa-trash"></i> Delete</button>
                  <button class="mini-btn use-item" @click="openUseModal(item.id)"><i class="fas fa-check"></i> Use</button>
                  <button class="mini-btn donate-mini" @click="singleDonate(item.id)"><i class="fas fa-hand-holding-heart"></i> Donate</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- NEAR EXPIRY CATEGORY -->
        <div class="storage-category" :class="{ expanded: expandedCategories.expiry }" id="expiryCategory">
          <div class="category-header" @click="toggleCategory('expiry')">
            <div class="cat-title"><i class="fas fa-hourglass-half"></i><h2>Near Expiry</h2><div class="cat-badge">{{ getNearExpiryCount() }} items</div></div>
            <div class="expand-cat-icon"><i class="fas fa-chevron-down"></i></div>
          </div>
          <div class="category-items">
            <div class="food-grid" id="expiryGrid">
              <div v-for="item in getNearExpiryItems()" :key="item.id" class="food-item-card" :class="{ 'selected-for-donation': selectedDonationIds.has(item.id), 'hidden-by-search': isHiddenBySearch(item) }" :data-food-id="item.id" :data-food-name="item.name" :data-search-terms="`${item.name} ${item.volume} ${item.searchTerms}`" :data-category="item.category">
                <div class="checkbox-overlay">
                  <input type="checkbox" class="donation-checkbox" :checked="selectedDonationIds.has(item.id)" @change="toggleDonationSelection(item.id)">
                </div>
                <div class="food-preview">
                  <span class="food-name">{{ escapeHtml(item.name) }}</span>
                  <span class="food-volume">{{ item.volume }}</span>
                </div>
                <div class="food-details-mini">
                  <span v-if="item.expiryDays <= 3" class="expiry-warning"><i class="fas fa-exclamation-triangle"></i> expires in {{ item.expiryDays }}d</span>
                  <span v-else><i class="fas fa-clock"></i> Exp: {{ item.expiryDays }} days</span>
                  <span><i class="fas fa-map-marker-alt"></i> {{ item.location }}</span>
                </div>
                <div class="usage-bar">
                  <div class="usage-fill" :class="item.quantityLevel || 'high'" :style="{ width: quantityWidths[item.quantityLevel as keyof typeof quantityWidths] || quantityWidths.high }"></div>
                </div>
                <span class="quantity-label" :class="item.quantityLevel || 'high'">{{ quantityLabels[item.quantityLevel as keyof typeof quantityLabels] || quantityLabels.high }}</span>
                <div class="food-extra-actions">
                  <button class="mini-btn delete-item" @click="deleteItem(item.id)"><i class="fas fa-trash"></i> Delete</button>
                  <button class="mini-btn use-item" @click="openUseModal(item.id)"><i class="fas fa-check"></i> Use</button>
                  <button class="mini-btn donate-mini" @click="singleDonate(item.id)"><i class="fas fa-hand-holding-heart"></i> Donate</button>
                </div>
              </div>
              <div v-if="getNearExpiryItems().length === 0" style="padding:20px; text-align:center; color:#7e95b0;">✨ No items near expiry! Great job managing food.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="right-sidebar">
      <div class="right-box">
        <div class="bulk-select-controls">
          <span class="selection-count" id="selectionCount">{{ selectedDonationIds.size }} selected</span>
          <button class="right-btn" id="selectAllBtn" @click="selectAllVisible"><i class="fas fa-check-double"></i> Select All</button>
          <button class="right-btn" id="clearSelectionBtn" @click="clearAllSelections"><i class="fas fa-times"></i> Clear</button>
          <span class="search-results-info" id="searchResultsInfo">{{ searchResultsInfo }}</span>
        </div>

        <button class="right-btn" id="filterBtn" @click="cycleFilterMode">
          <i class="fas fa-filter"></i> Filter: {{ getFilterLabel(currentFilter) }}
        </button>
        <button class="right-btn" id="sortBtn" @click="cycleSortMode">
          <i class="fas fa-sort"></i> Sort: {{ getSortLabel(currentSort) }}
        </button>
      </div>

      <div class="right-box">
        <button class="donate-bulk-btn" id="donateBulkBtn" :disabled="selectedDonationIds.size === 0" @click="bulkDonateAction">
          <i class="fas fa-hand-holding-heart"></i> Donate Selected
        </button>
      </div>

      <div class="right-box">
        <button class="right-btn">
          <i class="fas fa-bolt"></i> Meal Plan
        </button>
      </div>

      <div class="floating-add" id="addRight" @click="openAddModal">
        +
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'FridgeMaster',
  data() {
    return {
      inventory: [
        { id: "f1", name: "Susu UltraMilk", volume: "500ml", location: "Middle shelf", expiryDays: 5, category: "fridge", searchTerms: "milk dairy", quantityLevel: "high" },
        { id: "f2", name: "Fresh Spinach", volume: "200g bag", location: "Veg drawer", expiryDays: 2, category: "fridge", searchTerms: "spinach greens", quantityLevel: "low" },
        { id: "f3", name: "Greek Yogurt", volume: "750g tub", location: "Upper shelf", expiryDays: 8, category: "fridge", searchTerms: "yogurt probiotic", quantityLevel: "half" },
        { id: "f4", name: "Cheddar Cheese", volume: "200g block", location: "Dairy zone", expiryDays: 12, category: "fridge", searchTerms: "cheese dairy", quantityLevel: "full" },
        { id: "f5", name: "Orange Juice", volume: "1L", location: "Door shelf", expiryDays: 6, category: "fridge", searchTerms: "juice citrus", quantityLevel: "high" },
        { id: "p1", name: "Brown Rice", volume: "2kg bag", location: "Dry shelf", expiryDays: 180, category: "pantry", searchTerms: "rice grain", quantityLevel: "full" },
        { id: "p2", name: "Canned Tuna", volume: "150g", location: "Cabinet", expiryDays: 90, category: "pantry", searchTerms: "tuna fish canned", quantityLevel: "high" },
        { id: "p3", name: "Spaghetti Pasta", volume: "500g", location: "Pantry box", expiryDays: 200, category: "pantry", searchTerms: "pasta noodles", quantityLevel: "half" },
        { id: "p4", name: "Olive Oil", volume: "750ml", location: "Cool shelf", expiryDays: 60, category: "pantry", searchTerms: "oil cooking", quantityLevel: "full" },
        { id: "z1", name: "Frozen Berries", volume: "400g", location: "Freezer drawer", expiryDays: 45, category: "freezer", searchTerms: "berries frozen fruit", quantityLevel: "high" },
        { id: "z2", name: "Ice Cream Vanilla", volume: "1L tub", location: "Top freezer", expiryDays: 30, category: "freezer", searchTerms: "icecream dessert", quantityLevel: "half" },
        { id: "z3", name: "Frozen Veg Mix", volume: "500g", location: "Middle drawer", expiryDays: 60, category: "freezer", searchTerms: "vegetables mix", quantityLevel: "low" },
        { id: "z4", name: "Chicken Breast", volume: "600g", location: "Freezer bin", expiryDays: 40, category: "freezer", searchTerms: "chicken meat", quantityLevel: "full" },
        { id: "c1", name: "Avocados", volume: "3 pcs", location: "Fruit bowl", expiryDays: 3, category: "counter", searchTerms: "avocado fruit", quantityLevel: "low" },
        { id: "c2", name: "Bananas", volume: "5 pcs", location: "Counter hook", expiryDays: 2, category: "counter", searchTerms: "banana fruit", quantityLevel: "half" },
        { id: "c3", name: "Garlic Bulb", volume: "1 head", location: "Small basket", expiryDays: 14, category: "counter", searchTerms: "garlic spice", quantityLevel: "high" }
      ],
      nextId: 100,
      currentFilter: 'all',
      currentSort: 'name',
      filterModes: ['all', 'near-expiry', 'fridge', 'pantry', 'freezer', 'counter'],
      sortModes: ['name', 'expiry', 'category'],
      searchQuery: '',
      selectedDonationIds: new Set(),
      expandedCategories: {
        all: false,
        fridge: true,
        pantry: false,
        freezer: false,
        counter: false,
        expiry: false
      },
      addModalOpen: false,
      useModalOpen: false,
      currentUseItemId: null as string | null,
      selectedUseQuantity: 'high',
      selectedQuantityLevel: 'low',
      selectedStorage: 'fridge',
      newItem: {
        name: '',
        desc: '',
        expiryDays: 5,
        category: 'fridge',
        volume: '1 item'
      },
      quantityWidths: { low: '25%', half: '50%', high: '75%', full: '100%' },
      quantityLabels: { low: 'Low', half: 'Half', high: 'High', full: 'Full' },
      qtyMap: {
        low:  { percent: "25%", color: "#dc2626", label: "Low (25%)" },
        half: { percent: "50%", color: "#d97706", label: "Half (50%)" },
        high: { percent: "75%", color: "#16a34a", label: "High (75%)" },
        full: { percent: "100%", color: "#6b7280", label: "Full (100%)" }
      }
    }
  },
  computed: {
    searchResultsInfo() {
      if (this.searchQuery) {
        const count = this.getFilteredAndSortedItems('all').length;
        return `found ${count} matching`;
      }
      return '';
    },
    qtyProgress() {
      return this.qtyMap[this.selectedQuantityLevel as keyof typeof this.qtyMap];
    },
    useItemName() {
      const item = this.inventory.find(i => i.id === this.currentUseItemId);
      return item ? item.name : '';
    }
  },
  watch: {
    searchQuery() {
      // search applied automatically via computed getFilteredAndSortedItems
    }
  },
  methods: {
    getFilteredAndSortedItems(category: string) {
      let items = category === 'all' ? [...this.inventory] : this.inventory.filter(i => i.category === category);

      // Apply filter
      if (this.currentFilter === 'near-expiry') {
        items = items.filter(i => i.expiryDays <= 3);
      } else if (['fridge', 'pantry', 'freezer', 'counter'].includes(this.currentFilter)) {
        items = items.filter(i => i.category === this.currentFilter);
      }

      // Apply search
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        items = items.filter(item => {
          const combined = `${item.name} ${item.volume} ${item.searchTerms || ''}`.toLowerCase();
          return combined.includes(query);
        });
      }

      // Apply sort
      items.sort((a, b) => {
        if (this.currentSort === 'expiry') return a.expiryDays - b.expiryDays;
        if (this.currentSort === 'category') return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
      });

      return items;
    },
    getNearExpiryItems() {
      return this.inventory.filter(i => i.expiryDays <= 3);
    },
    getNearExpiryCount() {
      return this.getNearExpiryItems().length;
    },
    getCategoryCount(category: string) {
      if (category === 'all') {
        let items = [...this.inventory];
        if (this.currentFilter === 'near-expiry') {
          items = items.filter(i => i.expiryDays <= 3);
        } else if (['fridge', 'pantry', 'freezer', 'counter'].includes(this.currentFilter)) {
          items = items.filter(i => i.category === this.currentFilter);
        }
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          items = items.filter(item => {
            const combined = `${item.name} ${item.volume} ${item.searchTerms || ''}`.toLowerCase();
            return combined.includes(query);
          });
        }
        return items.length;
      }
      const items = this.getFilteredAndSortedItems(category);
      return items.length;
    },
    isHiddenBySearch(item: { id: string; name: string; volume: string; location: string; expiryDays: number; category: string; searchTerms: string; quantityLevel: string; }) {
      if (!this.searchQuery) return false;
      const query = this.searchQuery.toLowerCase();
      const combined = `${item.name} ${item.volume} ${item.searchTerms || ''}`.toLowerCase();
      return !combined.includes(query);
    },
    toggleCategory(cat: string) {
      this.expandedCategories[cat as keyof typeof this.expandedCategories] = !this.expandedCategories[cat as keyof typeof this.expandedCategories];
    },
    escapeHtml(str: string) {
      return str.replace(/[&<>]/g, function(m: string) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
      });
    },
    deleteItem(id: unknown) {
      this.inventory = this.inventory.filter(i => i.id !== id);
      this.selectedDonationIds.delete(id);
      this.notifyMessage(`Item removed.`);
    },
    openUseModal(id: string) {
      const item = this.inventory.find(i => i.id === id);
      if (!item) return;
      this.currentUseItemId = id;
      this.selectedUseQuantity = item.quantityLevel || 'high';
      this.useModalOpen = true;
    },
    closeUseModal() {
      this.useModalOpen = false;
      this.currentUseItemId = null;
    },
    finishItem() {
      if (!this.currentUseItemId) return;
      const item = this.inventory.find(i => i.id === this.currentUseItemId);
      if (!item) return;
      this.inventory = this.inventory.filter(i => i.id !== this.currentUseItemId);
      this.selectedDonationIds.delete(this.currentUseItemId);
      this.closeUseModal();
      this.notifyMessage(`Finished "${item.name}"`);
    },
    confirmUse() {
      if (!this.currentUseItemId) return;
      const item = this.inventory.find(i => i.id === this.currentUseItemId);
      if (!item) return;
      item.quantityLevel = this.selectedUseQuantity;
      this.closeUseModal();
      this.notifyMessage(`Updated "${item.name}" usage`);
    },
    singleDonate(id: string) {
      this.inventory = this.inventory.filter(i => i.id !== id);
      this.selectedDonationIds.delete(id);
      this.notifyMessage(`Donated item. Thank you for sharing!`);
    },
    toggleDonationSelection(id: string) {
      if (this.selectedDonationIds.has(id)) {
        this.selectedDonationIds.delete(id);
      } else {
        this.selectedDonationIds.add(id);
      }
    },
    selectAllVisible() {
      const visibleItems = this.getFilteredAndSortedItems('all');
      visibleItems.forEach(item => {
        this.selectedDonationIds.add(item.id);
      });
    },
    clearAllSelections() {
      this.selectedDonationIds.clear();
    },
    bulkDonateAction() {
      if (this.selectedDonationIds.size === 0) return;
      const idsToRemove = Array.from(this.selectedDonationIds);
      const names = idsToRemove.map(id => {
        const item = this.inventory.find(i => i.id === id);
        return item ? item.name : 'item';
      });
      this.inventory = this.inventory.filter(i => !this.selectedDonationIds.has(i.id));
      this.selectedDonationIds.clear();
      this.notifyMessage(`Donated ${idsToRemove.length} item(s): ${names.join(', ')}. Thank you for reducing waste!`);
    },
    getFilterLabel(filter: string) {
      const labels = {
        'near-expiry': 'Near Expiry',
        'fridge': 'Fridge',
        'pantry': 'Pantry',
        'freezer': 'Freezer',
        'counter': 'Countertop',
        'all': 'All'
      };
      return labels[filter as keyof typeof labels] || 'All';
    },
    getSortLabel(sort: string) {
      const labels = {
        'expiry': 'Expiry',
        'category': 'Category',
        'name': 'Name'
      };
      return labels[sort as keyof typeof labels] || 'Name';
    },
    cycleFilterMode() {
      const nextIndex = (this.filterModes.indexOf(this.currentFilter) + 1) % this.filterModes.length;
      this.currentFilter = this.filterModes[nextIndex]!;
      this.notifyMessage(`🧪 Filter set to ${this.getFilterLabel(this.currentFilter)}.`);
    },
    cycleSortMode() {
      const nextIndex = (this.sortModes.indexOf(this.currentSort) + 1) % this.sortModes.length;
      this.currentSort = this.sortModes[nextIndex]!;
      this.notifyMessage(`🔃 Sort set to ${this.getSortLabel(this.currentSort)}.`);
    },
    setQuantityLevel(level: string) {
      this.selectedQuantityLevel = level;
    },
    openAddModal() {
      this.newItem = {
        name: '',
        desc: '',
        expiryDays: 5,
        category: 'fridge',
        volume: '1 item'
      };
      this.selectedStorage = 'fridge';
      this.selectedQuantityLevel = 'low';
      this.addModalOpen = true;
    },
    closeAddModal() {
      this.addModalOpen = false;
    },
    confirmAdd() {
      if (!this.newItem.name) {
        this.notifyMessage("Please enter a name");
        return;
      }

      const newItem = {
        id: `item_${this.nextId++}`,
        name: this.newItem.name,
        volume: this.newItem.volume || "1 item",
        location: "Custom",
        expiryDays: this.newItem.expiryDays || 5,
        category: this.selectedStorage,
        searchTerms: this.newItem.name.toLowerCase(),
        quantityLevel: this.selectedQuantityLevel
      };

      this.inventory.push(newItem);
      this.closeAddModal();
      this.notifyMessage(`Added "${newItem.name}"`);
    },
    notifyMessage(msg: string) {
      const toast = document.createElement('div');
      toast.innerText = msg;
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.backgroundColor = '#1f2f3e';
      toast.style.color = '#fff';
      toast.style.padding = '12px 28px';
      toast.style.borderRadius = '60px';
      toast.style.fontSize = '0.85rem';
      toast.style.zIndex = '10000';
      toast.style.fontWeight = '500';
      document.body.appendChild(toast);
      setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 2400);
    }
  }
}
</script>

<style scoped>
/* Your existing CSS goes here - copy all styles from the original file */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #eef2f8;
  font-family: 'Inter', sans-serif;
  color: #0a1c2f;
  padding: 24px 20px;
}

.dashboard {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

/* SIDEBAR */
.sidebar {
  flex: 0 0 110px;
  background: white;
  border-radius: 25px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.02), 0 2px 6px rgba(0, 0, 0, 0.02);
  padding: 28px 20px;
  height: fit-content;
}
.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
  padding-left: 6px;
}
.logo-icon {
  background: #2c7a4d;
  width: 40px;
  height: 40px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
}
.logo-text {
  font-weight: 800;
  font-size: 1.6rem;
  letter-spacing: -0.3px;
  color: #1e3a2f;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  margin: 6px 0;
  border-radius: 24px;
  font-weight: 500;
  color: #2c3e4e;
  cursor: default;
  transition: 0.2s;
}
.nav-item i { width: 24px; color: #5b7a9a; }
.nav-item.active {
  background: #eef6ef;
  color: #2c6e49;
}
.nav-item.active i { color: #2c6e49; }
hr { margin: 20px 0 16px; border-top: 1px solid #e9edf2; }

/* MAIN CONTENT */
.main-content { flex: 1; min-width: 280px; }
.top-bar {
  background: white;
  border-radius: 32px;
  padding: 16px 26px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
}
.page-title h2 { font-size: 1.7rem; font-weight: 700; }
.search-wrapper {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 60px;
  padding: 8px 20px;
  gap: 10px;
  min-width: 240px;
}
.search-wrapper i { color: #7e95b0; }
#searchInput {
  border: none;
  background: transparent;
  font-size: 0.9rem;
  outline: none;
  width: 220px;
  font-family: 'Inter', sans-serif;
}
.action-icons { display: flex; gap: 22px; font-size: 1.3rem; color: #5f7f9e; }

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
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
.bulk-select-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.select-all-btn, .clear-selection-btn, .right-btn {
  background: #f1f5f9;
  border: none;
  padding: 10px 16px;
  border-radius: 40px;
  font-weight: 500;
  font-size: 0.9rem;
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
  padding: 10px 28px;
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
  padding: 6px 14px;
  border-radius: 40px;
  font-size: 0.8rem;
  font-weight: 600;
}
.search-results-info {
  font-size: 0.75rem;
  color: #5f7f9e;
}

/* EXPANDABLE CATEGORY STYLES (unified) */
.storage-category {
  background: white;
  border-radius: 32px;
  margin-bottom: 24px;
  overflow: hidden;
  border: 1px solid #eef2fa;
}
.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  cursor: pointer;
  background: white;
  transition: background 0.2s;
}
.category-header:hover { background: #fafdff; }
.cat-title {
  display: flex;
  align-items: center;
  gap: 14px;
}
.cat-title i {
  font-size: 1.9rem;
  color: #2c7a4d;
}
.cat-title h2 {
  font-size: 1.6rem;
  font-weight: 700;
}
.cat-badge {
  background: #eef2f9;
  border-radius: 40px;
  padding: 4px 14px;
  font-size: 0.8rem;
  font-weight: 600;
}
.expand-cat-icon {
  font-size: 1.3rem;
  color: #6b8cae;
  transition: transform 0.3s;
}
.category-items {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.45s cubic-bezier(0.2, 0.9, 0.4, 1.1), opacity 0.35s ease;
  background: #fefefe;
  border-top: 1px solid transparent;
}
.storage-category.expanded .category-items {
  max-height: 1800px;
  opacity: 1;
  padding: 8px 24px 24px 24px;
  border-top-color: #eef2fa;
}
.storage-category.expanded .expand-cat-icon {
  transform: rotate(180deg);
}
.food-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 12px;
}
.food-item-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  border: 1px solid #edf2f8;
  transition: 0.2s;
  position: relative;
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
  top: 45px;
  right: 25px;
  z-index: 5;
}
.donation-checkbox {
  width: 22px;
  height: 22px;
  cursor: pointer;
  accent-color: #2c7a4d;
  transform: scale(1.1);
}
.food-preview {
  padding: 14px 18px 8px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.food-name {
  font-weight: 700;
  font-size: 1.1rem;
}
.food-volume {
  background: #f0f4fa;
  border-radius: 60px;
  padding: 4px 12px;
  font-size: 0.7rem;
  font-weight: 600;
}
.food-details-mini {
  display: flex;
  gap: 12px;
  padding: 0 18px 8px;
  font-size: 0.7rem;
  color: #577190;
  flex-wrap: wrap;
}
.food-extra-actions {
  display: flex;
  gap: 12px;
  padding: 10px 18px 18px;
  border-top: 1px solid #eff3f8;
  margin-top: 6px;
}
.mini-btn {
  background: #f1f5f9;
  border: none;
  border-radius: 40px;
  padding: 6px 14px;
  font-size: 0.7rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.delete-btn { background: #fee9e7; color: #bc5a4c; }
.use-btn { background: #eef2ff; color: #2c5282; }
.donate-mini { background: #e0f2e9; color: #2a7f49; }
.expiry-warning {
  background: #fff0e0;
  border-radius: 20px;
  padding: 2px 10px;
  font-size: 0.7rem;
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
@media (max-width: 780px) {
  .sidebar { flex: 0 0 100%; }
  .dashboard { flex-direction: column; }
}

/* RIGHT SIDEBAR */
.right-sidebar {
  position: fixed;
  top: 24px;
  right: 20px;
  width: 230px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 999;
}

.right-box {
  background: white;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.right-btn {
  background: #f1f5f9;
  border: none;
  padding: 10px;
  border-radius: 40px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
}

.right-btn:hover {
  background: #e2e8f0;
}

.right-primary {
  background: #2c7a4d;
  color: white;
}

.floating-add {
  background: #0d6100;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  border-radius: 20px;
  cursor: pointer;
  color: white;
  font-weight: bold;
}

/* kasih ruang biar ga ketiban sidebar kanan */
.main-content {
  margin-right: 220px;
}

/* usage progress bar */
.usage-bar {
  width: 100%;
  height: clamp(6px, 0.6vw, 10px);
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
.usage-fill.low { background: #ef4444; }
.usage-fill.half { background: #eab308; }
.usage-fill.high { background: #22c55e; }
.usage-fill.full { background: #8b8b8b; }

.quantity-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-top: 0px;
  display: inline-block;
  padding: 3px 12px;
  border-radius: 12px;
  margin-left: 18px;
  margin-bottom: 8px;
}

.quantity-label.low { background: #fee2e2; color: #dc2626; }
.quantity-label.half { background: #fef3c7; color: #d97706; }
.quantity-label.high { background: #dcfce7; color: #16a34a; }
.quantity-label.full { background: #f3f4f6; color: #6b7280; }

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

.qty-option.low { border-color: #fca5a5; color: #dc2626; }
.qty-option.low:hover { background: #fee2e2; }
.qty-option.half { border-color: #fde047; color: #d97706; }
.qty-option.half:hover { background: #fef3c7; }
.qty-option.high { border-color: #86efac; color: #16a34a; }
.qty-option.high:hover { background: #dcfce7; }
.qty-option.full { border-color: #d1d5db; color: #6b7280; }
.qty-option.full:hover { background: #f3f4f6; }

.qty-option.selected {
  border-width: 2px;
  transform: scale(1.05);
}

.qty-option.low.selected { border-color: #dc2626; background: #fee2e2; }
.qty-option.half.selected { border-color: #d97706; background: #fef3c7; }
.qty-option.high.selected { border-color: #16a34a; background: #dcfce7; }
.qty-option.full.selected { border-color: #6b7280; background: #f3f4f6; }

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
  box-shadow: 0 20px 40px rgba(0,0,0,0.08);
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

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.row input[type="text"] {
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

.food-preview,
.food-details-mini,
.usage-bar,
.quantity-label,
.food-extra-actions {
  padding-left: 18px;
  padding-right: 18px;
}
</style>

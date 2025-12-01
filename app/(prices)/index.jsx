import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import BarcodeScanner from "../../components/BarcodeScanner";
import { useGlobalContext } from "../../context/GlobalProvider";
import {
  getHouseholdProducts,
  getHouseholdStores,
  createProduct,
  createStore,
  getProductByBarcode,
  addPriceEntry,
  getProductPriceHistory,
  getProductLatestPrices,
  ProductCategories,
} from "../../lib/appwrite";

// Dark theme colors
const COLORS = {
  background: '#0A0A0C',
  surface: '#111114',
  card: '#1A1A1F',
  elevated: '#222228',
  border: 'rgba(255,255,255,0.1)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  accent: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#F43F5E',
};

// Category icons and colors
const CATEGORY_CONFIG = {
  groceries: { icon: "basket", color: "#10B981" },
  dairy: { icon: "water", color: "#3B82F6" },
  meat: { icon: "restaurant", color: "#EF4444" },
  produce: { icon: "leaf", color: "#22C55E" },
  frozen: { icon: "snow", color: "#06B6D4" },
  beverages: { icon: "cafe", color: "#F59E0B" },
  snacks: { icon: "fast-food", color: "#EC4899" },
  household: { icon: "home", color: "#8B5CF6" },
  personal_care: { icon: "body", color: "#F472B6" },
  other: { icon: "cube", color: "#71717A" },
};

const PriceTracker = () => {
  const { user } = useGlobalContext();
  const householdId = user?.householdId;

  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [scannerVisible, setScannerVisible] = useState(false);
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);
  const [addStoreModalVisible, setAddStoreModalVisible] = useState(false);
  const [addPriceModalVisible, setAddPriceModalVisible] = useState(false);
  const [productDetailVisible, setProductDetailVisible] = useState(false);

  // Forms
  const [newProduct, setNewProduct] = useState({ name: "", brand: "", barcode: "", category: "groceries", unit: "unit" });
  const [newStore, setNewStore] = useState({ name: "", address: "" });
  const [newPrice, setNewPrice] = useState({ productId: "", storeId: "", price: "", quantity: "1" });
  
  // Selected product for detail view
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productPriceHistory, setProductPriceHistory] = useState([]);
  const [productLatestPrices, setProductLatestPrices] = useState([]);

  const [activeTab, setActiveTab] = useState("products"); // products, stores

  const fetchData = useCallback(async () => {
    if (!householdId) return;
    
    try {
      const [productsData, storesData] = await Promise.all([
        getHouseholdProducts(householdId),
        getHouseholdStores(householdId),
      ]);
      setProducts(productsData || []);
      setStores(storesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Handle barcode scan
  const handleBarcodeScan = async ({ data }) => {
    setScannerVisible(false);
    
    try {
      // Check if product exists
      const existingProduct = await getProductByBarcode(data, householdId);
      
      if (existingProduct) {
        // Open product detail
        openProductDetail(existingProduct);
      } else {
        // Open add product modal with barcode prefilled
        setNewProduct({ ...newProduct, barcode: data, name: "", brand: "", category: "groceries", unit: "unit" });
        setAddProductModalVisible(true);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to lookup barcode");
    }
  };

  // Add new product
  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) {
      Alert.alert("Error", "Please enter a product name");
      return;
    }

    try {
      await createProduct({
        ...newProduct,
        householdId,
        userId: user.$id,
      });
      setAddProductModalVisible(false);
      setNewProduct({ name: "", brand: "", barcode: "", category: "groceries", unit: "unit" });
      fetchData();
      Alert.alert("Success", "Product added!");
    } catch (error) {
      Alert.alert("Error", "Failed to add product");
    }
  };

  // Add new store
  const handleAddStore = async () => {
    if (!newStore.name.trim()) {
      Alert.alert("Error", "Please enter a store name");
      return;
    }

    try {
      await createStore({
        ...newStore,
        householdId,
        userId: user.$id,
      });
      setAddStoreModalVisible(false);
      setNewStore({ name: "", address: "" });
      fetchData();
      Alert.alert("Success", "Store added!");
    } catch (error) {
      Alert.alert("Error", "Failed to add store");
    }
  };

  // Add price entry
  const handleAddPrice = async () => {
    if (!newPrice.productId || !newPrice.storeId || !newPrice.price) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    const price = parseFloat(newPrice.price);
    const quantity = parseFloat(newPrice.quantity) || 1;

    try {
      await addPriceEntry({
        productId: newPrice.productId,
        storeId: newPrice.storeId,
        price,
        quantity,
        pricePerUnit: price / quantity,
        userId: user.$id,
        householdId,
      });
      setAddPriceModalVisible(false);
      setNewPrice({ productId: "", storeId: "", price: "", quantity: "1" });
      
      // Refresh product detail if open
      if (selectedProduct) {
        openProductDetail(selectedProduct);
      }
      
      Alert.alert("Success", "Price recorded!");
    } catch (error) {
      Alert.alert("Error", "Failed to record price");
    }
  };

  // Open product detail
  const openProductDetail = async (product) => {
    setSelectedProduct(product);
    setProductDetailVisible(true);

    try {
      const [history, latest] = await Promise.all([
        getProductPriceHistory(product.$id),
        getProductLatestPrices(product.$id),
      ]);
      setProductPriceHistory(history || []);
      setProductLatestPrices(latest || []);
    } catch (error) {
      console.error("Error fetching product details:", error);
    }
  };

  // Quick add price for a product
  const quickAddPrice = (product) => {
    setNewPrice({ ...newPrice, productId: product.$id });
    setAddPriceModalVisible(true);
  };

  // Filter products by search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get store name by ID
  const getStoreName = (storeId) => {
    const id = typeof storeId === 'object' ? storeId.$id : storeId;
    const store = stores.find(s => s.$id === id);
    return store?.name || "Unknown Store";
  };

  // Render product card
  const renderProductCard = ({ item: product }) => {
    const categoryConfig = CATEGORY_CONFIG[product.category] || CATEGORY_CONFIG.other;
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => openProductDetail(product)}
      >
        <View style={[styles.productIcon, { backgroundColor: `${categoryConfig.color}20` }]}>
          <Ionicons name={categoryConfig.icon} size={20} color={categoryConfig.color} />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
          {product.brand && <Text style={styles.productBrand}>{product.brand}</Text>}
        </View>
        <TouchableOpacity 
          style={styles.addPriceButton}
          onPress={() => quickAddPrice(product)}
        >
          <Ionicons name="add" size={20} color={COLORS.accent} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Render store card
  const renderStoreCard = ({ item: store }) => (
    <View style={styles.storeCard}>
      <View style={styles.storeIcon}>
        <Ionicons name="storefront" size={20} color={COLORS.accent} />
      </View>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{store.name}</Text>
        {store.address && <Text style={styles.storeAddress}>{store.address}</Text>}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Price Tracker</Text>
        <TouchableOpacity style={styles.scanButton} onPress={() => setScannerVisible(true)}>
          <Ionicons name="barcode-outline" size={24} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "products" && styles.tabActive]}
          onPress={() => setActiveTab("products")}
        >
          <Ionicons 
            name="cube" 
            size={18} 
            color={activeTab === "products" ? COLORS.accent : COLORS.textTertiary} 
          />
          <Text style={[styles.tabText, activeTab === "products" && styles.tabTextActive]}>
            Products ({products.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "stores" && styles.tabActive]}
          onPress={() => setActiveTab("stores")}
        >
          <Ionicons 
            name="storefront" 
            size={18} 
            color={activeTab === "stores" ? COLORS.accent : COLORS.textTertiary} 
          />
          <Text style={[styles.tabText, activeTab === "stores" && styles.tabTextActive]}>
            Stores ({stores.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "products" ? (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.$id}
          renderItem={renderProductCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color={COLORS.textTertiary} />
              <Text style={styles.emptyTitle}>No products yet</Text>
              <Text style={styles.emptySubtitle}>Scan a barcode or add manually</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.$id}
          renderItem={renderStoreCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={64} color={COLORS.textTertiary} />
              <Text style={styles.emptyTitle}>No stores yet</Text>
              <Text style={styles.emptySubtitle}>Add your frequently visited stores</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => activeTab === "products" ? setAddProductModalVisible(true) : setAddStoreModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Barcode Scanner */}
      <BarcodeScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScan}
      />

      {/* Add Product Modal */}
      <Modal visible={addProductModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Product</Text>
              <TouchableOpacity onPress={() => setAddProductModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {newProduct.barcode && (
              <View style={styles.barcodePreview}>
                <Ionicons name="barcode" size={16} color={COLORS.accent} />
                <Text style={styles.barcodeText}>{newProduct.barcode}</Text>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Product name *"
              placeholderTextColor={COLORS.textTertiary}
              value={newProduct.name}
              onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Brand (optional)"
              placeholderTextColor={COLORS.textTertiary}
              value={newProduct.brand}
              onChangeText={(text) => setNewProduct({ ...newProduct, brand: text })}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryChip,
                    newProduct.category === key && { backgroundColor: `${config.color}30`, borderColor: config.color },
                  ]}
                  onPress={() => setNewProduct({ ...newProduct, category: key })}
                >
                  <Ionicons name={config.icon} size={16} color={newProduct.category === key ? config.color : COLORS.textSecondary} />
                  <Text style={[styles.categoryChipText, newProduct.category === key && { color: config.color }]}>
                    {key.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.submitButton} onPress={handleAddProduct}>
              <Text style={styles.submitButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Store Modal */}
      <Modal visible={addStoreModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Store</Text>
              <TouchableOpacity onPress={() => setAddStoreModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Store name *"
              placeholderTextColor={COLORS.textTertiary}
              value={newStore.name}
              onChangeText={(text) => setNewStore({ ...newStore, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Address (optional)"
              placeholderTextColor={COLORS.textTertiary}
              value={newStore.address}
              onChangeText={(text) => setNewStore({ ...newStore, address: text })}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleAddStore}>
              <Text style={styles.submitButtonText}>Add Store</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Price Modal */}
      <Modal visible={addPriceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Price</Text>
              <TouchableOpacity onPress={() => setAddPriceModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Select Store *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storeScroll}>
              {stores.map((store) => (
                <TouchableOpacity
                  key={store.$id}
                  style={[
                    styles.storeChip,
                    newPrice.storeId === store.$id && styles.storeChipActive,
                  ]}
                  onPress={() => setNewPrice({ ...newPrice, storeId: store.$id })}
                >
                  <Ionicons 
                    name="storefront" 
                    size={14} 
                    color={newPrice.storeId === store.$id ? COLORS.accent : COLORS.textSecondary} 
                  />
                  <Text style={[
                    styles.storeChipText,
                    newPrice.storeId === store.$id && styles.storeChipTextActive,
                  ]}>
                    {store.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addStoreChip} onPress={() => {
                setAddPriceModalVisible(false);
                setAddStoreModalVisible(true);
              }}>
                <Ionicons name="add" size={14} color={COLORS.textTertiary} />
                <Text style={styles.addStoreChipText}>Add Store</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.priceRow}>
              <View style={styles.priceInputContainer}>
                <Text style={styles.inputLabel}>Price *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="decimal-pad"
                  value={newPrice.price}
                  onChangeText={(text) => setNewPrice({ ...newPrice, price: text })}
                />
              </View>
              <View style={styles.quantityInputContainer}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="decimal-pad"
                  value={newPrice.quantity}
                  onChangeText={(text) => setNewPrice({ ...newPrice, quantity: text })}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleAddPrice}>
              <Text style={styles.submitButtonText}>Record Price</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Product Detail Modal */}
      <Modal visible={productDetailVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{selectedProduct?.name}</Text>
              <TouchableOpacity onPress={() => setProductDetailVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedProduct?.brand && (
              <Text style={styles.productDetailBrand}>{selectedProduct.brand}</Text>
            )}

            {/* Latest Prices by Store */}
            <Text style={styles.sectionTitle}>Latest Prices</Text>
            {productLatestPrices.length > 0 ? (
              <View style={styles.latestPricesContainer}>
                {productLatestPrices.map((entry, index) => {
                  const isLowest = index === 0 || entry.pricePerUnit === Math.min(...productLatestPrices.map(e => e.pricePerUnit));
                  return (
                    <View key={entry.$id} style={[styles.priceCard, isLowest && styles.priceCardBest]}>
                      <View style={styles.priceCardHeader}>
                        <Ionicons name="storefront" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.priceCardStore}>{getStoreName(entry.storeId)}</Text>
                        {isLowest && (
                          <View style={styles.bestPriceBadge}>
                            <Text style={styles.bestPriceText}>Best</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.priceCardPrice}>€{entry.pricePerUnit?.toFixed(2)}</Text>
                      <Text style={styles.priceCardDate}>
                        {new Date(entry.date).toLocaleDateString()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noPricesText}>No prices recorded yet</Text>
            )}

            {/* Price History */}
            <Text style={styles.sectionTitle}>Price History</Text>
            <ScrollView style={styles.historyScroll} showsVerticalScrollIndicator={false}>
              {productPriceHistory.map((entry) => (
                <View key={entry.$id} style={styles.historyItem}>
                  <View style={styles.historyItemLeft}>
                    <Text style={styles.historyPrice}>€{entry.price?.toFixed(2)}</Text>
                    <Text style={styles.historyStore}>{getStoreName(entry.storeId)}</Text>
                  </View>
                  <Text style={styles.historyDate}>
                    {new Date(entry.date).toLocaleDateString()}
                  </Text>
                </View>
              ))}
              {productPriceHistory.length === 0 && (
                <Text style={styles.noPricesText}>No history yet</Text>
              )}
            </ScrollView>

            {/* Add Price Button */}
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={() => {
                setProductDetailVisible(false);
                quickAddPrice(selectedProduct);
              }}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Record New Price</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  scanButton: {
    padding: 8,
    backgroundColor: COLORS.card,
    borderRadius: 12,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    marginLeft: 8,
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: `${COLORS.accent}20`,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textTertiary,
  },
  tabTextActive: {
    color: COLORS.accent,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Product Card
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  productBrand: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  addPriceButton: {
    padding: 8,
    backgroundColor: `${COLORS.accent}20`,
    borderRadius: 8,
  },

  // Store Card
  storeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  storeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${COLORS.accent}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  storeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  storeName: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  storeAddress: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 4,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flex: 1,
  },

  // Inputs
  inputLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textTertiary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },

  // Barcode Preview
  barcodePreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.accent}20`,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  barcodeText: {
    fontSize: 13,
    color: COLORS.accent,
    fontFamily: "monospace",
  },

  // Category Chips
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: "capitalize",
  },

  // Store Chips
  storeScroll: {
    marginBottom: 12,
  },
  storeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  storeChipActive: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}15`,
  },
  storeChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  storeChipTextActive: {
    color: COLORS.accent,
  },
  addStoreChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  addStoreChipText: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },

  // Price Row
  priceRow: {
    flexDirection: "row",
    gap: 12,
  },
  priceInputContainer: {
    flex: 2,
  },
  quantityInputContainer: {
    flex: 1,
  },

  // Submit Button
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Product Detail
  productDetailBrand: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: -16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 12,
  },

  // Latest Prices
  latestPricesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    minWidth: "30%",
    flex: 1,
  },
  priceCardBest: {
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  priceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  priceCardStore: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
  },
  bestPriceBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestPriceText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#FFF",
  },
  priceCardPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  priceCardDate: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  noPricesText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontStyle: "italic",
  },

  // History
  historyScroll: {
    maxHeight: 200,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyItemLeft: {
    flex: 1,
  },
  historyPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  historyStore: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});

export default PriceTracker;


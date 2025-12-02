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
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import BarcodeScanner from "../../../components/BarcodeScanner";
import { useGlobalContext } from "../../../context/GlobalProvider";
import {
  getHouseholdProducts,
  getHouseholdStores,
  createProduct,
  createStore,
  updateProduct,
  deleteProduct,
  updateStore,
  deleteStore,
  getProductByBarcode,
  addPriceEntry,
  updatePriceEntry,
  deletePriceEntry,
  getProductPriceHistory,
  getProductLatestPrices,
  lookupBarcode,
  ProductCategories,
} from "../../../lib/appwrite";

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
  const [editStoreModalVisible, setEditStoreModalVisible] = useState(false);

  // Forms
  const [newProduct, setNewProduct] = useState({ 
    name: "", brand: "", barcode: "", category: "groceries", unit: "g", weight: "", imageUrl: "" 
  });
  const [newStore, setNewStore] = useState({ name: "", address: "" });
  const [editStore, setEditStore] = useState(null);
  const [newPrice, setNewPrice] = useState({ productId: "", storeId: "", price: "", quantity: "1", weight: "" });
  
  // Selected product for detail view
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productPriceHistory, setProductPriceHistory] = useState([]);
  const [productLatestPrices, setProductLatestPrices] = useState([]);
  const [isEditingProduct, setIsEditingProduct] = useState(false);

  // Open Food Facts lookup
  const [lookingUp, setLookingUp] = useState(false);
  const [offData, setOffData] = useState(null);

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
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await fetchData();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Handle barcode scan
  const handleBarcodeScan = async ({ data }) => {
    setScannerVisible(false);
    setLookingUp(true);
    setOffData(null);
    
    try {
      // Check if product exists in our database
      const existingProduct = await getProductByBarcode(data, householdId);
      
      if (existingProduct) {
        setLookingUp(false);
        openProductDetail(existingProduct);
        return;
      }
      
      // Lookup in Open Food Facts
      const offProduct = await lookupBarcode(data);
      
      if (offProduct && offProduct.found) {
        setOffData(offProduct);
        setNewProduct({
          barcode: data,
          name: offProduct.name || "",
          brand: offProduct.brand || "",
          category: offProduct.category || "groceries",
          unit: offProduct.unit || "g",
          weight: offProduct.weight?.toString() || "",
          imageUrl: offProduct.imageUrl || "",
        });
      } else {
        setNewProduct({ 
          barcode: data, name: "", brand: "", category: "groceries", unit: "g", weight: "", imageUrl: "" 
        });
      }
      
      setLookingUp(false);
      setAddProductModalVisible(true);
    } catch (error) {
      setLookingUp(false);
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
        weight: newProduct.weight ? parseFloat(newProduct.weight) : null,
        householdId,
        userId: user.$id,
      });
      setAddProductModalVisible(false);
      setNewProduct({ name: "", brand: "", barcode: "", category: "groceries", unit: "g", weight: "", imageUrl: "" });
      setOffData(null);
      fetchData();
      Alert.alert("Success", "Product added!");
    } catch (error) {
      Alert.alert("Error", "Failed to add product");
    }
  };

  // Update product
  const handleUpdateProduct = async () => {
    if (!selectedProduct || !newProduct.name.trim()) {
      Alert.alert("Error", "Please enter a product name");
      return;
    }

    try {
      await updateProduct(selectedProduct.$id, {
        name: newProduct.name,
        brand: newProduct.brand || null,
        category: newProduct.category,
        unit: newProduct.unit,
        weight: newProduct.weight ? parseFloat(newProduct.weight) : null,
        imageUrl: newProduct.imageUrl || null,
      });
      setIsEditingProduct(false);
      setSelectedProduct({ ...selectedProduct, ...newProduct, weight: newProduct.weight ? parseFloat(newProduct.weight) : null });
      fetchData();
      Alert.alert("Success", "Product updated!");
    } catch (error) {
      Alert.alert("Error", "Failed to update product");
    }
  };

  // Delete product
  const handleDeleteProduct = () => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${selectedProduct?.name}"? This will also delete all price history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct(selectedProduct.$id);
              setProductDetailVisible(false);
              setSelectedProduct(null);
              fetchData();
              Alert.alert("Success", "Product deleted!");
            } catch (error) {
              Alert.alert("Error", "Failed to delete product");
            }
          },
        },
      ]
    );
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

  // Edit store
  const openEditStore = (store) => {
    setEditStore(store);
    setNewStore({ name: store.name, address: store.address || "" });
    setEditStoreModalVisible(true);
  };

  const handleUpdateStore = async () => {
    if (!editStore || !newStore.name.trim()) {
      Alert.alert("Error", "Please enter a store name");
      return;
    }

    try {
      await updateStore(editStore.$id, {
        name: newStore.name,
        address: newStore.address || null,
      });
      setEditStoreModalVisible(false);
      setEditStore(null);
      setNewStore({ name: "", address: "" });
      fetchData();
      Alert.alert("Success", "Store updated!");
    } catch (error) {
      Alert.alert("Error", "Failed to update store");
    }
  };

  // Delete store
  const handleDeleteStore = (store) => {
    Alert.alert(
      "Delete Store",
      `Are you sure you want to delete "${store.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteStore(store.$id);
              fetchData();
              Alert.alert("Success", "Store deleted!");
            } catch (error) {
              Alert.alert("Error", "Failed to delete store");
            }
          },
        },
      ]
    );
  };

  // Add price entry
  const handleAddPrice = async () => {
    if (!newPrice.productId || !newPrice.storeId || !newPrice.price) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    const price = parseFloat(newPrice.price);
    const quantity = parseFloat(newPrice.quantity) || 1;
    const weight = newPrice.weight ? parseFloat(newPrice.weight) : (selectedProduct?.weight || null);

    try {
      await addPriceEntry({
        productId: newPrice.productId,
        storeId: newPrice.storeId,
        price,
        quantity,
        weight,
        userId: user.$id,
        householdId,
      });
      setAddPriceModalVisible(false);
      setNewPrice({ productId: "", storeId: "", price: "", quantity: "1", weight: "" });
      
      // Refresh product detail if open
      if (selectedProduct) {
        openProductDetail(selectedProduct);
      }
      
      Alert.alert("Success", "Price recorded!");
    } catch (error) {
      Alert.alert("Error", "Failed to record price");
    }
  };

  // Delete price entry
  const handleDeletePriceEntry = (entry) => {
    Alert.alert(
      "Delete Price Entry",
      "Are you sure you want to delete this price entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePriceEntry(entry.$id);
              // Refresh product detail
              if (selectedProduct) {
                openProductDetail(selectedProduct);
              }
              Alert.alert("Success", "Price entry deleted!");
            } catch (error) {
              Alert.alert("Error", "Failed to delete price entry");
            }
          },
        },
      ]
    );
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
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={[styles.productIcon, { backgroundColor: `${categoryConfig.color}20` }]}>
            <Ionicons name={categoryConfig.icon} size={20} color={categoryConfig.color} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.productBrand} numberOfLines={1}>
            {[product.brand, product.weight && `${product.weight}${product.unit || 'g'}`].filter(Boolean).join(' • ') || 'No details'}
          </Text>
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
      <TouchableOpacity style={styles.storeEditBtn} onPress={() => openEditStore(store)}>
        <Ionicons name="pencil" size={16} color={COLORS.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.storeDeleteBtn} onPress={() => handleDeleteStore(store)}>
        <Ionicons name="trash" size={16} color={COLORS.danger} />
      </TouchableOpacity>
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

      {/* Lookup Loading Overlay */}
      {lookingUp && (
        <View style={styles.lookupOverlay}>
          <View style={styles.lookupCard}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.lookupText}>Looking up product...</Text>
          </View>
        </View>
      )}

      {/* Add Product Modal */}
      <Modal visible={addProductModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={{ maxHeight: '90%' }}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Product</Text>
                <TouchableOpacity onPress={() => {
                  setAddProductModalVisible(false);
                  setOffData(null);
                  setNewProduct({ name: "", brand: "", barcode: "", category: "groceries", unit: "g", weight: "", imageUrl: "" });
                }}>
                  <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Open Food Facts result banner */}
              {offData && (
                <View style={styles.offBanner}>
                  <View style={styles.offBannerHeader}>
                    {offData.imageUrl && (
                      <Image source={{ uri: offData.imageUrl }} style={styles.offImage} />
                    )}
                    <View style={styles.offBannerInfo}>
                      <View style={styles.offBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                        <Text style={styles.offBadgeText}>Found in Open Food Facts</Text>
                      </View>
                      {offData.nutriScore && (
                        <Text style={styles.offNutriScore}>
                          Nutri-Score: {offData.nutriScore.toUpperCase()}
                        </Text>
                      )}
                    </View>
                  </View>
                  {offData.quantity && (
                    <Text style={styles.offQuantity}>Package: {offData.quantity}</Text>
                  )}
                </View>
              )}

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

              {/* Weight / Volume */}
              <View style={styles.weightRow}>
                <View style={styles.weightInputContainer}>
                  <Text style={styles.inputLabel}>Weight/Volume</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 500"
                    placeholderTextColor={COLORS.textTertiary}
                    keyboardType="decimal-pad"
                    value={newProduct.weight}
                    onChangeText={(text) => setNewProduct({ ...newProduct, weight: text })}
                  />
                </View>
                <View style={styles.unitInputContainer}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <View style={styles.unitButtons}>
                    {['g', 'kg', 'mL', 'L'].map(unit => (
                      <TouchableOpacity
                        key={unit}
                        style={[styles.unitBtn, newProduct.unit === unit && styles.unitBtnActive]}
                        onPress={() => setNewProduct({ ...newProduct, unit })}
                      >
                        <Text style={[styles.unitBtnText, newProduct.unit === unit && styles.unitBtnTextActive]}>
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

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
          </ScrollView>
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

      {/* Edit Store Modal */}
      <Modal visible={editStoreModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Store</Text>
              <TouchableOpacity onPress={() => {
                setEditStoreModalVisible(false);
                setEditStore(null);
                setNewStore({ name: "", address: "" });
              }}>
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

            <TouchableOpacity style={styles.submitButton} onPress={handleUpdateStore}>
              <Text style={styles.submitButtonText}>Save Changes</Text>
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
          <View style={[styles.modalContent, { maxHeight: "85%" }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>{selectedProduct?.name}</Text>
                <View style={styles.modalHeaderActions}>
                  <TouchableOpacity 
                    style={styles.modalHeaderBtn}
                    onPress={() => {
                      setNewProduct({
                        name: selectedProduct.name,
                        brand: selectedProduct.brand || "",
                        barcode: selectedProduct.barcode || "",
                        category: selectedProduct.category || "groceries",
                        unit: selectedProduct.unit || "g",
                        weight: selectedProduct.weight?.toString() || "",
                        imageUrl: selectedProduct.imageUrl || "",
                      });
                      setIsEditingProduct(true);
                    }}
                  >
                    <Ionicons name="pencil" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalHeaderBtn} onPress={handleDeleteProduct}>
                    <Ionicons name="trash" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    setProductDetailVisible(false);
                    setIsEditingProduct(false);
                  }}>
                    <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Product Info */}
              <View style={styles.productDetailInfo}>
                {selectedProduct?.imageUrl && (
                  <Image source={{ uri: selectedProduct.imageUrl }} style={styles.productDetailImage} />
                )}
                <View style={styles.productDetailMeta}>
                  {selectedProduct?.brand && (
                    <Text style={styles.productDetailBrand}>{selectedProduct.brand}</Text>
                  )}
                  {selectedProduct?.weight && (
                    <Text style={styles.productDetailWeight}>
                      {selectedProduct.weight}{selectedProduct.unit || 'g'}
                    </Text>
                  )}
                  {selectedProduct?.barcode && (
                    <Text style={styles.productDetailBarcode}>
                      <Ionicons name="barcode-outline" size={12} color={COLORS.textTertiary} /> {selectedProduct.barcode}
                    </Text>
                  )}
                </View>
              </View>

              {/* Edit Form (conditional) */}
              {isEditingProduct && (
                <View style={styles.editProductForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="Product name *"
                    placeholderTextColor={COLORS.textTertiary}
                    value={newProduct.name}
                    onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Brand"
                    placeholderTextColor={COLORS.textTertiary}
                    value={newProduct.brand}
                    onChangeText={(text) => setNewProduct({ ...newProduct, brand: text })}
                  />
                  <View style={styles.weightRow}>
                    <View style={styles.weightInputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Weight"
                        placeholderTextColor={COLORS.textTertiary}
                        keyboardType="decimal-pad"
                        value={newProduct.weight}
                        onChangeText={(text) => setNewProduct({ ...newProduct, weight: text })}
                      />
                    </View>
                    <View style={styles.unitInputContainer}>
                      <View style={styles.unitButtons}>
                        {['g', 'kg', 'mL', 'L'].map(unit => (
                          <TouchableOpacity
                            key={unit}
                            style={[styles.unitBtn, newProduct.unit === unit && styles.unitBtnActive]}
                            onPress={() => setNewProduct({ ...newProduct, unit })}
                          >
                            <Text style={[styles.unitBtnText, newProduct.unit === unit && styles.unitBtnTextActive]}>
                              {unit}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={styles.editButtonRow}>
                    <TouchableOpacity 
                      style={[styles.editCancelBtn]}
                      onPress={() => setIsEditingProduct(false)}
                    >
                      <Text style={styles.editCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editSaveBtn} onPress={handleUpdateProduct}>
                      <Text style={styles.editSaveBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {!isEditingProduct && (
                <>
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
                            {entry.pricePerKg && (
                              <Text style={styles.pricePerKg}>€{entry.pricePerKg.toFixed(2)}/kg</Text>
                            )}
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
                  <View style={styles.historyList}>
                    {productPriceHistory.map((entry) => (
                      <View key={entry.$id} style={styles.historyItem}>
                        <View style={styles.historyItemLeft}>
                          <Text style={styles.historyPrice}>€{entry.price?.toFixed(2)}</Text>
                          <Text style={styles.historyStore}>
                            {getStoreName(entry.storeId)}
                            {entry.pricePerKg && ` • €${entry.pricePerKg.toFixed(2)}/kg`}
                          </Text>
                        </View>
                        <View style={styles.historyItemRight}>
                          <Text style={styles.historyDate}>
                            {new Date(entry.date).toLocaleDateString()}
                          </Text>
                          <TouchableOpacity 
                            style={styles.historyDeleteBtn}
                            onPress={() => handleDeletePriceEntry(entry)}
                          >
                            <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                    {productPriceHistory.length === 0 && (
                      <Text style={styles.noPricesText}>No history yet</Text>
                    )}
                  </View>

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
                </>
              )}
            </ScrollView>
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
  historyList: {
    marginBottom: 12,
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
  historyItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  historyDeleteBtn: {
    padding: 6,
  },
  pricePerKg: {
    fontSize: 11,
    color: COLORS.warning,
    marginTop: 2,
  },

  // Product Image
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },

  // Store Card Actions
  storeEditBtn: {
    padding: 8,
  },
  storeDeleteBtn: {
    padding: 8,
  },

  // Lookup Loading
  lookupOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  lookupCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  lookupText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    marginTop: 12,
  },

  // Open Food Facts Banner
  offBanner: {
    backgroundColor: `${COLORS.success}15`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${COLORS.success}30`,
  },
  offBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  offImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  offBannerInfo: {
    flex: 1,
  },
  offBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  offBadgeText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: "500",
  },
  offNutriScore: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  offQuantity: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 8,
  },

  // Weight Input
  weightRow: {
    flexDirection: "row",
    gap: 12,
  },
  weightInputContainer: {
    flex: 2,
  },
  unitInputContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  unitButtons: {
    flexDirection: "row",
    gap: 4,
  },
  unitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  unitBtnActive: {
    backgroundColor: COLORS.accent,
  },
  unitBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  unitBtnTextActive: {
    color: "#FFF",
  },

  // Modal Header Actions
  modalHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalHeaderBtn: {
    padding: 8,
  },

  // Product Detail
  productDetailInfo: {
    flexDirection: "row",
    marginBottom: 8,
  },
  productDetailImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },
  productDetailMeta: {
    flex: 1,
    justifyContent: "center",
  },
  productDetailWeight: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  productDetailBarcode: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 4,
  },

  // Edit Product Form
  editProductForm: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  editButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  editCancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.elevated,
    alignItems: "center",
  },
  editCancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  editSaveBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    alignItems: "center",
  },
  editSaveBtnText: {
    color: "#FFF",
    fontWeight: "600",
  },
});

export default PriceTracker;


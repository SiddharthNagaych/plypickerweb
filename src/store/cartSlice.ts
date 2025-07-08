// store/cartSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: CartState = {
  items: [],
  services: [],
  transport: "standard",
  coupon: null,
  selectedAddress: null,
  transportCharges: {
    bike: 50,
    three_wheeler: 150,
    tempo: 489,
    pickup: 613,
  },
  lastUpdated: new Date().toISOString(),
  sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    updateAddress: (state, action: PayloadAction<Partial<Address>>) => {
      if (!state.selectedAddress) {
        state.selectedAddress = {
          id: `addr_${Date.now()}`,
          name: "",
          phone: "",
          type: "HOME",
          addressLine1: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          isDefault: false,
          ...action.payload,
        };
      } else {
        state.selectedAddress = {
          ...state.selectedAddress,
          ...action.payload,
        };
      }
      state.lastUpdated = new Date().toISOString();
    },

    setSelectedAddress: (state, action: PayloadAction<Address | null>) => {
      state.selectedAddress = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    updateTransportCharges: (
      state,
      action: PayloadAction<TransportCharges>
    ) => {
      state.transportCharges = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    setTransport: (state, action: PayloadAction<CartState["transport"]>) => {
      state.transport = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    addItem: (
      state,
      action: PayloadAction<Omit<CartItem, "id" | "addedAt">>
    ) => {
      const existingItem = state.items.find(
        (item) =>
          item.productId === action.payload.productId &&
          (item.variantIndex || 0) === (action.payload.variantIndex || 0)
      );

      if (existingItem) {
        // Update existing item quantity
        existingItem.quantity += action.payload.quantity;
        existingItem.addedAt = new Date().toISOString();
      } else {
        // Add new item with proper defaults
        const newItem: CartItem = {
          ...action.payload,
          id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          addedAt: new Date().toISOString(),
          includeLabor: action.payload.includeLabor ?? false,
          laborFloors: action.payload.laborFloors ?? 1,
          laborPerFloor: action.payload.laborPerFloor ?? 0,
          applicability: action.payload.applicability ?? 0,
          loadingUnloadingPrice: action.payload.loadingUnloadingPrice ?? 0,
          variantIndex: action.payload.variantIndex ?? 0,
          desc: action.payload.desc ?? {},
          brand: action.payload.brand ?? { _id: undefined, Brand_name: "" },
        };
        state.items.push(newItem);
      }
      state.lastUpdated = new Date().toISOString();
    },

    // FIXED: Remove the 'id' property from payload
    updateQuantity: (
      state,
      action: PayloadAction<{
        productId: string;
        variantIndex?: number;
        quantity: number;
      }>
    ) => {
      const item = state.items.find(
        (item) =>
          item.productId === action.payload.productId &&
          (item.variantIndex || 0) === (action.payload.variantIndex || 0)
      );

      if (item) {
        if (action.payload.quantity <= 0) {
          // Remove item if quantity is 0 or less
          state.items = state.items.filter(
            (item) =>
              !(
                item.productId === action.payload.productId &&
                (item.variantIndex || 0) === (action.payload.variantIndex || 0)
              )
          );
        } else {
          item.quantity = action.payload.quantity;
        }
      }
      state.lastUpdated = new Date().toISOString();
    },

    removeItem: (
      state,
      action: PayloadAction<{ productId: string; variantIndex?: number }>
    ) => {
      const initialLength = state.items.length;
      state.items = state.items.filter(
        (item) =>
          !(
            item.productId === action.payload.productId &&
            (item.variantIndex || 0) === (action.payload.variantIndex || 0)
          )
      );

      // Only update timestamp if an item was actually removed
      if (state.items.length < initialLength) {
        state.lastUpdated = new Date().toISOString();
      }
    },

    // FIXED: Remove the 'id' property from payload
    toggleLabor: (
      state,
      action: PayloadAction<{
        productId: string;
        variantIndex?: number;
        includeLabor: boolean;
      }>
    ) => {
      const item = state.items.find(
        (item) =>
          item.productId === action.payload.productId &&
          (item.variantIndex || 0) === (action.payload.variantIndex || 0)
      );

      if (item) {
        item.includeLabor = action.payload.includeLabor;
        // Set default labor floors and cost if enabling labor
        if (action.payload.includeLabor && !item.laborPerFloor) {
          item.laborPerFloor = 300; // Default labor cost
          item.laborFloors = Math.max(1, item.laborFloors);
        }
      }
      state.lastUpdated = new Date().toISOString();
    },

    // FIXED: Remove the 'id' property from payload
    updateLaborFloors: (
      state,
      action: PayloadAction<{
        productId: string;
        variantIndex?: number;
        floors: number;
      }>
    ) => {
      const item = state.items.find(
        (item) =>
          item.productId === action.payload.productId &&
          (item.variantIndex || 0) === (action.payload.variantIndex || 0)
      );

      if (item) {
        item.laborFloors = Math.max(1, action.payload.floors);
      }
      state.lastUpdated = new Date().toISOString();
    },

    addService: (state, action: PayloadAction<Omit<ServiceItem, "id">>) => {
      const existingService = state.services.find(
        (service) => service.name === action.payload.name
      );

      if (existingService) {
        existingService.quantity =
          (existingService.quantity || 1) + (action.payload.quantity || 1);
      } else {
        const newService: ServiceItem = {
          ...action.payload,
          id: `service_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          quantity: action.payload.quantity ?? 1,
        };
        state.services.push(newService);
      }
      state.lastUpdated = new Date().toISOString();
    },

    updateServiceQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) => {
      const service = state.services.find(
        (service) => service.id === action.payload.id
      );
      if (service) {
        service.quantity = Math.max(1, action.payload.quantity);
      }
      state.lastUpdated = new Date().toISOString();
    },

    removeService: (state, action: PayloadAction<string>) => {
      state.services = state.services.filter(
        (service) => service.id !== action.payload
      );
      state.lastUpdated = new Date().toISOString();
    },

    applyCoupon: (state, action: PayloadAction<ICoupon>) => {
      state.coupon = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    removeCoupon: (state) => {
      state.coupon = null;
      state.lastUpdated = new Date().toISOString();
    },

    clearCart: (state) => {
      return {
        ...initialState,
        sessionId: `session_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      };
    },

    loadCart: (state, action: PayloadAction<Partial<CartState>>) => {
      return {
        ...initialState,
        ...action.payload,
        lastUpdated: new Date().toISOString(),
      };
    },

    // This action is for checking if item exists - no state mutation needed
    checkItemInCart: (
      state,
      action: PayloadAction<{ productId: string; variantIndex?: number }>
    ) => {
      // This is just a query action, doesn't modify state
      // The actual check should be done in a selector
    },
  },
});

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);

export const selectIsItemInCart =
  (productId: string, variantIndex: number = 0) =>
  (state: { cart: CartState }) => {
    return state.cart.items.some(
      (item) =>
        item.productId === productId &&
        (item.variantIndex || 0) === variantIndex
    );
  };

export const selectCartItemQuantity =
  (productId: string, variantIndex: number = 0) =>
  (state: { cart: CartState }) => {
    const item = state.cart.items.find(
      (item) =>
        item.productId === productId &&
        (item.variantIndex || 0) === variantIndex
    );
    return item?.quantity || 0;
  };

export const {
  addItem,
  updateQuantity,
  removeItem,
  toggleLabor,
  updateLaborFloors,
  addService,
  updateServiceQuantity,
  removeService,
  setTransport,
  applyCoupon,
  removeCoupon,
  setSelectedAddress,
  clearCart,
  loadCart,
  checkItemInCart,
  updateTransportCharges,
  updateAddress,
} = cartSlice.actions;

export const cartActions = cartSlice.actions;
export default cartSlice.reducer;
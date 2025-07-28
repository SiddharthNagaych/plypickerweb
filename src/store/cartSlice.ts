import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { REHYDRATE } from "redux-persist";

// Define the rehydrate action type
interface RehydrateAction {
  type: typeof REHYDRATE;
  payload?: {
    cart?: CartState;
  };
}

// Helper function for transport charge calculation
const calculateTransportCharge = (
  basePrice: number,
  distanceKm: number
): number => {
  let charge = basePrice;
  if (distanceKm > 20) {
    charge += basePrice * 0.2 * (distanceKm - 20);
  } else if (distanceKm > 10) {
    charge += basePrice * 0.15 * (distanceKm - 10);
  } else if (distanceKm > 5) {
    charge += basePrice * 0.1 * (distanceKm - 5);
  }
  return Math.round(charge);
};

// Base transport charges (these are the minimum charges)
const BASE_TRANSPORT_CHARGES = {
  bike: 50,
  three_wheeler: 150,
  tempo: 489,
  pickup: 613,
};

const initialState: CartState = {
  items: [],
  services: [],
  transport: "bike",
  coupon: null,
  selectedAddress: null,
    billingAddress: null, // Add this
  transportCharges: BASE_TRANSPORT_CHARGES,

  
  lastUpdated: new Date().toISOString(),
  sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => {
    if (action.payload?.cart) {
      const persistedCart = action.payload.cart;

      // Ensure billing address exists if using same address
      if (persistedCart.selectedAddress && !persistedCart.billingAddress) {
        persistedCart.billingAddress = persistedCart.selectedAddress;
      }

      // FIXED: Always recalculate transport charges if we have distance data
      if (persistedCart.selectedAddress?.distanceFromCenter) {
        const distance = persistedCart.selectedAddress.distanceFromCenter;
        const recalculatedCharges = {
          bike: calculateTransportCharge(
            BASE_TRANSPORT_CHARGES.bike,
            distance
          ),
          three_wheeler: calculateTransportCharge(
            BASE_TRANSPORT_CHARGES.three_wheeler,
            distance
          ),
          tempo: calculateTransportCharge(
            BASE_TRANSPORT_CHARGES.tempo,
            distance
          ),
          pickup: calculateTransportCharge(
            BASE_TRANSPORT_CHARGES.pickup,
            distance
          ),
        };

        return {
          ...persistedCart,
          transportCharges: recalculatedCharges,
          lastUpdated: new Date().toISOString(),
        };
      }

      // FIXED: If no distance data, use the persisted charges or fall back to base charges
      return {
        ...persistedCart,
        transportCharges:
          persistedCart.transportCharges || BASE_TRANSPORT_CHARGES,
        lastUpdated: persistedCart.lastUpdated || new Date().toISOString(),
      };
    }
    return state;
  });
},
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

      // FIXED: Recalculate transport charges when address is updated
      if (state.selectedAddress.distanceFromCenter) {
        const distance = state.selectedAddress.distanceFromCenter;
        state.transportCharges = {
          bike: calculateTransportCharge(BASE_TRANSPORT_CHARGES.bike, distance),
          three_wheeler: calculateTransportCharge(
            BASE_TRANSPORT_CHARGES.three_wheeler,
            distance
          ),
          tempo: calculateTransportCharge(
            BASE_TRANSPORT_CHARGES.tempo,
            distance
          ),
          pickup: calculateTransportCharge(
            BASE_TRANSPORT_CHARGES.pickup,
            distance
          ),
        };
      }

      state.lastUpdated = new Date().toISOString();
    },

 setBillingAddress: (state, action: PayloadAction<Address | null>) => {
      state.billingAddress = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    // Update setSelectedAddress to handle same address case
    setSelectedAddress: (state, action: PayloadAction<Address | null>) => {
      state.selectedAddress = action.payload;
      
      // If billing address is null or same as shipping, update it too
      if (!state.billingAddress || 
          (state.billingAddress.id === state.selectedAddress?.id)) {
        state.billingAddress = action.payload;
      }

      // Recalculate transport charges when address is set
      if (action.payload?.distanceFromCenter) {
        const distance = action.payload.distanceFromCenter;
        state.transportCharges = {
          bike: calculateTransportCharge(BASE_TRANSPORT_CHARGES.bike, distance),
          three_wheeler: calculateTransportCharge(
            BASE_TRANSPORT_CHARGES.three_wheeler,
            distance
          ),
          tempo: calculateTransportCharge(
            BASE_TRANSPORT_CHARGES.tempo,
            distance
          ),
          pickup: calculateTransportCharge(
            BASE_TRANSPORT_CHARGES.pickup,
            distance
          ),
        };
      } else if (!action.payload) {
        // Reset to base charges if no address is selected
        state.transportCharges = BASE_TRANSPORT_CHARGES;
      }

      state.lastUpdated = new Date().toISOString();
    },

    // Add this new reducer for toggling same address
    setUseSameAddress: (state, action: PayloadAction<boolean>) => {
      if (action.payload) {
        // If setting to use same address, copy shipping to billing
        state.billingAddress = state.selectedAddress;
      }
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
        existingItem.quantity += action.payload.quantity;
        existingItem.addedAt = new Date().toISOString();
      } else {
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

      if (state.items.length < initialLength) {
        state.lastUpdated = new Date().toISOString();
      }
    },

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
        if (action.payload.includeLabor && !item.laborPerFloor) {
          item.laborPerFloor = 300;
          item.laborFloors = Math.max(1, item.laborFloors);
        }
      }
      state.lastUpdated = new Date().toISOString();
    },

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

    checkItemInCart: (
      state,
      action: PayloadAction<{ productId: string; variantIndex?: number }>
    ) => {
      // This is just a query action, doesn't modify state
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
  setBillingAddress,
  setUseSameAddress,
} = cartSlice.actions;

export const cartActions = cartSlice.actions;
export default cartSlice.reducer;

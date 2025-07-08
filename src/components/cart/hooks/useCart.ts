import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  addItem,
  removeItem,
  updateQuantity,
  selectCartItems,
  selectCartItemCount
} from '../../../store/cartSlice';

export const useCart = () => {
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector(selectCartItems);
  const cartCount = useSelector(selectCartItemCount);

  const isItemInCart = (productId: string, variantIndex: number = 0) => {
    console.log('Checking cart for:', { productId, variantIndex, cartItems }); // Debug log
    
    return cartItems.some(item => {
      const itemVariantIndex = item.variantIndex ?? 0;
      const isMatch = item.productId === productId && itemVariantIndex === variantIndex;
      
      console.log('Item check:', { 
        itemProductId: item.productId, 
        itemVariantIndex, 
        targetProductId: productId, 
        targetVariantIndex: variantIndex,
        isMatch 
      }); // Debug log
      
      return isMatch;
    });
  };

  const getItemQuantity = (productId: string, variantIndex: number = 0) => {
    const item = cartItems.find(item => {
      const itemVariantIndex = item.variantIndex ?? 0;
      return item.productId === productId && itemVariantIndex === variantIndex;
    });
    
    console.log('Getting quantity for:', { productId, variantIndex, foundItem: item, quantity: item?.quantity || 0 }); // Debug log
    
    return item?.quantity || 0;
  };

  const addToCart = (item: Omit<CartItem, 'id' | 'addedAt'>) => {
    console.log('Adding to cart:', item); // Debug log
    dispatch(addItem(item));
  };

  const removeFromCart = (productId: string, variantIndex: number = 0) => {
    console.log('Removing from cart:', { productId, variantIndex }); // Debug log
    dispatch(removeItem({ productId, variantIndex }));
  };

  const updateItemQuantity = (productId: string, variantIndex: number = 0, quantity: number) => {
    console.log('Updating quantity:', { productId, variantIndex, quantity }); // Debug log
    dispatch(updateQuantity({ productId, variantIndex, quantity }));
  };

  return {
    cartItems,
    cartCount,
    isItemInCart,
    getItemQuantity,
    addToCart,
    removeFromCart,
    updateItemQuantity,
  };
};
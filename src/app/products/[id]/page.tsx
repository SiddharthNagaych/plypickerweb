'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronUp,
  Star,
  Heart,
  Share2,
  MapPin,
  Truck,
  Shield,
  CreditCard,
  Check,
  Plus,
  Minus,
  ShoppingCart,
  Zap,
} from 'lucide-react';
import { useCart } from '@/components/cart/hooks/useCart';

interface ProductDetail {
  _id: string;
  product_name: string;
  product_description: string;
  price: number;
  discounted_price: number;
  discounted_percent: number;
  includeLabor?: boolean;
  laborFloors?: number;
  laborPerFloor?: number;
  applicability?: number;
  loadingUnloadingPrice?: number;
  brand?: {
    _id: string;
    Brand_name: string;
  };
  attributes: {
    images: string[];
    finish?: string;
  };
  desc: {
    Box_Packing?: string;
    Size?: string;
    Colour?: string;
    Material?: string;
    [key: string]: any;
  };
  variants: Array<{
    _id: string;
    product_name: string;
    attributes: {
      var: string;
      color: string;
      images: string[];
    };
    price: number;
    discounted_price: number;
    discounted_percent: number;
  }>;
  bankOffers: Array<{
    id: number;
    bank: string;
    offer: string;
    code: string;
    validUntil: string;
  }>;
  system_rating?: {
    rating: number;
    count: number;
  };
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showSpecs, setShowSpecs] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [pincode, setPincode] = useState('');
  const [availability, setAvailability] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const router = useRouter();
  
  const { 
    isItemInCart, 
    getItemQuantity, 
    addToCart, 
    updateItemQuantity,
    cartItems // Add this to debug
  } = useCart();

  // Reset all state when navigating to a different product
  useEffect(() => {
    console.log('Product ID changed to:', id); // Debug log
    setProduct(null);
    setLoading(true);
    setSelectedVariant(0);
    setQuantity(1);
    setShowSpecs(false);
    setShowDescription(false);
    setPincode('');
    setAvailability(null);
    setSelectedImageIndex(0);
  }, [id]); // This runs when the product ID changes

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}`);
        const data = await response.json();
        console.log('Fetched product:', data); // Debug log
        setProduct(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const getCurrentVariant = () => {
    if (!product?.variants?.length || selectedVariant === 0) {
      return {
        name: product?.product_name || "",
        price: product?.price || 0,
        discounted_price: product?.discounted_price || 0,
        discounted_percent: product?.discounted_percent || 0,
        images: product?.attributes?.images || [],
        description: product?.product_description || "",
      };
    }

    const variant = product.variants[selectedVariant - 1];
    return {
      name: variant.product_name || product.product_name,
      price: variant.price || product.price,
      discounted_price: variant.discounted_price || product.discounted_price,
      discounted_percent: variant.discounted_percent || product.discounted_percent,
      images: variant.attributes?.images || product.attributes?.images || [],
      description: product.product_description || "",
    };
  };

  const currentVariant = getCurrentVariant();
  
  // Calculate variant index - this is the key fix
  const variantIndex = selectedVariant > 0 ? selectedVariant - 1 : 0;

  // Debug the cart check
  console.log('Cart check values:', {
    productId: product?._id,
    variantIndex,
    selectedVariant,
    cartItems,
    currentProduct: product?.product_name
  });

  // Check if current variant is in cart
  const itemInCart = product ? isItemInCart(product._id, variantIndex) : false;
  const currentQuantityInCart = product ? getItemQuantity(product._id, variantIndex) : 0;

  console.log('Final cart status:', { itemInCart, currentQuantityInCart }); // Debug log

  const handleAddToCart = () => {
    if (!product) return;
     const cartBrand: CartBrand = {
    _id: product.brand?._id || '',
    Brand_name: product.brand?.Brand_name || 'Unknown Brand',
  
  };
    
    const cartItem = {
      productId: product._id,
      productName: currentVariant.name,
      productImage: currentVariant.images[0] || "",
      productPrice: currentVariant.price,
      productDiscountedPrice: currentVariant.discounted_price,
      quantity: quantity,
      variantIndex: selectedVariant > 0 ? selectedVariant - 1 : 0, // Always set this as a number
      variantName: selectedVariant > 0 ? currentVariant.name : undefined,
      includeLabor: product.includeLabor || false,
      laborFloors: product.laborFloors || 1,
      laborPerFloor: product.laborPerFloor || 0,
      applicability: product.applicability || 0,
      loadingUnloadingPrice: product.loadingUnloadingPrice || 0,
      desc:product.desc,
      brand: cartBrand

    };
    
    console.log('Adding item to cart:', cartItem); // Debug log
    addToCart(cartItem);
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    if (!product) return;
    
    if (itemInCart) {
      updateItemQuantity(product._id, variantIndex, newQuantity);
    } else {
      setQuantity(newQuantity);
    }
  };

  const handleBuyNow = () => {
    if (!itemInCart) {
      handleAddToCart();
    }
    router.push("/cart");
  };

  const checkAvailability = () => {
    if (pincode.length >= 6) {
      setAvailability("Available for delivery");
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, (itemInCart ? currentQuantityInCart : quantity) + change);
    
    if (itemInCart) {
      handleUpdateQuantity(newQuantity);
    } else {
      setQuantity(newQuantity);
    }
  };

  const displayQuantity = itemInCart ? currentQuantityInCart : quantity;

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!product) {
    return <ProductNotFound />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Debug info - remove this in production */}
      <div className="mb-4 p-4 bg-gray-100 rounded text-sm">
        <strong>Debug Info:</strong> Product ID: {product._id}, Variant Index: {variantIndex}, In Cart: {itemInCart ? 'Yes' : 'No'}, Quantity: {displayQuantity}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Section - Images */}
        <div className="space-y-4">
          <div className="relative w-full h-[500px] border rounded-lg overflow-hidden bg-white">
            <Image
              src={currentVariant.images[selectedImageIndex] || "/placeholder.jpg"}
              alt={currentVariant.name}
              fill
              className="object-contain p-4"
            />
          </div>
          
          {/* Image Thumbnails */}
          <div className="flex gap-2 overflow-x-auto">
            {currentVariant.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                  selectedImageIndex === idx ? 'border-[#FF7803]' : 'border-gray-200'
                }`}
              >
                <Image
                  src={img}
                  alt={`View ${idx + 1}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Social Share Buttons */}
          <div className="flex gap-4 mt-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Image src="/whatsapp-icon.svg" alt="WhatsApp" width={16} height={16} />
              WhatsApp
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Image src="/facebook-icon.svg" alt="Facebook" width={16} height={16} />
              Facebook
            </Button>
          </div>
        </div>

        {/* Right Section - Product Details */}
        <div className="space-y-4">
          {/* Product Title and Brand */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {currentVariant.name}
            </h1>
            {product.brand && (
              <p className="text-gray-600 mb-4">
                Brand: <span className="font-medium">{product.brand.Brand_name}</span>
              </p>
            )}
            <div className="border-b border-gray-200 mb-4"></div>
          </div>

          {/* Price Section */}
          <div className="bg-opacity-10 p-4 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-[#FF7803]">
                ₹{currentVariant.discounted_price.toLocaleString('en-IN')}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl line-through text-gray-500">
                  ₹{currentVariant.price.toLocaleString('en-IN')}
                </span>
                <span className=" text-green-400 px-2 py-1 rounded text-sm font-medium">
                  {currentVariant.discounted_percent}% OFF
                </span>
              </div>
            </div>
          </div>

          {/* Specs and Description Tabs */}
          <div className="space-y-4">
            <div 
              className="border rounded-lg p-4 cursor-pointer"
              onClick={() => setShowSpecs(!showSpecs)}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Specifications</h3>
                {showSpecs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
              {showSpecs && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {Object.entries(product.desc).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                      <dt className="text-sm font-medium text-gray-600 capitalize">
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="text-sm text-gray-900 mt-1">{value}</dd>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div 
              className="border rounded-lg p-4 cursor-pointer"
              onClick={() => setShowDescription(!showDescription)}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Description</h3>
                {showDescription ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
              {showDescription && (
                <div className="mt-4">
                  <p className="text-gray-700">{currentVariant.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bank Offers */}
          {product.bankOffers && product.bankOffers.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Bank Offers</h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {product.bankOffers.map(offer => (
                  <div key={offer.id} className="flex-shrink-0 border rounded-lg p-3 bg-blue-50 w-64">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-sm">{offer.bank}</span>
                    </div>
                    <p className="text-sm text-gray-700">{offer.offer}</p>
                    <p className="text-xs text-gray-600 mt-1">Code: {offer.code}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Available Variants</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.variants.map((variant, idx) => (
                  <button
                    key={variant._id}
                    onClick={() => {
                      console.log('Selecting variant:', idx + 1); // Debug log
                      setSelectedVariant(idx + 1);
                    }}
                    className={`flex-shrink-0 border rounded-lg p-2 min-w-[100px] ${
                      selectedVariant === idx + 1 ? 'border-[#FF7803] bg-[#FF7803] bg-opacity-10' : 'border-gray-200'
                    }`}
                  >
                    <div className="w-16 h-16 relative mx-auto mb-2">
                      <Image
                        src={variant.attributes.images[0] || "/placeholder.jpg"}
                        alt={variant.product_name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <p className="text-xs text-center">{variant.attributes.var}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Check */}
          <div>
            <h3 className="font-semibold mb-3">Check Delivery</h3>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={checkAvailability} 
                className="bg-[#FF7803] hover:bg-[#e06c00]"
              >
                Check
              </Button>
            </div>
            {availability && (
              <div className="mt-2 p-2 bg-green-50 text-green-700 rounded flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span className="text-sm">{availability}</span>
              </div>
            )}
          </div>

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={displayQuantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="px-4 py-2 min-w-[50px] text-center">{displayQuantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="flex-1 border-gray-800 text-gray-800 hover:bg-gray-50"
                disabled={itemInCart}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {itemInCart ? "ADDED TO CART" : "ADD TO CART"}
              </Button>
              <Button
                onClick={handleBuyNow}
                className="flex-1 bg-[#FF7803] hover:bg-[#e06c00]"
              >
                BUY NOW
              </Button>
            </div>
          </div>

          {/* Service Features */}
          <div className="flex justify-between mt-6">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#FF7803]" />
              <span className="text-sm">Free Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#FF7803]" />
              <span className="text-sm">36 Months Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#FF7803]" />
              <span className="text-sm">Fast & Secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="w-full h-[500px]" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}

function ProductNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Product not found</h2>
        <p className="text-gray-600">The product you're looking for doesn't exist.</p>
      </div>
    </div>
  );
}
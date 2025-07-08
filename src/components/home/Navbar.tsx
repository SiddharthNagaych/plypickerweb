"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Heart, User, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Portal from "@/components/home/common/Portal";
import { useSession } from "next-auth/react";
import SignUpModal from "@/components/auth/SignUpModel";
import LoginModal from "@/components/auth/LoginModel";
import { useCity } from "./common/context/CityContext";
import { signOut } from "next-auth/react";

type Brand = { id: string; name: string };
type Subgroup = { id: string; name: string; brands: Brand[] };
type Group = { id: string; name: string; subgroups: Subgroup[] };
type Subcategory = { id: string; name: string; groups: Group[] };
type Category = { id: string; name: string; subcategories: Subcategory[] };

export default function Navbar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { city, setCity } = useCity();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [hoveredSubcategory, setHoveredSubcategory] = useState<Subcategory | null>(null);
  const [hoveredSubcategoryId, setHoveredSubcategoryId] = useState<string | null>(null);

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/brands");
      if (response.ok) {
        const data = await response.json();
        setBrands(data.brands || []);
      } else {
        console.error("Failed to fetch brands:", response.status);
        setBrands([]);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
      setBrands([]);
    }
  };

  useEffect(() => {
    fetchCategories(city);
    fetchBrands();
  }, [city]);

  const fetchCategories = async (currentCity: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/home/category?city=${encodeURIComponent(currentCity)}`
      );
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error("Failed to fetch categories:", response.status);
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    setHoveredCategory(null);
    setMobileMenuOpen(false);
  };

  const navigateWith = (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    router.push(`/products?${qs}`);
    setMobileMenuOpen(false);
  };

  const handleMouseEnter = (e: React.MouseEvent, category: Category) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDropdownPosition({ x: rect.left, y: rect.bottom });
    setHoveredCategory(category);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 100);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleProtectedClick = (callback: () => void) => {
    if (!session) {
      setShowSignUpModal(true);
    } else {
      callback();
    }
  };

  const toggleProfileDropdown = () => {
    if (session) {
      setShowProfileDropdown(!showProfileDropdown);
    } else {
      setShowSignUpModal(true);
    }
  };

  const handleSignOut = async () => {
    try {
      setShowProfileDropdown(false);
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target as Node) &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Profile Dropdown Component
  const ProfileDropdown = () => {
    if (!showProfileDropdown || !session) return null;

    return (
      <div
        ref={profileDropdownRef}
        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200"
        style={{ zIndex: 9999 }}
      >
        <div className="px-4 py-2 border-b border-gray-100">
          {session.user.image && (
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {session.user.name || "User"}
                </p>
                <p className="text-xs text-gray-500">
                  {session.user.email || session.user.phone}
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            router.push("/profile");
            setShowProfileDropdown(false);
          }}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
        >
          My Profile
        </button>

        <button
          onClick={() => {
            router.push("/orders");
            setShowProfileDropdown(false);
          }}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
        >
          My Orders
        </button>

        <button
          onClick={() => {
            router.push("/wishlist");
            setShowProfileDropdown(false);
          }}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
        >
          Wishlist
        </button>

        <div className="border-t border-gray-100 my-1"></div>

        <button
          onClick={handleSignOut}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
        >
          Logout
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white shadow-md relative z-[55]">
      {/* Top Row */}
      <div className="h-16 flex items-center w-full relative">
        {/* LEFT SECTION - City Selector */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center">
          <div className="hidden md:flex items-center">
            <label className="mr-2 text-sm font-medium text-gray-700 whitespace-nowrap">
              City:
            </label>
            <select
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
              disabled={loading}
            >
              <option value="Mumbai">Mumbai</option>
              <option value="Pune">Pune</option>
            </select>
            {loading && (
              <div className="ml-2 animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
            )}
          </div>

          <div className="md:hidden">
            <select
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              className="px-2 py-1 border rounded text-xs focus:ring-orange-500 focus:border-orange-500"
              disabled={loading}
            >
              <option value="Mumbai">MUM</option>
              <option value="Pune">PUN</option>
            </select>
          </div>
        </div>

        {/* CENTER SECTION - Logo */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
          <Image src="/loginpagelogo.svg" alt="Logo" width={40} height={40} />
          <span className="ml-2 text-lg md:text-xl font-bold whitespace-nowrap">
            PLYPICKER
          </span>
        </div>

        {/* RIGHT SECTION */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 md:space-x-4">
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-600 hover:text-orange-500 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => handleProtectedClick(() => router.push("/cart"))}
              className="p-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
            <button
              onClick={() =>
                handleProtectedClick(() => router.push("/wishlist"))
              }
              className="p-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <Heart className="w-5 h-5" />
            </button>
           
            <div className="relative">
              <button
                ref={profileButtonRef}
                onClick={toggleProfileDropdown}
                className="p-2 text-gray-600 hover:text-orange-500 transition-colors"
              >
                {session?.user?.image ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>

              <ProfileDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg z-[40] max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4">
            {session && (
              <div className="flex items-center mb-6 p-3 bg-gray-50 rounded-lg">
                {session.user.image && (
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-800">
                    {session.user.name || "User"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {session.user.email || session.user.phone}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 mb-4">
              <button
                onClick={() => {
                  router.push("/profile");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
              >
                My Profile
              </button>
              <button
                onClick={() => {
                  router.push("/orders");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
              >
                My Orders
              </button>
              <button
                onClick={() => {
                  router.push("/wishlist");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
              >
                Wishlist
              </button>
              <button
                onClick={() => {
                  router.push("/cart");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
              >
                My Cart
              </button>
            </div>

            {session ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full text-left px-4 py-3 font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowLoginModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setShowSignUpModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}

            <div className="mt-6 z-20 relative">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full mr-2"></div>
                  <span className="text-gray-600">Loading categories...</span>
                </div>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className="mb-6">
                    <button
                      onClick={() => navigateWith({ categoryId: cat.id })}
                      className="w-full text-left font-semibold text-gray-800 mb-3 pb-2 hover:text-orange-600 transition-colors"
                    >
                      {cat.name}
                    </button>
                    <div className="bg-gray-50 rounded-lg p-3">
                      {cat.subcategories.map((sub) => (
                        <div key={sub.id} className="mb-3">
                          <button
                            onClick={() =>
                              navigateWith({
                                categoryId: cat.id,
                                subcategoryId: sub.id,
                              })
                            }
                            className="w-full text-left font-medium text-sm text-orange-600 mb-2 hover:text-orange-700 transition-colors"
                          >
                            {sub.name}
                          </button>
                          {sub.groups.map((grp) => (
                            <div key={grp.id} className="ml-3 mb-2">
                              <button
                                onClick={() =>
                                  navigateWith({
                                    categoryId: cat.id,
                                    subcategoryId: sub.id,
                                    groupId: grp.id,
                                  })
                                }
                                className="w-full text-left text-sm font-medium text-gray-700 mb-1 hover:text-orange-600 transition-colors"
                              >
                                {grp.name}
                              </button>
                              {grp.subgroups.map((sg) => (
                                <div key={sg.id} className="ml-4 mb-2">
                                  <button
                                    onClick={() =>
                                      navigateWith({
                                        categoryId: cat.id,
                                        subcategoryId: sub.id,
                                        groupId: grp.id,
                                        subgroupId: sg.id,
                                      })
                                    }
                                    className="w-full text-left text-sm text-gray-600 hover:text-orange-600 block mb-1 transition-colors"
                                  >
                                    {sg.name}
                                  </button>
                                  {sg.brands.length > 0 && (
                                    <div className="ml-4 space-y-1">
                                      {sg.brands.map((b) => (
                                        <button
                                          key={b.id}
                                          onClick={() =>
                                            navigateWith({
                                              categoryId: cat.id,
                                              subcategoryId: sub.id,
                                              groupId: grp.id,
                                              subgroupId: sg.id,
                                              brandId: b.id,
                                            })
                                          }
                                          className="w-full text-left text-xs text-gray-500 hover:text-orange-500 block transition-colors"
                                        >
                                          • {b.name}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Category Strip */}
      <div className="z-10 hidden md:block bg-gray-50">
        <div className="overflow-x-auto">
          <div className="flex justify-center py-3 px-4 min-w-max">
            {loading ? (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full mr-2"></div>
                <span className="text-gray-600">Loading categories...</span>
              </div>
            ) : (
              <div className="flex space-x-4 lg:space-x-6 xl:space-x-8 z-10">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="relative flex-shrink-0"
                    onMouseEnter={(e) => handleMouseEnter(e, cat)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      onClick={() => navigateWith({ categoryId: cat.id })}
                      className="font-medium text-gray-700 hover:text-orange-600 py-2 px-2 lg:px-3 xl:px-4 transition-colors rounded-md hover:bg-white/80 z-10"
                    >
                      {cat.name}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Dropdown Portal */}
      {hoveredCategory && !mobileMenuOpen && !loading && (
        <Portal>
          <div
            className="fixed top-[128px] left-1/2 transform -translate-x-1/2 bg-white shadow-2xl z-[50] p-6 border-t border-gray-200"
            style={{
              height: "40vh",
              width: "80vw",
              overflowY: "auto",
            }}
            onMouseEnter={() => {
              if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
            }}
            onMouseLeave={handleMouseLeave}
          >
            <div className="grid grid-cols-4 gap-6">
              {/* Subcategories Column (2 columns wide) */}
              <div className="col-span-2 grid grid-cols-2 gap-6">
                {/* Left: Subcategories list */}
                <div className="space-y-2">
                  {hoveredCategory.subcategories.map((sub) => (
                    <div
                      key={sub.id}
                      className="relative"
                      onMouseEnter={() => {
                        if (hoverTimeout.current)
                          clearTimeout(hoverTimeout.current);
                        setHoveredSubcategoryId(sub.id);
                      }}
                      onMouseLeave={() => {
                        hoverTimeout.current = setTimeout(() => {
                          setHoveredSubcategoryId(null);
                        }, 100);
                      }}
                    >
                      <button
                        onClick={() =>
                          navigateWith({
                            categoryId: hoveredCategory.id,
                            subcategoryId: sub.id,
                          })
                        }
                        className={`block w-full text-left p-2 rounded ${
                          sub.groups.length > 0
                            ? "text-gray-700 hover:text-orange-600 hover:bg-orange-50"
                            : "text-gray-700"
                        } ${
                          hoveredSubcategoryId === sub.id
                            ? "bg-orange-50 text-orange-600"
                            : ""
                        }`}
                      >
                        {sub.name}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Right: Groups for hovered subcategory */}
                <div className="space-y-2">
                  {hoveredSubcategoryId && (
                    <>
                      {hoveredCategory.subcategories
                        .find((sub) => sub.id === hoveredSubcategoryId)
                        ?.groups.map((group) => (
                          <button
                            key={group.id}
                            onClick={() =>
                              navigateWith({
                                categoryId: hoveredCategory.id,
                                subcategoryId: hoveredSubcategoryId,
                                groupId: group.id,
                              })
                            }
                            className="block w-full text-left p-2 text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded"
                          >
                            {group.name}
                          </button>
                        ))}
                    </>
                  )}
                </div>
              </div>

              {/* Brands Columns (2 columns wide) */}
              <div className="col-span-2">
                <h3 className="font-bold text-lg mb-4">Popular Brands</h3>
                {brands.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {brands.slice(0, 16).map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => navigateWith({ brandId: brand.id })}
                        className="block w-full text-left text-gray-700 hover:text-orange-600 p-2 text-sm hover:bg-orange-50 rounded"
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No brands available</p>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      <SignUpModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        onSwitchToLogin={() => {
          setShowSignUpModal(false);
          setShowLoginModal(true);
        }}
      />
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignUp={() => {
          setShowLoginModal(false);
          setShowSignUpModal(true);
        }}
      />
    </div>
  );
}
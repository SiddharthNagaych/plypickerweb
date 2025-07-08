"use client";

import { useState, useEffect } from "react";
import { X, ArrowLeft } from "lucide-react";
import { signIn } from "next-auth/react";

// Reusing the same components from SignUpModal
const ImageSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={`${className} bg-gray-200 animate-pulse rounded-lg`}>
    <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer"></div>
  </div>
);

const LazyImage = ({
  src,
  alt,
  className = "",
  mobileStyle = {},
  desktopStyle = {},
}: {
  src: string;
  alt: string;
  className?: string;
  mobileStyle?: React.CSSProperties;
  desktopStyle?: React.CSSProperties;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <>
      <div className="relative md:hidden" style={mobileStyle}>
        {isLoading && <ImageSkeleton className={className} />}
        <img
          src={src}
          alt={alt}
          className={`${className} object-cover transition-opacity duration-300 absolute inset-0 w-full h-full ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
        {hasError && (
          <div
            className={`${className} bg-gray-100 flex items-center justify-center absolute inset-0`}
          >
            <span className="text-gray-400 text-sm">Failed to load</span>
          </div>
        )}
      </div>

      <div className="relative hidden md:block" style={desktopStyle}>
        {isLoading && <ImageSkeleton className={className} />}
        <img
          src={src}
          alt={alt}
          className={`${className} object-cover transition-opacity duration-300 absolute inset-0 w-full h-full ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
        {hasError && (
          <div
            className={`${className} bg-gray-100 flex items-center justify-center absolute inset-0`}
          >
            <span className="text-gray-400 text-sm">Failed to load</span>
          </div>
        )}
      </div>
    </>
  );
};

const OTPInput = ({
  value,
  onChange,
  length = 6,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}) => {
  const [otp, setOtp] = useState(Array(length).fill(""));

  useEffect(() => {
    onChange(otp.join(""));
  }, [otp, onChange]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.nextSibling && element.value) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const previousInput = e.currentTarget.previousSibling as HTMLInputElement;
      if (previousInput) {
        previousInput.focus();
      }
    }
  };

  return (
    <div className="flex justify-center space-x-2 mb-4">
      {otp.map((digit, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
        />
      ))}
    </div>
  );
};

const OTPVerificationStep = ({
  phoneNumber,
  onVerify,
  onBack,
  isLoading,
  error,
}: {
  phoneNumber: string;
  onVerify: (otp: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string;
}) => {
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResendOTP = async () => {
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      if (response.ok) {
        setTimeLeft(300);
        setCanResend(false);
        setOtp("");
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
    }
  };

  const handleVerifyOTP = () => {
    if (otp.length === 6) {
      onVerify(otp);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800 ml-2">Verify OTP</h2>
      </div>

      <div className="text-center">
        <p className="text-gray-600 mb-2">We've sent a verification code to</p>
        <p className="font-semibold text-gray-800 mb-6">{phoneNumber}</p>

        <OTPInput value={otp} onChange={setOtp} />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="text-sm text-gray-500 mb-4">
          {canResend ? (
            <button
              onClick={handleResendOTP}
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Resend OTP
            </button>
          ) : (
            <span>Resend OTP in {formatTime(timeLeft)}</span>
          )}
        </div>

        <button
          onClick={handleVerifyOTP}
          disabled={otp.length !== 6 || isLoading}
          className="w-full bg-orange-500 text-white py-2.5 rounded-md font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Verifying..." : "Verify OTP"}
        </button>
      </div>
    </div>
  );
};

const LoginModal = ({ 
  isOpen, 
  onClose, 
  onSwitchToSignUp 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSwitchToSignUp: () => void;
}) => {
  const [currentStep, setCurrentStep] = useState<"login" | "otp">("login");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestOTP = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (!phoneNumber) {
        setError("Please enter your phone number");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      if (response.ok) {
        setCurrentStep("otp");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerify = async (otp: string) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("phone-login", {
        phone: phoneNumber,
        otp: otp,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid OTP. Please try again.");
      }

      // Successful login - close the modal
      onClose();
    } catch (error: any) {
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", {
        callbackUrl: "/",
      });
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Failed to sign in with Google");
    }
  };

  const handleBack = () => {
    setCurrentStep("login");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden mx-4 max-h-[95vh]
                   w-full max-w-[930px] h-auto md:h-[799px] md:max-h-[799px]"
        style={{
          borderRadius: "8px",
        }}
      >
        <div className="absolute top-4 left-4 z-10 flex items-center">
          <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center mr-2">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-gray-800 font-semibold text-lg">plypicker</span>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex flex-col flex-1 overflow-y-auto md:overflow-hidden">
          <div className="flex flex-col flex-1 pt-16 px-4 pb-3 md:pt-7 md:px-7 md:pb-3">
            <div
              className="bg-gray-100 rounded-lg shadow-sm flex flex-col w-full max-w-[350px] p-4 mx-auto
                         h-auto md:h-[531px]"
              style={{
                borderRadius: "8px",
              }}
            >
              {currentStep === "login" ? (
                <>
                  <h2 className="text-center text-xl font-bold text-gray-800 mb-6 md:mb-8">
                    Login
                  </h2>

                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone number
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="0123456789"
                        className="w-full px-3 py-2.5 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-200"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-500 text-sm mb-4 text-center">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2 mt-6">
                    <button
                      onClick={handleRequestOTP}
                      disabled={isLoading}
                      className="w-full bg-orange-500 text-white py-2.5 rounded-md font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Sending OTP..." : "Login"}
                    </button>

                    <button
                      onClick={onSwitchToSignUp}
                      className="w-full bg-white border border-gray-300 text-gray-800 py-2.5 rounded-md font-semibold hover:bg-gray-100 transition"
                    >
                      Sign Up
                    </button>

                    <div className="flex items-center my-2">
                      <hr className="flex-1 border-t border-gray-300" />
                      <span className="px-2 text-xs text-gray-500">or</span>
                      <hr className="flex-1 border-t border-gray-300" />
                    </div>

                    <button
                      onClick={handleGoogleSignIn}
                      className="w-full bg-white border border-gray-300 text-gray-800 py-2.5 rounded-md font-semibold hover:bg-gray-100 transition flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign in with Google
                    </button>
                  </div>
                </>
              ) : (
                <OTPVerificationStep
                  phoneNumber={phoneNumber}
                  onVerify={handleOTPVerify}
                  onBack={handleBack}
                  isLoading={isLoading}
                  error={error}
                />
              )}
            </div>
          </div>

          <div className="px-4 pb-3 md:px-7 md:pb-3">
            <div
              className="flex items-end justify-center space-x-2 md:space-x-4 overflow-x-auto pb-2 md:pb-0 
                         md:absolute md:top-[500px] md:w-full md:left-0 md:px-7"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#cbd5e0 transparent",
              }}
            >
              <LazyImage
                src="/loginpageimg1.svg"
                alt="Interior design 1"
                className="rounded-lg flex-shrink-0"
                mobileStyle={{ width: "92px", height: "168px" }}
                desktopStyle={{ width: "153px", height: "280px" }}
              />
              <LazyImage
                src="/loginpageimg2.svg"
                alt="Interior design 2"
                className="rounded-lg flex-shrink-0"
                mobileStyle={{ width: "91px", height: "102px" }}
                desktopStyle={{ width: "152px", height: "170px" }}
              />
              <LazyImage
                src="/loginpageimg3.svg"
                alt="Interior design 3"
                className="rounded-lg flex-shrink-0"
                mobileStyle={{ width: "91px", height: "69px" }}
                desktopStyle={{ width: "152px", height: "115px" }}
              />
              <LazyImage
                src="/loginpageimg4.svg"
                alt="Interior design 4"
                className="rounded-lg flex-shrink-0"
                mobileStyle={{ width: "91px", height: "102px" }}
                desktopStyle={{ width: "152px", height: "170px" }}
              />
              <LazyImage
                src="/loginpageimg5.svg"
                alt="Interior design 5"
                className="rounded-lg flex-shrink-0"
                mobileStyle={{ width: "91px", height: "168px" }}
                desktopStyle={{ width: "152px", height: "280px" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Changed from 'next/router'


export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to profile after 3 seconds
    const timer = setTimeout(() => {
      router.push('/profile');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#FF7803' }}>
     

      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order has been received and is being processed.
        </p>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">
            <strong>Plypicker Message:</strong> Your materials will be carefully selected and prepared for delivery.
          </p>
        </div>

        <p className="text-gray-500 text-sm">
          You'll be redirected to your profile shortly...
        </p>
      </div>
    </div>
  );
}
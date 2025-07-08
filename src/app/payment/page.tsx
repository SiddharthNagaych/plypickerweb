// pages/payment/success.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { clearCart } from '../../store/cartSlice';

const PaymentSuccess = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    // Clear cart on successful payment
    dispatch(clearCart());

    // You could also verify the payment status here with your backend
    const { order_id, order_status } = router.query;
    
    // Redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push('/orders');
    }, 5000);

    return () => clearTimeout(timer);
  }, [dispatch, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        <div className="text-green-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your order. You'll be redirected to your orders page shortly.
        </p>
        <button
          onClick={() => router.push('/orders')}
          className="bg-[#FF7803] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          View Orders
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
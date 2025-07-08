import Order from '@/models/Order';
import Return from '@/models/Return';
import {mongooseConnect } from '@/lib/mongooseConnect';

export const canReturnOrder = (order: any): boolean => {
  if (order.orderStatus !== "delivered") return false;
  if (order.hasActiveReturn) return false;
  
  if (!order.deliveredAt) return false;
  
  const deliveredDate = new Date(order.deliveredAt);
  const returnDeadline = new Date(deliveredDate);
  returnDeadline.setDate(returnDeadline.getDate() + 7); // 7 days return policy
  
  return new Date() <= returnDeadline;
};

export const updateOrderReturnFields = async (orderId: string) => {
  await mongooseConnect();
  
  const order = await Order.findById(orderId);
  if (!order) return;
  
  const activeReturn = await Return.findOne({
    orderId,
    returnStatus: { $in: ["requested", "approved"] }
  });
  
  const canReturn = canReturnOrder(order);
  
  await Order.findByIdAndUpdate(orderId, {
    hasActiveReturn: !!activeReturn,
    canReturn: canReturn
  });
};

export const calculateRefundAmount = (order: any, returnItems: any[]): number => {
  let refundAmount = 0;
  
  returnItems.forEach(returnItem => {
    const originalItem = order.items.find((item: any) => item.id === returnItem.cartItemId);
    if (originalItem) {
      const itemPrice = originalItem.productDiscountedPrice || originalItem.productPrice;
      refundAmount += itemPrice * returnItem.quantity;
    }
  });
  
  // Apply proportional discounts, taxes, etc.
  const itemsTotal = order.items.reduce((sum: number, item: any) => 
    sum + (item.productDiscountedPrice || item.productPrice) * item.quantity, 0
  );
  
  if (itemsTotal > 0) {
    const proportionalDiscount = (order.discount * refundAmount) / itemsTotal;
    const proportionalGst = (order.gst * refundAmount) / itemsTotal;
    refundAmount = refundAmount - proportionalDiscount + proportionalGst;
  }
  
  return Math.round(refundAmount * 100) / 100; // Round to 2 decimal places
};

export const calculatePlyCredits = (refundAmount: number): number => {
  // Example: 1% of refund amount as Ply Credits
  return Math.round(refundAmount * 0.01 * 100) / 100;
};

export const setOrderDelivered = async (orderId: string) => {
  await mongooseConnect();
  
  const deliveredAt = new Date();
  const returnDeadline = new Date(deliveredAt);
  returnDeadline.setDate(returnDeadline.getDate() + 7);
  
  await Order.findByIdAndUpdate(orderId, {
    orderStatus: "delivered",
    deliveredAt,
    returnDeadline,
    canReturn: true
  });
};

// API endpoint functions
export const getUserOrdersWithReturns = async (userId: string): Promise<any[]> => {
  await mongooseConnect();
  
  const orders = await Order.find({ userId }).sort({ createdAt: -1 });
  
  const ordersWithReturns: any[] = [];
  
  for (const order of orders) {
    const returns = await Return.find({ orderId: order._id }).sort({ createdAt: -1 });
    
    ordersWithReturns.push({
      ...order.toObject(),
      returns,
      canReturn: canReturnOrder(order)
    });
  }
  
  return ordersWithReturns;
};

export const requestReturn = async (
  orderId: string,
  userId: string,
  returnData: {
    returnItems: any[];
    returnReason: string;
  }
): Promise<any> => {
  await mongooseConnect();
  
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) {
    throw new Error('Order not found');
  }
  
  if (!canReturnOrder(order)) {
    throw new Error('Order cannot be returned');
  }
  
  // Calculate refund amounts for each item
  const returnItemsWithRefund = returnData.returnItems.map(item => ({
    ...item,
    refundAmount: calculateRefundAmount(order, [item])
  }));
  
  const totalRefundAmount = returnItemsWithRefund.reduce(
    (sum, item) => sum + item.refundAmount, 0
  );
  
  const returnRequest = new Return({
    orderId,
    userId,
    returnItems: returnItemsWithRefund,
    totalRefundAmount,
    returnReason: returnData.returnReason,
    returnStatus: "requested",
    requestedAt: new Date().toISOString()
  });
  
  await returnRequest.save();
  
  // Update order return fields
  await updateOrderReturnFields(orderId);
  
  return returnRequest;
};

export const getOrderReturns = async (orderId: string, userId: string): Promise<any[]> => {
  await mongooseConnect();
  
  const returns = await Return.find({ orderId, userId }).sort({ createdAt: -1 });
  return returns;
};

export const updateReturnStatus = async (
  returnId: string,
  status: "approved" | "rejected",
  adminData: {
    adminNotes?: string;
    processedBy: string;
    rejectionReason?: string;
  }
): Promise<any> => {
  await mongooseConnect();
  
  const updateData: any = {
    returnStatus: status,
    adminNotes: adminData.adminNotes,
    processedBy: adminData.processedBy
  };
  
  if (status === "approved") {
    updateData.approvedAt = new Date();
  } else if (status === "rejected") {
    updateData.rejectedAt = new Date();
    updateData.rejectionReason = adminData.rejectionReason;
  }
  
  const returnRequest = await Return.findByIdAndUpdate(returnId, updateData, { new: true });
  
  if (!returnRequest) {
    throw new Error('Return request not found');
  }
  
  // Update order return fields
  await updateOrderReturnFields(returnRequest.orderId);
  
  return returnRequest;
};

export const processRefund = async (
  returnId: string,
  refundTransactionId: string
): Promise<any> => {
  await mongooseConnect();
  
  const returnRequest = await Return.findById(returnId);
  if (!returnRequest) {
    throw new Error('Return request not found');
  }
  
  if (returnRequest.returnStatus !== "approved") {
    throw new Error('Return must be approved before processing refund');
  }
  
  // Calculate Ply Credits
  const plyCreditsAmount = calculatePlyCredits(returnRequest.totalRefundAmount);
  
  const updatedReturn = await Return.findByIdAndUpdate(
    returnId,
    {
      returnStatus: "refunded",
      refundProcessedAt: new Date(),
      refundTransactionId,
      plyCreditsCredited: true,
      plyCreditsAmount,
      plyCreditsCreditedAt: new Date()
    },
    { new: true }
  );
  
  // Update order return fields
  await updateOrderReturnFields(returnRequest.orderId);
  
  // Here you would also:
  // 1. Process actual refund through payment gateway
  // 2. Credit Ply Points to user account
  
  return updatedReturn!;
};
import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from "../../../../auth";
import { ObjectId } from 'mongodb';
import { mongooseConnect } from "@/lib/mongooseConnect";
import Order from "@/models/Order"; // Assuming you have an Order model
import PCash from "@/models/PCash"; // Assuming you have a PCash model

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await mongooseConnect();
    
    const {
      items,
      services,
      address,
      transportType,
      transportCharge,
      laborCharges,
      subtotal,
      gst,
      discount,
      total,
      coupon,
      paymentMethod,
      pcashUsed,
    } = req.body;

    // Create the order document
    const orderDoc = {
      userId: new ObjectId(session.user.id),
      items: items.map((item: any) => ({
        productId: new ObjectId(item.productId),
        productName: item.productName,
        productPrice: item.productPrice,
        productDiscountedPrice: item.productDiscountedPrice,
        productImage: item.productImage,
        quantity: item.quantity,
        includeLabor: item.includeLabor,
        laborFloors: item.laborFloors,
        laborPerFloor: item.laborPerFloor,
        variantIndex: item.variantIndex,
        variantName: item.variantName,
      })),
      services: services || [],
      address: {
        ...address,
        coordinates: address.coordinates
          ? {
              lat: address.coordinates.lat,
              lng: address.coordinates.lng,
            }
          : undefined,
      },
      transportType,
      transportCharge,
      laborCharges,
      subtotal,
      gst,
      discount,
      total,
      coupon: coupon ? new ObjectId(coupon) : undefined,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'processing',
      orderStatus: 'placed',
      pcashUsed,
    };

    // Insert the order
    const order = await Order.create(orderDoc);

    // If using PCash, deduct from user's balance
    if (pcashUsed && pcashUsed > 0) {
      await PCash.findOneAndUpdate(
        { userId: new ObjectId(session.user.id) },
        {
          $inc: { currentBalance: -pcashUsed },
          $push: {
            consumed: {
              amount: pcashUsed,
              orderId: order._id,
              usedAt: new Date(),
            },
          },
        }
      );
    }

    // Return the order ID
    res.status(201).json({
      success: true,
      orderId: order._id,
    });
  } catch (error) {
    console.error('Order creation failed:', error);
    res.status(500).json({ 
      message: 'Order creation failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
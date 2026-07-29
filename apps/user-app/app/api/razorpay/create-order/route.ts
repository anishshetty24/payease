import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { PrismaClient } from "@repo/db/client";
import Razorpay from "razorpay";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = body; // amount in INR (e.g., 500)

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay keys not configured" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Create Razorpay order (amount in paise = INR * 100)
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `payease_${Date.now()}`,
      notes: {
        userId: session.user.id,
      },
    });

    // Create OnRampTransaction record in DB (Processing status)
    await prisma.onRampTransaction.create({
      data: {
        provider: "Razorpay",
        status: "Processing",
        startTime: new Date(),
        token: order.id, // Use Razorpay order ID as token
        userId: Number(session.user.id),
        amount: amount * 100, // store in paise
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
    });
  } catch (error: any) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}

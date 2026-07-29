import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { PrismaClient } from "@repo/db/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    // Verify signature: HMAC-SHA256 of "order_id|payment_id" with key_secret
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      // Mark transaction as failed on signature mismatch
      await prisma.onRampTransaction.updateMany({
        where: {
          token: razorpay_order_id,
          userId: Number(session.user.id),
        },
        data: { status: "Failure" },
      });
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Find the pending transaction
    const transaction = await prisma.onRampTransaction.findFirst({
      where: {
        token: razorpay_order_id,
        userId: Number(session.user.id),
        status: "Processing",
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Update transaction status and credit balance atomically
    await prisma.$transaction(async (tx: any) => {
      // Mark transaction as Success
      await tx.onRampTransaction.update({
        where: { id: transaction.id },
        data: { status: "Success" },
      });

      // Credit user balance (upsert in case balance row doesn't exist)
      await tx.balance.upsert({
        where: { userId: Number(session.user.id) },
        update: {
          amount: { increment: transaction.amount },
        },
        create: {
          userId: Number(session.user.id),
          amount: transaction.amount,
          locked: 0,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and balance credited",
      amount: transaction.amount,
    });
  } catch (error: any) {
    console.error("Payment verification failed:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}

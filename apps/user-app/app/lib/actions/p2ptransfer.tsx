"use server"
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { PrismaClient } from "@repo/db/client";

const prisma = new PrismaClient();

export async function p2pTransfer(to: string, amount: number) {
  const session = await getServerSession(authOptions);
  const from = session?.user?.id;

  if (!from) {
    return { message: "Error while sending" };
  }

  if (!to || to.trim() === "") {
    return { message: "Invalid recipient number" };
  }

  if (!amount || amount <= 0) {
    return { message: "Invalid amount" };
  }

  const toUser = await prisma.user.findFirst({
    where: { number: to },
  });

  if (!toUser) {
    return { message: "User not found" };
  }

  if (toUser.id === Number(from)) {
    return { message: "Cannot send money to yourself" };
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      // Lock the sender's balance row to prevent race conditions
      await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${Number(from)} FOR UPDATE`;

      const fromBalance = await tx.balance.findUnique({
        where: { userId: Number(from) },
      });

      if (!fromBalance || fromBalance.amount < amount) {
        throw new Error("Insufficient funds");
      }

      // Debit sender
      await tx.balance.update({
        where: { userId: Number(from) },
        data: { amount: { decrement: amount } },
      });

      // Credit receiver (upsert in case balance row missing)
      await tx.balance.upsert({
        where: { userId: toUser.id },
        update: { amount: { increment: amount } },
        create: { userId: toUser.id, amount: amount, locked: 0 },
      });

      // Record the p2p transfer
      await tx.p2pTransfer.create({
        data: {
          amount,
          timestamp: new Date(),
          fromUserId: Number(from),
          toUserId: toUser.id,
        },
      });
    });

    return { message: "Success" };
  } catch (error: any) {
    return { message: error.message || "Transfer failed" };
  }
}

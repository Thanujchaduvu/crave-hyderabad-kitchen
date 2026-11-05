
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const validStatuses = [
  "PLACED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "CANCELLED",
] as const;

type OrderStatus = (typeof validStatuses)[number];

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { status } = body;

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid order status",
          validStatuses,
        },
        { status: 400 }
      );
    }

    const newStatus = status as OrderStatus;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        outletId: true,
        status: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    const currentStatus = existingOrder.status as OrderStatus;

    // Allow repeated requests without changing the order.
    if (currentStatus === newStatus) {
      return NextResponse.json({
        success: true,
        message: "Order already has this status",
        order: existingOrder,
      });
    }

    // Validate the status transition.
    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot change order from ${currentStatus} to ${newStatus}`,
          allowedNextStatuses: allowedTransitions[currentStatus],
        },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: newStatus,
        ...(newStatus === "COMPLETED" || newStatus === "CANCELLED"
          ? { overdueFlag: false }
          : {}),
      },
      select: {
        id: true,
        orderNumber: true,
        outletId: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${newStatus}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Kitchen status update error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update order status",
      },
      { status: 500 }
    );
  }
}

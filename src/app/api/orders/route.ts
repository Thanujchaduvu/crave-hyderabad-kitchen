
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        outlet: true,
        customer: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      // Temporary diagnostic: check whether the database
      // contains the requested order number or ID.
      const recentOrders = await prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          outletId: true,
          status: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
          requestedId: id,
          recentOrders,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        gstAmount: order.gstAmount,
        totalAmount: order.totalAmount,
        estimatedPrepTime: order.estPrepMins,
        promisedAt: order.promisedAt,
        overdueFlag: order.overdueFlag,
        customer: {
          name: order.customer.name,
          phone: order.customer.phone,
        },
        outlet: {
          id: order.outlet.id,
          name: order.outlet.name,
          city: order.outlet.city,
        },
        items: order.items.map((item) => ({
          id: item.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity,
        })),
        deliveryAddress: order.deliveryAddress,
        deliveryCity: order.deliveryCity,
        deliveryPincode: order.deliveryPincode,
        deliveryInstructions: order.deliveryInstructions,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error("GET ORDER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve order",
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}



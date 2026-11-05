
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required. Use /api/orders?id=ORDER_ID",
        },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        outletId: order.outletId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        subtotal: Number(order.subtotal),
        gstAmount: Number(order.gstAmount),
        discountAmount: Number(order.discountAmount),
        totalAmount: Number(order.totalAmount),
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

        items: order.items.map((item) => {
          const unitPrice = Number(item.unitPrice);

          return {
            id: item.id,
            name: item.menuItem.name,
            quantity: item.quantity,
            unitPrice,
            price: unitPrice,
            total: unitPrice * item.quantity,
          };
        }),

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
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 }
    );
  }
}




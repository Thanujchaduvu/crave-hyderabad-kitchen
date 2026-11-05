
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface RouteContext {
  params: { id: string } | Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "Order ID is required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        id,
      },
      include: {
        outlet: {
          select: {
            id: true,
            name: true,
            city: true,
            fssaiLicense: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                isVeg: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 }
      );
    }

    const formattedItems = order.items.map((orderItem) => ({
      id: orderItem.id,
      menuItemId: orderItem.menuItemId,
      name: orderItem.menuItem.name,
      quantity: orderItem.quantity,
      price: orderItem.unitPrice,
      unitPrice: orderItem.unitPrice,
      imageUrl: orderItem.menuItem.imageUrl,
      isVeg: orderItem.menuItem.isVeg,
      lineTotal: orderItem.unitPrice * orderItem.quantity,
    }));

    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      gstAmount: order.gstAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,

      estimatedPrepTime: order.estPrepMins,
      estPrepMins: order.estPrepMins,
      promisedAt: order.promisedAt,
      overdueFlag: order.overdueFlag,

      deliveryAddress: order.deliveryAddress,
      deliveryCity: order.deliveryCity,
      deliveryPincode: order.deliveryPincode,
      deliveryInstructions: order.deliveryInstructions,

      createdAt: order.createdAt,
      updatedAt: order.updatedAt,

      outlet: order.outlet,
      customer: order.customer,
      items: formattedItems,
    };

    return NextResponse.json(
      {
        success: true,
        order: formattedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get order API error:", error);

    return NextResponse.json(
      { message: "Unable to retrieve order details." },
      { status: 500 }
    );
  }
}

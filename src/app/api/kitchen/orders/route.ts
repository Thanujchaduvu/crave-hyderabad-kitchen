
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const validStatuses = [
  "PLACED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "CANCELLED",
] as const;

type OrderStatus = (typeof validStatuses)[number];

export async function GET(request: NextRequest) {
  try {
    // 1. Read query parameters
    const { searchParams } = request.nextUrl;

    const outletId = searchParams.get("outletId");
    const status = searchParams.get("status");

    // 2. Validate outlet ID
    if (!outletId) {
      return NextResponse.json(
        {
          success: false,
          error: "Outlet ID is required",
        },
        { status: 400 }
      );
    }

    // 3. Validate status
    if (
      status &&
      !validStatuses.includes(status as OrderStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid order status",
          validStatuses,
        },
        { status: 400 }
      );
    }

    // 4. Database diagnostics
    const totalOrders = await prisma.order.count();

    const matchingOrders = await prisma.order.count({
      where: { outletId },
    });

    const testOrder = await prisma.order.findUnique({
      where: {
        orderNumber: "WEB-778146",
      },
      select: {
        id: true,
        orderNumber: true,
        outletId: true,
        status: true,
      },
    });

    console.log("========== CRAVE DATABASE DIAGNOSTIC ==========");
    console.log({
      totalOrders,
      requestedOutletId: outletId,
      matchingOrders,
      testOrder,
    });
    console.log("================================================");

    // 5. Fetch orders
    const orders = await prisma.order.findMany({
      where: {
        outletId,
        ...(status
          ? { status: status as OrderStatus }
          : {}),
      },
      include: {
        customer: {
          select: {
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
                category: {
                  select: {
                    id: true,
                    name: true,
                    sortOrder: true,
                  },
                },
                isVeg: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // 6. Calculate preparation information
    const now = new Date();

    const formattedOrders = orders.map((order) => {
      const elapsedMinutes = Math.floor(
        (now.getTime() - order.createdAt.getTime()) / 60000
      );

      const isActive = ![
        "COMPLETED",
        "CANCELLED",
      ].includes(order.status);

      const isOverdue =
        isActive &&
        order.promisedAt !== null &&
        order.promisedAt.getTime() < now.getTime();

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        outletId: order.outletId,
        status: order.status,

        customer: {
          name: order.customer.name,
          phone: order.customer.phone,
        },

        items: order.items.map((item) => ({
          id: item.id,
          menuItemId: item.menuItemId,
          name: item.menuItem.name,
          category: item.menuItem.category,
          isVeg: item.menuItem.isVeg,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          total: Number(item.unitPrice) * item.quantity,
        })),

        subtotal: Number(order.subtotal),
        gstAmount: Number(order.gstAmount),
        discountAmount: Number(order.discountAmount),
        totalAmount: Number(order.totalAmount),

        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,

        preparation: {
          estimatedMinutes: order.estPrepMins,
          elapsedMinutes,
          promisedAt: order.promisedAt,
          isOverdue,
        },

        deliveryAddress: order.deliveryAddress,
        deliveryCity: order.deliveryCity,
        deliveryPincode: order.deliveryPincode,
        deliveryInstructions: order.deliveryInstructions,

        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    // 7. Return response
    return NextResponse.json({
      success: true,
      count: formattedOrders.length,

      diagnostics: {
        totalOrders,
        requestedOutletId: outletId,
        matchingOrders,
        testOrderFound: Boolean(testOrder),
        testOrderOutletId: testOrder?.outletId ?? null,
        testOrderStatus: testOrder?.status ?? null,
      },

      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Kitchen orders API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch kitchen orders",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

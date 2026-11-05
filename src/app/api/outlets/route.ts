
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateDistanceKm } from "@/lib/geofence";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const latValue = searchParams.get("lat");
    const lngValue = searchParams.get("lng");

    const lat = latValue !== null ? Number(latValue) : NaN;
    const lng = lngValue !== null ? Number(lngValue) : NaN;

    const hasLocation =
      latValue !== null &&
      lngValue !== null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180;

    const outlets = await prisma.outlet.findMany({
      where: {
        active: true,
      },
      orderBy: [
        { city: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        city: true,
        latitude: true,
        longitude: true,
        deliveryRadiusKm: true,
        fssaiLicense: true,
        isCloudKitchen: true,
      },
    });

    const enriched = outlets.map((outlet) => {
      const distanceKm = hasLocation
        ? calculateDistanceKm(
            lat,
            lng,
            outlet.latitude,
            outlet.longitude
          )
        : null;

      return {
        ...outlet,
        distanceKm:
          distanceKm === null
            ? null
            : Number(distanceKm.toFixed(1)),
        isDeliverable:
          distanceKm === null
            ? null
            : distanceKm <= outlet.deliveryRadiusKm,
      };
    });

    if (hasLocation) {
      enriched.sort(
        (a, b) =>
          (a.distanceKm ?? Infinity) -
          (b.distanceKm ?? Infinity)
      );
    }

    return NextResponse.json({
      outlets: enriched,
      locationChecked: hasLocation,
    });
  } catch (error) {
    console.error("Outlet listing failed:", error);

    return NextResponse.json(
      {
        error: "Unable to load outlets",
      },
      { status: 500 }
    );
  }
}

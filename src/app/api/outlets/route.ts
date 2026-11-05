import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateDistanceKm } from '@/lib/geofence';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lng'));
    const hasLocation = searchParams.has('lat') && searchParams.has('lng')
      && Number.isFinite(lat) && Number.isFinite(lng)
      && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    const outlets = await prisma.outlet.findMany({
      where: { active: true },
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
      select: {
        id: true, name: true, city: true, latitude: true, longitude: true,
        deliveryRadiusKm: true, fssaiLicense: true, isCloudKitchen: true,
      },
    });
    const enriched = outlets.map((outlet) => {
      const distanceKm = hasLocation
        ? calculateDistanceKm(lat, lng, outlet.latitude, outlet.longitude)
        : null;
      return {
        ...outlet,
        distanceKm: distanceKm === null ? null : Number(distanceKm.toFixed(1)),
        isDeliverable: distanceKm === null ? null : distanceKm <= outlet.deliveryRadiusKm,
      };
    });
    if (hasLocation) enriched.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    return NextResponse.json({ outlets: enriched, locationChecked: hasLocation });
  } catch (error) {
    console.error('Outlet listing failed:', error);
    return NextResponse.json({ error: 'Unable to load outlets' }, { status: 500 });
  }
}

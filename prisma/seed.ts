import { PrismaClient, Role, OrderStatus, PartyOrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // 1. Clear Existing Data
  await prisma.partyOrder.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.outletInventory.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users (Demo Reviewer Accounts & Customers)
  const customer = await prisma.user.create({
    data: {
      phone: '+919876543210',
      email: 'customer.hyd@example.com',
      name: 'Rohan Sharma',
      role: Role.CUSTOMER,
      loyaltyPoints: 350,
      dpdpOptInMarketing: true,
    },
  });

  const kitchenKondapur = await prisma.user.create({
    data: {
      phone: '+919876543211',
      email: 'kitchen.kondapur@company-a.com',
      name: 'Chef Suresh (Kondapur)',
      role: Role.KITCHEN_STAFF,
    },
  });

  const kitchenGachibowli = await prisma.user.create({
    data: {
      phone: '+919876543212',
      email: 'kitchen.gachibowli@company-a.com',
      name: 'Chef Ramesh (Gachibowli Cloud Kitchen)',
      role: Role.KITCHEN_STAFF,
    },
  });

  const admin = await prisma.user.create({
    data: {
      phone: '+919876543213',
      email: 'admin.marketing@company-a.com',
      name: 'Ananya Roy (Central Admin)',
      role: Role.CENTRAL_ADMIN,
    },
  });

  const cateringManager = await prisma.user.create({
    data: {
      phone: '+919876543214',
      email: 'catering@company-a.com',
      name: 'Vikram Reddy (Catering Manager)',
      role: Role.CATERING_MANAGER,
    },
  });

  // 3. Create Outlets & Cloud Kitchens
  const kondapur = await prisma.outlet.create({
    data: {
      id: 'kondapur',
      name: 'Kondapur Outlet',
      city: 'Hyderabad',
      latitude: 17.4622,
      longitude: 78.3568,
      deliveryRadiusKm: 7.0,
      fssaiLicense: '13621011000245',
      minPrepMins: 15,
      isCloudKitchen: false,
    },
  });

  const gachibowliCK = await prisma.outlet.create({
    data: {
      id: 'gachibowli-cloud-kitchen',
      name: 'Gachibowli Cloud Kitchen',
      city: 'Hyderabad',
      latitude: 17.4401,
      longitude: 78.3489,
      deliveryRadiusKm: 6.0,
      fssaiLicense: '13621011000890',
      minPrepMins: 12,
      isCloudKitchen: true,
    },
  });

  const kukatpally = await prisma.outlet.create({
    data: {
      id: 'kukatpally',
      name: 'Kukatpally Outlet',
      city: 'Hyderabad',
      latitude: 17.4849,
      longitude: 78.4138,
      deliveryRadiusKm: 8.0,
      fssaiLicense: '13621011000512',
      minPrepMins: 15,
      isCloudKitchen: false,
    },
  });

  // 4. Create Categories
  const biryaniCat = await prisma.category.create({ data: { name: 'Hyderabadi Biryani', sortOrder: 1 } });
  const startersCat = await prisma.category.create({ data: { name: 'Kebabs & Starters', sortOrder: 2 } });
  const dessertsCat = await prisma.category.create({ data: { name: 'Traditional Desserts', sortOrder: 3 } });
  const beveragesCat = await prisma.category.create({ data: { name: 'Beverages & Salan', sortOrder: 4 } });

  // 5. Create Menu Items
  const chickenBiryaniFP = await prisma.menuItem.create({
    data: {
      categoryId: biryaniCat.id,
      name: 'Chicken Dum Biryani Family Pack',
      description: 'Authentic slow-cooked long-grain basmati biryani with 4 juicy chicken pieces, 4 boiled eggs, Mirchi ka Salan & Raita.',
      basePrice: 1080.0,
      isVeg: false,
      spiceLevel: 2,
      allergens: ['Dairy'],
      prepComplexity: 3.5,
      imageUrl: '/images/chicken-biryani-fp.jpg',
    },
  });

  const vegBiryani = await prisma.menuItem.create({
    data: {
      categoryId: biryaniCat.id,
      name: 'Special Veg Dum Biryani',
      description: 'Fresh seasonal vegetables cooked with saffron-infused basmati rice and signature aromatic spices.',
      basePrice: 280.0,
      isVeg: true,
      spiceLevel: 1,
      allergens: ['Nuts'],
      prepComplexity: 2.0,
      imageUrl: '/images/veg-biryani.jpg',
    },
  });

  const muttonHaleem = await prisma.menuItem.create({
    data: {
      categoryId: startersCat.id,
      name: 'Royal Mutton Haleem',
      description: 'Slow-cooked mutton pounded with wheat, lentils, ghee, and topped with fried onions & cashews.',
      basePrice: 350.0,
      isVeg: false,
      spiceLevel: 2,
      allergens: ['Gluten', 'Nuts', 'Dairy'],
      prepComplexity: 4.0,
      imageUrl: '/images/mutton-haleem.jpg',
    },
  });

  const doubleKaMeetha = await prisma.menuItem.create({
    data: {
      categoryId: dessertsCat.id,
      name: 'Double Ka Meetha',
      description: 'Classic Hyderabadi fried bread dessert soaked in saffron milk and garnished with almonds.',
      basePrice: 50.0,
      isVeg: true,
      spiceLevel: 1,
      allergens: ['Dairy', 'Nuts', 'Gluten'],
      prepComplexity: 1.0,
      imageUrl: '/images/double-ka-meetha.jpg',
    },
  });

  const mirchiSalan = await prisma.menuItem.create({
    data: {
      categoryId: beveragesCat.id,
      name: 'Mirchi Ka Salan (Extra)',
      description: 'Traditional Hyderabadi peanut and sesame curry with fried green chillies.',
      basePrice: 80.0,
      isVeg: true,
      spiceLevel: 3,
      allergens: ['Peanuts', 'Sesame'],
      prepComplexity: 0.5,
      imageUrl: '/images/mirchi-salan.jpg',
    },
  });

  // 6. Populate Outlet Inventory & Stock Availability
  const outlets = [kondapur, gachibowliCK, kukatpally];
  const items = [chickenBiryaniFP, vegBiryani, muttonHaleem, doubleKaMeetha, mirchiSalan];

  for (const outlet of outlets) {
    for (const item of items) {
      await prisma.outletInventory.create({
        data: {
          outletId: outlet.id,
          menuItemId: item.id,
          isAvailable: true,
        },
      });
    }
  }

  // 7. Seed Sample Orders
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'WEB-778120',
      outletId: kondapur.id,
      customerId: customer.id,
      status: OrderStatus.PREPARING,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      subtotal: 1123.81,
      gstAmount: 56.19,
      totalAmount: 1180.0,
      estPrepMins: 45,
      promisedAt: new Date(Date.now() + 45 * 60000),
      items: {
        create: [
          { menuItemId: chickenBiryaniFP.id, quantity: 1, unitPrice: 1080.0 },
          { menuItemId: doubleKaMeetha.id, quantity: 2, unitPrice: 50.0 },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'WEB-778131',
      outletId: gachibowliCK.id,
      customerId: customer.id,
      status: OrderStatus.READY_FOR_PICKUP,
      paymentMethod: 'Card',
      paymentStatus: 'PAID',
      subtotal: 609.52,
      gstAmount: 30.48,
      totalAmount: 640.0,
      estPrepMins: 40,
      promisedAt: new Date(Date.now() + 40 * 60000),
      items: {
        create: [
          { menuItemId: vegBiryani.id, quantity: 2, unitPrice: 280.0 },
          { menuItemId: mirchiSalan.id, quantity: 1, unitPrice: 80.0 },
        ],
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'WEB-778146',
      outletId: kukatpally.id,
      customerId: customer.id,
      status: OrderStatus.PREPARING,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      subtotal: 1000.0,
      gstAmount: 50.0,
      totalAmount: 1050.0,
      estPrepMins: 50,
      promisedAt: new Date(Date.now() - 4 * 60000),
      overdueFlag: false,
      items: {
        create: [
          { menuItemId: muttonHaleem.id, quantity: 3, unitPrice: 350.0 },
        ],
      },
    },
  });

  // 8. Seed Sample Party Order
  await prisma.partyOrder.create({
    data: {
      customerId: customer.id,
      outletId: kondapur.id,
      guestCount: 85,
      eventDate: new Date(Date.now() + 48 * 3600000),
      menuSummary: 'Chicken Dum Biryani FP x15, Mutton Haleem x20, Double Ka Meetha x50',
      estimatedQuote: 28500.0,
      status: PartyOrderStatus.PENDING_REVIEW,
      managerNotes: 'Customer requested mild spice level for Biryani.',
    },
  });

  console.log('✅ Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
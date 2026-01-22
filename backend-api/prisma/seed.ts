// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data (optional - comment out if you want to keep existing data)
  console.log("🧹 Cleaning existing data...");
  await prisma.trip.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.tripTypeConfig.deleteMany();
  await prisma.distanceScope.deleteMany();
  await prisma.tripPattern.deleteMany();
  await prisma.franchise.deleteMany();

  // Create Roles
  console.log("📋 Creating roles...");
  const adminRole = await prisma.role.create({
    data: {
      name: "ADMIN",
      description: "Administrator with full access",
      isActive: true,
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: "MANAGER",
      description: "Franchise manager",
      isActive: true,
    },
  });

  const staffRole = await prisma.role.create({
    data: {
      name: "STAFF",
      description: "Staff member",
      isActive: true,
    },
  });

  // Hash password for users
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Users
  console.log("👤 Creating users...");
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@drybros.com",
      password: hashedPassword,
      fullName: "Admin User",
      role: "ADMIN",
      phone: "9876543210",
      isActive: true,
    },
  });

  // Create additional admin user
  const hashedPasswordVishnu = await bcrypt.hash("ChainReaction@123", 10);
  const vishnuAdmin = await prisma.user.create({
    data: {
      email: "vishnukvcse@gmail.com",
      password: hashedPasswordVishnu,
      fullName: "Vishnu KV",
      role: "ADMIN",
      phone: "8078599537",
      isActive: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: "manager@drybros.com",
      password: hashedPassword,
      fullName: "Manager User",
      role: "MANAGER",
      phone: "9876543211",
      isActive: true,
    },
  });

  // Create Franchises
  console.log("🏢 Creating franchises...");
  const franchise1 = await prisma.franchise.create({
    data: {
      code: "CLT_MAIN",
      name: "Calicut Main Branch",
      city: "Calicut",
      region: "Kozhikode",
      address: "MG Road, Calicut, Kerala 673001",
      phone: "0495-1234567",
      inchargeName: "John Doe",
      status: "ACTIVE",
      isActive: true,
      legalDocumentsCollected: true,
    },
  });

  const franchise2 = await prisma.franchise.create({
    data: {
      code: "EKM_MAIN",
      name: "Ernakulam Main Branch",
      city: "Ernakulam",
      region: "Kochi",
      address: "Marine Drive, Ernakulam, Kerala 682031",
      phone: "0484-1234567",
      inchargeName: "Jane Smith",
      status: "ACTIVE",
      isActive: true,
      legalDocumentsCollected: true,
    },
  });

  const franchise3 = await prisma.franchise.create({
    data: {
      code: "TVM_MAIN",
      name: "Thiruvananthapuram Main Branch",
      city: "Thiruvananthapuram",
      region: "Trivandrum",
      address: "MG Road, Thiruvananthapuram, Kerala 695001",
      phone: "0471-1234567",
      inchargeName: "Robert Johnson",
      status: "ACTIVE",
      isActive: true,
      legalDocumentsCollected: true,
    },
  });

  // Create Staff
  console.log("👔 Creating staff...");
  const staff1 = await prisma.staff.create({
    data: {
      name: "Rajesh Kumar",
      phone: "9876543220",
      email: "rajesh.kumar@drybros.com",
      password: hashedPassword,
      franchiseId: franchise1.id,
      monthlySalary: 25000,
      address: "Staff Quarters, Calicut",
      emergencyContact: "9876543221",
      emergencyContactRelation: "Brother",
      govtId: true,
      addressProof: true,
      certificates: true,
      previousExperienceCert: true,
      status: "ACTIVE",
      isActive: true,
      joinDate: new Date("2024-01-15"),
      updatedAt: new Date(),
    },
  });

  const staff2 = await prisma.staff.create({
    data: {
      name: "Priya Nair",
      phone: "9876543230",
      email: "priya.nair@drybros.com",
      password: hashedPassword,
      franchiseId: franchise2.id,
      monthlySalary: 28000,
      address: "Staff Quarters, Ernakulam",
      emergencyContact: "9876543231",
      emergencyContactRelation: "Husband",
      govtId: true,
      addressProof: true,
      certificates: true,
      previousExperienceCert: true,
      status: "ACTIVE",
      isActive: true,
      joinDate: new Date("2024-02-01"),
      updatedAt: new Date(),
    },
  });

  const staff3 = await prisma.staff.create({
    data: {
      name: "Suresh Menon",
      phone: "9876543240",
      email: "suresh.menon@drybros.com",
      password: hashedPassword,
      franchiseId: franchise3.id,
      monthlySalary: 26000,
      address: "Staff Quarters, Trivandrum",
      emergencyContact: "9876543241",
      emergencyContactRelation: "Father",
      govtId: true,
      addressProof: true,
      certificates: true,
      previousExperienceCert: true,
      status: "ACTIVE",
      isActive: true,
      joinDate: new Date("2024-01-20"),
      updatedAt: new Date(),
    },
  });

  // Hash password for drivers
  const driverPassword = await bcrypt.hash("driver123", 10);

  // Create Drivers
  console.log("🚗 Creating drivers...");
  const driver1 = await prisma.driver.create({
    data: {
      franchiseId: franchise1.id,
      firstName: "Ramesh",
      lastName: "Kumar",
      phone: "9000000001",
      email: "ramesh.kumar@driver.com",
      altPhone: "9000000002",
      driverCode: "DRV-001",
      password: driverPassword,
      emergencyContactName: "Lakshmi Kumar",
      emergencyContactPhone: "9000000010",
      emergencyContactRelation: "Wife",
      address: "House No. 123, Calicut",
      city: "Calicut",
      state: "Kerala",
      pincode: "673001",
      licenseNumber: "KL07-2020-123456",
      licenseExpDate: new Date("2026-12-31"),
      bankAccountName: "Ramesh Kumar",
      bankAccountNumber: "1234567890123",
      bankIfscCode: "SBIN0001234",
      aadharCard: true,
      license: true,
      educationCert: true,
      previousExp: true,
      carTypes: JSON.stringify(["MANUAL", "AUTOMATIC"]),
      status: "ACTIVE",
      driverTripStatus: "AVAILABLE",
      complaintCount: 0,
      bannedGlobally: false,
      currentRating: 5.0,
      isActive: true,
      createdBy: adminUser.id,
    },
  });

  const driver2 = await prisma.driver.create({
    data: {
      franchiseId: franchise1.id,
      firstName: "Suresh",
      lastName: "Pillai",
      phone: "9000000003",
      email: "suresh.pillai@driver.com",
      altPhone: "9000000004",
      driverCode: "DRV-002",
      password: driverPassword,
      emergencyContactName: "Meera Pillai",
      emergencyContactPhone: "9000000020",
      emergencyContactRelation: "Sister",
      address: "House No. 456, Calicut",
      city: "Calicut",
      state: "Kerala",
      pincode: "673002",
      licenseNumber: "KL07-2019-234567",
      licenseExpDate: new Date("2027-06-30"),
      bankAccountName: "Suresh Pillai",
      bankAccountNumber: "2345678901234",
      bankIfscCode: "HDFC0002345",
      aadharCard: true,
      license: true,
      educationCert: true,
      previousExp: true,
      carTypes: JSON.stringify(["MANUAL", "PREMIUM_CARS"]),
      status: "ACTIVE",
      driverTripStatus: "AVAILABLE",
      complaintCount: 0,
      bannedGlobally: false,
      currentRating: 5.0,
      isActive: true,
      createdBy: adminUser.id,
    },
  });

  const driver3 = await prisma.driver.create({
    data: {
      franchiseId: franchise2.id,
      firstName: "Ajay",
      lastName: "Menon",
      phone: "9000000005",
      email: "ajay.menon@driver.com",
      altPhone: "9000000006",
      driverCode: "DRV-003",
      password: driverPassword,
      emergencyContactName: "Deepa Menon",
      emergencyContactPhone: "9000000030",
      emergencyContactRelation: "Wife",
      address: "House No. 789, Ernakulam",
      city: "Ernakulam",
      state: "Kerala",
      pincode: "682031",
      licenseNumber: "KL07-2021-345678",
      licenseExpDate: new Date("2028-03-31"),
      bankAccountName: "Ajay Menon",
      bankAccountNumber: "3456789012345",
      bankIfscCode: "ICIC0003456",
      aadharCard: true,
      license: true,
      educationCert: true,
      previousExp: true,
      carTypes: JSON.stringify(["AUTOMATIC", "LUXURY_CARS"]),
      status: "ACTIVE",
      driverTripStatus: "AVAILABLE",
      complaintCount: 0,
      bannedGlobally: false,
      currentRating: 5.0,
      isActive: true,
      createdBy: managerUser.id,
    },
  });

  const driver4 = await prisma.driver.create({
    data: {
      franchiseId: franchise2.id,
      firstName: "Vikram",
      lastName: "Nair",
      phone: "9000000007",
      email: "vikram.nair@driver.com",
      altPhone: "9000000008",
      driverCode: "DRV-004",
      password: driverPassword,
      emergencyContactName: "Anita Nair",
      emergencyContactPhone: "9000000040",
      emergencyContactRelation: "Mother",
      address: "House No. 321, Ernakulam",
      city: "Ernakulam",
      state: "Kerala",
      pincode: "682032",
      licenseNumber: "KL07-2020-456789",
      licenseExpDate: new Date("2026-09-30"),
      bankAccountName: "Vikram Nair",
      bankAccountNumber: "4567890123456",
      bankIfscCode: "AXIS0004567",
      aadharCard: true,
      license: true,
      educationCert: true,
      previousExp: true,
      carTypes: JSON.stringify(["MANUAL", "AUTOMATIC", "PREMIUM_CARS"]),
      status: "ACTIVE",
      driverTripStatus: "AVAILABLE",
      complaintCount: 0,
      bannedGlobally: false,
      currentRating: 5.0,
      isActive: true,
      createdBy: managerUser.id,
    },
  });

  const driver5 = await prisma.driver.create({
    data: {
      franchiseId: franchise3.id,
      firstName: "Arjun",
      lastName: "Krishnan",
      phone: "9000000009",
      email: "arjun.krishnan@driver.com",
      altPhone: "9000000010",
      driverCode: "DRV-005",
      password: driverPassword,
      emergencyContactName: "Radha Krishnan",
      emergencyContactPhone: "9000000050",
      emergencyContactRelation: "Wife",
      address: "House No. 654, Trivandrum",
      city: "Thiruvananthapuram",
      state: "Kerala",
      pincode: "695001",
      licenseNumber: "KL07-2022-567890",
      licenseExpDate: new Date("2029-01-31"),
      bankAccountName: "Arjun Krishnan",
      bankAccountNumber: "5678901234567",
      bankIfscCode: "KOTAK0005678",
      aadharCard: true,
      license: true,
      educationCert: true,
      previousExp: true,
      carTypes: JSON.stringify(["AUTOMATIC", "LUXURY_CARS", "SPORTY_CARS"]),
      status: "ACTIVE",
      driverTripStatus: "AVAILABLE",
      complaintCount: 0,
      bannedGlobally: false,
      currentRating: 5.0,
      isActive: true,
      createdBy: adminUser.id,
    },
  });

  // Create Distance Scopes
  console.log("📍 Creating distance scopes...");
  const cityScope = await prisma.distanceScope.create({
    data: {
      name: "CITY",
      description: "Within city limits",
      status: "ACTIVE",
      updatedAt: new Date(),
    },
  });

  const longScope = await prisma.distanceScope.create({
    data: {
      name: "LONG",
      description: "Inter-city or long distance",
      status: "ACTIVE",
      updatedAt: new Date(),
    },
  });

  // Create Trip Patterns
  console.log("🔄 Creating trip patterns...");
  const roundPattern = await prisma.tripPattern.create({
    data: {
      name: "ROUND",
      description: "Round trip",
      status: "ACTIVE",
      updatedAt: new Date(),
    },
  });

  const dropoffPattern = await prisma.tripPattern.create({
    data: {
      name: "DROPOFF",
      description: "One-way dropoff",
      status: "ACTIVE",
      updatedAt: new Date(),
    },
  });

  // Create Trip Type Configs
  console.log("💰 Creating trip type configs...");
  const cityRoundConfig = await prisma.tripTypeConfig.create({
    data: {
      name: "City Round",
      description: "City round trip",
      DistanceScope: {
        connect: { id: cityScope.id },
      },
      TripPattern: {
        connect: { id: roundPattern.id },
      },
      basePrice: 400,
      baseDuration: 3,
      baseDistance: null,
      extraPerHour: 100,
      extraPerHalfHour: null,
      extraPerKm: null,
      premiumCarMultiplier: 1.5,
      forPremiumCars: null,
      distanceSlabs: null,
      status: "ACTIVE",
    },
  });

  const cityDropConfig = await prisma.tripTypeConfig.create({
    data: {
      name: "City Drop",
      description: "City dropoff",
      DistanceScope: {
        connect: { id: cityScope.id },
      },
      TripPattern: {
        connect: { id: dropoffPattern.id },
      },
      basePrice: 500,
      baseDuration: 2,
      baseDistance: 20,
      extraPerHour: 100,
      extraPerHalfHour: 50,
      extraPerKm: null,
      premiumCarMultiplier: 1.5,
      forPremiumCars: null,
      distanceSlabs: null,
      status: "ACTIVE",
    },
  });

  const longRoundConfig = await prisma.tripTypeConfig.create({
    data: {
      name: "Long Round",
      description: "Long distance round trip",
      DistanceScope: {
        connect: { id: longScope.id },
      },
      TripPattern: {
        connect: { id: roundPattern.id },
      },
      basePrice: 450,
      baseDuration: 3,
      baseDistance: null,
      extraPerHour: 100,
      extraPerHalfHour: null,
      extraPerKm: null,
      premiumCarMultiplier: 1.5,
      forPremiumCars: null,
      distanceSlabs: null,
      status: "ACTIVE",
    },
  });

  const longDropConfig = await prisma.tripTypeConfig.create({
    data: {
      name: "Long Drop",
      description: "Long distance dropoff",
      DistanceScope: {
        connect: { id: longScope.id },
      },
      TripPattern: {
        connect: { id: dropoffPattern.id },
      },
      basePrice: 600,
      baseDuration: null,
      baseDistance: null,
      extraPerHour: 0,
      extraPerHalfHour: null,
      extraPerKm: 15,
      premiumCarMultiplier: 1.5,
      forPremiumCars: null,
      distanceSlabs: [
        { from: 0, to: 50, price: 1000 },
        { from: 50, to: 100, price: 2000 },
        { from: 100, to: 200, price: 3500 },
        { from: 200, to: null, price: 5000 },
      ],
      status: "ACTIVE",
    },
  });

  // Create Sample Customers
  console.log("👥 Creating customers...");
  const customer1 = await prisma.customer.create({
    data: {
      fullName: "Rajesh Nair",
      phone: "9876543300",
      email: "rajesh.nair@example.com",
      city: "Calicut",
      franchiseId: franchise1.id,
      notes: "Regular customer",
      updatedAt: new Date(),
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      fullName: "Priya Menon",
      phone: "9876543301",
      email: "priya.menon@example.com",
      city: "Ernakulam",
      franchiseId: franchise2.id,
      notes: "Corporate client",
      updatedAt: new Date(),
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      fullName: "Suresh Kumar",
      phone: "9876543302",
      email: "suresh.kumar@example.com",
      city: "Trivandrum",
      franchiseId: franchise3.id,
      notes: "VIP customer",
      updatedAt: new Date(),
    },
  });

  // Create Sample Trips with NOT_ASSIGNED status
  console.log("🚕 Creating trips...");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(14, 30, 0, 0);

  await prisma.trip.create({
    data: {
      franchiseId: franchise1.id,
      customerId: customer1.id,
      customerName: customer1.fullName,
      customerPhone: customer1.phone,
      customerEmail: customer1.email,
      tripType: "CITY_ROUND",
      status: "NOT_ASSIGNED",
      pickupLocation: "MG Road, Calicut",
      pickupAddress: "MG Road, Calicut, Kerala 673001",
      pickupLocationNote: "Near City Center",
      dropLocation: "Beach Road, Calicut",
      dropAddress: "Beach Road, Calicut, Kerala 673001",
      dropLocationNote: "Near Beach",
      carType: JSON.stringify({ gearType: "MANUAL", category: "NORMAL" }),
      scheduledAt: tomorrow,
      baseAmount: 400,
      extraAmount: 0,
      totalAmount: 400,
      finalAmount: 400,
      isDetailsReconfirmed: true,
      isFareDiscussed: true,
      isPriceAccepted: true,
      paymentStatus: "PENDING",
      createdBy: adminUser.id,
      updatedAt: new Date(),
    },
  });

  await prisma.trip.create({
    data: {
      franchiseId: franchise2.id,
      customerId: customer2.id,
      customerName: customer2.fullName,
      customerPhone: customer2.phone,
      customerEmail: customer2.email,
      tripType: "CITY_DROPOFF",
      status: "NOT_ASSIGNED",
      pickupLocation: "Marine Drive, Ernakulam",
      pickupAddress: "Marine Drive, Ernakulam, Kerala 682031",
      pickupLocationNote: "Near Boat Jetty",
      dropLocation: "Fort Kochi, Ernakulam",
      dropAddress: "Fort Kochi, Ernakulam, Kerala 682001",
      dropLocationNote: "Near Fort",
      carType: JSON.stringify({ gearType: "AUTOMATIC", category: "PREMIUM" }),
      scheduledAt: dayAfterTomorrow,
      baseAmount: 500,
      extraAmount: 0,
      totalAmount: 500,
      finalAmount: 500,
      isDetailsReconfirmed: true,
      isFareDiscussed: true,
      isPriceAccepted: true,
      paymentStatus: "PENDING",
      createdBy: managerUser.id,
      updatedAt: new Date(),
    },
  });

  await prisma.trip.create({
    data: {
      franchiseId: franchise3.id,
      customerId: customer3.id,
      customerName: customer3.fullName,
      customerPhone: customer3.phone,
      customerEmail: customer3.email,
      tripType: "LONG_ROUND",
      status: "NOT_ASSIGNED",
      pickupLocation: "MG Road, Trivandrum",
      pickupAddress: "MG Road, Thiruvananthapuram, Kerala 695001",
      pickupLocationNote: "Near Secretariat",
      dropLocation: "Kovalam Beach, Trivandrum",
      dropAddress: "Kovalam Beach, Thiruvananthapuram, Kerala 695527",
      dropLocationNote: "Beach Resort",
      carType: JSON.stringify({ gearType: "AUTOMATIC", category: "LUXURY" }),
      scheduledAt: tomorrow,
      baseAmount: 450,
      extraAmount: 0,
      totalAmount: 450,
      finalAmount: 450,
      isDetailsReconfirmed: true,
      isFareDiscussed: true,
      isPriceAccepted: true,
      paymentStatus: "PENDING",
      createdBy: adminUser.id,
      updatedAt: new Date(),
    },
  });

  await prisma.trip.create({
    data: {
      franchiseId: franchise1.id,
      customerId: customer1.id,
      customerName: customer1.fullName,
      customerPhone: customer1.phone,
      customerEmail: customer1.email,
      tripType: "CITY_DROPOFF",
      status: "NOT_ASSIGNED",
      pickupLocation: "Railway Station, Calicut",
      pickupAddress: "Calicut Railway Station, Calicut, Kerala 673001",
      pickupLocationNote: "Platform 1",
      dropLocation: "Airport, Calicut",
      dropAddress: "Calicut International Airport, Calicut, Kerala 673647",
      dropLocationNote: "Terminal 1",
      carType: JSON.stringify({ gearType: "MANUAL", category: "NORMAL" }),
      scheduledAt: dayAfterTomorrow,
      baseAmount: 500,
      extraAmount: 0,
      totalAmount: 500,
      finalAmount: 500,
      isDetailsReconfirmed: true,
      isFareDiscussed: true,
      isPriceAccepted: true,
      paymentStatus: "PENDING",
      createdBy: adminUser.id,
      updatedAt: new Date(),
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - Roles: 3`);
  console.log(`   - Users: 3`);
  console.log(`   - Franchises: 3`);
  console.log(`   - Staff: 3`);
  console.log(`   - Drivers: 5`);
  console.log(`   - Distance Scopes: 2`);
  console.log(`   - Trip Patterns: 2`);
  console.log(`   - Trip Type Configs: 4`);
  console.log(`   - Customers: 3`);
  console.log(`   - Trips (NOT_ASSIGNED): 4`);
  console.log("\n🔑 Login Credentials:");
  console.log(`   Admin 1: admin@drybros.com / password123`);
  console.log(`   Admin 2: vishnukvcse@gmail.com / ChainReaction@123`);
  console.log(`   Manager: manager@drybros.com / password123`);
  console.log(`   Drivers: driverCode / driver123`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

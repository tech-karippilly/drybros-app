// prisma/seed.ts
import { PrismaClient, FranchiseStatus, StaffStatus, DriverStatus, DriverTripStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding franchise data...");

  // Define 5 dummy franchises
  const franchiseTemplates = [
    {
      code: "FRN-MUM001",
      name: "DryBros Mumbai Central",
      city: "Mumbai",
      region: "Mumbai",
      address: "123, MG Road, Near Central Station, Mumbai - 400001",
      phone: "+91-22-23456789",
      inchargeName: "Rajesh Kumar",
      storeImage: null,
      legalDocumentsCollected: true,
      status: FranchiseStatus.ACTIVE,
      isActive: true,
    },
    {
      code: "FRN-DEL002",
      name: "DryBros Delhi Connaught Place",
      city: "Delhi",
      region: "Delhi",
      address: "456, Connaught Place, Block A, New Delhi - 110001",
      phone: "+91-11-23456790",
      inchargeName: "Priya Sharma",
      storeImage: null,
      legalDocumentsCollected: true,
      status: FranchiseStatus.ACTIVE,
      isActive: true,
    },
    {
      code: "FRN-BLR003",
      name: "DryBros Bangalore Koramangala",
      city: "Bangalore",
      region: "Bangalore",
      address: "789, 5th Block, Koramangala, Bangalore - 560095",
      phone: "+91-80-23456791",
      inchargeName: "Anil Reddy",
      storeImage: null,
      legalDocumentsCollected: false,
      status: FranchiseStatus.ACTIVE,
      isActive: true,
    },
    {
      code: "FRN-HYD004",
      name: "DryBros Hyderabad Hitech City",
      city: "Hyderabad",
      region: "Hyderabad",
      address: "321, Hitech City Main Road, Madhapur, Hyderabad - 500081",
      phone: "+91-40-23456792",
      inchargeName: "Suresh Naidu",
      storeImage: null,
      legalDocumentsCollected: true,
      status: FranchiseStatus.ACTIVE,
      isActive: true,
    },
    {
      code: "FRN-CHN005",
      name: "DryBros Chennai T Nagar",
      city: "Chennai",
      region: "Chennai",
      address: "654, Usman Road, T Nagar, Chennai - 600017",
      phone: "+91-44-23456793",
      inchargeName: "Lakshmi Iyer",
      storeImage: null,
      legalDocumentsCollected: true,
      status: FranchiseStatus.TEMPORARILY_CLOSED,
      isActive: true,
    },
  ];

  // Fetch existing franchises
  const existingFranchises = await prisma.franchise.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Get existing franchise codes to avoid duplicates
  const existingCodes = new Set(existingFranchises.map(f => f.code));

  // Create missing franchises
  let createdCount = 0;
  for (const franchiseTemplate of franchiseTemplates) {
    if (!existingCodes.has(franchiseTemplate.code)) {
      const created = await prisma.franchise.create({
        data: franchiseTemplate,
      });
      existingFranchises.push(created);
      createdCount++;
      console.log(`✅ Created franchise: ${created.name} (${created.code})`);
    } else {
      console.log(`ℹ️  Franchise already exists: ${franchiseTemplate.name} (${franchiseTemplate.code})`);
    }
  }

  if (createdCount > 0) {
    console.log(`\n🎉 Successfully created ${createdCount} new franchises!`);
  } else {
    console.log(`\nℹ️  All franchises already exist.`);
  }

  // Get the first 5 franchises for staff seeding
  const createdFranchises = existingFranchises.slice(0, 5);
  
  if (createdFranchises.length < 5) {
    console.log(`\n⚠️  Only ${createdFranchises.length} franchises available. Need at least 5 for staff seeding.`);
    console.log("💡 Please create more franchises manually or delete existing ones to reseed.");
    return;
  }

  // Seed Staff Data
  console.log("\n🌱 Seeding staff data...");

  // Check if staff already exist (but allow creating specific staff member)
  const existingStaff = await prisma.staff.count();
  if (existingStaff > 0) {
    console.log(`⚠️  Found ${existingStaff} existing staff members.`);
    console.log("💡 Will only create new staff members that don't exist.");
  }

  // Default password for all staff (will be hashed)
  const defaultPassword = "Staff@123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  
  // Custom password for specific staff member
  const customPassword = "ChainReaction@123";
  const customHashedPassword = await bcrypt.hash(customPassword, 10);

  // Staff data - 3 staff per franchise (15 total)
  const staffData = [
    // Mumbai Central (3 staff)
    {
      name: "Amit Patel",
      email: "amit.patel@drybros.in",
      phone: "+919876543210",
      password: hashedPassword,
      franchiseId: createdFranchises[0].id,
      monthlySalary: 25000,
      address: "Flat 201, Green Valley Apartments, Andheri West, Mumbai - 400053",
      emergencyContact: "+919876543211",
      emergencyContactRelation: "Brother",
      govtId: true,
      addressProof: true,
      certificates: true,
      previousExperienceCert: true,
      profilePic: null,
      status: StaffStatus.ACTIVE,
      joinDate: new Date("2024-01-15"),
    },
    {
      name: "Sneha Desai",
      email: "sneha.desai@drybros.in",
      phone: "+919876543212",
      password: hashedPassword,
      franchiseId: createdFranchises[0].id,
      monthlySalary: 28000,
      address: "B-304, Sunrise Complex, Bandra East, Mumbai - 400051",
      emergencyContact: "+919876543213",
      emergencyContactRelation: "Father",
      govtId: true,
      addressProof: true,
      certificates: false,
      previousExperienceCert: true,
      profilePic: null,
      status: StaffStatus.ACTIVE,
      joinDate: new Date("2024-02-01"),
    },
    {
      name: "Rahul Shah",
      email: "rahul.shah@drybros.in",
      phone: "+919876543214",
      password: hashedPassword,
      franchiseId: createdFranchises[0].id,
      monthlySalary: 22000,
      address: "C-12, Royal Heights, Goregaon West, Mumbai - 400062",
      emergencyContact: "+919876543215",
      emergencyContactRelation: "Wife",
      govtId: true,
      addressProof: false,
      certificates: true,
      previousExperienceCert: false,
      profilePic: null,
      status: StaffStatus.ACTIVE,
      joinDate: new Date("2024-03-10"),
    },
    // Delhi Connaught Place (3 staff)
    {
      name: "Vikram Singh",
      email: "vikram.singh@drybros.in",
      phone: "+919876543216",
      password: hashedPassword,
      franchiseId: createdFranchises[1].id,
      monthlySalary: 26000,
      address: "H-45, Green Park Extension, New Delhi - 110016",
      emergencyContact: "+919876543217",
      emergencyContactRelation: "Mother",
      govtId: true,
      addressProof: true,
      certificates: true,
      previousExperienceCert: true,
      profilePic: null,
      status: StaffStatus.ACTIVE,
      joinDate: new Date("2024-01-20"),
    },
    {
      name: "Priyanka Verma",
      email: "priyanka.verma@drybros.in",
      phone: "+919876543218",
      password: hashedPassword,
      franchiseId: createdFranchises[1].id,
      monthlySalary: 27000,
      address: "Flat 302, Tower B, Dwarka Sector 12, New Delhi - 110075",
      emergencyContact: "+919876543219",
      emergencyContactRelation: "Husband",
      govtId: true,
      addressProof: true,
      certificates: true,
      previousExperienceCert: false,
      profilePic: null,
      status: StaffStatus.ACTIVE,
      joinDate: new Date("2024-02-15"),
    },
    {
      name: "Ankit Gupta",
      email: "ankit.gupta@drybros.in",
      phone: "+919876543220",
      password: hashedPassword,
      franchiseId: createdFranchises[1].id,
      monthlySalary: 24000,
      address: "A-8, Rohini Sector 15, New Delhi - 110089",
      emergencyContact: "+919876543221",
      emergencyContactRelation: "Sister",
      govtId: false,
      addressProof: true,
      certificates: false,
      previousExperienceCert: true,
      profilePic: null,
      status: StaffStatus.SUSPENDED,
      suspendedUntil: new Date("2024-12-31"),
      joinDate: new Date("2024-03-05"),
    },
    // Bangalore Koramangala (3 staff)
    {
      name: "Karthik Nair",
      email: "karthik.nair@drybros.in",
      phone: "+919876543222",
      password: hashedPassword,
      franchiseId: createdFranchises[2].id,
      monthlySalary: 29000,
      address: "No. 45, 3rd Cross, Indiranagar, Bangalore - 560038",
      emergencyContact: "+919876543223",
      emergencyContactRelation: "Father",
      govtId: true,
      addressProof: true,
      certificates: true,
      previousExperienceCert: true,
      profilePic: null,
      status: StaffStatus.ACTIVE,
      joinDate: new Date("2024-01-10"),
    },
    {
      name: "Meera Iyer",
      email: "meera.iyer@drybros.in",
      phone: "+919876543224",
      password: hashedPassword,
      franchiseId: createdFranchises[2].id,
      monthlySalary: 25500,
      address: "Flat 501, Prestige Towers, Whitefield, Bangalore - 560066",
      emergencyContact: "+919876543225",
      emergencyContactRelation: "Brother",
      govtId: true,
      addressProof: true,
      certificates: false,
      previousExperienceCert: true,
      profilePic: null,
      status: StaffStatus.ACTIVE,
      joinDate: new Date("2024-02-20"),
    },
    {
      name: "Ravi Kumar",
      email: "ravi.kumar@drybros.in",
      phone: "+919876543226",
      password: hashedPassword,
      franchiseId: createdFranchises[2].id,
      monthlySalary: 23000,
      address: "B-203, Jayanagar 4th Block, Bangalore - 560011",
      emergencyContact: "+919876543227",
      emergencyContactRelation: "Wife",
      govtId: true,
      addressProof: false,
      certificates: true,
      previousExperienceCert: false,
      profilePic: null,
      status: StaffStatus.ACTIVE,
      joinDate: new Date("2024-03-15"),
    },
    // Hyderabad Hitech City (3 staff)
    {
      name: "Suresh Reddy",
      email: "suresh.reddy@drybros.in",
      phone: "+919876543228",
      password: hashedPassword,
      franchiseId: createdFranchises[3].id,
      monthlySalary: 26500,
      address: "Plot 12, Gachibowli, Hyderabad - 500032",
      emergencyContact: "+919876543229",
      emergencyContactRelation: "Mother",
      govtId: true,
      addressProof: true,
      certificates: true,
      previousExperienceCert: true,
      profilePic: null,
      status: StaffStatus.ACTIVE,
      joinDate: new Date("2024-01-25"),
    },
    {
      name: "Lakshmi Rao",
      email: "lakshmi.rao@drybros.in",
      phone: "+919876543230",
      password: hashedPassword,
      franchiseId: createdFranchises[3].id,
      monthlySalary: 27500,
      address: "Flat 304, Kondapur, Hyderabad - 500084",
      emergencyContact: "+919876543231",
      emergencyContactRelation: "Husband",
      govtId: true,
      addressProof: true,
      certificates: true,
      previousExperienceCert: false,
      profilePic: null,
      status: StaffStatus.ACTIVE,
      joinDate: new Date("2024-02-10"),
    },
    {
      name: "Venkatesh Naidu",
      email: "venkatesh.naidu@drybros.in",
      phone: "+919876543232",
      password: hashedPassword,
      franchiseId: createdFranchises[3].id,
      monthlySalary: 24500,
      address: "H-8, Banjara Hills, Hyderabad - 500034",
      emergencyContact: "+919876543233",
      emergencyContactRelation: "Sister",
      govtId: false,
      addressProof: true,
      certificates: false,
      previousExperienceCert: true,
      profilePic: null,
      status: StaffStatus.ACTIVE,
      joinDate: new Date("2024-03-20"),
    },
    // Chennai T Nagar (3 staff)
    {
      name: "Arjun Iyer",
      email: "arjun.iyer@drybros.in",
      phone: "+919876543234",
      password: hashedPassword,
      franchiseId: createdFranchises[4].id,
      monthlySalary: 26000,
      address: "Flat 205, Adyar, Chennai - 600020",
      emergencyContact: "+919876543235",
      emergencyContactRelation: "Father",
      govtId: true,
      addressProof: true,
      certificates: true,
      previousExperienceCert: true,
      profilePic: null,
      status: StaffStatus.ACTIVE,
      joinDate: new Date("2024-01-30"),
    },
    {
      name: "Divya Menon",
      email: "divya.menon@drybros.in",
      phone: "+919876543236",
      password: hashedPassword,
      franchiseId: createdFranchises[4].id,
      monthlySalary: 27000,
      address: "B-12, Anna Nagar, Chennai - 600040",
      emergencyContact: "+919876543237",
      emergencyContactRelation: "Husband",
      govtId: true,
      addressProof: true,
      certificates: false,
      previousExperienceCert: true,
      profilePic: null,
      status: StaffStatus.ACTIVE,
      joinDate: new Date("2024-02-25"),
    },
    {
      name: "Mohan Krishnan",
      email: "mohan.krishnan@drybros.in",
      phone: "+919876543238",
      password: hashedPassword,
      franchiseId: createdFranchises[4].id,
      monthlySalary: 23500,
      address: "C-45, Velachery, Chennai - 600042",
      emergencyContact: "+919876543239",
      emergencyContactRelation: "Brother",
      govtId: true,
      addressProof: false,
      certificates: true,
      previousExperienceCert: false,
      profilePic: null,
      status: StaffStatus.BLOCKED,
      joinDate: new Date("2024-03-25"),
    },
    // Custom staff member with specific details
    {
      name: "Nalini T",
      email: "vishnukarippilly@gmail.com",
      phone: "9645593737",
      password: customHashedPassword,
      franchiseId: "012583b5-ffce-46cd-9aec-caa22c6cdb61",
      monthlySalary: 28000,
      address: "123, Main Street, City Center, Bangalore - 560001",
      emergencyContact: "+919876543240",
      emergencyContactRelation: "Husband",
      govtId: true,
      addressProof: true,
      certificates: true,
      previousExperienceCert: true,
      profilePic: null,
      status: StaffStatus.ACTIVE,
      joinDate: new Date("2024-04-01"),
    },
  ];

  let staffCreatedCount = 0;
  let staffSkippedCount = 0;

  for (const staff of staffData) {
    // Check if staff with this email or phone already exists
    const existingStaffByEmail = await prisma.staff.findUnique({
      where: { email: staff.email },
    });
    const existingStaffByPhone = await prisma.staff.findUnique({
      where: { phone: staff.phone },
    });

    if (existingStaffByEmail || existingStaffByPhone) {
      console.log(`ℹ️  Staff already exists: ${staff.name} (${staff.email}) - Skipping`);
      staffSkippedCount++;
      continue;
    }

    try {
      const created = await prisma.staff.create({
        data: {
          ...staff,
          updatedAt: new Date(),
        } as any, // Type assertion to handle Prisma's complex input types
      });
      console.log(`✅ Created staff: ${created.name} (${created.email}) - ${created.phone}`);
      staffCreatedCount++;
    } catch (error: any) {
      console.log(`❌ Failed to create staff ${staff.name}: ${error.message}`);
    }
  }

  console.log(`\n🎉 Staff seeding completed!`);
  console.log(`   ✅ Created: ${staffCreatedCount} staff members`);
  if (staffSkippedCount > 0) {
    console.log(`   ℹ️  Skipped: ${staffSkippedCount} staff members (already exist)`);
  }
  console.log(`\n📝 Default password for most staff: ${defaultPassword}`);
  console.log(`📝 Custom password for Nalini T: ${customPassword}`);
  console.log(`💡 Staff can login using their email and password.`);

  // Seed Driver Data
  console.log("\n🌱 Seeding driver data...");

  // Staff ID who created these drivers
  const createdByStaffId = "b796d562-e2dd-46bc-b8ee-73e59ebb8ed0";

  // Default password for all drivers (will be hashed)
  const driverDefaultPassword = "Driver@123";
  const driverHashedPassword = await bcrypt.hash(driverDefaultPassword, 10);

  // Generate unique driver code
  function generateDriverCode(): string {
    const prefix = "DRV";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${code}`;
  }

  // Get unique driver code
  async function getUniqueDriverCode(): Promise<string> {
    const maxAttempts = 20;
    let driverCode = generateDriverCode();
    let attempts = 0;
    const checkedCodes = new Set<string>();

    while (attempts < maxAttempts) {
      if (checkedCodes.has(driverCode)) {
        driverCode = generateDriverCode();
        attempts++;
        continue;
      }

      checkedCodes.add(driverCode);
      const existing = await prisma.driver.findUnique({
        where: { driverCode },
      });
      
      if (!existing) {
        return driverCode;
      }
      
      driverCode = generateDriverCode();
      attempts++;
    }

    throw new Error("Failed to generate unique driver code after multiple attempts");
  }

  // Driver data - 3 drivers per franchise (15 total)
  const driverData = [
    // Mumbai Central (3 drivers)
    {
      firstName: "Ramesh",
      lastName: "Patel",
      phone: "+919876543300",
      email: "ramesh.patel@drybros.in",
      altPhone: "+919876543301",
      password: driverHashedPassword,
      franchiseId: createdFranchises[0].id,
      emergencyContactName: "Suresh Patel",
      emergencyContactPhone: "+919876543302",
      emergencyContactRelation: "Brother",
      address: "Flat 301, Green Valley Apartments, Andheri West, Mumbai - 400053",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400053",
      licenseNumber: "MH-01-2020-123456",
      licenseExpDate: new Date("2026-12-31"),
      bankAccountName: "Ramesh Patel",
      bankAccountNumber: "1234567890123456",
      bankIfscCode: "HDFC0001234",
      aadharCard: true,
      license: true,
      educationCert: true,
      previousExp: true,
      carTypes: JSON.stringify(["MANUAL", "AUTOMATIC"]),
      status: DriverStatus.ACTIVE,
      driverTripStatus: DriverTripStatus.AVAILABLE,
      complaintCount: 0,
      bannedGlobally: false,
      dailyTargetAmount: 5000,
      currentRating: 4.5,
      isActive: true,
      createdBy: createdByStaffId,
    },
    {
      firstName: "Sunita",
      lastName: "Sharma",
      phone: "+919876543303",
      email: "sunita.sharma@drybros.in",
      altPhone: "+919876543304",
      password: driverHashedPassword,
      franchiseId: createdFranchises[0].id,
      emergencyContactName: "Rajesh Sharma",
      emergencyContactPhone: "+919876543305",
      emergencyContactRelation: "Husband",
      address: "B-205, Sunrise Complex, Bandra East, Mumbai - 400051",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400051",
      licenseNumber: "MH-01-2021-234567",
      licenseExpDate: new Date("2027-06-30"),
      bankAccountName: "Sunita Sharma",
      bankAccountNumber: "2345678901234567",
      bankIfscCode: "ICIC0002345",
      aadharCard: true,
      license: true,
      educationCert: false,
      previousExp: true,
      carTypes: JSON.stringify(["AUTOMATIC"]),
      status: DriverStatus.ACTIVE,
      driverTripStatus: DriverTripStatus.AVAILABLE,
      complaintCount: 0,
      bannedGlobally: false,
      dailyTargetAmount: 4500,
      currentRating: 4.3,
      isActive: true,
      createdBy: createdByStaffId,
    },
    {
      firstName: "Vikram",
      lastName: "Singh",
      phone: "+919876543306",
      email: "vikram.singh@drybros.in",
      altPhone: null,
      password: driverHashedPassword,
      franchiseId: createdFranchises[0].id,
      emergencyContactName: "Priya Singh",
      emergencyContactPhone: "+919876543307",
      emergencyContactRelation: "Wife",
      address: "C-15, Royal Heights, Goregaon West, Mumbai - 400062",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400062",
      licenseNumber: "MH-01-2019-345678",
      licenseExpDate: new Date("2025-09-15"),
      bankAccountName: "Vikram Singh",
      bankAccountNumber: "3456789012345678",
      bankIfscCode: "SBIN0003456",
      aadharCard: true,
      license: true,
      educationCert: true,
      previousExp: false,
      carTypes: JSON.stringify(["MANUAL", "PREMIUM_CARS"]),
      status: DriverStatus.ACTIVE,
      driverTripStatus: DriverTripStatus.AVAILABLE,
      complaintCount: 1,
      bannedGlobally: false,
      dailyTargetAmount: 5500,
      currentRating: 4.7,
      isActive: true,
      createdBy: createdByStaffId,
    },
    // Delhi Connaught Place (3 drivers)
    {
      firstName: "Amit",
      lastName: "Kumar",
      phone: "+919876543308",
      email: "amit.kumar@drybros.in",
      altPhone: "+919876543309",
      password: driverHashedPassword,
      franchiseId: createdFranchises[1].id,
      emergencyContactName: "Anita Kumar",
      emergencyContactPhone: "+919876543310",
      emergencyContactRelation: "Sister",
      address: "H-50, Green Park Extension, New Delhi - 110016",
      city: "Delhi",
      state: "Delhi",
      pincode: "110016",
      licenseNumber: "DL-01-2020-456789",
      licenseExpDate: new Date("2026-11-20"),
      bankAccountName: "Amit Kumar",
      bankAccountNumber: "4567890123456789",
      bankIfscCode: "HDFC0004567",
      aadharCard: true,
      license: true,
      educationCert: true,
      previousExp: true,
      carTypes: JSON.stringify(["AUTOMATIC", "LUXURY_CARS"]),
      status: DriverStatus.ACTIVE,
      driverTripStatus: DriverTripStatus.AVAILABLE,
      complaintCount: 0,
      bannedGlobally: false,
      dailyTargetAmount: 6000,
      currentRating: 4.8,
      isActive: true,
      createdBy: createdByStaffId,
    },
    {
      firstName: "Deepak",
      lastName: "Verma",
      phone: "+919876543311",
      email: "deepak.verma@drybros.in",
      altPhone: null,
      password: driverHashedPassword,
      franchiseId: createdFranchises[1].id,
      emergencyContactName: "Rekha Verma",
      emergencyContactPhone: "+919876543312",
      emergencyContactRelation: "Wife",
      address: "Flat 401, Tower C, Dwarka Sector 12, New Delhi - 110075",
      city: "Delhi",
      state: "Delhi",
      pincode: "110075",
      licenseNumber: "DL-01-2021-567890",
      licenseExpDate: new Date("2027-03-10"),
      bankAccountName: "Deepak Verma",
      bankAccountNumber: "5678901234567890",
      bankIfscCode: "ICIC0005678",
      aadharCard: true,
      license: true,
      educationCert: false,
      previousExp: true,
      carTypes: JSON.stringify(["MANUAL"]),
      status: DriverStatus.ACTIVE,
      driverTripStatus: DriverTripStatus.AVAILABLE,
      complaintCount: 0,
      bannedGlobally: false,
      dailyTargetAmount: 4800,
      currentRating: 4.2,
      isActive: true,
      createdBy: createdByStaffId,
    },
    {
      firstName: "Neha",
      lastName: "Gupta",
      phone: "+919876543313",
      email: "neha.gupta@drybros.in",
      altPhone: "+919876543314",
      password: driverHashedPassword,
      franchiseId: createdFranchises[1].id,
      emergencyContactName: "Rahul Gupta",
      emergencyContactPhone: "+919876543315",
      emergencyContactRelation: "Brother",
      address: "A-10, Rohini Sector 15, New Delhi - 110089",
      city: "Delhi",
      state: "Delhi",
      pincode: "110089",
      licenseNumber: "DL-01-2019-678901",
      licenseExpDate: new Date("2025-08-25"),
      bankAccountName: "Neha Gupta",
      bankAccountNumber: "6789012345678901",
      bankIfscCode: "SBIN0006789",
      aadharCard: true,
      license: true,
      educationCert: true,
      previousExp: false,
      carTypes: JSON.stringify(["AUTOMATIC", "PREMIUM_CARS"]),
      status: DriverStatus.ACTIVE,
      driverTripStatus: DriverTripStatus.AVAILABLE,
      complaintCount: 0,
      bannedGlobally: false,
      dailyTargetAmount: 5200,
      currentRating: 4.6,
      isActive: true,
      createdBy: createdByStaffId,
    },
    // Bangalore Koramangala (3 drivers)
    {
      firstName: "Karthik",
      lastName: "Nair",
      phone: "+919876543316",
      email: "karthik.nair@drybros.in",
      altPhone: "+919876543317",
      password: driverHashedPassword,
      franchiseId: createdFranchises[2].id,
      emergencyContactName: "Lakshmi Nair",
      emergencyContactPhone: "+919876543318",
      emergencyContactRelation: "Mother",
      address: "No. 50, 4th Cross, Indiranagar, Bangalore - 560038",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560038",
      licenseNumber: "KA-01-2020-789012",
      licenseExpDate: new Date("2026-10-15"),
      bankAccountName: "Karthik Nair",
      bankAccountNumber: "7890123456789012",
      bankIfscCode: "HDFC0007890",
      aadharCard: true,
      license: true,
      educationCert: true,
      previousExp: true,
      carTypes: JSON.stringify(["MANUAL", "AUTOMATIC", "SPORTY_CARS"]),
      status: DriverStatus.ACTIVE,
      driverTripStatus: DriverTripStatus.AVAILABLE,
      complaintCount: 0,
      bannedGlobally: false,
      dailyTargetAmount: 5800,
      currentRating: 4.9,
      isActive: true,
      createdBy: createdByStaffId,
    },
    {
      firstName: "Meera",
      lastName: "Iyer",
      phone: "+919876543319",
      email: "meera.iyer@drybros.in",
      altPhone: null,
      password: driverHashedPassword,
      franchiseId: createdFranchises[2].id,
      emergencyContactName: "Ravi Iyer",
      emergencyContactPhone: "+919876543320",
      emergencyContactRelation: "Husband",
      address: "Flat 601, Prestige Towers, Whitefield, Bangalore - 560066",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560066",
      licenseNumber: "KA-01-2021-890123",
      licenseExpDate: new Date("2027-05-20"),
      bankAccountName: "Meera Iyer",
      bankAccountNumber: "8901234567890123",
      bankIfscCode: "ICIC0008901",
      aadharCard: true,
      license: true,
      educationCert: false,
      previousExp: true,
      carTypes: JSON.stringify(["AUTOMATIC"]),
      status: DriverStatus.ACTIVE,
      driverTripStatus: DriverTripStatus.AVAILABLE,
      complaintCount: 0,
      bannedGlobally: false,
      dailyTargetAmount: 4700,
      currentRating: 4.4,
      isActive: true,
      createdBy: createdByStaffId,
    },
    {
      firstName: "Ravi",
      lastName: "Kumar",
      phone: "+919876543321",
      email: "ravi.kumar@drybros.in",
      altPhone: "+919876543322",
      password: driverHashedPassword,
      franchiseId: createdFranchises[2].id,
      emergencyContactName: "Sita Kumar",
      emergencyContactPhone: "+919876543323",
      emergencyContactRelation: "Wife",
      address: "B-305, Jayanagar 4th Block, Bangalore - 560011",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560011",
      licenseNumber: "KA-01-2019-901234",
      licenseExpDate: new Date("2025-07-30"),
      bankAccountName: "Ravi Kumar",
      bankAccountNumber: "9012345678901234",
      bankIfscCode: "SBIN0009012",
      aadharCard: true,
      license: true,
      educationCert: true,
      previousExp: false,
      carTypes: JSON.stringify(["MANUAL", "PREMIUM_CARS"]),
      status: DriverStatus.ACTIVE,
      driverTripStatus: DriverTripStatus.AVAILABLE,
      complaintCount: 2,
      bannedGlobally: false,
      dailyTargetAmount: 5100,
      currentRating: 4.1,
      isActive: true,
      createdBy: createdByStaffId,
    },
    // Hyderabad Hitech City (3 drivers)
    {
      firstName: "Suresh",
      lastName: "Reddy",
      phone: "+919876543324",
      email: "suresh.reddy@drybros.in",
      altPhone: "+919876543325",
      password: driverHashedPassword,
      franchiseId: createdFranchises[3].id,
      emergencyContactName: "Lakshmi Reddy",
      emergencyContactPhone: "+919876543326",
      emergencyContactRelation: "Mother",
      address: "Plot 15, Gachibowli, Hyderabad - 500032",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500032",
      licenseNumber: "TS-01-2020-012345",
      licenseExpDate: new Date("2026-12-10"),
      bankAccountName: "Suresh Reddy",
      bankAccountNumber: "0123456789012345",
      bankIfscCode: "HDFC0000123",
      aadharCard: true,
      license: true,
      educationCert: true,
      previousExp: true,
      carTypes: JSON.stringify(["AUTOMATIC", "LUXURY_CARS"]),
      status: DriverStatus.ACTIVE,
      driverTripStatus: DriverTripStatus.AVAILABLE,
      complaintCount: 0,
      bannedGlobally: false,
      dailyTargetAmount: 5900,
      currentRating: 4.7,
      isActive: true,
      createdBy: createdByStaffId,
    },
    {
      firstName: "Lakshmi",
      lastName: "Rao",
      phone: "+919876543327",
      email: "lakshmi.rao@drybros.in",
      altPhone: null,
      password: driverHashedPassword,
      franchiseId: createdFranchises[3].id,
      emergencyContactName: "Venkatesh Rao",
      emergencyContactPhone: "+919876543328",
      emergencyContactRelation: "Husband",
      address: "Flat 405, Kondapur, Hyderabad - 500084",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500084",
      licenseNumber: "TS-01-2021-123456",
      licenseExpDate: new Date("2027-04-15"),
      bankAccountName: "Lakshmi Rao",
      bankAccountNumber: "1234567890123456",
      bankIfscCode: "ICIC0001234",
      aadharCard: true,
      license: true,
      educationCert: false,
      previousExp: true,
      carTypes: JSON.stringify(["MANUAL", "AUTOMATIC"]),
      status: DriverStatus.ACTIVE,
      driverTripStatus: DriverTripStatus.AVAILABLE,
      complaintCount: 0,
      bannedGlobally: false,
      dailyTargetAmount: 4900,
      currentRating: 4.3,
      isActive: true,
      createdBy: createdByStaffId,
    },
    {
      firstName: "Venkatesh",
      lastName: "Naidu",
      phone: "+919876543329",
      email: "venkatesh.naidu@drybros.in",
      altPhone: "+919876543330",
      password: driverHashedPassword,
      franchiseId: createdFranchises[3].id,
      emergencyContactName: "Priya Naidu",
      emergencyContactPhone: "+919876543331",
      emergencyContactRelation: "Sister",
      address: "H-12, Banjara Hills, Hyderabad - 500034",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500034",
      licenseNumber: "TS-01-2019-234567",
      licenseExpDate: new Date("2025-11-20"),
      bankAccountName: "Venkatesh Naidu",
      bankAccountNumber: "2345678901234567",
      bankIfscCode: "SBIN0002345",
      aadharCard: true,
      license: true,
      educationCert: true,
      previousExp: false,
      carTypes: JSON.stringify(["AUTOMATIC", "PREMIUM_CARS"]),
      status: DriverStatus.ACTIVE,
      driverTripStatus: DriverTripStatus.AVAILABLE,
      complaintCount: 1,
      bannedGlobally: false,
      dailyTargetAmount: 5300,
      currentRating: 4.5,
      isActive: true,
      createdBy: createdByStaffId,
    },
    // Chennai T Nagar (3 drivers)
    {
      firstName: "Arjun",
      lastName: "Iyer",
      phone: "+919876543332",
      email: "arjun.iyer@drybros.in",
      altPhone: "+919876543333",
      password: driverHashedPassword,
      franchiseId: createdFranchises[4].id,
      emergencyContactName: "Divya Iyer",
      emergencyContactPhone: "+919876543334",
      emergencyContactRelation: "Wife",
      address: "Flat 210, Adyar, Chennai - 600020",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600020",
      licenseNumber: "TN-01-2020-345678",
      licenseExpDate: new Date("2026-09-25"),
      bankAccountName: "Arjun Iyer",
      bankAccountNumber: "3456789012345678",
      bankIfscCode: "HDFC0003456",
      aadharCard: true,
      license: true,
      educationCert: true,
      previousExp: true,
      carTypes: JSON.stringify(["MANUAL", "AUTOMATIC", "LUXURY_CARS"]),
      status: DriverStatus.ACTIVE,
      driverTripStatus: DriverTripStatus.AVAILABLE,
      complaintCount: 0,
      bannedGlobally: false,
      dailyTargetAmount: 6100,
      currentRating: 4.8,
      isActive: true,
      createdBy: createdByStaffId,
    },
    {
      firstName: "Divya",
      lastName: "Menon",
      phone: "+919876543335",
      email: "divya.menon@drybros.in",
      altPhone: null,
      password: driverHashedPassword,
      franchiseId: createdFranchises[4].id,
      emergencyContactName: "Mohan Menon",
      emergencyContactPhone: "+919876543336",
      emergencyContactRelation: "Husband",
      address: "B-15, Anna Nagar, Chennai - 600040",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600040",
      licenseNumber: "TN-01-2021-456789",
      licenseExpDate: new Date("2027-02-28"),
      bankAccountName: "Divya Menon",
      bankAccountNumber: "4567890123456789",
      bankIfscCode: "ICIC0004567",
      aadharCard: true,
      license: true,
      educationCert: false,
      previousExp: true,
      carTypes: JSON.stringify(["AUTOMATIC"]),
      status: DriverStatus.ACTIVE,
      driverTripStatus: DriverTripStatus.AVAILABLE,
      complaintCount: 0,
      bannedGlobally: false,
      dailyTargetAmount: 5000,
      currentRating: 4.6,
      isActive: true,
      createdBy: createdByStaffId,
    },
    {
      firstName: "Mohan",
      lastName: "Krishnan",
      phone: "+919876543337",
      email: "mohan.krishnan@drybros.in",
      altPhone: "+919876543338",
      password: driverHashedPassword,
      franchiseId: createdFranchises[4].id,
      emergencyContactName: "Latha Krishnan",
      emergencyContactPhone: "+919876543339",
      emergencyContactRelation: "Wife",
      address: "C-50, Velachery, Chennai - 600042",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600042",
      licenseNumber: "TN-01-2019-567890",
      licenseExpDate: new Date("2025-10-10"),
      bankAccountName: "Mohan Krishnan",
      bankAccountNumber: "5678901234567890",
      bankIfscCode: "SBIN0005678",
      aadharCard: true,
      license: true,
      educationCert: true,
      previousExp: false,
      carTypes: JSON.stringify(["MANUAL", "PREMIUM_CARS"]),
      status: DriverStatus.INACTIVE,
      driverTripStatus: DriverTripStatus.AVAILABLE,
      complaintCount: 3,
      bannedGlobally: false,
      dailyTargetAmount: 4800,
      currentRating: 3.8,
      isActive: true,
      createdBy: createdByStaffId,
    },
  ];

  let driverCreatedCount = 0;
  let driverSkippedCount = 0;

  for (const driver of driverData) {
    // Check if driver with this email or phone already exists
    const existingDriverByEmail = await prisma.driver.findUnique({
      where: { email: driver.email },
    });
    const existingDriverByPhone = await prisma.driver.findUnique({
      where: { phone: driver.phone },
    });

    if (existingDriverByEmail || existingDriverByPhone) {
      console.log(`ℹ️  Driver already exists: ${driver.firstName} ${driver.lastName} (${driver.email}) - Skipping`);
      driverSkippedCount++;
      continue;
    }

    try {
      // Generate unique driver code
      const driverCode = await getUniqueDriverCode();

      const created = await prisma.driver.create({
        data: {
          ...driver,
          driverCode,
        } as any, // Type assertion to handle Prisma's complex input types
      });
      console.log(`✅ Created driver: ${created.firstName} ${created.lastName} (${created.driverCode}) - ${created.email}`);
      driverCreatedCount++;
    } catch (error: any) {
      console.log(`❌ Failed to create driver ${driver.firstName} ${driver.lastName}: ${error.message}`);
    }
  }

  console.log(`\n🎉 Driver seeding completed!`);
  console.log(`   ✅ Created: ${driverCreatedCount} drivers`);
  if (driverSkippedCount > 0) {
    console.log(`   ℹ️  Skipped: ${driverSkippedCount} drivers (already exist)`);
  }
  console.log(`\n📝 Default password for all drivers: ${driverDefaultPassword}`);
  console.log(`💡 Drivers can login using their email and password.`);
  console.log(`👤 All drivers created by staff ID: ${createdByStaffId}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

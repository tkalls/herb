export type CropType = "coffee" | "avocado";
export type VerificationStatus = "verified" | "pending" | "needs_review" | "unverified";
export type BatchStatus = "preparing" | "ready" | "in_transit" | "delivered";
export type DeforestationRisk = "low" | "medium" | "high";

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  village: string;
  district: string;
  region: string;
  cooperative: string;
  nationalId: string;
  registeredAt: string;
  farmCount: number;
}

export interface Farm {
  id: string;
  farmerId: string;
  farmerName: string;
  cropType: CropType;
  variety: string;
  areaHa: number;
  verificationStatus: VerificationStatus;
  eudrCompliant: boolean;
  deforestationRisk: DeforestationRisk;
  lastSynced: string;
  village: string;
  district: string;
  region: string;
  polygon: [number, number][];
  certifications: string[];
  notes?: string;
}

export interface Batch {
  id: string;
  farmIds: string[];
  farmerCount: number;
  cropType: CropType;
  variety: string;
  processingDate: string;
  exportReadiness: number;
  traceabilityScore: number;
  buyer: string;
  buyerCountry: string;
  weightKg: number;
  status: BatchStatus;
  eudrDeclarationId?: string;
}

export interface Cooperative {
  id: string;
  name: string;
  shortName: string;
  region: string;
  district: string;
  country: string;
  farmerCount: number;
  farmCount: number;
  totalAreaHa: number;
  complianceScore: number;
  eudrReadiness: number;
  verifiedFarms: number;
  pendingFarms: number;
  needsReviewFarms: number;
  unverifiedFarms: number;
  activeBatches: number;
  primaryCrops: CropType[];
}

export const cooperative: Cooperative = {
  id: "KNCU-001",
  name: "Kilimanjaro Native Cooperative Union",
  shortName: "KNCU",
  region: "Kilimanjaro",
  district: "Moshi Rural",
  country: "Tanzania",
  farmerCount: 847,
  farmCount: 1203,
  totalAreaHa: 1842,
  complianceScore: 78,
  eudrReadiness: 71,
  verifiedFarms: 892,
  pendingFarms: 187,
  needsReviewFarms: 64,
  unverifiedFarms: 60,
  activeBatches: 4,
  primaryCrops: ["coffee", "avocado"],
};

export const farmers: Farmer[] = [
  {
    id: "F001",
    name: "Amina Wanjiku Mbeki",
    phone: "+255 744 123 456",
    village: "Kibosho",
    district: "Moshi Rural",
    region: "Kilimanjaro",
    cooperative: "KNCU",
    nationalId: "TZ-19850312-001",
    registeredAt: "2024-01-15",
    farmCount: 2,
  },
  {
    id: "F002",
    name: "Joseph Mwanga Msemwa",
    phone: "+255 752 234 567",
    village: "Lyamungu",
    district: "Moshi Rural",
    region: "Kilimanjaro",
    cooperative: "KNCU",
    nationalId: "TZ-19780628-002",
    registeredAt: "2024-01-22",
    farmCount: 1,
  },
  {
    id: "F003",
    name: "Grace Nalishebo Temba",
    phone: "+255 767 345 678",
    village: "Marangu",
    district: "Moshi Rural",
    region: "Kilimanjaro",
    cooperative: "KNCU",
    nationalId: "TZ-19920415-003",
    registeredAt: "2024-02-03",
    farmCount: 2,
  },
  {
    id: "F004",
    name: "Bernard Kaunda Mwita",
    phone: "+255 712 456 789",
    village: "Uru",
    district: "Moshi Rural",
    region: "Kilimanjaro",
    cooperative: "KNCU",
    nationalId: "TZ-19681101-004",
    registeredAt: "2024-02-14",
    farmCount: 3,
  },
  {
    id: "F005",
    name: "Fatuma Rashid Ally",
    phone: "+255 783 567 890",
    village: "Kibosho",
    district: "Moshi Rural",
    region: "Kilimanjaro",
    cooperative: "KNCU",
    nationalId: "TZ-19901220-005",
    registeredAt: "2024-02-28",
    farmCount: 1,
  },
];

export const farms: Farm[] = [
  {
    id: "FM001",
    farmerId: "F001",
    farmerName: "Amina Wanjiku Mbeki",
    cropType: "coffee",
    variety: "Arabica SL28",
    areaHa: 1.8,
    verificationStatus: "verified",
    eudrCompliant: true,
    deforestationRisk: "low",
    lastSynced: "2024-11-28T09:14:00Z",
    village: "Kibosho",
    district: "Moshi Rural",
    region: "Kilimanjaro",
    polygon: [
      [-3.2691, 37.3311],
      [-3.2685, 37.3318],
      [-3.2679, 37.3312],
      [-3.2683, 37.3305],
      [-3.2691, 37.3311],
    ],
    certifications: ["UTZ Certified", "Rainforest Alliance"],
  },
  {
    id: "FM002",
    farmerId: "F002",
    farmerName: "Joseph Mwanga Msemwa",
    cropType: "coffee",
    variety: "Arabica N39",
    areaHa: 2.4,
    verificationStatus: "verified",
    eudrCompliant: true,
    deforestationRisk: "low",
    lastSynced: "2024-11-27T14:32:00Z",
    village: "Lyamungu",
    district: "Moshi Rural",
    region: "Kilimanjaro",
    polygon: [
      [-3.2541, 37.3205],
      [-3.2534, 37.3214],
      [-3.2527, 37.3207],
      [-3.2531, 37.3198],
      [-3.2541, 37.3205],
    ],
    certifications: ["Fair Trade"],
  },
  {
    id: "FM003",
    farmerId: "F003",
    farmerName: "Grace Nalishebo Temba",
    cropType: "avocado",
    variety: "Hass",
    areaHa: 0.9,
    verificationStatus: "verified",
    eudrCompliant: true,
    deforestationRisk: "low",
    lastSynced: "2024-11-29T08:05:00Z",
    village: "Marangu",
    district: "Moshi Rural",
    region: "Kilimanjaro",
    polygon: [
      [-3.2341, 37.3441],
      [-3.2336, 37.3448],
      [-3.2330, 37.3443],
      [-3.2334, 37.3436],
      [-3.2341, 37.3441],
    ],
    certifications: ["GlobalG.A.P."],
  },
  {
    id: "FM004",
    farmerId: "F003",
    farmerName: "Grace Nalishebo Temba",
    cropType: "coffee",
    variety: "Arabica Bourbon",
    areaHa: 1.2,
    verificationStatus: "pending",
    eudrCompliant: false,
    deforestationRisk: "medium",
    lastSynced: "2024-11-25T11:45:00Z",
    village: "Marangu",
    district: "Moshi Rural",
    region: "Kilimanjaro",
    polygon: [
      [-3.2361, 37.3431],
      [-3.2355, 37.3439],
      [-3.2349, 37.3433],
      [-3.2353, 37.3425],
      [-3.2361, 37.3431],
    ],
    certifications: [],
    notes: "Polygon verification pending. Awaiting satellite cross-check.",
  },
  {
    id: "FM005",
    farmerId: "F004",
    farmerName: "Bernard Kaunda Mwita",
    cropType: "avocado",
    variety: "Hass",
    areaHa: 3.1,
    verificationStatus: "verified",
    eudrCompliant: true,
    deforestationRisk: "low",
    lastSynced: "2024-11-28T16:20:00Z",
    village: "Uru",
    district: "Moshi Rural",
    region: "Kilimanjaro",
    polygon: [
      [-3.2461, 37.3541],
      [-3.2451, 37.3552],
      [-3.2441, 37.3543],
      [-3.2449, 37.3532],
      [-3.2461, 37.3541],
    ],
    certifications: ["GlobalG.A.P.", "KEPHIS"],
  },
  {
    id: "FM006",
    farmerId: "F004",
    farmerName: "Bernard Kaunda Mwita",
    cropType: "avocado",
    variety: "Fuerte",
    areaHa: 1.4,
    verificationStatus: "needs_review",
    eudrCompliant: false,
    deforestationRisk: "medium",
    lastSynced: "2024-11-20T10:11:00Z",
    village: "Uru",
    district: "Moshi Rural",
    region: "Kilimanjaro",
    polygon: [
      [-3.2471, 37.3521],
      [-3.2465, 37.3529],
      [-3.2459, 37.3523],
      [-3.2463, 37.3515],
      [-3.2471, 37.3521],
    ],
    certifications: [],
    notes: "Boundary overlap detected with forest reserve buffer zone. Manual review required.",
  },
  {
    id: "FM007",
    farmerId: "F004",
    farmerName: "Bernard Kaunda Mwita",
    cropType: "coffee",
    variety: "Arabica Kent",
    areaHa: 0.7,
    verificationStatus: "verified",
    eudrCompliant: true,
    deforestationRisk: "low",
    lastSynced: "2024-11-29T07:55:00Z",
    village: "Uru",
    district: "Moshi Rural",
    region: "Kilimanjaro",
    polygon: [
      [-3.2481, 37.3511],
      [-3.2476, 37.3518],
      [-3.2470, 37.3513],
      [-3.2474, 37.3506],
      [-3.2481, 37.3511],
    ],
    certifications: ["UTZ Certified"],
  },
  {
    id: "FM008",
    farmerId: "F005",
    farmerName: "Fatuma Rashid Ally",
    cropType: "coffee",
    variety: "Arabica SL28",
    areaHa: 1.1,
    verificationStatus: "unverified",
    eudrCompliant: false,
    deforestationRisk: "low",
    lastSynced: "2024-11-15T13:30:00Z",
    village: "Kibosho",
    district: "Moshi Rural",
    region: "Kilimanjaro",
    polygon: [],
    certifications: [],
    notes: "Newly registered. GPS capture not yet completed.",
  },
];

export const batches: Batch[] = [
  {
    id: "B-2024-KNC-001",
    farmIds: ["FM001", "FM002", "FM007"],
    farmerCount: 3,
    cropType: "coffee",
    variety: "Arabica Blend (SL28 · N39 · Kent)",
    processingDate: "2024-11-20",
    exportReadiness: 94,
    traceabilityScore: 96,
    buyer: "Nordic Roasters AS",
    buyerCountry: "Norway",
    weightKg: 2840,
    status: "ready",
    eudrDeclarationId: "EUDR-2024-TZ-00447",
  },
  {
    id: "B-2024-KNC-002",
    farmIds: ["FM003", "FM005"],
    farmerCount: 2,
    cropType: "avocado",
    variety: "Hass Export Grade",
    processingDate: "2024-11-25",
    exportReadiness: 88,
    traceabilityScore: 91,
    buyer: "Al-Baida Fresh Exports",
    buyerCountry: "UAE",
    weightKg: 5200,
    status: "in_transit",
    eudrDeclarationId: "EUDR-2024-TZ-00448",
  },
  {
    id: "B-2024-KNC-003",
    farmIds: ["FM001", "FM002"],
    farmerCount: 2,
    cropType: "coffee",
    variety: "Arabica SL28 Single Origin",
    processingDate: "2024-12-05",
    exportReadiness: 72,
    traceabilityScore: 84,
    buyer: "Blue Bottle Coffee",
    buyerCountry: "USA",
    weightKg: 1600,
    status: "preparing",
  },
  {
    id: "B-2024-KNC-004",
    farmIds: ["FM003", "FM005"],
    farmerCount: 2,
    cropType: "avocado",
    variety: "Hass / Fuerte Mixed",
    processingDate: "2024-12-10",
    exportReadiness: 61,
    traceabilityScore: 73,
    buyer: "Greenfield Produce Ltd",
    buyerCountry: "UK",
    weightKg: 3800,
    status: "preparing",
  },
];

export const statusConfig: Record<
  VerificationStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  verified: {
    label: "Verified",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  needs_review: {
    label: "Needs Review",
    color: "text-red-700",
    bg: "bg-red-50",
    dot: "bg-red-500",
  },
  unverified: {
    label: "Unverified",
    color: "text-stone-600",
    bg: "bg-stone-100",
    dot: "bg-stone-400",
  },
};

export const batchStatusConfig: Record<
  BatchStatus,
  { label: string; color: string; bg: string }
> = {
  preparing: { label: "Preparing", color: "text-amber-700", bg: "bg-amber-50" },
  ready: { label: "Export Ready", color: "text-emerald-700", bg: "bg-emerald-50" },
  in_transit: { label: "In Transit", color: "text-blue-700", bg: "bg-blue-50" },
  delivered: { label: "Delivered", color: "text-stone-600", bg: "bg-stone-100" },
};

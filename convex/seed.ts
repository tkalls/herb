import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Scrypt } from "lucia";

// ─── Seed users ──────────────────────────────────────────────────────────────
// Direct DB insert bypasses the @convex-dev/auth createAccount helper (which
// requires ActionCtx). The Password provider's retrieveAccount verifies against
// the `secret` field in authAccounts, so inserting the Scrypt hash there is
// equivalent to a normal sign-up flow.

export const seedUser = internalMutation({
  args: {
    email: v.string(),
    hashedPassword: v.string(),
    displayName: v.string(),
    role: v.union(
      v.literal("field_agent"),
      v.literal("coop_admin"),
      v.literal("buyer"),
    ),
  },
  handler: async (ctx, { email, hashedPassword, displayName, role }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (existing) return existing._id;

    const userId = await ctx.db.insert("users", {
      email,
      name: displayName,
      role,
      displayName,
    });

    await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: email,
      secret: hashedPassword,
    });

    return userId;
  },
});

// ─── Seed cooperative + all KNCU data ────────────────────────────────────────

export const seedCoopData = internalMutation({
  args: { systemUserId: v.id("users") },
  handler: async (ctx, { systemUserId }) => {
    const existing = await ctx.db
      .query("cooperatives")
      .withIndex("by_code", (q) => q.eq("code", "KNCU"))
      .unique();
    if (existing) return;

    const coopId = await ctx.db.insert("cooperatives", {
      name: "Kilimanjaro Native Cooperative Union",
      code: "KNCU",
      region: "Kilimanjaro",
      district: "Moshi Rural",
      country: "Tanzania",
    });

    const mkPoly = (pts: [number, number][]) =>
      pts.map(([lat, lng]) => ({ lat, lng }));

    const insertFarmer = async (args: {
      code: string;
      fullName: string;
      phone: string;
      nationalId: string;
      village: string;
    }) =>
      ctx.db.insert("farmers", {
        ...args,
        cooperativeId: coopId,
        district: "Moshi Rural",
        region: "Kilimanjaro",
        registeredBy: systemUserId,
        registeredAt: Date.now(),
      });

    const f1 = await insertFarmer({
      code: "F001",
      fullName: "Amina Wanjiku Mbeki",
      phone: "+255 744 123 456",
      nationalId: "TZ-19850312-001",
      village: "Kibosho",
    });
    const f2 = await insertFarmer({
      code: "F002",
      fullName: "Joseph Mwanga Msemwa",
      phone: "+255 752 234 567",
      nationalId: "TZ-19780628-002",
      village: "Lyamungu",
    });
    const f3 = await insertFarmer({
      code: "F003",
      fullName: "Grace Nalishebo Temba",
      phone: "+255 767 345 678",
      nationalId: "TZ-19920415-003",
      village: "Marangu",
    });
    const f4 = await insertFarmer({
      code: "F004",
      fullName: "Bernard Kaunda Mwita",
      phone: "+255 712 456 789",
      nationalId: "TZ-19681101-004",
      village: "Uru",
    });
    const f5 = await insertFarmer({
      code: "F005",
      fullName: "Fatuma Rashid Ally",
      phone: "+255 783 567 890",
      nationalId: "TZ-19901220-005",
      village: "Kibosho",
    });

    const now = Date.now();
    type FarmArgs = {
      farmerId: (typeof f1);
      code: string;
      crop: "coffee" | "avocado" | "macadamia";
      variety: string;
      estimatedAreaHa: number;
      certifications: string[];
      polygonPreview?: { lat: number; lng: number }[];
      verificationStatus: "unverified" | "pending" | "needs_review" | "verified";
      eudrCompliant: boolean;
      eudrScore: number;
      deforestationRisk: "none" | "low" | "medium" | "high";
      notes?: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertFarm = (args: FarmArgs) =>
      ctx.db.insert("farms", { ...args, lastSyncedAt: now } as any);

    const fm1 = await insertFarm({
      farmerId: f1,
      code: "FM001",
      crop: "coffee",
      variety: "Arabica SL28",
      estimatedAreaHa: 1.8,
      certifications: ["UTZ Certified", "Rainforest Alliance"],
      polygonPreview: mkPoly([
        [-3.2691, 37.3311],
        [-3.2685, 37.3318],
        [-3.2679, 37.3312],
        [-3.2683, 37.3305],
        [-3.2691, 37.3311],
      ]),
      verificationStatus: "verified",
      eudrCompliant: true,
      eudrScore: 88,
      deforestationRisk: "low",
    });
    const fm2 = await insertFarm({
      farmerId: f2,
      code: "FM002",
      crop: "coffee",
      variety: "Arabica N39",
      estimatedAreaHa: 2.4,
      certifications: ["Fair Trade"],
      polygonPreview: mkPoly([
        [-3.2541, 37.3205],
        [-3.2534, 37.3214],
        [-3.2527, 37.3207],
        [-3.2531, 37.3198],
        [-3.2541, 37.3205],
      ]),
      verificationStatus: "verified",
      eudrCompliant: true,
      eudrScore: 85,
      deforestationRisk: "low",
    });
    const fm3 = await insertFarm({
      farmerId: f3,
      code: "FM003",
      crop: "avocado",
      variety: "Hass",
      estimatedAreaHa: 0.9,
      certifications: ["GlobalG.A.P."],
      polygonPreview: mkPoly([
        [-3.2341, 37.3441],
        [-3.2336, 37.3448],
        [-3.2330, 37.3443],
        [-3.2334, 37.3436],
        [-3.2341, 37.3441],
      ]),
      verificationStatus: "verified",
      eudrCompliant: true,
      eudrScore: 82,
      deforestationRisk: "low",
    });
    await insertFarm({
      farmerId: f3,
      code: "FM004",
      crop: "coffee",
      variety: "Arabica Bourbon",
      estimatedAreaHa: 1.2,
      certifications: [],
      polygonPreview: mkPoly([
        [-3.2361, 37.3431],
        [-3.2355, 37.3439],
        [-3.2349, 37.3433],
        [-3.2353, 37.3425],
        [-3.2361, 37.3431],
      ]),
      verificationStatus: "pending",
      eudrCompliant: false,
      eudrScore: 52,
      deforestationRisk: "medium",
      notes: "Polygon verification pending. Awaiting satellite cross-check.",
    });
    const fm5 = await insertFarm({
      farmerId: f4,
      code: "FM005",
      crop: "avocado",
      variety: "Hass",
      estimatedAreaHa: 3.1,
      certifications: ["GlobalG.A.P.", "KEPHIS"],
      polygonPreview: mkPoly([
        [-3.2461, 37.3541],
        [-3.2451, 37.3552],
        [-3.2441, 37.3543],
        [-3.2449, 37.3532],
        [-3.2461, 37.3541],
      ]),
      verificationStatus: "verified",
      eudrCompliant: true,
      eudrScore: 90,
      deforestationRisk: "low",
    });
    await insertFarm({
      farmerId: f4,
      code: "FM006",
      crop: "avocado",
      variety: "Fuerte",
      estimatedAreaHa: 1.4,
      certifications: [],
      polygonPreview: mkPoly([
        [-3.2471, 37.3521],
        [-3.2465, 37.3529],
        [-3.2459, 37.3523],
        [-3.2463, 37.3515],
        [-3.2471, 37.3521],
      ]),
      verificationStatus: "needs_review",
      eudrCompliant: false,
      eudrScore: 38,
      deforestationRisk: "medium",
      notes:
        "Boundary overlap detected with forest reserve buffer zone. Manual review required.",
    });
    const fm7 = await insertFarm({
      farmerId: f4,
      code: "FM007",
      crop: "coffee",
      variety: "Arabica Kent",
      estimatedAreaHa: 0.7,
      certifications: ["UTZ Certified"],
      polygonPreview: mkPoly([
        [-3.2481, 37.3511],
        [-3.2476, 37.3518],
        [-3.2470, 37.3513],
        [-3.2474, 37.3506],
        [-3.2481, 37.3511],
      ]),
      verificationStatus: "verified",
      eudrCompliant: true,
      eudrScore: 84,
      deforestationRisk: "low",
    });
    await insertFarm({
      farmerId: f5,
      code: "FM008",
      crop: "coffee",
      variety: "Arabica SL28",
      estimatedAreaHa: 1.1,
      certifications: [],
      verificationStatus: "unverified",
      eudrCompliant: false,
      eudrScore: 15,
      deforestationRisk: "low",
      notes: "Newly registered. GPS capture not yet completed.",
    });

    const insertBatch = async (args: Parameters<typeof ctx.db.insert<"batches">>[1]) =>
      ctx.db.insert("batches", args);

    await insertBatch({
      cooperativeId: coopId,
      code: "B-2024-KNC-001",
      crop: "coffee",
      description: "Arabica Blend (SL28 · N39 · Kent)",
      weightKg: 2840,
      farmIds: [fm1, fm2, fm7],
      buyerName: "Nordic Roasters AS",
      buyerCountry: "Norway",
      status: "ready",
      traceScore: 96,
      exportReadiness: 94,
      eudrDeclarationId: "EUDR-2024-TZ-00447",
    });
    await insertBatch({
      cooperativeId: coopId,
      code: "B-2024-KNC-002",
      crop: "avocado",
      description: "Hass Export Grade",
      weightKg: 5200,
      farmIds: [fm3, fm5],
      buyerName: "Al-Baida Fresh Exports",
      buyerCountry: "UAE",
      status: "in_transit",
      traceScore: 91,
      exportReadiness: 88,
      eudrDeclarationId: "EUDR-2024-TZ-00448",
    });
    await insertBatch({
      cooperativeId: coopId,
      code: "B-2024-KNC-003",
      crop: "coffee",
      description: "Arabica SL28 Single Origin",
      weightKg: 1600,
      farmIds: [fm1, fm2],
      buyerName: "Blue Bottle Coffee",
      buyerCountry: "USA",
      status: "preparing",
      traceScore: 84,
      exportReadiness: 72,
    });
    await insertBatch({
      cooperativeId: coopId,
      code: "B-2024-KNC-004",
      crop: "avocado",
      description: "Hass / Fuerte Mixed",
      weightKg: 3800,
      farmIds: [fm3, fm5],
      buyerName: "Greenfield Produce Ltd",
      buyerCountry: "UK",
      status: "preparing",
      traceScore: 73,
      exportReadiness: 61,
    });
  },
});

// ─── Entry point: npx convex run seed:run ────────────────────────────────────

export const run = internalAction({
  args: {},
  handler: async (ctx) => {
    const hash = await new Scrypt().hash("Kilimanjaro2026");

    const agentId = await ctx.runMutation(internal.seed.seedUser, {
      email: "amani.tarimo@kncu.coop.tz",
      hashedPassword: hash,
      displayName: "Amani Tarimo",
      role: "field_agent",
    });
    await ctx.runMutation(internal.seed.seedUser, {
      email: "david.mushi@kncu.coop.tz",
      hashedPassword: hash,
      displayName: "David Mushi",
      role: "coop_admin",
    });
    await ctx.runMutation(internal.seed.seedUser, {
      email: "procurement@nordicroasters.no",
      hashedPassword: hash,
      displayName: "K. Andersen, Nordic Roasters",
      role: "buyer",
    });

    await ctx.runMutation(internal.seed.seedCoopData, {
      systemUserId: agentId,
    });

    console.log("Seed complete — KNCU + 5 farmers + 8 farms + 4 batches.");
  },
});

import {
  getPriceId,
  getPlanName,
  isStripeAvailable,
  getStripeMessage,
  clearPriceIdCache,
  STRIPE_PRICE_IDS,
} from "@/lib/stripe-config";

// Reset module-level cache between tests
beforeEach(() => {
  clearPriceIdCache();
  // Reset the exported STRIPE_PRICE_IDS object to its initial state
  STRIPE_PRICE_IDS.Starter = "";
  STRIPE_PRICE_IDS.Pro = "";
  STRIPE_PRICE_IDS.Enterprise = "";
});

describe("getPriceId", () => {
  it("returns an empty string when the cache is empty", () => {
    expect(getPriceId("Pro")).toBe("");
  });

  it("normalises plan names regardless of input casing", () => {
    STRIPE_PRICE_IDS.Pro = "price_pro_123";
    expect(getPriceId("pro")).toBe("price_pro_123");
    expect(getPriceId("PRO")).toBe("price_pro_123");
    expect(getPriceId("Pro")).toBe("price_pro_123");
  });

  it("falls back to Pro price when an unknown plan is requested", () => {
    STRIPE_PRICE_IDS.Pro = "price_pro_456";
    expect(getPriceId("unknown_plan")).toBe("price_pro_456");
  });

  it("returns the correct price for Starter", () => {
    STRIPE_PRICE_IDS.Starter = "price_starter_789";
    expect(getPriceId("starter")).toBe("price_starter_789");
  });

  it("returns the correct price for Enterprise", () => {
    STRIPE_PRICE_IDS.Enterprise = "price_enterprise_abc";
    expect(getPriceId("enterprise")).toBe("price_enterprise_abc");
  });
});

describe("getPlanName", () => {
  it("returns the plan name for a matching price ID", () => {
    STRIPE_PRICE_IDS.Pro = "price_pro_xyz";
    expect(getPlanName("price_pro_xyz")).toBe("Pro");
  });

  it("infers 'Starter' from a price ID that contains the word starter", () => {
    expect(getPlanName("price_starter_live_aaa")).toBe("Starter");
  });

  it("infers 'Pro' from a price ID that contains the word pro", () => {
    expect(getPlanName("price_pro_live_bbb")).toBe("Pro");
  });

  it("infers 'Pro' from a price ID that contains the word professional", () => {
    expect(getPlanName("price_professional_live_ccc")).toBe("Pro");
  });

  it("infers 'Enterprise' from a price ID that contains the word enterprise", () => {
    expect(getPlanName("price_enterprise_live_ddd")).toBe("Enterprise");
  });

  it("defaults to 'Pro' for an unrecognised price ID", () => {
    expect(getPlanName("price_unknown_live_zzz")).toBe("Pro");
  });
});

describe("isStripeAvailable", () => {
  it("returns false when the cache has not been populated", () => {
    expect(isStripeAvailable()).toBe(false);
  });
});

describe("getStripeMessage", () => {
  it("returns null when the cache has not been populated", () => {
    expect(getStripeMessage()).toBeNull();
  });
});

describe("clearPriceIdCache", () => {
  it("resets the availability state so isStripeAvailable returns false again", () => {
    // Simulate a populated cache by assigning a price
    STRIPE_PRICE_IDS.Pro = "price_pro_live";
    // After clear, availability should be false
    clearPriceIdCache();
    expect(isStripeAvailable()).toBe(false);
  });
});

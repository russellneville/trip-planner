import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";

const PROJECT_ID = "trip-planner-rules-test";

let testEnv;

function authedDb(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

function guestDb() {
  return testEnv.unauthenticatedContext().firestore();
}

function tripData(overrides = {}) {
  return {
    destination: "Vancouver",
    dates: ["2026-06-29T00:00:00.000Z"],
    activities: {},
    totalDays: 1,
    totalBudget: 0,
    mapCenter: { lat: 49.2827, lng: -123.1207 },
    markers: [],
    ownerId: "owner",
    collaborators: ["owner"],
    createdAt: "2026-06-23T00:00:00.000Z",
    updatedAt: "2026-06-23T00:00:00.000Z",
    ...overrides,
  };
}

async function seedTrip(tripId = "trip-1", overrides = {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "trips", tripId), tripData(overrides));
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("user profile rules", () => {
  test("authenticated users can read profile documents for email lookup", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users", "friend"), {
        email: "friend@example.com",
        emailLower: "friend@example.com",
      });
    });

    await assertSucceeds(getDoc(doc(authedDb("owner"), "users", "friend")));
  });

  test("unauthenticated users cannot read profiles", async () => {
    await assertFails(getDoc(doc(guestDb(), "users", "friend")));
  });

  test("users can write only their own minimal lookup profile", async () => {
    await assertSucceeds(
      setDoc(doc(authedDb("owner"), "users", "owner"), {
        email: "owner@example.com",
        emailLower: "owner@example.com",
        firstName: "Owner",
      }),
    );

    await assertFails(
      setDoc(doc(authedDb("owner"), "users", "friend"), {
        email: "friend@example.com",
        emailLower: "friend@example.com",
      }),
    );
  });
});

describe("trip creation rules", () => {
  test("signed-in users can create trips they own with only themselves as collaborator", async () => {
    await assertSucceeds(
      setDoc(doc(authedDb("owner"), "trips", "trip-1"), tripData()),
    );
  });

  test("trip creation rejects impersonated owners and preloaded collaborators", async () => {
    await assertFails(
      setDoc(
        doc(authedDb("friend"), "trips", "bad-owner"),
        tripData({ ownerId: "owner", collaborators: ["owner"] }),
      ),
    );

    await assertFails(
      setDoc(
        doc(authedDb("owner"), "trips", "preloaded-collaborator"),
        tripData({ collaborators: ["owner", "friend"] }),
      ),
    );
  });

  test("unauthenticated users cannot create trips", async () => {
    await assertFails(setDoc(doc(guestDb(), "trips", "trip-1"), tripData()));
  });
});

describe("trip collaboration rules", () => {
  test("collaborators can read and update planning content", async () => {
    await seedTrip("shared-trip", { collaborators: ["owner", "friend"] });

    await assertSucceeds(getDoc(doc(authedDb("friend"), "trips", "shared-trip")));
    await assertSucceeds(
      updateDoc(doc(authedDb("friend"), "trips", "shared-trip"), {
        destination: "Victoria",
        updatedAt: "2026-06-24T00:00:00.000Z",
      }),
    );
  });

  test("non-collaborators cannot read or update trips", async () => {
    await seedTrip("private-trip");

    await assertFails(getDoc(doc(authedDb("stranger"), "trips", "private-trip")));
    await assertFails(
      updateDoc(doc(authedDb("stranger"), "trips", "private-trip"), {
        destination: "Victoria",
        updatedAt: "2026-06-24T00:00:00.000Z",
      }),
    );
  });

  test("collaborators cannot change access-control fields", async () => {
    await seedTrip("shared-trip", { collaborators: ["owner", "friend"] });

    await assertFails(
      updateDoc(doc(authedDb("friend"), "trips", "shared-trip"), {
        collaborators: ["owner", "friend", "stranger"],
        updatedAt: "2026-06-24T00:00:00.000Z",
      }),
    );

    await assertFails(
      updateDoc(doc(authedDb("friend"), "trips", "shared-trip"), {
        ownerId: "friend",
        updatedAt: "2026-06-24T00:00:00.000Z",
      }),
    );
  });

  test("owners can add collaborators but cannot remove themselves or change ownerId", async () => {
    await seedTrip("owned-trip");

    await assertSucceeds(
      updateDoc(doc(authedDb("owner"), "trips", "owned-trip"), {
        collaborators: ["owner", "friend"],
        updatedAt: "2026-06-24T00:00:00.000Z",
      }),
    );

    await assertFails(
      updateDoc(doc(authedDb("owner"), "trips", "owned-trip"), {
        collaborators: ["friend"],
        updatedAt: "2026-06-25T00:00:00.000Z",
      }),
    );

    await assertFails(
      updateDoc(doc(authedDb("owner"), "trips", "owned-trip"), {
        ownerId: "friend",
        updatedAt: "2026-06-25T00:00:00.000Z",
      }),
    );
  });

  test("only owners can delete trips", async () => {
    await seedTrip("shared-trip", { collaborators: ["owner", "friend"] });

    await assertFails(deleteDoc(doc(authedDb("friend"), "trips", "shared-trip")));
    await assertSucceeds(deleteDoc(doc(authedDb("owner"), "trips", "shared-trip")));
  });

  test("unexpected trip fields are rejected", async () => {
    await seedTrip("owned-trip");

    await assertFails(
      updateDoc(doc(authedDb("owner"), "trips", "owned-trip"), {
        public: true,
        updatedAt: "2026-06-24T00:00:00.000Z",
      }),
    );
  });

  test("seeded owner remains unchanged after allowed updates", async () => {
    await seedTrip("owned-trip");

    await assertSucceeds(
      updateDoc(doc(authedDb("owner"), "trips", "owned-trip"), {
        destination: "Victoria",
        updatedAt: "2026-06-24T00:00:00.000Z",
      }),
    );

    const snapshot = await getDoc(doc(authedDb("owner"), "trips", "owned-trip"));
    expect(snapshot.data().ownerId).toBe("owner");
  });
});

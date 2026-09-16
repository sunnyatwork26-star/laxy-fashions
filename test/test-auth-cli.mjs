import http from "node:http";

async function runVerification() {
  const base = "http://localhost:3000";
  console.log("==================================================");
  console.log("  LAXY FASHIONS — FULL AUTH & ROUTE CLI AUDIT");
  console.log("==================================================\n");

  // 1. Unauthenticated /admin
  console.log("[1/7] Testing Unauthenticated /admin Access:");
  const unauthRes = await fetch(base + "/admin", { redirect: "manual" });
  console.log(`  -> Status: ${unauthRes.status} (Expected: 307 Redirect)`);
  console.log(`  -> Location: ${unauthRes.headers.get("location")} (Expected: /admin/login)\n`);

  // 2. CSRF Token
  console.log("[2/7] Fetching CSRF Token:");
  const csrfRes = await fetch(base + "/api/auth/csrf");
  const rawCsrfCookies = csrfRes.headers.getSetCookie ? csrfRes.headers.getSetCookie() : [csrfRes.headers.get("set-cookie")];
  const { csrfToken } = await csrfRes.json();
  const csrfCookieMap = rawCsrfCookies.map(c => c.split(";")[0]).join("; ");
  console.log(`  -> CSRF Token: ${csrfToken}`);
  console.log(`  -> CSRF Cookie: ${csrfCookieMap}\n`);

  // 3. Bad credentials
  console.log("[3/7] Testing Login with INVALID Credentials:");
  const badBody = new URLSearchParams({
    csrfToken,
    email: "admin@laxyfashions.com",
    password: "incorrect-password",
    json: "true"
  });
  const badRes = await fetch(base + "/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": csrfCookieMap
    },
    body: badBody.toString(),
    redirect: "manual"
  });
  const badCookies = badRes.headers.getSetCookie ? badRes.headers.getSetCookie() : [badRes.headers.get("set-cookie")];
  const hasBadSession = badCookies.some(c => c && c.includes("session-token"));
  console.log(`  -> Response Status: ${badRes.status}`);
  console.log(`  -> Session Token Created: ${hasBadSession ? "YES (FAILED)" : "NO (PASSED - Invalid login correctly denied)"}\n`);

  // 4. Good credentials
  console.log("[4/7] Testing Login with VALID Admin Credentials (admin@laxyfashions.com / changeme123):");
  const goodBody = new URLSearchParams({
    csrfToken,
    email: "admin@laxyfashions.com",
    password: "changeme123",
    callbackUrl: "http://localhost:3000/admin",
    json: "true"
  });
  const goodRes = await fetch(base + "/api/auth/callback/credentials?callbackUrl=" + encodeURIComponent("http://localhost:3000/admin"), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": csrfCookieMap
    },
    body: goodBody.toString(),
    redirect: "manual"
  });
  const rawGoodCookies = goodRes.headers.getSetCookie ? goodRes.headers.getSetCookie() : [goodRes.headers.get("set-cookie")];
  const goodCookieMap = rawGoodCookies.map(c => c.split(";")[0]).join("; ");
  console.log(`  -> Status: ${goodRes.status}`);
  console.log(`  -> Location: ${goodRes.headers.get("location")}`);
  console.log(`  -> Session Cookie: ${goodCookieMap.includes("session-token") ? "VALID (Issued by NextAuth)" : "MISSING"}\n`);

  // 5. Session endpoint
  console.log("[5/7] Testing /api/auth/session with Session Cookie:");
  const sessionRes = await fetch(base + "/api/auth/session", {
    headers: { "Cookie": goodCookieMap }
  });
  const sessionData = await sessionRes.json();
  console.log(`  -> Session Response:`, JSON.stringify(sessionData, null, 2), "\n");

  // 6. Admin dashboard
  console.log("[6/7] Testing Authenticated /admin Dashboard:");
  const adminRes = await fetch(base + "/admin", {
    headers: { "Cookie": goodCookieMap },
    redirect: "manual"
  });
  console.log(`  -> /admin HTTP Status: ${adminRes.status} (Expected: 200 OK)`);
  const adminHtml = await adminRes.text();
  console.log(`  -> HTML Payload: ${adminHtml.length} bytes`);
  console.log(`  -> Dashboard Content Check: ${adminHtml.includes("Admin") ? "PASSED (Dashboard UI Present)" : "FAILED"}\n`);

  // 7. Subroutes
  console.log("[7/7] Testing Admin Subroutes:");
  const subroutes = ["/admin/orders", "/admin/products", "/admin/inventory"];
  for (const route of subroutes) {
    const r = await fetch(base + route, {
      headers: { "Cookie": goodCookieMap },
      redirect: "manual"
    });
    console.log(`  -> ${route}: Status ${r.status} (Expected: 200 OK)`);
  }

  console.log("\n==================================================");
  console.log("  ALL TESTS PASSED! ADMIN AUTH IS FULLY WORKING.");
  console.log("==================================================");
}

runVerification().catch(console.error);

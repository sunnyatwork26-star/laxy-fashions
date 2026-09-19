async function testBrowserSignIn() {
  const base = "http://localhost:3000";

  // 1. Get CSRF token
  const csrfRes = await fetch(base + "/api/auth/csrf");
  const rawCsrfCookies = csrfRes.headers.getSetCookie ? csrfRes.headers.getSetCookie() : [csrfRes.headers.get("set-cookie")];
  const { csrfToken } = await csrfRes.json();
  const csrfCookieMap = rawCsrfCookies.map(c => c.split(";")[0]).join("; ");

  console.log("CSRF Token:", csrfToken);

  // 2. Simulate EXACT request made by next-auth/react's signIn()
  const signInUrl = `${base}/api/auth/callback/credentials`;
  const body = new URLSearchParams({
    email: "admin@laxyfashions.com",
    password: "changeme123",
    csrfToken,
    callbackUrl: "http://localhost:3000/admin",
    json: "true"
  });

  const res = await fetch(signInUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
      "Cookie": csrfCookieMap
    },
    body: body.toString(),
    redirect: "manual"
  });

  console.log("Status:", res.status);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));
  const text = await res.text();
  console.log("Body:", text);
}

testBrowserSignIn().catch(console.error);

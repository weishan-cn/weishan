import { validateEmailRisk } from "./emailRisk.js";

for (const email of [
  "contact@weishan.ai",
  "support@weishan.ai",
  "test@mailinator.com",
  "xk29dj82qwe123@gmail.com",
  "normal.user@gmail.com"
]) {
  const result = await validateEmailRisk(email);
  console.log(JSON.stringify(result, null, 2));
}

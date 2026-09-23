"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function setLocale(formData: FormData) {
  const locale = formData.get("locale") === "en" ? "en" : "vi";
  const cookieStore = await cookies();

  cookieStore.set("qlts-locale", locale, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
}

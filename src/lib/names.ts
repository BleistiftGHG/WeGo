import { supabase } from "@/lib/supabase";

export async function fetchOwnName(): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return "";
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", auth.user.id)
    .single();
  return (data?.display_name as string | null) ?? "";
}

export async function saveOwnName(
  name: string,
): Promise<"ok" | "invalid" | "error"> {
  const { data, error } = await supabase.rpc("set_display_name", {
    p_name: name,
  });
  if (error) return "error";
  if (data === "ok") return "ok";
  if (data === "invalid") return "invalid";
  return "error";
}

export async function fetchNames(
  ids: string[],
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(ids));
  if (unique.length === 0) return {};
  const { data } = await supabase.rpc("visible_names", { p_ids: unique });
  const map: Record<string, string> = {};
  for (const row of (data as { id: string; display_name: string }[]) ?? []) {
    map[row.id] = row.display_name;
  }
  return map;
}

import { supabase } from "../../lib/supabase";

export async function getFavoriteIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from("portal_favorites")
    .select("app_id");
  if (error) throw error;
  return (data ?? []).map((r) => r.app_id as string);
}

export async function addFavorite(userId: string, appId: string) {
  const { error } = await supabase
    .from("portal_favorites")
    .insert({ user_id: userId, app_id: appId });
  if (error) throw error;
}

export async function removeFavorite(userId: string, appId: string) {
  const { error } = await supabase
    .from("portal_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("app_id", appId);
  if (error) throw error;
}

// File Path: lib/adminUsersStorage.ts
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";

export interface StoredAdminUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
  permissions: string[];
  ui_theme?: "dark" | "light";
  password_hash?: string;
  created_at: string;
  updated_at?: string;
}

const HASH_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "axon_core_admin_pwd_salt_2026";

export function hashAdminPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto
    .pbkdf2Sync(String(plain), salt + HASH_SECRET, 10000, 64, "sha512")
    .toString("hex");
  return `pbkdf2:${salt}:${derived}`;
}

export function verifyAdminPassword(plain: string, storedHash?: string): boolean {
  if (!plain || !storedHash) return false;
  if (storedHash.startsWith("pbkdf2:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const originalHash = parts[2];
    const checkHash = crypto
      .pbkdf2Sync(String(plain), salt + HASH_SECRET, 10000, 64, "sha512")
      .toString("hex");
    try {
      return crypto.timingSafeEqual(
        Buffer.from(originalHash, "hex"),
        Buffer.from(checkHash, "hex")
      );
    } catch {
      return false;
    }
  }
  return plain === storedHash;
}

export async function getAllAdminUsers(): Promise<StoredAdminUser[]> {
  const siteRow = await getMasterSiteInfoRow();
  const layoutCfg = siteRow?.homepage_layout_config || {};
  const registry: StoredAdminUser[] = Array.isArray(layoutCfg.admin_users_registry)
    ? layoutCfg.admin_users_registry
    : [];
  const legacyPermissionsMap = layoutCfg.admin_permissions_map || {};

  let dbUsers: any[] = [];
  try {
    const { data } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: true });
    if (Array.isArray(data)) dbUsers = data;
  } catch {}

  const mergedMap = new Map<string, StoredAdminUser>();

  const defaultSuper: StoredAdminUser = {
    id: "master-superadmin",
    username: "admin",
    full_name: "مدیر ارشد",
    role: "superadmin",
    permissions: ["all"],
    ui_theme: "dark",
    created_at: new Date().toISOString(),
  };
  mergedMap.set("admin", defaultSuper);

  for (const u of dbUsers) {
    const uname = String(u.username || u.email || "admin").trim().toLowerCase();
    const mappedInfo = legacyPermissionsMap[u.id] || legacyPermissionsMap[uname] || {};
    mergedMap.set(uname, {
      id: String(u.id || uname),
      username: String(u.username || u.email || "admin").trim(),
      full_name: u.full_name || mappedInfo.full_name || u.username || "مدیر سیستم",
      role: u.role || mappedInfo.role || "superadmin",
      permissions: Array.isArray(u.permissions)
        ? u.permissions
        : Array.isArray(mappedInfo.permissions)
        ? mappedInfo.permissions
        : u.role === "superadmin"
        ? ["all"]
        : ["dashboard"],
      ui_theme: mappedInfo.ui_theme === "light" ? "light" : "dark",
      password_hash: u.password_hash || u.password || mappedInfo.password_hash,
      created_at: u.created_at || new Date().toISOString(),
    });
  }

  for (const regUser of registry) {
    if (!regUser?.username) continue;
    const uname = String(regUser.username).trim().toLowerCase();
    const existing = mergedMap.get(uname);
    mergedMap.set(uname, {
      ...(existing || {}),
      ...regUser,
      username: String(regUser.username).trim(),
      ui_theme: regUser.ui_theme === "light" ? "light" : existing?.ui_theme || "dark",
      password_hash: regUser.password_hash || existing?.password_hash,
    });
  }

  return Array.from(mergedMap.values());
}

export async function saveAdminUsersRegistry(users: StoredAdminUser[]): Promise<void> {
  const siteRow = await getMasterSiteInfoRow();
  const prevLayout = siteRow?.homepage_layout_config || {};

  const permissionsMap: Record<string, any> = {
    ...(prevLayout.admin_permissions_map || {}),
  };

  for (const u of users) {
    const entry = {
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      role: u.role,
      permissions: u.permissions,
      ui_theme: u.ui_theme === "light" ? "light" : "dark",
      password_hash: u.password_hash,
    };
    permissionsMap[u.id] = entry;
    permissionsMap[u.username.toLowerCase()] = entry;
  }

  await saveMasterSiteInfoRow(
    siteRow,
    {
      ...prevLayout,
      admin_users_registry: users,
      admin_permissions_map: permissionsMap,
    },
    {}
  );
}

export async function verifySubAdminCredentials(
  usernameInput: string,
  passwordInput: string
): Promise<StoredAdminUser | null> {
  const cleanUser = String(usernameInput || "").trim().toLowerCase();
  if (!cleanUser || !passwordInput) return null;

  const allUsers = await getAllAdminUsers();
  const found = allUsers.find(
    (u) => String(u.username || "").trim().toLowerCase() === cleanUser
  );
  if (!found || !found.password_hash) return null;

  const isValid = verifyAdminPassword(passwordInput, found.password_hash);
  return isValid ? found : null;
}

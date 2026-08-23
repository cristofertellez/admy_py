"use server";

import { getUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { deleteFromR2, isBucket, uploadToR2 } from "@/lib/storage/r2";
import { UsersService } from "@/features/users";
import { ActivityService } from "@/services/activity.service";
import { changePasswordSchema, updateProfileSchema } from "@/schemas/user";
import { revalidatePath } from "next/cache";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function updateProfile(_prevState: unknown, formData: FormData) {
  const parsed = updateProfileSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    phone: formData.get("phone") || null,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(fieldErrors).flat()[0] || "Invalid data." };
  }

  try {
    const user = await getUser();
    if (!user) return { error: "Not authenticated." };

    const phone = parsed.data.phone || null;
    const oldValue = { first_name: user.first_name, last_name: user.last_name, phone: user.phone };
    const newValue = { ...parsed.data, phone };

    await UsersService.updateProfile(user.id, newValue);

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      await ActivityService.log({
        user_id: user.id,
        action: "updated_profile",
        entity: "User",
        entity_id: user.id,
        old_value: oldValue,
        new_value: newValue,
      });
    }

    revalidatePath("/dashboard/profile");
    return { success: "Profile updated." };
  } catch (err) {
    console.error("updateProfile failed", err);
    return { error: "Failed to update profile. Please try again." };
  }
}

export async function changePassword(_prevState: unknown, formData: FormData) {
  const parsed = changePasswordSchema.safeParse({
    current_password: formData.get("current_password"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(fieldErrors).flat()[0] || "Invalid data." };
  }

  try {
    const user = await getUser();
    if (!user) return { error: "Not authenticated." };

    const storedHash = await UsersService.getPasswordHash(user.id);
    if (!storedHash || !verifyPassword(parsed.data.current_password, storedHash)) {
      return { error: "Your current password is incorrect." };
    }

    await UsersService.updatePassword(user.id, hashPassword(parsed.data.password));

    await ActivityService.log({
      user_id: user.id,
      action: "changed_password",
      entity: "User",
      entity_id: user.id,
    });

    revalidatePath("/dashboard/profile");
    return { success: "Password changed successfully." };
  } catch (err) {
    console.error("changePassword failed", err);
    return { error: "Failed to change password. Please try again." };
  }
}

export async function uploadAvatar(_prevState: unknown, formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { error: "Not authenticated." };

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "An image file is required." };
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return { error: "Image size must be under 2MB." };
    }

    const mimeType = file.type;
    const extension = ALLOWED_AVATAR_TYPES[mimeType];
    if (!extension) {
      return { error: "Only PNG, JPG, or WebP images are allowed." };
    }

    const bucket = "avatars";
    if (!isBucket(bucket)) {
      return { error: "Invalid storage bucket." };
    }

    const previousAvatar = user.avatar;
    const storagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    await uploadToR2(bucket, storagePath, new Uint8Array(arrayBuffer), mimeType);

    await UsersService.updateAvatar(user.id, storagePath);

    if (previousAvatar && previousAvatar !== storagePath) {
      try {
        await deleteFromR2(bucket, previousAvatar);
      } catch (cleanupError) {
        // The previous object may already be gone; the new avatar stays authoritative.
        console.error("Failed to remove previous avatar", cleanupError);
      }
    }

    await ActivityService.log({
      user_id: user.id,
      action: "updated_avatar",
      entity: "User",
      entity_id: user.id,
    });

    revalidatePath("/dashboard/profile");
    return { success: "Avatar updated." };
  } catch (err) {
    console.error("uploadAvatar failed", err);
    if (err instanceof Error && /credentials/i.test(err.message)) {
      return { error: "File storage is not configured. Contact an administrator." };
    }
    return { error: "Failed to update avatar. Please try again." };
  }
}

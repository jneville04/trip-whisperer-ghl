import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "crypto";

/**
 * Upload image file to Supabase storage and return the public URL.
 * Falls back to base64 only if upload fails.
 */
export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `uploads/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("app-assets")
    .upload(filePath, file, { cacheControl: "31536000", upsert: false });

  if (error) {
    console.error("Storage upload failed, falling back to data URL:", error.message);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  const { data: urlData } = supabase.storage
    .from("app-assets")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Upload multiple files and return array of public URLs.
 */
export async function uploadImages(files: FileList | File[]): Promise<string[]> {
  const promises = Array.from(files).map((f) => uploadImage(f));
  return Promise.all(promises);
}

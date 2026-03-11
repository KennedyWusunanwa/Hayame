import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";

const COOKIE_NAME = "admin_auth";
const MAX_PHOTOS = 7;
const MAX_PHOTO_FILE_BYTES = 4 * 1024 * 1024;

function adminToken() {
  const username = process.env.ADMIN_USERNAME ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!username || !password) return null;
  return Buffer.from(`${username}:${password}`).toString("base64");
}

async function isAdmin() {
  const token = adminToken();
  if (!token) return false;
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  return cookie === token;
}

function getPhotoBucketName() {
  const configured =
    process.env.NEXT_PUBLIC_SUPABASE_CAR_PHOTOS_BUCKET ||
    process.env.SUPABASE_CAR_PHOTOS_BUCKET ||
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
    "";
  const reservedBuckets = new Set(
    [
      process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET,
      process.env.NEXT_PUBLIC_SUPABASE_HOST_ID_BUCKET,
      process.env.SUPABASE_HOST_ID_BUCKET,
    ].filter(Boolean),
  );
  if (!configured || reservedBuckets.has(configured)) {
    return "car-photos";
  }
  return configured;
}

function getStoragePathFromPublicUrl(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl);
    const prefix = `/storage/v1/object/public/${bucket}/`;
    const start = url.pathname.indexOf(prefix);
    if (start === -1) return null;
    return decodeURIComponent(url.pathname.slice(start + prefix.length));
  } catch {
    return null;
  }
}

async function canManageCar(carId: string, req?: Request) {
  const adminAllowed = await isAdmin();
  if (adminAllowed) {
    try {
      const adminClient = createSupabaseAdminClient() as any;
      const { data: car, error } = await adminClient.from("cars").select("id,owner_id").eq("id", carId).single();
      if (error || !car) {
        return { ok: false as const, status: 404, message: "Car not found" };
      }
      return { ok: true as const, client: adminClient, car, isAdmin: true as const };
    } catch {
      return {
        ok: false as const,
        status: 500,
        message: "Server storage configuration error. Missing service role key.",
      };
    }
  }

  const supabase = await createSupabaseServerClient();
  const client = supabase as any;
  const user = await getRequestUser(supabase as any, req);
  if (!user) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }
  const { data: car, error } = await client.from("cars").select("id,owner_id").eq("id", carId).single();
  if (error || !car) {
    return { ok: false as const, status: 404, message: "Car not found" };
  }
  if (car.owner_id !== user.id) {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }
  return { ok: true as const, client, car, isAdmin: false as const };
}

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, context: Params) {
  const { id: carId } = await context.params;
  try {
    const access = await canManageCar(carId, req);
    if (!access.ok) {
      return NextResponse.json({ message: access.message }, { status: access.status });
    }

    const { data, error } = await access.client
      .from("car_photos")
      .select("id,url")
      .eq("car_id", carId);
    if (error) throw error;

    return NextResponse.json({
      data: data ?? [],
      meta: {
        max_photos: MAX_PHOTOS,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to load photos" }, { status: 400 });
  }
}

export async function POST(req: Request, context: Params) {
  const { id: carId } = await context.params;
  try {
    const access = await canManageCar(carId, req);
    if (!access.ok) {
      return NextResponse.json({ message: access.message }, { status: access.status });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Missing file" }, { status: 400 });
    }
    if (!file.type?.startsWith("image/")) {
      return NextResponse.json({ message: "Only image files are allowed" }, { status: 400 });
    }
    if (file.size > MAX_PHOTO_FILE_BYTES) {
      return NextResponse.json(
        { message: "Photo upload failed because the image file is too large. Please use a photo under 4MB." },
        { status: 413 },
      );
    }

    const replacePhotoId = String(formData.get("replacePhotoId") ?? "").trim() || null;
    const client = access.client;
    const existingPhotoCount = await client
      .from("car_photos")
      .select("id", { count: "exact", head: true })
      .eq("car_id", carId);
    if (!replacePhotoId && (existingPhotoCount.count ?? 0) >= MAX_PHOTOS) {
      return NextResponse.json({ message: `Maximum ${MAX_PHOTOS} photos allowed.` }, { status: 400 });
    }

    const oldPhoto = replacePhotoId
      ? await client
          .from("car_photos")
          .select("id,url")
          .eq("id", replacePhotoId)
          .eq("car_id", carId)
          .single()
      : null;
    if (replacePhotoId && !oldPhoto?.data) {
      return NextResponse.json({ message: "Photo not found" }, { status: 404 });
    }

    const bucket = getPhotoBucketName();
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    const path = `${access.car.owner_id}/${carId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await client.storage.from(bucket).upload(path, bytes, {
      cacheControl: "3600",
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = client.storage.from(bucket).getPublicUrl(path);

    if (replacePhotoId) {
      const { data: updatedPhoto, error: updateError } = await client
        .from("car_photos")
        .update({ url: publicUrl })
        .eq("id", replacePhotoId)
        .eq("car_id", carId)
        .select("id,url")
        .single();
      if (updateError) {
        await client.storage.from(bucket).remove([path]);
        throw updateError;
      }

      const oldPath = getStoragePathFromPublicUrl(oldPhoto.data.url, bucket);
      if (oldPath) {
        await client.storage.from(bucket).remove([oldPath]);
      }

      return NextResponse.json({ data: updatedPhoto });
    }

    const { data: insertedPhoto, error: insertError } = await client
      .from("car_photos")
      .insert({ car_id: carId, url: publicUrl })
      .select("id,url")
      .single();
    if (insertError) {
      await client.storage.from(bucket).remove([path]);
      throw insertError;
    }

    return NextResponse.json({ data: insertedPhoto });
  } catch (error: any) {
    const message = error?.message ?? "Failed to upload photo";
    const status = /too large/i.test(message) ? 413 : 400;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(req: Request, context: Params) {
  const { id: carId } = await context.params;
  try {
    const access = await canManageCar(carId, req);
    if (!access.ok) {
      return NextResponse.json({ message: access.message }, { status: access.status });
    }

    const body = (await req.json().catch(() => ({}))) as { photoId?: string };
    const photoId = String(body.photoId ?? "").trim();
    if (!photoId) {
      return NextResponse.json({ message: "Missing photoId" }, { status: 400 });
    }

    const client = access.client;
    const { data: photo } = await client
      .from("car_photos")
      .select("id,url")
      .eq("id", photoId)
      .eq("car_id", carId)
      .single();
    if (!photo) {
      return NextResponse.json({ message: "Photo not found" }, { status: 404 });
    }

    const { error: deleteError } = await client
      .from("car_photos")
      .delete()
      .eq("id", photoId)
      .eq("car_id", carId);
    if (deleteError) throw deleteError;

    const bucket = getPhotoBucketName();
    const path = getStoragePathFromPublicUrl(photo.url, bucket);
    if (path) {
      await client.storage.from(bucket).remove([path]);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to delete photo" }, { status: 400 });
  }
}

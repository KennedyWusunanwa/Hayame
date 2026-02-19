import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const COOKIE_NAME = "admin_auth";
const MAX_PHOTOS = 7;

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
  return (
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET ||
    "car-photos"
  );
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

async function canManageCar(carId: string) {
  const adminAllowed = await isAdmin();
  const adminClient = createSupabaseAdminClient() as any;
  const { data: car, error } = await adminClient.from("cars").select("id,owner_id").eq("id", carId).single();
  if (error || !car) {
    return { ok: false as const, status: 404, message: "Car not found", adminClient, car: null };
  }

  if (adminAllowed) {
    return { ok: true as const, adminClient, car };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, status: 401, message: "Unauthorized", adminClient, car };
  }
  if (car.owner_id !== user.id) {
    return { ok: false as const, status: 403, message: "Forbidden", adminClient, car };
  }
  return { ok: true as const, adminClient, car };
}

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, context: Params) {
  const { id: carId } = await context.params;
  try {
    const access = await canManageCar(carId);
    if (!access.ok) {
      return NextResponse.json({ message: access.message }, { status: access.status });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Missing file" }, { status: 400 });
    }

    const replacePhotoId = String(formData.get("replacePhotoId") ?? "").trim() || null;
    const adminClient = access.adminClient;
    const existingPhotoCount = await adminClient
      .from("car_photos")
      .select("id", { count: "exact", head: true })
      .eq("car_id", carId);
    if (!replacePhotoId && (existingPhotoCount.count ?? 0) >= MAX_PHOTOS) {
      return NextResponse.json({ message: `Maximum ${MAX_PHOTOS} photos allowed.` }, { status: 400 });
    }

    const oldPhoto = replacePhotoId
      ? await adminClient
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
    const { error: uploadError } = await adminClient.storage.from(bucket).upload(path, bytes, {
      cacheControl: "3600",
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = adminClient.storage.from(bucket).getPublicUrl(path);

    if (replacePhotoId) {
      const { data: updatedPhoto, error: updateError } = await adminClient
        .from("car_photos")
        .update({ url: publicUrl })
        .eq("id", replacePhotoId)
        .eq("car_id", carId)
        .select("id,url")
        .single();
      if (updateError) {
        await adminClient.storage.from(bucket).remove([path]);
        throw updateError;
      }

      const oldPath = getStoragePathFromPublicUrl(oldPhoto.data.url, bucket);
      if (oldPath) {
        await adminClient.storage.from(bucket).remove([oldPath]);
      }

      return NextResponse.json({ data: updatedPhoto });
    }

    const { data: insertedPhoto, error: insertError } = await adminClient
      .from("car_photos")
      .insert({ car_id: carId, url: publicUrl })
      .select("id,url")
      .single();
    if (insertError) {
      await adminClient.storage.from(bucket).remove([path]);
      throw insertError;
    }

    return NextResponse.json({ data: insertedPhoto });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to upload photo" }, { status: 400 });
  }
}

export async function DELETE(req: Request, context: Params) {
  const { id: carId } = await context.params;
  try {
    const access = await canManageCar(carId);
    if (!access.ok) {
      return NextResponse.json({ message: access.message }, { status: access.status });
    }

    const body = (await req.json().catch(() => ({}))) as { photoId?: string };
    const photoId = String(body.photoId ?? "").trim();
    if (!photoId) {
      return NextResponse.json({ message: "Missing photoId" }, { status: 400 });
    }

    const adminClient = access.adminClient;
    const { data: photo } = await adminClient
      .from("car_photos")
      .select("id,url")
      .eq("id", photoId)
      .eq("car_id", carId)
      .single();
    if (!photo) {
      return NextResponse.json({ message: "Photo not found" }, { status: 404 });
    }

    const { error: deleteError } = await adminClient
      .from("car_photos")
      .delete()
      .eq("id", photoId)
      .eq("car_id", carId);
    if (deleteError) throw deleteError;

    const bucket = getPhotoBucketName();
    const path = getStoragePathFromPublicUrl(photo.url, bucket);
    if (path) {
      await adminClient.storage.from(bucket).remove([path]);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to delete photo" }, { status: 400 });
  }
}

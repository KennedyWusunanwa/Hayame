"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  carId: string;
  initialIsFavorited?: boolean;
  className?: string;
  size?: "sm" | "md";
  onToggle?: (next: boolean) => void;
};

export function FavoriteButton({
  carId,
  initialIsFavorited = false,
  className,
  size = "md",
  onToggle,
}: Props) {
  const [favorite, setFavorite] = useState(initialIsFavorited);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setFavorite(initialIsFavorited);
  }, [initialIsFavorited]);

  const handleToggle = async () => {
    if (loading) return;
    const previous = favorite;
    const next = !previous;
    try {
      setLoading(true);
      setFavorite(next);
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId, isFavorite: next }),
      });
      if (res.status === 401) {
        setFavorite(false);
        router.push(`/auth/login?next=${encodeURIComponent(pathname ?? "/")}`);
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to update favorite");
      }
      onToggle?.(next);
    } catch (error) {
      console.error(error);
      setFavorite(previous);
      alert("Could not update favorite. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = size === "sm" ? "h-10 w-10" : "h-11 w-11";

  return (
    <button
      type="button"
      aria-pressed={favorite}
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "group relative flex items-center justify-center rounded-full border border-border bg-white text-gray-700 shadow-sm transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        favorite && "text-brand",
        sizeClasses,
        className,
      )}
    >
      <Heart className={cn("h-5 w-5 transition", favorite && "fill-brand text-brand")} />
      <span className="sr-only">{favorite ? "Remove from favorites" : "Save to favorites"}</span>
    </button>
  );
}

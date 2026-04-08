import { ImageResponse } from "next/og";
import {
  socialImageAlt,
  socialImageSize,
  SocialPreviewImage,
} from "@/components/seo/social-preview-image";
import { getSocialPreviewLogoSrc } from "@/lib/social-preview-logo";

export const runtime = "nodejs";
export const alt = socialImageAlt;
export const size = socialImageSize;
export const contentType = "image/png";

export default async function TwitterImage() {
  const logoSrc = await getSocialPreviewLogoSrc();
  return new ImageResponse(<SocialPreviewImage logoSrc={logoSrc} />, size);
}

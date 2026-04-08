import { ImageResponse } from "next/og";
import {
  socialImageAlt,
  socialImageSize,
  SocialPreviewImage,
} from "@/components/seo/social-preview-image";

export const runtime = "edge";
export const alt = socialImageAlt;
export const size = socialImageSize;
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(<SocialPreviewImage />, size);
}

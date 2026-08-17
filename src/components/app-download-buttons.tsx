import Image from "next/image";
import { Download } from "lucide-react";
import { ANDROID_APK_URL, IOS_APP_STORE_URL } from "@/lib/support";

type AppDownloadButtonsProps = {
  className?: string;
  compact?: boolean;
  tone?: "dark" | "light";
};

export function AppDownloadButtons({
  className = "",
  compact = false,
  tone = "dark",
}: AppDownloadButtonsProps) {
  const layoutClass = compact
    ? "flex flex-col gap-2.5"
    : "flex flex-col gap-3 min-[460px]:flex-row";
  const androidClass =
    tone === "dark"
      ? "border-white/15 bg-white/[0.08] !text-white hover:border-white/30 hover:bg-white/[0.14] hover:!text-white"
      : "border-sky-100 bg-white !text-[#06223a] shadow-sm hover:border-sky-200 hover:bg-sky-50 hover:!text-[#06223a]";
  const buttonClass = compact
    ? "min-h-11 rounded-xl px-3"
    : "min-h-14 rounded-2xl px-4 sm:px-5";

  return (
    <div className={`${layoutClass} ${className}`}>
      <a
        href={IOS_APP_STORE_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Download Hayame on the App Store"
        className="inline-flex w-fit items-center transition-transform hover:-translate-y-0.5"
      >
        <Image
          src="/badges/download-on-the-app-store.svg"
          alt="Download on the App Store"
          width={120}
          height={40}
          className={compact ? "h-10 w-auto" : "h-12 w-auto"}
        />
      </a>

      <a
        href={ANDROID_APK_URL}
        download="hayame-android.apk"
        aria-label="Download the Hayame Android APK"
        className={`${buttonClass} inline-flex items-center gap-3 border text-left transition-all hover:-translate-y-0.5 ${androidClass}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm shadow-sky-950/20">
          <Download className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <span className="leading-none">
          <span
            className={`block text-[10px] font-semibold uppercase tracking-[0.14em] ${
              tone === "dark" ? "text-white/55" : "text-slate-500"
            }`}
          >
            Direct APK
          </span>
          <span className="mt-1 block whitespace-nowrap text-sm font-bold sm:text-base">
            Download Android app
          </span>
        </span>
      </a>
    </div>
  );
}

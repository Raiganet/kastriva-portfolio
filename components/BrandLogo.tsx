import Image from "next/image";
import clsx from "clsx";

type BrandLogoProps = {
  alt?: string;
  className?: string;
  imageClassName?: string;
  surface?: "auto" | "dark" | "light";
  priority?: boolean;
};

/**
 * Canonical Kastriva wordmark.
 * - dark surface  -> white wordmark
 * - light surface -> navy wordmark
 * - auto          -> follows the active light/dark theme
 *
 * Keep the artwork untouched here so every public/admin/customer surface
 * uses one consistent brand identity.
 */
export default function BrandLogo({
  alt = "Kastriva",
  className,
  imageClassName,
  surface = "auto",
  priority = false,
}: BrandLogoProps) {
  const base = clsx("h-auto w-full object-contain", imageClassName);

  if (surface === "dark") {
    return (
      <span className={clsx("inline-block", className)}>
        <Image
          src="/brand/kastriva-logo-on-dark.png"
          alt={alt}
          width={1536}
          height={438}
          priority={priority}
          className={base}
        />
      </span>
    );
  }

  if (surface === "light") {
    return (
      <span className={clsx("inline-block", className)}>
        <Image
          src="/brand/kastriva-logo-on-light.png"
          alt={alt}
          width={1536}
          height={438}
          priority={priority}
          className={base}
        />
      </span>
    );
  }

  return (
    <span className={clsx("relative inline-block", className)}>
      <Image
        src="/brand/kastriva-logo-on-light.png"
        alt={alt}
        width={1536}
        height={438}
        priority={priority}
        className={clsx(base, "dark:hidden")}
      />
      <Image
        src="/brand/kastriva-logo-on-dark.png"
        alt=""
        aria-hidden="true"
        width={1536}
        height={438}
        priority={priority}
        className={clsx(base, "hidden dark:block")}
      />
    </span>
  );
}

"use client";
import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { ImageIcon } from "lucide-react";

interface ImageWithFallbackProps extends Omit<ImageProps, "onError" | "onLoad"> {
  fallbackIcon?: React.ReactNode;
}

export default function ImageWithFallback({
  fallbackIcon,
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <div className="relative w-full h-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-2">
        {fallbackIcon || <ImageIcon className="text-slate-400" size={48} />}
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse" />
      )}
      <Image
        {...props}
        alt={alt}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        onLoad={() => setIsLoading(false)}
      />
    </>
  );
}

import Image from "next/image";
import Link from "next/link";

// Full logo lockup (icon + wordmark + tagline), real transparent PNG —
// no filter/crop tricks needed, just render it.
export function Logo() {
  return (
    <Link href="/" className="group flex items-center transition-transform duration-300 hover:scale-105">
      <Image
        src="/logo-xelvex.png"
        alt="Xelvex — Level Up Your Game"
        width={500}
        height={500}
        priority
        className="h-10 w-10 object-contain drop-shadow-[0_0_10px_rgba(124,58,237,0.5)] sm:h-11 sm:w-11"
      />
    </Link>
  );
}

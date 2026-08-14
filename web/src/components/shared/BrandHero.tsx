import Logo from "./Logo";

interface BrandHeroProps {
  size?: "lg" | "md";
}

export default function BrandHero({ size = "lg" }: BrandHeroProps) {
  const logoSize = size === "lg" ? 64 : 44;
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Logo size={logoSize} />
      <div>
        <h1 className={`font-serif text-ink ${size === "lg" ? "text-[32px]" : "text-2xl"}`}>Granite</h1>
        <p className="mt-1 font-sans text-[14px] text-muted">
          ISF grant writing, thought through.
        </p>
      </div>
    </div>
  );
}

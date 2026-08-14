interface LogoProps {
  size?: number;
}

export default function Logo({ size = 24 }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="Granite"
      className="flex items-center justify-center rounded-[27%] bg-ink font-serif text-canvas select-none"
      style={{ width: size, height: size, fontSize: size * 0.55 }}
    >
      G
    </span>
  );
}

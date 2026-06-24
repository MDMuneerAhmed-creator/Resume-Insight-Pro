interface SkillzyLogoProps {
  size?: number;
  showName?: boolean;
  className?: string;
  nameClassName?: string;
}

export function SkillzyLogo({ size = 32, showName = true, className = "", nameClassName = "" }: SkillzyLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="Skillzy"
        width={size}
        height={size}
        className="object-contain shrink-0"
        style={{ width: size, height: size }}
      />
      {showName && (
        <span className={`font-bold tracking-tight skillzy-gradient-text ${nameClassName}`}>
          Skillzy
        </span>
      )}
    </div>
  );
}

export function SkillzyIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Skillzy"
      width={size}
      height={size}
      className={`object-contain shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

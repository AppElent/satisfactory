interface EntityIconProps {
	icon?: string;
	name: string;
	size?: number;
	className?: string;
}

export default function EntityIcon({
	icon,
	name,
	size = 40,
	className,
}: EntityIconProps) {
	if (!icon) {
		return (
			<span
				aria-hidden
				className={`inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-inset)] text-[var(--text-muted)] ${className ?? ""}`}
				style={{ width: size, height: size, fontSize: size * 0.45 }}
			>
				{name.charAt(0).toUpperCase()}
			</span>
		);
	}
	return (
		<img
			src={`/icons/${icon}.png`}
			alt={name}
			width={size}
			height={size}
			loading="lazy"
			className={className}
		/>
	);
}

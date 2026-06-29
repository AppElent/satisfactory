import type { CSSProperties } from "react";

export type IconName =
	| "factory"
	| "calc"
	| "data"
	| "route"
	| "map"
	| "gauge"
	| "zap"
	| "plus"
	| "search"
	| "chevron"
	| "alert"
	| "check"
	| "box"
	| "arrow"
	| "trash"
	| "cog"
	| "power"
	| "hex";

interface IconProps {
	name: IconName;
	size?: number;
	className?: string;
	style?: CSSProperties;
}

/** Renders a FICSIT HUD glyph from the mounted <SymbolDefs>. Inherits currentColor. */
export function Icon({ name, size = 18, className, style }: IconProps) {
	return (
		<svg
			width={size}
			height={size}
			className={className}
			style={style}
			aria-hidden="true"
			focusable="false"
		>
			<use href={`#i-${name}`} />
		</svg>
	);
}

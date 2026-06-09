declare module 'page-flip/dist/js/page-flip.module.js' {
	export type FlipCorner = 'top' | 'bottom';
	export type FlipOrientation = 'portrait' | 'landscape';

	export interface PageFlipSettings {
		width: number;
		height: number;
		size?: 'fixed' | 'stretch';
		minWidth?: number;
		maxWidth?: number;
		minHeight?: number;
		maxHeight?: number;
		drawShadow?: boolean;
		flippingTime?: number;
		usePortrait?: boolean;
		startPage?: number;
		startZIndex?: number;
		autoSize?: boolean;
		maxShadowOpacity?: number;
		showCover?: boolean;
		mobileScrollSupport?: boolean;
		swipeDistance?: number;
		clickEventForward?: boolean;
		useMouseEvents?: boolean;
		showPageCorners?: boolean;
		disableFlipByClick?: boolean;
	}

	export interface PageFlipEvent<T = unknown> {
		data: T;
		object: PageFlip;
	}

	export class PageFlip {
		constructor(block: HTMLElement, settings: PageFlipSettings);
		on<T = unknown>(event: string, callback: (event: PageFlipEvent<T>) => void): PageFlip;
		loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
		flip(page: number, corner?: FlipCorner): void;
		flipNext(corner?: FlipCorner): void;
		flipPrev(corner?: FlipCorner): void;
		turnToPage(page: number): void;
		getCurrentPageIndex(): number;
		getPageCount(): number;
		getOrientation(): FlipOrientation;
		destroy(): void;
	}
}

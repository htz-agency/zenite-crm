import clsx from "clsx";
import svgPaths from "./svg-ig2dc0d4yz";

function BackgroundImage9({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-0 relative shrink-0 w-[757px]">
      <div className="absolute inset-[-1.5px_0_0_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 757 1.5">
          {children}
        </svg>
      </div>
    </div>
  );
}
type BackgroundImage8Props = {
  additionalClassNames?: string;
};

function BackgroundImage8({ children, additionalClassNames = "" }: React.PropsWithChildren<BackgroundImage8Props>) {
  return (
    <div className={clsx("h-[36px] relative rounded-br-[100px] rounded-tr-[100px] shrink-0 w-[198px]", additionalClassNames)}>
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[4px] items-center pl-[14px] pr-[28px] py-[10px] relative size-full">{children}</div>
      </div>
    </div>
  );
}

function BackgroundImage7({ children }: React.PropsWithChildren<{}>) {
  return (
    <BackgroundImage8>
      <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic overflow-hidden relative shrink-0 text-[#4e6987] text-[15px] text-ellipsis tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        {children}
      </p>
    </BackgroundImage8>
  );
}
type LeadBackgroundImageProps = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function LeadBackgroundImage({ text, text1, additionalClassNames = "" }: LeadBackgroundImageProps) {
  return (
    <div className={clsx("content-stretch flex gap-[4px] items-center pr-[28px] py-[10px] relative", additionalClassNames)}>
      <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] h-full justify-center leading-[0] relative shrink-0 text-[19px] text-center w-[44px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24px] whitespace-pre-wrap">{text}</p>
      </div>
      <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic overflow-hidden relative shrink-0 text-[15px] text-ellipsis tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        {text1}
      </p>
    </div>
  );
}
type LeadBackgroundImageAndText1Props = {
  text: string;
  additionalClassNames?: string;
};

function LeadBackgroundImageAndText1({ text, additionalClassNames = "" }: LeadBackgroundImageAndText1Props) {
  return (
    <div style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }} className={clsx("-translate-y-1/2 absolute flex flex-col font-['DM_Sans:Medium',sans-serif] justify-center leading-[0] not-italic text-[#4e6987] text-[12px] tracking-[-0.5px] whitespace-nowrap", additionalClassNames)}>
      <p className="leading-[17px]">{text}</p>
    </div>
  );
}
type LeadBackgroundImageAndTextProps = {
  text: string;
  additionalClassNames?: string;
};

function LeadBackgroundImageAndText({ text, additionalClassNames = "" }: LeadBackgroundImageAndTextProps) {
  return (
    <div style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }} className={clsx("-translate-y-1/2 absolute flex flex-col font-['DM_Sans:Medium',sans-serif] justify-center leading-[0] left-[295px] not-italic text-[#28415c] tracking-[-0.5px] whitespace-nowrap", additionalClassNames)}>
      <p className="leading-[22px]">{text}</p>
    </div>
  );
}

function Frame220BackgroundImage() {
  return (
    <BackgroundImage9>
      <line id="Line 8" stroke="var(--stroke-0, #DDE3EC)" strokeWidth="1.5" x2="757" y1="0.75" y2="0.75" />
    </BackgroundImage9>
  );
}
type BackgroundImage6Props = {
  additionalClassNames?: string;
};

function BackgroundImage6({ additionalClassNames = "" }: BackgroundImage6Props) {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <Checkbox className="backdrop-blur-[20px] relative rounded-[100px] shrink-0 size-[16px]" />
      <BackgroundImageAndText2 text="Pessoas específicas" additionalClassNames="w-[114px]" />
    </div>
  );
}
type BackgroundImage5Props = {
  additionalClassNames?: string;
};

function BackgroundImage5({ additionalClassNames = "" }: BackgroundImage5Props) {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <Checkbox className="backdrop-blur-[20px] bg-[#3ccea7] overflow-clip relative rounded-[100px] shrink-0 size-[16px]" selected />
      <BackgroundImageAndText2 text="Todos da Organização" additionalClassNames="w-[127px]" />
    </div>
  );
}

function BackgroundImage4() {
  return (
    <div className="content-stretch flex gap-[25px] items-center relative shrink-0">
      <BackgroundImageAndText1 text="Todos da Organização" />
      <BackgroundImage2 />
      <BackgroundImage3 />
    </div>
  );
}
type BackgroundImage3Props = {
  additionalClassNames?: string;
};

function BackgroundImage3({ additionalClassNames = "" }: BackgroundImage3Props) {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <Checkbox className="backdrop-blur-[20px] bg-[#3ccea7] overflow-clip relative rounded-[100px] shrink-0 size-[16px]" selected />
      <BackgroundImageAndText2 text="Pessoas específicas" additionalClassNames="w-[114px]" />
    </div>
  );
}
type BackgroundImage2Props = {
  additionalClassNames?: string;
};

function BackgroundImage2({ additionalClassNames = "" }: BackgroundImage2Props) {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <Checkbox className="backdrop-blur-[20px] relative rounded-[100px] shrink-0 size-[16px]" />
      <BackgroundImageAndText2 text="Somente o Proprietário do Pipe" additionalClassNames="w-[114px]" />
    </div>
  );
}
type BackgroundImageAndText2Props = {
  text: string;
  additionalClassNames?: string;
};

function BackgroundImageAndText2({ text, additionalClassNames = "" }: BackgroundImageAndText2Props) {
  return (
    <div style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }} className={clsx("flex flex-col font-['DM_Sans:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#4e6987] text-[12px] tracking-[-0.5px]", additionalClassNames)}>
      <p className="leading-[17px] whitespace-pre-wrap">{text}</p>
    </div>
  );
}
type BackgroundImageAndText1Props = {
  text: string;
};

function BackgroundImageAndText1({ text }: BackgroundImageAndText1Props) {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <Checkbox className="backdrop-blur-[20px] relative rounded-[100px] shrink-0 size-[16px]" />
      <BackgroundImageAndText2 text={text} additionalClassNames="w-[127px]" />
    </div>
  );
}

function KnobBackgroundImage() {
  return (
    <div className="backdrop-blur-[50px] bg-[#f6f7f9] relative rounded-[100px] shrink-0 size-[15px]">
      <div aria-hidden="true" className="absolute border border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[100px] shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)]" />
    </div>
  );
}
type Frame233TabBackgroundImageAndTextProps = {
  text: string;
};

function Frame233TabBackgroundImageAndText({ text }: Frame233TabBackgroundImageAndTextProps) {
  return <BackgroundImage7>{text}</BackgroundImage7>;
}
type BackgroundImage1Props = {
  symbol: string;
  additionalClassNames?: string;
};

function BackgroundImage1({ symbol, additionalClassNames = "" }: BackgroundImage1Props) {
  return (
    <div style={{ fontVariationSettings: "'wdth' 100" }} className={additionalClassNames}>
      <p className="leading-[22px] whitespace-pre-wrap">{symbol}</p>
    </div>
  );
}
type BackgroundImageProps = {
  symbol: string;
  additionalClassNames?: string;
};

function BackgroundImage({ symbol, additionalClassNames = "" }: BackgroundImageProps) {
  return <BackgroundImage1 additionalClassNames={clsx("-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[13px] text-center top-1/2", additionalClassNames)} symbol={symbol} />;
}
type ButtonSymbolBackgroundImageProps = {
  symbol: string;
  additionalClassNames?: string;
};

function ButtonSymbolBackgroundImage({ symbol, additionalClassNames = "" }: ButtonSymbolBackgroundImageProps) {
  return <BackgroundImage1 additionalClassNames={clsx("-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] left-1/2 text-center top-1/2", additionalClassNames)} symbol={symbol} />;
}
type BackgroundImageAndTextProps = {
  text: string;
  additionalClassNames?: string;
};

function BackgroundImageAndText({ text, additionalClassNames = "" }: BackgroundImageAndTextProps) {
  return (
    <div style={{ fontVariationSettings: "'wdth' 100" }} className={clsx("-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] left-1/2 text-center top-1/2", additionalClassNames)}>
      <p className="leading-[22px] whitespace-pre-wrap">{text}</p>
    </div>
  );
}
type CheckboxProps = {
  className?: string;
  selected?: boolean;
  state?: "Idle" | "Hover";
};

function Checkbox({ className, selected = false, state = "Idle" }: CheckboxProps) {
  const isIdleAndSelected = state === "Idle" && selected;
  const isNotSelectedAndIsHoverOrIdle = !selected && ["Hover", "Idle"].includes(state);
  const isSelectedAndIsHoverOrIdle = selected && ["Hover", "Idle"].includes(state);
  return (
    <div className={className || `overflow-clip relative rounded-[100px] size-[16px] ${state === "Idle" && !selected ? "backdrop-blur-[20px]" : isIdleAndSelected ? "backdrop-blur-[20px] bg-[#3ccea7]" : ""}`} style={state === "Hover" && !selected ? { backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 16 16\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.4000000059604645\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-3.6556e-9 -1.2571 1.2571 -3.6556e-9 8 16)\\'><stop stop-color=\\'rgba(60,206,167,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(109,218,189,0.75)\\' offset=\\'0.25\\'/><stop stop-color=\\'rgba(158,231,211,0.5)\\' offset=\\'0.5\\'/><stop stop-color=\\'rgba(255,255,255,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>')" } : state === "Hover" && selected ? { backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 16 16\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.20000000298023224\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-3.6556e-9 -1.2571 1.2571 -3.6556e-9 8 16)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(255,255,255,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>'), linear-gradient(90deg, rgb(60, 206, 167) 0%, rgb(60, 206, 167) 100%)" } : undefined}>
      <div aria-hidden={isNotSelectedAndIsHoverOrIdle ? "true" : undefined} className={`absolute ${isNotSelectedAndIsHoverOrIdle ? "border-[#28415c] border-[1.5px] border-solid inset-0 pointer-events-none rounded-[100px]" : isIdleAndSelected ? '-translate-x-1/2 -translate-y-1/2 flex flex-col font-["SF_Pro:Bold",sans-serif] font-bold justify-center leading-[0] left-1/2 size-[28px] text-[#fefefe] text-[10px] text-center top-1/2' : 'flex flex-col font-["SF_Pro:Bold",sans-serif] font-bold inset-0 justify-center leading-[0] text-[#fefefe] text-[10px] text-center'}`} style={isSelectedAndIsHoverOrIdle ? { fontVariationSettings: "'wdth' 100" } : undefined}>
        {isSelectedAndIsHoverOrIdle && <p className="leading-[22px] whitespace-pre-wrap">􀆅</p>}
      </div>
    </div>
  );
}
type ButtonSymbolProps = {
  className?: string;
  size?: "Mini" | "Small" | "Standard" | "Large" | "Extra Large";
  state?: "Idle (No Platter)" | "Idle (Platter)" | "Hover" | "Selected" | "Disabled";
  symbol?: string;
};

function ButtonSymbol({ className, size = "Mini", state = "Idle (No Platter)", symbol = "􀻒" }: ButtonSymbolProps) {
  if (size === "Extra Large" && state === "Disabled") {
    return (
      <div className={className || "overflow-clip relative rounded-[500px] size-[64px]"} data-name="Size=Extra Large, State=Disabled">
        <BackgroundImageAndText text="􀻒" additionalClassNames="size-[50px] text-[#d9d9d9] text-[29px]" />
      </div>
    );
  }
  if (size === "Extra Large" && state === "Selected") {
    return (
      <div className={className || "bg-[#07abde] overflow-clip relative rounded-[500px] size-[64px]"} data-name="Size=Extra Large, State=Selected">
        <ButtonSymbolBackgroundImage additionalClassNames="size-[50px] text-[#f6f7f9] text-[29px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Extra Large" && state === "Hover") {
    return (
      <div className={className || "overflow-clip relative rounded-[100px] size-[64px]"} data-name="Size=Extra Large, State=Hover" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 64 64\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.20000000298023224\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-1.4622e-8 -5.0286 5.0286 -1.4622e-8 32 64)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(255,255,255,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>'), linear-gradient(90deg, rgb(220, 240, 255) 0%, rgb(220, 240, 255) 100%)" }}>
        <ButtonSymbolBackgroundImage additionalClassNames="size-[50px] text-[#28415c] text-[29px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Extra Large" && state === "Idle (Platter)") {
    return (
      <div className={className || "bg-[#dde3ec] overflow-clip relative rounded-[500px] size-[64px]"} data-name="Size=Extra Large, State=Idle (Platter)">
        <ButtonSymbolBackgroundImage additionalClassNames="size-[50px] text-[#28415c] text-[29px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Extra Large" && state === "Idle (No Platter)") {
    return (
      <div className={className || "overflow-clip relative rounded-[500px] size-[64px]"} data-name="Size=Extra Large, State=Idle (No Platter)">
        <ButtonSymbolBackgroundImage additionalClassNames="size-[50px] text-[#28415c] text-[29px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Large" && state === "Disabled") {
    return (
      <div className={className || "overflow-clip relative rounded-[500px] size-[52px]"} data-name="Size=Large, State=Disabled">
        <BackgroundImageAndText text="􀻒" additionalClassNames="size-[50px] text-[#d9d9d9] text-[24px]" />
      </div>
    );
  }
  if (size === "Large" && state === "Selected") {
    return (
      <div className={className || "bg-[#07abde] overflow-clip relative rounded-[500px] size-[52px]"} data-name="Size=Large, State=Selected">
        <ButtonSymbolBackgroundImage additionalClassNames="size-[50px] text-[#f6f7f9] text-[24px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Large" && state === "Hover") {
    return (
      <div className={className || "overflow-clip relative rounded-[100px] size-[52px]"} data-name="Size=Large, State=Hover" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 52 52\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.20000000298023224\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-1.1881e-8 -4.0857 4.0857 -1.1881e-8 26 52)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(255,255,255,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>'), linear-gradient(90deg, rgb(220, 240, 255) 0%, rgb(220, 240, 255) 100%)" }}>
        <ButtonSymbolBackgroundImage additionalClassNames="size-[50px] text-[#28415c] text-[24px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Large" && state === "Idle (Platter)") {
    return (
      <div className={className || "bg-[#dde3ec] overflow-clip relative rounded-[500px] size-[52px]"} data-name="Size=Large, State=Idle (Platter)">
        <ButtonSymbolBackgroundImage additionalClassNames="size-[50px] text-[#28415c] text-[24px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Large" && state === "Idle (No Platter)") {
    return (
      <div className={className || "overflow-clip relative rounded-[500px] size-[52px]"} data-name="Size=Large, State=Idle (No Platter)">
        <ButtonSymbolBackgroundImage additionalClassNames="size-[50px] text-[#28415c] text-[24px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Standard" && state === "Disabled") {
    return (
      <div className={className || "overflow-clip relative rounded-[500px] size-[44px]"} data-name="Size=Standard, State=Disabled">
        <BackgroundImageAndText text="􀻒" additionalClassNames="size-[44px] text-[#d9d9d9] text-[19px]" />
      </div>
    );
  }
  if (size === "Standard" && state === "Selected") {
    return (
      <div className={className || "bg-[#07abde] overflow-clip relative rounded-[500px] size-[44px]"} data-name="Size=Standard, State=Selected">
        <ButtonSymbolBackgroundImage additionalClassNames="size-[44px] text-[#f6f7f9] text-[19px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Standard" && state === "Hover") {
    return (
      <div className={className || "overflow-clip relative rounded-[100px] size-[44px]"} data-name="Size=Standard, State=Hover" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 44 44\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.20000000298023224\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-1.0053e-8 -3.4571 3.4571 -1.0053e-8 22 44)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(255,255,255,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>'), linear-gradient(90deg, rgb(220, 240, 255) 0%, rgb(220, 240, 255) 100%)" }}>
        <ButtonSymbolBackgroundImage additionalClassNames="size-[44px] text-[#28415c] text-[19px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Standard" && state === "Idle (Platter)") {
    return (
      <div className={className || "bg-[#dde3ec] overflow-clip relative rounded-[500px] size-[44px]"} data-name="Size=Standard, State=Idle (Platter)">
        <ButtonSymbolBackgroundImage additionalClassNames="size-[44px] text-[#28415c] text-[19px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Standard" && state === "Idle (No Platter)") {
    return (
      <div className={className || "overflow-clip relative rounded-[500px] size-[44px]"} data-name="Size=Standard, State=Idle (No Platter)">
        <ButtonSymbolBackgroundImage additionalClassNames="size-[44px] text-[#28415c] text-[19px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Small" && state === "Disabled") {
    return (
      <div className={className || "overflow-clip relative rounded-[500px] size-[32px]"} data-name="Size=Small, State=Disabled">
        <BackgroundImageAndText text="􀻒" additionalClassNames="size-[32px] text-[#d9d9d9] text-[15px]" />
      </div>
    );
  }
  if (size === "Small" && state === "Selected") {
    return (
      <div className={className || "bg-[#07abde] overflow-clip relative rounded-[500px] size-[32px]"} data-name="Size=Small, State=Selected">
        <ButtonSymbolBackgroundImage additionalClassNames="size-[32px] text-[#f6f7f9] text-[15px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Small" && state === "Hover") {
    return (
      <div className={className || "overflow-clip relative rounded-[100px] size-[32px]"} data-name="Size=Small, State=Hover" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 32 32\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.20000000298023224\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-7.3112e-9 -2.5143 2.5143 -7.3112e-9 16 32)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(255,255,255,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>'), linear-gradient(90deg, rgb(220, 240, 255) 0%, rgb(220, 240, 255) 100%)" }}>
        <ButtonSymbolBackgroundImage additionalClassNames="size-[32px] text-[#28415c] text-[15px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Small" && state === "Idle (Platter)") {
    return (
      <div className={className || "bg-[#dde3ec] overflow-clip relative rounded-[500px] size-[32px]"} data-name="Size=Small, State=Idle (Platter)">
        <ButtonSymbolBackgroundImage additionalClassNames="size-[32px] text-[#28415c] text-[15px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Small" && state === "Idle (No Platter)") {
    return (
      <div className={className || "overflow-clip relative rounded-[500px] size-[32px]"} data-name="Size=Small, State=Idle (No Platter)">
        <ButtonSymbolBackgroundImage additionalClassNames="size-[32px] text-[#28415c] text-[15px]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Mini" && state === "Disabled") {
    return (
      <div className={className || "overflow-clip relative rounded-[500px] size-[28px]"} data-name="Size=Mini, State=Disabled">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[#d9d9d9] text-[13px] text-center top-1/2" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[22px] whitespace-pre-wrap">􀻒</p>
        </div>
      </div>
    );
  }
  if (size === "Mini" && state === "Selected") {
    return (
      <div className={className || "bg-[#07abde] overflow-clip relative rounded-[500px] size-[28px]"} data-name="Size=Mini, State=Selected">
        <BackgroundImage additionalClassNames="text-[#f6f7f9]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Mini" && state === "Hover") {
    return (
      <div className={className || "overflow-clip relative rounded-[100px] size-[28px]"} data-name="Size=Mini, State=Hover" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 28 28\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.20000000298023224\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-6.3973e-9 -2.2 2.2 -6.3973e-9 14 28)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(255,255,255,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>'), linear-gradient(90deg, rgb(220, 240, 255) 0%, rgb(220, 240, 255) 100%)" }}>
        <BackgroundImage additionalClassNames="text-[#28415c]" symbol={symbol} />
      </div>
    );
  }
  if (size === "Mini" && state === "Idle (Platter)") {
    return (
      <div className={className || "bg-[#dde3ec] overflow-clip relative rounded-[500px] size-[28px]"} data-name="Size=Mini, State=Idle (Platter)">
        <BackgroundImage additionalClassNames="text-[#28415c]" symbol={symbol} />
      </div>
    );
  }
  return (
    <div className={className || "overflow-clip relative rounded-[500px] size-[28px]"} data-name="Size=Mini, State=Idle (No Platter)">
      <BackgroundImage additionalClassNames="text-[#28415c]" symbol={symbol} />
    </div>
  );
}
type ButtonProps = {
  className?: string;
  property1?: "Default" | "Variant2" | "Variant3";
};

function Button({ className, property1 = "Default" }: ButtonProps) {
  if (property1 === "Variant2") {
    return (
      <button className={className || "block cursor-pointer relative size-[32px]"} data-name="Property 1=Variant2">
        <ButtonSymbol className="absolute inset-0 overflow-clip rounded-[100px]" size="Small" state="Hover" symbol="􀱋" />
      </button>
    );
  }
  if (property1 === "Variant3") {
    return (
      <button className={className || "block cursor-pointer relative size-[32px]"} data-name="Property 1=Variant3">
        <div className="absolute bg-[#07abde] inset-0 overflow-clip rounded-[500px]" data-name="Button - Symbol">
          <BackgroundImageAndText text="􀱋" additionalClassNames="size-[32px] text-[#f6f7f9] text-[15px]" />
        </div>
      </button>
    );
  }
  return (
    <div className={className || "relative size-[32px]"} data-name="Property 1=Default">
      <ButtonSymbol className="absolute inset-0 overflow-clip rounded-[500px]" size="Small" symbol="􀱋" />
    </div>
  );
}

export default function Lead() {
  return (
    <div className="relative size-full" data-name="Lead">
      <div className="absolute bg-white h-[785px] left-0 rounded-[15px] top-0 w-[1093px]" data-name="Lead Background" />
      <div className="absolute bg-[#f6f7f9] left-[976px] rounded-[100px] top-[22px]" data-name="Menu de ações - Tabela/Default">
        <div className="content-stretch flex gap-[10px] items-start px-[10px] relative">
          <Button className="relative shrink-0 size-[32px]" />
          <div className="relative shrink-0 size-[32px]" data-name="Button - 􀏟">
            <div className="absolute inset-0 overflow-clip rounded-[500px]" data-name="Button - Symbol">
              <BackgroundImageAndText text="􀆄" additionalClassNames="size-[32px] text-[#28415c] text-[15px]" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute left-[10px] rounded-[100px] top-[11px] w-[246px]" data-name="H1 Pipes">
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex gap-[10px] items-center p-[12px] relative w-full">
            <div className="bg-[#feedca] overflow-clip relative rounded-[8px] shrink-0 size-[31px]" data-name="Button - Symbol">
              <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Medium',sans-serif] font-[450] justify-center leading-[0] left-1/2 size-[32px] text-[#eac23d] text-[16px] text-center top-1/2 tracking-[-0.0373px]" style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss02', 'ss03', 'ss07', 'ss09', 'cv03', 'cv04', 'cv06', 'cv07', 'cv10', 'cv12'" }}>
                <p className="leading-[normal] whitespace-pre-wrap">􀊴</p>
              </div>
            </div>
            <div className="content-stretch flex flex-col h-[30px] items-start justify-end relative shrink-0 w-[167px]">
              <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] h-[8px] justify-center leading-[0] not-italic relative shrink-0 text-[#64676c] text-[10px] tracking-[0.5px] uppercase w-[150px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                <p className="leading-[20px] whitespace-pre-wrap">PIPES</p>
              </div>
              <div className="content-stretch flex h-[20px] items-center relative shrink-0 w-[157px]">
                <p className="font-['DM_Sans:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#28415c] text-[19px] tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                  Leads
                </p>
                <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
                  <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[#28415c] text-[17px] text-center top-1/2" style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
                    <p className="leading-[22px] whitespace-pre-wrap">􀆈</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LeadBackgroundImageAndText text="Acesso" additionalClassNames="text-[20px] top-[119px]" />
      <LeadBackgroundImageAndText text="Permissões" additionalClassNames="text-[20px] top-[236px]" />
      <LeadBackgroundImageAndText1 text="Pessoal" additionalClassNames="left-[295px] top-[188.5px]" />
      <LeadBackgroundImageAndText text="Quem pode ver esse Pipe" additionalClassNames="text-[15px] top-[155px]" />
      <div className="-translate-y-1/2 absolute flex flex-col font-['DM_Sans:Medium',sans-serif] justify-center leading-[0] left-[295px] not-italic text-[#28415c] text-[15px] top-[283px] tracking-[-0.5px] whitespace-nowrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        <p className="leading-[22px]">{`Quem pode `}</p>
      </div>
      <LeadBackgroundImageAndText1 text="Público" additionalClassNames="left-[434px] top-[189.5px]" />
      <div className="absolute backdrop-blur-[50px] bg-[#28415c] h-[36px] left-[19px] rounded-[100px] top-[101px]" data-name="Tab 1">
        <div aria-hidden="true" className="absolute border-0 border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[100px] shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)]" />
        <div className="flex flex-row items-center size-full">
          <LeadBackgroundImage text="􀍟" text1="Configurações do Pipe" additionalClassNames="h-full text-[#f6f7f9]" />
        </div>
      </div>
      <div className="absolute h-[36px] left-[19px] rounded-[100px] top-[352px] w-[227px]" data-name="Tab 2">
        <div className="flex flex-row items-center size-full">
          <LeadBackgroundImage text="􀅴" text1="Detalhes do Pipe" additionalClassNames="size-full text-[#4e6987]" />
        </div>
      </div>
      <div className="absolute h-[36px] left-[19px] rounded-[100px] top-[316px] w-[227px]" data-name="Tab 3">
        <div className="flex flex-row items-center size-full">
          <LeadBackgroundImage text="􀋙" text1="Notificações" additionalClassNames="size-full text-[#4e6987]" />
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col gap-[8px] items-start left-[48px] top-[145px]">
        <BackgroundImage8 additionalClassNames="bg-[#dde3ec]">
          <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic overflow-hidden relative shrink-0 text-[#28415c] text-[15px] text-ellipsis tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
            Privacidade
          </p>
        </BackgroundImage8>
        <Frame233TabBackgroundImageAndText text="Participantes" />
        <BackgroundImage7>{`Regras de Qualificação `}</BackgroundImage7>
        <Frame233TabBackgroundImageAndText text="Editar Visualizações" />
      </div>
      <div className="absolute bottom-[472px] flex h-[168px] items-center justify-center right-[1071px] w-0" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="-rotate-90 flex-none">
          <div className="h-0 relative w-[168px]" data-name="Divider">
            <div className="absolute inset-[-0.75px_-0.45%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 169.5 1.50023">
                <path d={svgPaths.pb5deb00} id="Divider" stroke="var(--stroke-0, #DDE3EC)" strokeLinecap="square" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <button className="absolute backdrop-blur-[50px] bg-[#3ccea7] cursor-pointer h-[19px] left-[490px] rounded-[100px] top-[180px] w-[34px]" data-name="Toggle">
        <div className="flex flex-row items-center justify-end overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex items-center justify-end px-[2px] py-[4px] relative size-full">
            <KnobBackgroundImage />
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_2px_3px_0px_rgba(0,0,0,0.25)]" />
        <div aria-hidden="true" className="absolute border-0 border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[100px]" />
      </button>
      <button className="absolute backdrop-blur-[50px] bg-[#dde3ec] cursor-pointer h-[19px] left-[351px] rounded-[100px] top-[180px] w-[34px]" data-name="Toggle">
        <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex items-center px-[2px] py-[4px] relative size-full">
            <KnobBackgroundImage />
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_2px_3px_0px_rgba(0,0,0,0.25)]" />
        <div aria-hidden="true" className="absolute border-0 border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[100px]" />
      </button>
      <div className="absolute content-stretch flex flex-col gap-[10px] items-start left-[295px] top-[306px]">
        <BackgroundImage9>
          <line id="Line 2" stroke="var(--stroke-0, #DDE3EC)" strokeWidth="1.5" x2="757" y1="0.75" y2="0.75" />
        </BackgroundImage9>
        <div className="content-stretch flex gap-[25px] items-center relative shrink-0">
          <BackgroundImageAndText2 text="Modificar Configurações do Pipe" additionalClassNames="w-[212px]" />
          <BackgroundImageAndText1 text="Todos da Organização" />
          <BackgroundImage2 />
          <BackgroundImage3 />
        </div>
        <ButtonSymbol className="overflow-clip relative rounded-[500px] shrink-0 size-[32px]" size="Small" symbol="􀉯" />
        <Frame220BackgroundImage />
        <div className="content-stretch flex gap-[31px] items-center relative shrink-0">
          <BackgroundImageAndText2 text="Modificar Visualizações" additionalClassNames="w-[210px]" />
          <BackgroundImage4 />
        </div>
        <Frame220BackgroundImage />
        <div className="content-stretch flex gap-[29px] items-center relative shrink-0">
          <BackgroundImageAndText2 text="Adicionar Visualizações" additionalClassNames="w-[212px]" />
          <div className="content-stretch flex gap-[25px] items-center relative shrink-0">
            <BackgroundImage5 />
            <BackgroundImage2 />
            <BackgroundImage6 />
          </div>
        </div>
        <Frame220BackgroundImage />
        <div className="content-stretch flex gap-[15px] items-center relative shrink-0">
          <BackgroundImageAndText2 text="Exportar Pipe para Google Sheets" additionalClassNames="w-[226px]" />
          <div className="content-stretch flex gap-[25px] items-center relative shrink-0">
            <BackgroundImage5 />
            <BackgroundImage2 />
            <BackgroundImage6 />
          </div>
        </div>
        <Frame220BackgroundImage />
        <div className="content-stretch flex gap-[41px] items-center relative shrink-0">
          <BackgroundImageAndText2 text="Modificar estágios do Pipe" additionalClassNames="w-[200px]" />
          <BackgroundImage4 />
        </div>
        <Frame220BackgroundImage />
        <div className="content-stretch flex gap-[99px] items-center relative shrink-0">
          <BackgroundImageAndText2 text="Adicionar Participantes" additionalClassNames="w-[142px]" />
          <BackgroundImage4 />
        </div>
        <Frame220BackgroundImage />
        <div className="content-stretch flex gap-[82px] items-center relative shrink-0">
          <BackgroundImageAndText2 text="Editar Regras de Qualificação" additionalClassNames="w-[159px]" />
          <BackgroundImage4 />
        </div>
        <Frame220BackgroundImage />
        <div className="content-stretch flex gap-[122px] items-center relative shrink-0">
          <BackgroundImageAndText2 text="Excluir o Pipe" additionalClassNames="w-[119px]" />
          <BackgroundImage4 />
        </div>
      </div>
      <div className="absolute h-0 left-0 top-[79.06px] w-[1096px]">
        <div className="absolute inset-[-1.5px_0_0_0]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1096 1.5">
            <line id="Line 1" stroke="var(--stroke-0, #DDE3EC)" strokeWidth="1.5" x2="1096" y1="0.75" y2="0.75" />
          </svg>
        </div>
      </div>
    </div>
  );
}
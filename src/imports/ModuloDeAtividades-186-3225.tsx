import clsx from "clsx";
import svgPaths from "./svg-hoj76imkko";
import imgEllipse15 from "figma:asset/0ffbbca174936fd7c6afd0b3813897da11c8d8ab.png";
import imgAvatars3DAvatar12 from "figma:asset/eaa320717b7e77fd08d1bdaf9802cc375eb36366.png";
import imgRectangle57 from "figma:asset/836345ebdad668ec42a90a3a5da64e74b06fdb35.png";
import { imgAtividades } from "./svg-lc1vb";

function BackgroundImage13({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
      <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
      <div className="col-1 h-[29px] ml-[6px] mt-[22px] relative row-1 w-[114px]">
        <BackgroundImageAndText5 text="Sim" additionalClassNames="left-[3px] top-[26px] w-[83px]" />
      </div>
      <div className="col-1 content-stretch flex h-[10px] items-center ml-0 mt-0 relative row-1 w-[126px]">{children}</div>
    </div>
  );
}

function BackgroundImage12({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ fontVariationSettings: "'wdth' 100" }} className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] relative shrink-0 text-[#28415c] text-[12px] text-center whitespace-nowrap">
      <p className="leading-[24px]">{children}</p>
    </div>
  );
}

function BackgroundImage11({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }} className="flex flex-col font-['DM_Sans:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#28415c] text-[10px] text-center tracking-[0.5px] uppercase whitespace-nowrap">
      <p className="leading-[20px]">{children}</p>
    </div>
  );
}

function BackgroundImage10({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }} className="flex flex-col font-['DM_Sans:Medium',sans-serif] justify-center not-italic relative shrink-0 text-[15px] tracking-[-0.5px]">
      <p className="leading-[22px]">{children}</p>
    </div>
  );
}

function BackgroundImage9({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }} className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[#28415c] text-[17px] text-center top-1/2">
      <p className="leading-[22px] whitespace-pre-wrap">{children}</p>
    </div>
  );
}

function BackgroundImage8({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="absolute inset-[8.9%_0_80.67%_0]">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[20px] items-center p-[20px] relative size-full">{children}</div>
      </div>
    </div>
  );
}

function ModuloDeAtividadesButtonSymbolBackgroundImage1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]">
      <BackgroundImage9>{children}</BackgroundImage9>
    </div>
  );
}

function ModuloDeAtividadesButtonSymbolBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <button className="block cursor-pointer overflow-clip relative rounded-[500px] shrink-0 size-[28px]">
      <BackgroundImage9>{children}</BackgroundImage9>
    </button>
  );
}

function BackgroundImage7({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative rounded-[8px] shrink-0 w-[303px]">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[4px] items-center px-[12px] py-[6px] relative w-full">{children}</div>
      </div>
    </div>
  );
}

function BackgroundImage6({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="absolute bg-[#dcf0ff] inset-[91.87%_21.24%_3.22%_21.24%] rounded-[500px]">
      <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex gap-[4px] items-center justify-center leading-[0] px-[12px] relative size-full text-[#28415c] text-center whitespace-nowrap">{children}</div>
      </div>
    </div>
  );
}
type RegularSBackgroundImageProps = {
  additionalClassNames?: string;
};

function RegularSBackgroundImage({ children, additionalClassNames = "" }: React.PropsWithChildren<RegularSBackgroundImageProps>) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.0627 7.0627">
        <g id="Regular-S">{children}</g>
      </svg>
    </div>
  );
}

function BackgroundImage5() {
  return (
    <div className="absolute content-stretch flex h-[12px] items-center left-0 top-[26px] w-[106px]">
      <div className="overflow-clip relative shrink-0 size-[14px]" data-name="arrow.both 1">
        <div className="absolute contents inset-0" data-name="Camada 1">
          <BackgroundImage4 />
          <div className="absolute inset-[9.36%_16.77%_9.37%_16.77%]" data-name="Regular-S">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.3038 11.3776">
              <g id="Regular-S">
                <path d={svgPaths.p10547f00} fill="var(--fill-0, #EAC23D)" id="Vector" />
              </g>
            </svg>
          </div>
        </div>
      </div>
      <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#eac23d] text-[8px] tracking-[0.5px] uppercase" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>{` na média`}</p>
    </div>
  );
}

function BackgroundImage4() {
  return (
    <svg fill="none" preserveAspectRatio="none" viewBox="0 0 14 14" className="absolute block size-full">
      <g id="Camada 1-2">
        <g id="Vector" />
      </g>
    </svg>
  );
}
type BackgroundImageAndText5Props = {
  text: string;
  additionalClassNames?: string;
};

function BackgroundImageAndText5({ text, additionalClassNames = "" }: BackgroundImageAndText5Props) {
  return (
    <div style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }} className={clsx("-translate-y-full absolute flex flex-col font-['DM_Sans:Medium',sans-serif] justify-end leading-[0] not-italic text-[#4e6987] text-[15px] tracking-[-0.5px]", additionalClassNames)}>
      <p className="leading-[22px] whitespace-pre-wrap">{text}</p>
    </div>
  );
}
type ModuloDeAtividadesBackgroundImage1Props = {
  text: string;
  text1: string;
};

function ModuloDeAtividadesBackgroundImage1({ text, text1 }: ModuloDeAtividadesBackgroundImage1Props) {
  return (
    <div className="col-1 h-[41px] ml-[6px] mt-[16px] relative row-1 w-[114px]">
      <BackgroundImageAndText5 text={text} additionalClassNames="left-[3px] top-[26px] w-[83px]" />
      <div className="absolute content-stretch flex h-[12px] items-center left-0 top-[26px] w-[106px]">
        <div className="overflow-clip relative shrink-0 size-[14px]" data-name="arrow.down">
          <div className="absolute contents inset-0" data-name="Camada 1">
            <BackgroundImage4 />
            <RegularSBackgroundImage additionalClassNames="inset-[24.78%_24.78%_24.77%_24.77%]">
              <path d={svgPaths.p226d5e80} fill="var(--fill-0, #FF8C76)" id="Vector" />
            </RegularSBackgroundImage>
          </div>
        </div>
        <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#ff8c76] text-[8px] tracking-[0.5px] uppercase" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
          {text1}
        </p>
      </div>
    </div>
  );
}
type ModuloDeAtividadesButtonTextBackgroundImageProps = {
  text: string;
  text1: string;
};

function ModuloDeAtividadesButtonTextBackgroundImage({ text, text1 }: ModuloDeAtividadesButtonTextBackgroundImageProps) {
  return (
    <BackgroundImage6>
      <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center relative shrink-0 text-[16px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[22px]">{text}</p>
      </div>
      <BackgroundImage10>{text1}</BackgroundImage10>
    </BackgroundImage6>
  );
}
type BackgroundImage3Props = {
  text: string;
  text1: string;
};

function BackgroundImage3({ text, text1 }: BackgroundImage3Props) {
  return (
    <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
      <div className="content-stretch flex items-center justify-center pl-[18px] pr-[17px] relative size-full">
        <BackgroundImage11>{text}</BackgroundImage11>
        <HighlightFrameBackgroundImage />
        <BackgroundImage12>{text1}</BackgroundImage12>
      </div>
    </div>
  );
}
type ModuloDeAtividadesButtonSymbolBackgroundImageAndText1Props = {
  text: string;
  additionalClassNames?: string;
};

function ModuloDeAtividadesButtonSymbolBackgroundImageAndText1({ text, additionalClassNames = "" }: ModuloDeAtividadesButtonSymbolBackgroundImageAndText1Props) {
  return (
    <div className={clsx("absolute bg-[#f6f7f9] overflow-clip rounded-[500px]", additionalClassNames)}>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['DM_Sans:Medium',sans-serif] justify-center leading-[0] left-1/2 not-italic size-[50px] text-[#4e6987] text-[24px] text-center top-1/2" style={{ fontFeatureSettings: "'ss07'" }}>
        <p className="leading-[22px] whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}
type BackgroundImage2Props = {
  additionalClassNames?: string;
};

function BackgroundImage2({ additionalClassNames = "" }: BackgroundImage2Props) {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <BackgroundImageAndText2 text="􀆊" additionalClassNames="shrink-0" />
      <BackgroundImage1 text="+55 98899-8899" text1="04/07/2023 09:30" />
      <div className="bg-[rgba(255,255,255,0)] h-[20px] shrink-0 w-[52px]" />
      <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
        <BackgroundImageAndText1 text="􀍀" additionalClassNames="text-[#28415c]" />
      </div>
    </div>
  );
}
type BackgroundImageAndText4Props = {
  text: string;
};

function BackgroundImageAndText4({ text }: BackgroundImageAndText4Props) {
  return (
    <div style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }} className="flex flex-col font-['DM_Sans:Bold',sans-serif] h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#98989d] text-[10px] tracking-[0.5px] uppercase w-[112px]">
      <p className="leading-[20px] whitespace-pre-wrap">{text}</p>
    </div>
  );
}
type BackgroundImage1Props = {
  text: string;
  text1: string;
};

function BackgroundImage1({ text, text1 }: BackgroundImage1Props) {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <div className="content-stretch flex items-start relative shrink-0" data-name="Picture">
        <div className="content-stretch flex items-end relative shrink-0">
          <ModuloDeAtividadesBackgroundImage />
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[10px] h-[34px] items-start not-italic relative shrink-0 text-[#4e6987]">
        <p className="font-['DM_Sans:Medium',sans-serif] h-[14px] leading-[17px] relative shrink-0 text-[12px] tracking-[-0.5px] w-[90px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
          {text}
        </p>
        <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] h-[10px] justify-end leading-[0] relative shrink-0 text-[8px] tracking-[0.5px] uppercase w-[102px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
          <p className="leading-[20px] whitespace-pre-wrap">{text1}</p>
        </div>
      </div>
    </div>
  );
}

function SegmentedControlBackgroundImage() {
  return (
    <div className="absolute bg-[#f6f7f9] inset-[2.15%_4.9%_91.1%_4.9%] rounded-[100px]">
      <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex gap-[4px] items-center justify-center p-[4px] relative size-full">
          <div className="backdrop-blur-[50px] bg-[#28415c] flex-[1_0_0] h-[36px] min-h-px min-w-px relative rounded-[20px]" data-name="Button 1">
            <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
              <BackgroundImage text="􀺿" text1="feed" additionalClassNames="text-[#f6f7f9]" />
            </div>
            <div aria-hidden="true" className="absolute border-[0.5px] border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[20px] shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)]" />
          </div>
          <button className="cursor-pointer flex-[1_0_0] h-[36px] min-h-px min-w-px relative rounded-[100px]" data-name="Button 2">
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[100px]">
              <div className="absolute bg-[rgba(255,255,255,0.06)] inset-0 mix-blend-lighten rounded-[100px]" />
              <div className="absolute bg-[rgba(94,94,94,0.18)] inset-0 mix-blend-color-dodge rounded-[100px]" />
              <div className="absolute inset-0 rounded-[100px]" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 88 36\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(0.043565 -3.6 8.8 0.067235 44 36)\\'><stop stop-color=\\'rgba(255,255,255,0.12)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(255,255,255,0)\\' offset=\\'0.66667\\'/></radialGradient></defs></svg>')" }} />
              <div className="absolute inset-0 mix-blend-color-dodge rounded-[100px]" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 88 36\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(0.043564 -3.6 8.8936 0.067949 44 36)\\'><stop stop-color=\\'rgba(94,94,94,0.32)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(94,94,94,0)\\' offset=\\'0.73847\\'/></radialGradient></defs></svg>')" }} />
            </div>
            <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
              <BackgroundImage text="􁃪" text1="engajamento" additionalClassNames="text-[#98989d]" />
            </div>
          </button>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.3),inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.25),inset_1px_1.5px_4px_0px_rgba(0,0,0,0.08),inset_1px_1.5px_4px_0px_rgba(0,0,0,0.1)]" />
    </div>
  );
}
type BackgroundImageProps = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function BackgroundImage({ text, text1, additionalClassNames = "" }: BackgroundImageProps) {
  return (
    <div className={clsx("content-stretch flex gap-[3px] items-center justify-center leading-[0] px-[8px] relative size-full text-center text-ellipsis whitespace-nowrap", additionalClassNames)}>
      <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center overflow-hidden relative shrink-0 text-[15px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[20px] overflow-hidden">{text}</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] justify-center not-italic overflow-hidden relative shrink-0 text-[10px] tracking-[0.5px] uppercase" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        <p className="leading-[20px] overflow-hidden">{text1}</p>
      </div>
    </div>
  );
}
type ActivityBackgroundImage5Props = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function ActivityBackgroundImage5({ text, text1, additionalClassNames = "" }: ActivityBackgroundImage5Props) {
  return (
    <BackgroundImage7>
      <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
        <BackgroundImageAndText1 text="􀆊" additionalClassNames="text-[#4e6987]" />
      </div>
      <div className="bg-[#dde3ec] overflow-clip relative rounded-[8px] shrink-0 size-[28px]" data-name="Button - Symbol">
        <BackgroundImageAndText1 text="􀍕" additionalClassNames="text-[#4e6987]" />
      </div>
      <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[15px] tracking-[-0.5px] w-[110px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        {text}
      </p>
      <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#4e6987] text-[10px] text-right tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        {text1}
      </p>
    </BackgroundImage7>
  );
}
type ActivityBackgroundImage4Props = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function ActivityBackgroundImage4({ text, text1, additionalClassNames = "" }: ActivityBackgroundImage4Props) {
  return (
    <BackgroundImage7>
      <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
        <BackgroundImageAndText1 text="􀆊" additionalClassNames="text-[#4e6987]" />
      </div>
      <ModuloDeAtividadesButtonSymbolBackgroundImageAndText text="􀌤" />
      <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[15px] tracking-[-0.5px] w-[110px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        {text}
      </p>
      <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#4e6987] text-[10px] text-right tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        {text1}
      </p>
    </BackgroundImage7>
  );
}
type ActivityBackgroundImage3Props = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function ActivityBackgroundImage3({ text, text1, additionalClassNames = "" }: ActivityBackgroundImage3Props) {
  return (
    <BackgroundImage7>
      <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
        <BackgroundImageAndText1 text="􀆊" additionalClassNames="text-[#4e6987]" />
      </div>
      <div className="bg-[#feedca] overflow-clip relative rounded-[8px] shrink-0 size-[28px]" data-name="Button - Symbol">
        <BackgroundImageAndText1 text="􀻡" additionalClassNames="text-[#eac23d]" />
      </div>
      <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[15px] tracking-[-0.5px] w-[110px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        {text}
      </p>
      <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#4e6987] text-[10px] text-right tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        {text1}
      </p>
    </BackgroundImage7>
  );
}
type ActivityBackgroundImage2Props = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function ActivityBackgroundImage2({ text, text1, additionalClassNames = "" }: ActivityBackgroundImage2Props) {
  return (
    <BackgroundImage7>
      <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
        <BackgroundImageAndText1 text="􀆊" additionalClassNames="text-[#4e6987]" />
      </div>
      <div className="bg-[#d9f8ef] overflow-clip relative rounded-[8px] shrink-0 size-[28px]" data-name="Button - Symbol">
        <BackgroundImageAndText1 text="􀌾" additionalClassNames="text-[#3ccea7]" />
      </div>
      <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[15px] tracking-[-0.5px] w-[110px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        {text}
      </p>
      <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#4e6987] text-[10px] text-right tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        {text1}
      </p>
    </BackgroundImage7>
  );
}
type ActivityBackgroundImage1Props = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function ActivityBackgroundImage1({ text, text1, additionalClassNames = "" }: ActivityBackgroundImage1Props) {
  return (
    <BackgroundImage7>
      <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
        <BackgroundImageAndText1 text="􀆊" additionalClassNames="text-[#4e6987]" />
      </div>
      <div className="bg-[#e8e8fd] overflow-clip relative rounded-[8px] shrink-0 size-[28px]" data-name="Button - Symbol">
        <BackgroundImageAndText1 text="􀁢" additionalClassNames="text-[#8c8cd4]" />
      </div>
      <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[15px] tracking-[-0.5px] w-[110px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        {text}
      </p>
      <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#4e6987] text-[10px] text-right tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        {text1}
      </p>
    </BackgroundImage7>
  );
}
type ActivityBackgroundImageProps = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function ActivityBackgroundImage({ text, text1, additionalClassNames = "" }: ActivityBackgroundImageProps) {
  return (
    <BackgroundImage7>
      <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
        <BackgroundImageAndText1 text="􀆊" additionalClassNames="text-[#4e6987]" />
      </div>
      <div className="bg-[#ffedeb] overflow-clip relative rounded-[8px] shrink-0 size-[28px]" data-name="Button - Symbol">
        <BackgroundImageAndText1 text="􀉉" additionalClassNames="text-[#ff8c76]" />
      </div>
      <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[15px] tracking-[-0.5px] w-[110px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        {text}
      </p>
      <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#4e6987] text-[10px] text-right tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        {text1}
      </p>
    </BackgroundImage7>
  );
}
type ModuloDeAtividadesBackgroundImageAndTextProps = {
  text: string;
  additionalClassNames?: string;
};

function ModuloDeAtividadesBackgroundImageAndText({ text, additionalClassNames = "" }: ModuloDeAtividadesBackgroundImageAndTextProps) {
  return (
    <div style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }} className={clsx("col-1 flex flex-col font-['DM_Sans:Medium',sans-serif] h-[15px] justify-center mt-[10px] not-italic relative row-1 text-[#28415c] text-[12px] tracking-[-0.5px]", additionalClassNames)}>
      <p className="leading-[17px] whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function ModuloDeAtividadesBackgroundImage() {
  return (
    <div className="relative shrink-0 size-[35px]">
      <img alt="" className="absolute block max-w-none size-full" height="35" src={imgEllipse15} width="35" />
    </div>
  );
}
type BackgroundImageAndText3Props = {
  text: string;
  additionalClassNames?: string;
};

function BackgroundImageAndText3({ text, additionalClassNames = "" }: BackgroundImageAndText3Props) {
  return (
    <div style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }} className={additionalClassNames}>
      <p className="leading-[22px] whitespace-pre-wrap">{text}</p>
    </div>
  );
}
type BackgroundImageAndText2Props = {
  text: string;
  additionalClassNames?: string;
};

function BackgroundImageAndText2({ text, additionalClassNames = "" }: BackgroundImageAndText2Props) {
  return <BackgroundImageAndText3 text={text} additionalClassNames={clsx("flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] relative size-[13px] text-[#4e6987] text-[12px] text-center", additionalClassNames)} />;
}
type BackgroundImageAndText1Props = {
  text: string;
  additionalClassNames?: string;
};

function BackgroundImageAndText1({ text, additionalClassNames = "" }: BackgroundImageAndText1Props) {
  return <BackgroundImageAndText3 text={text} additionalClassNames={clsx("-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[17px] text-center top-1/2", additionalClassNames)} />;
}
type ModuloDeAtividadesButtonSymbolBackgroundImageAndTextProps = {
  text: string;
};

function ModuloDeAtividadesButtonSymbolBackgroundImageAndText({ text }: ModuloDeAtividadesButtonSymbolBackgroundImageAndTextProps) {
  return (
    <div className="bg-[#dcf0ff] overflow-clip relative rounded-[8px] shrink-0 size-[28px]">
      <BackgroundImageAndText1 text={text} additionalClassNames="text-[#07abde]" />
    </div>
  );
}

function HighlightFrameBackgroundImage() {
  return (
    <div className="h-full relative shrink-0 w-[5px]">
      <div className="absolute h-[64px] left-[-52px] top-0 w-[90px]" data-name="Highlight">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 90 64">
          <g id="Highlight">
            <ellipse cx="45" cy="32" fill="url(#paint0_radial_34_4166)" rx="45" ry="32" />
            <ellipse cx="45" cy="32" fill="url(#paint1_radial_34_4166)" rx="45" ry="32" style={{ mixBlendMode: "color-dodge" }} />
          </g>
          <defs>
            <radialGradient cx="0" cy="0" gradientTransform="translate(45 32) rotate(90) scale(32 45)" gradientUnits="userSpaceOnUse" id="paint0_radial_34_4166" r="1">
              <stop stopColor="white" stopOpacity="0.07" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <radialGradient cx="0" cy="0" gradientTransform="translate(45 32) rotate(90) scale(32 45)" gradientUnits="userSpaceOnUse" id="paint1_radial_34_4166" r="1">
              <stop stopColor="#5E5E5E" stopOpacity="0.14" />
              <stop offset="1" stopColor="#5E5E5E" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
type BackgroundImageAndTextProps = {
  text: string;
  additionalClassNames?: string;
};

function BackgroundImageAndText({ text, additionalClassNames = "" }: BackgroundImageAndTextProps) {
  return (
    <div style={{ fontVariationSettings: "'wdth' 100" }} className={clsx("-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-center top-1/2", additionalClassNames)}>
      <p className="leading-[22px] whitespace-pre-wrap">{text}</p>
    </div>
  );
}
type ButtonSymbolBackgroundImageAndTextProps = {
  text: string;
};

function ButtonSymbolBackgroundImageAndText({ text }: ButtonSymbolBackgroundImageAndTextProps) {
  return (
    <div style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 28 28\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.20000000298023224\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-6.3973e-9 -2.2 2.2 -6.3973e-9 14 28)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(255,255,255,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>'), linear-gradient(90deg, rgb(7, 171, 222) 0%, rgb(7, 171, 222) 100%)" }} className="absolute left-[210px] overflow-clip rounded-[500px] size-[28px] top-[20px]">
      <BackgroundImageAndText text={text} additionalClassNames="text-[#f6f7f9] text-[13px]" />
    </div>
  );
}
type FrameProps = {
  className?: string;
  atividades?: "Default" | "Hover";
  ligacoes?: "Default";
  mensagens?: "Default" | "Pesquisa";
  resumoDeAtividades?: "Default";
};

function Frame({ className, atividades = "Default", ligacoes = "", mensagens = "", resumoDeAtividades = "" }: FrameProps) {
  const isDefault = resumoDeAtividades === "Default";
  const isDefault1 = mensagens === "Default";
  const isDefault2 = ligacoes === "Default";
  const isDefault3 = atividades === "Default";
  const isHover = atividades === "Hover";
  const isPesquisa = mensagens === "Pesquisa";
  return (
    <div className={className || "relative"}>
      <div className={isPesquisa ? "absolute bg-[#dde3ec] h-[28px] left-[20px] rounded-[100px] top-[20px] w-[218px]" : "flex flex-row items-center size-full"}>
        <div className={isPesquisa ? "absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.3),inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.25),inset_0px_1.5px_4px_0px_rgba(0,0,0,0.08),inset_0px_1.5px_4px_0px_rgba(0,0,0,0.1)]" : "content-stretch flex gap-[20px] items-center p-[20px] relative size-full"}>
          {(isDefault3 || isDefault1 || isDefault2 || isHover || isDefault) && (
            <>
              <div className={`content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0 ${isDefault ? "w-[218px]" : isHover ? "bg-[#f6f7f9] w-[170px]" : "w-[170px]"}`}>
                {(isDefault3 || isDefault1 || isDefault2 || isHover) && (
                  <>
                    <div className={`overflow-clip relative rounded-[8px] shrink-0 size-[28px] ${isDefault2 ? "bg-[#d9f8ef]" : isDefault1 ? "bg-[#dcf0ff]" : "bg-[#dde3ec]"}`} data-name="Button - Symbol">
                      <div className={`-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-["SF_Pro:Semibold",sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-center top-1/2 ${isHover ? "text-[#28415c] text-[13px]" : isDefault2 ? "text-[#3ccea7] text-[17px]" : isDefault1 ? "text-[#07abde] text-[17px]" : "text-[#4e6987] text-[17px]"}`} style={isHover ? { fontVariationSettings: "'wdth' 100" } : { fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
                        <p className="leading-[22px] whitespace-pre-wrap">{isDefault2 ? "􀌾" : isDefault1 ? "􀌤" : isHover ? "􀣔" : "􀣔"}</p>
                      </div>
                    </div>
                    <div className="h-[20px] shrink-0 w-[6px]" />
                  </>
                )}
                <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[18px] tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                  {isDefault ? "Resumo de atividades" : isDefault2 ? "Ligações" : isDefault1 ? "Mensagens" : isHover ? "Atividades" : "Atividades"}
                </p>
                {(isDefault3 || isDefault1 || isDefault2 || isHover) && (
                  <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
                    <div className={`-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-["SF_Pro:Semibold",sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-center top-1/2 ${isHover ? "text-[#28415c] text-[13px]" : "text-[#4e6987] text-[17px]"}`} style={isHover ? { fontVariationSettings: "'wdth' 100" } : { fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
                      <p className="leading-[22px] whitespace-pre-wrap">􀆈</p>
                    </div>
                  </div>
                )}
                {isDefault && <div className="overflow-clip rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol" />}
              </div>
              <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
                <div className={`-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-["SF_Pro:Semibold",sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[#28415c] text-center top-1/2 ${isHover ? "text-[13px]" : "text-[17px]"}`} style={isHover ? { fontVariationSettings: "'wdth' 100" } : { fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
                  <p className="leading-[22px] whitespace-pre-wrap">{isDefault1 || isDefault2 ? "􀊫" : isHover || isDefault ? "􀜓" : "􀜓"}</p>
                </div>
              </div>
            </>
          )}
          {(isDefault3 || isDefault1 || isDefault2 || isHover) && (
            <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
              <div className={`-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-["SF_Pro:Semibold",sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[#28415c] text-center top-1/2 ${isHover ? "text-[13px]" : "text-[17px]"}`} style={isHover ? { fontVariationSettings: "'wdth' 100" } : { fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
                <p className="leading-[22px] whitespace-pre-wrap">{isDefault1 || isDefault2 ? "􀜓" : isHover ? "􀆏" : "􀆏"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {isPesquisa && (
        <>
          <ButtonSymbolBackgroundImageAndText text="􀊫" />
          <div className="absolute left-[258px] overflow-clip rounded-[500px] size-[28px] top-[20px]" data-name="Button - Symbol">
            <BackgroundImageAndText text="􀜓" additionalClassNames="text-[#28415c] text-[13px]" />
          </div>
          <p className="absolute font-['DM_Sans:Medium',sans-serif] leading-[17px] left-[37px] not-italic text-[#4e6987] text-[12px] top-[25px] tracking-[-0.5px] w-[145px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
            Pesquisar em mensagens
          </p>
        </>
      )}
    </div>
  );
}
type DropDownButtonProps = {
  className?: string;
  label?: string;
  state?: "Idle (No Platter)" | "Hover" | "Selected" | "Disabled";
};

function DropDownButton({ className, label = "Label", state = "Idle (No Platter)" }: DropDownButtonProps) {
  const isDisabledOrSelectedOrIdleNoPlatter = ["Disabled", "Selected", "Idle (No Platter)"].includes(state);
  const isHover = state === "Hover";
  return (
    <div className={className || `h-[32px] relative rounded-[100px] ${state === "Idle (No Platter)" ? "" : isHover ? "bg-[#f6f7f9]" : state === "Selected" ? "bg-[#dcf0ff] shadow-[0px_3px_5px_0px_rgba(0,0,0,0.12)]" : "bg-[#dde3ec]"}`}>
      <div className="flex flex-row items-center justify-center size-full">
        <div className={`content-stretch flex h-full items-center justify-center overflow-clip pl-[18px] pr-[17px] relative ${isHover ? "" : ["Selected", "Idle (No Platter)"].includes(state) ? "gap-[5px] leading-[0] text-[#28415c] text-center whitespace-nowrap" : "gap-[5px] leading-[0] text-[#98989d] text-center whitespace-nowrap"}`}>
          {isDisabledOrSelectedOrIdleNoPlatter && (
            <>
              <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] justify-center not-italic relative shrink-0 text-[10px] tracking-[0.5px] uppercase" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                <p className="leading-[20px]">{label}</p>
              </div>
              <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center relative shrink-0 text-[12px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                <p className="leading-[24px]">􀆈</p>
              </div>
            </>
          )}
          {isHover && (
            <>
              <BackgroundImage11>{label}</BackgroundImage11>
              <HighlightFrameBackgroundImage />
              <BackgroundImage12>􀆈</BackgroundImage12>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
type ModuloDeAtividadesProps = {
  className?: string;
  property1?: "Default" | "Variant2" | "Variant3" | "Variant4" | "Variant5" | "Variant6" | "Variant7" | "Variant8";
};

function ModuloDeAtividades({ className, property1 = "Default" }: ModuloDeAtividadesProps) {
  const isDefault = property1 === "Default";
  const isDefaultOrVariant7 = ["Default", "Variant7"].includes(property1);
  const isVariant2 = property1 === "Variant2";
  const isVariant3 = property1 === "Variant3";
  const isVariant4 = property1 === "Variant4";
  const isVariant4OrVariant5 = ["Variant4", "Variant5"].includes(property1);
  const isVariant4OrVariant6 = ["Variant4", "Variant6"].includes(property1);
  const isVariant4OrVariant6OrVariant5 = ["Variant4", "Variant6", "Variant5"].includes(property1);
  const isVariant5 = property1 === "Variant5";
  const isVariant6 = property1 === "Variant6";
  const isVariant6OrVariant5 = ["Variant6", "Variant5"].includes(property1);
  const isVariant7 = property1 === "Variant7";
  const isVariant8 = property1 === "Variant8";
  const isVariant8OrVariant4OrVariant6OrVariant5 = ["Variant8", "Variant4", "Variant6", "Variant5"].includes(property1);
  return (
    <div className={className || "h-[652px] relative w-[306px]"}>
      <div className="absolute bg-white inset-[0.31%_0_0_0] rounded-[16px]" data-name="Atividades Background" />
      {isVariant8OrVariant4OrVariant6OrVariant5 && (
        <>
          <div className="absolute inset-[0.31%_0_89.26%_0]">
            <div className={isVariant6 ? "absolute bg-[#dde3ec] h-[28px] left-[20px] rounded-[100px] top-[20px] w-[218px]" : isVariant4OrVariant5 ? "flex flex-row items-center size-full" : "flex flex-row items-center justify-end size-full"}>
              <div className={isVariant6 ? "absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.3),inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.25),inset_0px_1.5px_4px_0px_rgba(0,0,0,0.08),inset_0px_1.5px_4px_0px_rgba(0,0,0,0.1)]" : isVariant4OrVariant5 ? "content-stretch flex gap-[20px] items-center p-[20px] relative size-full" : "content-stretch flex gap-[20px] items-center justify-end p-[20px] relative size-full"}>
                {isVariant4OrVariant5 && (
                  <div className="content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0 w-[170px]">
                    <ModuloDeAtividadesButtonSymbolBackgroundImageAndText text="􀌤" />
                    <div className="h-[20px] shrink-0 w-[6px]" />
                    <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[18px] tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                      Mensagens
                    </p>
                    <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
                      <BackgroundImageAndText1 text="􀆈" additionalClassNames="text-[#4e6987]" />
                    </div>
                  </div>
                )}
                {["Variant8", "Variant4"].includes(property1) && <ModuloDeAtividadesButtonSymbolBackgroundImage>{isVariant4 ? "􀊫" : isVariant8 ? "􀄘" : ""}</ModuloDeAtividadesButtonSymbolBackgroundImage>}
                {["Variant8", "Variant5"].includes(property1) && <ModuloDeAtividadesButtonSymbolBackgroundImage1>{isVariant5 ? "􀊫" : isVariant8 ? "􀆄" : ""}</ModuloDeAtividadesButtonSymbolBackgroundImage1>}
                {isVariant4 && (
                  <button className="block cursor-pointer overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
                    <BackgroundImageAndText1 text="􀜓" additionalClassNames="text-[#28415c]" />
                  </button>
                )}
                {isVariant5 && (
                  <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
                    <BackgroundImageAndText1 text="􀜓" additionalClassNames="text-[#28415c]" />
                  </div>
                )}
              </div>
            </div>
            {isVariant6 && (
              <>
                <ButtonSymbolBackgroundImageAndText text="􀊫" />
                <div className="absolute left-[258px] overflow-clip rounded-[500px] size-[28px] top-[20px]" data-name="Button - Symbol">
                  <BackgroundImageAndText text="􀜓" additionalClassNames="text-[#28415c] text-[13px]" />
                </div>
                <p className="absolute font-['DM_Sans:Medium',sans-serif] leading-[17px] left-[37px] not-italic text-[#4e6987] text-[12px] top-[25px] tracking-[-0.5px] w-[145px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                  Pesquisar em mensagens
                </p>
              </>
            )}
          </div>
          <div className={`absolute ${isVariant5 ? "contents inset-[26.99%_6.54%_1.84%_6.54%]" : isVariant4OrVariant6 ? "contents inset-[10.74%_6.21%_18.1%_6.86%]" : "content-stretch flex inset-[2.15%_37.91%_91.72%_6.54%] items-center p-[6px] rounded-[8px]"}`}>
            {isVariant4OrVariant6OrVariant5 && (
              <>
                <div className={`absolute content-stretch flex items-start ${isVariant5 ? "inset-[26.99%_18.95%_67.64%_6.54%]" : "inset-[10.74%_18.63%_83.9%_6.86%]"}`}>
                  <div className="content-stretch flex gap-[10px] items-end relative shrink-0">
                    <ModuloDeAtividadesBackgroundImage />
                    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                      <div className="bg-[#f6f7f9] col-1 h-[35px] ml-0 mt-0 rounded-[100px] row-1 w-[183px]" />
                      <ModuloDeAtividadesBackgroundImageAndText text="Olá, isso é uma mensagem" additionalClassNames="ml-[14px] w-[156px]" />
                    </div>
                  </div>
                </div>
                <div className={`-translate-x-1/2 absolute content-stretch flex items-start ${isVariant5 ? "bottom-[43.71%] left-[calc(50%-25px)] top-[50.92%]" : "bottom-[59.97%] left-[calc(50%-24px)] top-[34.66%]"}`}>
                  <div className="content-stretch flex gap-[10px] items-end relative shrink-0">
                    <div className="relative shrink-0 size-[35px]" data-name="Avatars / 3d_avatar_12">
                      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgAvatars3DAvatar12} />
                    </div>
                    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                      <div className="bg-[#dde3ec] col-1 h-[35px] ml-0 mt-0 rounded-[100px] row-1 w-[171px]" />
                      <ModuloDeAtividadesBackgroundImageAndText text="Mensagem de outro user" additionalClassNames="ml-[13px] w-[148px]" />
                    </div>
                  </div>
                </div>
                <div className={`absolute contents ${isVariant5 ? "inset-[92.79%_6.54%_1.84%_42.48%]" : "inset-[76.53%_6.21%_18.1%_42.81%]"}`}>
                  <div className={`absolute bg-[#28415c] rounded-[100px] ${isVariant5 ? "inset-[92.79%_6.54%_1.84%_42.48%]" : "inset-[76.53%_6.21%_18.1%_42.81%]"}`} />
                  <div className={`absolute flex flex-col font-["DM_Sans:Medium",sans-serif] justify-center leading-[0] not-italic text-[#f6f7f9] text-[12px] text-right tracking-[-0.5px] ${isVariant5 ? "inset-[94.02%_10.43%_3.68%_46.38%]" : "inset-[77.76%_10.11%_19.94%_46.71%]"}`} style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                    <p className="leading-[17px] whitespace-pre-wrap">Mensagem não recebida</p>
                  </div>
                </div>
                <div className={`absolute content-stretch flex gap-[10px] items-end ${isVariant5 ? "inset-[33.13%_23.2%_51.38%_6.54%]" : "inset-[16.87%_22.88%_67.64%_6.86%]"}`}>
                  <ModuloDeAtividadesBackgroundImage />
                  <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                    <div className="bg-[#f6f7f9] col-1 h-[101px] ml-0 mt-0 rounded-[15px] row-1 w-[170px]" />
                    <p className="col-1 font-['DM_Sans:Medium',sans-serif] h-[77px] leading-[17px] ml-[14px] mt-[9px] not-italic relative row-1 text-[#28415c] text-[12px] tracking-[-0.5px] w-[142px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque vel eros eget lacus pharetra congue in vel tellus.
                    </p>
                  </div>
                </div>
                <div className={`absolute contents ${isVariant5 ? "inset-[64.72%_6.54%_26.23%_13.4%]" : "inset-[48.47%_6.21%_42.48%_13.73%]"}`}>
                  <div className={`absolute bg-[#28415c] rounded-[15px] ${isVariant5 ? "inset-[64.72%_6.54%_27.3%_21.24%]" : "inset-[48.47%_6.21%_43.56%_21.57%]"}`} />
                  <div className={`absolute flex flex-col font-["DM_Sans:Medium",sans-serif] justify-center leading-[0] not-italic text-[#f6f7f9] text-[12px] text-right tracking-[-0.5px] ${isVariant5 ? "inset-[66.41%_10.46%_28.99%_25.49%]" : "inset-[50.15%_10.13%_45.25%_25.82%]"}`} style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                    <p className="leading-[17px] whitespace-pre-wrap">Lorem ipsum dolor sit amet, cectetur adipiscing elit.</p>
                  </div>
                  <p className={`absolute font-["DM_Sans:Bold",sans-serif] leading-[20px] not-italic text-[#98989d] text-[8px] text-right tracking-[0.5px] uppercase whitespace-pre-wrap ${isVariant5 ? "inset-[70.71%_78.76%_26.23%_13.4%]" : "inset-[54.45%_78.43%_42.48%_13.73%]"}`} style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                    09:32
                  </p>
                  <div className={`absolute overflow-clip ${isVariant5 ? "inset-[69.63%_78.76%_28.22%_16.67%]" : "inset-[53.37%_78.43%_44.48%_16.99%]"}`} data-name="config">
                    <div className="absolute inset-[-0.67%_0.22%_0.67%_-0.22%] overflow-clip" data-name="double.check 1">
                      <div className="absolute contents inset-0" data-name="Camada 1">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox={isVariant6OrVariant5 ? "0 0 112.75 112.75" : "0 0 14 14"}>
                          <g id="Camada 1-2">
                            <g id="Vector" />
                          </g>
                        </svg>
                        <div className="absolute inset-[20.58%_11.8%_20.58%_11.79%]" data-name="Group">
                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox={isVariant6OrVariant5 ? "0 0 86.158 66.348" : "0 0 10.6981 8.23833"}>
                            <g id="Group">
                              <path d={isVariant6OrVariant5 ? svgPaths.p1e542a00 : svgPaths.p2c1c100} fill={isVariant6OrVariant5 ? "var(--fill-0, #F6F7F9)" : "var(--fill-0, #07ABDE)"} id="Vector" />
                              <path d={isVariant6OrVariant5 ? svgPaths.p33dab800 : svgPaths.p3d9f69f0} fill={isVariant6OrVariant5 ? "var(--fill-0, #F6F7F9)" : "var(--fill-0, #07ABDE)"} id="Vector_2" />
                              <path d={isVariant6OrVariant5 ? svgPaths.p36d2f900 : svgPaths.p38a86271} fill={isVariant6OrVariant5 ? "var(--fill-0, #F6F7F9)" : "var(--fill-0, #07ABDE)"} id="Vector_3" />
                            </g>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className={`absolute font-["DM_Sans:Bold",sans-serif] leading-[20px] not-italic text-[#98989d] text-[8px] tracking-[0.5px] uppercase whitespace-pre-wrap ${isVariant5 ? "inset-[30.81%_9.48%_66.12%_81.05%]" : "inset-[14.55%_9.15%_82.38%_81.37%]"}`} style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                  09:30
                </p>
                <p className={`absolute font-["DM_Sans:Bold",sans-serif] leading-[20px] not-italic text-[#98989d] text-[8px] tracking-[0.5px] uppercase whitespace-pre-wrap ${isVariant5 ? "inset-[46.76%_13.73%_50.17%_76.8%]" : "inset-[30.51%_13.4%_66.43%_77.12%]"}`} style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                  09:32
                </p>
                <p className={`absolute font-["DM_Sans:Bold",sans-serif] leading-[20px] not-italic text-[#98989d] text-[8px] tracking-[0.5px] uppercase whitespace-pre-wrap ${isVariant5 ? "inset-[54.43%_13.4%_42.5%_77.12%]" : "inset-[38.17%_13.07%_58.76%_77.45%]"}`} style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                  09:32
                </p>
                <p className={`absolute font-["DM_Sans:Bold",sans-serif] leading-[20px] not-italic text-[#98989d] text-[8px] tracking-[0.5px] uppercase whitespace-pre-wrap ${isVariant5 ? "inset-[88.65%_15.36%_8.28%_76.8%]" : "inset-[72.39%_15.03%_24.54%_77.12%]"}`} style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                  09:32
                </p>
                <p className={`absolute font-["DM_Sans:Bold",sans-serif] leading-[20px] not-italic text-[#98989d] text-[10px] text-center tracking-[0.5px] uppercase whitespace-pre-wrap ${isVariant5 ? "inset-[59.2%_46.08%_37.73%_44.44%]" : "inset-[42.94%_45.75%_53.99%_44.77%]"}`} style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                  HOJE
                </p>
                <div className={`absolute content-stretch flex gap-[10px] items-end ${isVariant5 ? "bottom-[9.51%] left-[6.54%] right-[23.2%] top-3/4" : "inset-[58.74%_22.88%_25.77%_6.86%]"}`}>
                  <div className="content-stretch flex items-end relative shrink-0">
                    <ModuloDeAtividadesBackgroundImage />
                  </div>
                  <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0" data-name="Mask group">
                    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-0 mt-0 place-items-start relative row-1">
                      <div className="bg-[#f6f7f9] col-1 h-[101px] ml-0 mt-0 rounded-[15px] row-1 w-[170px]" />
                    </div>
                    <div className="col-1 h-[151px] ml-[-32px] mt-[-15px] relative row-1 w-[276px]">
                      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgRectangle57} />
                    </div>
                  </div>
                </div>
                <div className={`absolute flex flex-col font-["DM_Sans:Bold",sans-serif] justify-center leading-[0] not-italic text-[#98989d] text-[8px] text-right tracking-[0.5px] uppercase ${isVariant5 ? "inset-[97.39%_57.52%_1.99%_34.64%]" : "inset-[81.13%_57.19%_18.25%_34.97%]"}`} style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                  <p className="leading-[20px] whitespace-pre-wrap">09:32</p>
                </div>
                <div className={`absolute overflow-clip ${isVariant5 ? "inset-[95.25%_57.52%_2.61%_37.91%]" : "inset-[78.99%_57.19%_18.87%_38.24%]"}`} data-name="config">
                  <div className="absolute contents inset-0" data-name="Camada 1">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox={isVariant6OrVariant5 ? "0 0 112.75 112.75" : "0 0 14 14"}>
                      <g id="Camada 1-2">
                        <g id="Vector" />
                      </g>
                    </svg>
                    <div className="absolute inset-[20.68%_20.25%]" data-name="Regular-S">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox={isVariant6OrVariant5 ? "0 0 67.09 66.11" : "0 0 8.33047 8.20878"}>
                        <g id="Regular-S">
                          <path d={isVariant6OrVariant5 ? svgPaths.p1df9a200 : svgPaths.p693c680} fill={isVariant6OrVariant5 ? "var(--fill-0, #F6F7F9)" : "var(--fill-0, #98989D)"} id="Vector" />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              </>
            )}
            <div className={`overflow-clip size-[28px] ${isVariant5 ? "absolute bg-[#f6f7f9] left-[243px] rounded-[500px] top-[526px]" : isVariant4OrVariant6 ? "absolute bg-[#f6f7f9] left-[244px] rounded-[500px] top-[420px]" : "bg-[#d9f8ef] relative rounded-[8px] shrink-0"}`} data-name="Button - Symbol">
              <div className={`-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-["SF_Pro:Semibold",sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-center top-1/2 ${isVariant6OrVariant5 ? "text-[#28415c] text-[13px]" : isVariant4 ? "text-[#28415c] text-[17px]" : "text-[#3ccea7] text-[17px]"}`} style={isVariant6OrVariant5 ? { fontVariationSettings: "'wdth' 100" } : { fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
                <p className="leading-[22px] whitespace-pre-wrap">{isVariant4OrVariant6OrVariant5 ? "􀈄" : isVariant8 ? "􀇸" : ""}</p>
              </div>
            </div>
            {isVariant8 && (
              <>
                <div className="h-[20px] shrink-0 w-[6px]" />
                <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[18px] tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                  Discador
                </p>
                <div className="overflow-clip rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol" />
              </>
            )}
          </div>
        </>
      )}
      {isVariant4OrVariant6OrVariant5 && (
        <div className="absolute bg-white content-stretch flex gap-[6px] items-center left-0 px-[10px] py-[14px] rounded-bl-[16px] rounded-br-[16px] top-[592px]">
          <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
            <div className={`-translate-x-1/2 -translate-y-1/2 absolute flex flex-col justify-center leading-[0] left-1/2 size-[28px] text-[#28415c] text-center top-1/2 ${isVariant6OrVariant5 ? 'font-["SF_Pro:Semibold",sans-serif] font-[590] text-[13px]' : 'font-["SF_Pro:Medium",sans-serif] font-[510] text-[20px]'}`} style={isVariant6OrVariant5 ? { fontVariationSettings: "'wdth' 100" } : { fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
              <p className="leading-[22px] whitespace-pre-wrap">􀁌</p>
            </div>
          </div>
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
            <div className="bg-[#dde3ec] col-1 h-[32px] ml-0 mt-0 rounded-[100px] row-1 w-[184px]" />
            <div className="col-1 flex flex-col font-['DM_Sans:Medium',sans-serif] h-[13.714px] justify-center ml-[19px] mt-[8.23px] not-italic relative row-1 text-[#4e6987] text-[12px] tracking-[-0.5px] w-[155px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              <p className="leading-[17px] whitespace-pre-wrap">Digite uma mensagem</p>
            </div>
          </div>
          <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
            <div className={`-translate-x-1/2 -translate-y-1/2 absolute flex flex-col justify-center leading-[0] left-1/2 size-[28px] text-[#28415c] text-center top-1/2 ${isVariant6OrVariant5 ? 'font-["SF_Pro:Semibold",sans-serif] font-[590] text-[13px]' : 'font-["SF_Pro:Medium",sans-serif] font-[510] text-[20px]'}`} style={isVariant6OrVariant5 ? { fontVariationSettings: "'wdth' 100" } : { fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
              <p className="leading-[22px] whitespace-pre-wrap">􀈟</p>
            </div>
          </div>
          <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
            <div className={`-translate-x-1/2 -translate-y-1/2 absolute flex flex-col justify-center leading-[0] left-1/2 size-[28px] text-[#28415c] text-center top-1/2 ${isVariant6OrVariant5 ? 'font-["SF_Pro:Semibold",sans-serif] font-[590] text-[13px]' : 'font-["SF_Pro:Medium",sans-serif] font-[510] text-[20px]'}`} style={isVariant6OrVariant5 ? { fontVariationSettings: "'wdth' 100" } : { fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
              <p className="leading-[22px] whitespace-pre-wrap">􀊰</p>
            </div>
          </div>
        </div>
      )}
      {["Variant7", "Variant2"].includes(property1) && (
        <div className={`absolute bg-[#f6f7f9] rounded-[100px] ${isVariant2 ? "inset-[2.15%_4.9%_91.1%_4.9%]" : "-translate-x-1/2 bottom-[91.1%] left-[calc(50%-1px)] top-[2.15%]"}`} data-name="Segmented Control">
          <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
            <div className={`content-stretch flex gap-[4px] items-center justify-center p-[4px] relative ${isVariant2 ? "size-full" : "h-full"}`}>
              <div className={`backdrop-blur-[50px] h-[36px] relative ${isVariant2 ? "flex-[1_0_0] min-h-px min-w-px rounded-[100px]" : "bg-[#28415c] rounded-[20px] shrink-0"}`} data-name="Button 1">
                <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
                  <div className={`content-stretch flex gap-[3px] items-center justify-center relative ${isVariant2 ? "leading-[0] px-[8px] size-full text-[#98989d] text-center text-ellipsis whitespace-nowrap" : "h-full px-[16px]"}`}>
                    <div className={`flex flex-col justify-center overflow-hidden relative shrink-0 ${isVariant2 ? 'font-["SF_Pro:Semibold",sans-serif] font-[590] text-[15px]' : 'font-["DM_Sans:Bold",sans-serif] leading-[0] not-italic text-[#f6f7f9] text-[10px] text-center text-ellipsis tracking-[0.5px] uppercase whitespace-nowrap'}`} style={isVariant2 ? { fontVariationSettings: "'wdth' 100" } : { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                      <p className="leading-[20px] overflow-hidden">{isVariant2 ? "􀺿" : isVariant7 ? "FEITAS" : ""}</p>
                    </div>
                    {isVariant2 && (
                      <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] justify-center not-italic overflow-hidden relative shrink-0 text-[10px] tracking-[0.5px] uppercase" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                        <p className="leading-[20px] overflow-hidden">feed</p>
                      </div>
                    )}
                  </div>
                </div>
                <div aria-hidden="true" className={`absolute border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)] ${isVariant2 ? "border-0 rounded-[100px]" : "border-[0.5px] rounded-[20px]"}`} />
              </div>
              <div className={`h-[36px] relative rounded-[100px] ${isVariant2 ? "backdrop-blur-[50px] bg-[#28415c] flex-[1_0_0] min-h-px min-w-px" : "shrink-0"}`} data-name="Button 2">
                <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
                  <div className={`content-stretch flex gap-[3px] items-center justify-center relative ${isVariant2 ? "leading-[0] px-[8px] size-full text-[#f6f7f9] text-center text-ellipsis whitespace-nowrap" : "h-full px-[16px]"}`}>
                    <div className={`flex flex-col justify-center overflow-hidden relative shrink-0 ${isVariant2 ? 'font-["SF_Pro:Semibold",sans-serif] font-[590] text-[15px]' : 'font-["DM_Sans:Bold",sans-serif] leading-[0] not-italic text-[#98989d] text-[10px] text-center text-ellipsis tracking-[0.5px] uppercase whitespace-nowrap'}`} style={isVariant2 ? { fontVariationSettings: "'wdth' 100" } : { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                      <p className="leading-[20px] overflow-hidden">{isVariant2 ? "􁃫" : isVariant7 ? "RECEBIDAS" : ""}</p>
                    </div>
                    {isVariant2 && (
                      <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] justify-center not-italic overflow-hidden relative shrink-0 text-[10px] tracking-[0.5px] uppercase" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                        <p className="leading-[20px] overflow-hidden">engajamento</p>
                      </div>
                    )}
                  </div>
                </div>
                {isVariant2 && <div aria-hidden="true" className="absolute border-[0.5px] border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[100px] shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)]" />}
              </div>
              {isVariant7 && (
                <div className="h-[36px] relative rounded-[100px] shrink-0" data-name="Button 3">
                  <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
                    <div className="content-stretch flex gap-[3px] h-full items-center justify-center px-[16px] relative">
                      <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] justify-center leading-[0] not-italic overflow-hidden relative shrink-0 text-[#98989d] text-[10px] text-center text-ellipsis tracking-[0.5px] uppercase whitespace-nowrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                        <p className="leading-[20px] overflow-hidden">PERDIDAS</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.3),inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.25),inset_1px_1.5px_4px_0px_rgba(0,0,0,0.08),inset_1px_1.5px_4px_0px_rgba(0,0,0,0.1)]" />
        </div>
      )}
      {isDefault && (
        <>
          <div className="absolute content-stretch flex flex-col gap-[4px] inset-[19.33%_0.49%_12.27%_0.49%] items-center" data-name="Atividades">
            <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64676c] text-[10px] text-center tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              FUTURO
            </p>
            <ActivityBackgroundImage text="Compromisso" text1="04/01/2024 09:30" />
            <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64676c] text-[10px] text-center tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              Julho
            </p>
            <ActivityBackgroundImage1 text="Tarefa" text1="04/01/2024 09:30" />
            <ActivityBackgroundImage2 text="Ligação" text1="04/01/2024 09:30" />
            <ActivityBackgroundImage3 text="Nota" text1="04/01/2024 09:30" />
            <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64676c] text-[10px] text-center tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              Junho
            </p>
            <ActivityBackgroundImage4 text="Mensagem" text1="04/01/2024 09:30" />
            <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64676c] text-[10px] text-center tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              2022
            </p>
            <ActivityBackgroundImage5 text="Email" text1="04/01/2024 09:30" />
          </div>
          <SegmentedControlBackgroundImage />
        </>
      )}
      {isDefaultOrVariant7 && (
        <>
          <BackgroundImage8>
            <div className="content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0 w-[170px]">
              <div className={`overflow-clip relative rounded-[8px] shrink-0 size-[28px] ${isVariant7 ? "bg-[#d9f8ef]" : "bg-[#dde3ec]"}`} data-name="Button - Symbol">
                <div className={`-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-["SF_Pro:Semibold",sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[17px] text-center top-1/2 ${isVariant7 ? "text-[#3ccea7]" : "text-[#4e6987]"}`} style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
                  <p className="leading-[22px] whitespace-pre-wrap">{isVariant7 ? "􀌾" : "􀣔"}</p>
                </div>
              </div>
              <div className="h-[20px] shrink-0 w-[6px]" />
              <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[18px] tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                {isVariant7 ? "Ligações" : "Atividades"}
              </p>
              <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
                <BackgroundImageAndText1 text="􀆈" additionalClassNames="text-[#4e6987]" />
              </div>
            </div>
            <ModuloDeAtividadesButtonSymbolBackgroundImage>{isVariant7 ? "􀊫" : "􀜓"}</ModuloDeAtividadesButtonSymbolBackgroundImage>
            <ModuloDeAtividadesButtonSymbolBackgroundImage1>{isVariant7 ? "􀜓" : "􀆏"}</ModuloDeAtividadesButtonSymbolBackgroundImage1>
          </BackgroundImage8>
          <BackgroundImage6>
            <div className={`flex flex-col font-["SF_Pro:Semibold",sans-serif] font-[590] justify-center relative shrink-0 ${isVariant7 ? "text-[17px]" : "text-[16px]"}`} style={isVariant7 ? { fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" } : { fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[22px]">{isVariant7 ? "􀍀" : "􀅼"}</p>
            </div>
            <BackgroundImage10>{isVariant7 ? "Fazer uma ligação" : "Adicionar atividade"}</BackgroundImage10>
          </BackgroundImage6>
        </>
      )}
      {isVariant7 && (
        <div className="-translate-x-1/2 absolute bottom-[10.25%] content-stretch flex flex-col gap-[20px] items-center left-[calc(50%+1.5px)] top-[19.33%]">
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
            <div className="col-1 content-stretch flex gap-[10px] items-center ml-0 mt-0 relative row-1">
              <div className="flex items-center justify-center relative shrink-0 size-[13px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
                <div className="flex-none rotate-90">
                  <BackgroundImageAndText2 text="􀆊" />
                </div>
              </div>
              <BackgroundImage1 text="+55 98899-8899" text1="04/07/2023 09:30" />
              <div className="bg-white h-[20px] shrink-0 w-[52px]" />
              <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
                <BackgroundImageAndText1 text="􀍀" additionalClassNames="text-[#28415c]" />
              </div>
            </div>
            <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[41px] mt-[42.99px] place-items-start relative row-1">
              <p className="col-1 font-['DM_Sans:Medium',sans-serif] h-[16.837px] leading-[22px] ml-[19.02px] mt-0 not-italic relative row-1 text-[#98989d] text-[15px] tracking-[-0.5px] w-[197.88px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                Título da Ligação
              </p>
              <p className="col-1 font-['DM_Sans:Medium',sans-serif] h-[8px] leading-[17px] ml-[41px] mt-[27.91px] not-italic relative row-1 text-[#98989d] text-[12px] tracking-[-0.5px] w-[187px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                15 minutos e 53 segundos
              </p>
              <div className="col-1 flex flex-col font-['DM_Sans:Medium',sans-serif] h-[30px] justify-center ml-[41.5px] mt-[56.01px] not-italic relative row-1 text-[#98989d] text-[12px] tracking-[-0.5px] w-[176px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                <p className="leading-[17px] whitespace-pre-wrap">Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
              </div>
              <div className="col-1 flex h-[85.174px] items-center justify-center ml-0 mt-[1.01px] relative row-1 w-0">
                <div className="-rotate-90 flex-none h-px w-[85.174px]">
                  <div className="relative size-full" data-name="Divider">
                    <div className="absolute inset-[-0.5px_0]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 85.1742 1">
                        <path d="M0 0.5H42.5871H85.1742" id="Divider" stroke="var(--stroke-0, #D9F8EF)" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-1 ml-[18px] mt-[28.01px] overflow-clip row-1 size-[18px]" data-name="timer 1" />
              <div className="col-1 ml-[13.5px] mt-[58.01px] overflow-clip relative rounded-[500px] row-1 size-[28px]" data-name="Button - Symbol">
                <BackgroundImageAndText1 text="􀌄" additionalClassNames="text-[#98989d]" />
              </div>
              <div className="col-1 ml-[13.5px] mt-[23.01px] overflow-clip relative rounded-[500px] row-1 size-[28px]" data-name="Button - Symbol">
                <BackgroundImageAndText1 text="􀍀" additionalClassNames="text-[#98989d]" />
              </div>
            </div>
          </div>
          <BackgroundImage2 />
          <BackgroundImage2 />
          <BackgroundImage2 />
          <BackgroundImage2 />
          <BackgroundImage2 />
        </div>
      )}
      {isVariant8 && (
        <>
          <ModuloDeAtividadesButtonSymbolBackgroundImageAndText1 text="1" additionalClassNames="inset-[34.97%_64.05%_57.06%_18.95%]" />
          <ModuloDeAtividadesButtonSymbolBackgroundImageAndText1 text="4" additionalClassNames="inset-[46.01%_64.05%_46.01%_18.95%]" />
          <ModuloDeAtividadesButtonSymbolBackgroundImageAndText1 text="7" additionalClassNames="inset-[57.06%_64.05%_34.97%_18.95%]" />
          <ModuloDeAtividadesButtonSymbolBackgroundImageAndText1 text="*" additionalClassNames="inset-[68.1%_64.05%_23.93%_18.95%]" />
          <ModuloDeAtividadesButtonSymbolBackgroundImageAndText1 text="2" additionalClassNames="inset-[34.97%_41.83%_57.06%_41.18%]" />
          <ModuloDeAtividadesButtonSymbolBackgroundImageAndText1 text="5" additionalClassNames="inset-[46.01%_41.83%_46.01%_41.18%]" />
          <ModuloDeAtividadesButtonSymbolBackgroundImageAndText1 text="8" additionalClassNames="inset-[57.06%_41.83%_34.97%_41.18%]" />
          <ModuloDeAtividadesButtonSymbolBackgroundImageAndText1 text="0" additionalClassNames="inset-[68.1%_41.83%_23.93%_41.18%]" />
          <div className="absolute backdrop-blur-[50px] bg-[#3ccea7] inset-[79.14%_41.83%_12.88%_41.18%] rounded-[500px]" data-name="Button - Symbol">
            <div className="overflow-clip relative rounded-[inherit] size-full">
              <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] left-1/2 size-[50px] text-[#f6f7f9] text-[24px] text-center top-1/2" style={{ fontVariationSettings: "'wdth' 100" }}>
                <p className="leading-[22px] whitespace-pre-wrap">􀌿</p>
              </div>
            </div>
            <div aria-hidden="true" className="absolute border border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[500px] shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)]" />
          </div>
          <ModuloDeAtividadesButtonSymbolBackgroundImageAndText1 text="3" additionalClassNames="inset-[34.97%_19.61%_57.06%_63.4%]" />
          <ModuloDeAtividadesButtonSymbolBackgroundImageAndText1 text="6" additionalClassNames="inset-[46.01%_19.61%_46.01%_63.4%]" />
          <ModuloDeAtividadesButtonSymbolBackgroundImageAndText1 text="9" additionalClassNames="inset-[57.06%_19.61%_34.97%_63.4%]" />
          <ModuloDeAtividadesButtonSymbolBackgroundImageAndText1 text="#" additionalClassNames="inset-[68.1%_19.61%_23.93%_63.4%]" />
          <div className="absolute flex flex-col font-['DM_Sans:Medium',sans-serif] inset-[23.16%_17.32%_71.93%_16.99%] justify-center leading-[0] not-italic text-[#28415c] text-[24px] text-center tracking-[-0.5px] whitespace-nowrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
            <p className="leading-[32px]">+55 11 98899 8899</p>
          </div>
        </>
      )}
      {isVariant5 && (
        <>
          <DropDownButton className="absolute bg-[#f6f7f9] h-[32px] left-[26px] rounded-[100px] top-[76px] w-[123px]" label="CANAL" state="Hover" />
          <DropDownButton className="absolute bg-[#f6f7f9] h-[32px] left-[26px] rounded-[100px] top-[118px] w-[123px]" label="RESPONSÁVEL" state="Hover" />
          <DropDownButton className="absolute bg-[#f6f7f9] h-[32px] left-[163px] rounded-[100px] top-[76px] w-[123px]" label="DATA" state="Hover" />
          <div className="absolute bg-[#dcf0ff] h-[32px] left-[163px] rounded-[100px] top-[118px] w-[123px]" data-name="Drop Down Button">
            <BackgroundImage3 text="APLICAR" text1="􀆈" />
          </div>
        </>
      )}
      {isVariant3 && (
        <>
          <div className="absolute contents inset-[0.31%_0_0_0]" data-name="Mask group">
            <div className="absolute content-stretch flex flex-col gap-[4px] inset-[31.6%_0.49%_0_0.49%] items-center mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-1.5px_-204px] mask-size-[306px_650px]" data-name="Atividades" style={{ maskImage: `url('${imgAtividades}')` }}>
              <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64676c] text-[10px] text-center tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                FUTURO
              </p>
              <ActivityBackgroundImage text="Compromisso" text1="04/01/2024 09:30" />
              <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64676c] text-[10px] text-center tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                Julho
              </p>
              <ActivityBackgroundImage1 text="Tarefa" text1="04/01/2024 09:30" />
              <ActivityBackgroundImage2 text="Ligação" text1="04/01/2024 09:30" />
              <ActivityBackgroundImage3 text="Nota" text1="04/01/2024 09:30" />
              <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64676c] text-[10px] text-center tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                Junho
              </p>
              <ActivityBackgroundImage4 text="Mensagem" text1="04/01/2024 09:30" />
              <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64676c] text-[10px] text-center tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                2022
              </p>
              <ActivityBackgroundImage5 text="Email" text1="04/01/2024 09:30" />
            </div>
          </div>
          <div className="absolute bg-white inset-[88.96%_0_0_0] rounded-bl-[16px] rounded-br-[16px]" data-name="Atividades Background" />
          <SegmentedControlBackgroundImage />
          <BackgroundImage8>
            <div className="content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0 w-[170px]">
              <div className="bg-[#dde3ec] overflow-clip relative rounded-[8px] shrink-0 size-[28px]" data-name="Button - Symbol">
                <BackgroundImageAndText1 text="􀣔" additionalClassNames="text-[#4e6987]" />
              </div>
              <div className="h-[20px] shrink-0 w-[6px]" />
              <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[18px] tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                Atividades
              </p>
              <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
                <BackgroundImageAndText1 text="􀆈" additionalClassNames="text-[#4e6987]" />
              </div>
            </div>
            <div className="bg-[#07abde] overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
              <BackgroundImageAndText1 text="􀜓" additionalClassNames="text-[#28415c]" />
            </div>
            <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
              <BackgroundImageAndText1 text="􀆏" additionalClassNames="text-[#28415c]" />
            </div>
          </BackgroundImage8>
          <ModuloDeAtividadesButtonTextBackgroundImage text="􀅼" text1="Adicionar atividade" />
          <DropDownButton className="absolute bg-[#f6f7f9] inset-[19.33%_51.31%_75.77%_8.5%] rounded-[100px]" label="TIPO DE ATIV." state="Hover" />
          <DropDownButton className="absolute bg-[#f6f7f9] inset-[25.77%_51.31%_69.33%_8.5%] rounded-[100px]" label="RESPONSÁVEL" state="Hover" />
          <DropDownButton className="absolute bg-[#f6f7f9] inset-[19.33%_6.54%_75.77%_53.27%] rounded-[100px]" label="DATA DA ATIV." state="Hover" />
          <div className="absolute bg-[#dcf0ff] inset-[25.77%_6.54%_69.33%_53.27%] rounded-[100px]" data-name="Drop Down Button">
            <BackgroundImage3 text="APLICAR" text1="􀆈" />
          </div>
        </>
      )}
      {isVariant2 && (
        <>
          <Frame className="absolute inset-[8.9%_0_80.67%_0]" resumoDeAtividades="Default" />
          <div className="absolute content-stretch flex flex-col gap-[26px] inset-[19.33%_52.29%_13.19%_6.54%] items-center leading-[0]">
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
              <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
              <ModuloDeAtividadesBackgroundImage1 text="Há 20 dias" text1="Abaixo da média" />
              <div className="col-1 content-stretch flex h-[10px] items-center ml-0 mt-0 relative row-1 w-[126px]">
                <div className="overflow-clip relative rounded-[100px] shrink-0 size-[16px]" data-name="Button - Symbol">
                  <BackgroundImageAndText text="􀆿" additionalClassNames="text-[#98989d] text-[8px]" />
                </div>
                <BackgroundImageAndText4 text="ÚLTIMA ATIVIDADE" />
              </div>
            </div>
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
              <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
              <ModuloDeAtividadesBackgroundImage1 text="5 Emails" text1="Abaixo da média" />
              <div className="col-1 content-stretch flex h-[10px] items-center ml-0 mt-0 relative row-1 w-[126px]">
                <div className="overflow-clip relative rounded-[100px] shrink-0 size-[16px]" data-name="Button - Symbol">
                  <BackgroundImageAndText text="􀆿" additionalClassNames="text-[#98989d] text-[8px]" />
                </div>
                <BackgroundImageAndText4 text="emails trocados" />
              </div>
            </div>
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
              <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
              <div className="col-1 h-[29px] ml-[6px] mt-[22px] relative row-1 w-[114px]">
                <BackgroundImageAndText5 text="56% WhatsApp" additionalClassNames="left-[4px] top-[26px] w-[106px]" />
              </div>
              <div className="col-1 content-stretch flex h-[10px] items-center ml-0 mt-0 relative row-1 w-[126px]">
                <div className="overflow-clip relative rounded-[100px] shrink-0 size-[16px]" data-name="Button - Symbol">
                  <BackgroundImageAndText text="􀆿" additionalClassNames="text-[#98989d] text-[8px]" />
                </div>
                <BackgroundImageAndText4 text="canal principal" />
              </div>
            </div>
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
              <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
              <div className="col-1 h-[41px] ml-[6px] mt-[16px] relative row-1 w-[114px]">
                <BackgroundImageAndText5 text="7,3 pontos" additionalClassNames="left-[3px] top-[25px] w-[111px]" />
                <BackgroundImage5 />
              </div>
              <div className="col-1 content-stretch flex h-[10px] items-center ml-0 mt-0 relative row-1 w-[126px]">
                <div className="overflow-clip relative rounded-[100px] shrink-0 size-[16px]" data-name="Button - Symbol">
                  <BackgroundImageAndText text="􀆿" additionalClassNames="text-[#98989d] text-[8px]" />
                </div>
                <BackgroundImageAndText4 text="renitência" />
              </div>
            </div>
            <BackgroundImage13>
              <div className="overflow-clip relative rounded-[100px] shrink-0 size-[16px]" data-name="Button - Symbol">
                <BackgroundImageAndText text="􀆿" additionalClassNames="text-[#98989d] text-[8px]" />
              </div>
              <BackgroundImageAndText4 text="TAREFA FUTURA?" />
            </BackgroundImage13>
          </div>
          <div className="absolute content-stretch flex flex-col gap-[26px] inset-[19.33%_6.54%_13.19%_52.29%] items-center leading-[0]">
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
              <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
              <div className="col-1 h-[41px] ml-[6px] mt-[16px] relative row-1 w-[114px]">
                <BackgroundImageAndText5 text="31 atividades" additionalClassNames="left-[3px] top-[25px] w-[111px]" />
                <div className="absolute content-stretch flex h-[12px] items-center left-0 top-[26px] w-[106px]">
                  <div className="overflow-clip relative shrink-0 size-[14px]" data-name="arrow.up">
                    <div className="absolute contents inset-0" data-name="Camada 1">
                      <BackgroundImage4 />
                      <RegularSBackgroundImage additionalClassNames="inset-[24.77%_24.77%_24.78%_24.78%]">
                        <path d={svgPaths.p24050b80} fill="var(--fill-0, #3CCEA7)" id="Vector" />
                      </RegularSBackgroundImage>
                    </div>
                  </div>
                  <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#3ccea7] text-[8px] tracking-[0.5px] uppercase" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                    acima da média
                  </p>
                </div>
              </div>
              <div className="col-1 content-stretch flex h-[10px] items-center ml-0 mt-0 relative row-1 w-[126px]">
                <div className="overflow-clip relative rounded-[100px] shrink-0 size-[16px]" data-name="Button - Symbol">
                  <BackgroundImageAndText text="􀆿" additionalClassNames="text-[#98989d] text-[8px]" />
                </div>
                <BackgroundImageAndText4 text="ATIVIDADES TOTAIS" />
              </div>
            </div>
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
              <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
              <div className="col-1 h-[41px] ml-[6px] mt-[16px] relative row-1 w-[114px]">
                <BackgroundImageAndText5 text="7 ligações" additionalClassNames="left-[3px] top-[25px] w-[111px]" />
                <BackgroundImage5 />
              </div>
              <div className="col-1 content-stretch flex h-[10px] items-center ml-0 mt-0 relative row-1 w-[126px]">
                <div className="overflow-clip relative rounded-[100px] shrink-0 size-[16px]" data-name="Button - Symbol">
                  <BackgroundImageAndText text="􀆿" additionalClassNames="text-[#98989d] text-[8px]" />
                </div>
                <BackgroundImageAndText4 text="total de ligações" />
              </div>
            </div>
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
              <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
              <ModuloDeAtividadesBackgroundImage1 text="1h e 56 m" text1="Abaixo da média" />
              <div className="col-1 content-stretch flex h-[10px] items-center ml-0 mt-0 relative row-1 w-[126px]">
                <div className="overflow-clip relative rounded-[100px] shrink-0 size-[16px]" data-name="Button - Symbol">
                  <BackgroundImageAndText text="􀆿" additionalClassNames="text-[#98989d] text-[8px]" />
                </div>
                <BackgroundImageAndText4 text="tempo de resposta" />
              </div>
            </div>
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
              <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
              <div className="col-1 h-[41px] ml-[6px] mt-[16px] relative row-1 w-[114px]">
                <div className="-translate-y-full absolute flex flex-col font-['DM_Sans:Medium',sans-serif] justify-end leading-[0] left-[3px] not-italic text-[#4e6987] text-[15px] top-[25px] tracking-[-0.5px] w-[111px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                  <p className="leading-[22px] whitespace-pre-wrap">{` 3 reuniões`}</p>
                </div>
                <BackgroundImage5 />
              </div>
              <div className="col-1 content-stretch flex h-[10px] items-center ml-0 mt-0 relative row-1 w-[126px]">
                <div className="overflow-clip relative rounded-[100px] shrink-0 size-[16px]" data-name="Button - Symbol">
                  <BackgroundImageAndText text="􀆿" additionalClassNames="text-[#98989d] text-[8px]" />
                </div>
                <BackgroundImageAndText4 text="total de reuniões" />
              </div>
            </div>
            <BackgroundImage13>
              <div className="overflow-clip relative rounded-[100px] shrink-0 size-[16px]" data-name="Button - Symbol">
                <BackgroundImageAndText text="􀆿" additionalClassNames="text-[#98989d] text-[8px]" />
              </div>
              <BackgroundImageAndText4 text="tem anotações" />
            </BackgroundImage13>
          </div>
          <ModuloDeAtividadesButtonTextBackgroundImage text="􀅼" text1="Adicionar atividade" />
        </>
      )}
    </div>
  );
}

export default function ModuloDeAtividades1() {
  return <ModuloDeAtividades className="relative size-full" property1="Variant2" />;
}
import clsx from "clsx";
import { imgAtividades } from "./svg-b3ip9";
type BackgroundImage2Props = {
  additionalClassNames?: string;
};

function BackgroundImage2({ children, additionalClassNames = "" }: React.PropsWithChildren<BackgroundImage2Props>) {
  return (
    <div className={clsx("absolute bg-[#dcf0ff]", additionalClassNames)}>
      <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">{children}</div>
    </div>
  );
}

function BackgroundImage1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ fontVariationSettings: "'wdth' 100" }} className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] relative shrink-0 text-[#28415c] text-[12px] text-center whitespace-nowrap">
      <p className="leading-[24px]">{children}</p>
    </div>
  );
}

function BackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }} className="flex flex-col font-['DM_Sans:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#28415c] text-[10px] text-center tracking-[0.5px] uppercase whitespace-nowrap">
      <p className="leading-[20px]">{children}</p>
    </div>
  );
}

function ActivityBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative rounded-[8px] shrink-0 w-[303px]">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[4px] items-center px-[12px] py-[6px] relative w-full">{children}</div>
      </div>
    </div>
  );
}
type ModuloDeAtividadesBackgroundImageProps = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function ModuloDeAtividadesBackgroundImage({ text, text1, additionalClassNames = "" }: ModuloDeAtividadesBackgroundImageProps) {
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
type BackgroundImageAndTextProps = {
  text: string;
  additionalClassNames?: string;
};

function BackgroundImageAndText({ text, additionalClassNames = "" }: BackgroundImageAndTextProps) {
  return (
    <div style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }} className={clsx("-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[17px] text-center top-1/2", additionalClassNames)}>
      <p className="leading-[22px] whitespace-pre-wrap">{text}</p>
    </div>
  );
}
type ButtonSymbolBackgroundImageAndTextProps = {
  text: string;
  additionalClassNames?: string;
};

function ButtonSymbolBackgroundImageAndText({ text, additionalClassNames = "" }: ButtonSymbolBackgroundImageAndTextProps) {
  return (
    <div className={clsx("overflow-clip relative shrink-0 size-[28px]", additionalClassNames)}>
      <BackgroundImageAndText text={text} additionalClassNames="text-[#4e6987]" />
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
              <BackgroundImage>{label}</BackgroundImage>
              <HighlightFrameBackgroundImage />
              <BackgroundImage1>􀆈</BackgroundImage1>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ModuloDeAtividades() {
  return (
    <div className="relative size-full" data-name="Módulo de atividades">
      <div className="absolute bg-white inset-[0.31%_0_0_0] rounded-[16px]" data-name="Atividades Background" />
      <div className="absolute contents inset-[0.31%_0_0_0]" data-name="Mask group">
        <div className="absolute content-stretch flex flex-col gap-[4px] inset-[31.6%_0.49%_0_0.49%] items-center mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-1.5px_-204px] mask-size-[306px_650px]" data-name="Atividades" style={{ maskImage: `url('${imgAtividades}')` }}>
          <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64676c] text-[10px] text-center tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
            FUTURO
          </p>
          <ActivityBackgroundImage>
            <ButtonSymbolBackgroundImageAndText text="􀆊" additionalClassNames="rounded-[500px]" />
            <div className="bg-[#ffedeb] overflow-clip relative rounded-[8px] shrink-0 size-[28px]" data-name="Button - Symbol">
              <BackgroundImageAndText text="􀉉" additionalClassNames="text-[#ff8c76]" />
            </div>
            <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[15px] tracking-[-0.5px] w-[110px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              Compromisso
            </p>
            <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#4e6987] text-[10px] text-right tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              04/01/2024 09:30
            </p>
          </ActivityBackgroundImage>
          <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64676c] text-[10px] text-center tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
            Julho
          </p>
          <ActivityBackgroundImage>
            <ButtonSymbolBackgroundImageAndText text="􀆊" additionalClassNames="rounded-[500px]" />
            <div className="bg-[#e8e8fd] overflow-clip relative rounded-[8px] shrink-0 size-[28px]" data-name="Button - Symbol">
              <BackgroundImageAndText text="􀁢" additionalClassNames="text-[#8c8cd4]" />
            </div>
            <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[15px] tracking-[-0.5px] w-[110px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              Tarefa
            </p>
            <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#4e6987] text-[10px] text-right tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              04/01/2024 09:30
            </p>
          </ActivityBackgroundImage>
          <ActivityBackgroundImage>
            <ButtonSymbolBackgroundImageAndText text="􀆊" additionalClassNames="rounded-[500px]" />
            <div className="bg-[#d9f8ef] overflow-clip relative rounded-[8px] shrink-0 size-[28px]" data-name="Button - Symbol">
              <BackgroundImageAndText text="􀌾" additionalClassNames="text-[#3ccea7]" />
            </div>
            <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[15px] tracking-[-0.5px] w-[110px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              Ligação
            </p>
            <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#4e6987] text-[10px] text-right tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              04/01/2024 09:30
            </p>
          </ActivityBackgroundImage>
          <ActivityBackgroundImage>
            <ButtonSymbolBackgroundImageAndText text="􀆊" additionalClassNames="rounded-[500px]" />
            <div className="bg-[#feedca] overflow-clip relative rounded-[8px] shrink-0 size-[28px]" data-name="Button - Symbol">
              <BackgroundImageAndText text="􀻡" additionalClassNames="text-[#eac23d]" />
            </div>
            <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[15px] tracking-[-0.5px] w-[110px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              Nota
            </p>
            <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#4e6987] text-[10px] text-right tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              04/01/2024 09:30
            </p>
          </ActivityBackgroundImage>
          <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64676c] text-[10px] text-center tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
            Junho
          </p>
          <ActivityBackgroundImage>
            <ButtonSymbolBackgroundImageAndText text="􀆊" additionalClassNames="rounded-[500px]" />
            <div className="bg-[#dcf0ff] overflow-clip relative rounded-[8px] shrink-0 size-[28px]" data-name="Button - Symbol">
              <BackgroundImageAndText text="􀌤" additionalClassNames="text-[#07abde]" />
            </div>
            <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[15px] tracking-[-0.5px] w-[110px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              Mensagem
            </p>
            <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#4e6987] text-[10px] text-right tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              04/01/2024 09:30
            </p>
          </ActivityBackgroundImage>
          <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64676c] text-[10px] text-center tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
            2022
          </p>
          <ActivityBackgroundImage>
            <ButtonSymbolBackgroundImageAndText text="􀆊" additionalClassNames="rounded-[500px]" />
            <ButtonSymbolBackgroundImageAndText text="􀍕" additionalClassNames="bg-[#dde3ec] rounded-[8px]" />
            <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[15px] tracking-[-0.5px] w-[110px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              Email
            </p>
            <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#4e6987] text-[10px] text-right tracking-[0.5px] uppercase w-[102px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              04/01/2024 09:30
            </p>
          </ActivityBackgroundImage>
        </div>
      </div>
      <div className="absolute bg-white inset-[88.96%_0_0_0] rounded-bl-[16px] rounded-br-[16px]" data-name="Atividades Background" />
      <div className="absolute bg-[#f6f7f9] inset-[2.15%_4.9%_91.1%_4.9%] rounded-[100px]" data-name="Segmented Control">
        <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex gap-[4px] items-center justify-center p-[4px] relative size-full">
            <div className="backdrop-blur-[50px] bg-[#28415c] flex-[1_0_0] h-[36px] min-h-px min-w-px relative rounded-[20px]" data-name="Button 1">
              <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
                <ModuloDeAtividadesBackgroundImage text="􀺿" text1="feed" additionalClassNames="text-[#f6f7f9]" />
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
                <ModuloDeAtividadesBackgroundImage text="􁃪" text1="engajamento" additionalClassNames="text-[#98989d]" />
              </div>
            </button>
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.3),inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.25),inset_1px_1.5px_4px_0px_rgba(0,0,0,0.08),inset_1px_1.5px_4px_0px_rgba(0,0,0,0.1)]" />
      </div>
      <div className="absolute inset-[8.9%_0_80.67%_0]">
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex gap-[20px] items-center p-[20px] relative size-full">
            <div className="content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0 w-[170px]">
              <ButtonSymbolBackgroundImageAndText text="􀣔" additionalClassNames="bg-[#dde3ec] rounded-[8px]" />
              <div className="h-[20px] shrink-0 w-[6px]" />
              <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[18px] tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                Atividades
              </p>
              <ButtonSymbolBackgroundImageAndText text="􀆈" additionalClassNames="rounded-[500px]" />
            </div>
            <button className="bg-[#07abde] block cursor-pointer overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
              <BackgroundImageAndText text="􀜓" additionalClassNames="text-[#28415c]" />
            </button>
            <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
              <BackgroundImageAndText text="􀆏" additionalClassNames="text-[#28415c]" />
            </div>
          </div>
        </div>
      </div>
      <BackgroundImage2 additionalClassNames="inset-[91.87%_21.24%_3.22%_21.24%] rounded-[500px]">
        <div className="content-stretch flex gap-[4px] items-center justify-center leading-[0] px-[12px] relative size-full text-[#28415c] text-center whitespace-nowrap">
          <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center relative shrink-0 text-[16px]" style={{ fontVariationSettings: "'wdth' 100" }}>
            <p className="leading-[22px]">􀅼</p>
          </div>
          <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] justify-center not-italic relative shrink-0 text-[15px] tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
            <p className="leading-[22px]">Adicionar atividade</p>
          </div>
        </div>
      </BackgroundImage2>
      <DropDownButton className="absolute bg-[#f6f7f9] inset-[19.33%_51.31%_75.77%_8.5%] rounded-[100px]" label="TIPO DE ATIV." state="Hover" />
      <DropDownButton className="absolute bg-[#f6f7f9] inset-[25.77%_51.31%_69.33%_8.5%] rounded-[100px]" label="RESPONSÁVEL" state="Hover" />
      <DropDownButton className="absolute bg-[#f6f7f9] inset-[19.33%_6.54%_75.77%_53.27%] rounded-[100px]" label="DATA DA ATIV." state="Hover" />
      <BackgroundImage2 additionalClassNames="inset-[25.77%_6.54%_69.33%_53.27%] rounded-[100px]">
        <div className="content-stretch flex items-center justify-center pl-[18px] pr-[17px] relative size-full">
          <BackgroundImage>APLICAR</BackgroundImage>
          <HighlightFrameBackgroundImage />
          <BackgroundImage1>􀆈</BackgroundImage1>
        </div>
      </BackgroundImage2>
    </div>
  );
}
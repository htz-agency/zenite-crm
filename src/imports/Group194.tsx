import clsx from "clsx";
import imgEllipse15 from "figma:asset/0ffbbca174936fd7c6afd0b3813897da11c8d8ab.png";
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return (
    <div style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }} className={clsx("-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[17px] text-center top-1/2", additionalClassNames)}>
      <p className="leading-[22px] whitespace-pre-wrap">{text}</p>
    </div>
  );
}

export default function Group() {
  return (
    <div className="relative size-full">
      <div className="absolute content-stretch flex gap-[10px] items-center left-0 top-0">
        <div className="flex items-center justify-center relative shrink-0 size-[13px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
          <div className="flex-none rotate-90">
            <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] relative size-[13px] text-[#4e6987] text-[12px] text-center" style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
              <p className="leading-[22px] whitespace-pre-wrap">􀆊</p>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
          <div className="content-stretch flex items-start relative shrink-0" data-name="Picture">
            <div className="content-stretch flex items-end relative shrink-0">
              <div className="relative shrink-0 size-[35px]">
                <img alt="" className="absolute block max-w-none size-full" height="35" src={imgEllipse15} width="35" />
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[10px] h-[34px] items-start not-italic relative shrink-0 text-[#4e6987]">
            <p className="font-['DM_Sans:Medium',sans-serif] h-[14px] leading-[17px] relative shrink-0 text-[12px] tracking-[-0.5px] w-[90px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              +55 98899-8899
            </p>
            <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] h-[10px] justify-end leading-[0] relative shrink-0 text-[8px] tracking-[0.5px] uppercase w-[102px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              <p className="leading-[20px] whitespace-pre-wrap">04/07/2023 09:30</p>
            </div>
          </div>
        </div>
        <div className="bg-white h-[20px] shrink-0 w-[52px]" />
        <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
          <Text text="􀍀" additionalClassNames="text-[#28415c]" />
        </div>
      </div>
      <div className="absolute contents left-[41px] top-[42.99px]">
        <p className="absolute font-['DM_Sans:Medium',sans-serif] inset-[33.28%_4.48%_53.68%_22.23%] leading-[22px] not-italic text-[#98989d] text-[15px] tracking-[-0.5px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
          Título da Ligação
        </p>
        <p className="absolute font-['DM_Sans:Medium',sans-serif] inset-[54.89%_0.37%_38.92%_30.37%] leading-[17px] not-italic text-[#98989d] text-[12px] tracking-[-0.5px] whitespace-pre-wrap" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
          15 minutos e 53 segundos
        </p>
        <div className="absolute flex flex-col font-['DM_Sans:Medium',sans-serif] inset-[76.64%_4.26%_0.13%_30.56%] justify-center leading-[0] not-italic text-[#98989d] text-[12px] tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
          <p className="leading-[17px] whitespace-pre-wrap">Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
        </div>
        <div className="absolute flex inset-[34.06%_84.81%_0_15.19%] items-center justify-center">
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
        <div className="absolute left-[59px] overflow-clip size-[18px] top-[71px]" data-name="timer 1" />
        <div className="absolute left-[54.5px] overflow-clip rounded-[500px] size-[28px] top-[101px]" data-name="Button - Symbol">
          <Text text="􀌄" additionalClassNames="text-[#98989d]" />
        </div>
        <div className="absolute left-[54.5px] overflow-clip rounded-[500px] size-[28px] top-[66px]" data-name="Button - Symbol">
          <Text text="􀍀" additionalClassNames="text-[#98989d]" />
        </div>
      </div>
    </div>
  );
}
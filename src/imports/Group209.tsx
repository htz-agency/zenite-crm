function MenubarLeft() {
  return (
    <div className="absolute content-stretch flex flex-col items-center left-0 top-[27.89px] w-[60px]" data-name="Menubar - Left">
      <div className="h-[54px] relative shrink-0 w-[32px]" data-name="Component 1">
        <div className="absolute inset-[0_0_40.74%_0] overflow-clip rounded-[500px]" data-name="Button - Menu">
          <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] left-1/2 size-[32px] text-[#4e6987] text-[15px] text-center top-1/2" style={{ fontVariationSettings: "\'wdth\' 100" }}>
            <p className="leading-[22px] whitespace-pre-wrap">􀴥</p>
          </div>
        </div>
        <div className="absolute flex flex-col font-['DM_Sans:Medium',sans-serif] inset-[59.26%_6.25%_0_6.25%] justify-center leading-[0] not-italic text-[#4e6987] text-[12px] text-center tracking-[-0.5px] whitespace-nowrap" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
          <p className="leading-[22px]">Atalho</p>
        </div>
      </div>
    </div>
  );
}

export default function Group() {
  return (
    <div className="relative size-full">
      <div className="absolute h-[1.893px] left-[18.5px] top-0 w-[23px]" data-name="Divider">
        <div className="absolute inset-[-2.83%_-1.67%_-2.83%_-4.35%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24.3848 2">
            <path d="M1 1H23.3848" id="Divider" stroke="var(--stroke-0, #98989D)" strokeLinecap="round" strokeWidth="2" />
          </svg>
        </div>
      </div>
      <MenubarLeft />
    </div>
  );
}
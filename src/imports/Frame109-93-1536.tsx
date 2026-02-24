export default function Frame() {
  return (
    <div className="border border-[#eac23d] border-solid relative rounded-[8px] size-full">
      <div className="-translate-y-full absolute flex flex-col font-['DM_Sans:Bold',sans-serif] h-[12px] justify-end leading-[0] left-[5px] not-italic text-[#eac23d] text-[10px] top-[17px] tracking-[0.5px] uppercase w-[162px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        <p className="leading-[20px] whitespace-pre-wrap">CARGO</p>
      </div>
      <div className="-translate-y-1/2 absolute flex flex-col font-['DM_Sans:Medium',sans-serif] h-[10px] justify-center leading-[0] left-[5px] not-italic text-[#eac23d] text-[15px] top-[21px] tracking-[-0.5px] w-[166px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        <p className="leading-[22px] whitespace-pre-wrap">Lorem ipsum dolor</p>
      </div>
      <div className="absolute bg-[#feedca] left-[173px] overflow-clip rounded-[100px] size-[16px] top-[10px]" data-name="Button - Symbol">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[#eac23d] text-[8px] text-center top-1/2" style={{ fontVariationSettings: "\'wdth\' 100" }}>
          <p className="leading-[22px] whitespace-pre-wrap">􀆅</p>
        </div>
      </div>
    </div>
  );
}
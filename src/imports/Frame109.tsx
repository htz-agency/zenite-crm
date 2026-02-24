export default function Frame() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center leading-[0] not-italic p-[6px] relative rounded-[8px] size-full">
      <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] h-[12px] justify-end relative shrink-0 text-[#98989d] text-[10px] tracking-[0.5px] uppercase w-full" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        <p className="leading-[20px] whitespace-pre-wrap">CARGO</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] h-[10px] justify-center relative shrink-0 text-[#4e6987] text-[15px] tracking-[-0.5px] w-[166px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        <p className="leading-[22px] whitespace-pre-wrap">Lorem ipsum dolor</p>
      </div>
    </div>
  );
}
function Frame() {
  return (
    <div className="content-stretch flex h-[20px] items-center relative shrink-0 w-[157px]">
      <p className="font-['DM_Sans:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#28415c] text-[19px] tracking-[-0.5px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        Leads
      </p>
      <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[#28415c] text-[17px] text-center top-1/2" style={{ fontVariationSettings: "\'wdth\' 100", fontFeatureSettings: "\'ss15\'" }}>
          <p className="leading-[22px] whitespace-pre-wrap">􀆈</p>
        </div>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col h-[30px] items-start justify-end relative shrink-0 w-[167px]">
      <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] h-[8px] justify-center leading-[0] not-italic relative shrink-0 text-[#64676c] text-[10px] tracking-[0.5px] uppercase w-[150px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        <p className="leading-[20px] whitespace-pre-wrap">PIPES</p>
      </div>
      <Frame />
    </div>
  );
}

export default function H1Pipes() {
  return (
    <div className="content-stretch flex gap-[10px] items-center p-[12px] relative rounded-[100px] size-full" data-name="H1 Pipes">
      <div className="bg-[#feedca] overflow-clip relative rounded-[8px] shrink-0 size-[31px]" data-name="Button - Symbol">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Medium',sans-serif] font-[450] justify-center leading-[0] left-1/2 size-[32px] text-[#eac23d] text-[16px] text-center top-1/2 tracking-[-0.0373px]" style={{ fontVariationSettings: "\'wdth\' 100", fontFeatureSettings: "\'ss02\', \'ss03\', \'ss07\', \'ss09\', \'cv03\', \'cv04\', \'cv06\', \'cv07\', \'cv10\', \'cv12\'" }}>
          <p className="leading-[normal] whitespace-pre-wrap">􀊴</p>
        </div>
      </div>
      <Frame1 />
    </div>
  );
}
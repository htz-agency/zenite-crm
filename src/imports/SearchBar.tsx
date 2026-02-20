function Frame() {
  return (
    <div className="col-1 content-stretch flex gap-[10px] items-center ml-0 mt-0 relative row-1">
      <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[#4e6987] text-[13px] text-center top-1/2" style={{ fontVariationSettings: "\'wdth\' 100" }}>
          <p className="leading-[22px] whitespace-pre-wrap">􀊫</p>
        </div>
      </div>
      <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[15px] tracking-[-0.5px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>{`Pesquisa `}</p>
    </div>
  );
}

function Search() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0" data-name="Search">
      <Frame />
    </div>
  );
}

export default function SearchBar() {
  return (
    <div className="bg-[#dde3ec] content-stretch flex items-center justify-between px-[10px] relative rounded-[100px] size-full" data-name="Search Bar">
      <Search />
      <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[#4e6987] text-[13px] text-center top-1/2" style={{ fontVariationSettings: "\'wdth\' 100" }}>
          <p className="leading-[22px] whitespace-pre-wrap">􁵤</p>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.3),inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.25),inset_0px_1.5px_4px_0px_rgba(0,0,0,0.08),inset_0px_1.5px_4px_0px_rgba(0,0,0,0.1)]" />
    </div>
  );
}
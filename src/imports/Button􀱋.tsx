export default function Button() {
  return (
    <button className="block cursor-pointer relative size-full" data-name="Button - 􀱋">
      <div className="absolute bg-[#07abde] inset-0 overflow-clip rounded-[500px]" data-name="Button - Symbol">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] left-1/2 size-[32px] text-[#f6f7f9] text-[15px] text-center top-1/2" style={{ fontVariationSettings: "\'wdth\' 100" }}>
          <p className="leading-[22px] whitespace-pre-wrap">􀱋</p>
        </div>
      </div>
    </button>
  );
}
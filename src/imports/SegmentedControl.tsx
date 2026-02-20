export default function SegmentedControl() {
  return (
    <div className="bg-[#f6f7f9] content-stretch flex gap-[4px] items-center justify-center overflow-clip p-[4px] relative rounded-[100px] size-full" data-name="Segmented Control">
      <div className="content-stretch flex gap-[3px] h-[36px] items-center justify-center leading-[0] overflow-clip px-[16px] relative rounded-[100px] shrink-0 text-[#98989d] text-center text-ellipsis whitespace-nowrap" data-name="Button 1">
        <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center overflow-hidden relative shrink-0 text-[15px]" style={{ fontVariationSettings: "\'wdth\' 100" }}>
          <p className="leading-[20px] overflow-hidden">􀑯</p>
        </div>
        <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] justify-center not-italic overflow-hidden relative shrink-0 text-[10px] tracking-[0.5px] uppercase" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
          <p className="leading-[20px] overflow-hidden">CARDS</p>
        </div>
      </div>
      <div className="backdrop-blur-[50px] bg-[#28415c] h-[36px] relative rounded-[20px] shrink-0" data-name="Button 2">
        <div className="content-stretch flex gap-[3px] h-full items-center justify-center leading-[0] overflow-clip px-[16px] relative rounded-[inherit] text-[#f6f7f9] text-center text-ellipsis whitespace-nowrap">
          <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center overflow-hidden relative shrink-0 text-[15px]" style={{ fontVariationSettings: "\'wdth\' 100" }}>
            <p className="leading-[20px] overflow-hidden">􀏤</p>
          </div>
          <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] justify-center not-italic overflow-hidden relative shrink-0 text-[10px] tracking-[0.5px] uppercase" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
            <p className="leading-[20px] overflow-hidden">TABELA</p>
          </div>
        </div>
        <div aria-hidden="true" className="absolute border-[0.5px] border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[20px] shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)]" />
      </div>
      <div className="content-stretch flex gap-[3px] h-[36px] items-center justify-center leading-[0] overflow-clip px-[16px] relative rounded-[100px] shrink-0 text-[#98989d] text-center text-ellipsis whitespace-nowrap" data-name="Button 3">
        <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center overflow-hidden relative shrink-0 text-[15px]" style={{ fontVariationSettings: "\'wdth\' 100" }}>
          <p className="leading-[20px] overflow-hidden">􀏣</p>
        </div>
        <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] justify-center not-italic overflow-hidden relative shrink-0 text-[10px] tracking-[0.5px] uppercase" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
          <p className="leading-[20px] overflow-hidden">personalizado</p>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.3),inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.25),inset_1px_1.5px_4px_0px_rgba(0,0,0,0.08),inset_1px_1.5px_4px_0px_rgba(0,0,0,0.1)]" />
    </div>
  );
}
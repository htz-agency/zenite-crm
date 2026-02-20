export default function Tab() {
  return (
    <div className="bg-[#f6f7f9] content-stretch flex gap-[4px] items-center pr-[28px] py-[10px] relative rounded-[100px] size-full text-[#4e6987]" data-name="Tab 1">
      <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] h-full justify-center leading-[0] relative shrink-0 text-[19px] text-center w-[44px]" style={{ fontVariationSettings: "\'wdth\' 100" }}>
        <p className="leading-[24px] whitespace-pre-wrap">􀍟</p>
      </div>
      <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic overflow-hidden relative shrink-0 text-[15px] text-ellipsis tracking-[-0.5px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        Configurações do Pipe
      </p>
    </div>
  );
}
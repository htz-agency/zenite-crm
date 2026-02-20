function Frame() {
  return (
    <div className="content-stretch flex h-[20px] items-center relative shrink-0 w-[157px]">
      <p className="font-['DM_Sans:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#28415c] text-[19px] text-left tracking-[-0.5px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
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
    <div className="absolute content-stretch flex flex-col h-[30px] items-start justify-end left-[53px] top-[12.5px] w-[167px]">
      <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] h-[8px] justify-center leading-[0] not-italic relative shrink-0 text-[#64676c] text-[10px] text-left tracking-[0.5px] uppercase w-[150px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        <p className="leading-[20px] whitespace-pre-wrap">PIPES</p>
      </div>
      <Frame />
    </div>
  );
}

export default function Group() {
  return (
    <div className="relative size-full">
      <button className="absolute bg-[#f6f7f9] block cursor-pointer h-[55px] left-0 rounded-[100px] top-0 w-[246px]" data-name="H1 Pipes">
        <div className="absolute bg-[#feedca] left-[12px] overflow-clip rounded-[8px] size-[31px] top-[12px]" data-name="Button - Symbol">
          <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Medium',sans-serif] font-[450] justify-center leading-[0] left-1/2 size-[32px] text-[#eac23d] text-[16px] text-center top-1/2 tracking-[-0.0373px]" style={{ fontVariationSettings: "\'wdth\' 100", fontFeatureSettings: "\'ss02\', \'ss03\', \'ss07\', \'ss09\', \'cv03\', \'cv04\', \'cv06\', \'cv07\', \'cv10\', \'cv12\'" }}>
            <p className="leading-[normal] whitespace-pre-wrap">􀊴</p>
          </div>
        </div>
        <Frame1 />
      </button>
      <div className="absolute backdrop-blur-[50px] bg-white content-stretch flex flex-col gap-[6px] h-[239px] items-start left-0 p-[12px] rounded-[34px] top-[60px]">
        <div aria-hidden="true" className="absolute border border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[34px] shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)]" />
        <div className="bg-[#f6f7f9] content-stretch flex gap-[4px] h-[36px] items-center pr-[28px] py-[10px] relative rounded-[100px] shrink-0 text-[#4e6987]" data-name="Tab 1">
          <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] h-full justify-center leading-[0] relative shrink-0 text-[19px] text-center w-[44px]" style={{ fontVariationSettings: "\'wdth\' 100" }}>
            <p className="leading-[24px] whitespace-pre-wrap">􀍟</p>
          </div>
          <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic overflow-hidden relative shrink-0 text-[15px] text-ellipsis tracking-[-0.5px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
            Configurações do Pipe
          </p>
        </div>
        <div className="content-stretch flex gap-[4px] h-[36px] items-center pr-[28px] py-[10px] relative rounded-[100px] shrink-0 text-[#4e6987] w-[227px]" data-name="Tab 3">
          <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] h-full justify-center leading-[0] relative shrink-0 text-[19px] text-center w-[44px]" style={{ fontVariationSettings: "\'wdth\' 100" }}>
            <p className="leading-[24px] whitespace-pre-wrap">􀎦</p>
          </div>
          <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic overflow-hidden relative shrink-0 text-[15px] text-ellipsis tracking-[-0.5px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
            Fixar nos Atalhos
          </p>
        </div>
        <div className="content-stretch flex gap-[4px] h-[36px] items-center pr-[28px] py-[10px] relative rounded-[100px] shrink-0 text-[#4e6987] w-[227px]" data-name="Tab 4">
          <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] h-full justify-center leading-[0] relative shrink-0 text-[19px] text-center w-[44px]" style={{ fontVariationSettings: "\'wdth\' 100" }}>
            <p className="leading-[24px] whitespace-pre-wrap">􀋙</p>
          </div>
          <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic overflow-hidden relative shrink-0 text-[15px] text-ellipsis tracking-[-0.5px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
            Notificações
          </p>
        </div>
        <div className="content-stretch flex gap-[4px] h-[36px] items-center pr-[28px] py-[10px] relative rounded-[100px] shrink-0 text-[#4e6987] w-[227px]" data-name="Tab 5">
          <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] h-full justify-center leading-[0] relative shrink-0 text-[19px] text-center w-[44px]" style={{ fontVariationSettings: "\'wdth\' 100" }}>
            <p className="leading-[24px] whitespace-pre-wrap">􀈑</p>
          </div>
          <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic overflow-hidden relative shrink-0 text-[15px] text-ellipsis tracking-[-0.5px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
            Excluir
          </p>
        </div>
        <div className="bg-[#dde3ec] h-[1.5px] shrink-0 w-[227px]" />
        <div className="content-stretch flex gap-[4px] h-[36px] items-center pr-[28px] py-[10px] relative rounded-[100px] shrink-0 text-[#4e6987] w-[227px]" data-name="Tab 2">
          <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] h-full justify-center leading-[0] relative shrink-0 text-[19px] text-center w-[44px]" style={{ fontVariationSettings: "\'wdth\' 100" }}>
            <p className="leading-[24px] whitespace-pre-wrap">􀅴</p>
          </div>
          <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic overflow-hidden relative shrink-0 text-[15px] text-ellipsis tracking-[-0.5px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
            Detalhes do Pipe
          </p>
        </div>
      </div>
    </div>
  );
}
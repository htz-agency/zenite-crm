import img3DAvatars30 from "figma:asset/d5fb6bc139a3da5bc43ab0601942a4cf33722fa1.png";

function Frame() {
  return (
    <div className="absolute content-stretch flex gap-[8px] inset-[0_28.31%_0_60.13%] items-center">
      <div className="relative shrink-0 size-[18px]" data-name="3D Avatars / 30">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={img3DAvatars30} />
      </div>
      <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#07abde] text-[12px] text-left tracking-[-0.5px] whitespace-nowrap" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        <p className="leading-[17px]">Nome Sobrenome</p>
      </div>
    </div>
  );
}

export default function LinhaDeTabela() {
  return (
    <button className="bg-[#f6f7f9] block cursor-pointer relative rounded-[100px] size-full" data-name="Linha de tabela">
      <div className="absolute flex flex-col font-['DM_Sans:Medium',sans-serif] inset-[0_79.45%_0_6.16%] justify-center leading-[0] not-italic text-[#07abde] text-[12px] text-left tracking-[-0.5px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        <p className="leading-[17px] whitespace-pre-wrap">Nome do Lead</p>
      </div>
      <div className="absolute flex flex-col font-['DM_Sans:Medium',sans-serif] inset-[0_67.99%_0_19.22%] justify-center leading-[0] not-italic text-[#28415c] text-[12px] text-left tracking-[-0.5px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        <p className="leading-[17px] whitespace-pre-wrap">Gerente de compras</p>
      </div>
      <div className="absolute flex flex-col font-['DM_Sans:Bold',sans-serif] inset-[0_97.06%_0_0] justify-center leading-[0] not-italic text-[#28415c] text-[10px] text-right tracking-[0.5px] uppercase" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        <p className="leading-[20px] whitespace-pre-wrap">1</p>
      </div>
      <div className="absolute flex flex-col font-['DM_Sans:Medium',sans-serif] inset-[0_55.02%_0_33.71%] justify-center leading-[0] not-italic text-[#28415c] text-[12px] text-left tracking-[-0.5px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        <p className="leading-[17px] whitespace-pre-wrap">XPTO Company</p>
      </div>
      <div className="absolute flex flex-col font-['DM_Sans:Medium',sans-serif] inset-[0_41.29%_0_48.3%] justify-center leading-[0] not-italic text-[#28415c] text-[12px] text-left tracking-[-0.5px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        <p className="leading-[17px] whitespace-pre-wrap">Em andamento</p>
      </div>
      <div className="absolute flex flex-col font-['DM_Sans:Medium',sans-serif] inset-[0_17.52%_0_74.72%] justify-center leading-[0] not-italic text-[#28415c] text-[12px] text-left tracking-[-0.5px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        <p className="leading-[17px] whitespace-pre-wrap">Há 20 dias</p>
      </div>
      <div className="absolute flex flex-col font-['DM_Sans:Medium',sans-serif] inset-[0_0_0_90.91%] justify-center leading-[0] not-italic text-[#28415c] text-[12px] text-left tracking-[-0.5px]" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        <p className="leading-[17px] whitespace-pre-wrap">Prospecção</p>
      </div>
      <Frame />
      <div className="absolute backdrop-blur-[20px] border-[#28415c] border-[1.5px] border-solid inset-[19.23%_94.98%_19.23%_3.5%] rounded-[100px]" data-name="Checkbox" />
    </button>
  );
}
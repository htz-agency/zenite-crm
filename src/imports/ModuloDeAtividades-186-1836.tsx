import clsx from "clsx";
import svgPaths from "./svg-odyryz5ubm";
type RegularSProps = {
  additionalClassNames?: string;
};

function RegularS({ children, additionalClassNames = "" }: React.PropsWithChildren<RegularSProps>) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.0627 7.0627">
        <g id="Regular-S">{children}</g>
      </svg>
    </div>
  );
}

function Helper2() {
  return (
    <div className="absolute content-stretch flex h-[12px] items-center left-0 top-[26px] w-[106px]">
      <div className="overflow-clip relative shrink-0 size-[14px]" data-name="arrow.both 1">
        <div className="absolute contents inset-0" data-name="Camada 1">
          <Helper />
          <div className="absolute inset-[9.36%_16.77%_9.37%_16.77%]" data-name="Regular-S">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.3038 11.3776">
              <g id="Regular-S">
                <path d={svgPaths.p10547f00} fill="var(--fill-0, #EAC23D)" id="Vector" />
              </g>
            </svg>
          </div>
        </div>
      </div>
      <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#eac23d] text-[8px] tracking-[0.5px] uppercase" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>{` na média`}</p>
    </div>
  );
}
type Helper1Props = {
  text: string;
  text1: string;
};

function Helper1({ text, text1 }: Helper1Props) {
  return (
    <div className="col-1 content-stretch flex h-[10px] items-center ml-0 mt-0 relative row-1 w-[126px]">
      <div className="overflow-clip relative rounded-[100px] shrink-0 size-[16px]" data-name="Button - Symbol">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[#98989d] text-[8px] text-center top-1/2" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[22px] whitespace-pre-wrap">{text}</p>
        </div>
      </div>
      <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#98989d] text-[10px] tracking-[0.5px] uppercase w-[112px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        <p className="leading-[20px] whitespace-pre-wrap">{text1}</p>
      </div>
    </div>
  );
}

function Helper() {
  return (
    <svg fill="none" preserveAspectRatio="none" viewBox="0 0 14 14" className="absolute block size-full">
      <g id="Camada 1-2">
        <g id="Vector" />
      </g>
    </svg>
  );
}
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return (
    <div style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }} className={clsx("-translate-y-full absolute flex flex-col font-['DM_Sans:Medium',sans-serif] justify-end leading-[0] not-italic text-[#4e6987] text-[15px] tracking-[-0.5px]", additionalClassNames)}>
      <p className="leading-[22px] whitespace-pre-wrap">{text}</p>
    </div>
  );
}
type ModuloDeAtividadesHelper1Props = {
  text: string;
  text1: string;
  text2: string;
  text3: string;
};

function ModuloDeAtividadesHelper1({ text, text1, text2, text3, children }: React.PropsWithChildren<ModuloDeAtividadesHelper1Props>) {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
      <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
      <div className="col-1 h-[41px] ml-[6px] mt-[16px] relative row-1 w-[114px]">
        <Text text={text} additionalClassNames="left-[3px] top-[26px] w-[83px]" />
        <div className="absolute content-stretch flex h-[12px] items-center left-0 top-[26px] w-[106px]">
          <div className="overflow-clip relative shrink-0 size-[14px]" data-name="arrow.down">
            <div className="absolute contents inset-0" data-name="Camada 1">
              <Helper />
              <RegularS additionalClassNames="inset-[24.78%_24.78%_24.77%_24.77%]">{children}</RegularS>
            </div>
          </div>
          <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#ff8c76] text-[8px] tracking-[0.5px] uppercase" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
            {text1}
          </p>
        </div>
      </div>
      <Helper1 text={text2} text1={text3} />
    </div>
  );
}
type ModuloDeAtividadesHelperProps = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function ModuloDeAtividadesHelper({ text, text1, additionalClassNames = "" }: ModuloDeAtividadesHelperProps) {
  return (
    <div className={clsx("content-stretch flex gap-[3px] items-center justify-center leading-[0] px-[8px] relative size-full text-center text-ellipsis whitespace-nowrap", additionalClassNames)}>
      <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center overflow-hidden relative shrink-0 text-[15px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[20px] overflow-hidden">{text}</p>
      </div>
      <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] justify-center not-italic overflow-hidden relative shrink-0 text-[10px] tracking-[0.5px] uppercase" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
        <p className="leading-[20px] overflow-hidden">{text1}</p>
      </div>
    </div>
  );
}

export default function ModuloDeAtividades() {
  return (
    <div className="relative size-full" data-name="Módulo de atividades">
      <div className="absolute bg-white inset-[0.31%_0_0_0] rounded-[16px]" data-name="Atividades Background" />
      <div className="absolute bg-[#f6f7f9] inset-[2.15%_4.9%_91.1%_4.9%] rounded-[100px]" data-name="Segmented Control">
        <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex gap-[4px] items-center justify-center p-[4px] relative size-full">
            <button className="backdrop-blur-[50px] cursor-pointer flex-[1_0_0] h-[36px] min-h-px min-w-px relative rounded-[100px]" data-name="Button 1">
              <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
                <ModuloDeAtividadesHelper text="􀺿" text1="feed" additionalClassNames="text-[#98989d]" />
              </div>
              <div aria-hidden="true" className="absolute border-0 border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[100px] shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)]" />
            </button>
            <div className="backdrop-blur-[50px] bg-[#28415c] flex-[1_0_0] h-[36px] min-h-px min-w-px relative rounded-[100px]" data-name="Button 2">
              <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
                <ModuloDeAtividadesHelper text="􁃫" text1="engajamento" additionalClassNames="text-[#f6f7f9]" />
              </div>
              <div aria-hidden="true" className="absolute border-[0.5px] border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[100px] shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)]" />
            </div>
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.3),inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.25),inset_1px_1.5px_4px_0px_rgba(0,0,0,0.08),inset_1px_1.5px_4px_0px_rgba(0,0,0,0.1)]" />
      </div>
      <div className="absolute inset-[8.9%_0_80.67%_0]">
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex gap-[20px] items-center p-[20px] relative size-full">
            <div className="content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0 w-[218px]">
              <p className="font-['DM_Sans:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#4e6987] text-[18px] tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                Resumo de atividades
              </p>
              <div className="overflow-clip rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol" />
            </div>
            <div className="overflow-clip relative rounded-[500px] shrink-0 size-[28px]" data-name="Button - Symbol">
              <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] left-1/2 size-[28px] text-[#28415c] text-[17px] text-center top-1/2" style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss15'" }}>
                <p className="leading-[22px] whitespace-pre-wrap">􀜓</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col gap-[26px] inset-[19.33%_52.29%_13.19%_6.54%] items-center leading-[0]">
        <ModuloDeAtividadesHelper1 text="Há 20 dias" text1="Abaixo da média" text2="􀆿" text3="ÚLTIMA ATIVIDADE">
          <path d={svgPaths.p226d5e80} fill="var(--fill-0, #FF8C76)" id="Vector" />
        </ModuloDeAtividadesHelper1>
        <ModuloDeAtividadesHelper1 text="5 Emails" text1="Abaixo da média" text2="􀆿" text3="emails trocados">
          <path d={svgPaths.p226d5e80} fill="var(--fill-0, #FF8C76)" id="Vector" />
        </ModuloDeAtividadesHelper1>
        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
          <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
          <div className="col-1 h-[29px] ml-[6px] mt-[22px] relative row-1 w-[114px]">
            <Text text="56% WhatsApp" additionalClassNames="left-[4px] top-[26px] w-[106px]" />
          </div>
          <Helper1 text="􀆿" text1="canal principal" />
        </div>
        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
          <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
          <div className="col-1 h-[41px] ml-[6px] mt-[16px] relative row-1 w-[114px]">
            <Text text="7,3 pontos" additionalClassNames="left-[3px] top-[25px] w-[111px]" />
            <Helper2 />
          </div>
          <Helper1 text="􀆿" text1="renitência" />
        </div>
        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
          <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
          <div className="col-1 h-[29px] ml-[6px] mt-[22px] relative row-1 w-[114px]">
            <Text text="Sim" additionalClassNames="left-[3px] top-[26px] w-[83px]" />
          </div>
          <Helper1 text="􀆿" text1="TAREFA FUTURA?" />
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col gap-[26px] inset-[19.33%_6.54%_13.19%_52.29%] items-center leading-[0]">
        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
          <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
          <div className="col-1 h-[41px] ml-[6px] mt-[16px] relative row-1 w-[114px]">
            <Text text="31 atividades" additionalClassNames="left-[3px] top-[25px] w-[111px]" />
            <div className="absolute content-stretch flex h-[12px] items-center left-0 top-[26px] w-[106px]">
              <div className="overflow-clip relative shrink-0 size-[14px]" data-name="arrow.up">
                <div className="absolute contents inset-0" data-name="Camada 1">
                  <Helper />
                  <RegularS additionalClassNames="inset-[24.77%_24.77%_24.78%_24.78%]">
                    <path d={svgPaths.p24050b80} fill="var(--fill-0, #3CCEA7)" id="Vector" />
                  </RegularS>
                </div>
              </div>
              <p className="font-['DM_Sans:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#3ccea7] text-[8px] tracking-[0.5px] uppercase" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
                acima da média
              </p>
            </div>
          </div>
          <Helper1 text="􀆿" text1="ATIVIDADES TOTAIS" />
        </div>
        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
          <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
          <div className="col-1 h-[41px] ml-[6px] mt-[16px] relative row-1 w-[114px]">
            <Text text="7 ligações" additionalClassNames="left-[3px] top-[25px] w-[111px]" />
            <Helper2 />
          </div>
          <Helper1 text="􀆿" text1="total de ligações" />
        </div>
        <ModuloDeAtividadesHelper1 text="1h e 56 m" text1="Abaixo da média" text2="􀆿" text3="tempo de resposta">
          <path d={svgPaths.p226d5e80} fill="var(--fill-0, #FF8C76)" id="Vector" />
        </ModuloDeAtividadesHelper1>
        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
          <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
          <div className="col-1 h-[41px] ml-[6px] mt-[16px] relative row-1 w-[114px]">
            <div className="-translate-y-full absolute flex flex-col font-['DM_Sans:Medium',sans-serif] justify-end leading-[0] left-[3px] not-italic text-[#4e6987] text-[15px] top-[25px] tracking-[-0.5px] w-[111px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              <p className="leading-[22px] whitespace-pre-wrap">{` 3 reuniões`}</p>
            </div>
            <Helper2 />
          </div>
          <Helper1 text="􀆿" text1="total de reuniões" />
        </div>
        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
          <div className="bg-[#f6f7f9] col-1 h-[45px] ml-0 mt-[14px] rounded-[8px] row-1 w-[126px]" />
          <div className="col-1 h-[29px] ml-[6px] mt-[22px] relative row-1 w-[114px]">
            <Text text="Sim" additionalClassNames="left-[3px] top-[26px] w-[83px]" />
          </div>
          <Helper1 text="􀆿" text1="tem anotações" />
        </div>
      </div>
      <div className="absolute bg-[#dcf0ff] inset-[91.87%_21.24%_3.22%_21.24%] rounded-[500px]" data-name="Button - Text">
        <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex gap-[4px] items-center justify-center leading-[0] px-[12px] relative size-full text-[#28415c] text-center whitespace-nowrap">
            <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center relative shrink-0 text-[16px]" style={{ fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[22px]">􀅼</p>
            </div>
            <div className="flex flex-col font-['DM_Sans:Medium',sans-serif] justify-center not-italic relative shrink-0 text-[15px] tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
              <p className="leading-[22px]">Adicionar atividade</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
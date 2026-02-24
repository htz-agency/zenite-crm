import clsx from "clsx";
import svgPaths from "./svg-27usn8kt6p";
type RowProps = {
  additionalClassNames?: string;
};

function Row({ children, additionalClassNames = "" }: React.PropsWithChildren<RowProps>) {
  return (
    <li className={clsx("min-w-[324px] relative rounded-[16px] shrink-0 w-full", additionalClassNames)}>
      <div className="content-stretch flex flex-col gap-[16px] items-start min-w-[inherit] p-[24px] relative w-full">{children}</div>
    </li>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[32px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        {children}
      </svg>
    </div>
  );
}
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return (
    <div style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }} className={clsx("flex flex-col font-['DM_Sans:Medium',sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[18px] w-[min-content]", additionalClassNames)}>
      <p className="leading-[22px] whitespace-pre-wrap">{text}</p>
    </div>
  );
}

export default function List() {
  return (
    <ul className="content-stretch flex flex-col gap-[16px] items-start relative size-full" data-name="List">
      <Row additionalClassNames="bg-[#dcf0ff]">
        <div className="content-stretch flex gap-[12px] items-center justify-center relative shrink-0" data-name="Header">
          <Wrapper>
            <g id="strategy-bold 1">
              <path d={svgPaths.pee08a80} fill="var(--fill-0, #0483AB)" id="Vector" />
            </g>
          </Wrapper>
          <h5 className="block font-['DM_Sans:Bold',sans-serif] leading-[32px] not-italic relative shrink-0 text-[#0483ab] text-[24px] tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
            Estratégia Competitiva
          </h5>
        </div>
        <Text text="Mapeamos o território antes de traçar o caminho. Definimos objetivos claros, analisamos o mercado em profundidade, segmentamos audiências com precisão e identificamos gaps competitivos que se transformam em oportunidades de crescimento." additionalClassNames="text-[#001b26]" />
      </Row>
      <Row additionalClassNames="bg-[#d9f8ef]">
        <div className="content-stretch flex gap-[12px] items-center justify-center relative shrink-0" data-name="Header">
          <Wrapper>
            <g id="crosshair-bold 1">
              <path d={svgPaths.p15d50400} fill="var(--fill-0, #20B48D)" id="Vector" />
            </g>
          </Wrapper>
          <h5 className="block font-['DM_Sans:Bold',sans-serif] leading-[32px] not-italic relative shrink-0 text-[#20b48d] text-[24px] tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>
            Planejamento de Marketing
          </h5>
        </div>
        <Text text="Estratégia sem execução é apenas teoria. Desenvolvemos planos de ação baseados em dados, selecionamos os canais mais eficientes para seu público, construímos mensagens que convertem e criamos campanhas que geram impacto real." additionalClassNames="text-[#02140e]" />
      </Row>
      <Row additionalClassNames="bg-[#feedca]">
        <div className="content-stretch flex gap-[12px] items-center justify-center relative shrink-0" data-name="Header">
          <Wrapper>
            <g id="pen-nib-bold 1">
              <path d={svgPaths.p350ae4e0} fill="var(--fill-0, #917822)" id="Vector" />
            </g>
          </Wrapper>
          <h5 className="block font-['DM_Sans:Bold',sans-serif] leading-[32px] not-italic relative shrink-0 text-[#917822] text-[24px] tracking-[-0.5px]" style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}>{`Design & Identidade`}</h5>
        </div>
        <Text text="Sua marca merece se destacar. Criamos identidades visuais memoráveis, experiências digitais envolventes e materiais de comunicação que não apenas chamam atenção, mas eles constroem conexões emocionais duradouras com seu público-alvo." additionalClassNames="text-[#1f1803]" />
      </Row>
    </ul>
  );
}
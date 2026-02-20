import svgPaths from "./svg-kzudfnu85o";

function Group1() {
  return (
    <div className="absolute inset-[61.21%_0.52%_0_57.02%]" data-name="Group">
      <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 31.8426 14.3528">
        <g id="Group">
          <path d={svgPaths.p2b213840} fill="var(--fill-0, #28415C)" id="Vector" />
          <path d={svgPaths.p145b6d00} fill="var(--fill-0, #28415C)" id="Vector_2" />
          <path d={svgPaths.p1b285200} fill="var(--fill-0, #28415C)" id="Vector_3" />
          <path d={svgPaths.p32273e00} fill="var(--fill-0, #28415C)" id="Vector_4" />
          <path d={svgPaths.p3339c200} fill="var(--fill-0, #28415C)" id="Vector_5" />
        </g>
      </svg>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute inset-[0_0_44.83%_0]" data-name="Group">
      <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 75 20.4113">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.p3ed48980} fill="var(--fill-0, #28415C)" fillRule="evenodd" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p3d496680} fill="var(--fill-0, #07ABDE)" fillRule="evenodd" id="Vector_2" />
          <g id="Group_2">
            <path d={svgPaths.p2dedcb00} fill="var(--fill-0, #28415C)" id="Vector_3" />
            <path d={svgPaths.p1d247400} fill="var(--fill-0, #28415C)" id="Vector_4" />
            <path d={svgPaths.p18cccd00} fill="var(--fill-0, #28415C)" id="Vector_5" />
            <path d={svgPaths.p63c1540} fill="var(--fill-0, #28415C)" id="Vector_6" />
            <path d={svgPaths.pa4e7f80} fill="var(--fill-0, #28415C)" id="Vector_7" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents inset-0" data-name="Group">
      <Group1 />
      <Group2 />
    </div>
  );
}

function Camada() {
  return (
    <div className="absolute contents inset-0" data-name="Camada 1">
      <Group />
    </div>
  );
}

export default function LogoZenitePrice() {
  return (
    <div className="relative size-full" data-name="logo-zenite-price 1">
      <Camada />
    </div>
  );
}
export default function ButtonText() {
  return (
    <button className="backdrop-blur-[50px] content-stretch cursor-pointer flex items-start relative shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)] size-full" data-name="Button - Text">
      <div className="content-stretch flex gap-[3px] h-[40px] items-center justify-center leading-[0] overflow-clip pl-[16px] pr-[20px] relative rounded-[100px] shrink-0 text-[#28415c] text-center whitespace-nowrap" data-name="Button - Text" style={{ backgroundImage: "url(\'data:image/svg+xml;utf8,<svg viewBox=\\'0 0 129 40\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.5\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-3.3958e-7 -4 12.9 -0.0000010316 64.5 40)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(255,255,255,0.43)\\' offset=\\'1\\'/></radialGradient></defs></svg>\'), linear-gradient(90deg, rgb(220, 240, 255) 0%, rgb(220, 240, 255) 100%)" }}>
        <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center relative shrink-0 text-[16px]" style={{ fontVariationSettings: "\'wdth\' 100" }}>
          <p className="leading-[22px]">􀅼</p>
        </div>
        <div className="flex flex-col font-['DM_Sans:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[15px] tracking-[-0.5px]" style={{ fontVariationSettings: "\'opsz\' 14", fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
          <p className="leading-[22px]">Novo Lead</p>
        </div>
      </div>
    </button>
  );
}
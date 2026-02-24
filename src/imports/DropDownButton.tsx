function HighlightFrame() {
  return (
    <div className="h-full relative shrink-0 w-[5px]" data-name="Highlight Frame">
      <div className="absolute h-[64px] left-[-52px] top-0 w-[90px]" data-name="Highlight">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 90 64">
          <g id="Highlight">
            <ellipse cx="45" cy="32" fill="url(#paint0_radial_34_4166)" rx="45" ry="32" />
            <ellipse cx="45" cy="32" fill="url(#paint1_radial_34_4166)" rx="45" ry="32" style={{ mixBlendMode: "color-dodge" }} />
          </g>
          <defs>
            <radialGradient cx="0" cy="0" gradientTransform="translate(45 32) rotate(90) scale(32 45)" gradientUnits="userSpaceOnUse" id="paint0_radial_34_4166" r="1">
              <stop stopColor="white" stopOpacity="0.07" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <radialGradient cx="0" cy="0" gradientTransform="translate(45 32) rotate(90) scale(32 45)" gradientUnits="userSpaceOnUse" id="paint1_radial_34_4166" r="1">
              <stop stopColor="#5E5E5E" stopOpacity="0.14" />
              <stop offset="1" stopColor="#5E5E5E" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

export default function DropDownButton() {
  return (
    <div className="bg-[#f6f7f9] content-stretch flex items-center justify-center overflow-clip pl-[18px] pr-[17px] relative rounded-[100px] size-full" data-name="Drop Down Button">
      <div className="flex flex-col font-['DM_Sans:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#28415c] text-[10px] text-center tracking-[0.5px] uppercase whitespace-nowrap" style={{ fontFeatureSettings: "\'ss01\', \'ss04\', \'ss05\', \'ss07\'" }}>
        <p className="leading-[20px]">CANAL</p>
      </div>
      <HighlightFrame />
      <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] relative shrink-0 text-[#28415c] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "\'wdth\' 100" }}>
        <p className="leading-[24px]">􀆈</p>
      </div>
    </div>
  );
}
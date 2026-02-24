function Knob() {
  return <div className="bg-white rounded-[100px] shadow-[0px_1px_1px_0px_rgba(0,0,0,0.22)] shrink-0 size-[28px]" data-name="Knob" />;
}

export default function Toggle() {
  return (
    <div className="content-stretch flex items-center justify-end overflow-clip px-[2px] py-[4px] relative rounded-[100px] size-full" data-name="Toggle">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[100px]">
        <div className="absolute bg-[#3ccea7] inset-0 rounded-[100px]" />
        <div className="absolute bg-[rgba(208,208,208,0.5)] inset-0 mix-blend-color-burn rounded-[100px]" />
      </div>
      <Knob />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-0.5px_1px_0px_rgba(94,94,94,0.3),inset_0px_-0.5px_1px_0px_rgba(255,255,255,0.2),inset_0px_3px_3px_0px_rgba(128,128,128,0.18),inset_0px_3px_3px_0px_rgba(0,0,0,0.15)]" />
    </div>
  );
}
import { SelectionPlus } from "@phosphor-icons/react";

export default function Shortcuts() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-[40px] h-[40px] rounded-[8px] bg-[#dcf0ff]">
          <SelectionPlus size={20} weight="duotone" className="text-[#28415C]" />
        </div>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 400,
            letterSpacing: -0.5,
            color: "#122232",
          }}
        >
          Atalho
        </h1>
      </div>

      {/* Placeholder content */}
      <div className="flex items-center justify-center h-[300px] rounded-[16px] border border-dashed border-[#C8CFDB] text-[#98989d]">
        <p style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.3 }}>
          Atalhos em breve
        </p>
      </div>
    </div>
  );
}

export { Shortcuts };

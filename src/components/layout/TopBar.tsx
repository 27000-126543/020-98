import { UserRound, Stethoscope, LogOut } from 'lucide-react';

export const TopBar = () => {
  return (
    <header className="no-print h-14 bg-primary-800 text-white flex items-center justify-between px-6 border-b border-primary-900 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md bg-accent-500 flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-[15px] font-semibold leading-tight">
            口腔咬合评估工作台
          </div>
          <div className="text-[11px] text-primary-300 leading-tight">
            Occlusal Assessment Workbench
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-primary-100">
          <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center">
            <UserRound className="w-4.5 h-4.5" />
          </div>
          <div className="leading-tight">
            <div className="text-white font-medium text-[13px]">李医生</div>
            <div className="text-[11px] text-primary-300">修复科 · 主治医师</div>
          </div>
        </div>
        <button className="p-2 rounded-md hover:bg-primary-700 transition-colors text-primary-200 hover:text-white">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

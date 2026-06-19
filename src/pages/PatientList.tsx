import { useMemo, useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { usePatientStore } from '@/store/usePatientStore';
import { PatientCard } from '@/components/patient/PatientCard';
import { NewPatientModal } from '@/components/patient/NewPatientModal';
import { AssessmentStatus, CaseType, ASSESSMENT_STATUS_LABEL, CASE_TYPE_LABEL } from '@/types';

export const PatientList = () => {
  const patients = usePatientStore((s) => s.patients);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AssessmentStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | CaseType>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      if (keyword && !p.name.includes(keyword) && !p.id.includes(keyword))
        return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (typeFilter !== 'all' && p.caseType !== typeFilter) return false;
      return true;
    });
  }, [patients, keyword, statusFilter, typeFilter]);

  return (
    <div className="h-full flex flex-col bg-ink-50">
      <div className="px-8 pt-6 pb-4 no-print">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-ink-800">病例列表</h1>
            <p className="text-sm text-ink-500 mt-0.5">
              共 {patients.length} 个病例 · 点击卡片进入评估详情
            </p>
          </div>
          <button className="btn-accent" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            新建病例
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              className="input pl-9"
              placeholder="搜索患者姓名或编号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-ink-500" />
            <select
              className="input w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">全部状态</option>
              {(Object.keys(ASSESSMENT_STATUS_LABEL) as AssessmentStatus[]).map(
                (k) => (
                  <option key={k} value={k}>
                    {ASSESSMENT_STATUS_LABEL[k]}
                  </option>
                ),
              )}
            </select>
            <select
              className="input w-auto"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
            >
              <option value="all">全部类型</option>
              {(Object.keys(CASE_TYPE_LABEL) as CaseType[]).map((k) => (
                <option key={k} value={k}>
                  {CASE_TYPE_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-8 pb-8">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20">
            <div className="w-16 h-16 rounded-full bg-ink-100 flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-ink-400" />
            </div>
            <p className="text-sm text-ink-500">没有匹配的病例</p>
            <button
              className="btn-outline btn-sm mt-4"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              新建第一个病例
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-fade-in-up">
            {filtered.map((p) => (
              <PatientCard key={p.id} patient={p} />
            ))}
          </div>
        )}
      </div>

      <NewPatientModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

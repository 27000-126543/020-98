import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CaseType, CASE_TYPE_LABEL } from '@/types';
import { usePatientStore } from '@/store/usePatientStore';
import { useUIStore } from '@/store/useUIStore';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const NewPatientModal = ({ open, onClose }: Props) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<string>('');
  const [caseType, setCaseType] = useState<CaseType>('implant-full');
  const addPatient = usePatientStore((s) => s.addPatient);
  const showToast = useUIStore((s) => s.showToast);
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!name.trim()) {
      showToast('warning', '请填写患者姓名');
      return;
    }
    const ageNum = parseInt(age, 10);
    if (!ageNum || ageNum < 1 || ageNum > 120) {
      showToast('warning', '请填写有效年龄');
      return;
    }
    const patient = addPatient({
      name: name.trim(),
      gender,
      age: ageNum,
      caseType,
    });
    showToast('success', `已创建病例：${patient.name}`);
    onClose();
    setName('');
    setAge('');
    setGender('male');
    setCaseType('implant-full');
    navigate(`/patients/${patient.id}/assessment`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="新建评估病例"
      footer={
        <>
          <button className="btn-outline btn-sm" onClick={onClose}>
            取消
          </button>
          <button className="btn-accent btn-sm" onClick={handleSubmit}>
            创建并开始评估
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">患者姓名</label>
          <input
            className="input"
            placeholder="请输入患者姓名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">性别</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`flex-1 py-2 rounded-md text-sm border transition-colors ${
                  gender === 'male'
                    ? 'bg-accent-500 text-white border-accent-500'
                    : 'bg-white text-ink-700 border-ink-200 hover:border-accent-300'
                }`}
              >
                男
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`flex-1 py-2 rounded-md text-sm border transition-colors ${
                  gender === 'female'
                    ? 'bg-accent-500 text-white border-accent-500'
                    : 'bg-white text-ink-700 border-ink-200 hover:border-accent-300'
                }`}
              >
                女
              </button>
            </div>
          </div>
          <div>
            <label className="label">年龄</label>
            <input
              className="input"
              type="number"
              min={1}
              max={120}
              placeholder="岁"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">病例类型</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(CASE_TYPE_LABEL) as CaseType[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setCaseType(k)}
                className={`py-2 rounded-md text-sm border transition-colors ${
                  caseType === k
                    ? 'bg-primary-800 text-white border-primary-800'
                    : 'bg-white text-ink-700 border-ink-200 hover:border-primary-300'
                }`}
              >
                {CASE_TYPE_LABEL[k]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

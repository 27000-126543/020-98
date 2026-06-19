import { useState } from 'react';
import {
  X,
  Upload,
  UserPlus,
  FileImage,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  CaseType,
  CASE_TYPE_LABEL,
  SectionKey,
  SECTION_LABEL,
  SECTION_HINT,
} from '@/types';
import { usePatientStore } from '@/store/usePatientStore';
import { useUIStore } from '@/store/useUIStore';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface SectionImageUpload {
  files: File[];
  previews: string[];
}

const CASE_TYPE_OPTIONS: Array<{ value: CaseType; label: string; desc: string }> = [
  { value: 'implant-full', label: '种植全口', desc: '全口种植修复病例' },
  { value: 'removable-denture', label: '活动义齿', desc: '可摘局部义齿或全口义齿' },
  { value: 'severe-wear', label: '重度磨耗', desc: '牙齿磨耗严重需咬合重建' },
];

const SECTION_UPLOAD_CONFIG: Array<{
  key: SectionKey;
  label: string;
  hint: string;
  examples: string[];
}> = [
  {
    key: 'centric-relation',
    label: '正中关系',
    hint: SECTION_HINT['centric-relation'],
    examples: ['口内咬合照', '咬合纸痕迹照', '石膏模型照', '蜡堤记录'],
  },
  {
    key: 'vertical-dimension',
    label: '垂直距离',
    hint: SECTION_HINT['vertical-dimension'],
    examples: ['面部正面照', '面部侧面照', '息止颌位照'],
  },
  {
    key: 'overjet-overbite',
    label: '覆盖覆合',
    hint: SECTION_HINT['overjet-overbite'],
    examples: ['侧面咬合照', '咬合正面照', '覆合覆盖照'],
  },
  {
    key: 'deviation',
    label: '偏斜情况',
    hint: SECTION_HINT['deviation'],
    examples: ['中线对比照', '正面咬合照', '开口型记录'],
  },
];

export const BatchImportModal = ({ isOpen, onClose }: Props) => {
  const navigate = useNavigate();
  const importPatientWithImages = usePatientStore(
    (s) => s.importPatientWithImages,
  );
  const showToast = useUIStore((s) => s.showToast);

  const [step, setStep] = useState<'info' | 'images'>('info');
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male' as 'male' | 'female',
    age: '',
    caseType: 'implant-full' as CaseType,
  });
  const [sectionImages, setSectionImages] = useState<
    Record<SectionKey, SectionImageUpload>
  >({
    'centric-relation': { files: [], previews: [] },
    'vertical-dimension': { files: [], previews: [] },
    'overjet-overbite': { files: [], previews: [] },
    deviation: { files: [], previews: [] },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setStep('info');
    setFormData({
      name: '',
      gender: 'male',
      age: '',
      caseType: 'implant-full',
    });
    setSectionImages({
      'centric-relation': { files: [], previews: [] },
      'vertical-dimension': { files: [], previews: [] },
      'overjet-overbite': { files: [], previews: [] },
      deviation: { files: [], previews: [] },
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileSelect = async (
    sectionKey: SectionKey,
    files: FileList | null,
  ) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    const newPreviews: string[] = [];
    for (const file of newFiles) {
      const url = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      newPreviews.push(url);
    }
    setSectionImages((prev) => ({
      ...prev,
      [sectionKey]: {
        files: [...prev[sectionKey].files, ...newFiles],
        previews: [...prev[sectionKey].previews, ...newPreviews],
      },
    }));
  };

  const removeFile = (sectionKey: SectionKey, index: number) => {
    setSectionImages((prev) => ({
      ...prev,
      [sectionKey]: {
        files: prev[sectionKey].files.filter((_, i) => i !== index),
        previews: prev[sectionKey].previews.filter((_, i) => i !== index),
      },
    }));
  };

  const totalImages = Object.values(sectionImages).reduce(
    (sum, s) => sum + s.files.length,
    0,
  );

  const canProceedToImages =
    formData.name.trim() &&
    formData.age &&
    parseInt(formData.age) > 0 &&
    parseInt(formData.age) < 120;

  const canSubmit = totalImages > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const sectionImagesData: Record<
        SectionKey,
        Array<{ url: string; name: string }>
      > = {
        'centric-relation': [],
        'vertical-dimension': [],
        'overjet-overbite': [],
        deviation: [],
      };
      (Object.keys(sectionImages) as SectionKey[]).forEach((key) => {
        sectionImages[key].files.forEach((file, i) => {
          sectionImagesData[key].push({
            url: sectionImages[key].previews[i],
            name: file.name,
          });
        });
      });
      const newPatientId = await importPatientWithImages({
        name: formData.name.trim(),
        gender: formData.gender,
        age: parseInt(formData.age),
        caseType: formData.caseType,
        sectionImages: sectionImagesData,
      });
      showToast(
        'success',
        `已成功导入病例 ${formData.name}，共 ${totalImages} 张图像`,
      );
      handleClose();
      navigate(`/patients/${newPatientId}/assessment`);
    } catch (e) {
      showToast('error', '导入失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink-800">
                批量导入病例资料
              </h2>
              <p className="text-xs text-ink-500">
                录入患者基本信息并按分区上传图像资料
              </p>
            </div>
          </div>
          <button
            className="p-1.5 rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-600 transition-colors"
            onClick={handleClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 bg-ink-50 border-b border-ink-100 shrink-0">
          <div className="flex items-center gap-4">
            {[{ n: 1, t: '患者信息' }, { n: 2, t: '图像上传' }].map(
              ({ n, t }, i) => (
                <div key={n} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      step === (i === 0 ? 'info' : 'images')
                        ? 'bg-primary-500 text-white'
                        : i === 0 || step === 'images'
                          ? 'bg-accent-500 text-white'
                          : 'bg-ink-200 text-ink-500'
                    }`}
                  >
                    {i === 0 || step === 'images' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      n
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step === (i === 0 ? 'info' : 'images')
                        ? 'text-ink-800'
                        : 'text-ink-500'
                    }`}
                  >
                    {t}
                  </span>
                  {i < 1 && (
                    <div className="w-12 h-0.5 bg-ink-200" />
                  )}
                </div>
              ),
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {step === 'info' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary-500 rounded-full" />
                  基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-ink-600 mb-1.5 font-medium">
                      患者姓名 <span className="text-danger-500">*</span>
                    </label>
                    <input
                      className="input w-full"
                      placeholder="请输入患者姓名"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-600 mb-1.5 font-medium">
                      年龄 <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="input w-full"
                      placeholder="请输入年龄"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-600 mb-1.5 font-medium">
                      性别 <span className="text-danger-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                          formData.gender === 'male'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-ink-200 text-ink-600 hover:border-ink-300'
                        }`}
                        onClick={() =>
                          setFormData({ ...formData, gender: 'male' })
                        }
                      >
                        男
                      </button>
                      <button
                        className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                          formData.gender === 'female'
                            ? 'border-accent-500 bg-accent-50 text-accent-700'
                            : 'border-ink-200 text-ink-600 hover:border-ink-300'
                        }`}
                        onClick={() =>
                          setFormData({ ...formData, gender: 'female' })
                        }
                      >
                        女
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-ink-600 mb-1.5 font-medium">
                      病例类型 <span className="text-danger-500">*</span>
                    </label>
                    <select
                      className="input w-full"
                      value={formData.caseType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          caseType: e.target.value as CaseType,
                        })
                      }
                    >
                      {CASE_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-accent-500 rounded-full" />
                  病例类型说明
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {CASE_TYPE_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        formData.caseType === opt.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-ink-100 hover:border-ink-200'
                      }`}
                      onClick={() =>
                        setFormData({ ...formData, caseType: opt.value })
                      }
                    >
                      <p className="text-sm font-semibold text-ink-800 mb-0.5">
                        {opt.label}
                      </p>
                      <p className="text-xs text-ink-500 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-accent-50 border border-accent-100">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-accent-800">
                      下一步将按分区上传图像
                    </p>
                    <p className="text-xs text-accent-700 mt-0.5">
                      系统将根据分区自动归类口内照、面像照、咬合纸照片等资料
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'images' && (
            <div className="space-y-6">
              {SECTION_UPLOAD_CONFIG.map((section) => (
                <div
                  key={section.key}
                  className="border-2 border-dashed border-ink-200 rounded-xl p-4 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-ink-800">
                        {section.label}
                      </h4>
                      <p className="text-xs text-ink-500 mt-0.5">
                        {section.hint}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {section.examples.map((ex) => (
                          <span
                            key={ex}
                            className="text-[10px] px-2 py-0.5 bg-ink-100 text-ink-600 rounded-full"
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold font-mono text-ink-800">
                        {sectionImages[section.key].files.length}
                      </p>
                      <p className="text-[10px] text-ink-500">张</p>
                    </div>
                  </div>

                  {sectionImages[section.key].previews.length > 0 && (
                    <div className="grid grid-cols-6 gap-2 mb-3">
                      {sectionImages[section.key].previews.map(
                        (preview, i) => (
                          <div
                            key={i}
                            className="relative aspect-square rounded-lg overflow-hidden bg-ink-100 group"
                          >
                            <img
                              src={preview}
                              alt={`Preview ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              onClick={() => removeFile(section.key, i)}
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-1 left-1 text-[10px] font-mono text-white bg-black/60 px-1.5 py-0.5 rounded">
                              {i + 1}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  <label className="block">
                    <div className="flex items-center justify-center gap-2 py-3 rounded-lg border border-ink-200 border-dashed cursor-pointer hover:bg-ink-50 transition-colors">
                      <Upload className="w-4 h-4 text-ink-400" />
                      <span className="text-xs text-ink-600">
                        点击或拖拽上传图像到
                        <span className="font-medium text-primary-600 mx-1">
                          {section.label}
                        </span>
                        分区
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) =>
                        handleFileSelect(section.key, e.target.files)
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-ink-100 bg-ink-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileImage className="w-4 h-4 text-ink-500" />
            <span className="text-sm text-ink-600">
              {step === 'info' ? (
                <span>
                  已填写{' '}
                  {canProceedToImages ? (
                    <span className="text-accent-600 font-medium">
                      完整信息 ✓
                    </span>
                  ) : (
                    <span className="text-ink-400">信息不完整</span>
                  )}
                </span>
              ) : (
                <span>
                  已选择{' '}
                  <span className="font-semibold text-primary-600">
                    {totalImages}
                  </span>{' '}
                  张图像
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-outline btn-sm" onClick={handleClose}>
              取消
            </button>
            {step === 'images' && (
              <button
                className="btn-outline btn-sm"
                onClick={() => setStep('info')}
              >
                上一步
              </button>
            )}
            {step === 'info' ? (
              <button
                className="btn-primary btn-sm"
                disabled={!canProceedToImages}
                onClick={() => setStep('images')}
              >
                下一步：上传图像
              </button>
            ) : (
              <button
                className="btn-accent btn-sm"
                disabled={!canSubmit || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? '导入中...' : '确认导入并开始评估'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

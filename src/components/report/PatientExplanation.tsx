import { useState } from 'react';
import { Edit3, Check, Copy, FileText } from 'lucide-react';

interface Props {
  initialText: string;
  onChange: (text: string) => void;
}

export const PatientExplanation = ({ initialText, onChange }: Props) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initialText);
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    onChange(text);
    setEditing(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="card">
      <div className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between bg-ink-50/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-ink-800">患者沟通说明</h3>
          <span className="text-[11px] text-ink-500">
            可直接打印作为告知书附于病历
          </span>
        </div>
        <div className="flex items-center gap-1 no-print">
          <button
            className="btn-outline btn-sm"
            onClick={handleCopy}
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? '已复制' : '复制文本'}
          </button>
          {editing ? (
            <button className="btn-accent btn-sm" onClick={handleSave}>
              <Check className="w-3.5 h-3.5" /> 保存修改
            </button>
          ) : (
            <button
              className="btn-outline btn-sm"
              onClick={() => setEditing(true)}
            >
              <Edit3 className="w-3.5 h-3.5" /> 编辑
            </button>
          )}
        </div>
      </div>
      <div className="p-5">
        {editing ? (
          <textarea
            className="textarea min-h-[240px] text-sm leading-relaxed"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <div className="text-sm leading-7 text-ink-700 whitespace-pre-wrap min-h-[200px]">
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

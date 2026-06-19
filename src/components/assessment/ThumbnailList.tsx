import { Plus, X, ImagePlus, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { SectionImage } from '@/types';

interface Props {
  images: SectionImage[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onUpload: (files: FileList) => void;
  onRemove: (id: string) => void;
}

export const ThumbnailList = ({
  images,
  activeId,
  onSelect,
  onUpload,
  onRemove,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="no-print w-24 bg-ink-800 flex flex-col h-full p-2 gap-2 overflow-y-auto scrollbar-thin">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full aspect-square rounded-md border-2 border-dashed border-ink-600 text-ink-400 hover:border-accent-400 hover:text-accent-400 transition-colors flex flex-col items-center justify-center gap-1"
      >
        <ImagePlus className="w-5 h-5" />
        <span className="text-[10px]">添加图像</span>
      </button>
      {images.length === 0 && (
        <div className="text-[10px] text-ink-500 text-center px-1 leading-tight mt-1">
          支持口内照、面像、咬合纸照片等
        </div>
      )}
      {images.map((img, idx) => (
        <div
          key={img.id}
          className={`group relative w-full aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
            activeId === img.id
              ? 'border-accent-400 ring-2 ring-accent-400/40'
              : 'border-transparent hover:border-ink-500'
          }`}
          onClick={() => onSelect(img.id)}
        >
          <img
            src={img.url}
            alt={img.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute top-1 left-1 w-4 h-4 rounded bg-black/60 text-white text-[10px] flex items-center justify-center font-mono">
            {idx + 1}
          </div>
          <button
            className="absolute top-1 right-1 w-4 h-4 rounded bg-danger-500/90 text-white items-center justify-center hidden group-hover:flex"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(img.id);
            }}
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

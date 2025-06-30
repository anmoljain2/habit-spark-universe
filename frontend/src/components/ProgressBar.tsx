
interface ProgressBarProps {
  current: number;
  max: number;
  label: string;
  color?: string;
  showNumbers?: boolean;
}

const ProgressBar = ({ current, max, label, color = '#8B5CF6', showNumbers = true }: ProgressBarProps) => {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showNumbers && (
          <span className="text-sm text-gray-500">{current}/{max}</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r h-3 rounded-full transition-all duration-500 ease-out relative"
          style={{
            width: `${percentage}%`,
            backgroundImage: `linear-gradient(90deg, ${color}, ${color}dd)`
          }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;

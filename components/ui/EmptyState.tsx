import { Package, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        {icon || <Package className="text-slate-400" size={32} />}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      {description && (
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          <RefreshCw size={16} />
          {action.label}
        </button>
      )}
    </div>
  );
}

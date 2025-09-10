import { LucideIcon } from "lucide-react";

interface InventoryCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  status: 'online' | 'warning' | 'offline';
  testId?: string;
}

export function InventoryCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  iconColor, 
  status,
  testId 
}: InventoryCardProps) {
  return (
    <div className="inventory-card p-6 rounded-xl border border-border" data-testid={testId}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${iconColor}/10 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} data-testid={`${testId}-icon`} />
        </div>
        <div className={`status-indicator ${status}`} data-testid={`${testId}-status`}></div>
      </div>
      <h3 className="text-lg font-semibold mb-1" data-testid={`${testId}-title`}>{title}</h3>
      <p className="text-2xl font-bold mb-2" data-testid={`${testId}-value`}>{value}</p>
      <p className="text-sm text-muted-foreground" data-testid={`${testId}-description`}>{description}</p>
    </div>
  );
}

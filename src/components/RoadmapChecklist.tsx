import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Plus, X, CheckCircle2 } from 'lucide-react';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface RoadmapChecklistProps {
  items: ChecklistItem[];
  onItemsUpdate: (items: ChecklistItem[]) => void;
  disabled?: boolean;
}

export default function RoadmapChecklist({ items, onItemsUpdate, disabled = false }: RoadmapChecklistProps) {
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleItem = (itemId: string) => {
    if (disabled) return;
    
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onItemsUpdate(updatedItems);
  };

  const handleAddItem = () => {
    if (!newItemText.trim() || disabled) return;

    const newItem: ChecklistItem = {
      id: `check-${Date.now()}`,
      text: newItemText.trim(),
      completed: false
    };

    onItemsUpdate([...items, newItem]);
    setNewItemText('');
    setIsAdding(false);
  };

  const handleRemoveItem = (itemId: string) => {
    if (disabled) return;
    const updatedItems = items.filter(item => item.id !== itemId);
    onItemsUpdate(updatedItems);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewItemText('');
    }
  };

  return (
    <Card className="tech-card border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base">Checklist</CardTitle>
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {completedCount}/{totalCount}
              </span>
              {progressPercentage === 100 && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 space-y-3">
        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="space-y-1">
            <Progress value={progressPercentage} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {progressPercentage}% complete
            </p>
          </div>
        )}

        {/* Checklist items */}
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 sm:gap-3 group p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={item.id}
                checked={item.completed}
                onCheckedChange={() => handleToggleItem(item.id)}
                disabled={disabled}
                className="mt-0.5"
              />
              <label
                htmlFor={item.id}
                className={`flex-1 text-xs sm:text-sm cursor-pointer ${
                  item.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                }`}
              >
                {item.text}
              </label>
              {!disabled && (
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                  aria-label="Remove item"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new item */}
        {!disabled && (
          <div className="pt-2">
            {isAdding ? (
              <div className="flex gap-2">
                <Input
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter checklist item..."
                  className="text-xs sm:text-sm h-8 sm:h-9"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleAddItem}
                  disabled={!newItemText.trim()}
                  className="h-8 sm:h-9"
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAdding(false);
                    setNewItemText('');
                  }}
                  className="h-8 sm:h-9"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
                className="w-full text-xs sm:text-sm h-8 sm:h-9"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Add Checklist Item
              </Button>
            )}
          </div>
        )}

        {!disabled && totalCount === 0 && !isAdding && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No checklist items yet. Click to add your first task.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

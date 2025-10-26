import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export interface FormFieldConfig {
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature';
  name: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface FormFieldEditorProps {
  open: boolean;
  onClose: () => void;
  onAddField: (field: FormFieldConfig) => void;
}

export const FormFieldEditor = ({ open, onClose, onAddField }: FormFieldEditorProps) => {
  const [fieldType, setFieldType] = useState<FormFieldConfig['type']>('text');
  const [fieldName, setFieldName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [required, setRequired] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const [options, setOptions] = useState('');

  const handleSubmit = () => {
    if (!fieldName || !fieldLabel) {
      toast.error('Field name and label are required');
      return;
    }

    const field: FormFieldConfig = {
      type: fieldType,
      name: fieldName,
      label: fieldLabel,
      required,
      placeholder: placeholder || undefined,
      options: fieldType === 'dropdown' || fieldType === 'radio' 
        ? options.split(',').map(opt => opt.trim()).filter(Boolean)
        : undefined,
    };

    onAddField(field);
    resetForm();
    onClose();
    toast.success('Form field added to canvas');
  };

  const resetForm = () => {
    setFieldType('text');
    setFieldName('');
    setFieldLabel('');
    setRequired(false);
    setPlaceholder('');
    setOptions('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Form Field</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fieldType">Field Type</Label>
            <Select value={fieldType} onValueChange={(value: any) => setFieldType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Input</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="radio">Radio Button</SelectItem>
                <SelectItem value="dropdown">Dropdown</SelectItem>
                <SelectItem value="signature">Signature Field</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fieldName">Field Name (ID)</Label>
            <Input
              id="fieldName"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="e.g., fullName, email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fieldLabel">Field Label</Label>
            <Input
              id="fieldLabel"
              value={fieldLabel}
              onChange={(e) => setFieldLabel(e.target.value)}
              placeholder="e.g., Full Name, Email Address"
            />
          </div>

          {fieldType === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder Text</Label>
              <Input
                id="placeholder"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="Enter placeholder..."
              />
            </div>
          )}

          {(fieldType === 'dropdown' || fieldType === 'radio') && (
            <div className="space-y-2">
              <Label htmlFor="options">Options (comma-separated)</Label>
              <Input
                id="options"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="Option 1, Option 2, Option 3"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={required}
              onCheckedChange={(checked) => setRequired(checked as boolean)}
            />
            <Label htmlFor="required" className="cursor-pointer">
              Required field
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Field
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
